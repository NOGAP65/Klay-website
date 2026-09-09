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
export function cabinetMirrorPlan(id?: string) {
  const shape = cabinetMirrorShape(id);
  const scale = 0.73, projection = 0.47, centreY = 377;
  const widthPx = shape.width * scale, heightPx = shape.height * scale;
  const projectedWidth = widthPx * projection;
  // The hinge axis and photographed cabinet stay put while the door changes.
  const right = 450 + (shape.width - 470) / 2 * scale * projection;
  const left = right - projectedWidth;
  const top = shape.id === 'gothic' ? 620 - heightPx : centreY - heightPx / 2;
  const bottom = top + heightPx;
  const points: [number, number][] = [];
  const add = (u: number, y: number) => points.push([
    left + u * projectedWidth, centreY + (y - centreY) * (0.88 + 0.12 * u),
  ]);
  const arc = (cy: number, radiusY: number, start: number, end: number) => {
    for (let i = 0; i <= 48; i++) {
      const angle = start + (end - start) * i / 48;
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
  return { ...shape, shape: shape.id, depth: CABINET_DEPTH_MM, path, points, left, right, projectedWidth };
}
