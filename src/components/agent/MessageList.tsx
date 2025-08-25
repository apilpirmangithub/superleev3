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
    <div className="flex justify-start animate-fade-in">
      <div className="flex items-start gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%]">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg animate-pulse-slow">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-white/50 font-medium mb-1">
            SUPERLEE
          </div>
          <div className="bg-white/8 border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm hover-glow transition-smooth">
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
          <h3 className="text-lg font-semibold text-white mb-2">SUPERLEE</h3>
          <p className="text-sm text-white/60 max-w-md">
            Psst... just type "SUP" to wake me up! 😉
          </p>
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
          <div
            key={`${message.ts}-${message.role}-${index}`}
            className={`message-enter ${index === messages.length - 1 ? 'animate-slide-up' : ''}`}
            style={{
              animationDelay: index === messages.length - 1 ? '0ms' : `${index * 100}ms`
            }}
          >
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
                      SUPERLEE
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`relative group ${
                    isUser ? "ml-2 sm:ml-4" : "mr-2 sm:mr-4"
                  }`}>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-lg hover-glow ${
                        isUser
                          ? "bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-br-md border border-sky-400/30 hover:from-sky-400 hover:to-sky-500"
                          : "bg-white/8 border border-white/10 text-white rounded-tl-md hover:bg-white/12 hover:border-white/20"
                      }`}
                      onMouseDown={(e) => {
                        // Prevent message clicks from stealing focus from the input
                        e.preventDefault();
                      }}
                    >
                      <div className="text-sm break-words font-sans leading-relaxed">
                        {message.isLoading ? (
                          <div className="flex items-center gap-2">
                            <span>{message.text}</span>
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce"></div>
                            </div>
                          </div>
                        ) : (
                          <pre
                            className="whitespace-pre-wrap select-text"
                            onMouseDown={(e) => {
                              // Allow text selection but prevent focus stealing
                              e.stopPropagation();
                            }}
                          >
                            {message.text}
                          </pre>
                        )}
                      </div>

                      {/* Image display */}
                      {message.image && (
                        <div className="mt-3">
                          <img
                            src={message.image.url}
                            alt={message.image.alt || "Registered image"}
                            className="max-w-full h-auto rounded-lg border border-white/20"
                            style={{ maxHeight: '200px' }}
                          />
                        </div>
                      )}

                      {/* Links display */}
                      {message.links && message.links.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.links.map((link, linkIndex) => (
                            <div key={linkIndex}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-300 hover:text-sky-200 underline decoration-sky-300/50 hover:decoration-sky-200 transition-colors"
                              >
                                {link.text}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
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
                          className="px-3 py-2 text-sm rounded-lg bg-sky-500/90 hover:bg-sky-400 text-white border border-sky-400/30 transition-bounce hover:scale-105 hover:shadow-xl hover-lift"
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
