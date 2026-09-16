import { isRasterPhoto } from '@/core/photoFile';

import { loadImage } from '@/shared';

export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
export const MAX_PHOTO_DIMENSION = 1600;

export interface PhotoResource {
  bitmap: { width: number; height: number };
  url: string;
  dispose: () => void;
}

async function decodePhoto(blob: Blob) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch { /* Use the browser's image decoder below. */ }
  }
  const url = URL.createObjectURL(blob);
  try { return await loadImage(url); } finally { URL.revokeObjectURL(url); }
}

function releasePhoto(image: ImageBitmap | HTMLImageElement | undefined) {
  if (image && 'close' in image) image.close();
}

async function validatePhoto(blob: Blob): Promise<void> {
  if (blob.size > MAX_PHOTO_BYTES) throw new Error('Photo is too large. Please use an image under 15MB.');
  const header = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
  if (!isRasterPhoto(header)) throw new Error('Please use a JPG, PNG, WebP, GIF, AVIF or HEIC photo.');
  if (header[0] === 0x89 && header.length >= 24) {
    const dimensions = new DataView(header.buffer);
    if (dimensions.getUint32(16) * dimensions.getUint32(20) > 50_000_000) {
      throw new Error('Photo dimensions are too large. Please choose a smaller photo.');
    }
  }
  // Some phone/file pickers omit MIME metadata for valid images. The decoder
  // still validates the bytes, so an empty type need not reject a real photo.
  if (blob.type && !blob.type.startsWith('image/')) throw new Error('Please upload an image file (JPG, PNG, etc.)');
}

/** Owns the bitmap and optional blob URL together. No base64 in React state.
 * Every failure path releases intermediate image memory. */
export async function preparePhoto(blob: Blob, presetUrl?: string): Promise<PhotoResource> {
  await validatePhoto(blob);
  let bitmap: ImageBitmap | HTMLImageElement | undefined;
  let ownedUrl: string | undefined;
  try {
    bitmap = await decodePhoto(blob);
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 50_000_000) {
      throw new Error('Photo dimensions are too large. Please choose a smaller photo.');
    }
    const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const dimensions = { width: Math.max(1, Math.round(bitmap.width * scale)), height: Math.max(1, Math.round(bitmap.height * scale)) };
    if (scale < 1 || !presetUrl) {
      const canvas = document.createElement('canvas');
      try {
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Photo preview is unavailable. Please try again.');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        releasePhoto(bitmap);
        bitmap = undefined;
        const resized = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
          result => result ? resolve(result) : reject(new Error('Could not prepare this photo.')),
          'image/jpeg', 0.9,
        ));
        ownedUrl = URL.createObjectURL(resized);
      } finally { canvas.width = canvas.height = 0; }
    }
    releasePhoto(bitmap);
    bitmap = undefined;
    let isDisposed = false;
    return {
      bitmap: dimensions, url: ownedUrl ?? presetUrl!,
      dispose: () => {
        if (isDisposed) return;
        isDisposed = true;
        if (ownedUrl) URL.revokeObjectURL(ownedUrl);
      },
    };
  } catch (error) {
    releasePhoto(bitmap);
    if (ownedUrl) URL.revokeObjectURL(ownedUrl);
    throw error;
  }
}
