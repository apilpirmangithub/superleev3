import React from "react";
import type { Message } from "@/types/agents";

interface MessageListProps {
  messages: Message[];
  onButtonClick?: (buttonText: string) => void;
}

export function MessageList({ messages, onButtonClick }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-white/60 mb-4">
          <div className="text-sm opacity-70">SUPERLEE ASSISTANT</div>
          <div className="text-xs opacity-50 mt-1">Waiting for Superlee to start the conversation...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === "you" ? "justify-end" : "justify-start"
          }`}
        >
          <div className="max-w-[85%] space-y-2">
            {/* Agent label */}
            {message.role === "agent" && (
              <div className="text-xs text-white/50 font-medium px-1">
                SUPERLEE ASSISTANT
              </div>
            )}

            {/* Message bubble */}
            <div
              className={`rounded-2xl px-4 py-3 border ${
                message.role === "you"
                  ? "bg-sky-500/15 border-sky-400/30 text-white"
                  : "bg-white/6 border-white/10 text-white"
              }`}
            >
              <pre className="whitespace-pre-wrap text-sm break-words font-sans">
                {message.text}
              </pre>
            </div>

            {/* Buttons */}
            {message.buttons && message.buttons.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1">
                {message.buttons.map((button, buttonIndex) => (
                  <button
                    key={buttonIndex}
                    onClick={() => onButtonClick?.(button)}
                    className="px-3 py-2 text-sm rounded-lg bg-sky-500/90 hover:bg-sky-400 text-white border border-sky-400/30 transition-colors"
                  >
                    {button}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
