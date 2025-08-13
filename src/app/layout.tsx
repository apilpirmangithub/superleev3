// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Providers from "./providers";
import Topbar from "@/components/Topbar";

export const metadata: Metadata = {
  title: "Superlee AI Agent",
  description: "Swap via PiperX + Register IP on Story",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
  ],
  other: { "color-scheme": "light dark" },
};

// Inline script untuk set class "dark" SEBELUM hydrate (anti kedip)
function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(()=>{try{var t=localStorage.getItem("theme");
var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle("dark",d)}catch(e){}})();`,
      }}
    />
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh">
        <ThemeScript />
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
