import { honeycombCells, honeycombGeometry } from './honeycombGeometry';

import type { BlindLighting } from './blindLighting';
import type { Point } from './homography';

interface HoneycombPaint {
  corners: Point[];
  rollPosition?: number;
  honeycombDayPosition?: number;
  windowSize?: string;
  blindType: string;
  fabricColor: string;
  dayColor?: string;
  lighting: BlindLighting;
  weave?: HTMLImageElement;
  dayWeave?: HTMLImageElement;
  material?: HTMLCanvasElement;
}
type Geometry = ReturnType<typeof honeycombGeometry>;
type Scene = { ctx: CanvasRenderingContext2D; g: Geometry; lighting: BlindLighting };
type Band = { from: number; length: number; hex: string; isDay: boolean; weave?: HTMLImageElement; material?: HTMLCanvasElement };
const rgb = (hex: string) => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
const lit = (hex: string, lighting: BlindLighting) => rgb(hex).map((value, i) => value * lighting.tint[i] * lighting.exposure);
const paint = (colour: number[], brightness: number, opacity = 1) =>
  `rgba(${colour.map(value => Math.round(Math.max(0, Math.min(255, value * brightness)))).join(',')},${opacity})`;
function path(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath(); ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
}
function fill(ctx: CanvasRenderingContext2D, points: Point[], colour: string | CanvasGradient) {
  path(ctx, points); ctx.fillStyle = colour; ctx.fill();
}

function drawRail({ ctx, g, lighting }: Scene, from: number, height: number) {
  const hardware = lit('#f2f1ed', lighting);
  const points = g.quad(from, from + height, 18);
  const gradient = ctx.createLinearGradient(...points[0], ...points[3]);
  for (const [stop, light] of [[0, .91], [.16, 1.02], [.8, .98], [1, .82]]) gradient.addColorStop(stop, paint(hardware, light));
  fill(ctx, points, gradient);
  const side = g.yaw >= 0 ? 0 : 1;
  fill(ctx, [g.project(side, from), g.project(side, from, 18), g.project(side, from + height, 18),
    g.project(side, from + height)], paint(hardware, .83));
}

function drawCellSide({ ctx, g }: Scene, levels: number[], depth: number, colour: number[]) {
  if (Math.abs(g.yaw) <= .07 || levels[3] - levels[0] < g.packedPitch * 3) return;
  const side = g.yaw > 0 ? 0 : 1;
  const cavity = [g.project(side, levels[0]), g.project(side, levels[1], depth),
    g.project(side, levels[2], depth), g.project(side, levels[3]),
    g.project(side, levels[2], -8), g.project(side, levels[1], -8)];
  // A hollow side cell, never a black stripe across the face.
  fill(ctx, cavity, paint(colour, .58));
  const centre = g.project(side, (levels[0] + levels[3]) / 2, 3);
  fill(ctx, cavity.map(p => [centre[0] + (p[0] - centre[0]) * .73,
    centre[1] + (p[1] - centre[1]) * .73]), paint(colour, .32));
}

function drawGrain({ ctx, g }: Scene, band: Band, texture: HTMLImageElement | HTMLCanvasElement, opacity: number) {
  ctx.save();
  const [tl, tr, , bl] = g.quad(0, 1);
  path(ctx, g.quad(band.from, band.from + band.length, 10)); ctx.clip();
  const scale = g.width / 360;
  ctx.transform((tr[0] - tl[0]) / g.width * scale, (tr[1] - tl[1]) / g.width * scale,
    (bl[0] - tl[0]) / g.height * scale, (bl[1] - tl[1]) / g.height * scale, tl[0], tl[1]);
  const pattern = ctx.createPattern(texture, 'repeat');
  if (pattern) {
    ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = opacity;
    ctx.fillStyle = pattern; ctx.fillRect(-64, -64, g.width / scale + 128, g.height / scale + 128);
  }
  ctx.restore();
}

function drawFabric(scene: Scene, band: Band) {
  const { ctx, g, lighting } = scene;
  const { from, length, isDay } = band;
  const colour = lit(band.hex, lighting);
  const cells = honeycombCells(from, length, g);
  // Underpaint prevents shared-edge antialiasing from making transparent gaps.
  fill(ctx, g.quad(from, from + length, 10), paint(colour, .98, isDay ? .4 : 1));
  for (const cell of cells) {
    const height = cell.end - cell.start, depth = 13 + (1 - cell.opening) * 3;
    const levels = [cell.start, cell.start + height * .25, cell.end - height * .25, cell.end];
    const depths = [0, depth, depth, 0];
    const points = levels.map((level, i) => [g.project(0, level, depths[i]), g.project(1, level, depths[i])]);
    const light = isDay ? 1.04 : 1;
    for (let face = 0; face < 3; face++) {
      const gradient = ctx.createLinearGradient(...points[face][0], ...points[face + 1][0]);
      // Fabric planes and a narrow crease supply depth, with no metallic slat
      // highlights. The shade stays attached to its rails at every position.
      const tones = [[.92, 1.02], [1.02, .97], [.97, .85]][face];
      gradient.addColorStop(0, paint(colour, light * tones[0]));
      gradient.addColorStop(1, paint(colour, light * tones[1]));
      ctx.globalAlpha = isDay ? .38 : 1;
      fill(ctx, [points[face][0], points[face][1], points[face + 1][1], points[face + 1][0]], gradient);
      ctx.globalAlpha = 1;
    }
    drawCellSide(scene, levels, depth, colour);
  }
  // Quiet broad room light breaks up a flat computer-coloured surface.
  const surface = g.quad(from, from + length, 10);
  const sheen = ctx.createLinearGradient(...surface[0], ...surface[2]);
  sheen.addColorStop(0, 'rgba(255,250,240,.035)');
  sheen.addColorStop(.45, 'rgba(30,25,18,0)');
  sheen.addColorStop(1, 'rgba(30,25,18,.035)');
  fill(ctx, surface, sheen);
  if (band.material) drawGrain(scene, band, band.material, .65);
  if (band.weave) drawGrain(scene, band, band.weave, .2);
}

/** Horizontal cellular cloth on the existing sRGB photo canvas. No additional
 * GPU context or render target is needed on either modern or basic phones. */
export function drawHoneycomb(ctx: CanvasRenderingContext2D, options: HoneycombPaint) {
  const isDayNight = options.blindType === 'honeycomb-daynight';
  const g = honeycombGeometry(options.corners, options.rollPosition ?? 1,
    { dayNight: isDayNight, dayPosition: options.honeycombDayPosition, size: options.windowSize });
  const scene = { ctx, g, lighting: options.lighting };
  ctx.save();
  ctx.shadowColor = 'rgba(30,25,18,.16)'; ctx.shadowBlur = Math.max(1, g.width * .009);
  ctx.shadowOffsetY = g.height * .003;
  fill(ctx, g.coverage, 'rgba(30,25,18,.08)');
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  if (isDayNight) drawFabric(scene, { from: g.head, length: g.dayLength,
    hex: options.dayColor ?? options.fabricColor, isDay: true, weave: options.dayWeave, material: options.material });
  drawFabric(scene, { from: g.nightStart, length: g.nightLength,
    hex: options.fabricColor, isDay: false, weave: options.weave, material: options.material });
  drawRail(scene, 0, g.head);
  if (isDayNight) drawRail(scene, g.head + g.dayLength, g.rail);
  drawRail(scene, g.bottom, g.rail);
  ctx.restore();
}
