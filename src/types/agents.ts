// ===== Agent Types =====
export interface AgentConfig {
  name: string;
  description: string;
  triggers: string[];
  priority: number; // lower number = higher priority
}

export interface AgentContext {
  userAddress?: string;
  chainId?: number;
  hasAttachedFile?: boolean;
  attachedFile?: File;
}

// ===== Intent Types =====
export interface BaseIntent {
  kind: string;
  confidence: number; // 0-1, how confident the parser is
}

export interface SwapIntent extends BaseIntent {
  kind: "swap";
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amount: number;
  slippagePct?: number;
}

export interface RegisterIntent extends BaseIntent {
  kind: "register";
  title?: string;
  prompt?: string;
  license?: "by" | "by-nc" | "by-nd" | "by-sa" | "cc0" | "arr";
}

export type AgentIntent = SwapIntent | RegisterIntent;

// ===== Result Types =====
export interface AgentParseSuccess {
  type: "success";
  intent: AgentIntent;
  plan: string[];
  agent: string;
}

export interface AgentParseNeedInfo {
  type: "need_info";
  question: string;
  suggestions?: string[];
  agent: string;
}

export interface AgentParseFailure {
  type: "failure";
  reason: string;
  agent: string;
}

export type AgentParseResult = AgentParseSuccess | AgentParseNeedInfo | AgentParseFailure;

// ===== Execution Types =====
export interface ExecutionSuccess {
  type: "success";
  message: string;
  data?: any;
  txHash?: string;
  explorerUrl?: string;
}

export interface ExecutionFailure {
  type: "failure";
  error: string;
  details?: any;
}

export type ExecutionResult = ExecutionSuccess | ExecutionFailure;

// ===== Base Agent Interface =====
export interface IAgent {
  readonly config: AgentConfig;
  
  // Check if this agent can handle the given prompt
  canHandle(prompt: string, context?: AgentContext): boolean;
  
  // Parse the prompt and return intent + plan
  parse(prompt: string, context?: AgentContext): Promise<AgentParseResult>;
  
  // Execute the intent
  execute(intent: AgentIntent, context?: AgentContext): Promise<ExecutionResult>;
  
  // Get help/examples for this agent
  getHelp(): AgentHelp;
}

// ===== Help System =====
export interface AgentHelp {
  agent: string;
  description: string;
  examples: string[];
  parameters: AgentHelpParam[];
}

export interface AgentHelpParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  examples?: string[];
}

// ===== Orchestrator Types =====
export interface OrchestratorResult {
  type: "handled" | "unknown" | "ambiguous";
  agent?: string;
  result?: AgentParseResult;
  suggestions?: AgentHelp[];
}
