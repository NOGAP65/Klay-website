import { applyHomography, computeHomography } from './homography';

import type { Point } from './homography';

const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Size bands specify width, not an exact measured drop. Infer a nominal drop
 * from the trace aspect for a consistent cell scale; never treat it as an order
 * measurement. 32 mm pitch and 0.85 mm packed pitch are preview dimensions. */
export function honeycombGeometry(corners: Point[], position: number, { dayNight = false, dayPosition = .5, size = 'medium' } = {}) {
  const [tl, tr, br, bl] = corners;
  const width = Math.max(1, (distance(tl, tr) + distance(bl, br)) / 2);
  const height = Math.max(1, (distance(tl, bl) + distance(tr, br)) / 2);
  const nominalWidth = size === 'small' ? 900 : size === 'large' ? 2700 : 1800;
  const dropMm = Math.max(600, Math.min(3600, nominalWidth * height / width));
  const head = 30 / dropMm, rail = 22 / dropMm;
  const count = Math.max(16, Math.min(110, Math.round((dropMm - 52) / 32)));
  const packedPitch = .85 / dropMm;
  const stack = count * packedPitch;
  const free = 1 - head - rail - stack * (dayNight ? 2 : 1) - (dayNight ? rail : 0);
  const travel = free * clamp(position);
  const dayLength = dayNight ? stack + travel * clamp(dayPosition) : 0;
  const nightStart = head + dayLength + (dayNight ? rail : 0);
  const nightLength = stack + travel * (dayNight ? 1 - clamp(dayPosition) : 1);
  const bottom = nightStart + nightLength;
  const homography = computeHomography([[0, 0], [1, 0], [1, 1], [0, 1]], corners);
  const yaw = Math.max(-1, Math.min(1, 3 * (distance(tl, bl) - distance(tr, br)) / (height * 2)));
  const along: Point = [(tr[0] - tl[0]) / distance(tl, tr), (tr[1] - tl[1]) / distance(tl, tr)];
  const project = (u: number, v: number, depthMm = 0): Point => {
    const p = applyHomography(homography, [u, v]);
    const top = applyHomography(homography, [u, 0]), end = applyHomography(homography, [u, 1]);
    const depth = depthMm / dropMm;
    return [p[0] + along[0] * yaw * depth * height - (end[0] - top[0]) * depth * .16,
      p[1] + along[1] * yaw * depth * height - (end[1] - top[1]) * depth * .16];
  };
  const quad = (from: number, to: number, depth = 0): Point[] =>
    [project(0, from, depth), project(1, from, depth), project(1, to, depth), project(0, to, depth)];
  return { count, head, rail, bottom, nightStart, nightLength, dayLength, stack, packedPitch,
    pitch: (free + stack) / count, dropMm, width, height, yaw, project, quad,
    coverage: quad(0, bottom + rail, 16) };
}

/** Cells collapse onto the lifting rail. They do not disappear or stretch a
 * texture: the lower cells pack first, with one partially folding transition. */
export function honeycombCells(from: number, length: number, { count, pitch, packedPitch }: Pick<ReturnType<typeof honeycombGeometry>, 'count' | 'pitch' | 'packedPitch'>) {
  const extra = Math.max(0, length - count * packedPitch);
  const unfolded = extra / Math.max(.000001, pitch - packedPitch);
  let cursor = from;
  return Array.from({ length: count }, (_, index) => {
    const opening = clamp(unfolded - index);
    const height = packedPitch + opening * (pitch - packedPitch);
    const start = cursor;
    cursor += height;
    return { start, end: cursor, opening };
  });
}
