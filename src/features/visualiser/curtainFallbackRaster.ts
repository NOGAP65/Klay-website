import { loadImage } from '@/shared';

import { applyHomography, computeHomography, type Point } from './homography';

import type { Canvas2DCurtainRendererProps } from './Canvas2DCurtainRenderer';

const MAX_SIDE = 960;
const HARDWARE = { white: '#EDEDED', black: '#303030', chrome: '#B0AEA8' };
const UNIT: Point[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
const rgb = (hex: string) => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
let foldPixels: Promise<ImageData | null> | undefined;
export interface FallbackPhoto { url: string; pixels: ImageData; width: number; height: number; scale: number }
type Settings = Pick<Canvas2DCurtainRendererProps, 'fabricType' | 'hardwareColour' | 'mount' | 'colour' | 'openness'> & { corners: Point[] };

export function photographedFolds() {
  foldPixels ??= loadImage('/images/fabrics/curtains-blockout.webp').then(image => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 768;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!;
    const troughs = [113, 141, 173, 208, 242, 277, 310, 352, 393];
    for (let i = 0; i < 8; i++) ctx.drawImage(image, troughs[i], 57, troughs[i + 1] - troughs[i], 654, i * 64, 0, 64, 768);
    return ctx.getImageData(0, 0, 512, 768);
  }).catch(() => { foldPixels = undefined; return null; });
  return foldPixels;
}

export function prepareFallbackPhoto(ctx: CanvasRenderingContext2D, image: HTMLImageElement, url: string): FallbackPhoto {
  const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.round(image.naturalWidth * scale), height = Math.round(image.naturalHeight * scale);
  ctx.canvas.width = width; ctx.canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  return { url, pixels: ctx.getImageData(0, 0, width, height), width, height, scale };
}

const outsidePanel = (u: number, v: number, span: number, startY: number) =>
  u < 0 || u > 1 || v < startY || v > 1 || (u > span && u < 1 - span);

function shadeCloth(photo: FallbackPhoto, folds: ImageData | null, projection: { quad: Point[]; inverse: number[] }, settings: Settings): ImageData {
  const { quad, inverse } = projection;
  const { pixels, width, height } = photo;
  const { colour, fabricType, openness, mount } = settings;
  const result = new ImageData(new Uint8ClampedArray(pixels.data), width, height);
  const dye = rgb(colour), luma = (dye[0] * .299 + dye[1] * .587 + dye[2] * .114) / 255;
  const span = .501 * (1 - Math.min(1, Math.max(0, openness)) * .76), startY = mount === 'window' ? .02 : 0;
  const waves = Math.max(5, Math.min(28, Math.round((Math.hypot(quad[1][0] - quad[0][0], quad[1][1] - quad[0][1]) + Math.hypot(quad[2][0] - quad[3][0], quad[2][1] - quad[3][1])) / 2 / width * 18)));
  const minX = Math.max(0, Math.floor(Math.min(...quad.map(p => p[0]))));
  const maxX = Math.min(width, Math.ceil(Math.max(...quad.map(p => p[0]))));
  const minY = Math.max(0, Math.floor(Math.min(...quad.map(p => p[1]))));
  const maxY = Math.min(height, Math.ceil(Math.max(...quad.map(p => p[1]))));
  for (let y = minY; y < maxY; y++) for (let x = minX; x < maxX; x++) {
    const denominator = inverse[6] * x + inverse[7] * y + inverse[8];
    const u = (inverse[0] * x + inverse[1] * y + inverse[2]) / denominator;
    const v = (inverse[3] * x + inverse[4] * y + inverse[5]) / denominator;
    if (outsidePanel(u, v, span, startY)) continue;
    const panelU = Math.min(1, u <= span ? u / span : (1 - u) / span), panelV = (v - startY) / (1 - startY);
    const sample = folds ? (Math.min(folds.height - 1, Math.floor(panelV * folds.height)) * folds.width + Math.floor((panelU * waves % 8) * 64)) * 4 : 0;
    const light = folds ? (folds.data[sample] * .299 + folds.data[sample + 1] * .587 + folds.data[sample + 2] * .114) / 255 : .78;
    const transmit = fabricType === 'sheer' ? Math.exp(-(1.35 - .25 * luma) * (1 + Math.max(0, .85 - light) * 3 + openness * 2)) : 0;
    const i = (y * width + x) * 4;
    for (let channel = 0; channel < 3; channel++) {
      const surface = dye[channel] * (.10 + light), behind = pixels.data[i + channel];
      const backlit = (dye[channel] * .82 + 255 * .18) * (.80 + .20 * behind / 255) * (.55 + light * .48);
      const cloth = fabricType === 'sheer' ? surface * .55 + backlit * .45 : surface;
      result.data[i + channel] = cloth * (1 - transmit) + behind * transmit;
    }
  }
  return result;
}

export function paintCurtainFallback(ctx: CanvasRenderingContext2D, photo: FallbackPhoto, folds: ImageData | null, settings: Settings) {
  const quad: Point[] = settings.corners.map(([x, y]) => [x * photo.scale, y * photo.scale]);
  let inverse: number[], forward: number[];
  try { inverse = computeHomography(quad, UNIT); forward = computeHomography(UNIT, quad); }
  catch { ctx.putImageData(photo.pixels, 0, 0); return; }
  ctx.putImageData(shadeCloth(photo, folds, { quad, inverse }, settings), 0, 0);
  const startY = settings.mount === 'window' ? .02 : 0;
  const track = [applyHomography(forward, [0, startY]), applyHomography(forward, [1, startY])];
  ctx.lineWidth = Math.max(2, Math.hypot(quad[1][0] - quad[0][0], quad[1][1] - quad[0][1]) * .006);
  ctx.strokeStyle = HARDWARE[settings.hardwareColour];
  ctx.beginPath(); ctx.moveTo(...track[0]); ctx.lineTo(...track[1]); ctx.stroke();
}
