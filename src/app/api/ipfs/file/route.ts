// src/app/api/ipfs/file/route.ts
import { PinataSDK } from "pinata-web3";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const PINATA_JWT = process.env.PINATA_JWT;
    const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "ipfs.io";
    if (!PINATA_JWT) {
      return NextResponse.json({ error: "Missing PINATA_JWT" }, { status: 500 });
    }

    const pinata = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY,
    });

    // Read the raw request body as binary data
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 });
    }

    // Get the raw body as ArrayBuffer
    const arrayBuffer = await req.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Parse the multipart data manually
    const boundary = contentType.split("boundary=")[1];
    if (!boundary) {
      return NextResponse.json({ error: "No boundary found in Content-Type" }, { status: 400 });
    }

    const boundaryBytes = new TextEncoder().encode(`--${boundary}`);
    const data = uint8Array;

    // Find file content between boundaries
    let fileStart = -1;
    let fileEnd = -1;
    let filename = "";

    for (let i = 0; i < data.length - boundaryBytes.length; i++) {
      if (data.slice(i, i + boundaryBytes.length).every((byte, idx) => byte === boundaryBytes[idx])) {
        const headerEnd = findHeaderEnd(data, i);
        if (headerEnd !== -1) {
          const headers = new TextDecoder().decode(data.slice(i, headerEnd));
          if (headers.includes('name="file"')) {
            const filenameMatch = headers.match(/filename="([^"]+)"/);
            filename = filenameMatch?.[1] || "uploaded-file";
            fileStart = headerEnd + 4; // Skip \r\n\r\n
            // Find next boundary for file end
            for (let j = fileStart; j < data.length - boundaryBytes.length; j++) {
              if (data.slice(j, j + boundaryBytes.length).every((byte, idx) => byte === boundaryBytes[idx])) {
                fileEnd = j - 2; // Skip \r\n before boundary
                break;
              }
            }
            break;
          }
        }
      }
    }

    if (fileStart === -1 || fileEnd === -1) {
      return NextResponse.json({ error: "No valid file found in request" }, { status: 400 });
    }

    const fileData = data.slice(fileStart, fileEnd);
    const file = new File([fileData], filename, { type: "application/octet-stream" });

    const upload = await pinata.upload.file(file);
    const cid = upload.IpfsHash;
    const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;

    return NextResponse.json({ cid, url });
  } catch (error: any) {
    console.error("IPFS upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}

function findHeaderEnd(data: Uint8Array, start: number): number {
  const headerEndPattern = new Uint8Array([13, 10, 13, 10]); // \r\n\r\n
  for (let i = start; i < data.length - 3; i++) {
    if (data.slice(i, i + 4).every((byte, idx) => byte === headerEndPattern[idx])) {
      return i;
    }
  }
  return -1;
}
