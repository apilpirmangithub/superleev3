"use client";

import { useState, useRef, useEffect } from "react";
import { useAgentOrchestrator } from "@/hooks/useAgentOrchestrator";
import { Paperclip, Send, Check, X, MessageCircle, Trash2 } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Modern AI Agent component with modular architecture
 */
export default function AIAgent() {
  const {
    messages,
    isProcessing,
    pendingExecution,
    isConnected,
    processPrompt,
    executePendingIntent,
    cancelPendingExecution,
    clearChat,
    getHelp
  } = useAgentOrchestrator();

  const [prompt, setPrompt] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle file attachment
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle prompt submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() || isProcessing) return;

    const currentPrompt = prompt;
    const currentFile = attachedFile;
    
    // Clear input
    setPrompt("");
    removeAttachedFile();

    // Process prompt
    await processPrompt(currentPrompt, currentFile || undefined);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSubmit = prompt.trim().length > 0 && !isProcessing && isConnected;

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-semibold">SuperLee AI Agent</h1>
              <p className="text-sm text-muted-foreground">
                Token Swap & IP Registration Assistant
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={clearChat}
              className="p-2 rounded-lg border hover:bg-accent transition-colors"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <ConnectButton showBalance={false} />
          </div>
        </div>
      </header>

      {/* Connection Warning */}
      {!isConnected && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 m-4 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Please connect your wallet to use AI Agent features.
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : message.role === "system"
                  ? "bg-muted"
                  : "bg-card border"
              }`}
            >
              {/* Agent badge */}
              {message.agent && (
                <div className="text-xs text-muted-foreground mb-2">
                  {message.agent}
                </div>
              )}

              {/* Message content */}
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>

              {/* Attached file preview */}
              {message.attachedFile && previewUrl && (
                <div className="mt-2">
                  <img
                    src={previewUrl}
                    alt="Attached file"
                    className="max-w-xs rounded border"
                  />
                </div>
              )}

              {/* Transaction data */}
              {message.data?.txHash && (
                <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/20 rounded text-xs">
                  <div>Transaction: {message.data.txHash.slice(0, 10)}...</div>
                  {message.data.explorerUrl && (
                    <a
                      href={message.data.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View on Explorer →
                    </a>
                  )}
                </div>
              )}

              {/* Help suggestions */}
              {message.data?.suggestions && (
                <div className="mt-2 space-y-2">
                  {message.data.suggestions.map((suggestion: any, index: number) => (
                    <div key={index} className="p-2 bg-muted rounded text-xs">
                      <div className="font-medium">{suggestion.agent}</div>
                      <div className="text-muted-foreground">{suggestion.description}</div>
                      <div className="mt-1">
                        Examples: {suggestion.examples.slice(0, 2).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Pending execution confirmation */}
        {pendingExecution && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-sm font-medium mb-2">Ready to execute:</div>
            <div className="text-sm text-muted-foreground mb-3">
              Agent: {pendingExecution.agent}
            </div>
            <div className="flex gap-2">
              <button
                onClick={executePendingIntent}
                disabled={isProcessing}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {isProcessing ? "Executing..." : "Execute"}
              </button>
              <button
                onClick={cancelPendingExecution}
                disabled={isProcessing}
                className="flex items-center gap-2 px-3 py-1.5 border rounded text-sm hover:bg-accent disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-card/50 backdrop-blur-sm">
        {/* File preview */}
        {attachedFile && (
          <div className="p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              <span className="text-sm">{attachedFile.name}</span>
              <button
                onClick={removeAttachedFile}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="mt-2 max-w-xs rounded border"
              />
            )}
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                ref={promptInputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isConnected
                    ? "Type your command... (e.g., 'Swap 1 WIP > USDC' or 'help')"
                    : "Connect wallet to start..."
                }
                disabled={!isConnected || isProcessing}
                className="w-full p-3 border rounded-lg resize-none bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                rows={1}
                style={{ 
                  minHeight: "48px",
                  maxHeight: "120px"
                }}
              />
            </div>

            {/* File attach button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || isProcessing}
              className="p-3 border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Send button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={getHelp}
              className="text-xs px-2 py-1 border rounded hover:bg-accent transition-colors"
            >
              Help
            </button>
            <button
              type="button"
              onClick={() => setPrompt("Swap 1 WIP > USDC slippage 0.5%")}
              className="text-xs px-2 py-1 border rounded hover:bg-accent transition-colors"
            >
              Example Swap
            </button>
            <button
              type="button"
              onClick={() => setPrompt("Register this image IP, title \"My Art\"")}
              className="text-xs px-2 py-1 border rounded hover:bg-accent transition-colors"
            >
              Example Register
            </button>
          </div>
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
