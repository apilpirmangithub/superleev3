import { custom } from "viem";
import { useWalletClient } from "wagmi";
import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";

export function useStoryClient() {
  const { data: wallet } = useWalletClient();

  async function getClient() {
    if (!wallet) throw new Error("Wallet not connected");
    const config: StoryConfig = {
      wallet,
      transport: custom(wallet.transport),
      chain: "aeneid", // flip to "mainnet" when ready
    } as any;
    return StoryClient.newClient(config);
  }

  return { getClient };
}