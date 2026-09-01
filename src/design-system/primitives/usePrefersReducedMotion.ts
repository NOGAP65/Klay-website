// ---------------------------------------------------------------------------
// usePrefersReducedMotion — the one-time read of the user's motion preference.
//
// Extracted at Phase 7 from four identical copies — Hero, StepsBar,
// Testimonials and TrustTicker each wrote `const [reduceMotion] =
// useState(prefersReducedMotion)`. D-10. All four were correct and identical,
// which is precisely the state §13 describes: "Both correct when written, one
// updated six months later."
//
// IT LIVES HERE, NOT IN shared/, AND THE REASON IS THE LAYER MODEL. §2 lets
// `shared` import config and other shared — not the design system. The query
// string it needs is `prefersReducedMotion` in tokens/motion.ts, so a shared
// version would have to inline the string a second time, and a hook extracted
// to remove a duplication would have created one. The design system may import
// itself, so it belongs beside useHover.
//
// IT IS A SNAPSHOT, NOT A SUBSCRIPTION, AND THAT IS DELIBERATE. `useState` with
// a function initialiser reads the preference once at mount and never again.
// `shared/hooks/useMediaQuery` would give live updates, and swapping to it
// would mean a marquee that starts or stops mid-session when the visitor
// changes an OS setting. That may well be better. It is a behaviour change, and
// Phase 7 is a naming and de-duplication pass — an extraction that quietly
// alters what the page does is not an extraction. Decide it on its own.
// ---------------------------------------------------------------------------

import { useState } from 'react';

import { prefersReducedMotion } from '../tokens';

/** True when the visitor asked for reduced motion, read once at mount. */
export function usePrefersReducedMotion(): boolean {
  const [prefers] = useState(prefersReducedMotion);
  return prefers;
}
