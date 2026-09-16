import { useEffect, useRef, useState, useTransition, type RefObject } from 'react';

import type { CatalogueItem } from '../constants';

/** Keep the current products visible while React prepares the next result list. */
export function useShopResults(items: CatalogueItem[], isPaused: boolean, anchor: RefObject<HTMLDivElement>) {
  const [displayed, setDisplayed] = useState(items);
  const [isPending, startTransition] = useTransition();
  const regionRef = useRef<HTMLDivElement>(null);
  const key = items.map(item => item.id).join('|');
  const displayedKey = displayed.map(item => item.id).join('|');
  const isUpdating = !isPaused && (key !== displayedKey || isPending);

  useEffect(() => {
    if (isPaused || key === displayedKey) return;
    const top = anchor.current?.getBoundingClientRect().top;
    if (top !== undefined && top < 80) {
      window.scrollTo({ top: Math.max(0, window.scrollY + top - 80), behavior: 'instant' });
    }
    startTransition(() => setDisplayed(items));
  }, [items, key, displayedKey, isPaused, anchor]);

  return { displayed, regionRef, isUpdating };
}
