import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { Send } from "lucide-react";

interface ComposerProps {
  onSubmit: (prompt: string) => void;
  status?: string;
}

export function Composer({ onSubmit, status }: ComposerProps) {
  const { isConnected } = useAccount();
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAutoGrow = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  useEffect(() => {
    if (textareaRef.current) {
      handleAutoGrow(textareaRef.current);
    }
  }, [prompt]);

  const handleSubmit = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || !isConnected) return;
    
    onSubmit(trimmedPrompt);
    setPrompt("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const canSend = isConnected && prompt.trim().length > 0;

  return (
    <div className="shrink-0 border-t border-white/10 bg-gradient-to-t from-black/20 to-transparent card relative overflow-visible">
      <div className="mx-auto w-full max-w-[820px] px-3 py-3">
        <div className="relative flex items-end gap-2 rounded-2xl ring-1 ring-white/15 bg-white/5/30 backdrop-blur-md px-3 py-2 overflow-visible">

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 resize-none rounded-md bg-transparent px-2 py-2 text-base sm:text-lg placeholder:opacity-50 focus:outline-none scrollbar-invisible"
            placeholder='Reply to Superlee Assistant...'
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              handleAutoGrow(e.currentTarget);
            }}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.ctrlKey || e.metaKey) && handleSubmit()
            }
          />

          {/* Send button */}
          <button
            className="relative z-10 p-2 rounded-xl bg-sky-500/90 hover:bg-sky-400 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            onClick={handleSubmit}
            disabled={!canSend}
            title={
              !isConnected
                ? "Connect wallet to send"
                : !prompt.trim()
                ? "Type a prompt"
                : "Send (Ctrl/⌘+Enter)"
            }
          >
            <Send className="h-5 w-5" />
          </button>

          {/* Sprite mascot */}
          <Image
            src="/brand/superlee-sprite.png"
            alt=""
            width={48}
            height={48}
            priority
            className="pointer-events-none select-none pixelated animate-float absolute -top-3 -right-3 w-12 h-12 z-20 drop-shadow-[0_10px_28px_rgba(34,211,238,.35)]"
          />
        </div>

        {/* Status */}
        <div className="mt-2">
          {status && <span className="text-xs opacity-70">{status}</span>}
        </div>
      </div>

    </div>
  );
}
