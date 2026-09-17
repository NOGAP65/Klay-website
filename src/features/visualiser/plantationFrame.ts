import { dot3 } from './slattedCamera';
import { fillSlattedFace as fill, slattedPaint as paint } from './slattedSolids';
import { surfaceGradient } from './slattedSurface';

import type { Point } from './homography';
import type { Vector3 } from './slattedCamera';
import type { plantationPanels } from './slattedGeometry';
import type { SlattedScene } from './slattedSolids';

type Layout = ReturnType<typeof plantationPanels>;
type Box = [number, number, number, number];
const inwardNormals: Vector3[] = [[0, 1, 0], [-1, 0, 0], [0, -1, 0], [1, 0, 0]];
const light = (scene: SlattedScene, normal: Vector3) => .67 + .35 * Math.max(0, dot3(normal, scene.plane.light));

function contour(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
}

/** Only the aperture has deep returns. Rail/stile joints share one flush
 * face, so no cuboid end faces can overlap at the four frame corners. */
function aperture(scene: SlattedScene, box: Box) {
  const { ctx, plane, colour } = scene;
  const [x, y, w, h] = box, front = plane.quad(box), back = plane.quad(box, -18);
  const easeX = 1 / plane.widthMm, easeY = 1 / plane.heightMm;
  const eased = plane.quad([x + easeX, y + easeY, w - easeX * 2, h - easeY * 2], 25);
  const view = plane.viewAt(x + w / 2, y + h / 2);
  for (const [i, normal] of inwardNormals.entries()) {
    const j = (i + 1) % 4;
    if (dot3(normal, view) > 0) fill(ctx, [front[i], front[j], back[j], back[i]], paint(colour, light(scene, normal), 1));
    const bevel: Vector3 = [normal[0] * Math.SQRT1_2, normal[1] * Math.SQRT1_2, Math.SQRT1_2];
    fill(ctx, [front[i], front[j], eased[j], eased[i]], paint(colour, light(scene, bevel), 1));
  }
}

function joints(scene: SlattedScene, layout: Layout) {
  const { ctx, plane, colour } = scene;
  // Fine butt joints stop at the aperture; they never cross the outer stiles.
  ctx.strokeStyle = paint(colour, .83, 1);
  ctx.lineWidth = Math.max(.35, plane.width / plane.widthMm * .6);
  for (const panel of layout.panels) for (const { top, bottom } of panel.sections) {
    for (const y of [top, bottom]) for (const [x, end] of [[panel.x - layout.stile, panel.x],
      [panel.x + panel.width, panel.x + panel.width + layout.stile]]) {
      ctx.beginPath(); ctx.moveTo(...plane.project(x, y)); ctx.lineTo(...plane.project(end, y)); ctx.stroke();
    }
  }
  for (const panel of layout.panels.slice(1)) {
    fill(ctx, plane.quad([panel.x - layout.stile - .75 / plane.widthMm, 0, 1.5 / plane.widthMm, 1]), paint(colour, .64));
  }
}

function recessContact(scene: SlattedScene) {
  const { ctx, plane } = scene;
  const dx = 12 / plane.widthMm, dy = 12 / plane.heightMm;
  const outside = plane.quad([0, 0, 1, 1]), inside = plane.quad([dx, dy, 1 - dx * 2, 1 - dy * 2]);
  // The photographed jambs sit in front of the installation plane. Their
  // contact shade falls onto the shutter, never outside onto the white reveal.
  for (const [i, strength] of [.22, .12, .08, .16].entries()) {
    const j = (i + 1) % 4, face = [outside[i], outside[j], inside[j], inside[i]];
    fill(ctx, face, surfaceGradient(ctx, face, [[0, `rgba(28,24,20,${strength})`],
      [.35, `rgba(28,24,20,${strength * .3})`], [1, 'rgba(28,24,20,0)']]));
  }
}

export function drawPlantationFrame(scene: SlattedScene, layout: Layout) {
  const { ctx, plane, colour } = scene;
  const openings = layout.panels.flatMap(panel => panel.sections.map(section =>
    [panel.x, section.top, panel.width, section.bottom - section.top] as Box));
  for (const box of openings) aperture(scene, box);
  // One opaque, coplanar face with cut-outs for every louvre bank. This also
  // joins the divider rail to the stiles without a raised horizontal crossbar.
  ctx.beginPath(); contour(ctx, plane.quad([0, 0, 1, 1]));
  for (const box of openings) contour(ctx, plane.quad(box));
  ctx.fillStyle = paint(colour, light(scene, [0, 0, 1]), 1); ctx.fill('evenodd');
  joints(scene, layout);
  recessContact(scene);
}
