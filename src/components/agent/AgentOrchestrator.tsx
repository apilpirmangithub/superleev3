import React, { useRef, useEffect, useCallback, useState } from "react";
import { usePublicClient } from "wagmi";
import { storyAeneid } from "@/lib/chains/story";
import { waitForTxConfirmation } from "@/lib/utils/transaction";
import { useChatAgent } from "@/hooks/useChatAgent";
import { useSwapAgent } from "@/hooks/useSwapAgent";
import { useRegisterIPAgent } from "@/hooks/useRegisterIPAgent";
import { useFileUpload } from "@/hooks/useFileUpload";
import { DEFAULT_LICENSE_SETTINGS } from "@/lib/license/terms";
import type { LicenseSettings } from "@/lib/license/terms";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { PlanBox } from "./PlanBox";
import { HistorySidebar } from "./HistorySidebar";
import { Toast } from "./Toast";
import type { Hex } from "viem";

export function AgentOrchestrator() {
  const chatAgent = useChatAgent();
  const swapAgent = useSwapAgent();
  const registerAgent = useRegisterIPAgent();
  const fileUpload = useFileUpload();
  const publicClient = usePublicClient();
  
  const [toast, setToast] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const explorerBase = storyAeneid.blockExplorers?.default.url || "https://aeneid.storyscan.xyz";

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatAgent.messages]);

  const executePlan = useCallback(async () => {
    if (!chatAgent.currentPlan) return;

    const plan = chatAgent.currentPlan;

    if (plan.type === "swap" && plan.intent.kind === "swap") {
      chatAgent.updateStatus("🔄 Executing swap...");

      const result = await swapAgent.executeSwap(plan.intent);

      if (result.success) {
        const successMessage = `Swap success ✅
From: ${plan.intent.tokenIn}
To: ${plan.intent.tokenOut}
Amount: ${plan.intent.amount}
Tx: ${result.txHash}
↗ View: ${explorerBase}/tx/${result.txHash}`;

        chatAgent.addMessage("agent", successMessage);
        setToast("Swap success ✅");
      } else {
        chatAgent.addMessage("agent", `Swap error: ${result.error}`);
        setToast("Swap error ❌");
      }
      
      chatAgent.clearPlan();
      swapAgent.resetSwap();
    }
    
    else if (plan.type === "register" && plan.intent.kind === "register") {
      if (!fileUpload.file) {
        chatAgent.addMessage("agent", "❌ Please attach an image first!");
        setToast("Attach image first 📎");
        return;
      }

      chatAgent.updateStatus("📝 Registering IP...");

      // Create license settings based on intent
      const licenseSettings: LicenseSettings = {
        ...DEFAULT_LICENSE_SETTINGS,
        pilType: plan.intent.pilType || 'non_commercial_remix',
      };

      const result = await registerAgent.executeRegister(plan.intent, fileUpload.file, licenseSettings);
      
      if (result.success) {
        // Show initial success with transaction link
        const submittedMessage = `Tx submitted ⏳\n↗ View: ${explorerBase}/tx/${result.txHash}`;
        chatAgent.addMessage("agent", submittedMessage);

        // Wait for confirmation
        try {
          chatAgent.updateStatus("Waiting for confirmation...");
          const confirmed = await waitForTxConfirmation(
            publicClient, 
            result.txHash as Hex,
            { timeoutMs: 90_000 }
          );

          if (confirmed) {
            const successMessage = `Register success ✅
ipId: ${result.ipId}
Tx: ${result.txHash}
Image: ${result.imageUrl}
IP Metadata: ${result.ipMetadataUrl}
NFT Metadata: ${result.nftMetadataUrl}
↗ View: ${explorerBase}/tx/${result.txHash}`;
            
            chatAgent.addMessage("agent", successMessage);
            setToast("IP registered ✅");
          } else {
            chatAgent.updateStatus("Tx still pending on network. Check explorer.");
          }
        } catch {
          chatAgent.updateStatus("Tx still pending on network. Check explorer.");
        }
      } else {
        chatAgent.addMessage("agent", `Register error: ${result.error}`);
        setToast("Register error ❌");
      }
      
      chatAgent.clearPlan();
      registerAgent.resetRegister();
      fileUpload.removeFile();
    }
  }, [
    chatAgent,
    swapAgent,
    registerAgent,
    fileUpload,
    publicClient,
    explorerBase
  ]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 overflow-x-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        {/* History Sidebar */}
        <HistorySidebar 
          messages={chatAgent.messages}
          onNewChat={chatAgent.newChat}
        />

        {/* Main Chat Area */}
        <section className="rounded-2xl border border-white/10 bg-white/5 h-[calc(100vh-180px)] overflow-hidden flex flex-col">
          {/* Messages Area */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto scrollbar-invisible"
          >
            <div className="mx-auto w-full max-w-[820px] px-3 py-4">
              <MessageList messages={chatAgent.messages} />

              {/* Plan Box */}
              {chatAgent.currentPlan && (
                <PlanBox
                  plan={chatAgent.currentPlan}
                  onConfirm={executePlan}
                  onCancel={chatAgent.clearPlan}
                  swapState={swapAgent.swapState}
                  registerState={registerAgent.registerState}
                />
              )}
            </div>
          </div>

          {/* Composer */}
          <Composer
            onSubmit={(prompt) => chatAgent.processPrompt(prompt)}
            status={chatAgent.status}
          />
        </section>
      </div>

      {/* Toast Notifications */}
      <Toast 
        message={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
