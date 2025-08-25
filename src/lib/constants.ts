/**
 * Centralized constants for Story Protocol integration
 */

// SPG Collection Contract Address
// This is the public test collection on Aeneid testnet
// For production, set NEXT_PUBLIC_SPG_COLLECTION environment variable
export const SPG_COLLECTION_ADDRESS = (process.env.NEXT_PUBLIC_SPG_COLLECTION as `0x${string}`) ||
  "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc";

// Validate the address format
if (!SPG_COLLECTION_ADDRESS.match(/^0x[a-fA-F0-9]{40}$/)) {
  throw new Error(`Invalid SPG collection address: ${SPG_COLLECTION_ADDRESS}`);
}

// Story Protocol configuration
export const STORY_CONFIG = {
  AENEID_CHAIN_ID: 1315,
  MAINNET_CHAIN_ID: 1514,
  DEFAULT_RPC: "https://aeneid.storyrpc.io",
} as const;

// PiperX configuration  
export const PIPERX_CONFIG = {
  AGGREGATOR: process.env.NEXT_PUBLIC_PIPERX_AGGREGATOR || "0xf706FCb6C1E580B5070fAB19e8C1b44f095b3640",
  WIP_TOKEN: process.env.NEXT_PUBLIC_PIPERX_WIP || "0x1514000000000000000000000000000000000000",
  API_URL: process.env.NEXT_PUBLIC_PIPERX_AGGREGATOR_API || "https://piperxdb.piperxprotocol.workers.dev",
} as const;
