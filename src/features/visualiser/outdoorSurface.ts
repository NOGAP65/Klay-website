import { fillSlattedFace as fill, slattedPaint as paint } from './slattedSolids';
import { surfaceGradient, surfacePath } from './slattedSurface';

import type { SlattedPlane } from './slattedGeometry';

export interface OutdoorScene { ctx: CanvasRenderingContext2D; plane: SlattedPlane; colour: number[] }
type Box = [number, number, number, number];

/** Solid extrusion with continuous mitred edges, projected in the traced plane. */
export function outdoorBeam(scene: OutdoorScene, box: Box, depth = 22) {
  const { ctx, plane, colour } = scene;
  const back = plane.quad(box, 0), front = plane.quad(box, depth);
  fill(ctx, [back[0], back[1], front[1], front[0]], paint(colour, .88, 3));
  fill(ctx, [back[1], back[2], front[2], front[1]], paint(colour, .73, 3));
  fill(ctx, [back[3], back[0], front[0], front[3]], paint(colour, .8, 2));
  fill(ctx, [back[2], back[3], front[3], front[2]], paint(colour, .63, 3));
  fill(ctx, front, surfaceGradient(ctx, front, [[0, paint(colour, 1, 9)], [.13, paint(colour, 1, 3)], [.78, paint(colour, .94)], [1, paint(colour, .79)]]));
  ctx.save(); surfacePath(ctx, front); ctx.strokeStyle = paint(colour, .63, 9);
  ctx.lineWidth = Math.max(.35, plane.width / plane.widthMm * .65); ctx.stroke(); ctx.restore();
}

/** Resolve fine mesh to its average opacity at distance. No dense stripes or
 * GPU shaders: a bounded, projected weave is added only above pixel scale. */
export function zipMesh(scene: OutdoorScene, box: Box) {
  const { ctx, plane, colour } = scene, [x, y, w, h] = box;
  if (h <= 0) return;
  const brightness = colour.reduce((sum, value) => sum + value, 0) / 765;
  ctx.save(); surfacePath(ctx, plane.quad(box, 8)); ctx.clip();
  ctx.globalAlpha = .62 + .18 * brightness;
  fill(ctx, plane.quad(box, 8), paint(colour, 1));
  ctx.globalAlpha = .07;
  const pitch = Math.max(2, plane.widthMm / plane.width * 2);
  const rows = Math.min(600, Math.ceil(h * plane.heightMm / pitch));
  const cols = Math.min(800, Math.ceil(w * plane.widthMm / pitch));
  ctx.beginPath();
  for (let row = 0; row <= rows; row++) {
    const v = y + row * pitch / plane.heightMm;
    ctx.moveTo(...plane.project(x, v, 8)); ctx.lineTo(...plane.project(x + w, v, 8));
  }
  for (let col = 0; col <= cols; col++) {
    const u = x + col * pitch / plane.widthMm;
    ctx.moveTo(...plane.project(u, y, 8)); ctx.lineTo(...plane.project(u, y + h, 8));
  }
  ctx.strokeStyle = paint(colour, .35); ctx.lineWidth = .55; ctx.stroke(); ctx.restore();
}
