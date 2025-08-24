import React from "react";
import type { Message } from "@/types/agents";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-xs opacity-60">
        AI replies will appear here. Try:{" "}
        <span className="badge">
          Swap 1 WIP &gt; USDC slippage 0.5%
        </span>{" "}
        or{" "}
        <span className="badge">
          Register this image IP, title "Sunset" by-nc
        </span>
        .
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === "you" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[75%] rounded-2xl px-4 py-3 border ${
              message.role === "you"
                ? "bg-sky-500/15 border-sky-400/30"
                : "bg-white/6 border-white/10"
            }`}
          >
            <pre className="whitespace-pre-wrap text-sm break-words">
              {message.text}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}
