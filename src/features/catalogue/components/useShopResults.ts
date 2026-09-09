import { useEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

import { useMediaQuery } from '@/shared';

import type { CatalogueItem } from '../constants';

interface ResultTransition {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition: () => void;
}
type AnimatedDocument = Document & { startViewTransition?: (update: () => void) => ResultTransition };

/** Keep controls immediate; animate only a changed result list, never a product configuration. */
export function useShopResults(items: CatalogueItem[], query: string, isPaused: boolean, anchor: RefObject<HTMLDivElement>) {
  const isReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [displayed, setDisplayed] = useState(items);
  const displayedRef = useRef(items);
  const latest = useRef(items);
  latest.current = items;
  const previousQuery = useRef(query);
  const regionRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<ResultTransition>();
  const key = items.map(item => item.id).join('|');

  useEffect(() => {
    const hasSearchChanged = previousQuery.current !== query;
    previousQuery.current = query;
    if (isPaused || displayedRef.current.map(item => item.id).join('|') === key) return;
    let isCancelled = false;
    let timer = 0;
    let frame = 0;
    let animation: Animation | undefined;
    let transition: ResultTransition | undefined;
    const commit = () => {
      if (isCancelled) return;
      const next = latest.current;
      flushSync(() => { displayedRef.current = next; setDisplayed(next); });
    };
    const enter = () => {
      animation = regionRef.current?.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
        { duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)' });
    };
    const change = () => {
      if (isCancelled) return;
      if (isReduced) { commit(); return; }
      const doc = document as AnimatedDocument;
      if (doc.startViewTransition) {
        document.documentElement.classList.add('shop-view-transition');
        transition = doc.startViewTransition(commit);
        transitionRef.current = transition;
        void transition.ready.catch(() => { /* Superseded transitions still commit the latest selection. */ });
        void transition.finished.catch(() => {}).then(() => {
          if (transitionRef.current !== transition) return;
          transitionRef.current = undefined;
          document.documentElement.classList.remove('shop-view-transition');
        });
      } else {
        // Older browsers get the same short fade without a page-wide animation library.
        animation = regionRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, fill: 'forwards' });
        timer = window.setTimeout(() => { animation?.cancel(); commit(); if (!isCancelled) enter(); }, 90);
      }
    };
    const reveal = () => {
      const top = anchor.current?.getBoundingClientRect().top;
      if (top === undefined || top >= 80) { change(); return; }
      const target = Math.max(0, window.scrollY + top - 80);
      window.scrollTo({ top: target, behavior: isReduced ? 'instant' : 'smooth' });
      if (isReduced) { change(); return; }
      // Retain the old page height until scrolling settles, avoiding viewport clamping.
      const start = performance.now();
      const settle = () => {
        if (isCancelled) return;
        if (Math.abs(window.scrollY - target) < 2 || performance.now() - start > 850) change();
        else frame = requestAnimationFrame(settle);
      };
      frame = requestAnimationFrame(settle);
    };
    // Coalesce keystrokes so the photographic grid does not rebuild for every letter.
    timer = window.setTimeout(reveal, hasSearchChanged && !isReduced ? 150 : 0);
    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      animation?.cancel();
      transition?.skipTransition();
      if (transitionRef.current === transition) {
        transitionRef.current = undefined;
        document.documentElement.classList.remove('shop-view-transition');
      }
    };
  }, [key, query, isPaused, isReduced, anchor]);

  return { displayed, regionRef, isUpdating: key !== displayed.map(item => item.id).join('|') };
}
