import type { Point } from './homography';

const cache = new WeakMap<HTMLImageElement, Map<number, HTMLCanvasElement>>();

/** Sliding box filter: linear time, independent of blur radius. Kept at a
 * small resolution because translucent cloth transmits broad light only. */
function blurAxis(source: Uint8ClampedArray, output: Uint8ClampedArray, options: {
  width: number; height: number; radius: number; isVertical: boolean;
}) {
  const { width, height, radius, isVertical } = options;
  const length = isVertical ? height : width, lines = isVertical ? width : height;
  const stride = isVertical ? width * 4 : 4, lineStride = isVertical ? 4 : width * 4;
  const diameter = radius * 2 + 1;
  for (let line = 0; line < lines; line++) for (let channel = 0; channel < 4; channel++) {
    const base = line * lineStride + channel;
    const pixel = (position: number) => source[base + Math.max(0, Math.min(length - 1, position)) * stride];
    let sum = 0;
    for (let offset = -radius; offset <= radius; offset++) sum += pixel(offset);
    for (let position = 0; position < length; position++) {
      output[base + position * stride] = sum / diameter;
      sum += pixel(position + radius + 1) - pixel(position - radius);
    }
  }
}

function diffusedPhoto(photo: HTMLImageElement, radius: number) {
  const scale = Math.min(1, 320 / Math.max(photo.naturalWidth, photo.naturalHeight));
  const key = Math.max(1, Math.round(radius * scale));
  let entries = cache.get(photo);
  if (!entries) { entries = new Map(); cache.set(photo, entries); }
  if (entries.has(key)) return entries.get(key)!;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) return photo;
  context.drawImage(photo, 0, 0, canvas.width, canvas.height);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const buffer = new Uint8ClampedArray(image.data.length);
  const options = { width: canvas.width, height: canvas.height, radius: key };
  for (let pass = 0; pass < 2; pass++) {
    blurAxis(image.data, buffer, { ...options, isVertical: false });
    blurAxis(buffer, image.data, { ...options, isVertical: true });
  }
  context.putImageData(image, 0, 0);
  entries.set(key, canvas);
  if (entries.size > 4) entries.delete(entries.keys().next().value!);
  return canvas;
}

/** Identical optical diffusion in Safari and Chromium; no Canvas.filter or
 * semi-transparent offset copies that leave sharp ghosts behind the cloth. */
export function drawHoneycombTransmission(ctx: CanvasRenderingContext2D, photo: HTMLImageElement, quad: Point[], radius: number) {
  ctx.save();
  ctx.beginPath(); ctx.moveTo(...quad[0]);
  for (const point of quad.slice(1)) ctx.lineTo(...point);
  ctx.closePath(); ctx.clip();
  ctx.drawImage(diffusedPhoto(photo, radius), 0, 0, photo.naturalWidth, photo.naturalHeight);
  ctx.restore();
}
