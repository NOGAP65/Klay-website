import { slattedPlane, venetianSlats, plantationPanels } from './slattedGeometry';
import { drawSlattedBlade as blade, drawSlattedFrame as beam, fillSlattedFace as fill, slattedPaint as paint } from './slattedSolids';
import { surfacePath as path } from './slattedSurface';

import type { BlindLighting } from './blindLighting';
import type { Point } from './homography';
import type { Slat } from './slattedGeometry';
import type { SlattedScene as Scene } from './slattedSolids';

interface Options {
  corners: Point[]; blindType: string; fabricColor: string; windowSize?: string;
  rollPosition?: number; slatTilt?: number; controlType?: string;
  lighting: BlindLighting; texture?: HTMLImageElement;
}
function ladders(scene: Scene, top: number, bottom: number) {
  const { ctx, plane, colour } = scene;
  for (const x of plane.widthMm > 1900 ? [.12, .5, .88] : [.14, .86]) {
    const line = [plane.project(x, top, 25), plane.project(x, bottom, 25)];
    ctx.beginPath(); ctx.moveTo(...line[0]); ctx.lineTo(...line[1]);
    ctx.strokeStyle = paint(colour, .62, 12); ctx.lineWidth = Math.max(.45, plane.width / plane.widthMm * 1.2); ctx.stroke();
  }
}

function blades(scene: Scene, slats: Slat[], x: number, width: number) {
  const middle = slats[Math.floor(slats.length / 2)], view = scene.plane.viewAt(x + width / 2, middle.centre);
  const isUpperInFront = Math.sin(middle.angle) * view[2] - Math.cos(middle.angle) * view[1] >= 0;
  const indexed = slats.map((slat, index) => ({ slat, index }));
  if (isUpperInFront) indexed.reverse();
  for (const { slat, index } of indexed) blade(scene, slat, { x, width, index });
}

function venetian(scene: Scene, options: Options) {
  const { ctx, plane } = scene;
  const geometry = venetianSlats(plane, { position: options.rollPosition ?? 1, tilt: options.slatTilt ?? .42 });
  ctx.save(); path(ctx, plane.quad([0, geometry.head, 1, geometry.bottom - geometry.head])); ctx.clip();
  const tuck = (Math.abs(plane.yaw) * 50 + 2) / plane.widthMm;
  blades(scene, geometry.slats, -tuck, 1 + 2 * tuck);
  ladders(scene, geometry.head, geometry.bottom); ctx.restore();
  beam(scene, [0, 0, 1, geometry.head]);
  beam(scene, [0, geometry.bottom, 1, geometry.rail]);
  // Tilt wand hangs from the headrail; it does not shorten with the lift cord.
  if (options.controlType !== 'motorised') fill(ctx, plane.quad([.965, geometry.head, 3 / plane.widthMm, Math.min(.22, 350 / plane.heightMm)], 30), paint(scene.colour, .9, 4));
}

function plantation(scene: Scene, options: Options) {
  const { ctx, plane } = scene;
  const { panels, stile, rail, hasMidrail } = plantationPanels(plane, options.rollPosition ?? .5);
  for (const panel of panels) for (const section of panel.sections) {
    ctx.save(); path(ctx, plane.quad([panel.x, section.top, panel.width, section.bottom - section.top])); ctx.clip();
    // Hidden tilt link sits behind the louvres, tucked against the stile.
    fill(ctx, plane.quad([panel.x + panel.width - 8 / plane.widthMm, section.top, 4 / plane.widthMm, section.bottom - section.top]), paint(scene.colour, .7));
    const tuck = (Math.abs(plane.yaw) * 65 + 2) / plane.widthMm;
    blades(scene, section.slats, panel.x - tuck, panel.width + tuck * 2);
    ctx.restore();
  }
  beam(scene, [0, 0, 1, rail]); beam(scene, [0, 1 - rail, 1, rail]);
  beam(scene, [0, 0, stile * 1.5, 1]); beam(scene, [1 - stile * 1.5, 0, stile * 1.5, 1]);
  for (const panel of panels.slice(1)) {
    beam(scene, [panel.x - stile, rail, stile, 1 - rail * 2]);
    // The meeting stiles belong to separate hinged panels.
    fill(ctx, plane.quad([panel.x - stile / 2, rail, 1.5 / plane.widthMm, 1 - rail * 2], 27), paint(scene.colour, .57));
  }
  if (hasMidrail) beam(scene, [0, .5 - rail / 2, 1, rail]);
}

export function drawSlattedCovering(ctx: CanvasRenderingContext2D, options: Options) {
  const plane = slattedPlane(options.corners, options.windowSize, [ctx.canvas.width, ctx.canvas.height]);
  const colour = [1, 3, 5].map((offset, index) => parseInt(options.fabricColor.slice(offset, offset + 2), 16)
    * options.lighting.tint[index] * options.lighting.exposure);
  const scene = { ctx, plane, colour, texture: options.texture };
  ctx.save(); path(ctx, options.corners); ctx.clip();
  if (options.blindType === 'plantation') plantation(scene, options);
  else venetian(scene, options);
  ctx.restore();
}
