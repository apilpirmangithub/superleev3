import { NextRequest } from "next/server";
import { PinataSDK } from "pinata-web3";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const pinata = new PinataSDK({ pinataJwt: process.env.PINATA_JWT!, pinataGateway: process.env.PINATA_GATEWAY });
    const body = await req.json();

    const up = await pinata.upload.json(body);
    const cid = (up as any).IpfsHash || (up as any).cid || up;
    const url = process.env.PINATA_GATEWAY
      ? `https://${process.env.PINATA_GATEWAY}/ipfs/${cid}`
      : `https://ipfs.io/ipfs/${cid}`;

    const hash = `0x${crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex")}`;

    return Response.json({ cid, url, hash });
  } catch (e: any) {
    return new Response(e?.message || "upload error", { status: 500 });
  }
}