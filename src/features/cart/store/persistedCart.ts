import { MAX_QUANTITY } from '@/core/pricing';
import { isQuoteItems } from '@/core/quoteItems';

import type { CartItem } from './cartStore';

/** Browser storage is untrusted input: accept data, never persisted actions.
 * A malformed line must not crash the navigation, basket or checkout. */
export function persistedCartItems(value: unknown): CartItem[] {
  if (!value || typeof value !== 'object' || !('items' in value) || !Array.isArray(value.items)) return [];
  return value.items.filter((item: unknown): item is CartItem => {
    if (!item || typeof item !== 'object') return false;
    const row = item as Record<string, unknown>;
    if (!['id', 'name', 'type', 'blindType', 'fabricColour', 'hardwareColour'].every(key =>
      typeof row[key] === 'string' && row[key].length > 0 && row[key].length <= 2000)) return false;
    if (!['small', 'medium', 'large'].includes(String(row.windowSize)) || !['manual', 'motorised'].includes(String(row.operation))) return false;
    if (typeof row.price !== 'number' || !Number.isFinite(row.price) || row.price < 0) return false;
    if (typeof row.quantity !== 'number' || !Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > MAX_QUANTITY) return false;
    if (row.priceOnMeasure !== undefined && typeof row.priceOnMeasure !== 'boolean') return false;
    return row.options === undefined || isQuoteItems([{ name: row.name, quantity: row.quantity, options: row.options }]);
  });
}
