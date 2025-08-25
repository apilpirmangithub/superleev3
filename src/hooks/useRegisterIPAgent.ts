import { useState, useCallback } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useStoryClient } from "@/lib/storyClient";
import { compressImage } from "@/lib/utils/image";
import { uploadFile, uploadJSON, extractCid, toHttps, toIpfsUri } from "@/lib/utils/ipfs";
import { keccakOfFile, keccakOfJson } from "@/lib/utils/crypto";
import type { RegisterIntent } from "@/lib/agent/engine";
import type { RegisterState, AgentError } from "@/types/agents";

const SPG_COLLECTION = (process.env.NEXT_PUBLIC_SPG_COLLECTION as `0x${string}`) ||
  "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc";

export function useRegisterIPAgent() {
  const { address } = useAccount();
  const { getClient } = useStoryClient();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const [registerState, setRegisterState] = useState<RegisterState>({
    status: 'idle',
    progress: 0,
    error: null,
  });

  const ensureAeneid = useCallback(async () => {
    if (chainId !== 1315) {
      try {
        await switchChainAsync({ chainId: 1315 });
      } catch (error) {
        throw new Error("Failed to switch to Aeneid network");
      }
    }
  }, [chainId, switchChainAsync]);

  const executeRegister = useCallback(async (intent: RegisterIntent, file: File) => {
    try {
      // Ensure we're on the right network
      await ensureAeneid();

      // Reset state
      setRegisterState({
        status: 'compressing',
        progress: 10,
        error: null,
      });

      // 1. Compress image
      const compressedFile = await compressImage(file);

      setRegisterState(prev => ({
        ...prev,
        status: 'uploading-image',
        progress: 25
      }));

      // 2. Upload image to IPFS
      const imageUpload = await uploadFile(compressedFile);
      const imageCid = extractCid(imageUpload.cid || imageUpload.url);
      const imageGateway = toHttps(imageCid);
      const imageHash = await keccakOfFile(compressedFile);

      setRegisterState(prev => ({
        ...prev,
        status: 'creating-metadata',
        progress: 50
      }));

      // 3. Create IP metadata
      const ipMetadata = {
        title: intent.title || compressedFile.name,
        description: intent.prompt || "",
        image: imageGateway,
        imageHash,
        mediaUrl: imageGateway,
        mediaHash: imageHash,
        mediaType: compressedFile.type || "image/webp",
        creators: address
          ? [{ name: address, address, contributionPercent: 100 }]
          : [],
        aiMetadata: intent.prompt
          ? { prompt: intent.prompt, generator: "user", model: "rule-based" }
          : undefined,
      };

      // 4. Upload IP metadata to IPFS
      const ipMetaUpload = await uploadJSON(ipMetadata);
      const ipMetaCid = extractCid(ipMetaUpload.cid || ipMetaUpload.url);
      const ipMetadataURI = toIpfsUri(ipMetaCid);
      const ipMetadataHash = await keccakOfJson(ipMetadata);

      setRegisterState(prev => ({
        ...prev,
        status: 'uploading-metadata',
        progress: 60
      }));

      // 5. Create NFT metadata
      const nftMetadata = {
        name: `IP Ownership — ${ipMetadata.title}`,
        description: "Ownership NFT for IP Asset",
        image: imageGateway,
        ipMetadataURI,
        attributes: [{ trait_type: "ip_metadata_uri", value: ipMetadataURI }],
      };

      // 6. Upload NFT metadata to IPFS
      const nftMetaUpload = await uploadJSON(nftMetadata);
      const nftMetaCid = extractCid(nftMetaUpload.cid || nftMetaUpload.url);
      const nftMetadataURI = toIpfsUri(nftMetaCid);
      const nftMetadataHash = await keccakOfJson(nftMetadata);

      setRegisterState(prev => ({
        ...prev,
        status: 'minting',
        progress: 75
      }));

      // 7. Mint and register IP on Story Protocol
      const client = await getClient();
      const result = await client.ipAsset.mintAndRegisterIp({
        spgNftContract: SPG_COLLECTION,
        recipient: address as `0x${string}`,
        ipMetadata: {
          ipMetadataURI,
          ipMetadataHash,
          nftMetadataURI,
          nftMetadataHash,
        },
        allowDuplicates: true,
      });

      setRegisterState({
        status: 'success',
        progress: 100,
        error: null,
        ipId: result.ipId,
        txHash: result.txHash,
      });

      return {
        success: true,
        ipId: result.ipId,
        txHash: result.txHash,
        imageUrl: imageGateway,
        ipMetadataUrl: toHttps(ipMetaCid),
        nftMetadataUrl: toHttps(nftMetaCid),
      };

    } catch (error: any) {
      setRegisterState(prev => ({
        ...prev,
        status: 'error',
        error: error.message || String(error)
      }));

      return {
        success: false,
        error: error.message || String(error)
      };
    }
  }, [address, getClient, ensureAeneid]);

  const resetRegister = useCallback(() => {
    setRegisterState({
      status: 'idle',
      progress: 0,
      error: null,
    });
  }, []);

  return {
    registerState,
    executeRegister,
    resetRegister,
  };
}
