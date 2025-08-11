import { NextRequest } from "next/server";
import { PinataSDK } from "pinata-web3";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const pinata = new PinataSDK({ pinataJwt: process.env.PINATA_JWT!, pinataGateway: process.env.PINATA_GATEWAY });
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return new Response("No file", { status: 400 });

    const up = await pinata.upload.file(file);
    const cid = (up as any).IpfsHash || (up as any).cid || up;
    const url = process.env.PINATA_GATEWAY
      ? `https://${process.env.PINATA_GATEWAY}/ipfs/${cid}`
      : `https://ipfs.io/ipfs/${cid}`;

    return Response.json({ cid, url });
  } catch (e: any) {
    return new Response(e?.message || "upload error", { status: 500 });
  }
}