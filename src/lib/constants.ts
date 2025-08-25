/**
 * Centralized constants for Story Protocol integration
 */

// SPG Collection Contract Address - from environment variable
export const SPG_COLLECTION_ADDRESS = (process.env.NEXT_PUBLIC_SPG_COLLECTION ||
  "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc") as `0x${string}`;

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
