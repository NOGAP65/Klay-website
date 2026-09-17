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
