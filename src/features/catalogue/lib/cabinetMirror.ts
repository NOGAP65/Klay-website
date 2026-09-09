// Stegbar's cabinet mirrors each have one size (H × W), verified 9 Sep 2026.
export const CABINET_MIRROR_SHAPES = [
  { id: 'gothic', label: 'Gothic', height: 800, width: 500 },
  { id: 'round', label: 'Round', height: 600, width: 600 },
  { id: 'pill', label: 'Pill', height: 1000, width: 500 },
];
export const CABINET_DEPTH_MM = 150;
export const cabinetMirrorShape = (id?: string) =>
  CABINET_MIRROR_SHAPES.find(shape => shape.id === id) ?? CABINET_MIRROR_SHAPES[0];
export function cabinetMirrorSize(id?: string) {
  const shape = cabinetMirrorShape(id);
  return `H${shape.height} × W${shape.width} × D${CABINET_DEPTH_MM} mm`;
}
export const cabinetMirrorSpecifications = (id?: string) => [
  { label: 'Dimensions (H × W × D)', value: cabinetMirrorSize(id) },
  { label: 'Cabinet finish', value: 'White' },
];

// Calibrate the photographed box and every door in the same physical scale.
// The cabinet's sloping top/bottom average 423px apart in the source photo.
const PIXELS_PER_MM = 0.74;
const CABINET_HEIGHT_MM = 530;
const cabinetScaleY = CABINET_HEIGHT_MM * PIXELS_PER_MM / 423;
const centreY = 391;
const cabinetOffsetY = centreY - 381 * cabinetScaleY;
const hingeX = 469;
const backingDepth = 7;

export function cabinetMirrorPlan(id?: string) {
  const shape = cabinetMirrorShape(id);
  const widthPx = shape.width * PIXELS_PER_MM, heightPx = shape.height * PIXELS_PER_MM;
  const projectedWidth = widthPx * 0.55;
  const hinges = [235, 527].map(y => ({ x: hingeX, y: y * cabinetScaleY + cabinetOffsetY }));
  const perspective = (u: number) => 0.94 + 0.12 * u;
  // A circular door extends past its hinges at the middle. Align its curved
  // edge at the actual hinge heights, rather than attaching its widest point.
  let hingeInset = 0;
  if (shape.id === 'round') {
    const hingeDistance = centreY - hinges[0].y;
    let lo = 0.5, hi = 1;
    for (let i = 0; i < 40; i++) {
      const u = (lo + hi) / 2;
      const distance = Math.sqrt(1 - (2 * u - 1) ** 2) * heightPx / 2 * perspective(u);
      if (distance > hingeDistance) lo = u;
      else hi = u;
    }
    hingeInset = (1 - (lo + hi) / 2) * projectedWidth;
  }
  const right = hingeX - backingDepth + hingeInset;
  const left = right - projectedWidth;
  const top = shape.id === 'gothic' ? 622 - heightPx : centreY - heightPx / 2;
  const bottom = top + heightPx;
  const points: [number, number][] = [];
  const add = (u: number, y: number) => points.push([
    left + u * projectedWidth, centreY + (y - centreY) * perspective(u),
  ]);
  const arc = (cy: number, radiusY: number, start: number, end: number) => {
    const steps = Math.ceil(Math.abs(end - start) / Math.PI * 64);
    for (let i = 0; i <= steps; i++) {
      const angle = start + (end - start) * i / steps;
      add(0.5 + Math.cos(angle) / 2, cy + Math.sin(angle) * radiusY);
    }
  };
  if (shape.id === 'round') arc(centreY, heightPx / 2, 0, Math.PI * 2);
  else {
    arc(top + widthPx / 2, widthPx / 2, Math.PI, Math.PI * 2);
    if (shape.id === 'pill') arc(bottom - widthPx / 2, widthPx / 2, 0, Math.PI);
    else { add(1, bottom); add(0, bottom); }
  }
  const path = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ') + 'Z';
  return {
    ...shape, shape: shape.id, depth: CABINET_DEPTH_MM, path, points, left, right, projectedWidth,
    hinges, backingDepth, cabinetHeight: CABINET_HEIGHT_MM * PIXELS_PER_MM, cabinetProjectedWidth: 233,
    cabinetTransform: `matrix(1 0 0 ${cabinetScaleY} 0 ${cabinetOffsetY})`,
  };
}
