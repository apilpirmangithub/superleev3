import { 
  IAgent, 
  AgentConfig, 
  AgentContext, 
  AgentParseResult, 
  AgentIntent, 
  ExecutionResult, 
  AgentHelp 
} from "@/types/agents";

/**
 * Abstract base class for all agents
 * Provides common functionality and enforces interface
 */
export abstract class BaseAgent implements IAgent {
  public readonly config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  // ===== Abstract Methods (must be implemented by subclasses) =====
  
  abstract canHandle(prompt: string, context?: AgentContext): boolean;
  abstract parse(prompt: string, context?: AgentContext): Promise<AgentParseResult>;
  abstract execute(intent: AgentIntent, context?: AgentContext): Promise<ExecutionResult>;
  abstract getHelp(): AgentHelp;

  // ===== Common Helper Methods =====

  /**
   * Check if prompt contains any of the agent's trigger words
   */
  protected hasTrigger(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase();
    return this.config.triggers.some(trigger => 
      lowerPrompt.includes(trigger.toLowerCase())
    );
  }

  /**
   * Extract numeric value from text (handles commas as decimal separators)
   */
  protected extractNumber(text: string): number | null {
    const match = text.match(/(\d[\d.,]*)/);
    if (!match) return null;
    
    const cleanNumber = match[1].replace(/,/g, ".");
    const parsed = parseFloat(cleanNumber);
    
    return isFinite(parsed) ? parsed : null;
  }

  /**
   * Extract percentage value from text
   */
  protected extractPercentage(text: string): number | null {
    const match = text.match(/(slip(?:page|ag[ei])?|slippage)\s*([0-9]+(?:[.,][0-9]+)?)\s*%?/i);
    if (!match) return null;
    
    return this.extractNumber(match[2]);
  }

  /**
   * Check if user is connected and on correct chain
   */
  protected validateConnection(context?: AgentContext): { valid: boolean; reason?: string } {
    if (!context?.userAddress) {
      return { valid: false, reason: "Please connect your wallet first" };
    }

    if (context.chainId !== 1315) { // Story Aeneid testnet
      return { valid: false, reason: "Please switch to Story Aeneid testnet (Chain ID: 1315)" };
    }

    return { valid: true };
  }

  /**
   * Create standardized error result
   */
  protected createErrorResult(reason: string): AgentParseResult {
    return {
      type: "failure",
      reason,
      agent: this.config.name
    };
  }

  /**
   * Create standardized need-info result
   */
  protected createNeedInfoResult(question: string, suggestions?: string[]): AgentParseResult {
    return {
      type: "need_info",
      question,
      suggestions,
      agent: this.config.name
    };
  }

  /**
   * Create standardized success result
   */
  protected createSuccessResult(intent: AgentIntent, plan: string[]): AgentParseResult {
    return {
      type: "success",
      intent,
      plan,
      agent: this.config.name
    };
  }

  /**
   * Create standardized execution success
   */
  protected createExecutionSuccess(
    message: string, 
    data?: any, 
    txHash?: string,
    explorerUrl?: string
  ): ExecutionResult {
    return {
      type: "success",
      message,
      data,
      txHash,
      explorerUrl
    };
  }

  /**
   * Create standardized execution failure
   */
  protected createExecutionFailure(error: string, details?: any): ExecutionResult {
    return {
      type: "failure",
      error,
      details
    };
  }

  // ===== Getters =====

  get name(): string {
    return this.config.name;
  }

  get description(): string {
    return this.config.description;
  }

  get priority(): number {
    return this.config.priority;
  }

  get triggers(): string[] {
    return this.config.triggers;
  }
}
