import { BaseAgent } from "./BaseAgent";
import { 
  AgentConfig, 
  AgentContext, 
  AgentParseResult, 
  AgentIntent, 
  SwapIntent,
  ExecutionResult,
  AgentHelp 
} from "@/types/agents";
import { findTokenAddress, symbolFor } from "@/lib/agent/tokens";
import { 
  getDecimals, 
  getQuote, 
  approveForAggregator, 
  swapViaAggregator 
} from "@/lib/piperx";
import { parseUnits } from "viem";

/**
 * Agent for handling token swaps via PiperX Aggregator
 */
export class SwapAgent extends BaseAgent {
  
  constructor() {
    super({
      name: "SwapAgent",
      description: "Handle token swaps via PiperX Aggregator on Story Chain",
      triggers: ["swap", "tukar", "convert", "trade", "exchange"],
      priority: 1
    });
  }

  // ===== Implementation =====

  canHandle(prompt: string, context?: AgentContext): boolean {
    // Check for swap triggers
    if (this.hasTrigger(prompt)) return true;

    // Check for arrow patterns (>, →, ->, to, ke)
    const hasArrow = /(?:>|→|->|\sto\s|\ske\s)/i.test(prompt);
    const hasTokens = /\b(wip|usdc|weth|0x[a-fA-F0-9]{40})\b/i.test(prompt);
    
    return hasArrow && hasTokens;
  }

  async parse(prompt: string, context?: AgentContext): Promise<AgentParseResult> {
    const text = prompt.trim().toLowerCase();

    // Validate connection
    const connectionCheck = this.validateConnection(context);
    if (!connectionCheck.valid) {
      return this.createNeedInfoResult(connectionCheck.reason!);
    }

    // Try main swap pattern: "swap 1 WIP > USDC"
    const mainPattern = this.parseMainSwapPattern(text);
    if (mainPattern) return mainPattern;

    // Try alternative pattern: "WIP > USDC 1.2"
    const altPattern = this.parseAlternativePattern(text);
    if (altPattern) return altPattern;

    // If we detect swap intent but can't parse fully
    if (this.hasTrigger(text) || /(?:>|→|->|\sto\s|\ske\s)/i.test(text)) {
      return this.createNeedInfoResult(
        "Format swap tidak jelas. Gunakan format: 'Swap [amount] [tokenA] > [tokenB]'",
        [
          "Swap 1 WIP > USDC slippage 0.5%",
          "tukar 0.25 ip ke usdc slip 1%",
          "convert 2 WIP → USDC"
        ]
      );
    }

    return this.createErrorResult("This doesn't look like a swap command");
  }

  async execute(intent: AgentIntent, context?: AgentContext): Promise<ExecutionResult> {
    if (intent.kind !== "swap") {
      return this.createExecutionFailure("Invalid intent type for SwapAgent");
    }

    const swapIntent = intent as SwapIntent;

    try {
      // 1. Get quote from PiperX
      const decimals = await getDecimals(swapIntent.tokenIn);
      const amountRaw = parseUnits(String(swapIntent.amount), decimals);
      
      const quote = await getQuote({
        tokenIn: swapIntent.tokenIn,
        tokenOut: swapIntent.tokenOut,
        amountInRaw: amountRaw.toString(),
        slippagePct: swapIntent.slippagePct || 0.5,
      });

      // 2. Approve token if needed
      await approveForAggregator(swapIntent.tokenIn, amountRaw);

      // 3. Execute swap
      const tx = await swapViaAggregator(quote.universalRoutes);

      // 4. Return success result
      const explorerUrl = `https://aeneid.storyscan.xyz/tx/${tx.hash}`;
      
      return this.createExecutionSuccess(
        `✅ Swap berhasil!\n` +
        `From: ${symbolFor(swapIntent.tokenIn)}\n` +
        `To: ${symbolFor(swapIntent.tokenOut)}\n` +
        `Amount: ${swapIntent.amount}\n` +
        `Tx: ${tx.hash}`,
        {
          tokenIn: swapIntent.tokenIn,
          tokenOut: swapIntent.tokenOut,
          amount: swapIntent.amount,
          slippage: swapIntent.slippagePct,
          quote
        },
        tx.hash,
        explorerUrl
      );

    } catch (error: any) {
      return this.createExecutionFailure(
        `Swap gagal: ${error?.message || String(error)}`,
        error
      );
    }
  }

