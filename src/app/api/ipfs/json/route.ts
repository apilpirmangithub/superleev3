// src/app/api/ipfs/json/route.ts
import { NextRequest } from "next/server";
import { PinataSDK } from "pinata-web3";

export const runtime = "nodejs";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // pinata-web3 doesn’t have `upload.json`, so wrap as a File
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    const file = new File([blob], "metadata.json", { type: "application/json" });

    const up = await pinata.upload.file(file);
    const cid = up.IpfsHash;
    const url = `https://${process.env.PINATA_GATEWAY}/ipfs/${cid}`;

    return Response.json({
      cid,
      url,
      hash: cid,        // for your Story call (ipMetadataHash/nftMetadataHash mapping)
      IpfsHash: cid,
      PinSize: up.PinSize,
      Timestamp: up.Timestamp,
    });
  } catch (e: any) {
    return new Response(e?.message || "Upload JSON error", { status: 500 });
  }
}
