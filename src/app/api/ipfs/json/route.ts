import { PinataSDK } from "pinata-web3";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const PINATA_JWT = process.env.PINATA_JWT;
    const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "ipfs.io";
    if (!PINATA_JWT) {
      return new Response("Missing PINATA_JWT", { status: 500 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const pinata = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY,
    });

    const up = await pinata.upload.json(body);
    const cid = up.IpfsHash;
    const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;

    return Response.json({ cid, url });
  } catch (e: any) {
    return new Response(String(e?.message || e), { status: 500 });
  }
}
