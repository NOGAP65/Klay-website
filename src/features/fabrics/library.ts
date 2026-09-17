import samples from './samples.json' with { type: 'json' };

export interface FabricSample {
  id: string;
  name: string;
  colour: string;
  collection: string;
  product: string;
  type?: string;
  hex: string;
  texture: string;
  renderTexture: string;
  weaveTexture: string;
}

export const FABRIC_SAMPLES: FabricSample[] = samples;
export const ROLLER_COLLECTIONS = ['Essence', 'Montecarlo', 'Symphony', 'Urbania', 'Verve'];
export const VENETIAN_COLLECTIONS = ['UltraSlat'];

// Built once in O(n). Palette/name reads during dragging and rendering are
// O(1), with stable arrays instead of a new filtered allocation every frame.
const palettes = new Map<string, FabricSample[]>();
const names = new Map<string, FabricSample>();
const honeycombDays = new Map<string, FabricSample>();
const honeycombBlockout: FabricSample[] = [];
const EMPTY_PALETTE: FabricSample[] = [];
for (const sample of FABRIC_SAMPLES) {
  const key = `${sample.product}:${sample.collection}`;
  const palette = palettes.get(key) ?? [];
  palette.push(sample);
  palettes.set(key, palette);
  if (sample.type !== 'lightfilter' && sample.type !== 'sheer' && !names.has(sample.name)) names.set(sample.name, sample);
  if (sample.product === 'honeycomb-blinds') {
    if (sample.type === 'blockout') honeycombBlockout.push(sample);
    if (sample.type === 'lightfilter') honeycombDays.set(sample.name, sample);
  }
}

/** ATLAS's roller application and Panorama sunscreen confirmed by the owner.
 * The other ranges' blockout/light-filter availability still needs supplier
 * confirmation; keep the existing light-control configuration independent. */
export function fabricCollections(product: string, variant?: string): string[] {
  if (product === 'roller-blinds') return variant === 'sunscreen' ? ['Panorama 5%'] : ROLLER_COLLECTIONS;
  if (product === 'venetian-blinds') return VENETIAN_COLLECTIONS;
  return [];
}

export function fabricPalette(product: string, variant?: string, collection?: string): FabricSample[] {
  if (product === 'honeycomb-blinds') {
    // Day & Night pairs the same named colour in its two labelled fabric types.
    return honeycombBlockout;
  }
  const ranges = fabricCollections(product, variant);
  const selected = ranges.includes(collection ?? '') ? collection : ranges[0];
  return selected ? palettes.get(`${product}:${selected}`) ?? EMPTY_PALETTE : EMPTY_PALETTE;
}

export function fabricByName(name?: string): FabricSample | undefined {
  return name ? names.get(name) : undefined;
}

/** The Cyclone supplier scan includes a paper header. Sample only the cloth,
 * consistently across swatches, the shop weave and the perspective renderer. */
export function fabricScanInset(texture?: string): number {
  return texture && /\/essence-cyclone(?:-texture|-weave)?\.webp$/.test(texture) ? 0.04 : 0;
}

export function rollerPalette(type: string, name?: string): FabricSample[] {
  return fabricPalette('roller-blinds', type, fabricByName(name)?.collection);
}

export function rollerColour(type: string, name?: string): string {
  const palette = rollerPalette(type, name);
  return palette.find(s => s.name === name)?.name
    ?? palette.find(s => ['Ice', 'Polar', 'Optic White', 'Dewy White', 'Dazzle', 'Chalk'].includes(s.colour))?.name
    ?? palette[0]?.name ?? 'Essence Ice';
}

export function honeycombDaySample(name?: string): FabricSample | undefined {
  return name ? honeycombDays.get(name) : undefined;
}

export const HONEYCOMB_TYPES = [
  { id: 'blockout', label: 'Blockout' },
  { id: 'daynight', label: 'Day & Night' },
] as const;
export type HoneycombType = typeof HONEYCOMB_TYPES[number]['id'];
export function honeycombColour(name?: string): string {
  return honeycombBlockout.find(sample => sample.name === name)?.name ?? honeycombBlockout[0].name;
}

export const ROLLER_HARDWARE = ['White', 'Black', 'Cream', 'Platinum'].map(label => {
  const sample = FABRIC_SAMPLES.find(s => s.product === 'roller-hardware' && s.colour === label)!;
  return { id: label.toLowerCase() as 'white' | 'black' | 'cream' | 'platinum', label, hex: sample.hex, texture: sample.texture };
});
