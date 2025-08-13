"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { decide } from "@/lib/agent/engine";
import { getDecimals, getQuote, approveForAggregator, swapViaAggregator } from "@/lib/piperx";
import { useStoryClient } from "@/lib/storyClient";
import { storyAeneid } from "@/lib/chains/story";
import { Paperclip, Check, X, Send } from "lucide-react";
import { parseUnits, toHex } from "viem";

/* ---------- utils: hash ---------- */
async function sha256HexOfFile(file: File): Promise<`0x${string}`> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return toHex(new Uint8Array(hash), { size: 32 });
}

/* ---------- utils: IPFS URL helpers ---------- */
function extractCid(u?: string): string {
  if (!u) return "";
  if (u.startsWith("ipfs://")) return u.slice(7);
  const m = u.match(/\/ipfs\/([^/?#]+)/i);
  if (m?.[1]) return m[1];
  return u;
}
function toHttps(cidOrUrl?: string) {
  if (!cidOrUrl) return "";
  const cid = extractCid(cidOrUrl);
  return `https://ipfs.io/ipfs/${cid}`;
}
function toIpfsUri(cidOrUrl?: string) {
  if (!cidOrUrl) return "" as const;
  const cid = extractCid(cidOrUrl);
  return `ipfs://${cid}` as const;
}

/* ---------- utils: fetch JSON dengan pesan error enak ---------- */
async function fetchJSON(input: RequestInfo | URL, init?: RequestInit) {
  const r = await fetch(input, init);
  const text = await r.text();
  if (!r.ok) {
    const head = text?.slice(0, 200);
    throw new Error(`HTTP ${r.status}${r.statusText ? " " + r.statusText : ""}: ${head}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server returned non-JSON: ${text?.slice(0, 200)}`);
  }
}

/* ---------- utils: kompres gambar sebelum upload ---------- */
async function compressImage(
  file: File,
  opts: { maxDim?: number; quality?: number; targetMaxBytes?: number } = {}
): Promise<File> {
  const { maxDim = 1600, quality = 0.85, targetMaxBytes = 3.5 * 1024 * 1024 } = opts;
  if (file.size <= targetMaxBytes) return file;

  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);

  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b as Blob), "image/webp", quality)
  );
  const name = (file.name.replace(/\.\w+$/, "") || "image") + ".webp";
  return new File([blob], name, { type: "image/webp" });
}

type Msg = { role: "you" | "agent"; text: string; ts: number };

