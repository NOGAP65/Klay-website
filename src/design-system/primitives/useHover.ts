// ---------------------------------------------------------------------------
// useHover — hover state plus its two handlers.
//
// Split out of src/components/home/primitives.tsx at P4-6, decision F. That
// file was 811 lines and eleven exports doing four unrelated jobs: design
// primitives with no product knowledge, two section patterns, a scroll helper,
// and a catalogue tile that knows about prices and swatch rows. Content is
// unchanged — this was a move, and the reasoning in the comments is the
// original's.
// ---------------------------------------------------------------------------

import { useState } from 'react';

/** Hover state plus the two handlers, so a component that needs three hover
 * targets doesn't declare three useStates by hand. */
export function useHover() {
  const [hover, setHover] = useState(false);
  return {
    hover,
    bind: {
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
    },
  };
}
