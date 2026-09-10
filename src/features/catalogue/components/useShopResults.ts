import { useEffect, useRef, useState, useTransition, type RefObject } from 'react';

import type { CatalogueItem } from '../constants';

/** Paint a static placeholder before preparing the next list; controls remain responsive. */
export function useShopResults(items: CatalogueItem[], query: string, isPaused: boolean, anchor: RefObject<HTMLDivElement>) {
  const [displayed, setDisplayed] = useState(items);
  const [isPending, startTransition] = useTransition();
  const regionRef = useRef<HTMLDivElement>(null);
  const key = items.map(item => item.id).join('|');
  const displayedKey = displayed.map(item => item.id).join('|');
  const isUpdating = !isPaused && (key !== displayedKey || isPending);

  useEffect(() => {
    if (isPaused || key === displayedKey) return;
    // Give the placeholder a paint and coalesce typing. Cleanup discards superseded searches.
    const timer = window.setTimeout(() => {
      const top = anchor.current?.getBoundingClientRect().top;
      if (top !== undefined && top < 80) {
        window.scrollTo({ top: Math.max(0, window.scrollY + top - 80), behavior: 'instant' });
      }
      startTransition(() => setDisplayed(items));
    }, 160);
    return () => window.clearTimeout(timer);
  }, [items, key, displayedKey, query, isPaused, anchor]);

  return { displayed, regionRef, isUpdating };
}
