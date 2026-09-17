import { rollerGeometry } from './rollerGeometry';

import type { Point } from './homography';

/** Standard slotted fixing plate and rounded clutch support, based on the
 * supplied bracket-std references. Four trace pins provide perspective, not
 * recess depth: keep the fittings small and behind the roll rather than
 * guessing a mounting type or inventing a frame around the photograph. */
export function rollerBrackets(corners: Point[], twin = false) {
  // The bracket clears a fully wound roll. Its size never follows the moving
  // cloth radius, and its axle remains on the customer's traced top corners.
  const g = rollerGeometry(corners, 0);
  const [tl, tr] = corners;
  const width = Math.max(1, Math.hypot(tr[0] - tl[0], tr[1] - tl[1]));
  const along: Point = [(tr[0] - tl[0]) / width, (tr[1] - tl[1]) / width];
  return ([0, 1] as const).map(side => {
    const origin = corners[side];
    const front = g.circle(side, 0), down = g.circle(side, Math.PI / 2);
    const thickness = (side === 0 ? -1 : 1) * (side === 0 ? g.leftH : g.rightH) * 6 / 1800;
    const top = twin ? -1.85 : -1.45;
    const point = (depth: number, drop: number, outer = true): Point => [
      origin[0] + (front[0] - origin[0]) * depth + (down[0] - origin[0]) * drop + (outer ? along[0] * thickness : 0),
      origin[1] + (front[1] - origin[1]) * depth + (down[1] - origin[1]) * drop + (outer ? along[1] * thickness : 0),
    ];
    const profile: Point[] = [[-.9, top], [.9, top], [.9, 0]];
    for (let i = 1; i <= 12; i++) {
      const angle = i / 12 * Math.PI;
      profile.push([.9 * Math.cos(angle), .9 * Math.sin(angle)]);
    }
    const face = profile.map(([z, y]) => point(z, y));
    const rim = profile.map(([z, y], i) => {
      const [nextZ, nextY] = profile[(i + 1) % profile.length];
      return [point(z, y, false), point(nextZ, nextY, false), point(nextZ, nextY), point(z, y)];
    });
    return {
      face, rim,
      // Return flange and punched slot in the same projected plane as the
      // support. At a straight-on angle these naturally read as narrow edges.
      flange: [point(-1.05, top, false), point(1.05, top, false), point(1.05, top), point(-1.05, top)],
      slot: [point(-.45, top, false), point(.3, top, false), point(.3, top), point(-.45, top)]
        .map(p => [(p[0] + point(0, top)[0]) / 2, (p[1] + point(0, top)[1]) / 2] as Point),
      highlight: [point(.9, top), point(.9, 0)],
      lightWidth: Math.max(.35, Math.abs(thickness) * .13),
    };
  });
}

export function drawRollerBrackets(ctx: CanvasRenderingContext2D, corners: Point[], colour: string, twin = false) {
  const fill = (points: Point[], paint: string) => {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
    ctx.fillStyle = paint;
    ctx.fill();
  };
  ctx.save();
  for (const bracket of rollerBrackets(corners, twin)) {
    // A matte finish with quiet edge shading. The shared room-lighting pass
    // supplies colour; no separate image/filter can invert it in forced dark.
    for (const rim of bracket.rim) fill(rim, colour);
    fill(bracket.face, colour);
    fill(bracket.face, 'rgba(20,16,10,.13)');
    fill(bracket.flange, colour);
    fill(bracket.slot, 'rgba(20,16,10,.24)');
    ctx.beginPath();
    ctx.moveTo(...bracket.highlight[0]);
    ctx.lineTo(...bracket.highlight[1]);
    ctx.strokeStyle = 'rgba(255,250,242,.12)';
    ctx.lineWidth = bracket.lightWidth;
    ctx.stroke();
  }
  ctx.restore();
}
