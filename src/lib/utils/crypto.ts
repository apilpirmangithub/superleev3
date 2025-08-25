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
 * Calculate Keccak256 hash of a file (consistent with Story Protocol)
 */
export async function keccakOfFile(file: File): Promise<`0x${string}`> {
  const buf = await file.arrayBuffer();
  return bytesKeccak(new Uint8Array(buf));
}
