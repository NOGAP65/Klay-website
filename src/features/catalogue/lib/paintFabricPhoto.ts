import { fabricScanInset } from '@/features/fabrics';

import type { FabricShot } from '../fabricShots';

export interface FabricPhotoImages {
  photo: HTMLImageElement;
  mask?: HTMLImageElement;
  hardware?: HTMLImageElement;
  weave?: HTMLImageElement;
}

const channels = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
function dyePaint(hex: string, white: FabricShot['white']) {
  if (!white) return hex;
  const wanted = channels(hex).map((c, i) => c * 255 / white[i]);
  const scale = Math.max(...wanted, 255) / 255;
  return `rgb(${wanted.map(c => Math.round(c / scale)).join(',')})`;
}

/** The existing photographic dye, weave and metal passes, composed into one
 * sRGB image. CSS auto-darkening can no longer invert individual pigment layers. */
export function paintFabricPhoto(canvas: HTMLCanvasElement, layer: HTMLCanvasElement,
  images: FabricPhotoImages, { shot, colour, hardware, cssWidth }: {
    shot: FabricShot; colour: string; hardware: string; cssWidth: number;
  }) {
  const ctx = canvas.getContext('2d', { colorSpace: 'srgb' });
  const ink = layer.getContext('2d', { colorSpace: 'srgb' });
  if (!ctx || !ink) throw new Error('Photo preview is unavailable.');
  const size = Math.min(images.photo.naturalWidth, 900,
    Math.max(320, Math.ceil(cssWidth * Math.min(window.devicePixelRatio || 1, 2))));
  if (canvas.width !== size || canvas.height !== size) canvas.width = canvas.height = size;
  if (layer.width !== size || layer.height !== size) layer.width = layer.height = size;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(images.photo, 0, 0, size, size);
  const pass = (mask: HTMLImageElement | undefined, blend: GlobalCompositeOperation,
    opacity: number, content: string | HTMLImageElement | CanvasPattern) => {
    if (!mask || opacity <= 0) return;
    ink.clearRect(0, 0, size, size);
    ink.globalCompositeOperation = 'source-over';
    if (content instanceof HTMLImageElement) ink.drawImage(content, 0, 0, size, size);
    else { ink.fillStyle = content; ink.fillRect(0, 0, size, size); }
    ink.globalCompositeOperation = 'destination-in';
    ink.drawImage(mask, 0, 0, size, size);
    ctx.globalCompositeOperation = blend;
    ctx.globalAlpha = opacity;
    ctx.drawImage(layer, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };
  pass(images.mask, 'multiply', shot.dye, dyePaint(colour, shot.white));
  if (images.weave) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = Math.max(32, Math.round(140 * size / Math.max(cssWidth, 140)));
    const y = fabricScanInset(images.weave.src) * images.weave.naturalHeight;
    tile.getContext('2d')?.drawImage(images.weave, 0, y, images.weave.naturalWidth,
      images.weave.naturalHeight - y, 0, 0, tile.width, tile.height);
    const pattern = ink.createPattern(tile, 'repeat');
    if (pattern) pass(images.mask, 'soft-light', .24, pattern);
    tile.width = tile.height = 0;
  }
  pass(images.mask, 'color', shot.tint, colour);
  const rgb = channels(colour);
  const luma = (rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722) / 255;
  pass(images.mask, 'soft-light', shot.sheen * (1 - luma), images.photo);
  pass(images.hardware, 'source-over', 1, hardware);
  pass(images.hardware, 'soft-light', shot.spec, images.photo);
}
