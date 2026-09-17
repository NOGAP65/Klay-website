import { pricePerBlind } from '@/core/pricing';

import { isUnpricedBlind } from './windowProducts';

import type { CurtainSize, WindowConfig, ProductCategory } from './useVisualiserStore';

const CURTAIN_BASE_PRICES: Record<CurtainSize, number> = {
  small: 320,
  medium: 420,
  large: 560,
  xl: 720,
};
const CURTAIN_MOTOR_ADDON = 200;

/** Shared by the controls and per-window job totals. Honeycomb retains the
 * shop's price-on-measure policy rather than inheriting a roller-blind price. */
export function priceWindow(window: WindowConfig, category: ProductCategory): number {
  if (isUnpricedBlind(category)) return 0;
  if (category === 'curtain') {
    return CURTAIN_BASE_PRICES[window.curtainSize]
      + (window.curtainOperation === 'motorised' ? CURTAIN_MOTOR_ADDON : 0);
  }
  return pricePerBlind(window);
}
