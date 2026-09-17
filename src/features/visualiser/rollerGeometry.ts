import type { Point } from './homography';

const RAIL_RATIO = .018;
const VIEW_PITCH = .35;
const lerp = (a: Point, b: Point, t: number): Point =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Photo-space projection of a front-feed roller. The traced top locates the
 * axle, not the cloth. Cloth leaves the room-facing circumference; the weight
 * stops below the barrel even when raised. Both renderers use these same joins.
 * Depth cannot be recovered uniquely from four pins, so use a modest view from
 * below the head and infer lateral foreshortening from the two jambs. */
export function rollerGeometry(corners: Point[], position: number) {
  const [tl, tr, br, bl] = corners;
  const p = Math.max(0, Math.min(1, position));
  const leftH = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
  const rightH = Math.hypot(br[0] - tr[0], br[1] - tr[1]);
  const width = Math.max(1, Math.hypot(tr[0] - tl[0], tr[1] - tl[1]));
  const along: Point = [(tr[0] - tl[0]) / width, (tr[1] - tl[1]) / width];
  const yaw = Math.max(-1, Math.min(1, 3 * (leftH - rightH) / Math.max(1, leftH + rightH)));
  // Wound cross-sectional area follows remaining cloth, rather than linearly
  // changing the diameter (45 mm bare tube, 65 mm with the drop wound on).
  const radius = Math.sqrt(45 ** 2 + (65 ** 2 - 45 ** 2) * (1 - p)) / 3600;
  const crownAngle = -Math.atan2(1, VIEW_PITCH);
  const circle = (side: 0 | 1, angle: number): Point => {
    const origin = side === 0 ? tl : tr, bottom = side === 0 ? bl : br;
    const height = side === 0 ? leftH : rightH;
    const down = Math.sin(angle) - VIEW_PITCH * Math.cos(angle);
    const front = .9 * yaw * Math.cos(angle) * radius * height;
    return [origin[0] + (bottom[0] - origin[0]) * radius * down + along[0] * front,
      origin[1] + (bottom[1] - origin[1]) * radius * down + along[1] * front];
  };
  const tangentL = circle(0, 0), tangentR = circle(1, 0);
  const crownL = circle(0, crownAngle), crownR = circle(1, crownAngle);
  // Keep a full-size weight outside the roll. It must never grow out of the
  // axle or shrink to zero over the first few millimetres of movement.
  const restingDrop = radius * (1 + VIEW_PITCH) + RAIL_RATIO + .001;
  const drop = restingDrop + (1 - restingDrop) * p;
  const hemL = lerp(tangentL, bl, drop), hemR = lerp(tangentR, br, drop);
  const railL = lerp(tangentL, bl, drop - RAIL_RATIO);
  const railR = lerp(tangentR, br, drop - RAIL_RATIO);
  const cloth: Point[] = [tangentL, tangentR, hemR, hemL];
  const crown: Point[] = [crownL, crownR, tangentR, tangentL];
  const coverage: Point[] = [crownL, crownR, tangentR, hemR, hemL, tangentL];
  return { p, radius, yaw, leftH, rightH, drop, crownAngle, circle,
    tangentL, tangentR, crownL, crownR, hemL, hemR, railL, railR, cloth, crown, coverage };
}

export type RollerGeometry = ReturnType<typeof rollerGeometry>;
