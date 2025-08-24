/**
 * Compress image to reduce file size while maintaining quality
 */
export async function compressImage(
  file: File,
  options: { 
    maxDim?: number; 
    quality?: number; 
    targetMaxBytes?: number 
  } = {}
) {
  const { maxDim = 1600, quality = 0.85, targetMaxBytes = 3.5 * 1024 * 1024 } = options;
  
  // If file is already small enough, return as-is
  if (file.size <= targetMaxBytes) return file;
  
  // Create bitmap from file
  const bmp = await createImageBitmap(file);
  
  // Calculate scale to fit max dimensions
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  
  // Create canvas and draw scaled image
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  
  // Convert to WebP blob
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), "image/webp", quality)
  );
  
  // Return as File with WebP extension
  return new File(
    [blob],
    (file.name.replace(/\.\w+$/, "") || "image") + ".webp",
    { type: "image/webp" }
  );
}
