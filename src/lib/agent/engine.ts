// src/lib/agent/engine.ts
import { findTokenAddress, symbolFor } from "./tokens";

/** ===== Types ===== */
export type SwapIntent = {
  kind: "swap";
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amount: number;           // human units
  slippagePct?: number;     // optional
};

export type RegisterIntent = {
  kind: "register";
  title?: string;
  prompt?: string;
  license?: "by" | "by-nc" | "by-nd" | "by-sa" | "cc0" | "arr";
  pilType?: "open_use" | "non_commercial_remix" | "commercial_use" | "commercial_remix";
};

export type Ask = { type: "ask"; question: string };
export type Ok  = { type: "ok";  plan: string[]; intent: SwapIntent | RegisterIntent };
export type DecideResult = Ask | Ok;

/** ===== Helpers ===== */
const num = (s: string) => parseFloat(s.replace(/,/g, "."));
const pct = (s: string) => parseFloat(s.replace(/,/g, "."));

const RE_ADDR   = /0x[a-fA-F0-9]{40}/;
const RE_AMOUNT = /(\d[\d.,]*)/;
const RE_ARROW  = /(?:>|→|->|\sto\s|\ske\s)/i;
const RE_SLIP   = /(slip(?:page|ag[ei])?|slippage)\s*([0-9]+(?:[.,][0-9]+)?)\s*%?/i;

const TRIGGERS_SWAP = /\b(swap|tukar|convert|trade)\b/i;
const TRIGGERS_REG  = /\b(register|daftar|daftarkan|mint)\b.*\b(ip|ipa|nft)?\b/i;

function parseLicense(txt: string): RegisterIntent["license"] | undefined {
  const s = txt.toLowerCase();
  if (/\bcc0\b/.test(s)) return "cc0";
  if (/\bby-nc\b/.test(s)) return "by-nc";
  if (/\bby-nd\b/.test(s)) return "by-nd";
  if (/\bby-sa\b/.test(s)) return "by-sa";
  if (/\bby\b/.test(s))    return "by";
  if (/\barr\b|\ball rights reserved\b/.test(s)) return "arr";
  return undefined;
}
function parseTitle(txt: string): string | undefined {
  const m = txt.match(/(?:title|judul)\s*["“](.+?)["”]/i);
  return m?.[1];
}

/** ===== Parsers ===== */
function parseSwap(text: string): DecideResult | null {
  if (!TRIGGERS_SWAP.test(text)) return null;
  const s = text.trim();
  const re = new RegExp(
    String.raw`(?:swap|tukar|convert|trade)\s*${RE_AMOUNT.source}\s*([a-zA-Z0-9]+|${RE_ADDR.source})\s*${RE_ARROW.source}\s*([a-zA-Z0-9]+|${RE_ADDR.source})`,
    "i"
  );
  const m = s.match(re);
  const slipM = s.match(RE_SLIP);
  const slip = slipM ? pct(slipM[2]) : undefined;

  if (!m) {
    // alternatif: "WIP > USDC 1.2"
    const reAlt = new RegExp(
      String.raw`([a-zA-Z0-9]+|${RE_ADDR.source})\s*${RE_ARROW.source}\s*([a-zA-Z0-9]+|${RE_ADDR.source}).*?${RE_AMOUNT.source}`,
      "i"
    );
    const m2 = s.match(reAlt);
    if (!m2) return { type: "ask", question: "Format swap kurang jelas. Contoh: “Swap 1 WIP > USDC slippage 0.5%”" };

    const [, rawIn, rawOut, amountStr] = m2;
    const amount = num(amountStr);
    const aIn = findTokenAddress(rawIn);
    const aOut = findTokenAddress(rawOut);
    if (!aIn || !aOut || !isFinite(amount) || amount <= 0) {
      const miss = [
        !aIn ? "token in (alamat/simbol)" : null,
        !aOut ? "token out (alamat/simbol)" : null,
        (!isFinite(amount) || amount <= 0) ? "jumlah" : null,
      ].filter(Boolean).join(", ");
      return { type: "ask", question: `Butuh ${miss}. Contoh: “Swap 1 WIP > USDC slippage 0.5%”.` };
    }
    const plan = [
      `Parse: ${amount} ${symbolFor(aIn)} → ${symbolFor(aOut)}${slip != null ? ` (slippage ${slip}%)` : ""}`,
      "Ambil quote dari PiperX Aggregator",
      "Approve token in (jika perlu)",
      "Eksekusi swap via Aggregator",
      "Tampilkan tx hash & link explorer",
    ];
    return { type: "ok", plan, intent: { kind: "swap", tokenIn: aIn, tokenOut: aOut, amount, slippagePct: slip } };
  }

  const [, amountStr, rawIn, rawOut] = m;
  const amount = num(amountStr);
  const aIn = findTokenAddress(rawIn);
  const aOut = findTokenAddress(rawOut);
  if (!aIn || !aOut || !isFinite(amount) || amount <= 0) {
    const miss = [
      !aIn ? "token in (alamat/simbol)" : null,
      !aOut ? "token out (alamat/simbol)" : null,
      (!isFinite(amount) || amount <= 0) ? "jumlah" : null,
    ].filter(Boolean).join(", ");
    return { type: "ask", question: `Butuh ${miss}. Contoh: “Swap 1 WIP > USDC slippage 0.5%”.` };
  }
  const plan = [
    `Parse: ${amount} ${symbolFor(aIn)} → ${symbolFor(aOut)}${slip != null ? ` (slippage ${slip}%)` : ""}`,
    "Ambil quote dari PiperX Aggregator",
    "Approve token in (jika perlu)",
    "Eksekusi swap via Aggregator",
    "Tampilkan tx hash & link explorer",
  ];
  return { type: "ok", plan, intent: { kind: "swap", tokenIn: aIn, tokenOut: aOut, amount, slippagePct: slip } };
}

function parseRegister(text: string): DecideResult | null {
  if (!TRIGGERS_REG.test(text)) return null;
  const title = parseTitle(text);
  const license = parseLicense(text);

  let prompt = text.replace(TRIGGERS_REG, "");
  prompt = prompt.replace(/(?:title|judul)\s*["“].+?["”]/i, "").trim();

  const plan = [
    "Cek/ambil file gambar yang di-attach",
    "Upload file ke IPFS",
    "Bangun IP metadata (hash, prompt, creators, license opsional)",
    "Upload JSON metadata ke IPFS",
    "Mint + Register IP di Story (SPG collection)",
    "Tampilkan ipId & tx hash (+ link explorer)",
  ];
  return { type: "ok", plan, intent: { kind: "register", title, prompt, license } };
}

/** ===== Entry ===== */
export function decide(text: string): DecideResult {
  const s = text.trim();
  if (!s) return { type: "ask", question: "Tulis perintahnya, contoh: “Swap 1 WIP > USDC slippage 0.5%” atau “Register this image IP, title \"Sunset\" by-nc”" };

  const iSwap = s.search(TRIGGERS_SWAP);
  const iReg  = s.search(TRIGGERS_REG);

  if (iSwap >= 0 && (iReg < 0 || iSwap < iReg)) {
    const r = parseSwap(s);
    if (r) return r;
  }
  if (iReg >= 0) {
    const r = parseRegister(s);
    if (r) return r;
  }

  if (RE_ARROW.test(s)) {
    const r = parseSwap(`swap ${s}`);
    if (r) return r;
  }

  return { type: "ask", question: "Aku bisa *swap* token (PiperX) atau *register IP* (Story). Contoh: “Swap 1 WIP > USDC slippage 0.5%” atau “Register this image IP, title \"Sunset\" by-nc”" };
}
