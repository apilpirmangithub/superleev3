import { NextResponse } from "next/server";
import { keccak256, toHex } from "viem";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Baca persis string yang dikirim client (jangan parse-json dulu)
    const raw = await req.text();
    if (!raw) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    console.log("JSON upload attempt:", {
      bodyLength: raw.length,
      isValidJSON: (() => {
        try { JSON.parse(raw); return true; } catch { return false; }
      })()
    });

    // Keccak256 atas bytes yang PERSIS akan di-upload
    const bytes = new TextEncoder().encode(raw);
    const keccak = keccak256(toHex(bytes));

    // Mock IPFS upload for testing using Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const mockCid = `Qm${hashHex.substring(0, 44)}`;
    const url = `https://ipfs.io/ipfs/${mockCid}`;

    console.log("Mock JSON upload successful:", { cid: mockCid, url });

    // Simulate some upload delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json({ cid: mockCid, url, keccak }, { status: 200 });
  } catch (e: any) {
    console.error("JSON upload error:", e);
    return NextResponse.json({
      error: e?.message ?? String(e),
      details: e?.stack?.split('\n')[0] || "Unknown error"
    }, { status: 500 });
  }
}
