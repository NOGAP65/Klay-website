import { AsyncLruCache } from './asyncLruCache';

// Decoded RGBA bytes, not compressed file bytes. Active renderers own their
// references; the cache retains at most 32 MiB / 16 resources between uses.
const images = new AsyncLruCache<HTMLImageElement>(16, 32 * 1024 * 1024,
  image => image.naturalWidth * image.naturalHeight * 4);

export function loadImage(src: string): Promise<HTMLImageElement> {
  const load = () => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => { image.onload = image.onerror = null; resolve(image); };
    image.onerror = () => {
      image.onload = image.onerror = null;
      reject(new Error('Could not load the preview image.'));
    };
    image.src = src;
  });
  // Uploaded photos are private resources owned by their visualiser session.
  return /^(blob:|data:)/.test(src) ? load() : images.get(src, load);
}
