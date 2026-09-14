import type { QuoteItem } from '@/core/quoteItems';
import type { CartItem } from '@/features/cart';

export const cartQuoteItems = (items: CartItem[]): QuoteItem[] => items.map(item => ({
  name: item.name,
  quantity: item.quantity,
  options: item.options ?? [
    { label: 'Fabric', value: item.fabricColour },
    { label: 'Hardware', value: item.hardwareColour },
    { label: 'Size', value: item.windowSize },
    { label: 'Operation', value: item.operation },
  ],
}));
