// src/app/api/ipfs/file/route.ts
import { PinataSDK } from "pinata-web3";

export const runtime = "nodejs";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,          // contoh: "Bearer eyJ..."
  pinataGateway: process.env.PINATA_GATEWAY!,  // contoh: "your-sub.mypinata.cloud" (tanpa http)
});

function buildGatewayUrl(cid: string) {
  const gw = process.env.PINATA_GATEWAY!;
  const host = gw.startsWith("http") ? gw.replace(/\/+$/, "") : `https://${gw}`;
  return `${host}/ipfs/${cid}`;
}

export async function POST(req: Request) {
  try {
    // ✅ CAST ke any supaya TS tidak protes .get saat build Vercel
    const form: any = await req.formData();
    const maybeFile = form?.get?.("file") ?? null;
    const file = (maybeFile instanceof File) ? (maybeFile as File) : null;

    if (!file) {
      return new Response("No file", { status: 400 });
    }

    // pinata-web3 → { IpfsHash, PinSize, Timestamp }
    const up = await pinata.upload.file(file);
    const cid = up.IpfsHash;
    const url = buildGatewayUrl(cid);

    return Response.json({
      cid,
      url,
      // alias untuk kompatibilitas kode frontend kamu:
      hash: cid,
      IpfsHash: cid,
      PinSize: up.PinSize,
      Timestamp: up.Timestamp,
    });
  } catch (e: any) {
    return new Response(e?.message || "Upload error", { status: 500 });
  }
}
