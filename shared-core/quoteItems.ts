/** Basket details are descriptive quote requests, never a client-supplied price. */
export interface QuoteItem {
  name: string;
  quantity: number;
  options: { label: string; value: string }[];
}

export const MAX_QUOTE_ITEMS = 40;
const text = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;

export function isQuoteItems(value: unknown): value is QuoteItem[] {
  return Array.isArray(value) && value.length > 0 && value.length <= MAX_QUOTE_ITEMS
    && value.every(item => item && text(item.name, 160)
      && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 40
      && Array.isArray(item.options) && item.options.length <= 20
      && item.options.every((option: QuoteItem['options'][number]) => option
        && text(option.label, 80) && text(option.value, 240)));
}

export function quoteItemsSummary(items: QuoteItem[]): string {
  return items.map((item, i) => `${i + 1}. ${item.name} × ${item.quantity}\n${item.options
    .map(option => `   ${option.label}: ${option.value}`).join('\n')}`).join('\n\n');
}
