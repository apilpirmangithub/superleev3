// AI Detection Service
export async function detectAI(imageBuffer: Buffer): Promise<{ isAI: boolean; confidence: number }> {
  try {
    const imageBase64 = imageBuffer.toString('base64');
    const response = await fetch('/api/detect-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
    });
    
    if (!response.ok) throw new Error('AI detection API failed');
    return await response.json();
  } catch (error) {
    console.error('detectAI error:', error);
    return { isAI: false, confidence: 0 };
  }
}

// IPFS Upload Service
export async function uploadToIPFS(data: Buffer | string, filename?: string): Promise<string> {
  try {
    if (typeof data === 'string') {
      // Upload JSON data
      const response = await fetch('/api/ipfs/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
      });
      
      if (!response.ok) throw new Error('JSON upload to IPFS failed');
      const result = await response.json();
      return result.cid;
    } else {
      // Upload file data
      const formData = new FormData();
      const file = new File([data], filename || 'file', { type: 'application/octet-stream' });
      formData.append('file', file);
      
      const response = await fetch('/api/ipfs/file', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('File upload to IPFS failed');
      const result = await response.json();
      return result.cid;
    }
  } catch (error) {
    console.error('uploadToIPFS error:', error);
    throw error;
  }
}

// Image compression utility
export async function compressImage(file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Image compression failed'));
          }
        },
        'image/webp',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Utility functions for file handling
export function fileToBuffer(file: File): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(Buffer.from(reader.result));
      } else {
        reject(new Error('Failed to convert file to buffer'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsArrayBuffer(file);
  });
}

// Hash computation utilities
export async function computeSHA256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeKeccak256(data: string): Promise<string> {
  // This would typically use a library like js-sha3 or viem
  // For now, we'll use a simple hash as placeholder
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Format utilities
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

export function formatIPFSUrl(cid: string, gateway: string = 'https://ipfs.io'): string {
  return `${gateway}/ipfs/${cid}`;
}
