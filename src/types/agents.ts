import type { SwapIntent, RegisterIntent } from "@/lib/agent/engine";

// Error types
export type AgentError = {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
};

export type QuoteData = {
  amountIn: string;
  amountOut: string;
  route: Array<{
    token: string;
    symbol: string;
  }>;
  priceImpact: string;
  gasEstimate: string;
};

// Message types for chat
export type Message = {
  role: "you" | "agent";
  text: string;
  ts: number;
};

// Plan types
export type Plan = {
  type: "swap" | "register";
  steps: string[];
  intent: SwapIntent | RegisterIntent;
};

// Swap agent state
export type SwapState = {
  quote: QuoteData | null;
  status: 'idle' | 'quoting' | 'approving' | 'swapping' | 'success' | 'error';
  error: AgentError | null;
  txHash?: string;
};

// Register IP agent state
export type RegisterState = {
  status: 'idle' | 'compressing' | 'uploading-image' | 'creating-metadata' | 'uploading-metadata' | 'minting' | 'success' | 'error';
  progress: number;
  error: AgentError | null;
  ipId?: string;
  txHash?: string;
};

// File upload state
export type FileUploadState = {
  file: File | null;
  previewUrl: string | null;
  uploading: boolean;
};

// Chat agent state
export type ChatState = {
  messages: Message[];
  currentPlan: Plan | null;
  status: string;
};
