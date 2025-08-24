import React from "react";
import type { Message } from "@/types/agents";

interface HistorySidebarProps {
  messages: Message[];
  onNewChat: () => void;
}

export function HistorySidebar({ messages, onNewChat }: HistorySidebarProps) {
  const userMessages = messages.filter((m) => m.role === "you");

  return (
    <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 h-[calc(100vh-180px)] overflow-y-auto scrollbar-invisible">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm opacity-80">History</div>
        <button
          onClick={onNewChat}
          className="text-[11px] px-2 py-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
          title="Start a new chat"
        >
          New
        </button>
      </div>

      {userMessages.length === 0 ? (
        <p className="text-xs opacity-60">
          There are no interactions yet. Write the prompt on the right.
        </p>
      ) : (
        <ul className="space-y-2 pr-1">
          {userMessages.map((message, index) => (
            <li key={index} className="text-sm line-clamp-2 hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors cursor-pointer">
              {message.text}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
