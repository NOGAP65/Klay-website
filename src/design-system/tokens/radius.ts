// ---------------------------------------------------------------------------
// CORNER RADIUS
//
// Extracted verbatim from src/theme.ts in Phase 2.2a of the architecture
// migration. Content is byte-identical to what it replaced — this was a move,
// not a rewrite, and the reasoning in the comments below is the original's.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// CORNER RADIUS. Three values, and there are no others.
//
// The site rendered TWENTY-ONE distinct radii: 2 (thirty-six times), 6
// (twenty-three), 4, 8, 12, 14, 16, 20, 999, '2px', '3px', '50%', and one-offs
// including '15% 15% 45% 45%' and '0 0 30% 30%'. Nothing on the page read as
// belonging to the same system because nothing shared an edge treatment.
//
// SOFT, NOT PILL. The brief is rounded edges and explicitly not a lozenge, so
// the ceiling here is 12 and `999`/`50%` are off the scale for anything
// rectangular. A circle is still correct for things that ARE circles — the cart
// badge, a pagination dot — and those keep '50%' locally rather than pretending
// to be on this ladder.
// ---------------------------------------------------------------------------
export const radius = {
  /** Swatches, chips, checkboxes, badges — anything under about 40px. A 6px
   * radius on a 20px swatch eats a quarter of its edge. */
  sm: 3,
  /** BUTTONS, inputs, pills, tabs. Was 2, which at this scale is a bevel rather
   * than a curve and read as square. */
  md: 6,
  /** CARDS, panels, images, modals. All four corners: top-only was the other
   * option and it looks deliberate only while a card's image is flush to its top
   * edge, which is not true of the range cards or the configurator panel. One
   * value that always works beats two that need a rule. */
  lg: 10,
};
