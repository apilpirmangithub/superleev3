import { useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { orchestrator } from "@/lib/agents/AgentOrchestrator";
import { 
  AgentContext, 
  OrchestratorResult, 
  AgentParseResult,
  ExecutionResult
} from "@/types/agents";

export interface ChatMessage {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
  agent?: string;
  data?: any;
  attachedFile?: File;
}

export interface PendingExecution {
  agent: string;
  intent: any;
  plan: string[];
  context?: AgentContext;
}

/**
 * Hook for interacting with the agent orchestrator
 */
export function useAgentOrchestrator() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      content: "Hi! I'm your AI assistant for Story Chain. I can help you:\n\n• **Swap tokens** via PiperX Aggregator\n• **Register IP** on Story Protocol\n\nTry commands like:\n• \"Swap 1 WIP > USDC slippage 0.5%\"\n• \"Register this image IP, title 'My Art'\"",
      timestamp: new Date()
    }
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingExecution, setPendingExecution] = useState<PendingExecution | null>(null);

  /**
   * Create agent context from current app state
   */
  const createContext = useCallback((attachedFile?: File): AgentContext => {
    return {
      userAddress: address,
      chainId,
      hasAttachedFile: !!attachedFile,
      attachedFile
    };
  }, [address, chainId]);

  /**
   * Add a new message to the chat
   */
  const addMessage = useCallback((message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  /**
   * Process a user prompt through the orchestrator
   */
  const processPrompt = useCallback(async (
    prompt: string, 
    attachedFile?: File
  ): Promise<void> => {
    if (!prompt.trim()) return;

    setIsProcessing(true);

    try {
      // Add user message
      addMessage({
        role: "user",
        content: prompt,
        attachedFile
      });

      const context = createContext(attachedFile);
      const result = await orchestrator.processPrompt(prompt, context);

      switch (result.type) {
        case "handled":
          await handleAgentResult(result.result!, result.agent!, context);
          break;

        case "unknown":
          addMessage({
            role: "agent",
            content: "I don't understand that command. Here's what I can help with:",
            data: { suggestions: result.suggestions }
          });
          break;

        case "ambiguous":
          addMessage({
            role: "agent",
            content: "Multiple agents can handle this request. Please be more specific:",
            data: { suggestions: result.suggestions }
          });
          break;
      }

    } catch (error: any) {
      console.error("Error processing prompt:", error);
      addMessage({
        role: "agent",
        content: `Sorry, there was an error processing your request: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage, createContext]);

  /**
   * Handle the result from an agent
   */
  const handleAgentResult = useCallback(async (
    result: AgentParseResult,
    agentName: string,
    context: AgentContext
  ) => {
    switch (result.type) {
      case "success":
        // Show plan and ask for confirmation
        addMessage({
          role: "agent",
          content: `I'll help you with that. Here's the plan:\n\n${result.plan.map((step, i) => `${i + 1}. ${step}`).join('\n')}`,
          agent: agentName
        });

        setPendingExecution({
          agent: agentName,
          intent: result.intent,
          plan: result.plan,
          context
        });
        break;

      case "need_info":
        let content = result.question;
        if (result.suggestions && result.suggestions.length > 0) {
          content += "\n\nExamples:\n" + result.suggestions.map(s => `• ${s}`).join('\n');
        }

        addMessage({
          role: "agent",
          content,
          agent: agentName
        });
        break;

      case "failure":
        addMessage({
          role: "agent",
          content: `Error: ${result.reason}`,
          agent: agentName
        });
        break;
    }
  }, [addMessage]);

  /**
   * Execute the pending intent
   */
  const executePendingIntent = useCallback(async (): Promise<void> => {
    if (!pendingExecution) return;

    setIsProcessing(true);

    try {
      addMessage({
        role: "agent",
        content: "Executing...",
        agent: pendingExecution.agent
      });

      const result = await orchestrator.executeIntent(
        pendingExecution.agent,
        pendingExecution.intent,
        pendingExecution.context
      );

      handleExecutionResult(result, pendingExecution.agent);

    } catch (error: any) {
      console.error("Error executing intent:", error);
      addMessage({
        role: "agent",
        content: `Execution failed: ${error.message}`,
        agent: pendingExecution.agent
      });
    } finally {
      setPendingExecution(null);
      setIsProcessing(false);
    }
  }, [pendingExecution, addMessage]);

  /**
   * Cancel the pending execution
   */
  const cancelPendingExecution = useCallback(() => {
    setPendingExecution(null);
    addMessage({
      role: "agent",
      content: "Operation cancelled."
    });
  }, [addMessage]);

  /**
   * Handle execution result
   */
  const handleExecutionResult = useCallback((
    result: ExecutionResult,
    agentName: string
  ) => {
    if (result.type === "success") {
      addMessage({
        role: "agent",
        content: result.message,
        agent: agentName,
        data: {
          ...result.data,
          txHash: result.txHash,
          explorerUrl: result.explorerUrl
        }
      });
    } else {
      addMessage({
        role: "agent", 
        content: `❌ ${result.error}`,
        agent: agentName,
        data: { error: result.details }
      });
    }
  }, [addMessage]);

  /**
   * Clear chat history
   */
  const clearChat = useCallback(() => {
    setMessages([{
      id: "welcome",
      role: "system",
      content: "Chat cleared. How can I help you?",
      timestamp: new Date()
    }]);
    setPendingExecution(null);
  }, []);

  /**
   * Get help for all agents
   */
  const getHelp = useCallback(() => {
    const help = orchestrator.getAllHelp();
    const helpContent = help.map(h => 
      `**${h.agent}**: ${h.description}\n\nExamples:\n${h.examples.map(ex => `• ${ex}`).join('\n')}`
    ).join('\n\n');

    addMessage({
      role: "agent",
      content: `Here's what I can help you with:\n\n${helpContent}`
    });
  }, [addMessage]);

  return {
    // State
    messages,
    isProcessing,
    pendingExecution,
    isConnected,
    
    // Actions
    processPrompt,
    executePendingIntent,
    cancelPendingExecution,
    clearChat,
    getHelp,
    
    // Orchestrator access
    orchestrator
  };
}
