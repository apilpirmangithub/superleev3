import { useState, useCallback } from "react";
import { parseUnits } from "viem";
import {
  getDecimals,
  getQuote,
  approveForAggregator,
  swapViaAggregator,
} from "@/lib/piperx";
import type { SwapIntent } from "@/lib/agent/engine";
import type { SwapState } from "@/types/agents";

export function useSwapAgent() {
  const [swapState, setSwapState] = useState<SwapState>({
    quote: null,
    status: 'idle',
    error: null,
  });

  const executeSwap = useCallback(async (intent: SwapIntent) => {
    try {
      // Reset state
      setSwapState({
        quote: null,
        status: 'quoting',
        error: null,
      });

      // 1. Get token decimals and prepare amount
      const decimals = await getDecimals(intent.tokenIn as `0x${string}`);
      const amountRaw = parseUnits(String(intent.amount), decimals);

      // 2. Get quote from aggregator
      const quote = await getQuote({
        tokenIn: intent.tokenIn,
        tokenOut: intent.tokenOut,
        amountInRaw: amountRaw.toString(),
        slippagePct: intent.slippagePct,
      });

      setSwapState(prev => ({
        ...prev,
        quote,
        status: 'approving'
      }));

      // 3. Approve token for aggregator
      await approveForAggregator(intent.tokenIn as `0x${string}`, amountRaw);

      setSwapState(prev => ({
        ...prev,
        status: 'swapping'
      }));

      // 4. Execute swap
      const tx = await swapViaAggregator(quote.universalRoutes);

      setSwapState(prev => ({
        ...prev,
        status: 'success',
        txHash: tx.hash
      }));

      return {
        success: true,
        txHash: tx.hash,
        quote
      };

    } catch (error: any) {
      setSwapState(prev => ({
        ...prev,
        status: 'error',
        error
      }));

      return {
        success: false,
        error: error?.message || String(error)
      };
    }
  }, []);

  const resetSwap = useCallback(() => {
    setSwapState({
      quote: null,
      status: 'idle',
      error: null,
    });
  }, []);

  return {
    swapState,
    executeSwap,
    resetSwap,
  };
}
