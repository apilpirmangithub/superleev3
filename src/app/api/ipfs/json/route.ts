import { NextRequest, NextResponse } from "next/server";
import PinataSDK from "pinata-web3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT!,
      pinataGateway: process.env.PINATA_GATEWAY,
    });

    const body = await req.json();

    // kirim sebagai Blob JSON (Node 18+ punya Blob)
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });

    // metadata opsional (nama file)
    const up = await pinata.upload.file(blob as any, {
      pinataMetadata: { name: "metadata.json" },
    });

    const cid = up?.IpfsHash || up?.cid || up?.hash || up?.ipfsHash;
    if (!cid) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const base = (process.env.PINATA_GATEWAY || "https://ipfs.io/ipfs/").replace(/\/+$/, "");
    const url = base.includes("/ipfs/") ? `${base}/${cid}` : `${base}/ipfs/${cid}`;

    return NextResponse.json({ cid, url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload error" }, { status: 500 });
  }
}
