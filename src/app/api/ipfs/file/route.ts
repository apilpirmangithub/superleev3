import { NextRequest, NextResponse } from "next/server";
import PinataSDK from "pinata-web3";

export const runtime = "nodejs";       // pastikan Node runtime (bukan Edge)
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT!,           // contoh: "Bearer eyJ..."
      pinataGateway: process.env.PINATA_GATEWAY,    // contoh: "https://<sub>.mypinata.cloud/ipfs/"
    });

    // TS guard: cast ke any agar .get tidak error saat build
    const form: any = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // upload ke Pinata
    const up = await pinata.upload.file(file);
    const cid = up?.IpfsHash || up?.cid || up?.hash || up?.ipfsHash;
    if (!cid) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // bangun URL gateway (fallback ke ipfs.io)
    const base = (process.env.PINATA_GATEWAY || "https://ipfs.io/ipfs/").replace(/\/+$/, "");
    const url = base.includes("/ipfs/") ? `${base}/${cid}` : `${base}/ipfs/${cid}`;

    return NextResponse.json({ cid, url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload error" }, { status: 500 });
  }
}
