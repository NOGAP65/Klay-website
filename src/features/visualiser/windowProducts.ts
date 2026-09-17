import { CURTAIN_COLOURS, SLAT_COLOURS, fabricPalette, fabricByName, rollerPalette, rollerColour, honeycombColour } from '@/features/fabrics';

export type ProductCategory = 'blind' | 'honeycomb' | 'venetian' | 'plantation' | 'curtain' | 'wardrobe' | 'shelving';
export const WINDOW_STYLES = [
  { id: 'blind', label: 'Roller' }, { id: 'honeycomb', label: 'Honeycomb' },
  { id: 'venetian', label: 'Venetian' }, { id: 'plantation', label: 'Plantation shutters' },
] as const;
export const isSlatted = (category: string) => category === 'venetian' || category === 'plantation';
export const isUnpricedBlind = (category: string) => category === 'honeycomb' || isSlatted(category);
export const blindGroup = (category: ProductCategory): ProductCategory => isUnpricedBlind(category) ? 'blind' : category;

export function coloursFor(category: ProductCategory, type = 'blockout', name?: string): { name: string; hex: string; texture?: string }[] {
  if (category === 'curtain') return CURTAIN_COLOURS;
  if (category === 'plantation') return SLAT_COLOURS;
  if (category === 'honeycomb') return fabricPalette('honeycomb-blinds');
  if (category === 'venetian') return fabricPalette('venetian-blinds', undefined, fabricByName(name)?.collection);
  return rollerPalette(type, name);
}
export function windowColour(category: ProductCategory, type: string, name?: string): string {
  if (category === 'blind') return rollerColour(type, name);
  if (category === 'honeycomb') return honeycombColour(name);
  const palette = coloursFor(category, type, name);
  return palette.find(colour => colour.name === name)?.name ?? palette[0].name;
}
export function slatTexture(category: ProductCategory, name: string): string | undefined {
  if (category === 'venetian') return fabricByName(name)?.weaveTexture;
  if (category === 'plantation' && ['Light Oak', 'Walnut'].includes(name)) return fabricByName('Basswood Walnut')?.weaveTexture;
  return undefined;
}
