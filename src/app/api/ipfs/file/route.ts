import { NextResponse } from "next/server";
import { PinataSDK } from "pinata-web3";

export const runtime = "edge";

export async function POST(req: Request) {
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

    const fd = await req.formData();
    const file = fd.get("file") as File;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const up = await pinata.upload.file(file);
    const cid = up.IpfsHash;
    const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;

    return NextResponse.json({ cid, url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
