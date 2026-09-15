import { isQuoteItems, type QuoteItem } from '@/core/quoteItems';

// Product configuration only: no photos or customer details in shareable URLs.
const MAX_LINK_LENGTH = 24_000;
export function quoteLink(items: QuoteItem[]): string {
  if (!isQuoteItems(items)) throw new Error('Invalid quote configuration');
  return `/book?${new URLSearchParams({ items: JSON.stringify(items) })}`;
}

export function quoteItemsFromLink(value: string | null): QuoteItem[] {
  if (!value || value.length > MAX_LINK_LENGTH) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return isQuoteItems(parsed) ? parsed : [];
  } catch { return []; }
}
