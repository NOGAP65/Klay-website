// Stegbar's online mirror dimensions, verified 9 September 2026 (H × W mm).
// Keep the pair as the choice id: rectangular mirrors have two widths at H900.
export interface MirrorShape { id: string; label: string; sizes: [number, number][] }
export const FRAMELESS_MIRROR_SHAPES: MirrorShape[] = [
  { id: 'gothic', label: 'Gothic', sizes: [[800, 700], [900, 700], [1000, 700]] },
  { id: 'round', label: 'Round', sizes: [[600, 600], [800, 800], [1000, 1000]] },
  { id: 'rectangular', label: 'Rectangular', sizes: [[600, 600], [900, 600], [900, 1200]] },
  { id: 'oval', label: 'Oval', sizes: [[800, 700], [900, 700], [1000, 700]] },
  { id: 'radius', label: 'Rectangle with radius corners', sizes: [[800, 700], [900, 700], [1000, 700]] },
  { id: 'd-shaped', label: 'D shaped', sizes: [[750, 900], [900, 1200], [1100, 1500]] },
];
export const FRAMED_MIRROR_SHAPES: MirrorShape[] = [
  { id: 'gothic', label: 'Gothic', sizes: [[800, 500]] },
  { id: 'round', label: 'Round', sizes: [[600, 600], [900, 900]] },
  { id: 'pill', label: 'Pill', sizes: [[1000, 500]] },
];
export const MIRROR_FRAME_COLOURS = [
  { id: 'White', label: 'White', hex: '#F3F0E9' },
  { id: 'Golden', label: 'Golden', hex: '#B39458' },
  { id: 'Black', label: 'Black', hex: '#272829' },
];
export const mirrorShapes = (framed: boolean) => framed ? FRAMED_MIRROR_SHAPES : FRAMELESS_MIRROR_SHAPES;
export function mirrorShape(framed: boolean, shape?: string) {
  const shapes = mirrorShapes(framed);
  return shapes.find(s => s.id === shape) ?? shapes[0];
}
export function mirrorDimensions(framed: boolean, shape?: string) {
  return mirrorShape(framed, shape).sizes.map(([height, width]) => ({
    id: `${height}x${width}`, label: `H${height} × W${width} mm`,
  }));
}

function roundedPath(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}
export function mirrorPlan(framed: boolean, selectedShape?: string, dimension?: string) {
  const shape = mirrorShape(framed, selectedShape);
  const [height, width] = shape.sizes.find(s => s.join('x') === dimension) ?? shape.sizes[0];
  // One camera scale and mounting baseline across every shape and dimension.
  const w = width * 0.58, h = height * 0.58, x = 512 - w / 2, y = 669 - h;
  let path: string;
  switch (shape.id) {
    case 'gothic':
      path = `M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z`;
      break;
    case 'round':
    case 'oval':
      path = `M${x} ${y + h / 2}A${w / 2} ${h / 2} 0 1 1 ${x + w} ${y + h / 2}A${w / 2} ${h / 2} 0 1 1 ${x} ${y + h / 2}Z`;
      break;
    case 'pill': path = roundedPath(x, y, w, h, w / 2); break;
    case 'radius': path = roundedPath(x, y, w, h, 70 * 0.58); break;
    case 'd-shaped':
      // Stegbar's lifestyle reference has a flat right side, curved left side.
      path = `M${x + w} ${y + h * 0.14}V${y + h * 0.86}C${x + w * 0.86} ${y + h * 0.96} ${x + w * 0.75} ${y + h} ${x + w * 0.58} ${y + h}C${x + w * 0.26} ${y + h} ${x} ${y + h * 0.78} ${x} ${y + h / 2}C${x} ${y + h * 0.22} ${x + w * 0.26} ${y} ${x + w * 0.58} ${y}C${x + w * 0.75} ${y} ${x + w * 0.86} ${y + h * 0.04} ${x + w} ${y + h * 0.14}Z`;
      break;
    default: path = `M${x} ${y}h${w}v${h}h${-w}Z`;
  }
  return { shape: shape.id, label: shape.label, width, height, x, y, w, h, path };
}
