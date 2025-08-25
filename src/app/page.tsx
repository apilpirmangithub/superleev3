"use client";

import { useState } from "react";
import { EnhancedAgentOrchestrator } from "@/components/agent/EnhancedAgentOrchestrator";
import { SimpleIPRegister } from "@/components/SimpleIPRegister";
import { ModeSwitcher } from "@/components/ModeSwitcher";

export default function Page() {
  const [mode, setMode] = useState<'chat' | 'simple'>('chat');

  return (
    <div className="min-h-screen bg-ai-bg">
      {/* Header with mode switcher */}
      <div className="border-b border-white/10 bg-ai-card backdrop-blur-sm">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Superlee AI Agent</h1>
              <p className="text-white/60 text-sm">
                {mode === 'chat' ? 'Chat-based IP registration' : 'Quick IP registration'}
              </p>
            </div>
            <ModeSwitcher mode={mode} onChange={setMode} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto">
        {mode === 'chat' ? (
          <EnhancedAgentOrchestrator />
        ) : (
          <div className="p-6">
            <SimpleIPRegister />
          </div>
        )}
      </div>
    </div>
  );
}
