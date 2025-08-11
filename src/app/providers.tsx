"use client";
import { ReactNode, useMemo, useState } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

function RKTheme({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const rk = useMemo(() => (resolvedTheme === "dark" ? darkTheme() : lightTheme()), [resolvedTheme]);
  return <RainbowKitProvider theme={rk}>{children}</RainbowKitProvider>;
}

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RKTheme>{children}</RKTheme>
        </QueryClientProvider>
      </WagmiProvider>
    </NextThemesProvider>
  );
}
