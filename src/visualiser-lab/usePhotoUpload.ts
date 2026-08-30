import { useCallback, useRef, useState } from 'react';

const MAX_DIMENSION = 1600;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export interface UsePhotoUploadResult {
  photoUrl: string | null;
  photoBitmap: ImageBitmap | null;
  uploadError: string | null;
  /** Opens the photo gallery/file picker (no `capture` attribute). */
  handleUpload: () => void;
  /** Opens the device camera directly on mobile (`capture="environment"`);
   * on desktop `capture` is ignored so this just opens the file picker. */
  handleTakePhoto: () => void;
  loadFromUrl: (url: string) => void;
  clear: () => void;
}

const downscale = async (bitmap: ImageBitmap): Promise<{ bitmap: ImageBitmap; url: string }> => {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);

  const [resizedBitmap, url] = await Promise.all([
    createImageBitmap(canvas),
    Promise.resolve(canvas.toDataURL('image/jpeg', 0.9)),
  ]);

  return { bitmap: resizedBitmap, url };
};

export const usePhotoUpload = (): UsePhotoUploadResult => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBitmap, setPhotoBitmap] = useState<ImageBitmap | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = useCallback(async (file: File) => {
    try {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Photo is too large. Please use an image under 15MB.');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPG, PNG, etc.)');
      }

      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const { bitmap: resizedBitmap, url } = await downscale(bitmap);
      bitmap.close();

      setUploadError(null);
      setPhotoBitmap(resizedBitmap);
      setPhotoUrl(url);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Failed to load photo. Please try again.';
      setUploadError(message);
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (!inputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      // No `capture` attribute — setting it forces camera-only on some
      // Android devices; leaving it off lets the browser offer both the
      // camera and the photo gallery natively.
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (file) processFile(file);
        input.value = '';
      });
      inputRef.current = input;
    }
    inputRef.current.click();
  }, [processFile]);

  const handleTakePhoto = useCallback(() => {
    if (!cameraInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      // capture="environment" opens the rear camera directly on mobile;
      // desktop browsers ignore it and just show the file picker.
      input.capture = 'environment';
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (file) processFile(file);
        input.value = '';
      });
      cameraInputRef.current = input;
    }
    cameraInputRef.current.click();
  }, [processFile]);

  // Loads a preset room photo. Presets are local files in public/ (all under
  // the 1600px cap), so no fetch or downscale is needed — the image loads via
  // Image() so the bitmap dimensions are known before the corner pins appear,
  // and photoUrl is set to the same path the canvas will load, keeping the
  // preset flow identical to an upload from the renderer's point of view.
  const loadFromUrl = useCallback((url: string) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const bitmap = await createImageBitmap(img);
        setUploadError(null);
        setPhotoBitmap(prev => {
          prev?.close();
          return bitmap;
        });
        setPhotoUrl(url);
      } catch {
        setUploadError('Failed to load room photo. Please try again.');
      }
    };
    img.onerror = () => setUploadError('Failed to load room photo. Please try again.');
    img.src = url;
  }, []);

  const clear = useCallback(() => {
    setPhotoUrl(null);
    setUploadError(null);
    setPhotoBitmap(prev => {
      prev?.close();
      return null;
    });
  }, []);

  return { photoUrl, photoBitmap, uploadError, handleUpload, handleTakePhoto, loadFromUrl, clear };
};
