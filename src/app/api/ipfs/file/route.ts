import { NextResponse } from "next/server";
import { PinataSDK } from "pinata-web3";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const PINATA_JWT = process.env.PINATA_JWT;
    const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "ipfs.io";

    if (!PINATA_JWT || PINATA_JWT === "your_pinata_jwt_token_here") {
      return NextResponse.json({
        error: "PINATA_JWT environment variable not configured properly"
      }, { status: 500 });
    }

    const pinata = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY,
    });

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

    const up = await pinata.upload.file(file);
    const cid = up.IpfsHash;
    const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;

    console.log("File upload successful:", { cid, url });

    return NextResponse.json({ cid, url }, { status: 200 });
  } catch (e: any) {
    console.error("File upload error:", e);
    return NextResponse.json({
      error: e?.message || String(e),
      details: e?.stack?.split('\n')[0] || "Unknown error"
    }, { status: 500 });
  }
}
