import { dot3 } from './slattedCamera';
import { SLAT_PIVOT_DEPTH_MM } from './slattedGeometry';

import type { Vector3 } from './slattedCamera';
import type { Slat, SlattedPlane, slatProfile } from './slattedGeometry';

type SurfacePoint = ReturnType<typeof slatProfile>[number];
const unit = (v: Vector3): Vector3 => v.map(value => value / Math.max(.00001, Math.hypot(...v))) as Vector3;

/** Intersect a light ray with the actual neighbouring elliptical section.
 * Positive depth faces the room. No screen-space shadow that could drift
 * away from a blade as the traced opening or louvre angle changes. */
function blocksLight(point: SurfacePoint, neighbour: Slat, plane: SlattedPlane, direction: Vector3) {
  const sine = Math.sin(neighbour.angle), cosine = Math.cos(neighbour.angle);
  const dy = (point.y - neighbour.centre) * plane.heightMm, dz = point.depth - SLAT_PIVOT_DEPTH_MM;
  const u = (dy * sine + dz * cosine) * 2 / neighbour.widthMm;
  const v = (dy * cosine - dz * sine) * 2 / neighbour.thicknessMm;
  const du = (direction[1] * sine + direction[2] * cosine) * 2 / neighbour.widthMm;
  const dv = (direction[1] * cosine - direction[2] * sine) * 2 / neighbour.thicknessMm;
  const a = du * du + dv * dv, b = 2 * (u * du + v * dv), c = u * u + v * v - 1;
  const discriminant = b * b - 4 * a * c;
  return a > .000001 && discriminant >= 0 && (-b + Math.sqrt(discriminant)) / (2 * a) > .15;
}

/** A broad room-side light gives a soft highlight and a short penumbra.
 * Ambient illumination stays in shadow so white paint never becomes black.
 * Prepared once per blade, then evaluated at its curved surface vertices. */
export function plantationBladeLighting(plane: SlattedPlane, neighbours: Slat[]) {
  const lights = [-.18, -.09, 0, .09, .18].map(offset =>
    unit([plane.light[0], plane.light[1] + offset, plane.light[2]]));
  return (point: SurfacePoint, view: Vector3) => {
    let direct = 0;
    for (const light of lights) {
      const facing = Math.max(0, dot3(point.normal, light));
      if (facing > 0 && !neighbours.some(slat => blocksLight(point, slat, plane, light))) direct += facing / lights.length;
    }
    const halfway = unit(plane.light.map((value, axis) => value + view[axis]) as Vector3);
    const satin = .035 * Math.pow(Math.max(0, dot3(point.normal, halfway)), 18);
    return { level: .54 - .035 * point.normal[1] + .43 * direct, shine: 255 * satin * Math.min(1, direct * 2) };
  };
}
