// src/components/Topbar.tsx
"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { erc721Abi } from "@/lib/abi/erc721";
import ThemeToggle from "@/components/ThemeToggle";

const SPG_COLLECTION =
  (process.env.NEXT_PUBLIC_SPG_COLLECTION as `0x${string}`) ||
  "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs">
      {children}
    </span>
  );
}

export default function Topbar() {
  const { address, isConnected } = useAccount();
  const { data: nativeBal } = useBalance({ address, query: { enabled: isConnected } });
  const { data: ipCount } = useReadContract({
    abi: erc721Abi,
    address: SPG_COLLECTION,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-transparent backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Superlee AI Agent</h1>
        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <Chip>
                <strong>{nativeBal?.formatted ? Number(nativeBal.formatted).toFixed(2) : "—"}</strong>
                <span className="opacity-70">{nativeBal?.symbol || "IP"}</span>
              </Chip>
              <Chip>
                <strong>{ipCount ? (ipCount as bigint).toString() : "—"}</strong>
                <span className="opacity-70">IP Registered</span>
              </Chip>
            </>
          )}
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
