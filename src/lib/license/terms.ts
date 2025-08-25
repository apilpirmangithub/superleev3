// License Terms Configuration for Story Protocol PIL (Programmable IP License)

export interface LicenseTermsData {
  terms: PILTerms;
  licensingConfig: LicensingConfig;
}

export interface PILTerms {
  transferable: boolean;
  royaltyPolicy: `0x${string}`;
  defaultMintingFee: bigint;
  expiration: bigint;
  commercialUse: boolean;
  commercialAttribution: boolean;
  commercializerChecker: `0x${string}`;
  commercializerCheckerData: `0x${string}`;
  commercialRevCeiling: bigint;
  commercialRevShare: number;
  derivativesAllowed: boolean;
  derivativesAttribution: boolean;
  derivativesApproval: boolean;
  derivativesReciprocal: boolean;
  derivativeRevCeiling: bigint;
  currency: `0x${string}`;
  uri: string;
}

export interface LicensingConfig {
  isSet: boolean;
  mintingFee: bigint;
  licensingHook: `0x${string}`;
  hookData: `0x${string}`;
  commercialRevShare: number;
  disabled: boolean;
  expectMinimumGroupRewardShare: number;
  expectGroupRewardPool: `0x${string}`;
}

export type LicenseType = 'open_use' | 'non_commercial_remix' | 'commercial_use' | 'commercial_remix';

export interface LicenseSettings {
  pilType: LicenseType;
  commercialUse: boolean;
  revShare: number;
  derivativesAllowed: boolean;
  derivativesAttribution: boolean;
  attribution: boolean;
  transferable: boolean;
  aiLearning: boolean;
  expiration: string;
  territory: string;
  licensePrice: number;
}

// Story Protocol contract addresses for Aeneid testnet
export const STORY_CONTRACTS = {
  // Royalty policies
  LAP_ROYALTY_POLICY: "0x0000000000000000000000000000000000000000" as `0x${string}`, // For non-commercial
  ROYALTY_POLICY_LAP: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E" as `0x${string}`, // For commercial
  
  // Currency contracts
  STORY_USD: "0x1514000000000000000000000000000000000000" as `0x${string}`,
  NULL_ADDRESS: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  
  // SPG NFT Collection
  SPG_COLLECTION: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc" as `0x${string}`,
};

export function createLicenseTerms(settings: LicenseSettings): LicenseTermsData {
  const baseTerms: PILTerms = {
    transferable: settings.transferable,
    defaultMintingFee: BigInt(settings.licensePrice * 1e18), // Convert to wei
    expiration: BigInt(settings.expiration || 0),
    commercialRevCeiling: BigInt(0),
    derivativeRevCeiling: BigInt(0),
    uri: "",
    commercialUse: false,
    commercialAttribution: false,
    commercialRevShare: 0,
    derivativesAllowed: false,
    derivativesAttribution: false,
    derivativesApproval: false,
    derivativesReciprocal: false,
    royaltyPolicy: STORY_CONTRACTS.NULL_ADDRESS,
    commercializerChecker: STORY_CONTRACTS.NULL_ADDRESS,
    commercializerCheckerData: "0x" as `0x${string}`,
    currency: STORY_CONTRACTS.NULL_ADDRESS,
  };

  const baseLicensingConfig: LicensingConfig = {
    isSet: false,
    mintingFee: BigInt(settings.licensePrice * 1e18),
    licensingHook: STORY_CONTRACTS.NULL_ADDRESS,
    hookData: "0x" as `0x${string}`,
    commercialRevShare: settings.revShare,
    disabled: false,
    expectMinimumGroupRewardShare: 0,
    expectGroupRewardPool: STORY_CONTRACTS.NULL_ADDRESS,
  };

  switch (settings.pilType) {
    case 'open_use':
      return {
        terms: {
          ...baseTerms,
          royaltyPolicy: STORY_CONTRACTS.LAP_ROYALTY_POLICY,
          commercializerChecker: STORY_CONTRACTS.NULL_ADDRESS,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: STORY_CONTRACTS.NULL_ADDRESS,
          commercialUse: false,
          derivativesAllowed: true,
          derivativesAttribution: false,
          derivativesReciprocal: false,
        },
        licensingConfig: {
          ...baseLicensingConfig,
          mintingFee: BigInt(0), // Free for open use
        }
      };
    
    case 'non_commercial_remix':
      return {
        terms: {
          ...baseTerms,
          royaltyPolicy: STORY_CONTRACTS.LAP_ROYALTY_POLICY,
          commercializerChecker: STORY_CONTRACTS.NULL_ADDRESS,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: STORY_CONTRACTS.NULL_ADDRESS,
          commercialUse: false,
          derivativesAllowed: true,
          derivativesAttribution: true,
          derivativesReciprocal: true,
        },
        licensingConfig: {
          ...baseLicensingConfig,
          mintingFee: BigInt(0), // Free for non-commercial
        }
      };
    
    case 'commercial_use':
      return {
        terms: {
          ...baseTerms,
          royaltyPolicy: STORY_CONTRACTS.ROYALTY_POLICY_LAP,
          commercializerChecker: STORY_CONTRACTS.NULL_ADDRESS,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: STORY_CONTRACTS.STORY_USD,
          defaultMintingFee: BigInt(settings.licensePrice * 1e18),
          commercialUse: true,
          commercialAttribution: true,
          commercialRevShare: 0, // No revenue sharing for derivatives
          derivativesAllowed: false,
        },
        licensingConfig: baseLicensingConfig
      };
    
    case 'commercial_remix':
      return {
        terms: {
          ...baseTerms,
          royaltyPolicy: STORY_CONTRACTS.ROYALTY_POLICY_LAP,
          commercializerChecker: STORY_CONTRACTS.NULL_ADDRESS,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: STORY_CONTRACTS.STORY_USD,
          defaultMintingFee: BigInt(settings.licensePrice * 1e18),
          commercialUse: true,
          commercialAttribution: true,
          commercialRevShare: settings.revShare,
          derivativesAllowed: true,
          derivativesAttribution: true,
          derivativesReciprocal: true,
        },
        licensingConfig: baseLicensingConfig
      };
    
    default:
      return {
        terms: {
          ...baseTerms,
          royaltyPolicy: STORY_CONTRACTS.LAP_ROYALTY_POLICY,
        },
        licensingConfig: baseLicensingConfig
      };
  }
}

