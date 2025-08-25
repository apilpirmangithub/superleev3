import { validateEnvironment } from '@/lib/utils/env-validation';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envValidation = validateEnvironment();
    
    const health = {
      status: envValidation.isValid ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      validation: {
        isValid: envValidation.isValid,
        errorCount: envValidation.errors.length,
        warningCount: envValidation.warnings.length,
        errors: envValidation.errors,
        warnings: envValidation.warnings,
      },
      services: {
        walletConnect: {
          configured: !!process.env.NEXT_PUBLIC_WC_PROJECT_ID,
          isDemo: process.env.NEXT_PUBLIC_WC_PROJECT_ID === 'demo',
        },
        pinata: {
          configured: !!process.env.PINATA_JWT,
        },
        storyProtocol: {
          chainId: process.env.NEXT_PUBLIC_STORY_CHAIN_ID,
          rpcConfigured: !!process.env.NEXT_PUBLIC_STORY_RPC,
        },
        piperx: {
          aggregatorConfigured: !!process.env.NEXT_PUBLIC_PIPERX_AGGREGATOR,
          apiConfigured: !!process.env.NEXT_PUBLIC_PIPERX_AGGREGATOR_API,
        },
      },
    };
    
    // Return appropriate status code based on health
    const statusCode = envValidation.isValid ? 200 : 500;
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV,
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache', 
          'Expires': '0',
        },
      }
    );
  }
}
