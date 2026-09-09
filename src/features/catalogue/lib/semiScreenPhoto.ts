/** Stegbar Front and Return Screen stock sizes, checked 9 September 2026.
 * Height × front width × return depth; do not mix depths between sizes. */
export const FRONT_RETURN_HEIGHT_MM = 1950;
export const FRONT_RETURN_SIZES = [
  { width: 800, depth: 850 }, { width: 850, depth: 890 },
  { width: 900, depth: 910 }, { width: 1050, depth: 1010 },
  { width: 1200, depth: 1010 }, { width: 1350, depth: 1010 },
];
export const frontReturnSizeLabel = (width: number) => {
  const size = FRONT_RETURN_SIZES.find(s => s.width === width) ?? FRONT_RETURN_SIZES[3];
  return `H${FRONT_RETURN_HEIGHT_MM} × W${size.width} × D${size.depth} mm`;
};

export interface SemiScreenPhoto {
  background: string;
  reflections: string;
  layout: 'front-only' | 'front-return';
  right: number;
  metal: string;
  rails: string;
  doorEdge: string;
}
export interface ScreenSlice { start: number; end: number; scaleX: number; scaleY: number; x: number; y: number }

/** Keep the door, pivots, knob and jamb thickness unchanged. Only the infill
 * spans resize; the return follows its paired depth. All changes are immediate. */
export function semiScreenPlan(photo: SemiScreenPhoto, widthMm: number) {
  const size = FRONT_RETURN_SIZES.find(s => s.width === widthMm) ?? FRONT_RETURN_SIZES[3];
  const right = 145 + (photo.right - 145) * size.width / 1350;
  const offset = right - photo.right;
  const infillScale = (right - 18 - 410) / (photo.right - 18 - 410);
  const front: ScreenSlice[] = [
    { start: 140, end: 410, scaleX: 1, scaleY: 1, x: 0, y: 0 },
    { start: 410, end: photo.right - 18, scaleX: infillScale, scaleY: 1, x: 410 * (1 - infillScale), y: 0 },
    { start: photo.right - 18, end: photo.right + 1, scaleX: 1, scaleY: 1, x: offset, y: 0 },
  ];
  const depthScale = size.depth / 1010;
  // Narrow strips project the return without bending its rails or shrinking
  // the corner post. The background is drawn separately and never transformed.
  const returns: ScreenSlice[] = photo.layout === 'front-return' ? Array.from({ length: 36 }, (_, i) => {
    const start = 722 + 140 * i / 36;
    const t = (i + 0.5) / 36;
    const top = 77 + 72 * t;
    const height = 843 - 165 * t;
    const scaleY = (843 - 165 * t * depthScale) / height;
    return { start, end: 722 + 140 * (i + 1) / 36, scaleX: depthScale, scaleY,
      x: right - 722 * depthScale, y: 77 + 72 * t * depthScale - top * scaleY };
  }) : [];
  const doorX = photo.layout === 'front-only' ? 406 : 404;
  const doorPosition = (doorX - 145) / (right - 145);
  const doorTop = 123 - 34 * doorPosition;
  const doorBottom = 856 + ((photo.layout === 'front-only' ? 923 : 920) - 870) * doorPosition;
  const doorScaleY = (doorBottom - doorTop) / 770;
  return { width: size.width, depth: photo.layout === 'front-return' ? size.depth : undefined,
    height: FRONT_RETURN_HEIGHT_MM, right, offset, front, returns,
    railScale: size.width / 1350, doorScaleY, doorY: doorTop - 109 * doorScaleY };
}
