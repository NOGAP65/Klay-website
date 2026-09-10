import { memo, useCallback, useMemo } from 'react';

import { defaultSelection, type Selection } from '../configOptions';
import type { CatalogueItem } from '../constants';

import { ShopCard } from './ShopCard';

/** Stable props prevent search, filter counts and sibling choices from repainting every photo. */
export const ShopProductCard = memo(function ShopProductCard({ item, selection, onChoice }: {
  item: CatalogueItem; selection?: Selection;
  onChoice: (item: CatalogueItem, field: string, choice: string) => void;
}) {
  const initial = useMemo(() => defaultSelection(item), [item]);
  const change = useCallback((field: string, choice: string) => onChoice(item, field, choice), [item, onChoice]);
  return <div className="shop-result-card">
    <ShopCard item={item} sel={selection ?? initial} onChange={change} />
  </div>;
});
