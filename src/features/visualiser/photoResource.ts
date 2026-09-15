export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
export const MAX_PHOTO_DIMENSION = 1600;

export interface PhotoResource {
  bitmap: ImageBitmap;
  url: string;
  dispose: () => void;
}

/** Owns the bitmap and optional blob URL together. No base64 in React state.
 * Every failure path releases intermediate image memory. */
export async function preparePhoto(blob: Blob, presetUrl?: string): Promise<PhotoResource> {
  if (blob.size > MAX_PHOTO_BYTES) throw new Error('Photo is too large. Please use an image under 15MB.');
  if (!blob.type.startsWith('image/')) throw new Error('Please upload an image file (JPG, PNG, etc.)');
  let bitmap: ImageBitmap | undefined;
  let ownedUrl: string | undefined;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale < 1 || !presetUrl) {
      const canvas = document.createElement('canvas');
      try {
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Photo preview is unavailable. Please try again.');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        bitmap = undefined;
        const resized = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
          result => result ? resolve(result) : reject(new Error('Could not prepare this photo.')),
          'image/jpeg', 0.9,
        ));
        bitmap = await createImageBitmap(canvas);
        ownedUrl = URL.createObjectURL(resized);
      } finally { canvas.width = canvas.height = 0; }
    }
    const result = bitmap;
    let isDisposed = false;
    return {
      bitmap: result, url: ownedUrl ?? presetUrl!,
      dispose: () => {
        if (isDisposed) return;
        isDisposed = true;
        result.close();
        if (ownedUrl) URL.revokeObjectURL(ownedUrl);
      },
    };
  } catch (error) {
    bitmap?.close();
    if (ownedUrl) URL.revokeObjectURL(ownedUrl);
    throw error;
  }
}
