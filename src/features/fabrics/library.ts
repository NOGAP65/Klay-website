import samples from './samples.json';

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
export const VENETIAN_COLLECTIONS = ['UltraSlat', 'Aluminium', 'Basswood'];

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
    return FABRIC_SAMPLES.filter(s => s.product === product && s.type === 'blockout');
  }
  const ranges = fabricCollections(product, variant);
  const selected = ranges.includes(collection ?? '') ? collection : ranges[0];
  return selected ? FABRIC_SAMPLES.filter(s => s.collection === selected) : [];
}

export function fabricByName(name?: string): FabricSample | undefined {
  return FABRIC_SAMPLES.find(s => s.name === name && s.type !== 'lightfilter' && s.type !== 'sheer');
}

export function rollerPalette(type: string, name?: string): FabricSample[] {
  return fabricPalette('roller-blinds', type, fabricByName(name)?.collection);
}

export function rollerColour(type: string, name?: string): string {
  const palette = rollerPalette(type, name);
  return palette.find(s => s.name === name)?.name
    ?? palette.find(s => ['Ice', 'Polar', 'Optic White', 'Dewy White', 'Dazzle', 'Chalk'].includes(s.colour))?.name
    ?? palette[0].name;
}

export function honeycombDaySample(name?: string): FabricSample | undefined {
  return FABRIC_SAMPLES.find(s => s.product === 'honeycomb-blinds' && s.name === name && s.type === 'lightfilter');
}

export const ROLLER_HARDWARE = ['White', 'Black', 'Cream', 'Platinum'].map(label => {
  const sample = FABRIC_SAMPLES.find(s => s.product === 'roller-hardware' && s.colour === label)!;
  return { id: label.toLowerCase() as 'white' | 'black' | 'cream' | 'platinum', label, hex: sample.hex, texture: sample.texture };
});
