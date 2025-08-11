export type TokenEntry = {
  symbol: string;
  address: `0x${string}`;
  aliases?: string[]; // lowercase
};

// Helper ambil dari env
const env = (k: string) => process.env[k] as `0x${string}` | undefined;
const isAddr = (s: string): s is `0x${string}` =>
  /^0x[a-fA-F0-9]{40}$/.test(s);

// Buat daftar token dari ENV agar fleksibel antar jaringan
// Tambahkan ENV bila perlu: NEXT_PUBLIC_TOKEN_USDC, NEXT_PUBLIC_TOKEN_WETH, dll.
const TOKENS_RAW: (TokenEntry | undefined)[] = [
  env("NEXT_PUBLIC_PIPERX_WIP") && {
    symbol: "WIP",
    address: env("NEXT_PUBLIC_PIPERX_WIP")!,
    aliases: ["ip", "native", "wrap ip", "wrapped ip", "wip"],
  },
  env("NEXT_PUBLIC_TOKEN_USDC") && {
    symbol: "USDC",
    address: env("NEXT_PUBLIC_TOKEN_USDC")!,
    aliases: ["usdc", "usd c", "stable", "dollar"],
  },
  env("NEXT_PUBLIC_TOKEN_WETH") && {
    symbol: "WETH",
    address: env("NEXT_PUBLIC_TOKEN_WETH")!,
    aliases: ["eth", "weth", "wrapped eth"],
  },
];

export const TOKENS: TokenEntry[] = TOKENS_RAW.filter(Boolean) as TokenEntry[];

export function findTokenAddress(input: string): `0x${string}` | null {
  const s = input.trim().toLowerCase();
  if (isAddr(s)) return s as `0x${string}`;

  // match symbol or alias
  for (const t of TOKENS) {
    if (t.symbol.toLowerCase() === s) return t.address;
    if (t.aliases?.some((a) => a === s)) return t.address;
  }
  return null;
}

export function symbolFor(address: string): string {
  const t = TOKENS.find((x) => x.address.toLowerCase() === address.toLowerCase());
  return t?.symbol || address;
}
