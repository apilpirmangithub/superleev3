/**
 * Centralized constants for Story Protocol integration
 */

// SPG Collection Contract Address
// MUST be set via NEXT_PUBLIC_SPG_COLLECTION environment variable
const spgCollectionFromEnv = process.env.NEXT_PUBLIC_SPG_COLLECTION;

if (!spgCollectionFromEnv) {
  throw new Error(
    'NEXT_PUBLIC_SPG_COLLECTION environment variable is required. ' +
    'Please set it in your .env.local file or deployment environment.'
  );
}

// Validate the address format
if (!spgCollectionFromEnv.match(/^0x[a-fA-F0-9]{40}$/)) {
  throw new Error(`Invalid SPG collection address format: ${spgCollectionFromEnv}`);
}

export const SPG_COLLECTION_ADDRESS = spgCollectionFromEnv as `0x${string}`;

console.log('🏭 SPG Collection Address loaded from environment:', SPG_COLLECTION_ADDRESS);

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
