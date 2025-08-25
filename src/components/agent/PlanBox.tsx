import React from "react";
import { Check, X } from "lucide-react";
import type { Plan, SwapState, RegisterState } from "@/types/agents";

interface PlanBoxProps {
  plan: Plan;
  onConfirm: () => void;
  onCancel: () => void;
  swapState?: SwapState;
  registerState?: RegisterState;
}

export function PlanBox({ plan, onConfirm, onCancel, swapState, registerState }: PlanBoxProps) {
  const isExecuting = 
    (plan.type === "swap" && swapState?.status !== 'idle' && swapState?.status !== 'error') ||
    (plan.type === "register" && registerState?.status !== 'idle' && registerState?.status !== 'error');

  const getStatusText = () => {
    if (plan.type === "swap" && swapState) {
      switch (swapState.status) {
        case 'quoting': return "Getting quote...";
        case 'approving': return "Approving token...";
        case 'swapping': return "Executing swap...";
        case 'success': return "Swap completed!";
        case 'error': return "Swap failed";
        default: return "";
      }
    }
    
    if (plan.type === "register" && registerState) {
      switch (registerState.status) {
        case 'compressing': return "Compressing image...";
        case 'uploading-image': return "Uploading to IPFS...";
        case 'creating-metadata': return "Creating metadata...";
        case 'uploading-metadata': return "Uploading metadata...";
        case 'minting': return "Minting NFT & registering IP...";
        case 'success': return "IP registered successfully!";
        case 'error': return "Registration failed";
        default: return "";
      }
    }
    
    return "";
  };

  const getProgressPercent = () => {
    if (plan.type === "register" && registerState) {
      return registerState.progress;
    }
    
    if (plan.type === "swap" && swapState) {
      switch (swapState.status) {
        case 'quoting': return 25;
        case 'approving': return 50;
        case 'swapping': return 75;
        case 'success': return 100;
        default: return 0;
      }
    }
    
    return 0;
  };

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="space-y-1 text-sm">
        {plan.steps.map((step, index) => (
          <div key={index}>{step}</div>
        ))}
      </div>

      {/* Progress indicator */}
      {isExecuting && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="opacity-70">{getStatusText()}</span>
            <span className="opacity-70">{getProgressPercent()}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div 
              className="bg-sky-400 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <button
          className="rounded-2xl bg-sky-500/90 hover:bg-sky-400 text-white px-4 py-2 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onConfirm}
          disabled={isExecuting}
        >
          <Check className="h-4 w-4" />
          {isExecuting ? "Executing..." : "Confirm"}
        </button>
        
        <button
          className="rounded-2xl border border-white/10 px-4 py-2 inline-flex items-center gap-2 hover:bg-white/5 disabled:opacity-50"
          onClick={onCancel}
          disabled={isExecuting}
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>

      {/* Error display */}
      {((swapState?.status === 'error' && swapState.error) || 
        (registerState?.status === 'error' && registerState.error)) && (
        <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          Error: {swapState?.error?.message || registerState?.error?.message || "Unknown error"}
        </div>
      )}
    </div>
  );
}
