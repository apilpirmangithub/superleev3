// src/app/providers.tsx
"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function RKTheme({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const dark = root.classList.contains("dark");
    setIsDark(dark);
    const obs = new MutationObserver(() =>
      setIsDark(root.classList.contains("dark"))
    );
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Error boundary for WalletConnect issues
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (error.message?.includes('WalletConnect') ||
          error.message?.includes('getRecomendedWallets') ||
          error.message?.includes('Cannot convert undefined or null to object')) {
        console.warn('WalletConnect error caught and handled:', error.message);
        setHasError(true);
        return true; // Prevent error from propagating
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    console.log('RainbowKit initialized with error recovery mode');
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

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on WalletConnect errors
        if (error?.message?.includes('WalletConnect') ||
            error?.message?.includes('getRecomendedWallets')) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={qc}>
        <RKTheme>{children}</RKTheme>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
