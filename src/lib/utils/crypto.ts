import { toHex, keccak256 } from "viem";

/**
 * Hash data using Keccak256
 */
export function bytesKeccak(data: Uint8Array): `0x${string}` {
  return keccak256(toHex(data)) as `0x${string}`;
}

/**
 * Hash JSON object using Keccak256
 */
export async function keccakOfJson(obj: any): Promise<`0x${string}`> {
  return bytesKeccak(new TextEncoder().encode(JSON.stringify(obj)));
}

/**
 * Calculate SHA-256 hash of a file
 */
export async function sha256HexOfFile(file: File): Promise<`0x${string}`> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return toHex(new Uint8Array(hash), { size: 32 });
}
