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

// WalletConnect Project ID (set di .env lokal & Vercel)
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "demo";

// RPC Story (boleh override)
const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ||
  storyAeneid.rpcUrls?.default?.http?.[0] ||
  "https://aeneid.storyrpc.io";

// Create connectors function that only runs on client-side
function createConnectors() {
  // Only create WalletConnect if we're in browser environment
  const wallets = [injectedWallet, rabbyWallet, coinbaseWallet];

  // Only add WalletConnect on client-side to prevent SSR issues
  if (typeof window !== 'undefined') {
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
      projectId,
    }
  );
}

// Wagmi config with client-side connector initialization
export const wagmiConfig = createConfig({
  chains: [storyAeneid],
  connectors: createConnectors(),
  transports: {
    [storyAeneid.id]: http(rpcUrl),
  },
  ssr: true,
});
