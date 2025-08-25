"use client";

import { useMemo } from "react";
import { useWalletClient } from "wagmi";
import { custom } from "viem";
import { StoryClient, type StoryConfig } from "@story-protocol/core-sdk";

export function useStoryClient() {
  const { data: wallet } = useWalletClient();

  const client = useMemo(() => {
    if (!wallet) return null;

    const chainId = process.env.NEXT_PUBLIC_STORY_CHAIN_ID || "aeneid";

    const cfg: StoryConfig = {
      account: wallet.account,
      transport: custom(wallet.transport),
      chainId: chainId as "aeneid" | "mainnet",
    } as any;

    return StoryClient.newClient(cfg);
  }, [wallet]);

  return {
    async getClient() {
      if (!client) throw new Error("Wallet not connected");
      return client;
    },
  };
}
