// Finish names follow Stegbar Shop Online, checked 10 September 2026.
export type SlidingDoorStyle = 'framed' | 'shaker';
export interface DoorMaterial {
  name: string;
  hex: string;
  texture?: string;
  mirror: 'none' | 'mixed' | 'all';
  grain?: 'oak' | 'walnut';
}
const textures = '/images/shop/finishes';
const solid = (name: string, hex: string, texture?: string, grain?: DoorMaterial['grain']): DoorMaterial =>
  ({ name, hex, texture, grain, mirror: 'none' });
const mirrorMix = (material: DoorMaterial, name: string): DoorMaterial => ({ ...material, name, mirror: 'mixed' });
const surf = solid('Vinyl Surf', '#EFF0F2', `${textures}/vinyl-surf.webp`);
const sienna = solid('Vinyl Sienna', '#F3EEE8', `${textures}/vinyl-sienna.webp`);
const linen = solid('Vinyl Linen', '#F0EDE6', `${textures}/vinyl-linen.webp`);
const naturalOak = solid('MDF Natural Oak', '#C2A67F', `${textures}/natural-oak.webp`, 'oak');
const primeOak = solid('MDF Prime Oak', '#A98D71', `${textures}/prime-oak.webp`, 'oak');

export const FRAMED_DOOR_MATERIALS: DoorMaterial[] = [
  naturalOak, primeOak,
  mirrorMix(naturalOak, 'Mirror/MDF Silver/Natural Oak'),
  mirrorMix(primeOak, 'Mirror/MDF Silver/Prime Oak'),
  { name: 'Mirror Silver', hex: '#D8D8D8', mirror: 'all' },
  sienna, linen, surf,
  mirrorMix(sienna, 'Mirror/Vinyl Silver/Sienna'),
  mirrorMix(linen, 'Mirror/Vinyl Silver/Linen'),
  mirrorMix(surf, 'Mirror/Vinyl Silver/Surf'),
];
const shakerTimbers = [
  solid('Coastal Oak', '#C7B299', `${textures}/coastal-oak.webp`, 'oak'),
  solid('Notaio Walnut', '#8F7964', `${textures}/notaio-walnut.webp`, 'walnut'),
  solid('Antico Oak', '#8B7B6B', `${textures}/antico-oak.webp`, 'oak'),
  solid('Polar White', '#F6F6F6', `${textures}/polar-white.webp`),
];
export const SHAKER_DOOR_MATERIALS: DoorMaterial[] = [
  ...shakerTimbers, ...shakerTimbers.map(material => mirrorMix(material, `Mirror/${material.name}`)),
];
export const SLIDING_METAL_COLOURS = [
  { name: 'Matt Black', hex: '#242426' },
  { name: 'Polished Silver', hex: '#D8D8D8' },
  { name: 'Pearl White', hex: '#FDFDFD' },
];
export const slidingMetals = (style: SlidingDoorStyle) => style === 'framed'
  ? [SLIDING_METAL_COLOURS[0], SLIDING_METAL_COLOURS[2], SLIDING_METAL_COLOURS[1]]
  : SLIDING_METAL_COLOURS;
export const slidingMaterials = (style: SlidingDoorStyle) =>
  style === 'framed' ? FRAMED_DOOR_MATERIALS : SHAKER_DOOR_MATERIALS;
export const slidingMaterial = (style: SlidingDoorStyle, name?: string) =>
  slidingMaterials(style).find(material => material.name === name) ?? slidingMaterials(style)[0];

export interface SlidingOpening {
  id: string;
  label: string;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
}
export function slidingOpenings(style: SlidingDoorStyle, panels?: string): SlidingOpening[] {
  const hasThree = panels === 'three';
  if (style === 'framed') return (hasThree ? [2700, 3000, 3300, 3600] : [1200, 1500, 1800, 2100, 2400]).map(width => ({
    id: `2160x${width}`, label: `H2160 × W${width} mm`,
    minHeight: 2160, maxHeight: 2160, minWidth: width, maxWidth: width,
  }));
  const heights = [[440, 2440]];
  const widths = hasThree ? [[2371, 2740], [2741, 3490]] : [[900, 1470], [1471, 1870], [1871, 2370]];
  return heights.flatMap(([minHeight, maxHeight]) => widths.map(([minWidth, maxWidth]) => ({
    id: `${minHeight}-${maxHeight}x${minWidth}-${maxWidth}`,
    label: `H${minHeight}–${maxHeight} × W${minWidth}–${maxWidth} mm`,
    minHeight, maxHeight, minWidth, maxWidth,
  })));
}

export function slidingPanelMirrors(style: SlidingDoorStyle, panels?: string, materialName?: string): boolean[] {
  const count = panels === 'three' ? 3 : 2;
  const material = slidingMaterial(style, materialName);
  return Array.from({ length: count }, (_, index) =>
    material.mirror === 'all' || (material.mirror === 'mixed' && index === (count === 3 || style === 'shaker' ? 1 : 0)));
}
export function defaultSlidingOpening(style: SlidingDoorStyle, panels?: string): string {
  const options = slidingOpenings(style, panels);
  return options.find(option => option.minWidth <= 2100 && option.maxWidth >= 2100)?.id ?? options[0].id;
}
export function slidingOpening(style: SlidingDoorStyle, panels?: string, dimension?: string): SlidingOpening {
  const options = slidingOpenings(style, panels);
  return options.find(option => option.id === dimension)
    ?? options.find(option => option.id === defaultSlidingOpening(style, panels))!;
}

export interface SlidingDoorConfig {
  style: SlidingDoorStyle;
  panels: 'two' | 'three';
  material: string;
  hardware: string;
  opening: string;
}
export const DEFAULT_SLIDING_DOOR: SlidingDoorConfig = {
  style: 'framed', panels: 'two', material: 'MDF Natural Oak', hardware: 'Matt Black', opening: '2160x2100',
};
export function reconcileSlidingDoor(current: SlidingDoorConfig, patch: Partial<SlidingDoorConfig>): SlidingDoorConfig {
  const style = patch.style === 'framed' || patch.style === 'shaker' ? patch.style : current.style;
  const panels = patch.panels === 'two' || patch.panels === 'three' ? patch.panels : current.panels;
  const next = { style, panels,
    material: slidingMaterial(style, patch.material ?? current.material).name,
    hardware: slidingMetals(style).find(colour => colour.name === (patch.hardware ?? current.hardware))?.name ?? slidingMetals(style)[0].name,
    opening: slidingOpening(style, panels, patch.opening ?? current.opening).id,
  };
  // Re-selecting the active swatch must not rebuild a ready scene.
  return (Object.keys(next) as (keyof SlidingDoorConfig)[]).every(key => next[key] === current[key]) ? current : next;
}
export const slidingDoorName = (style: SlidingDoorStyle) => `${style === 'framed' ? 'Framed' : 'Shaker'} Sliding Wardrobe Doors`;
export function slidingPreviewDimensions(config: SlidingDoorConfig) {
  const opening = slidingOpening(config.style, config.panels, config.opening);
  // Display height stays at 2 m, matching the shop. Order limits stay in the
  // opening label and cart; a width-range selection is shown at its midpoint.
  return { widthMm: (opening.minWidth + opening.maxWidth) / 2, heightMm: 2000, count: config.panels === 'three' ? 3 : 2 };
}