export default function PromptAgent() {
  const { isConnected, address } = useAccount();
  const { getClient } = useStoryClient();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [plan, setPlan] = useState<string[] | null>(null);
  const [intent, setIntent] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const explorerBase = storyAeneid.blockExplorers?.default.url || "https://aeneid.storyscan.xyz";

  function push(role: Msg["role"], text: string) {
    setMessages((m) => [...m, { role, text, ts: Date.now() }]);
  }
  function clearPlan() {
    setPlan(null);
    setIntent(null);
    setStatus("");
  }
  function onPickFile(f?: File) {
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }
  function removeFile() {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }
  function handleAutoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }
  async function ensureAeneid() {
    if (chainId !== 1315) {
      try {
        await switchChainAsync({ chainId: 1315 });
      } catch {
        /* user mungkin cancel */
      }
    }
  }

  // effects
  useEffect(() => { if (taRef.current) handleAutoGrow(taRef.current); }, [prompt]);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { try { const s = localStorage.getItem("agentMessages"); if (s) setMessages(JSON.parse(s)); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("agentMessages", JSON.stringify(messages)); } catch {} }, [messages]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // actions
  function onRun() {
    const p = prompt.trim();
    if (!p) return;
    push("you", p);
    setStatus("");
    const d = decide(p);
    if (d.type === "ask") {
      setPlan(null);
      setIntent(null);
      push("agent", d.question);
      setStatus(d.question);
      return;
    }
    setPlan(d.plan);
    setIntent(d.intent);
    push("agent", ["Plan:", ...d.plan.map((s: string, i: number) => `${i + 1}. ${s}`)].join("\n"));
  }

  async function onConfirm() {
    if (!intent) return;

    if (intent.kind === "swap") {
      try {
        setStatus("Fetching quote...");
        const dec = await getDecimals(intent.tokenIn as `0x${string}`);
        const amountRaw = parseUnits(String(intent.amount), dec);

        const q = await getQuote({
          tokenIn: intent.tokenIn,
          tokenOut: intent.tokenOut,
          amountInRaw: amountRaw.toString(),
          slippagePct: intent.slippagePct,
        });

        setStatus("Approving...");
        await approveForAggregator(intent.tokenIn as `0x${string}`, amountRaw);

        setStatus("Swapping...");
        const tx = await swapViaAggregator(q.universalRoutes);

        setStatus("Done");
        push("agent", `Swap success ✅
From: ${intent.tokenIn}
To: ${intent.tokenOut}
Amount: ${intent.amount}
Tx: ${tx.hash}
↗ View: ${explorerBase}/tx/${tx.hash}`);
        setToast("Swap success ✅");
        clearPlan();
      } catch (e: any) {
        push("agent", `Swap error: ${e?.message || String(e)}`);
        setToast("Swap error ❌");
      }
      return;
    }

    if (intent.kind === "register") {
      try {
        if (!file) {
          setStatus("Butuh gambar. Klik ikon attach.");
          setToast("Attach image dulu 📎");
          return;
        }

        await ensureAeneid();

        // 1) Kompres jika besar, lalu upload
        setStatus("Optimizing image…");
        const fileToUpload = await compressImage(file);

        setStatus("Upload image...");
        const fd = new FormData();
        fd.append("file", fileToUpload, fileToUpload.name);

        const upFile = await fetchJSON("/api/ipfs/file", { method: "POST", body: fd });
        const imageCid = extractCid(upFile.cid || upFile.IpfsHash || upFile.url);
        const imageGateway = toHttps(imageCid);
        const fileSha256 = await sha256HexOfFile(fileToUpload);

        // 2) IP metadata → upload via server (server menghitung keccak)
        const ipMeta = {
          title: intent.title || fileToUpload.name,
          description: intent.prompt || "",
          image: imageGateway,
          imageHash: fileSha256,
          mediaUrl: imageGateway,
          mediaHash: fileSha256,
          mediaType: fileToUpload.type || "image/webp",
          creators: address ? [{ name: address, address, contributionPercent: 100 }] : [],
          aiMetadata: intent.prompt ? { prompt: intent.prompt, generator: "user", model: "rule-based" } : undefined,
        };

        setStatus("Upload IP metadata...");
        const upMeta = await fetchJSON("/api/ipfs/json", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(ipMeta),
        });
        const ipMetaCid = extractCid(upMeta.cid || upMeta.IpfsHash || upMeta.url);
        const ipMetadataURI = toIpfsUri(ipMetaCid);
        const ipMetadataHash = upMeta.keccak as `0x${string}`; // ✅ pakai hash dari server

        // 3) NFT metadata (pointer ipfs:// ke IP meta) → upload via server
        const nftMeta = {
          name: `IP Ownership — ${ipMeta.title}`,
          description: "Ownership NFT for IP Asset",
          image: imageGateway,
          ipMetadataURI,
          attributes: [{ trait_type: "ip_metadata_uri", value: ipMetadataURI }],
        };

        setStatus("Upload NFT metadata...");
        const upNft = await fetchJSON("/api/ipfs/json", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(nftMeta),
        });
        const nftMetaCid = extractCid(upNft.cid || upNft.IpfsHash || upNft.url);
        const nftMetadataURI = toIpfsUri(nftMetaCid);
        const nftMetadataHash = upNft.keccak as `0x${string}`; // ✅ pakai hash dari server

        // 4) Register on Story
        setStatus("Register on Story...");
        const client = await getClient();
        const res = await client.ipAsset.mintAndRegisterIp({
          spgNftContract:
            (process.env.NEXT_PUBLIC_SPG_COLLECTION ||
              "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc") as `0x${string}`,
          recipient: address as `0x${string}`,
          ipMetadata: {
            ipMetadataURI,
            ipMetadataHash,
            nftMetadataURI,
            nftMetadataHash,
          },
          allowDuplicates: true,
        });

        setStatus("Done");
        push(
          "agent",
          `Register success ✅
ipId: ${res.ipId}
Tx: ${res.txHash}
Image: ${imageGateway}
IP Metadata: ${toHttps(ipMetaCid)}
NFT Metadata: ${toHttps(nftMetaCid)}
↗ View: ${explorerBase}/tx/${res.txHash}`
        );
        setToast("IP registered ✅");
        clearPlan();
      } catch (e: any) {
        push("agent", `Register error: ${e?.message || String(e)}`);
        setToast("Register error ❌");
      }
    }
  }

  const canSend = isConnected && prompt.trim().length > 0;

  // UI
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
      {/* HISTORY LEFT */}
      <aside className="card h-[360px] overflow-auto scrollbar-invisible">
        <div className="text-sm text-white/70 mb-2">History</div>
        <ul className="space-y-2 pr-1">
          {messages
            .filter((m: Msg) => m.role === "you")
            .map((m: Msg, i: number) => (
              <li key={i} className="text-sm text-white/90">
                {m.text}
              </li>
            ))}
        </ul>
      </aside>

      {/* CHAT + PROMPT RIGHT */}
      <section className="space-y-4">
        <div ref={chatRef} className="card h-[360px] overflow-auto scrollbar-invisible">
          {messages.length === 0 ? (
            <div className="text-xs text-white/50">
              AI replies will appear here. Try:{" "}
              <span className="badge">Swap 1 WIP &gt; USDC slippage 0.5%</span> or{" "}
              <span className="badge">Register this image IP, title "Sunset" by-nc</span>.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m: Msg, i: number) => (
                <div key={i} className={`flex ${m.role === "you" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 border ${
                      m.role === "you" ? "bg-sky-500/15 border-sky-400/30" : "bg-white/6 border-white/10"
                    }`}
                  >
                    <pre className="whitespace-pre-wrap text-sm break-words">{m.text}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PROMPT BAR + MASCOT */}
        <div className="card relative overflow-visible space-y-3">
          <div className="flex items-end gap-2">
            {/* ATTACH */}
            <button
              aria-label="Attach image"
              title="Attach Image (for Register IP)"
              className="p-2 rounded-xl text-white/70 hover:text-white bg-transparent hover:bg-white/10 focus:bg-white/10 active:bg-white/20 transition"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] || undefined)}
            />

            {/* TEXTAREA */}
            <textarea
              ref={taRef}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-lg placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/40 scrollbar-invisible"
              placeholder='Swap 1 WIP > USDC slippage 0.5%  |  Register this image IP, title "Sunset" by-nc'
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                handleAutoGrow(e.currentTarget);
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.ctrlKey || e.metaKey) && onRun()}
            />

            {/* SEND */}
            <button
              className="p-2 rounded-xl bg-sky-500/90 hover:bg-sky-400 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              onClick={onRun}
              disabled={!canSend}
              title={!isConnected ? "Connect wallet to send" : !prompt.trim() ? "Type a prompt" : "Send (Ctrl/⌘+Enter)"}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          {/* Preview & status */}
          <div className="flex items-center gap-3">
            {previewUrl && (
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="preview" className="h-8 w-8 rounded-md object-cover" />
                <button
                  className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs"
                  onClick={removeFile}
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {status && <span className="text-xs text-white/60">{status}</span>}
          </div>

          {/* Mascot */}
          <Image
            src="/brand/superlee-sprite.png"
            alt=""
            width={280}
            height={280}
            priority
            className="
              pointer-events-none select-none pixelated animate-float
              absolute -top-2 -right-2 z-10
              w-[clamp(40px,8vmin,96px)]
              opacity-80 sm:opacity-90
              drop-shadow-[0_10px_28px_rgba(34,211,238,.35)]
            "
          />
        </div>

        {/* Plan & actions */}
        {plan && (
          <div className="card space-y-3">
            <div className="text-sm text-white/70">Plan</div>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              {plan.map((p: string, i: number) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
            <div className="flex gap-2">
              <button
                className="rounded-2xl bg-sky-500/90 hover:bg-sky-400 text-white px-4 py-2 inline-flex items-center gap-2"
                onClick={onConfirm}
              >
                <Check className="h-4 w-4" /> Confirm
              </button>
              <button className="rounded-2xl border border-white/10 px-4 py-2 inline-flex items-center gap-2" onClick={clearPlan}>
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-black/70 border border-white/10 px-4 py-3 text-sm shadow-glow">
          {toast}
        </div>
      )}
    </div>
  );
}
