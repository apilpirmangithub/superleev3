// src/app/api/ipfs/file/route.ts
import { NextRequest } from "next/server";
import { PinataSDK } from "pinata-web3";

export const runtime = "nodejs";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,            // set in .env(.local) & Vercel
  pinataGateway: process.env.PINATA_GATEWAY!,    // e.g. "your-gw.mypinata.cloud"
});

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return new Response("No file", { status: 400 });
    }

    // pinata-web3 returns { IpfsHash, PinSize, Timestamp }
    const up = await pinata.upload.file(file);
    const cid = up.IpfsHash;
    const url = `https://${process.env.PINATA_GATEWAY}/ipfs/${cid}`;

    return Response.json({
      cid,
      url,
      hash: cid,        // keep backward-compat for your frontend
      IpfsHash: cid,    // raw field from SDK
      PinSize: up.PinSize,
      Timestamp: up.Timestamp,
    });
  } catch (e: any) {
    return new Response(e?.message || "Upload error", { status: 500 });
  }
}
