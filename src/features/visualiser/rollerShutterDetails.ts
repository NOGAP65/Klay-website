import { fillSlattedFace as fill, slattedPaint as paint } from './slattedSolids';
import { surfaceGradient, surfacePath } from './slattedSurface';

import type { Point } from './homography';
import type { shutterGeometry } from './outdoorGeometry';
import type { OutdoorScene } from './outdoorSurface';

type Geometry = ReturnType<typeof shutterGeometry>;

/** Powder-coated slats have a shallow asymmetric crown and a narrow folded
 * interlock. Keep most of the face matte instead of shading it like a tube. */
export function shutterSlat(scene: OutdoorScene, y: number, pitch: number) {
  const { ctx, plane, colour } = scene, quad = plane.quad([0, y, 1, pitch], 8.5);
  fill(ctx, quad, surfaceGradient(ctx, quad, [[0, paint(colour, .73, 3)], [.035, paint(colour, .92, 2)],
    [.09, paint(colour, 1, 3)], [.25, paint(colour, .99, 2)], [.73, paint(colour, .96, 1)],
    [.91, paint(colour, .94)], [.97, paint(colour, .88)], [1, paint(colour, .7, 2)]]));
}

export function shutterWallShadow(scene: OutdoorScene, g: Geometry) {
  const { ctx, plane } = scene, scale = plane.width / plane.widthMm;
  ctx.save();
  ctx.shadowColor = 'rgba(35,29,21,.24)'; ctx.shadowBlur = 14 * scale;
  ctx.shadowOffsetX = 5 * scale; ctx.shadowOffsetY = 9 * scale;
  fill(ctx, plane.quad([-g.guide, -g.head, 1 + 2 * g.guide, g.head], 0), 'rgba(35,29,21,.2)');
  ctx.shadowBlur = 7 * scale; ctx.shadowOffsetY = 2 * scale;
  for (const x of [-g.guide, 1]) fill(ctx, plane.quad([x, 0, g.guide, 1], 0), 'rgba(35,29,21,.14)');
  ctx.restore();
}

export function shutterGuide(scene: OutdoorScene, x: number, width: number) {
  const { ctx, plane, colour } = scene, front = plane.quad([x, 0, width, 1], 22);
  const back = plane.quad([x, 0, width, 1], 0);
  fill(ctx, [back[0], back[3], front[3], front[0]], paint(colour, .8));
  fill(ctx, [back[1], back[2], front[2], front[1]], paint(colour, .72));
  const gradient = ctx.createLinearGradient(...front[0], ...front[1]);
  for (const [t, value] of [[0, .85], [.06, 1.01], [.22, .99], [.91, .96], [1, .76]]) gradient.addColorStop(t, paint(colour, value, 1));
  fill(ctx, front, gradient);
}

export function shutterContactShade(scene: OutdoorScene, g: Geometry) {
  const { ctx, plane } = scene, side = 10 / plane.widthMm;
  ctx.save(); surfacePath(ctx, plane.quad([0, 0, 1, g.bottom + g.rail], 8.5)); ctx.clip();
  for (const [x, direction] of [[0, 1], [1, -1]]) {
    const left = plane.project(x, 0, 8.5), right = plane.project(x + side * direction, 0, 8.5);
    const gradient = ctx.createLinearGradient(...left, ...right);
    gradient.addColorStop(0, 'rgba(28,25,20,.22)'); gradient.addColorStop(1, 'rgba(28,25,20,0)');
    fill(ctx, plane.quad([Math.min(x, x + side * direction), 0, side, 1], 8.5), gradient);
  }
  const top = plane.quad([0, 0, 1, 30 / plane.heightMm], 8.5);
  fill(ctx, top, surfaceGradient(ctx, top, [[0, 'rgba(28,25,20,.25)'], [1, 'rgba(28,25,20,0)']]));
  ctx.restore();
}

/** Separate folded front, lower return and end cheeks of the metal headbox.
 * All faces share vertices, so the housing stays connected at oblique angles. */
export function shutterHeadbox(scene: OutdoorScene, g: Geometry) {
  const { ctx, plane, colour } = scene, left = -g.guide, right = 1 + g.guide;
  const section = (x: number): Point[] => [plane.project(x, -g.head, 0), plane.project(x, -g.head, 140),
    plane.project(x, -g.head * .28, 140), plane.project(x, 0, 85), plane.project(x, 0, 0)];
  const a = section(left), b = section(right);
  fill(ctx, [a[0], b[0], b[1], a[1]], paint(colour, .98, 3));
  const face = [a[1], b[1], b[2], a[2]], bevel = [a[2], b[2], b[3], a[3]];
  fill(ctx, face, surfaceGradient(ctx, face, [[0, paint(colour, 1, 4)], [.12, paint(colour, 1, 2)], [1, paint(colour, .97)]]));
  fill(ctx, bevel, surfaceGradient(ctx, bevel, [[0, paint(colour, .88, 2)], [1, paint(colour, .73, 2)]]));
  fill(ctx, [a[3], b[3], b[4], a[4]], paint(colour, .58, 3));
  for (const [points, value] of [[a, .94], [b, .85]] as const) {
    fill(ctx, [...points], paint(colour, value, 1));
    ctx.save(); surfacePath(ctx, [...points]); ctx.strokeStyle = paint(colour, .66, 2);
    ctx.lineWidth = Math.max(.45, plane.width / plane.widthMm); ctx.stroke(); ctx.restore();
  }
  // Slim end-plate seams belong to the same housing colour, not white trim.
  for (const x of [left + 8 / plane.widthMm, right - 8 / plane.widthMm]) {
    const edge = section(x);
    ctx.beginPath(); ctx.moveTo(...edge[1]); ctx.lineTo(...edge[2]); ctx.lineTo(...edge[3]);
    ctx.strokeStyle = paint(colour, .78); ctx.lineWidth = Math.max(.4, plane.width / plane.widthMm * .8); ctx.stroke();
  }
}
