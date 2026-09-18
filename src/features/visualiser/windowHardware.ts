import { ROLLER_HARDWARE, HARDWARE_HEX } from '@/features/fabrics';

import { isUnpricedBlind } from './windowProducts';

import type { HardwareColour, ProductCategory } from './useVisualiserStore';

export function windowHardwareHex(category: ProductCategory, name: HardwareColour, fabricHex: string) {
  if (category === 'roller-shutter') return fabricHex;
  if (category === 'zip-screen') return '#333638';
  if (isUnpricedBlind(category)) return HARDWARE_HEX.white;
  return (category === 'blind' ? ROLLER_HARDWARE.find(hardware => hardware.id === name)?.hex : undefined)
    ?? HARDWARE_HEX[name === 'cream' || name === 'platinum' ? 'white' : name];
}
