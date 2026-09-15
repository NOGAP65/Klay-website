import { useCallback, useEffect, useRef, useState } from 'react';

import { preparePhoto, type PhotoResource } from './photoResource';

export interface UsePhotoUploadResult {
  photoUrl: string | null;
  photoBitmap: ImageBitmap | null;
  uploadError: string | null;
  handleUpload: () => void;
  handleTakePhoto: () => void;
  loadFromUrl: (url: string) => void;
  clear: () => void;
}

export const usePhotoUpload = (): UsePhotoUploadResult => {
  const [photo, setPhoto] = useState<PhotoResource | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const current = useRef<PhotoResource | null>(null);
  const version = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const inputs = useRef<Partial<Record<'gallery' | 'camera', HTMLInputElement>>>({});

  const cancel = useCallback(() => {
    version.current++;
    pending.current?.abort();
    pending.current = null;
  }, []);

  useEffect(() => () => {
    cancel();
    current.current?.dispose();
    current.current = null;
    for (const input of Object.values(inputs.current)) input.onchange = null;
    inputs.current = {};
  }, [cancel]);

  const load = useCallback(async (source: File | string) => {
    cancel();
    const revision = version.current;
    const controller = new AbortController();
    pending.current = controller;
    setUploadError(null);
    try {
      let blob: Blob;
      if (typeof source === 'string') {
        const response = await fetch(source, { signal: controller.signal });
        if (!response.ok) throw new Error('Failed to load room photo. Please try again.');
        blob = await response.blob();
      } else blob = source;
      if (revision !== version.current) return;
      const resource = await preparePhoto(blob, typeof source === 'string' ? source : undefined);
      if (revision !== version.current) { resource.dispose(); return; }
      current.current?.dispose();
      current.current = resource;
      setPhoto(resource);
    } catch (error) {
      if (revision === version.current) setUploadError(error instanceof Error
        ? error.message : 'Failed to load photo. Please try again.');
    } finally {
      if (revision === version.current) pending.current = null;
    }
  }, [cancel]);

  const choose = useCallback((kind: 'gallery' | 'camera') => {
    let input = inputs.current[kind];
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (kind === 'camera') input.capture = 'environment';
      input.onchange = () => {
        const file = input!.files?.[0];
        if (file) void load(file);
        input!.value = '';
      };
      inputs.current[kind] = input;
    }
    input.click();
  }, [load]);

  const clear = useCallback(() => {
    cancel();
    current.current?.dispose();
    current.current = null;
    setPhoto(null);
    setUploadError(null);
  }, [cancel]);
  const handleUpload = useCallback(() => choose('gallery'), [choose]);
  const handleTakePhoto = useCallback(() => choose('camera'), [choose]);
  const loadFromUrl = useCallback((url: string) => { void load(url); }, [load]);
  return {
    photoUrl: photo?.url ?? null, photoBitmap: photo?.bitmap ?? null, uploadError,
    handleUpload, handleTakePhoto, loadFromUrl, clear,
  };
};
