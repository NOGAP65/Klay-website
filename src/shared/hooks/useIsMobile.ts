// ---------------------------------------------------------------------------
// useIsMobile — the site-wide mobile breakpoint.
//
// Split out of useMediaQuery in Phase 3.3. Body unchanged.
//
// NOTE the nav does NOT use this. It has a different threshold (860px vs 768)
// for its own reasons — see NAV_COLLAPSE in Nav.tsx — which is why
// useMediaQuery is exported separately rather than being an implementation
// detail of this hook.
// ---------------------------------------------------------------------------

import { useMediaQuery } from './useMediaQuery';

const QUERY = '(max-width: 768px)';

export function useIsMobile(): boolean {
  return useMediaQuery(QUERY);
}
