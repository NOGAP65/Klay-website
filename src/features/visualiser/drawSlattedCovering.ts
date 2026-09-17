import { slattedPlane, venetianSlats, plantationPanels, slatProfile } from './slattedGeometry';

import type { BlindLighting } from './blindLighting';
import type { Point } from './homography';
import type { SlattedPlane, Slat } from './slattedGeometry';

interface Options {
  corners: Point[]; blindType: string; fabricColor: string; windowSize?: string;
  material?: string; rollPosition?: number; slatTilt?: number; controlType?: string;
  lighting: BlindLighting; texture?: HTMLImageElement;
}
type Scene = { ctx: CanvasRenderingContext2D; plane: SlattedPlane; colour: number[]; texture?: HTMLImageElement; isMetal: boolean };
const paint = (colour: number[], level: number, bounce = 0) =>
  `rgb(${colour.map(value => Math.round(Math.min(255, Math.max(0, value * level + bounce)))).join(',')})`;
function path(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath(); ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
}
function fill(ctx: CanvasRenderingContext2D, points: Point[], colour: string | CanvasGradient) {
  path(ctx, points); ctx.fillStyle = colour; ctx.fill();
}

function grain(scene: Scene, points: Point[], seed: number) {
  const { ctx, texture } = scene;
  if (!texture) return;
  const [left, right, , bottom] = points;
  ctx.save(); path(ctx, points); ctx.clip();
  ctx.transform((right[0] - left[0]) / 512, (right[1] - left[1]) / 512,
    (bottom[0] - left[0]) / 64, (bottom[1] - left[1]) / 64, left[0], left[1]);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = scene.isMetal ? .12 : .3;
  // Each rigid slat keeps its own sampled grain as it tilts and lifts.
  const sy = Math.floor(seed * 17) % Math.max(1, texture.naturalHeight - 32);
  ctx.drawImage(texture, 0, sy, texture.naturalWidth, Math.min(32, texture.naturalHeight), 0, 0, 512, 64);
  ctx.restore();
}

function blade(scene: Scene, slat: Slat, span: { x: number; width: number; index: number }) {
  const { ctx, plane, colour } = scene;
  const profile = slatProfile(plane, slat);
  // Project the crowned profile before finding its silhouette. Depth affects
  // the visible edge, especially when a nearly horizontal blade is opened.
  const edge = profile.map(point => ({ ...point, screenY: point.y - .16 * point.depth / plane.heightMm }));
  const top = edge.reduce((a, b) => a.screenY < b.screenY ? a : b);
  const bottom = edge.reduce((a, b) => a.screenY > b.screenY ? a : b);
  const face = [plane.project(span.x, top.y, top.depth), plane.project(span.x + span.width, top.y, top.depth),
    plane.project(span.x + span.width, bottom.y, bottom.depth), plane.project(span.x, bottom.y, bottom.depth)];
  const gradient = ctx.createLinearGradient(...face[0], ...face[3]);
  const base = .94 + Math.cos(slat.angle) * .04;
  // A continuous highlight avoids anti-alias seams between tiny mesh bands.
  // Metal has a narrow specular highlight; painted timber remains diffuse.
  for (const [stop, light] of [[0, .74], [.12, scene.isMetal ? 1.16 : 1.03], [.4, base], [.88, base - .04], [1, .73]]) {
    gradient.addColorStop(stop, paint(colour, light, scene.isMetal ? 4 : 1));
  }
  fill(ctx, face, gradient);
  grain(scene, face, span.index);
  const side = plane.yaw >= 0 ? span.x : span.x + span.width;
  fill(ctx, profile.map(p => plane.project(side, p.y, p.depth)), paint(colour, .68, 2));
}

function beam(scene: Scene, box: [number, number, number, number], depth = 26) {
  const { ctx, plane, colour } = scene;
  const points = plane.quad(box, depth);
  const isVertical = box[3] * plane.heightMm > box[2] * plane.widthMm;
  const gradient = ctx.createLinearGradient(...points[0], ...points[isVertical ? 1 : 3]);
  for (const [stop, light] of [[0, .76], [.08, 1], [.9, .95], [1, .72]]) gradient.addColorStop(stop, paint(colour, light, 1));
  ctx.save(); ctx.shadowColor = 'rgba(25,22,18,.18)'; ctx.shadowBlur = Math.max(1, plane.width * .004);
  ctx.shadowOffsetY = plane.height * .0015;
  fill(ctx, points, gradient); ctx.restore();
  const edge = plane.quad(box, 0);
  fill(ctx, [edge[1], points[1], points[2], edge[2]], paint(colour, .73));
}

function ladders(scene: Scene, top: number, bottom: number) {
  const { ctx, plane, colour } = scene;
  for (const x of plane.widthMm > 1900 ? [.12, .5, .88] : [.14, .86]) {
    const line = [plane.project(x, top, 25), plane.project(x, bottom, 25)];
    ctx.beginPath(); ctx.moveTo(...line[0]); ctx.lineTo(...line[1]);
    ctx.strokeStyle = paint(colour, .62, 12); ctx.lineWidth = Math.max(.45, plane.width / plane.widthMm * 1.2); ctx.stroke();
  }
}

function venetian(scene: Scene, options: Options) {
  const { ctx, plane } = scene;
  const geometry = venetianSlats(plane, { position: options.rollPosition ?? 1, tilt: options.slatTilt ?? .42, material: options.material ?? 'UltraSlat' });
  ctx.save(); path(ctx, plane.quad([0, geometry.head, 1, geometry.bottom - geometry.head])); ctx.clip();
  geometry.slats.forEach((slat, index) => blade(scene, slat, { x: 0, width: 1, index }));
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
    section.slats.forEach((slat, index) => blade(scene, slat, { x: panel.x, width: panel.width, index }));
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
  const plane = slattedPlane(options.corners, options.windowSize);
  const colour = [1, 3, 5].map((offset, index) => parseInt(options.fabricColor.slice(offset, offset + 2), 16)
    * options.lighting.tint[index] * options.lighting.exposure);
  const scene = { ctx, plane, colour, texture: options.texture, isMetal: options.material === 'Aluminium' };
  ctx.save();
  if (options.blindType === 'plantation') plantation(scene, options);
  else venetian(scene, options);
  ctx.restore();
}
