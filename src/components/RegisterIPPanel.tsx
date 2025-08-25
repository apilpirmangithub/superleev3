"use client";
import { useStoryClient } from "@/lib/storyClient";
import { useAccount } from "wagmi";
import { toHex } from "viem";
import { useState } from "react";
import { DEFAULT_LICENSE_SETTINGS, createLicenseTerms, STORY_CONTRACTS } from "@/lib/license/terms";
import { detectAI, fileToBuffer } from "@/services";
import type { LicenseSettings } from "@/lib/license/terms";

async function sha256Hex(file: File): Promise<`0x${string}`> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return toHex(new Uint8Array(hash), { size: 32 });
}

export default function RegisterIPPanel() {
  const { address, isConnected } = useAccount();
  const { getClient } = useStoryClient();
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("");
  const [licenseSettings, setLicenseSettings] = useState<LicenseSettings>(DEFAULT_LICENSE_SETTINGS);
  const [aiDetection, setAiDetection] = useState<{ isAI: boolean; confidence: number } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function uploadFileToIPFS(f: File) {
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/ipfs/file", { method: "POST", body: fd });
    if (!res.ok) throw new Error("file upload failed");
    return await res.json(); // { cid, url }
  }

  async function uploadJSONToIPFS(obj: any) {
    const res = await fetch("/api/ipfs/json", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(obj) });
    if (!res.ok) throw new Error("json upload failed");
    return await res.json(); // { cid, url, hash }
  }

  async function onFileChange(selectedFile: File | null) {
    setFile(selectedFile);
    setAiDetection(null);

    if (selectedFile) {
      // Run AI detection
      try {
        const buffer = await fileToBuffer(selectedFile);
        const detection = await detectAI(buffer);
        setAiDetection(detection);

        // Auto-adjust license settings for AI content
        if (detection.isAI) {
          setLicenseSettings(prev => ({ ...prev, aiLearning: false }));
        }
      } catch (error) {
        console.error('AI detection failed:', error);
      }
    }
  }

  async function onSubmit() {
    try {
      if (!file) return;
      setStatus("Uploading image...");
      const media = await uploadFileToIPFS(file);
      const mediaHash = await sha256Hex(file);

      const ipMetadata = {
        title: file.name,
        description: prompt || "",
        image: media.url,
        imageHash: mediaHash,
        mediaUrl: media.url,
        mediaHash: mediaHash,
        mediaType: file.type,
        creators: address ? [{ name: address, address, contributionPercent: 100 }] : [],
        aiMetadata: prompt ? { prompt, generator: "user", model: "unknown" } : undefined,
        ...(aiDetection?.isAI && {
          tags: ["AI-generated"],
          aiGenerated: true,
          aiConfidence: aiDetection.confidence,
        }),
      };

      setStatus("Uploading metadata...");
      const ipMetaUpload = await uploadJSONToIPFS(ipMetadata);

      const nftMetadata = {
        name: `IP Ownership — ${file.name}`,
        description: "Ownership NFT for IP Asset",
        image: media.url,
        attributes: [
          { trait_type: "Type", value: aiDetection?.isAI ? "AI-generated" : "Original" },
          { trait_type: "License Type", value: licenseSettings.pilType },
          { trait_type: "Commercial Use", value: licenseSettings.commercialUse ? "Yes" : "No" },
          { trait_type: "AI Learning Allowed", value: licenseSettings.aiLearning ? "Yes" : "No" },
        ],
      };
      const nftMetaUpload = await uploadJSONToIPFS(nftMetadata);

      setStatus("Registering on Story...");
      const client = await getClient();

      // Use enhanced registration with license terms
      const licenseTermsData = createLicenseTerms(licenseSettings);

      const res = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: STORY_CONTRACTS.SPG_COLLECTION,
        licenseTermsData: [licenseTermsData],
        ipMetadata: {
          ipMetadataURI: ipMetaUpload.url,
          ipMetadataHash: ipMetaUpload.hash,
          nftMetadataURI: nftMetaUpload.url,
          nftMetadataHash: nftMetaUpload.hash,
        },
      });

      setStatus(`Registered with ${licenseSettings.pilType} license!\nipId: ${res.ipId}\nTx: ${res.txHash}`);
    } catch (e: any) {
      setStatus(e?.message || "Register error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <div>
          <label className="block font-medium mb-2">Prompt (optional)</label>
          <textarea
            value={prompt}
            onChange={e=>setPrompt(e.target.value)}
            placeholder="Describe your work..."
            className="w-full min-h-[100px] p-3 border border-ai-border rounded-xl bg-ai-card focus:border-ai-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-medium mb-2">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={e=>onFileChange(e.target.files?.[0]||null)}
            className="w-full p-2 border border-ai-border rounded-lg bg-ai-card"
          />
          {aiDetection && (
            <div className={`mt-2 p-3 rounded-lg text-sm ${
              aiDetection.isAI
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              <div className="font-semibold">
                {aiDetection.isAI ? '🤖 AI-Generated Content Detected' : '✨ Original Content'}
              </div>
              <div className="text-xs opacity-75">
                Confidence: {(aiDetection.confidence * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>

        {/* License Settings Toggle */}
        <div className="border-t border-ai-border pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-ai-primary hover:text-ai-accent font-medium"
          >
            {showAdvanced ? '▼' : '▶'} Advanced License Settings
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block font-medium mb-2">License Type</label>
                <select
                  value={licenseSettings.pilType}
                  onChange={e => setLicenseSettings(prev => ({ ...prev, pilType: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="open_use">🎁 Open Use (Free)</option>
                  <option value="non_commercial_remix">🔄 Non-Commercial Remix</option>
                  <option value="commercial_use">💼 Commercial Use</option>
                  <option value="commercial_remix">🎨 Commercial Remix</option>
                </select>
              </div>

              {(licenseSettings.pilType === 'commercial_use' || licenseSettings.pilType === 'commercial_remix') && (
                <div>
                  <label className="block font-medium mb-2">License Price ($IP)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={licenseSettings.licensePrice}
                    onChange={e => setLicenseSettings(prev => ({ ...prev, licensePrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>
              )}

              {licenseSettings.pilType === 'commercial_remix' && (
                <div>
                  <label className="block font-medium mb-2">Revenue Share (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={licenseSettings.revShare}
                    onChange={e => setLicenseSettings(prev => ({ ...prev, revShare: parseInt(e.target.value) || 0 }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>
              )}

              {!aiDetection?.isAI && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Allow AI Training</span>
                  <button
                    onClick={() => setLicenseSettings(prev => ({ ...prev, aiLearning: !prev.aiLearning }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      licenseSettings.aiLearning ? 'bg-ai-primary' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                      licenseSettings.aiLearning ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            disabled={!isConnected || !file}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload & Register with License
          </button>
        </div>
      </div>
      {status && (
        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="text-sm font-medium mb-2">Registration Status:</div>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">{status}</pre>
        </div>
      )}
    </div>
  );
}
