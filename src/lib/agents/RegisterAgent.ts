import { BaseAgent } from "./BaseAgent";
import { 
  AgentConfig, 
  AgentContext, 
  AgentParseResult, 
  AgentIntent, 
  RegisterIntent,
  ExecutionResult,
  AgentHelp 
} from "@/types/agents";
import { parseUnits, toHex, keccak256, type Hex } from "viem";

/**
 * Agent for registering IP (Intellectual Property) on Story Protocol
 */
export class RegisterAgent extends BaseAgent {
  
  constructor() {
    super({
      name: "RegisterAgent",
      description: "Register IP (images + metadata) on Story Protocol via IPFS",
      triggers: ["register", "daftar", "daftarkan", "mint", "create ip"],
      priority: 2
    });
  }

  // ===== Implementation =====

  canHandle(prompt: string, context?: AgentContext): boolean {
    // Check for register triggers
    if (this.hasTrigger(prompt)) return true;

    // Check for IP-related keywords
    const hasIpKeywords = /\b(ip|ipa|nft|intellectual property)\b/i.test(prompt);
    const hasImageContext = context?.hasAttachedFile || /\b(image|gambar|foto|picture)\b/i.test(prompt);

    return hasIpKeywords && hasImageContext;
  }

  async parse(prompt: string, context?: AgentContext): Promise<AgentParseResult> {
    const text = prompt.trim();

    // Validate connection
    const connectionCheck = this.validateConnection(context);
    if (!connectionCheck.valid) {
      return this.createNeedInfoResult(connectionCheck.reason!);
    }

    // Check for attached file
    if (!context?.attachedFile) {
      return this.createNeedInfoResult(
        "Untuk register IP, Anda perlu melampirkan file gambar. Klik ikon 📎 untuk attach file.",
        [
          "Attach image file menggunakan ikon paperclip",
          "Kemudian tulis: Register this image IP, title \"My Art\"",
          "Atau: daftar gambar ini sebagai IP dengan judul \"Karya Seni\""
        ]
      );
    }

    // Validate file type
    if (!this.isValidImageFile(context.attachedFile)) {
      return this.createNeedInfoResult(
        "File yang dilampirkan bukan format gambar yang didukung. Gunakan JPG, PNG, WebP, atau GIF."
      );
    }

    // Parse title
    const title = this.extractTitle(text) || this.generateDefaultTitle(context.attachedFile);

    // Parse license
    const license = this.extractLicense(text) || "by";

    // Parse description/prompt (remove trigger words and title)
    let description = text
      .replace(/\b(register|daftar|daftarkan|mint|create ip)\b/gi, "")
      .replace(/(?:title|judul)\s*["'].*?["']/gi, "")
      .replace(/\b(by|by-nc|by-nd|by-sa|cc0|arr)\b/gi, "")
      .trim();

    if (!description) {
      description = `IP registration for ${title}`;
    }

    // Build plan
    const plan = [
      "Validasi dan optimasi file gambar",
      "Upload gambar ke IPFS melalui Pinata",
      "Buat metadata IP (hash, prompt, license, creator)",
      "Upload metadata JSON ke IPFS", 
      "Mint dan register IP di Story Protocol",
      "Tampilkan IP ID dan link explorer"
    ];

    // Create intent
    const intent: RegisterIntent = {
      kind: "register",
      confidence: 0.9,
      title,
      prompt: description,
      license: license as RegisterIntent["license"]
    };

    return this.createSuccessResult(intent, plan);
  }

  async execute(intent: AgentIntent, context?: AgentContext): Promise<ExecutionResult> {
    if (intent.kind !== "register") {
      return this.createExecutionFailure("Invalid intent type for RegisterAgent");
    }

    if (!context?.attachedFile) {
      return this.createExecutionFailure("No file attached for IP registration");
    }

    const registerIntent = intent as RegisterIntent;

    try {
      // 1. Optimize image
      const optimizedFile = await this.compressImage(context.attachedFile);

      // 2. Upload image to IPFS
      const imageResult = await this.uploadFileToIPFS(optimizedFile);
      const imageCid = this.extractCid(imageResult.cid || imageResult.url);
      const imageUrl = this.toHttpsUrl(imageCid);
      const fileSha256 = await this.sha256OfFile(optimizedFile);

      // 3. Create IP metadata
      const ipMetadata = {
        title: registerIntent.title || optimizedFile.name,
        description: registerIntent.prompt || "",
        image: imageUrl,
        imageHash: fileSha256,
        mediaUrl: imageUrl,
        mediaHash: fileSha256,
        mediaType: optimizedFile.type || "image/webp",
        creators: context.userAddress 
          ? [{ name: context.userAddress, address: context.userAddress, contributionPercent: 100 }]
          : [],
        license: registerIntent.license || "by",
        aiMetadata: registerIntent.prompt 
          ? { prompt: registerIntent.prompt, generator: "user", model: "rule-based" }
          : undefined,
      };

      // 4. Upload IP metadata to IPFS
      const metadataResult = await this.uploadJSONToIPFS(ipMetadata);
      const metadataCid = this.extractCid(metadataResult.cid || metadataResult.url);
      const ipMetadataURI = this.toIpfsUri(metadataCid);
      const ipMetadataHash = await this.keccakOfJson(ipMetadata);

      // 5. Create NFT metadata
      const nftMetadata = {
        name: `IP Ownership — ${ipMetadata.title}`,
        description: "Ownership NFT for IP Asset",
        image: imageUrl,
        ipMetadataURI,
        attributes: [
          { trait_type: "ip_metadata_uri", value: ipMetadataURI },
          { trait_type: "license", value: registerIntent.license || "by" },
          { trait_type: "creator", value: context.userAddress }
        ],
      };

      // 6. Upload NFT metadata to IPFS
      const nftResult = await this.uploadJSONToIPFS(nftMetadata);
      const nftCid = this.extractCid(nftResult.cid || nftResult.url);
      const nftMetadataURI = this.toIpfsUri(nftCid);
      const nftMetadataHash = await this.keccakOfJson(nftMetadata);

      // 7. Register IP on Story Protocol
      const registrationResult = await this.registerOnStoryProtocol({
        ipMetadataURI,
        ipMetadataHash,
        nftMetadataURI,
        nftMetadataHash,
        recipient: context.userAddress!
      });

      // 8. Return success result
      const explorerUrl = `https://aeneid.storyscan.xyz/tx/${registrationResult.txHash}`;

      return this.createExecutionSuccess(
        `✅ IP berhasil didaftarkan!\n` +
        `Title: ${registerIntent.title}\n` +
        `IP ID: ${registrationResult.ipId}\n` +
        `License: ${registerIntent.license}\n` +
        `Tx: ${registrationResult.txHash}`,
        {
          ipId: registrationResult.ipId,
          title: registerIntent.title,
          license: registerIntent.license,
          imageUrl,
          ipMetadataUrl: this.toHttpsUrl(metadataCid),
          nftMetadataUrl: this.toHttpsUrl(nftCid)
        },
        registrationResult.txHash,
        explorerUrl
      );

    } catch (error: any) {
      return this.createExecutionFailure(
        `IP registration gagal: ${error?.message || String(error)}`,
        error
      );
    }
  }

  getHelp(): AgentHelp {
    return {
      agent: this.config.name,
      description: this.config.description,
      examples: [
        "Register this image IP, title \"Sunset\" by-nc",
        "daftar gambar ini sebagai IP dengan judul \"Mountains\"",
        "create IP from image, license cc0",
        "mint IP with title \"Art Work\" description \"Beautiful landscape\""
      ],
      parameters: [
        {
          name: "image",
          type: "file",
          required: true,
          description: "Image file to register as IP (JPG, PNG, WebP, GIF)",
          examples: ["image.jpg", "artwork.png"]
        },
        {
          name: "title",
          type: "string",
          required: false,
          description: "Title for the IP asset",
          examples: ["\"My Artwork\"", "\"Sunset Photography\""]
        },
        {
          name: "license",
          type: "string",
          required: false,
          description: "License type for the IP",
          examples: ["by", "by-nc", "cc0", "arr"]
        },
        {
          name: "description",
          type: "string",
          required: false,
          description: "Description or prompt for the IP",
          examples: ["Beautiful landscape photo", "AI generated artwork"]
        }
      ]
    };
  }

  // ===== Private Helpers =====

  private isValidImageFile(file: File): boolean {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    return validTypes.includes(file.type);
  }

  private extractTitle(text: string): string | null {
    const match = text.match(/(?:title|judul)\s*["']([^"']+)["']/i);
    return match ? match[1] : null;
  }

  private generateDefaultTitle(file: File): string {
    return file.name.replace(/\.\w+$/, "") || "Untitled IP";
  }

  private extractLicense(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    if (/\bcc0\b/.test(lowerText)) return "cc0";
    if (/\bby-nc\b/.test(lowerText)) return "by-nc";
    if (/\bby-nd\b/.test(lowerText)) return "by-nd";
    if (/\bby-sa\b/.test(lowerText)) return "by-sa";
    if (/\bby\b/.test(lowerText)) return "by";
    if (/\barr\b|\ball rights reserved\b/.test(lowerText)) return "arr";
    
    return null;
  }

  private async compressImage(
    file: File,
    options: { maxDim?: number; quality?: number; targetMaxBytes?: number } = {}
  ): Promise<File> {
    const { maxDim = 1600, quality = 0.85, targetMaxBytes = 3.5 * 1024 * 1024 } = options;
    
    if (file.size <= targetMaxBytes) return file;
    
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    
    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob as Blob), "image/webp", quality)
    );
    
