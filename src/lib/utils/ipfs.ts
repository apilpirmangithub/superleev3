/**
 * Extract CID from various IPFS URL formats
 */
export function extractCid(u?: string): string {
  if (!u) return "";
  if (u.startsWith("ipfs://")) return u.slice(7);
  const m = u.match(/\/ipfs\/([^/?#]+)/i);
  return m?.[1] || u;
}

/**
 * Convert CID or IPFS URL to HTTPS URL
 */
export function toHttps(cidOrUrl?: string) {
  const cid = extractCid(cidOrUrl);
  return cid ? `https://ipfs.io/ipfs/${cid}` : "";
}

/**
 * Convert CID or IPFS URL to ipfs:// URI
 */
export function toIpfsUri(cidOrUrl?: string) {
  const cid = extractCid(cidOrUrl);
  return (`ipfs://${cid}`) as const;
}

/**
 * Enhanced fetch with JSON parsing and error handling
 */
export async function fetchJSON(input: RequestInfo | URL, init?: RequestInit) {
  const r = await fetch(input, init);
  const t = await r.text();
  if (!r.ok)
    throw new Error(
      `HTTP ${r.status}${r.statusText ? " " + r.statusText : ""}: ${t.slice(
        0,
        200
      )}`
    );
  try {
    return JSON.parse(t);
  } catch {
    throw new Error(`Server returned non-JSON: ${t.slice(0, 200)}`);
  }
}

/**
 * Upload file to IPFS via API route
 */
export async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append("file", file, file.name);
  return await fetchJSON("/api/ipfs/file", {
    method: "POST",
    body: fd,
  });
}

/**
 * Upload JSON to IPFS via API route
 */
export async function uploadJSON(obj: any) {
  return await fetchJSON("/api/ipfs/json", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(obj),
  });
}
