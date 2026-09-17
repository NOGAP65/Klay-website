/** The existing shop photograph supplies fine cloth grain. Remove its dye and
 * photographed pleat lighting; the moving geometry supplies those separately. */
export const HONEYCOMB_MATERIAL_PHOTO = '/images/shop/honeycomb-blockout.webp';
const cache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();

export function honeycombMaterial(photo: HTMLImageElement): HTMLCanvasElement | undefined {
  const cached = cache.get(photo);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 384; canvas.height = 384;
  const context = canvas.getContext('2d', { colorSpace: 'srgb' });
  if (!context) return;
  context.drawImage(photo, photo.naturalWidth * .3, photo.naturalHeight * .2,
    photo.naturalWidth * .5, photo.naturalHeight * .4, 0, 0, 384, 384);
  const image = context.getImageData(0, 0, 384, 384);
  for (let y = 0; y < 384; y++) {
    let mean = 0;
    for (let x = 0; x < 384; x++) {
      const index = (y * 384 + x) * 4;
      mean += (image.data[index] + image.data[index + 1] + image.data[index + 2]) / 3;
    }
    mean /= 384;
    for (let x = 0; x < 384; x++) {
      const index = (y * 384 + x) * 4;
      const grey = (image.data[index] + image.data[index + 1] + image.data[index + 2]) / 3;
      const value = Math.max(100, Math.min(156, 128 + (grey - mean) * 2));
      image.data[index] = image.data[index + 1] = image.data[index + 2] = value;
    }
  }
  context.putImageData(image, 0, 0);
  cache.set(photo, canvas);
  return canvas;
}
