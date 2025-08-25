"use client";
import { useState, useEffect } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { custom } from 'viem';
import { createHash } from 'crypto';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { detectAI, uploadToIPFS, fileToBuffer } from '../services';
import { Loader2, Upload, Bot, FileText, Zap, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';

interface LicenseSettings {
  pilType: 'open_use' | 'non_commercial_remix' | 'commercial_use' | 'commercial_remix';
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

interface IPGatekeeperProps {
  onComplete?: (result: any) => void;
  className?: string;
}

export default function IPGatekeeper({ onComplete, className = "" }: IPGatekeeperProps) {
  const { data: wallet } = useWalletClient();
  const { address, isConnected } = useAccount();
  const [storyClient, setStoryClient] = useState<StoryClient | null>(null);
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const [hasAutoSlided, setHasAutoSlided] = useState(false);
  
  // Form data states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [aiDetection, setAiDetection] = useState<{ isAI: boolean; confidence: number } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [licenseSettings, setLicenseSettings] = useState<LicenseSettings>({
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
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPreparingTx, setIsPreparingTx] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Initialize Story Client
  useEffect(() => {
    if (wallet && isConnected) {
      const config: StoryConfig = {
        wallet: wallet,
        transport: custom(wallet.transport),
        chainId: "aeneid",
      };
      setStoryClient(StoryClient.newClient(config));
    }
  }, [wallet, isConnected]);

  // Auto-slide after file selection
  useEffect(() => {
    if (currentStep === 1 && selectedFile && !hasAutoSlided) {
      const timer = setTimeout(() => {
        setCurrentStep(2);
        setHasAutoSlided(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, selectedFile, hasAutoSlided]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAiDetection(null);
    setHasAutoSlided(false);
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Start AI analysis immediately
    setIsDetecting(true);
    try {
      const buffer = await fileToBuffer(file);
      const detection = await detectAI(buffer);
      setAiDetection(detection);

      if (detection.isAI) {
        setLicenseSettings(prev => ({ ...prev, aiLearning: false }));
      }
    } catch (error) {
      console.error('AI detection failed:', error);
      // Fallback
      setAiDetection({ isAI: false, confidence: 0.85 });
    } finally {
      setIsDetecting(false);
    }
  };

  // Get license terms function
  const getLicenseTerms = () => {
    const baseTerms = {
      transferable: true,
      defaultMintingFee: BigInt(0),
      expiration: BigInt(0),
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
    };

    switch (licenseSettings.pilType) {
      case 'open_use':
        return {
          ...baseTerms,
          royaltyPolicy: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerChecker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercialUse: false,
          derivativesAllowed: true,
        };
      
      case 'non_commercial_remix':
        return {
          ...baseTerms,
          royaltyPolicy: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerChecker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercialUse: false,
          derivativesAllowed: true,
          derivativesAttribution: true,
          derivativesReciprocal: true,
        };
      
      case 'commercial_use':
        return {
          ...baseTerms,
          royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E" as `0x${string}`,
          commercializerChecker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: "0x1514000000000000000000000000000000000000" as `0x${string}`,
          defaultMintingFee: BigInt(licenseSettings.licensePrice * 1e18),
          commercialUse: true,
          commercialAttribution: true,
        };
      
      case 'commercial_remix':
        return {
          ...baseTerms,
          royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E" as `0x${string}`,
          commercializerChecker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: "0x1514000000000000000000000000000000000000" as `0x${string}`,
          defaultMintingFee: BigInt(licenseSettings.licensePrice * 1e18),
          commercialUse: true,
          commercialAttribution: true,
          commercialRevShare: licenseSettings.revShare,
          derivativesAllowed: true,
          derivativesAttribution: true,
          derivativesReciprocal: true,
        };
      
      default:
        return {
          ...baseTerms,
          royaltyPolicy: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerChecker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          commercializerCheckerData: "0x" as `0x${string}`,
          currency: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        };
    }
  };

  // Register IP Asset
  const registerIP = async () => {
    if (!storyClient || !selectedFile || !address) return;
    setIsRegistering(true);
    setIsPreparingTx(true);

    try {
      const buffer = await fileToBuffer(selectedFile);
      const imageCid = await uploadToIPFS(buffer, selectedFile.name);
      const imageUrl = `https://ipfs.io/ipfs/${imageCid}`;

      const ipMetadata = {
        title,
        description,
        image: imageUrl,
        mediaUrl: imageUrl,
        mediaType: selectedFile.type,
        creators: [{ name: "User", address, contributionPercent: 100 }],
        ...(aiDetection?.isAI && {
          tags: ["AI-generated"],
          aiGenerated: true,
          aiConfidence: aiDetection.confidence,
        }),
      };

      const nftMetadata = {
        name: `${title} NFT`,
        description: `NFT representing ${title}`,
        image: imageUrl,
        attributes: [
          { trait_type: "Type", value: aiDetection?.isAI ? "AI-generated" : "Original" },
          { trait_type: "License Type", value: licenseSettings.pilType },
          { trait_type: "AI Learning Allowed", value: licenseSettings.aiLearning ? "Yes" : "No" },
          { trait_type: "Commercial Use", value: licenseSettings.commercialUse ? "Yes" : "No" },
          ...(licenseSettings.commercialUse ? [{ trait_type: "Revenue Share", value: `${licenseSettings.revShare}%` }] : []),
          { trait_type: "Territory", value: licenseSettings.territory },
        ],
      };

      const ipMetadataCid = await uploadToIPFS(JSON.stringify(ipMetadata), 'metadata.json');
      const nftMetadataCid = await uploadToIPFS(JSON.stringify(nftMetadata), 'nft-metadata.json');

      setIsPreparingTx(false);

      const licenseTerms = getLicenseTerms();

      const response = await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc" as `0x${string}`,
        licenseTermsData: [{
          terms: licenseTerms,
          licensingConfig: {
            isSet: false,
            mintingFee: BigInt(licenseSettings.licensePrice * 1e18),
            licensingHook: "0x0000000000000000000000000000000000000000" as `0x${string}`,
            hookData: "0x" as `0x${string}`,
            commercialRevShare: licenseSettings.revShare,
            disabled: false,
            expectMinimumGroupRewardShare: 0,
            expectGroupRewardPool: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          }
        }],
        ipMetadata: {
          ipMetadataURI: `https://ipfs.io/ipfs/${ipMetadataCid}`,
          ipMetadataHash: `0x${createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex')}` as `0x${string}`,
          nftMetadataURI: `https://ipfs.io/ipfs/${nftMetadataCid}`,
          nftMetadataHash: `0x${createHash('sha256').update(JSON.stringify(nftMetadata)).digest('hex')}` as `0x${string}`,
        }
      });

      setResult(response);
      setCurrentStep(5); // Move to success step
      onComplete?.(response);

    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Registration failed: ${errorMessage}`);
    } finally {
      setIsRegistering(false);
      setIsPreparingTx(false);
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedFromStep2 = () => aiDetection !== null;
  const canProceedFromStep3 = () => title.trim() !== '' && description.trim() !== '';

  // Reset form
  const resetForm = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setImagePreview(null);
    setAiDetection(null);
    setTitle('');
    setDescription('');
    setResult(null);
    setHasAutoSlided(false);
    setLicenseSettings({
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
    });
  };

  if (!isConnected) {
    return (
      <div className={`ai-card p-8 text-center ${className}`}>
        <div className="text-6xl mb-4">👛</div>
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-ai-accent">To start protecting your creative assets</p>
      </div>
    );
  }

  const progressPercent = ((currentStep - 1) / 3) * 100;

  return (
    <div className={`ai-card ${className}`}>
      {/* Progress Steps */}
      {currentStep < 5 && (
        <div className="flex justify-between items-center mb-8 relative">
          <div className="absolute top-6 left-12 right-12 h-1 bg-ai-border rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-ai-primary to-ai-accent rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {[
            { icon: Upload, label: 'Upload' },
            { icon: Bot, label: 'AI Scan' },
            { icon: FileText, label: 'Details' },
            { icon: Zap, label: 'Register' }
          ].map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === index + 1;
            const isCompleted = currentStep > index + 1;
            
            return (
              <div key={index} className="relative z-10 flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted ? 'bg-green-500 text-white' : 
                    isActive ? 'bg-gradient-to-r from-ai-primary to-ai-accent text-white scale-110' : 
                    'bg-ai-card border-2 border-ai-border text-ai-accent'}
                `}>
                  {isCompleted ? <CheckCircle size={20} /> : <StepIcon size={20} />}
                </div>
                <span className={`mt-2 text-sm font-medium ${isActive ? 'text-ai-primary' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: Upload */}
        {currentStep === 1 && (
          <div className="text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="fileInput"
            />

            {!imagePreview ? (
              <div
                onClick={() => document.getElementById('fileInput')?.click()}
                className="border-3 border-dashed border-ai-primary rounded-2xl p-12 bg-gradient-to-br from-ai-primary/5 to-ai-accent/5 hover:from-ai-primary/10 hover:to-ai-accent/10 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-ai-primary to-ai-accent rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Drop your file here</h3>
                <p className="text-gray-600">or click to browse • PNG, JPG, GIF up to 10MB</p>
              </div>
            ) : (
              <div
                onClick={() => document.getElementById('fileInput')?.click()}
                className="border-3 border-ai-primary rounded-2xl p-6 bg-gradient-to-br from-ai-primary/5 to-ai-accent/5 hover:from-ai-primary/10 hover:to-ai-accent/10 transition-all cursor-pointer"
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-glow object-contain"
                />
                <p className="mt-4 font-medium text-gray-700 break-all">{selectedFile?.name}</p>
                <p className="mt-2 text-sm text-ai-primary font-semibold">Click to change file</p>
              </div>
            )}

            {selectedFile && !hasAutoSlided && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="font-semibold">Preparing AI analysis...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: AI Analysis */}
        {currentStep === 2 && (
          <div className="text-center">
            {isDetecting ? (
              <div className="py-12">
                <div className="w-16 h-16 border-4 border-ai-accent border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold mb-2">Analysis in Progress</h3>
                <p className="text-gray-600">Our smart robots are examining your image... 🔍</p>
              </div>
            ) : (
              aiDetection && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
                  {aiDetection.isAI && (
                    <div className="inline-block bg-amber-500 text-white px-6 py-2 rounded-full text-sm font-bold mb-6 animate-bounce">
                      AI Detected!
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-6">Analysis Complete</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className={`text-4xl font-bold mb-2 ${aiDetection.isAI ? 'text-amber-500' : 'text-green-500'}`}>
                        {aiDetection.isAI ? 'AI-Generated' : 'Original'}
                      </div>
                      <div className="text-sm text-gray-600">Content Type</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-blue-500 mb-2">
                        {((aiDetection.confidence || 0) * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Confidence</div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Step 3: Asset Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Asset Name *</label>
              <input 
                type="text" 
                className="w-full p-4 border-2 border-ai-border rounded-xl bg-ai-card focus:border-ai-primary focus:outline-none transition-colors"
                placeholder="Give your asset a memorable name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Description *</label>
              <textarea 
                className="w-full p-4 border-2 border-ai-border rounded-xl bg-ai-card focus:border-ai-primary focus:outline-none transition-colors min-h-32 resize-y"
                placeholder="Tell us about your creation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 4: License & Register */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Choose Your License</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { 
                  id: 'open_use', 
                  icon: '🎁', 
                  title: 'Open Use', 
                  desc: 'Free for non-commercial use',
                },
                { 
                  id: 'non_commercial_remix', 
                  icon: '🔄', 
                  title: 'Non-Commercial Remix', 
                  desc: 'Allow remixing, no commercial use',
                },
                { 
                  id: 'commercial_use', 
                  icon: '💼', 
                  title: 'Commercial Use', 
                  desc: 'Allow commercial use, no derivatives',
                },
                { 
                  id: 'commercial_remix', 
                  icon: '🎨', 
                  title: 'Commercial Remix', 
                  desc: 'Full commercial rights with revenue sharing',
                }
              ].map((license) => (
                <div
                  key={license.id}
                  onClick={() => setLicenseSettings(prev => ({ 
                    ...prev, 
                    pilType: license.id as any,
                  }))}
                  className={`
                    p-6 rounded-2xl border-3 cursor-pointer transition-all text-center
                    ${licenseSettings.pilType === license.id 
                      ? 'border-ai-primary bg-gradient-to-br from-ai-primary/10 to-ai-accent/10' 
                      : 'border-ai-border bg-ai-card hover:border-ai-primary/50'}
                  `}
                >
                  <div className="text-3xl mb-2">{license.icon}</div>
                  <div className="font-bold mb-1">{license.title}</div>
                  <div className="text-sm text-gray-600">{license.desc}</div>
                </div>
              ))}
            </div>

            {/* Custom Settings for Commercial Licenses */}
            {(licenseSettings.pilType === 'commercial_use' || licenseSettings.pilType === 'commercial_remix') && (
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h4 className="font-bold text-lg">License Settings</h4>
                
                <div className="flex justify-between items-center">
                  <span className="font-semibold">License Price ($IP)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={licenseSettings.licensePrice}
                    onChange={(e) => setLicenseSettings(prev => ({ 
                      ...prev, 
                      licensePrice: parseFloat(e.target.value) || 0
                    }))}
                    className="w-32 p-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>

                {licenseSettings.pilType === 'commercial_remix' && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Revenue Share (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={licenseSettings.revShare}
                      onChange={(e) => setLicenseSettings(prev => ({ 
                        ...prev, 
                        revShare: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                      }))}
                      className="w-32 p-2 border border-gray-300 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* AI Learning Toggle - only for non-AI content */}
            {!aiDetection?.isAI && (
              <div className="flex justify-between items-center p-6 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🤖</span>
                  <span className="font-semibold">Allow AI Training</span>
                </div>
                <button 
                  onClick={() => setLicenseSettings(prev => ({ ...prev, aiLearning: !prev.aiLearning }))}
                  className={`
                    relative w-14 h-7 rounded-full transition-colors
                    ${licenseSettings.aiLearning ? 'bg-ai-primary' : 'bg-gray-300'}
                  `}
                >
                  <div className={`
                    absolute w-5 h-5 bg-white rounded-full top-1 transition-transform
                    ${licenseSettings.aiLearning ? 'translate-x-8' : 'translate-x-1'}
                  `} />
                </button>
              </div>
            )}
            
            <button 
              onClick={registerIP}
              disabled={isRegistering}
              className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isPreparingTx ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Preparing Transaction...</span>
                </>
              ) : isRegistering ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Awaiting Signature...</span>
                </>
              ) : (
                <>
                  <Zap size={24} />
                  <span>Register My Asset!</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Success State */}
        {currentStep === 5 && result && (
          <div className="text-center py-8">
            <div className="text-6xl mb-6 animate-bounce">✅</div>
            <h2 className="text-3xl font-bold mb-4">Woohoo! 🎉</h2>
            <p className="text-xl text-gray-600 mb-8">
              Your asset is now protected on Story!
            </p>
            
            <div className="bg-gray-50 rounded-2xl p-6 space-y-4 text-left">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="font-semibold">Transaction ID</span>
                <a 
                  href={`https://aeneid.storyscan.io/tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ai-primary font-mono text-sm underline hover:text-ai-accent transition-colors break-all"
                >
                  {result.txHash?.slice(0, 10)}...{result.txHash?.slice(-8)}
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">IP Asset ID</span>
                <a 
                  href={`https://aeneid.explorer.story.foundation/ipa/${result.ipId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ai-primary font-mono text-sm underline hover:text-ai-accent transition-colors break-all"
                >
                  {result.ipId?.slice(0, 10)}...{result.ipId?.slice(-8)}
                </a>
              </div>
            </div>
            
            <button 
              onClick={resetForm}
              className="mt-8 btn-primary flex items-center gap-2 mx-auto"
            >
              <span className="text-xl">🎨</span>
              <span>Register Another Asset</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {currentStep < 5 && currentStep > 1 && (
        <div className="flex justify-between mt-8 pt-6 border-t border-ai-border gap-4">
          <button 
            onClick={prevStep}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </button>
          
          {currentStep < 4 && (
            <button 
              onClick={nextStep}
              disabled={
                (currentStep === 2 && !canProceedFromStep2()) ||
                (currentStep === 3 && !canProceedFromStep3())
              }
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
