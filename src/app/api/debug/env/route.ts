import { NextResponse } from 'next/server';
import { SPG_COLLECTION_ADDRESS } from '@/lib/constants';

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    spgCollection: {
      constant: SPG_COLLECTION_ADDRESS,
      envVar: process.env.NEXT_PUBLIC_SPG_COLLECTION,
      isCorrect: SPG_COLLECTION_ADDRESS === "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
    },
    storyConfig: {
      chainId: process.env.NEXT_PUBLIC_STORY_CHAIN_ID,
      rpc: process.env.NEXT_PUBLIC_STORY_RPC,
    },
    walletConnect: {
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
      isDemo: process.env.NEXT_PUBLIC_WC_PROJECT_ID === 'demo',
    },
    pinata: {
      configured: !!process.env.PINATA_JWT,
      isPlaceholder: process.env.PINATA_JWT === 'your_pinata_jwt_token_here',
    },
  });
}
