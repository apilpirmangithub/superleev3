// src/lib/wagmi.ts
import { createConfig, http } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  walletConnectWallet,
  coinbaseWallet,
  rabbyWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { storyAeneid } from "@/lib/chains/story";

// WalletConnect Project ID (optional)
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

// RPC Story (boleh override)
const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ||
  storyAeneid.rpcUrls?.default?.http?.[0] ||
  "https://aeneid.storyrpc.io";

// Create client-safe connectors (WalletConnect only with valid project ID)
function getConnectors() {
  const wallets = [
    injectedWallet,
    rabbyWallet,
    coinbaseWallet,
  ];

  // Only add WalletConnect on client-side with valid project ID
  if (typeof window !== "undefined" && projectId && projectId !== "demo") {
    wallets.push(walletConnectWallet);
  }

  return connectorsForWallets(
    [
      {
        groupName: "Recommended",
        wallets,
      },
    ],
    {
      appName: "Superlee AI Agent",
      projectId: projectId || "fallback-demo-id",
    }
  );
}

// Wagmi config
export const wagmiConfig = createConfig({
  chains: [storyAeneid],
  connectors: getConnectors(),
  transports: {
    [storyAeneid.id]: http(rpcUrl),
  },
  ssr: true,
});
