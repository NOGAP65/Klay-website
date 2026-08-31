// ---------------------------------------------------------------------------
// useMediaQuery — subscribe to any media query.
//
// Moved from src/hooks/useIsMobile.ts in Phase 3.2 and split from useIsMobile
// in 3.3: the file was named for the smaller of the two hooks it contained,
// while this one — the general case, with thirteen consumers — had no file of
// its own. §5 wants the filename to be the hook.
//
// Body unchanged.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';

/** Subscribe to any media query. Re-renders on change, and reads correctly on
 * the first paint rather than flashing the desktop layout on a phone.
 *
 * Split out of useIsMobile because the nav needs a DIFFERENT breakpoint from
 * everything else on the site — see NAV_COLLAPSE. One hook, two thresholds,
 * rather than a second copy of this listener. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
