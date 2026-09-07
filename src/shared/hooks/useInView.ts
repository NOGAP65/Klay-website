// ---------------------------------------------------------------------------
// HAS THIS SCROLLED INTO VIEW YET — and it only ever answers once.
//
// WHY THIS EXISTS, WHICH IS NOT "SCROLL ANIMATIONS". It exists so an expensive
// component can be kept out of the initial JavaScript bundle. `React.lazy`
// fetches a chunk when the component RENDERS, and the homepage renders its
// visualiser section on load whether or not anyone scrolls to it — so lazy on
// its own would defer nothing. Something has to decline to render it, and that
// is this.
//
// The saving is not marginal: the visualiser pulls in three.js, which is about
// 380KB minified on its own, for a section below three others that nobody has
// scrolled to yet.
//
// LATCHES TRUE AND STOPS LOOKING. Once a chunk is fetched and a WebGL context
// is up, scrolling back past it must not unmount and refetch — so this reports
// "has been seen", never "is on screen", and disconnects the observer on the
// first hit. That also makes it wrong for anything that needs to know when
// something LEAVES the viewport; it is deliberately not that hook.
//
// `rootMargin` defaults to a screenful early, because a 380KB chunk takes long
// enough to fetch and parse that waiting for the section's own top edge shows a
// placeholder for a beat. Starting a screen out means it is usually ready by
// the time it is looked at.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

export interface UseInViewResult<T extends Element> {
  /** Attach to the element being watched. */
  ref: React.RefObject<T>;
  /** True once the element has entered the viewport. Never returns to false. */
  hasBeenInView: boolean;
}

export function useInView<T extends Element = HTMLDivElement>(
  rootMargin = '100% 0px',
): UseInViewResult<T> {
  // useRef<T>(null), not useRef<T | null>(null). React 18 types the first as
  // RefObject<T>, which is what a `ref` prop accepts; the second widens
  // `current` to include null in the type the prop sees, and does not assign.
  const ref = useRef<T>(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    if (hasBeenInView) return;
    const element = ref.current;
    if (!element) return;

    // NO OBSERVER, NO GATE. A browser without IntersectionObserver gets the
    // component immediately rather than never — degrading to "load it" is the
    // only safe direction, because degrading to "do not render" would hide the
    // section outright. Every target browser has it; this is for the one that
    // does not.
    if (typeof IntersectionObserver === 'undefined') {
      setHasBeenInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setHasBeenInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasBeenInView, rootMargin]);

  return { ref, hasBeenInView };
}
