// src/lib/wagmi.ts
import { createConfig, http } from "wagmi";
import { metaMask, walletConnect } from "wagmi/connectors";
import { storyAeneid } from "@/lib/chains/story";

export const wagmiConfig = createConfig({
  chains: [storyAeneid],
  transports: { [storyAeneid.id]: http(process.env.NEXT_PUBLIC_STORY_RPC) },
  connectors: [
    metaMask(), // ← hapus shimDisconnect
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "demo" }),
  ],
  ssr: true,
});
