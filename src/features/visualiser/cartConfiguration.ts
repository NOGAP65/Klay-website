import { ROLLER_HARDWARE } from '@/features/fabrics';

import { visualiserQuoteItems, type VisualiserQuoteConfig } from './quoteConfiguration';
import { priceWindow } from './useVisualiserStore';

import type { CartItem } from '@/features/cart';

const hardwareLabel = (name: string) => ROLLER_HARDWARE.find(hardware => hardware.id === name)?.label ?? name;

/** The basket and direct quote carry the same configuration. Only roller
 * blinds have published prices; other products retain price-on-measure. */
export function visualiserCartItems(state: VisualiserQuoteConfig): Omit<CartItem, 'id' | 'quantity'>[] {
  return visualiserQuoteItems(state).map((item, index) => {
    const window = state.windows[index];
    const isBlind = state.productCategory === 'blind';
    const isCurtain = state.productCategory === 'curtain';
    // Identical windows can share a quantity without a misleading window number.
    const options = item.options.filter(option => option.label !== 'Window');
    const value = (label: string) => options.find(option => option.label === label)?.value ?? 'Chosen at measure';
    return {
      name: item.name,
      type: isBlind ? 'Roller Blind' : isCurtain ? 'Curtains' : 'Made to measure',
      blindType: isBlind ? window.blindType : JSON.stringify([item.name, options]),
      fabricColour: value(isBlind || isCurtain ? 'Fabric' : 'Finish'),
      hardwareColour: isBlind || isCurtain
        ? hardwareLabel(window.hardwareColour)
        : value('Hardware'),
      windowSize: isBlind ? window.windowSize : 'medium',
      operation: isBlind ? window.operation : isCurtain ? window.curtainOperation : 'manual',
      price: isBlind ? priceWindow(window, 'blind') : 0,
      priceOnMeasure: !isBlind,
      options,
    };
  });
}
