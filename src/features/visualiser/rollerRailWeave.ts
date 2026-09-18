import { fabricScanRegion } from '@/features/fabrics';

import { normaliseRollerWeave } from './rollerWeave';

import type { Point } from './homography';

const tiles = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
function weaveTile(image: HTMLImageElement) {
  const cached = tiles.get(image);
  if (cached) return cached;
  const tile = document.createElement('canvas');
  tile.width = tile.height = 128;
  const ink = tile.getContext('2d', { willReadFrequently: true });
  if (!ink) return tile;
  ink.drawImage(image, ...fabricScanRegion(image.src, image.naturalWidth, image.naturalHeight), 0, 0, 128, 128);
  const pixels = ink.getImageData(0, 0, 128, 128);
  normaliseRollerWeave(pixels.data, 128, 128);
  ink.putImageData(pixels, 0, 0);
  tiles.set(image, tile);
  return tile;
}

/** The caller clips the solid, fabric-wrapped rail before applying yarn detail.
 * Cache per decoded image; changing drop/colour never resamples a fabric scan. */
export function rollerRailWeave(ctx: CanvasRenderingContext2D, image: HTMLImageElement | undefined,
  { left, right, halfHeight }: { left: Point; right: Point; halfHeight: number }) {
  if (!image) return;
  const pattern = ctx.createPattern(weaveTile(image), 'repeat');
  if (!pattern) return;
  const width = Math.hypot(right[0] - left[0], right[1] - left[1]);
  const scale = Math.max(.25, width / 384);
  ctx.save();
  ctx.translate(...left);
  ctx.rotate(Math.atan2(right[1] - left[1], right[0] - left[0]));
  ctx.scale(scale, scale);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = .32;
  ctx.fillStyle = pattern;
  ctx.fillRect(-halfHeight / scale, -halfHeight * 2 / scale,
    (width + halfHeight * 2) / scale, halfHeight * 4 / scale);
  ctx.restore();
}
