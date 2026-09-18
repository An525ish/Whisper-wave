/**
 * Canvas-based image compression — no external dependencies.
 *
 * Strategy (mirrors WhatsApp Web):
 *   - Scale down to MAX_DIMENSION on the longest side (never upscale)
 *   - Re-encode as JPEG at QUALITY
 *   - Skip GIFs entirely (may be animated — canvas flattens to first frame)
 *   - If the compressed output is larger than the original, return the original
 *   - On any error, return the original file (silent fallback)
 *
 * Result mimeType is always image/jpeg for compressed files. The file name
 * extension is updated to .jpg so it matches. Original display name is
 * preserved separately by the caller for the commit step.
 */

export type ImageQuality = 'standard' | 'hd';

const PRESETS: Record<ImageQuality, { maxDimension: number; quality: number }> = {
  standard: { maxDimension: 1280, quality: 0.85 },
  hd:       { maxDimension: 2560, quality: 0.92 },
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      type,
      quality,
    ),
  );

/**
 * Compress a single image File.
 * Returns the compressed File on success, or the original File as fallback.
 */
export const compressImage = async (file: File, quality: ImageQuality = 'standard'): Promise<File> => {
  // Only handle raster images; skip GIF (animated GIF risk)
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

  const { maxDimension, quality: jpegQuality } = PRESETS[quality];
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { naturalWidth: w, naturalHeight: h } = img;

    // Scale to fit within maxDimension, never upscale
    const scale = Math.min(maxDimension / w, maxDimension / h, 1);
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file; // canvas not supported

    // White background so PNG transparency converts cleanly to JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await canvasToBlob(canvas, 'image/jpeg', jpegQuality);

    // No benefit if compressed is larger — return original
    if (blob.size >= file.size) return file;

    // Rename extension to .jpg
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    // Silent fallback — compression is best-effort
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Compress all image files in a batch in parallel.
 * Non-image files and GIFs pass through unchanged.
 */
export const compressImages = (files: File[], quality: ImageQuality = 'standard'): Promise<File[]> =>
  Promise.all(files.map((f) => compressImage(f, quality)));
