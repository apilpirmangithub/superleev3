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
 * Simple fetch with JSON parsing and error handling (no retry)
 */
export async function fetchJSON(input: RequestInfo | URL, init?: RequestInit) {
  const r = await fetch(input, init);
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(`HTTP ${r.status}: ${errorText}`);
  }
  return await r.json(); // ✅ Langsung parse JSON
}

/**
 * Upload file to IPFS via API route (no retry mechanism)
 */
export async function uploadFile(file: File) {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  const fd = new FormData();
  fd.append("file", file, file.name);

  return await fetchJSON("/api/ipfs/file", {
    method: "POST",
    body: fd,
  });
}

/**
 * Upload JSON to IPFS via API route (no retry mechanism)
 */
export async function uploadJSON(obj: any) {
  if (!obj) {
    throw new Error("No object provided for upload");
  }

  return await fetchJSON("/api/ipfs/json", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(obj),
  });
}
