// src/app/api/ipfs/file/route.ts
import { PinataSDK } from "pinata-web3";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const PINATA_JWT = process.env.PINATA_JWT;
    const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "ipfs.io";
    if (!PINATA_JWT) {
      return NextResponse.json({ error: "Missing PINATA_JWT" }, { status: 500 });
    }

    const pinata = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY,
    });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No valid file provided" }, { status: 400 });
    }

    const upload = await pinata.upload.file(file);
    const cid = upload.IpfsHash;
    const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;

    return NextResponse.json({ cid, url });
  } catch (error: any) {
    console.error("IPFS upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
