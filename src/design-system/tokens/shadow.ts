// ---------------------------------------------------------------------------
// SHADOWS
//
// Extracted verbatim from src/theme.ts in Phase 2.2a of the architecture
// migration. Content is byte-identical to what it replaced — this was a move,
// not a rewrite, and the reasoning in the comments below is the original's.
// ---------------------------------------------------------------------------

/** Warm shadows. Pure-black shadows grey a warm palette; these are mixed from
 * ink so a lifted card still reads as sitting on a warm ground. */
export const shadow = {
  rest: '0 8px 20px rgba(29,29,29,0.10)',
  lift: '0 22px 44px rgba(29,29,29,0.22)',
  restOnDark: '0 6px 16px rgba(29,29,29,0.35)',
  liftOnDark: '0 20px 40px rgba(29,29,29,0.55)',
};
