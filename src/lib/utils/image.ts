/**
 * Create image source compatible with both createImageBitmap and fallback
 */
async function createImageSource(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // Try createImageBitmap first (modern browsers)
  if (typeof createImageBitmap !== 'undefined') {
    try {
      return await createImageBitmap(file);
    } catch (error) {
      // Fall back to Image element if createImageBitmap fails
    }
  }

  // Fallback for older browsers (like Safari < 15)
  const img = new Image();
  const url = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

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

  // Create image source with browser compatibility
  const imageSource = await createImageSource(file);

  // Calculate scale to fit max dimensions
  const scale = Math.min(1, maxDim / Math.max(imageSource.width, imageSource.height));

  // Create canvas and draw scaled image
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imageSource.width * scale);
  canvas.height = Math.round(imageSource.height * scale);

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);

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