    return new File(
      [blob],
      (file.name.replace(/\.\w+$/, "") || "image") + ".webp",
      { type: "image/webp" }
    );
  }

  private async uploadFileToIPFS(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    
    const response = await fetch("/api/ipfs/file", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IPFS upload failed: ${errorText}`);
    }
    
    return response.json();
  }

  private async uploadJSONToIPFS(data: any): Promise<any> {
    const response = await fetch("/api/ipfs/json", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IPFS JSON upload failed: ${errorText}`);
    }
    
    return response.json();
  }

  private extractCid(urlOrCid?: string): string {
    if (!urlOrCid) return "";
    if (urlOrCid.startsWith("ipfs://")) return urlOrCid.slice(7);
    const match = urlOrCid.match(/\/ipfs\/([^/?#]+)/i);
    return match ? match[1] : urlOrCid;
  }

  private toHttpsUrl(cid: string): string {
    return cid ? `https://ipfs.io/ipfs/${cid}` : "";
  }

  private toIpfsUri(cid: string): string {
    return `ipfs://${cid}`;
  }

  private async sha256OfFile(file: File): Promise<`0x${string}`> {
    const buffer = await file.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return toHex(new Uint8Array(hash), { size: 32 });
  }

  private async keccakOfJson(obj: any): Promise<`0x${string}`> {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    return keccak256(toHex(bytes)) as `0x${string}`;
  }

  private async registerOnStoryProtocol(params: {
    ipMetadataURI: string;
    ipMetadataHash: `0x${string}`;
    nftMetadataURI: string;
    nftMetadataHash: `0x${string}`;
    recipient: string;
  }): Promise<{ ipId: string; txHash: string }> {
    // This would integrate with Story Protocol SDK
    // For now, we'll simulate the registration
    
    // In actual implementation, this would use useStoryClient hook
    // const { getClient } = useStoryClient();
    // const client = await getClient();
    // const result = await client.ipAsset.mintAndRegisterIp({...});
    
    // Placeholder implementation
    throw new Error("Story Protocol integration not implemented in this agent");
  }
}
