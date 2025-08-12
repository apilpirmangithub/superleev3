// src/app/dashboard/page.tsx
"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { erc721Abi, parseAbiItem } from "viem";

type Item = {
  tokenId: string;
  tokenURI?: string;
  nftMeta?: any | null;
  ipMeta?: any | null;
};

const SPG = process.env.NEXT_PUBLIC_SPG_COLLECTION as `0x${string}` | undefined;
const START_BLOCK = BigInt(process.env.NEXT_PUBLIC_SPG_START_BLOCK ?? "0");

function ipfs(url?: string) {
  if (!url) return "";
  return url.startsWith("ipfs://")
    ? `https://ipfs.io/ipfs/${url.slice(7)}`
    : url;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const pc = usePublicClient();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canQuery = useMemo(
    () => Boolean(isConnected && pc && SPG),
    [isConnected, pc]
  );

  useEffect(() => {
    if (!canQuery || !address) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const zero =
          "0x0000000000000000000000000000000000000000" as const;

        // tokenId yang pernah di-mint ke wallet ini (Transfer from=0x0 → to=address)
        const logs = await pc!.getLogs({
          address: SPG!,
          event: parseAbiItem(
            "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
          ),
          args: { from: zero, to: address },
          fromBlock: START_BLOCK,
          toBlock: "latest",
        });

        const tokenIds = Array.from(
          new Set(logs.map((l) => (l.args?.tokenId as bigint).toString()))
        );

        const results: Item[] = await Promise.all(
          tokenIds.map(async (id) => {
            let tokenURI: string | undefined;
            try {
              tokenURI = (await pc!.readContract({
                address: SPG!,
                abi: erc721Abi,
                functionName: "tokenURI",
                args: [BigInt(id)],
              })) as string;
            } catch {}

            let nftMeta: any = null;
            if (tokenURI) {
              try {
                nftMeta = await fetch(ipfs(tokenURI)).then((r) => r.json());
              } catch {}
            }

            const ipMetaUri: string | undefined =
              nftMeta?.ipMetadataURI ||
              nftMeta?.attributes?.find?.(
                (a: any) =>
                  a?.trait_type?.toLowerCase?.() === "ip_metadata_uri" ||
                  a?.trait_type?.toLowerCase?.() === "ipmetadatauri"
              )?.value;

            let ipMeta: any = null;
            if (ipMetaUri) {
              try {
                ipMeta = await fetch(ipfs(String(ipMetaUri))).then((r) =>
                  r.json()
                );
              } catch {}
            }

            return { tokenId: id, tokenURI, nftMeta, ipMeta };
          })
        );

        setItems(results);
      } catch (e: any) {
        setError(e?.message || "Failed to load IP list");
      } finally {
        setLoading(false);
      }
    })();
  }, [address, canQuery, pc]);

  if (!SPG)
    return (
      <div className="space-y-4">
        {/* Back */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
        <div className="card">
          Set <code>NEXT_PUBLIC_SPG_COLLECTION</code> di <code>.env.local</code>.
        </div>
      </div>
    );

  if (!isConnected)
    return (
      <div className="space-y-4">
        {/* Back */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Kembali
          </Link>
        </div>
        <div className="card">Connect wallet to see registered IP.</div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Tombol Kembali */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold">My Registered IP</h2>
        <p className="text-sm opacity-70">
          Collection: <code className="opacity-90">{SPG}</code>
        </p>
      </div>

      {loading && <div className="card">Loading…</div>}
      {error && <div className="card text-red-400">{error}</div>}
      {!loading && items.length === 0 && (
        <div className="card">There are no registered IPs yet.</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const name = it.nftMeta?.name || `Token #${it.tokenId}`;
          const image = ipfs(it.nftMeta?.image);
          const desc = it.nftMeta?.description;
          const ipTitle = it.ipMeta?.title;
          const ipPrompt =
            it.ipMeta?.aiMetadata?.prompt || it.ipMeta?.description;

          return (
            <div key={it.tokenId} className="card space-y-3">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt={name}
                  className="w-full h-40 object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-40 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm">
                  No image
                </div>
              )}

              <div className="space-y-1">
                <div className="font-medium">{name}</div>
                <div className="text-xs opacity-70">Token ID: {it.tokenId}</div>
                {desc && <p className="text-sm opacity-80">{desc}</p>}
              </div>

              {it.ipMeta && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  {ipTitle && (
                    <div className="text-sm">
                      <span className="opacity-70">Title:</span> {ipTitle}
                    </div>
                  )}
                  {ipPrompt && (
                    <div className="text-sm mt-1">
                      <span className="opacity-70">Prompt:</span>{" "}
                      <span className="whitespace-pre-wrap break-words">
                        {ipPrompt}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                {it.tokenURI && (
                  <a
                    className="text-xs underline opacity-80 hover:opacity-100"
                    href={ipfs(it.tokenURI)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    NFT metadata
                  </a>
                )}
                {it.ipMeta?.image && (
                  <a
                    className="text-xs underline opacity-80 hover:opacity-100"
                    href={ipfs(it.ipMeta.image)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    IP image
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
