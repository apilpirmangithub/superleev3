import { NextResponse } from "next/server";
import { PinataSDK, type PinResponse } from "pinata-web3";
import { keccak256, toHex } from "viem";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const PINATA_JWT = process.env.PINATA_JWT;
    const PINATA_GATEWAY = process.env.PINATA_GATEWAY;

    if (!PINATA_JWT || PINATA_JWT === "your_pinata_jwt_token_here") {
      return NextResponse.json({
        error: "PINATA_JWT environment variable not configured properly"
      }, { status: 500 });
    }

    // Baca persis string yang dikirim client (jangan parse-json dulu)
    const raw = await req.text();
    if (!raw) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    console.log("JSON upload attempt:", {
      bodyLength: raw.length,
      isValidJSON: (() => {
        try { JSON.parse(raw); return true; } catch { return false; }
      })()
    });

    // Keccak256 atas bytes yang PERSIS akan di-upload
    const bytes = new TextEncoder().encode(raw);
    const keccak = keccak256(toHex(bytes));

    const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY });

    // Upload EXACT bytes sebagai file JSON
    const file = new File([raw], "metadata.json", { type: "application/json" });
    const up: PinResponse = await pinata.upload.file(file);

    const cid = up.IpfsHash; // Pinata format
    const url =
      (PINATA_GATEWAY ? `https://${PINATA_GATEWAY}` : "https://ipfs.io") + `/ipfs/${cid}`;

    console.log("JSON upload successful:", { cid, url });

    return NextResponse.json({ cid, url, keccak }, { status: 200 });
  } catch (e: any) {
    console.error("JSON upload error:", e);
    return NextResponse.json({
      error: e?.message ?? String(e),
      details: e?.stack?.split('\n')[0] || "Unknown error"
    }, { status: 500 });
  }
}
