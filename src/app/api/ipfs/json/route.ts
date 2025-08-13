// src/app/api/ipfs/json/route.ts
import { PinataSDK } from "pinata-web3";

export const runtime = "nodejs";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

function buildGatewayUrl(cid: string) {
  const gw = process.env.PINATA_GATEWAY!;
  const host = gw.startsWith("http") ? gw.replace(/\/+$/, "") : `https://${gw}`;
  return `${host}/ipfs/${cid}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Upload JSON sebagai File (pinata-web3 tidak punya upload.json)
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    const file = new File([blob], "metadata.json", { type: "application/json" });

    const up = await pinata.upload.file(file);
    const cid = up.IpfsHash;
    const url = buildGatewayUrl(cid);

    return Response.json({
      cid,
      url,
      // alias kompatibilitas
      hash: cid,
      IpfsHash: cid,
      PinSize: up.PinSize,
      Timestamp: up.Timestamp,
    });
  } catch (e: any) {
    return new Response(e?.message || "Upload JSON error", { status: 500 });
  }
}