// Default license settings
export const DEFAULT_LICENSE_SETTINGS: LicenseSettings = {
  pilType: 'non_commercial_remix',
  commercialUse: false,
  revShare: 0,
  derivativesAllowed: true,
  derivativesAttribution: true,
  attribution: false,
  transferable: true,
  aiLearning: true,
  expiration: '0',
  territory: 'Global',
  licensePrice: 0,
};

// License type descriptions
export const LICENSE_DESCRIPTIONS: Record<LicenseType, {
  title: string;
  description: string;
  icon: string;
  features: string[];
}> = {
  open_use: {
    title: 'Open Use',
    description: 'Free for any non-commercial use, derivatives allowed',
    icon: '🎁',
    features: ['Non-commercial use', 'Derivatives allowed', 'No attribution required', 'Free license']
  },
  non_commercial_remix: {
    title: 'Non-Commercial Remix',
    description: 'Allow remixing and derivatives, but no commercial use',
    icon: '🔄',
    features: ['Non-commercial use', 'Derivatives allowed', 'Attribution required', 'Share-alike derivatives']
  },
  commercial_use: {
    title: 'Commercial Use',
    description: 'Allow commercial use, but no derivatives',
    icon: '💼',
    features: ['Commercial use allowed', 'No derivatives', 'Attribution required', 'Revenue to creator']
  },
  commercial_remix: {
    title: 'Commercial Remix',
    description: 'Full commercial rights with revenue sharing on derivatives',
    icon: '🎨',
    features: ['Commercial use allowed', 'Derivatives allowed', 'Revenue sharing', 'Attribution required']
  }
};

// Utility functions
export function formatLicensePrice(price: number): string {
  if (price === 0) return 'Free';
  return `${price} $IP`;
}

export function getLicenseDisplayName(pilType: LicenseType): string {
  return LICENSE_DESCRIPTIONS[pilType].title;
}

export function getLicenseFeatures(pilType: LicenseType): string[] {
  return LICENSE_DESCRIPTIONS[pilType].features;
}

export function isCommercialLicense(pilType: LicenseType): boolean {
  return pilType === 'commercial_use' || pilType === 'commercial_remix';
}

export function allowsDerivatives(pilType: LicenseType): boolean {
  return pilType !== 'commercial_use';
}

export function requiresAttribution(pilType: LicenseType): boolean {
  return pilType !== 'open_use';
}

// Helper functions for feature checking
export function hasCommercialUse(pilType: LicenseType): boolean {
  return LICENSE_DESCRIPTIONS[pilType].features.some(feature => feature === 'Commercial use allowed');
}

export function hasDerivativesAllowed(pilType: LicenseType): boolean {
  return LICENSE_DESCRIPTIONS[pilType].features.some(feature => feature === 'Derivatives allowed');
}

export function hasAttributionRequired(pilType: LicenseType): boolean {
  return LICENSE_DESCRIPTIONS[pilType].features.some(feature => feature === 'Attribution required');
}

export function hasRevenueSharing(pilType: LicenseType): boolean {
  return LICENSE_DESCRIPTIONS[pilType].features.some(feature => feature === 'Revenue sharing');
}

export function hasFreeLicense(pilType: LicenseType): boolean {
  return LICENSE_DESCRIPTIONS[pilType].features.some(feature => feature === 'Free license');
}
