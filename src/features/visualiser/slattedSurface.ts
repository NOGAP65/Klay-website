import type { Point } from './homography';

export function surfacePath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath(); ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
}
const along = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Gradient runs perpendicular to the long edge, never down the screen. Its
 * thickness follows the converging edges of the photographed opening. */
export function surfaceGradient(ctx: CanvasRenderingContext2D, quad: Point[], stops: [number, string][]) {
  const [tl, tr, br, bl] = quad, top = along(tl, tr, .5), bottom = along(bl, br, .5);
  const dx = tr[0] - tl[0], dy = tr[1] - tl[1], length = Math.max(.001, Math.hypot(dx, dy));
  const nx = -dy / length, ny = dx / length;
  const width = (bottom[0] - top[0]) * nx + (bottom[1] - top[1]) * ny;
  const gradient = ctx.createLinearGradient(...top, top[0] + nx * width, top[1] + ny * width);
  for (const [stop, colour] of stops) gradient.addColorStop(stop, colour);
  return gradient;
}

/** Small overlapping strips follow perspective taper without a GPU or a
 * per-pixel photo pass. One clip and undercoat prevent anti-alias hairlines. */
export function shadeSurface(ctx: CanvasRenderingContext2D, quad: Point[], stops: [number, string][]) {
  const [tl, tr, br, bl] = quad;
  const length = Math.max(1, Math.hypot(tr[0] - tl[0], tr[1] - tl[1]));
  const count = Math.min(12, Math.max(1, Math.ceil(length / 80)));
  ctx.save(); surfacePath(ctx, quad); ctx.clip();
  ctx.fillStyle = surfaceGradient(ctx, quad, stops); ctx.fill();
  for (let i = 0; i < count; i++) {
    const from = Math.max(0, i / count - .5 / length), to = Math.min(1, (i + 1) / count + .5 / length);
    const strip = [along(tl, tr, from), along(tl, tr, to), along(bl, br, to), along(bl, br, from)];
    surfacePath(ctx, strip); ctx.fillStyle = surfaceGradient(ctx, strip, stops); ctx.fill();
  }
  ctx.restore();
}
