import { CtaButton, TextLink, space } from '@/ds';
import { quoteLink } from '@/features/booking';
import { useCartStore } from '@/features/cart';

import { visualiserCartItems } from './cartConfiguration';
import { visualiserQuoteItems, type VisualiserQuoteConfig } from './quoteConfiguration';

/** Shared by the homepage and full visualiser; cart feedback confirms in place. */
export function VisualiserCartActions({ config, onDark = false }: {
  config: VisualiserQuoteConfig;
  onDark?: boolean;
}) {
  const addItem = useCartStore(state => state.addItem);
  const addToCart = () => {
    for (const item of visualiserCartItems(config)) addItem(item);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.item }}>
      <CtaButton onClick={addToCart} style={{ width: '100%' }}>Add to cart</CtaButton>
      <div style={{ textAlign: 'center' }}>
        <TextLink onDark={onDark} accent to={quoteLink(visualiserQuoteItems(config))}>
          or get a free quote →
        </TextLink>
      </div>
    </div>
  );
}
