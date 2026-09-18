import { CURTAIN_COLOURS, SLAT_COLOURS, MESH_COLOURS, SHUTTER_COLOURS, fabricPalette, fabricByName, rollerPalette, rollerColour, honeycombColour } from '@/features/fabrics';

export type ProductCategory = 'blind' | 'honeycomb' | 'venetian' | 'plantation' | 'curtain' | 'wardrobe' | 'shelving' | 'roller-shutter' | 'zip-screen';
export const WINDOW_STYLES = [
  { id: 'blind', label: 'Roller' }, { id: 'honeycomb', label: 'Honeycomb' },
  { id: 'venetian', label: 'Venetian' }, { id: 'plantation', label: 'Plantation shutters' },
] as const;
export const isSlatted = (category: string) => category === 'venetian' || category === 'plantation';
export const isOutdoor = (category: string): category is 'roller-shutter' | 'zip-screen' => category === 'roller-shutter' || category === 'zip-screen';
export const isUnpricedBlind = (category: string) => category === 'honeycomb' || isSlatted(category) || isOutdoor(category);
export const blindGroup = (category: ProductCategory): ProductCategory => !isOutdoor(category) && isUnpricedBlind(category) ? 'blind' : category;

export function coloursFor(category: ProductCategory, type = 'blockout', name?: string): { name: string; hex: string; texture?: string }[] {
  if (category === 'roller-shutter') return SHUTTER_COLOURS;
  if (category === 'zip-screen') return MESH_COLOURS;
  if (category === 'curtain') return CURTAIN_COLOURS;
  if (category === 'plantation') return SLAT_COLOURS;
  if (category === 'honeycomb') return fabricPalette('honeycomb-blinds');
  if (category === 'venetian') return fabricPalette('venetian-blinds');
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
  if (category === 'plantation' && ['Light Oak', 'Walnut'].includes(name)) return '/images/visualiser/textures/plantation-wood-grain.webp';
  return undefined;
}

export function previewTexture(category: ProductCategory, name: string): string | undefined {
  if (isOutdoor(category)) return undefined;
  if (isSlatted(category)) return slatTexture(category, name);
  return category === 'honeycomb' ? fabricByName(name)?.weaveTexture : fabricByName(name)?.renderTexture;
}
