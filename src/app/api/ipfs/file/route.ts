import { NextResponse } from "next/server";
import { createHash } from "crypto";

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

    if (!(file instanceof File)) {
      return NextResponse.json({
        error: `Expected File, got ${file?.constructor?.name || typeof file}`
      }, { status: 400 });
    }

    // Mock IPFS upload for testing
    const buffer = await file.arrayBuffer();
    const hash = createHash('sha256').update(new Uint8Array(buffer)).digest('hex');
    const mockCid = `Qm${hash.substring(0, 44)}`;
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
