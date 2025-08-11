import "./globals.css";
import { ReactNode } from "react";
import Providers from "./providers";
import Topbar from "@/components/Topbar";
import ThemeColorMetaSync from "@/components/ThemeColorMetaSync";

export const metadata = {
  title: "Superlee AI Agent",
  description: "Swap via PiperX + Register IP on Story",
  // Status bar / browser UI color — responsif ke system theme
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fafc" }, // light bg
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },  // dark bg
  ],
  // (opsional) Safari iOS
  other: {
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Sinkronkan <meta name="theme-color"> saat user toggle light/dark */}
        <ThemeColorMetaSync light="#f7fafc" dark="#0b0f1a" />

        <Providers>
          <div className="relative min-h-dvh">
            {/* === FULL-SCREEN BACKGROUND === */}
            <div
              className="hero-layer pixelated animate-kenburns opacity-30"
              style={{
                backgroundImage: `
                  image-set(
                    url("/brand/superlee-bg-1280.webp") type("image/webp") 1x,
                    url("/brand/superlee-bg-1600.webp") type("image/webp") 1.25x,
                    url("/brand/superlee-bg-1920.webp") type("image/webp") 1.5x
                  )
                `,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="hero-vignette" />

            {/* overlay grid/efek lain (opsional) */}
            <div className="ai-grid absolute inset-0 pointer-events-none" />

            {/* === CONTENT === */}
            <main className="relative z-10 max-w-6xl mx-auto p-6 space-y-8">
              <Topbar />
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
