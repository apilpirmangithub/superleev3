"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function HomePage() {
  const { address, isConnected } = useAccount();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">
          SuperLee AI Agent 🤖
        </h1>
        
        <p className="text-lg text-muted-foreground">
          AI-powered dApp for Story Chain - Token Swap & IP Registration
        </p>

        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
          <ConnectButton />
          
          {isConnected && (
            <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <p className="text-green-800 dark:text-green-200">
                ✅ Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold">🔄 Token Swap</h3>
            <p className="text-sm text-muted-foreground">
              Swap tokens via PiperX Aggregator
            </p>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold">📋 IP Registration</h3>
            <p className="text-sm text-muted-foreground">
              Register IP on Story Protocol
            </p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Environment loaded: ✅</p>
          <p>Chain ID: {process.env.NEXT_PUBLIC_STORY_CHAIN_ID}</p>
          <p>RPC: {process.env.NEXT_PUBLIC_STORY_RPC}</p>
        </div>
      </div>
    </div>
  );
}
