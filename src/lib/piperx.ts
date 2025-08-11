import { erc20Abi } from "@/lib/abi/erc20";
import { aggregatorAbi } from "@/lib/abi/aggregator_abi";
import { createPublicClient, http } from "viem";
import { storyAeneid } from "@/lib/chains/story";
import { BrowserProvider, Contract } from "ethers";

const AGGREGATOR = (process.env.NEXT_PUBLIC_PIPERX_AGGREGATOR || "") as `0x${string}`;
const API = process.env.NEXT_PUBLIC_PIPERX_AGGREGATOR_API || "";
export const WIP = (process.env.NEXT_PUBLIC_PIPERX_WIP || "0x1514000000000000000000000000000000000000") as `0x${string}`;

const publicClient = createPublicClient({ chain: storyAeneid, transport: http(process.env.NEXT_PUBLIC_STORY_RPC) });

export async function getDecimals(token: `0x${string}`) {
  return await publicClient.readContract({ address: token, abi: erc20Abi, functionName: "decimals" });
}

// src/lib/piperx.ts
export async function getQuote({
  tokenIn, tokenOut, amountInRaw, slippagePct,
}: {
  tokenIn: string; tokenOut: string; amountInRaw: string; slippagePct?: number;
}) {
  const base = `${API}/api/swap/swapExactToken?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amount=${amountInRaw}&type=exactInput&isAggregator=true`;
  const url = base; // + (slippagePct != null ? `&slippage=${slippagePct}` : "");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch quote");
  return res.json();
}


export async function approveForAggregator(token: `0x${string}`, amount: bigint) {
  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(token, erc20Abi as any, signer);
  const tx = await contract.approve(AGGREGATOR, amount);
  return await tx.wait();
}

export async function swapViaAggregator(universalRoutes: any[]) {
  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(AGGREGATOR, aggregatorAbi as any, signer);
  const tx = await contract.executeMultiPath(universalRoutes);
  return await tx.wait();
}