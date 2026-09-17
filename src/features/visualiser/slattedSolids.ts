import { dot3 } from './slattedCamera';
import { slatProfile } from './slattedGeometry';
import { surfaceGradient, surfacePath } from './slattedSurface';

import type { Point } from './homography';
import type { Vector3 } from './slattedCamera';
import type { SlattedPlane, Slat } from './slattedGeometry';

export type SlattedScene = { ctx: CanvasRenderingContext2D; plane: SlattedPlane; colour: number[]; texture?: HTMLImageElement };
export const slattedPaint = (colour: number[], level: number, bounce = 0) =>
  `rgb(${colour.map(value => Math.round(Math.min(255, Math.max(0, value * level + bounce)))).join(',')})`;
export function fillSlattedFace(ctx: CanvasRenderingContext2D, points: Point[], colour: string | CanvasGradient) {
  surfacePath(ctx, points); ctx.fillStyle = colour; ctx.fill();
}
const lightLevel = (scene: SlattedScene, normal: Vector3) => .67 + .35 * Math.max(0, dot3(normal, scene.plane.light));

function silhouette(points: Point[]): Point[] {
  const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const half = (vertices: Point[]) => {
    const hull: Point[] = [];
    for (const p of vertices) {
      while (hull.length > 1) {
        const a = hull[hull.length - 2], b = hull[hull.length - 1];
        if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) > 0) break;
        hull.pop();
      }
      hull.push(p);
    }
    return hull.slice(0, -1);
  };
  return [...half(sorted), ...half(sorted.reverse())];
}

function grain(scene: SlattedScene, points: Point[], seed: number) {
  const { ctx, texture } = scene;
  if (!texture) return;
  const [left, right, , bottom] = points;
  ctx.save(); surfacePath(ctx, points); ctx.clip();
  ctx.transform((right[0] - left[0]) / 512, (right[1] - left[1]) / 512,
    (bottom[0] - left[0]) / 64, (bottom[1] - left[1]) / 64, left[0], left[1]);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .3;
  const band = Math.min(32, texture.naturalHeight * .6);
  const sy = texture.naturalHeight * .15 + Math.floor(seed * 17) % Math.max(1, texture.naturalHeight * .7 - band);
  ctx.drawImage(texture, texture.naturalWidth * .1, sy, texture.naturalWidth * .8, band, 0, 0, 512, 64);
  ctx.restore();
}

/** Render the visible curved surface, not a gradient pasted across its bounds.
 * Each normal and depth belongs to the same rotating rigid cross-section. */
export function drawSlattedBlade(scene: SlattedScene, slat: Slat, span: { x: number; width: number; index: number }) {
  const { ctx, plane, colour } = scene, profile = slatProfile(plane, slat);
  const view = plane.viewAt(span.x + span.width / 2, slat.centre);
  const end = (x: number) => profile.map(p => plane.project(x, p.y, p.depth));
  const left = end(span.x), right = end(span.x + span.width);
  // Opaque underpaint prevents the photo leaking through antialiased joins
  // between patches, especially when the whole blind is scaled on a phone.
  const outline = silhouette([...left, ...right]);
  ctx.save(); surfacePath(ctx, outline); ctx.clip();
  fillSlattedFace(ctx, outline, slattedPaint(colour, .92, 1));
  for (let i = 0; i < profile.length - 1; i++) {
    const a = profile[i], b = profile[i + 1];
    const normal = a.normal.map((n, axis) => (n + b.normal[axis]) / 2) as Vector3;
    if (dot3(normal, view) <= 0) continue;
    const face = [left[i], right[i], right[i + 1], left[i + 1]];
    const gradient = surfaceGradient(ctx, face, [[0, slattedPaint(colour, lightLevel(scene, a.normal), 1)],
      [1, slattedPaint(colour, lightLevel(scene, b.normal), 1)]]);
    fillSlattedFace(ctx, face, gradient);
    // Subpixel overlap joins curved patches without translucent mesh seams.
    ctx.strokeStyle = gradient; ctx.lineWidth = .45; ctx.stroke();
  }
  const down = plane.project(span.x, 1), up = plane.project(span.x, 0);
  const order = left.map((point, i) => ({ i, y: point[0] * (down[0] - up[0]) + point[1] * (down[1] - up[1]) })).sort((a, b) => a.y - b.y);
  const top = order[0].i, bottom = order[order.length - 1].i;
  grain(scene, [left[top], right[top], right[bottom], left[bottom]], span.index);
  const side = view[0] < 0 ? -1 : 1;
  if (Math.abs(view[0]) > .015) fillSlattedFace(ctx, side < 0 ? left : right, slattedPaint(colour, lightLevel(scene, [side, 0, 0])));
  ctx.restore();
}

/** Solid frame returns occlude the louvre ends. They must be drawn as actual
 * side/underside faces; symmetric bevel gradients cannot convey this depth. */
export function drawSlattedFrame(scene: SlattedScene, box: [number, number, number, number], depth = 26) {
  const { ctx, plane, colour } = scene;
  const [x, y, width, height] = box, front = plane.quad(box, depth), back = plane.quad(box, -18);
  const view = plane.viewAt(x + width / 2, y + height / 2);
  const faces: { edge: [number, number]; normal: Vector3 }[] = [
    { edge: [0, 1], normal: [0, -1, 0] }, { edge: [1, 2], normal: [1, 0, 0] },
    { edge: [2, 3], normal: [0, 1, 0] }, { edge: [3, 0], normal: [-1, 0, 0] },
  ];
  for (const { edge: [a, b], normal } of faces) {
    if (dot3(normal, view) <= 0) continue;
    fillSlattedFace(ctx, [back[a], back[b], front[b], front[a]], slattedPaint(colour, lightLevel(scene, normal), 1));
  }
  const faceLight = lightLevel(scene, [0, 0, 1]);
  fillSlattedFace(ctx, front, slattedPaint(colour, faceLight, 1));
  // A 1.5 mm eased edge, not an inflated rounded border around every board.
  const bevelX = Math.min(width / 4, 1.5 / plane.widthMm), bevelY = Math.min(height / 4, 1.5 / plane.heightMm);
  const inset = plane.quad([x + bevelX, y + bevelY, width - bevelX * 2, height - bevelY * 2], depth + 1.5);
  for (const { edge: [a, b], normal } of faces) {
    const n: Vector3 = [normal[0] * Math.SQRT1_2, normal[1] * Math.SQRT1_2, Math.SQRT1_2];
    fillSlattedFace(ctx, [front[a], front[b], inset[b], inset[a]], slattedPaint(colour, lightLevel(scene, n), 1));
  }
}
