import { computeHomography } from './homography';
import { slattedCamera } from './slattedCamera';

import type { Point } from './homography';

export const unitPosition = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Measured order dimensions are unavailable in a size-band preview. These
 * nominal dimensions scale rigid profiles consistently against the trace. */
export function slattedPlane(corners: Point[], size = 'medium', photoSize?: Point) {
  const [tl, tr, br, bl] = corners;
  const width = Math.max(1, (distance(tl, tr) + distance(bl, br)) / 2);
  const height = Math.max(1, (distance(tl, bl) + distance(tr, br)) / 2);
  const widthMm = size === 'small' ? 900 : size === 'large' ? 2700 : 1800;
  const transform = computeHomography([[0, 0], [1, 0], [1, 1], [0, 1]], corners);
  const camera = slattedCamera(transform, corners, widthMm, photoSize);
  const { project, viewAt, light } = camera;
  const heightMm = Math.max(600, Math.min(3600, camera.heightMm));
  const view = viewAt(.5, .5), yaw = view[0] / Math.max(.25, view[2]);
  const quad = (box: [number, number, number, number], depth = 26): Point[] => {
    const [x, y, w, h] = box;
    return [project(x, y, depth), project(x + w, y, depth), project(x + w, y + h, depth), project(x, y + h, depth)];
  };
  return { width, height, widthMm, heightMm, yaw, viewAt, light, project, quad };
}
export type SlattedPlane = ReturnType<typeof slattedPlane>;
export interface Slat { centre: number; angle: number; widthMm: number; thicknessMm: number }

export function venetianSlats(plane: SlattedPlane, options: { position: number; tilt: number }) {
  const widthMm = 50, thicknessMm = 2.8;
  const head = 38 / plane.heightMm, rail = 26 / plane.heightMm;
  const available = 1 - head - rail;
  const count = Math.max(8, Math.ceil(available * plane.heightMm / (widthMm * .86)));
  const pitch = available / count, packed = (thicknessMm + .6) / plane.heightMm;
  const travel = count * packed + unitPosition(options.position) * (available - count * packed);
  const expanded = Math.max(0, (travel - count * packed) / (pitch - packed));
  let cursor = head;
  const slats: Slat[] = Array.from({ length: count }, (_, index) => {
    const opening = unitPosition(expanded - index);
    const spacing = packed + (pitch - packed) * opening;
    const centre = cursor + spacing / 2;
    cursor += spacing;
    return { centre, angle: unitPosition(options.tilt) * 1.48 * opening, widthMm, thicknessMm };
  });
  return { slats, head, rail, bottom: head + travel, coverage: plane.quad([0, 0, 1, head + travel + rail]) };
}

export function plantationPanels(plane: SlattedPlane, tilt: number) {
  const stile = 48 / plane.widthMm, rail = 70 / plane.heightMm;
  const count = Math.max(1, Math.min(4, Math.ceil(plane.widthMm / 900)));
  const panelWidth = (1 - stile * 2) / count;
  const hasMidrail = plane.heightMm > 1750;
  const sections = hasMidrail ? [[rail, .5 - rail / 2], [.5 + rail / 2, 1 - rail]] : [[rail, 1 - rail]];
  const panels = Array.from({ length: count }, (_, index) => ({
    x: stile + panelWidth * index + stile / 2, width: panelWidth - stile,
    sections: sections.map(([top, bottom]) => {
      const rows = Math.max(3, Math.ceil((bottom - top) * plane.heightMm / 78));
      return { top, bottom, slats: Array.from({ length: rows }, (_, row): Slat => ({
        centre: top + (row + .5) * (bottom - top) / rows,
        angle: unitPosition(tilt) * 1.48, widthMm: (bottom - top) * plane.heightMm / rows + 7, thicknessMm: 10,
      })) };
    }),
  }));
  return { panels, stile, rail, hasMidrail };
}

/** Elliptical shutter blades / crowned metal and timber slats. Both front and
 * back faces rotate around a stationary centre; no scaling of a flat sticker. */
export function slatProfile(plane: SlattedPlane, slat: Slat) {
  const sine = Math.sin(slat.angle), cosine = Math.cos(slat.angle);
  return Array.from({ length: 33 }, (_, index) => {
    const phase = index / 32 * Math.PI * 2;
    const across = Math.cos(phase) * slat.widthMm / 2;
    const thickness = Math.sin(phase) * slat.thicknessMm / 2;
    const a = Math.cos(phase) / slat.widthMm, b = Math.sin(phase) / slat.thicknessMm;
    const magnitude = Math.hypot(a, b);
    return { y: slat.centre + (across * sine + thickness * cosine) / plane.heightMm,
      depth: across * cosine - thickness * sine + 14,
      normal: [0, (a * sine + b * cosine) / magnitude, (a * cosine - b * sine) / magnitude] as [number, number, number] };
  });
}
