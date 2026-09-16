import { hasControlCharacters } from './plainText';

/** Basket details are descriptive quote requests, never a client-supplied price. */
export interface QuoteItem {
  name: string;
  quantity: number;
  options: { label: string; value: string }[];
}

export const MAX_QUOTE_ITEMS = 40;
export const MAX_QUOTE_TEXT = 32000;
const text = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max
    && !hasControlCharacters(value);

export function isQuoteItems(value: unknown): value is QuoteItem[] {
  const isValid = Array.isArray(value) && value.length > 0 && value.length <= MAX_QUOTE_ITEMS
    && value.every(item => item && text(item.name, 160)
      && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 40
      && Array.isArray(item.options) && item.options.length <= 20
      && item.options.every((option: QuoteItem['options'][number]) => option
        && text(option.label, 80) && text(option.value, 240)));
  if (!isValid) return false;
  return (value as QuoteItem[]).reduce((total, item) => total + item.name.length
    + item.options.reduce((sum, option) => sum + option.label.length + option.value.length, 0), 0) <= MAX_QUOTE_TEXT;
}

export function quoteItemsSummary(items: QuoteItem[]): string {
  return items.map((item, i) => `${i + 1}. ${item.name} × ${item.quantity}\n${item.options
    .map(option => `   ${option.label}: ${option.value}`).join('\n')}`).join('\n\n');
}
