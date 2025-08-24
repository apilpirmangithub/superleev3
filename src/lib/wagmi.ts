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
import { validateEnvironmentOrThrow } from "@/lib/utils/env-validation";

// Only validate environment on client side to avoid SSR issues
if (typeof window !== 'undefined') {
  validateEnvironmentOrThrow();
}

// WalletConnect Project ID (REQUIRED for production deployment)
const projectId = (() => {
  const id = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

  if (!id) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'NEXT_PUBLIC_WC_PROJECT_ID is required for production deployment. ' +
        'Get your project ID from https://cloud.walletconnect.com'
      );
    }
    console.warn(
      '⚠️  NEXT_PUBLIC_WC_PROJECT_ID not set. Using demo mode for development. ' +
      'For production, get your project ID from https://cloud.walletconnect.com'
    );
    return "demo";
  }

  if (id === "demo") {
    console.warn(
      '⚠️  Using "demo" as WalletConnect project ID. ' +
      'This may cause issues in production. Get a real project ID from https://cloud.walletconnect.com'
    );
  }

  return id;
})();

// RPC Story (boleh override)
const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ||
  storyAeneid.rpcUrls?.default?.http?.[0] ||
  "https://aeneid.storyrpc.io";

// ✅ RainbowKit v2: pass fungsi wallet (CreateWalletFn), bukan hasil pemanggilan
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        injectedWallet,
        rabbyWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: "Superlee AI Agent",
    projectId,
  }
);

// Create wagmi config function to call on client side only
function createWagmiConfig() {
  return createConfig({
    chains: [storyAeneid],
    connectors,
    transports: {
      [storyAeneid.id]: http(rpcUrl),
    },
    ssr: true,
  });
}

// Export wagmi config - will be created client-side only
export const wagmiConfig = typeof window !== 'undefined' ? createWagmiConfig() : null as any;
