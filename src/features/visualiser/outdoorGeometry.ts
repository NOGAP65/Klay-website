import { unitPosition } from './slattedGeometry';

import type { SlattedPlane } from './slattedGeometry';

/** Nominal residential profiles for visualisation, not manufacturing dimensions. */
export function shutterGeometry(plane: SlattedPlane, position: number) {
  const pitch = 42 / plane.heightMm, rail = 55 / plane.heightMm;
  const bottom = unitPosition(position) * (1 - rail);
  const slats = Array.from({ length: Math.ceil(bottom / pitch) }, (_, row) => bottom - (row + 1) * pitch);
  return { pitch, rail, bottom, slats, head: 180 / plane.heightMm, guide: 53 / plane.widthMm };
}

export function zipGeometry(plane: SlattedPlane, position: number) {
  const head = 125 / plane.heightMm, rail = 56 / plane.heightMm, guide = 52 / plane.widthMm;
  const bottom = head + unitPosition(position) * (1 - head - rail);
  return { head, rail, guide, bottom, mesh: [guide, head, 1 - 2 * guide, bottom - head] as [number, number, number, number] };
}
