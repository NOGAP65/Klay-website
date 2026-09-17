import { ROLLER_HARDWARE } from '@/features/fabrics';

import { visualiserQuoteItems, type VisualiserQuoteConfig } from './quoteConfiguration';
import { priceWindow } from './useVisualiserStore';
import { isUnpricedBlind } from './windowProducts';

import type { CartItem } from '@/features/cart';

const hardwareLabel = (name: string) => ROLLER_HARDWARE.find(hardware => hardware.id === name)?.label ?? name;
const cartTypes = { blind: 'Roller Blind', honeycomb: 'Honeycomb Blinds', curtain: 'Curtains',
  venetian: 'Venetian Blinds', plantation: 'Plantation Shutters',
  wardrobe: 'Made to measure', shelving: 'Made to measure' };

/** The basket and direct quote carry the same configuration. Only roller
 * blinds have published prices; other products retain price-on-measure. */
export function visualiserCartItems(state: VisualiserQuoteConfig): Omit<CartItem, 'id' | 'quantity'>[] {
  return visualiserQuoteItems(state).map((item, index) => {
    const window = state.windows[index];
    const isBlind = state.productCategory === 'blind';
    const isUnpriced = isUnpricedBlind(state.productCategory);
    const isCurtain = state.productCategory === 'curtain';
    const hasFabric = isBlind || isUnpriced || isCurtain;
    const isLiftBlind = isBlind || isUnpriced;
    // Identical windows can share a quantity without a misleading window number.
    const options = item.options.filter(option => option.label !== 'Window');
    const value = (label: string) => options.find(option => option.label === label)?.value ?? 'Chosen at measure';
    return {
      name: item.name,
      type: cartTypes[state.productCategory],
      blindType: isBlind ? window.blindType : JSON.stringify([item.name, options]),
      fabricColour: value(hasFabric ? 'Fabric' : 'Finish'),
      hardwareColour: hasFabric
        ? hardwareLabel(window.hardwareColour)
        : value('Hardware'),
      windowSize: isLiftBlind ? window.windowSize : 'medium',
      operation: isLiftBlind ? window.operation : isCurtain ? window.curtainOperation : 'manual',
      price: isBlind ? priceWindow(window, 'blind') : 0,
      priceOnMeasure: !isBlind,
      options,
    };
  });
}
