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

const QUERY = '(max-width: 768px)';

export function useIsMobile(): boolean {
  return useMediaQuery(QUERY);
}