  getHelp(): AgentHelp {
    return {
      agent: this.config.name,
      description: this.config.description,
      examples: [
        "Swap 1 WIP > USDC slippage 0.5%",
        "tukar 0.25 ip ke usdc slip 1%",
        "convert 2 WIP → USDC",
        "exchange 5 0x123...abc -> 0x456...def"
      ],
      parameters: [
        {
          name: "amount",
          type: "number",
          required: true,
          description: "Amount of token to swap",
          examples: ["1", "0.5", "100"]
        },
        {
          name: "tokenIn",
          type: "string",
          required: true,
          description: "Token to sell (symbol or address)",
          examples: ["WIP", "USDC", "0x1514..."]
        },
        {
          name: "tokenOut",
          type: "string", 
          required: true,
          description: "Token to buy (symbol or address)",
          examples: ["USDC", "WIP", "0x1234..."]
        },
        {
          name: "slippage",
          type: "number",
          required: false,
          description: "Maximum slippage tolerance in %",
          examples: ["0.5", "1", "2"]
        }
      ]
    };
  }

  // ===== Private Helpers =====

  private parseMainSwapPattern(text: string): AgentParseResult | null {
    // Pattern: "swap 1 WIP > USDC slippage 0.5%"
    const RE_ADDR = /0x[a-fA-F0-9]{40}/;
    const RE_AMOUNT = /(\d[\d.,]*)/;
    const RE_ARROW = /(?:>|→|->|\sto\s|\ske\s)/i;

    const pattern = new RegExp(
      `(?:swap|tukar|convert|trade|exchange)\\s*${RE_AMOUNT.source}\\s*([a-zA-Z0-9]+|${RE_ADDR.source})\\s*${RE_ARROW.source}\\s*([a-zA-Z0-9]+|${RE_ADDR.source})`,
      "i"
    );

    const match = text.match(pattern);
    if (!match) return null;

    const [, amountStr, rawIn, rawOut] = match;
    return this.buildSwapIntent(amountStr, rawIn, rawOut, text);
  }

  private parseAlternativePattern(text: string): AgentParseResult | null {
    // Pattern: "WIP > USDC 1.2" or "1.2 WIP > USDC"
    const RE_ADDR = /0x[a-fA-F0-9]{40}/;
    const RE_AMOUNT = /(\d[\d.,]*)/;
    const RE_ARROW = /(?:>|→|->|\sto\s|\ske\s)/i;

    // Try: token > token amount
    const pattern1 = new RegExp(
      `([a-zA-Z0-9]+|${RE_ADDR.source})\\s*${RE_ARROW.source}\\s*([a-zA-Z0-9]+|${RE_ADDR.source}).*?${RE_AMOUNT.source}`,
      "i"
    );

    const match1 = text.match(pattern1);
    if (match1) {
      const [, rawIn, rawOut, amountStr] = match1;
      return this.buildSwapIntent(amountStr, rawIn, rawOut, text);
    }

    // Try: amount token > token  
    const pattern2 = new RegExp(
      `${RE_AMOUNT.source}\\s*([a-zA-Z0-9]+|${RE_ADDR.source})\\s*${RE_ARROW.source}\\s*([a-zA-Z0-9]+|${RE_ADDR.source})`,
      "i"
    );

    const match2 = text.match(pattern2);
    if (match2) {
      const [, amountStr, rawIn, rawOut] = match2;
      return this.buildSwapIntent(amountStr, rawIn, rawOut, text);
    }

    return null;
  }

  private buildSwapIntent(
    amountStr: string, 
    rawIn: string, 
    rawOut: string, 
    originalText: string
  ): AgentParseResult {
    const amount = this.extractNumber(amountStr);
    const slippage = this.extractPercentage(originalText);
    
    const tokenInAddr = findTokenAddress(rawIn);
    const tokenOutAddr = findTokenAddress(rawOut);

    // Validate inputs
    if (!amount || amount <= 0) {
      return this.createNeedInfoResult("Jumlah token tidak valid. Masukkan angka positif.");
    }

    if (!tokenInAddr) {
      return this.createNeedInfoResult(
        `Token input "${rawIn}" tidak dikenal. Gunakan symbol (WIP, USDC) atau address (0x...)`
      );
    }

    if (!tokenOutAddr) {
      return this.createNeedInfoResult(
        `Token output "${rawOut}" tidak dikenal. Gunakan symbol (WIP, USDC) atau address (0x...)`
      );
    }

    if (tokenInAddr === tokenOutAddr) {
      return this.createNeedInfoResult("Token input dan output tidak boleh sama.");
    }

    // Build plan
    const plan = [
      `Parse: ${amount} ${symbolFor(tokenInAddr)} → ${symbolFor(tokenOutAddr)}${slippage ? ` (slippage ${slippage}%)` : ""}`,
      "Ambil quote dari PiperX Aggregator", 
      "Approve token input jika diperlukan",
      "Eksekusi swap via Aggregator",
      "Tampilkan hasil transaksi"
    ];

    // Create intent
    const intent: SwapIntent = {
      kind: "swap",
      confidence: 0.9,
      tokenIn: tokenInAddr,
      tokenOut: tokenOutAddr,
      amount,
      slippagePct: slippage
    };

    return this.createSuccessResult(intent, plan);
  }
}
