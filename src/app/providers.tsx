// src/app/providers.tsx
"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import of wagmi config to ensure it's only created client-side
const WagmiWrapper = dynamic(() => import("./wagmi-wrapper"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ai-primary"></div>
  </div>
});

function RKTheme({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    const dark = root.classList.contains("dark");
    setIsDark(dark);
    const obs = new MutationObserver(() =>
      setIsDark(root.classList.contains("dark"))
    );
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <RainbowKitProvider
      theme={isDark ? darkTheme() : lightTheme()}
      modalSize="compact"
      showRecentTransactions={false}
    >
      {children}
    </RainbowKitProvider>
  );
}

const qc = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      <WagmiWrapper>
        <RKTheme>{children}</RKTheme>
      </WagmiWrapper>
    </QueryClientProvider>
  );
}
