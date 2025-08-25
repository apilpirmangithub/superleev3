"use client";

import { useState } from "react";
import { MessageCircle, Zap } from "lucide-react";

interface ModeSwitcherProps {
  mode: 'chat' | 'simple';
  onChange: (mode: 'chat' | 'simple') => void;
}

export function ModeSwitcher({ mode, onChange }: ModeSwitcherProps) {
  return (
    <div className="flex gap-1 p-1 bg-white/5 rounded-2xl">
      <button
        onClick={() => onChange('chat')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
          ${mode === 'chat' 
            ? 'bg-sky-500 text-white shadow-lg' 
            : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          }
        `}
      >
        <MessageCircle className="h-4 w-4" />
        Chat Mode
      </button>
      
      <button
        onClick={() => onChange('simple')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
          ${mode === 'simple' 
            ? 'bg-sky-500 text-white shadow-lg' 
            : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          }
        `}
      >
        <Zap className="h-4 w-4" />
        Quick Register
      </button>
    </div>
  );
}
