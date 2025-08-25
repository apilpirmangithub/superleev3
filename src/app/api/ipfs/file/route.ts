import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const file = fd.get("file") as File;

    console.log("File upload attempt:", {
      hasFile: !!file,
      fileType: file?.constructor?.name,
      fileName: file?.name,
      fileSize: file?.size
    });

    if (!file) {
      return NextResponse.json({ error: "No file field in FormData" }, { status: 400 });
    }

    // Better File detection for Edge Runtime
    if (!file || typeof file.arrayBuffer !== 'function' || !file.name) {
      return NextResponse.json({
        error: `Expected File, got ${file?.constructor?.name || typeof file}`
      }, { status: 400 });
    }

    // Mock IPFS upload for testing using Web Crypto API
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const mockCid = `Qm${hashHex.substring(0, 44)}`;
    const url = `https://ipfs.io/ipfs/${mockCid}`;

    console.log("Mock file upload successful:", { cid: mockCid, url, fileName: file.name });

    // Simulate some upload delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({ cid: mockCid, url }, { status: 200 });
  } catch (e: any) {
    console.error("File upload error:", e);
    return NextResponse.json({
      error: e?.message || String(e),
      details: e?.stack?.split('\n')[0] || "Unknown error"
    }, { status: 500 });
  }
}
