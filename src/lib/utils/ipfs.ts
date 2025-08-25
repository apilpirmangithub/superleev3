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
 * Retry helper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw new Error(`Upload failed after ${maxRetries + 1} attempts: ${lastError.message}`);
      }

      // Exponential backoff: 1s, 2s, 4s...
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Upload file to IPFS via API route with retry mechanism
 */
export async function uploadFile(file: File) {
  if (!file) {
    throw new Error("No file provided for upload");
  }

  return withRetry(async () => {
    // Create fresh FormData for each attempt to avoid "body stream already read" error
    const fd = new FormData();
    fd.append("file", file, file.name);

    const response = await fetch("/api/ipfs/file", {
      method: "POST",
      body: fd,
    });

    // Clone response to avoid "body stream already read" error on retry
    const responseClone = response.clone();
    const text = await responseClone.text();

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}${response.statusText ? " " + response.statusText : ""}: ${text.slice(0, 200)}`
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Server returned non-JSON: ${text.slice(0, 200)}`);
    }
  });
}

/**
 * Upload JSON to IPFS via API route with retry mechanism
 */
export async function uploadJSON(obj: any) {
  return withRetry(async () => {
    return await fetchJSON("/api/ipfs/json", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(obj),
    });
  });
}
