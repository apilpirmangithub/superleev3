import { useState, useCallback, useEffect } from "react";
import { decide } from "@/lib/agent/engine";
import type { Message, Plan, ChatState } from "@/types/agents";

export function useChatAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [status, setStatus] = useState<string>("");

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("agentMessages");
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("agentMessages", JSON.stringify(messages));
    } catch {
      // Ignore errors
    }
  }, [messages]);

  const addMessage = useCallback((role: Message["role"], text: string) => {
    setMessages((prev) => [...prev, { role, text, ts: Date.now() }]);
  }, []);

  const processPrompt = useCallback((prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    // Add user message
    addMessage("you", trimmedPrompt);
    setStatus("");

    // Process with AI engine
    const decision = decide(trimmedPrompt);

    if (decision.type === "ask") {
      // AI needs more information
      setCurrentPlan(null);
      addMessage("agent", decision.question);
      setStatus(decision.question);
      return;
    }

    // AI has a plan
    setCurrentPlan({
      type: decision.intent.kind as "swap" | "register",
      steps: decision.plan,
      intent: decision.intent,
    });

    // Show plan to user
    const planText = [
      "Plan:",
      ...decision.plan.map((step: string, i: number) => `${i + 1}. ${step}`)
    ].join("\n");
    
    addMessage("agent", planText);
  }, [addMessage]);

  const clearPlan = useCallback(() => {
    setCurrentPlan(null);
    setStatus("");
  }, []);

  const updateStatus = useCallback((newStatus: string) => {
    setStatus(newStatus);
    addMessage("agent", `ℹ️ ${newStatus}`);
  }, [addMessage]);

  const newChat = useCallback(() => {
    setMessages([]);
    setCurrentPlan(null);
    setStatus("");
    try {
      localStorage.removeItem("agentMessages");
    } catch {
      // Ignore errors
    }
  }, []);

  return {
    messages,
    currentPlan,
    status,
    addMessage,
    processPrompt,
    clearPlan,
    updateStatus,
    newChat,
  };
}
