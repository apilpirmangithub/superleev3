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
import { RegisterIPPanel } from "../RegisterIPPanel";
import { AIDetectionDisplay } from "../AIDetectionDisplay";
import { LicenseSelector } from "../LicenseSelector";
import { detectAI, fileToBuffer } from "@/services";
import type { Hex } from "viem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function EnhancedAgentOrchestrator() {
  const chatAgent = useChatAgent();
  const swapAgent = useSwapAgent();
  const registerAgent = useRegisterIPAgent();
  const fileUpload = useFileUpload();
  const publicClient = usePublicClient();
  
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "register">("chat");
  const [aiDetectionResult, setAiDetectionResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseSettings>(DEFAULT_LICENSE_SETTINGS);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const explorerBase = storyAeneid.blockExplorers?.default.url || "https://aeneid.storyscan.xyz";

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatAgent.messages]);

  // Auto-analyze AI when file is uploaded in chat mode
  useEffect(() => {
    if (fileUpload.file && activeTab === "chat" && !isAnalyzing) {
      analyzeImageForChat();
    }
  }, [fileUpload.file, activeTab]);

  const analyzeImageForChat = async () => {
    if (!fileUpload.file) return;

    setIsAnalyzing(true);
    setAiDetectionResult(null);

    try {
      const buffer = await fileToBuffer(fileUpload.file);
      const result = await detectAI(buffer);
      setAiDetectionResult({
        ...result,
        status: 'completed'
      });
      
      // Add AI detection result to chat
      const aiMessage = `🔍 **Hasil Deteksi AI:**
Status: ${result.isAI ? '🤖 Terdeteksi AI' : '✨ Konten Original'}
Confidence: ${(result.confidence * 100).toFixed(1)}% (${result.confidence >= 0.8 ? 'Tinggi' : result.confidence >= 0.6 ? 'Sedang' : 'Rendah'})

${result.isAI ? 'Gambar ini akan ditandai sebagai AI-generated dalam metadata.' : 'Gambar ini akan ditandai sebagai konten original.'}`;
      
      chatAgent.addMessage("agent", aiMessage);
    } catch (error) {
      console.error('AI detection failed:', error);
      setAiDetectionResult({
        isAI: false,
        confidence: 0,
        status: 'failed'
      });
      chatAgent.addMessage("agent", "⚠️ Deteksi AI gagal, akan dilanjutkan tanpa data AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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

      // Use the AI detection result if available
      const licenseSettings: LicenseSettings = {
        ...selectedLicense,
        pilType: plan.intent.pilType || selectedLicense.pilType,
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
License Type: ${result.licenseType}
AI Detected: ${result.aiDetected ? 'Yes' : 'No'} (${(result.aiConfidence * 100).toFixed(1)}%)
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
      setAiDetectionResult(null);
    }
  }, [
    chatAgent,
    swapAgent,
    registerAgent,
    fileUpload,
    publicClient,
    explorerBase,
    selectedLicense,
    aiDetectionResult
  ]);

  const handleDirectRegister = useCallback(async (file: File, title: string, description: string, license: LicenseSettings, aiResult?: any) => {
    // Create a register intent from the direct input
    const intent = {
      kind: "register" as const,
      title,
      prompt: description,
      license: license.pilType === 'open_use' ? 'cc0' as const : 
               license.pilType === 'non_commercial_remix' ? 'by-nc' as const :
               license.pilType === 'commercial_use' ? 'arr' as const : 'by' as const,
      pilType: license.pilType
    };

    chatAgent.addMessage("you", `Register IP: "${title}"`);
    chatAgent.updateStatus("📝 Starting registration...");

    const result = await registerAgent.executeRegister(intent, file, license);
    
    if (result.success) {
      const submittedMessage = `Tx submitted ⏳\n↗ View: ${explorerBase}/tx/${result.txHash}`;
      chatAgent.addMessage("agent", submittedMessage);

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
Title: ${title}
Image: ${result.imageUrl}
AI Detected: ${result.aiDetected ? 'Yes' : 'No'} (${(result.aiConfidence * 100).toFixed(1)}%)
License: ${license.pilType}
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
    
    registerAgent.resetRegister();
  }, [chatAgent, registerAgent, publicClient, explorerBase]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 overflow-x-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        {/* History Sidebar */}
        <HistorySidebar 
          messages={chatAgent.messages}
          onNewChat={chatAgent.newChat}
        />

        {/* Main Area with Tabs */}
        <div className="h-[calc(100vh-180px)] overflow-hidden flex flex-col">
          {/* Tab Navigation */}
          <div className="shrink-0 mb-4">
            <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "chat"
                    ? "bg-sky-500/90 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                💬 AI Chat
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "register"
                    ? "bg-purple-500/90 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                📝 Register IP
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "chat" ? (
            <section className="flex-1 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex flex-col">
              {/* Messages Area */}
              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto scrollbar-invisible"
              >
                <div className="mx-auto w-full max-w-[820px] px-3 py-4">
                  <MessageList messages={chatAgent.messages} />

                  {/* AI Detection Display in Chat */}
                  {(fileUpload.file && activeTab === "chat") && (
                    <div className="mt-4">
                      <AIDetectionDisplay
                        result={aiDetectionResult}
                        isAnalyzing={isAnalyzing}
                      />
                    </div>
                  )}

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
                onSubmit={chatAgent.processPrompt}
                status={chatAgent.status}
                fileUpload={fileUpload}
              />
            </section>
          ) : (
            <section className="flex-1 rounded-2xl border border-white/10 bg-white/5 overflow-y-auto scrollbar-invisible">
              <div className="p-6">
                <RegisterIPPanel onRegister={handleDirectRegister} />
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast 
        message={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
