import { defineChain } from "viem";

// Get chain configuration from environment
const chainId = parseInt(process.env.NEXT_PUBLIC_STORY_CHAIN_ID || "1315");
const rpcUrl = process.env.NEXT_PUBLIC_STORY_RPC || "https://aeneid.storyrpc.io";

// Dynamic chain configuration based on environment
export const storyAeneid = defineChain({
  id: chainId,
  name: chainId === 1514 ? "Story Mainnet" : "Story Aeneid Testnet",
  nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: {
    default: {
      name: "StoryScan",
      url: chainId === 1514 ? "https://mainnet.storyscan.xyz" : "https://aeneid.storyscan.xyz"
    }
  },
});

// Keep mainnet export for compatibility
export const storyMainnet = defineChain({
  id: 1514,
  name: "Story Mainnet",
  nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.storyrpc.io"] } },
  blockExplorers: { default: { name: "StoryScan", url: "https://mainnet.storyscan.xyz" } },
});
