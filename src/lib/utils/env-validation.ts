/**
 * Environment variable validation utility
 * Validates required environment variables and provides helpful error messages
 */

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EnvConfig {
  // WalletConnect
  walletConnectProjectId?: string;
  
  // Story Protocol
  storyChainId?: string;
  storyRpc?: string;
  
  // Pinata IPFS
  pinataJwt?: string;
  pinataGateway?: string;
  
  // PiperX
  piperxAggregator?: string;
  piperxWip?: string;
  piperxApi?: string;
  
  // Tokens
  spgCollection?: string;
  tokenUsdc?: string;
  tokenWeth?: string;
}

/**
 * Validates environment variables for production deployment
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Get environment variables
  const env: EnvConfig = {
    walletConnectProjectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
    storyChainId: process.env.NEXT_PUBLIC_STORY_CHAIN_ID,
    storyRpc: process.env.NEXT_PUBLIC_STORY_RPC,
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY,
    piperxAggregator: process.env.NEXT_PUBLIC_PIPERX_AGGREGATOR,
    piperxWip: process.env.NEXT_PUBLIC_PIPERX_WIP,
    piperxApi: process.env.NEXT_PUBLIC_PIPERX_AGGREGATOR_API,
    spgCollection: process.env.NEXT_PUBLIC_SPG_COLLECTION,
    tokenUsdc: process.env.NEXT_PUBLIC_TOKEN_USDC,
    tokenWeth: process.env.NEXT_PUBLIC_TOKEN_WETH,
  };
  
  // Critical validations for production
  if (isProduction) {
    // WalletConnect Project ID is required in production
    if (!env.walletConnectProjectId) {
      errors.push(
        '🔗 NEXT_PUBLIC_WC_PROJECT_ID is required for production deployment. ' +
        'Get your project ID from https://cloud.walletconnect.com'
      );
    } else if (env.walletConnectProjectId === 'demo') {
      errors.push(
        '🔗 NEXT_PUBLIC_WC_PROJECT_ID is set to "demo" which is not allowed in production. ' +
        'Get a real project ID from https://cloud.walletconnect.com'
      );
    } else if (env.walletConnectProjectId.length !== 32) {
      errors.push(
        '🔗 NEXT_PUBLIC_WC_PROJECT_ID must be exactly 32 characters long. ' +
        `Current length: ${env.walletConnectProjectId.length}`
      );
    }
    
    // Pinata JWT is required for IP registration functionality
    if (!env.pinataJwt) {
      errors.push(
        '📁 PINATA_JWT is required for IPFS uploads and IP registration. ' +
        'Get your JWT token from https://app.pinata.cloud'
      );
    } else if (!env.pinataJwt.startsWith('eyJ')) {
      warnings.push(
        '📁 PINATA_JWT does not appear to be a valid JWT token. ' +
        'Make sure you copied the JWT token correctly from Pinata.'
      );
    }
  }
  
  // Story Protocol configuration
  if (!env.storyChainId) {
    warnings.push(
      '⛓️  NEXT_PUBLIC_STORY_CHAIN_ID is not set. Using default chain configuration.'
    );
  } else {
    const chainId = parseInt(env.storyChainId);
    if (isNaN(chainId)) {
      errors.push(
        `⛓️  NEXT_PUBLIC_STORY_CHAIN_ID must be a number. Current value: ${env.storyChainId}`
      );
    } else if (chainId !== 1315 && chainId !== 1514) {
      warnings.push(
        `⛓️  NEXT_PUBLIC_STORY_CHAIN_ID (${chainId}) is not a known Story Protocol chain. ` +
        'Expected: 1315 (testnet) or 1514 (mainnet)'
      );
    }
  }
  
  if (!env.storyRpc) {
    warnings.push(
      '🌐 NEXT_PUBLIC_STORY_RPC is not set. Using default RPC endpoint.'
    );
  } else if (!isValidUrl(env.storyRpc)) {
    errors.push(
      `🌐 NEXT_PUBLIC_STORY_RPC is not a valid URL: ${env.storyRpc}`
    );
  }
  
  // PiperX configuration warnings
  if (!env.piperxAggregator) {
    warnings.push(
      '💱 NEXT_PUBLIC_PIPERX_AGGREGATOR is not set. Swap functionality may not work.'
    );
  } else if (!isValidAddress(env.piperxAggregator)) {
    errors.push(
      `💱 NEXT_PUBLIC_PIPERX_AGGREGATOR is not a valid Ethereum address: ${env.piperxAggregator}`
    );
  }
  
  if (!env.piperxApi) {
    warnings.push(
      '🔗 NEXT_PUBLIC_PIPERX_AGGREGATOR_API is not set. Swap quotes may not work.'
    );
  } else if (!isValidUrl(env.piperxApi)) {
    errors.push(
      `🔗 NEXT_PUBLIC_PIPERX_AGGREGATOR_API is not a valid URL: ${env.piperxApi}`
    );
  }
  
  // SPG Collection warning
  if (!env.spgCollection) {
    warnings.push(
      '🎨 NEXT_PUBLIC_SPG_COLLECTION is not set. Using default test collection. ' +
      'Set this to your own collection address for production.'
    );
  } else if (!isValidAddress(env.spgCollection)) {
    errors.push(
      `🎨 NEXT_PUBLIC_SPG_COLLECTION is not a valid Ethereum address: ${env.spgCollection}`
    );
  }
  
  // Token address warnings
  if (!env.tokenUsdc && !env.tokenWeth) {
    warnings.push(
      '🪙 No token addresses configured (NEXT_PUBLIC_TOKEN_USDC, NEXT_PUBLIC_TOKEN_WETH). ' +
      'Users will need to provide full contract addresses in prompts.'
    );
  }
  
  // Development-specific warnings
  if (isDevelopment) {
    if (env.walletConnectProjectId === 'demo') {
      warnings.push(
        '🔗 Using demo WalletConnect project ID. This is fine for development but ' +
        'must be changed for production deployment.'
      );
    }
    
    if (!env.pinataJwt) {
      warnings.push(
        '📁 PINATA_JWT is not set. IP registration functionality will not work. ' +
        'Get your JWT token from https://app.pinata.cloud'
      );
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid Ethereum address
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Prints validation results to console with colored output
 */
export function printValidationResults(result: EnvValidationResult): void {
  if (result.errors.length > 0) {
    console.error('\n❌ Environment Validation Errors:');
    result.errors.forEach(error => console.error(`  ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Validation Warnings:');
    result.warnings.forEach(warning => console.warn(`  ${warning}`));
  }
  
  if (result.isValid && result.warnings.length === 0) {
    console.log('\n✅ Environment validation passed!');
  } else if (result.isValid) {
    console.log('\n✅ Environment validation passed with warnings.');
  } else {
    console.error('\n❌ Environment validation failed! Please fix the errors above.');
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Production deployment is not recommended with these errors.');
    }
  }
  
  console.log('\n📖 For help with environment setup, see DEPLOYMENT.md');
}

/**
 * Validates environment and throws in production if critical errors are found
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();
  
  // Always print results for visibility
  printValidationResults(result);
  
  // Throw in production if there are critical errors
  if (!result.isValid && process.env.NODE_ENV === 'production') {
    throw new Error(
      'Critical environment configuration errors detected. ' +
      'Production deployment cannot continue. Please fix the errors above.'
    );
  }
}
