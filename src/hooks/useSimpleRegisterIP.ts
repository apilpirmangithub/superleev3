import { useState, useCallback } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useStoryClient } from "@/lib/storyClient";
import { compressImage } from "@/lib/utils/image";
import { uploadFile, uploadJSON, extractCid, toHttps, toIpfsUri } from "@/lib/utils/ipfs";
import { sha256HexOfFile, keccakOfJson } from "@/lib/utils/crypto";
import { createLicenseTerms, DEFAULT_LICENSE_SETTINGS, STORY_CONTRACTS } from "@/lib/license/terms";
import { detectAI, fileToBuffer } from "@/services";
import type { LicenseSettings } from "@/lib/license/terms";

const SPG_COLLECTION = (process.env.NEXT_PUBLIC_SPG_COLLECTION as `0x${string}`) ||
  STORY_CONTRACTS.SPG_COLLECTION;

// Simplified license presets
export const LICENSE_PRESETS = {
  open: {
    name: "Open",
    description: "Anyone can use freely",
    settings: {
      pilType: "pil" as const,
      commercialUse: true,
      revShare: 0,
      aiLearning: true,
      territory: "Worldwide"
    }
  },
  remix: {
    name: "Remix Allowed", 
    description: "Can be modified and shared",
    settings: {
      pilType: "pil" as const,
      commercialUse: false,
      revShare: 0,
      aiLearning: true,
      territory: "Worldwide"
    }
  },
  commercial: {
    name: "Commercial",
    description: "Can be sold with 10% revenue share",
    settings: {
      pilType: "pil" as const,
      commercialUse: true,
      revShare: 10,
      aiLearning: false,
      territory: "Worldwide"
    }
  }
} as const;

export type LicensePreset = keyof typeof LICENSE_PRESETS;

interface SimpleRegisterState {
  status: 'idle' | 'processing' | 'success' | 'error';
  step: string;
  progress: number;
  error: string | null;
  result?: {
    ipId?: string;
    txHash?: string;
    imageUrl?: string;
    aiDetected?: boolean;
  };
}

export function useSimpleRegisterIP() {
  const { address } = useAccount();
  const { getClient } = useStoryClient();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const [state, setState] = useState<SimpleRegisterState>({
    status: 'idle',
    step: '',
    progress: 0,
    error: null,
  });

  const updateStep = useCallback((step: string, progress: number) => {
    setState(prev => ({ ...prev, step, progress }));
  }, []);

  const register = useCallback(async (
    file: File,
    title: string,
    description: string,
    licensePreset: LicensePreset = 'remix'
  ) => {
    try {
      setState({
        status: 'processing',
        step: 'Preparing...',
        progress: 5,
        error: null,
      });

      // Auto switch network if needed
      if (chainId !== 1315) {
        updateStep('Switching to Story network...', 10);
        await switchChainAsync({ chainId: 1315 });
      }

      updateStep('Analyzing your file...', 20);

      // Compress and analyze in parallel
      const [compressedFile, aiDetection] = await Promise.allSettled([
        compressImage(file),
        (async () => {
          try {
            const buffer = await fileToBuffer(file);
            return await detectAI(buffer);
          } catch {
            return null;
          }
        })()
      ]);

      if (compressedFile.status === 'rejected') {
        throw new Error('Failed to process image');
      }

      const finalFile = compressedFile.value;
      const aiResult = aiDetection.status === 'fulfilled' ? aiDetection.value : null;

      updateStep('Uploading to IPFS...', 40);

      // Upload image and create metadata in parallel
      const [imageUpload, imageHash] = await Promise.all([
        uploadFile(finalFile),
        sha256HexOfFile(finalFile)
      ]);

      const imageCid = extractCid(imageUpload.cid || imageUpload.url);
      const imageGateway = toHttps(imageCid);

      updateStep('Creating IP registration...', 60);

      // Create metadata
      const ipMetadata = {
        title: title || finalFile.name,
        description: description || `IP Asset: ${title || finalFile.name}`,
        image: imageGateway,
        imageHash,
        mediaUrl: imageGateway,
        mediaHash: imageHash,
        mediaType: finalFile.type || "image/webp",
        creators: address ? [{ name: address, address, contributionPercent: 100 }] : [],
        ...(aiResult?.isAI && {
          tags: ["AI-generated"],
          aiGenerated: true,
          aiConfidence: aiResult.confidence,
        }),
      };

      const nftMetadata = {
        name: `IP — ${ipMetadata.title}`,
        description: "IP Asset Ownership Token",
        image: imageGateway,
        attributes: [
          { trait_type: "Type", value: aiResult?.isAI ? "AI-generated" : "Original" },
          { trait_type: "License", value: LICENSE_PRESETS[licensePreset].name },
        ],
      };

      // Upload metadata
      const [ipMetaUpload, nftMetaUpload] = await Promise.all([
        uploadJSON(ipMetadata),
        uploadJSON(nftMetadata)
      ]);

      const ipMetaCid = extractCid(ipMetaUpload.cid || ipMetaUpload.url);
      const nftMetaCid = extractCid(nftMetaUpload.cid || nftMetaUpload.url);
      
      const [ipMetadataHash, nftMetadataHash] = await Promise.all([
        keccakOfJson(ipMetadata),
        keccakOfJson(nftMetadata)
      ]);

      updateStep('Registering on Story Protocol...', 80);

      // Register IP
      const client = await getClient();
      const licenseSettings = LICENSE_PRESETS[licensePreset].settings;
      const licenseTermsData = createLicenseTerms(licenseSettings);

      const result = await client.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: SPG_COLLECTION,
        recipient: address as `0x${string}`,
        licenseTermsData: [licenseTermsData],
        ipMetadata: {
          ipMetadataURI: toIpfsUri(ipMetaCid),
          ipMetadataHash,
          nftMetadataURI: toIpfsUri(nftMetaCid),
          nftMetadataHash,
        },
        allowDuplicates: true,
      });

      setState({
        status: 'success',
        step: 'Registration complete!',
        progress: 100,
        error: null,
        result: {
          ipId: result.ipId,
          txHash: result.txHash,
          imageUrl: imageGateway,
          aiDetected: aiResult?.isAI || false,
        }
      });

      return {
        success: true,
        ipId: result.ipId,
        txHash: result.txHash,
        imageUrl: imageGateway,
        aiDetected: aiResult?.isAI || false,
      };

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error?.message || 'Registration failed'
      }));

      return {
        success: false,
        error: error?.message || 'Registration failed'
      };
    }
  }, [address, getClient, chainId, switchChainAsync, updateStep]);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      step: '',
      progress: 0,
      error: null,
    });
  }, []);

  return {
    state,
    register,
    reset,
    LICENSE_PRESETS,
  };
}
