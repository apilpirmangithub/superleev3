import type { SwapIntent, RegisterIntent } from "@/lib/agent/engine";

// Message types for chat
export type Message = {
  role: "you" | "agent";
  text: string;
  ts: number;
};

// Plan types - using discriminated unions
export type SwapPlan = {
  type: "swap";
  steps: string[];
  intent: SwapIntent;
};

export type RegisterPlan = {
  type: "register";
  steps: string[];
  intent: RegisterIntent;
};

export type Plan = SwapPlan | RegisterPlan;

// Swap agent state
export type SwapState = {
  quote: any | null;
  status: 'idle' | 'quoting' | 'approving' | 'swapping' | 'success' | 'error';
  error: any | null;
  txHash?: string;
};

// Register IP agent state
export type RegisterState = {
  status: 'idle' | 'compressing' | 'uploading-image' | 'creating-metadata' | 'uploading-metadata' | 'minting' | 'success' | 'error';
  progress: number;
  error: any | null;
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
