// ---------------------------------------------------------------------------
// THE SPACING SCALE
//
// Extracted verbatim from src/theme.ts in Phase 2.2a of the architecture
// migration. Content is byte-identical to what it replaced — this was a move,
// not a rewrite, and the reasoning in the comments below is the original's.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// THE SPACING SCALE. Fibonacci-derived, converging on φ, all integers.
//
//   4 · 8 · 12 · 20 · 32 · 52 · 84 · 136
//
// Step ratios: 1.5 · 1.67 · 1.6 · 1.625 · 1.615 · 1.619 — the last is φ to
// three places. Eight values, and there are no others: the page carried 41
// distinct rendered spacings before this, which is why nothing on it read as
// deliberately grouped.
//
// THE GAP HIERARCHY IS THE POINT, not the ladder itself. Space BETWEEN groups
// must be at least 2.5× space WITHIN a group; within-group `md` against
// between-group `xl` gives 2.6×. That ratio is what makes grouping legible
// without drawing a single border, and it is the thing to check at every
// boundary rather than the individual numbers.
//
// If a layout needs a value that is not here, the layout is wrong. Report it
// rather than adding a ninth.
// ---------------------------------------------------------------------------

export const space = {
  /** Hairline offsets, icon-to-label. */
  xxs: 4,
  /** Tight pairs — a label and the number under it. */
  xs: 8,
  /** Within a line of controls. */
  sm: 12,
  /** WITHIN a group. The default gap between related elements. */
  md: 20,
  /** A group's internal block rhythm. */
  lg: 32,
  /** BETWEEN groups. 2.6× `md`, which is the hierarchy rule. */
  xl: 52,
  /** Standard section vertical padding. */
  xxl: 84,
  /** The two focal sections only — the visualiser and the closing CTA. Air is
   * how they are marked as more important than their neighbours. */
  xxxl: 136,
} as const;
