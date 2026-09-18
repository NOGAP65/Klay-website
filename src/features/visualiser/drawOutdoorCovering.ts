import { shutterGeometry, zipGeometry } from './outdoorGeometry';
import { outdoorBeam as beam, shutterSlat, zipMesh } from './outdoorSurface';
import { slattedPlane } from './slattedGeometry';
import { fillSlattedFace as fill, slattedPaint as paint } from './slattedSolids';
import { surfacePath } from './slattedSurface';

import type { BlindLighting } from './blindLighting';
import type { Point } from './homography';
import type { OutdoorScene } from './outdoorSurface';

interface Options {
  corners: Point[]; blindType: string; fabricColor: string; hardwareColor?: string | null;
  windowSize?: string; rollPosition?: number; lighting: BlindLighting;
}
function shutter(scene: OutdoorScene, position: number) {
  const { ctx, plane, colour } = scene, g = shutterGeometry(plane, position);
  ctx.save(); surfacePath(ctx, plane.quad([0, 0, 1, g.bottom], 8.5)); ctx.clip();
  fill(ctx, plane.quad([0, 0, 1, g.bottom], 8.5), paint(colour, .9));
  for (const y of g.slats) shutterSlat(scene, y, g.pitch);
  ctx.restore();
  beam(scene, [0, g.bottom, 1, g.rail], 17);
  // Face-mounted outside the opening, so the sill and glazing remain in place.
  beam(scene, [-g.guide, 0, g.guide, 1]);
  beam(scene, [1, 0, g.guide, 1]);
  beam(scene, [-g.guide, -g.head, 1 + 2 * g.guide, g.head], 90);
  fill(ctx, plane.quad([0, 0, 1, 3 / plane.heightMm], 12), paint(colour, .5));
}
function zip(scene: OutdoorScene, position: number, hardware: number[]) {
  const { plane } = scene, g = zipGeometry(plane, position), frame = { ...scene, colour: hardware };
  zipMesh(scene, g.mesh);
  beam(frame, [g.guide, g.bottom, 1 - g.guide * 2, g.rail], 18);
  beam(frame, [0, 0, g.guide, 1], 28);
  beam(frame, [1 - g.guide, 0, g.guide, 1], 28);
  beam(frame, [0, 0, 1, g.head], 65);
}
export function drawOutdoorCovering(ctx: CanvasRenderingContext2D, options: Options) {
  const alfrescoWidth = { small: 2400, medium: 3600, large: 4800 }[options.windowSize ?? 'medium'];
  const plane = slattedPlane(options.corners, options.windowSize, [ctx.canvas.width, ctx.canvas.height], options.blindType === 'zip-screen' ? alfrescoWidth : undefined);
  const lit = (hex: string) => [1, 3, 5].map((offset, index) => parseInt(hex.slice(offset, offset + 2), 16)
    * options.lighting.tint[index] * options.lighting.exposure);
  const scene = { ctx, plane, colour: lit(options.fabricColor) };
  ctx.save();
  if (options.blindType === 'roller-shutter') shutter(scene, options.rollPosition ?? 1);
  else zip(scene, options.rollPosition ?? 1, lit(options.hardwareColor ?? '#333638'));
  ctx.restore();
}
