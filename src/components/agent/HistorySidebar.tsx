import React from "react";
import type { Message } from "@/types/agents";

interface HistorySidebarProps {
  messages: Message[];
  onNewChat: () => void;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
}

export function HistorySidebar({ messages, onNewChat }: HistorySidebarProps) {
  // Group messages into sessions based on conversation flow
  const createChatSessions = (): ChatSession[] => {
    if (messages.length === 0) return [];

    const sessions: ChatSession[] = [];
    let currentSession: Message[] = [];
    let sessionCounter = 1;

    // Group messages by conversation breaks
    messages.forEach((message, index) => {
      currentSession.push(message);

      // If this is the last message or there's a significant time gap, end the session
      const nextMessage = messages[index + 1];
      const isLastMessage = index === messages.length - 1;
      const hasTimeGap = nextMessage && (nextMessage.ts - message.ts > 30 * 60 * 1000); // 30 minutes

      if (isLastMessage || hasTimeGap) {
        const userMessages = currentSession.filter(m => m.role === "you");
        if (userMessages.length > 0) {
          const firstUserMessage = userMessages[0];
          const lastMessage = currentSession[currentSession.length - 1];

          sessions.push({
            id: `session-${sessionCounter}`,
            title: firstUserMessage.text.slice(0, 30) + (firstUserMessage.text.length > 30 ? "..." : ""),
            lastMessage: lastMessage.text.slice(0, 40) + (lastMessage.text.length > 40 ? "..." : ""),
            timestamp: firstUserMessage.ts,
            messageCount: currentSession.length
          });
          sessionCounter++;
        }
        currentSession = [];
      }
    });

    return sessions.reverse(); // Show most recent first
  };

  const chatSessions = createChatSessions();

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <aside className="rounded-2xl border border-white/10 bg-white/5 p-3 h-[calc(100vh-180px)] overflow-y-auto scrollbar-invisible">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm opacity-80">History</div>
        <button
          onClick={onNewChat}
          className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
          title="Start a new chat"
        >
          New
        </button>
      </div>

      {chatSessions.length === 0 ? (
        <p className="text-xs opacity-60">
          No chat sessions yet. Start a conversation!
        </p>
      ) : (
        <ul className="space-y-1.5">
          {chatSessions.map((session) => (
            <li key={session.id} className="hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors cursor-pointer group">
              <div className="text-xs font-medium text-white line-clamp-2 mb-1">
                {session.title}
              </div>
              <div className="text-[10px] opacity-60 line-clamp-1 mb-1">
                {session.lastMessage}
              </div>
              <div className="flex items-center justify-between text-[9px] opacity-50">
                <span>{formatTimeAgo(session.timestamp)}</span>
                <span>{session.messageCount} msgs</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
