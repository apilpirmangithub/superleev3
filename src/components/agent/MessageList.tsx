import React from "react";
import { Bot, User, CheckCheck, Clock } from "lucide-react";
import type { Message } from "@/types/agents";

interface MessageListProps {
  messages: Message[];
  onButtonClick?: (buttonText: string) => void;
  isTyping?: boolean;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-3 max-w-[85%]">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-white/50 font-medium mb-1">
            SUPERLEE ASSISTANT
          </div>
          <div className="bg-white/8 border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
              </div>
              <span className="text-xs text-white/50 ml-2">Thinking...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageList({ messages, onButtonClick, isTyping }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-xl mb-4">
          <Bot className="h-8 w-8 text-white" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">SUPERLEE ASSISTANT</h3>
          <p className="text-sm text-white/60 max-w-md">
            Start a conversation with your AI assistant. You can swap tokens or register IP with simple commands.
          </p>
          <div className="mt-4 text-xs text-white/40">
            Try: "Swap 1 WIP to USDC" or "Register this image IP"
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {messages.map((message, index) => {
        const isUser = message.role === "you";
        const showTimestamp = index === messages.length - 1 ||
          (index < messages.length - 1 && messages[index + 1].ts - message.ts > 300000); // 5 min gap

        return (
          <div key={index}>
            <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`flex items-start gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%] ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                  isUser
                    ? "bg-gradient-to-br from-emerald-400 to-green-500"
                    : "bg-gradient-to-br from-sky-400 to-blue-500"
                }`}>
                  {isUser ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 space-y-2 ${
                  isUser ? "items-end" : "items-start"
                } flex flex-col`}>
                  {/* Sender name (only for agent) */}
                  {!isUser && (
                    <div className="text-xs text-white/50 font-medium">
                      SUPERLEE ASSISTANT
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`relative group ${
                    isUser ? "ml-2 sm:ml-4" : "mr-2 sm:mr-4"
                  }`}>
                    <div className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                      isUser
                        ? "bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-br-md border border-sky-400/30"
                        : "bg-white/8 border border-white/10 text-white rounded-tl-md"
                    }`}>
                      <pre className="whitespace-pre-wrap text-sm break-words font-sans leading-relaxed">
                        {message.text}
                      </pre>
                    </div>

                    {/* Message status for user messages */}
                    {isUser && (
                      <div className="flex items-center justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCheck className="h-3 w-3 text-white/60" />
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  {message.buttons && message.buttons.length > 0 && (
                    <div className={`flex flex-wrap gap-2 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}>
                      {message.buttons.map((button, buttonIndex) => (
                        <button
                          key={buttonIndex}
                          onClick={() => onButtonClick?.(button)}
                          className="px-3 py-2 text-sm rounded-lg bg-sky-500/90 hover:bg-sky-400 text-white border border-sky-400/30 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                        >
                          {button}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  {showTimestamp && (
                    <div className={`text-xs text-white/40 flex items-center gap-1 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}>
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(message.ts)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {isTyping && (
        <TypingIndicator />
      )}
    </div>
  );
}
