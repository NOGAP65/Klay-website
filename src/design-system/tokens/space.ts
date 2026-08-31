// ---------------------------------------------------------------------------
// THE SPACING SCALE. Eight steps, closed. ADR-017.
//
//   4 · 8 · 12 · 16 · 24 · 40 · 80 · 120
//
// Step ratios: 2 · 1.5 · 1.33 · 1.5 · 1.67 · 2 · 1.5 — tightening in the middle
// where fine control matters and opening at the ends where it does not.
//
// ---------------------------------------------------------------------------
// WHY THESE NUMBERS AND NOT THE ELEGANT ONES.
//
// This scale replaced 4 · 8 · 12 · 20 · 32 · 52 · 84 · 136, which was
// Fibonacci-derived and converged on φ. It was a lovely property and it is the
// reason nobody used it: of those eight steps, 52, 84 and 136 had ZERO real
// occurrences in the codebase, while the two most-used values on the site —
// 16 (36 occurrences) and 24 (27) — were not steps at all.
//
// That is the whole mechanism behind the audit finding that no file under
// src/pages/ referenced space.* even once. The ladder did not have the rungs
// people needed, so they stopped climbing it.
//
// These eight were derived by measurement: 54.5% of existing occurrences land
// on a step unchanged, against 29.7% for the scale they replaced, at the lowest
// average drift of the seven candidates scored.
//
// ---------------------------------------------------------------------------
// THE GAP HIERARCHY IS STILL THE POINT, not the ladder itself.
//
// Space BETWEEN groups must be at least 2.5× space WITHIN a group. `item` (16)
// against `section` (40) gives exactly 2.5. That ratio is what makes grouping
// legible without drawing a single border, and it is the thing to check at every
// boundary rather than the individual numbers.
//
// ---------------------------------------------------------------------------
// THE SCALE IS CLOSED. A NINTH STEP IS REFUSED BY DEFAULT.
//
// If a layout needs a value between two steps, there are exactly two legitimate
// answers: change the layout to use an existing step, which is almost always
// the right one; or change the scale, deliberately, in this file, with an ADR
// amending ADR-017 — accepting that every consumer of the neighbouring steps is
// then in a different proportional relationship.
//
// A ninth step added "just for this one case" is how a scale becomes a list.
// ---------------------------------------------------------------------------

export const space = {
  /** Hairline offsets, icon-to-label. */
  hairline: 4,
  /** Tight pairs — a label and the number under it. */
  tight: 8,
  /** Within a line of controls. */
  snug: 12,
  /** BETWEEN RELATED ELEMENTS — the default gap, and the most-used value on the
   *  site by a wide margin. Reach for this one first. */
  item: 16,
  /** A group's internal block rhythm. */
  group: 24,
  /** BETWEEN groups. 2.5× `item`, which is the hierarchy rule above. */
  section: 40,
  /** Standard section vertical padding. */
  band: 80,
  /** The two focal sections only — the visualiser and the closing CTA. Air is
   *  how they are marked as more important than their neighbours. */
  focal: 120,

  // -------------------------------------------------------------------------
  // DEPRECATED T-SHIRT ALIASES. Kept for the frozen visualiser only.
  //
  // A t-shirt size is neither a value nor a role: `md` does not say what the
  // step is FOR, which is why a ladder named this way can grow a ninth rung
  // without anyone noticing. §9 asks for roles, and the eight above are roles.
  //
  // FIVE OF THESE CHANGE VALUE, and that is visible on screen — see ADR-017 for
  // the call-site counts. `md` 20 → 16 is the largest single visual change in
  // the migration: 75 call sites tighten by 4px.
  //
  // The frozen zone has 12 spacing occurrences that cannot be repointed until
  // P4-7. These eight exports exist for those and nothing else, and they go
  // with the theme.ts shim.
  // -------------------------------------------------------------------------
  /** @deprecated Use `space.hairline`. */
  xxs: 4,
  /** @deprecated Use `space.tight`. */
  xs: 8,
  /** @deprecated Use `space.snug`. */
  sm: 12,
  /** @deprecated Use `space.item`. Was 20; the scale's nearest step is 16. */
  md: 16,
  /** @deprecated Use `space.group`. Was 32; the scale's nearest step is 24. */
  lg: 24,
  /** @deprecated Use `space.section`. Was 52; the scale's nearest step is 40. */
  xl: 40,
  /** @deprecated Use `space.band`. Was 84; the scale's nearest step is 80. */
  xxl: 80,
  /** @deprecated Use `space.focal`. Was 136; the scale's nearest step is 120. */
  xxxl: 120,
} as const;
