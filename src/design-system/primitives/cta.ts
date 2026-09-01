// ---------------------------------------------------------------------------
// THE CTA CONTRACT — the variants, the base box, and the fills.
//
// Not a component: the shared style two components render. CtaButton and
// CtaLink are an <a> and a <button> with identical geometry, and the note on
// ctaBase explains why that geometry is set explicitly rather than left to two
// different UA defaults.
//
// Split out of src/components/home/primitives.tsx at P4-6, decision F. That
// file was 811 lines and eleven exports doing four unrelated jobs: design
// primitives with no product knowledge, two section patterns, a scroll helper,
// and a catalogue tile that knows about prices and swatch rows. Content is
// unchanged — this was a move, and the reasoning in the comments is the
// original's.
// ---------------------------------------------------------------------------

import { motion, radius, space, tokens, type as typeScale } from '../tokens';

/** `primary` was called `gold` until the palette lost its gold, and is now the
 * bronze fill. The name is the only thing that changed about the other two. */
export type CtaVariant = 'primary' | 'onDark' | 'ghost';

/** THE PRIMARY CTA — one definition, and the height is EXPLICIT.
 *
 * The page rendered this button at six heights (40 / 44 / 51.19 / 55 / 59.19),
 * and the 55-vs-59.19 pair is the tell: `CtaButton` renders a <button> and
 * `CtaLink` renders an <a>, both sized from padding plus whatever line-height
 * the UA applies to that element. Two elements, two UA defaults, one padding —
 * they will drift apart forever. Setting `height` ends it permanently, which is
 * why the vertical padding is gone rather than merely equalised. */
export const ctaBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  ...typeScale.label,
  // BOLDER THAN THE LABEL SCALE, which is 500. A button label is the one piece
  // of type on the page that has to hold its own inside a filled block rather
  // than on a ground, and at 12px caps with 0.14em of tracking, 500 read as
  // regular text that happened to be on a colour.
  fontWeight: 700,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  // radius.md, not the 2 this was. See the note on `radius` in theme.ts — 2 is a
  // bevel rather than a curve and read as square at this size.
  borderRadius: radius.md,
  height: 52,
  padding: `0 ${space.group}px`,
  border: '1px solid transparent',
  transition: motion.button,
  // Belt and braces on the two element types: a <button> inherits a UA
  // line-height that can still push the flex box taller than `height` at some
  // zoom levels.
  boxSizing: 'border-box',
  lineHeight: 1,
};

export function ctaFill(variant: CtaVariant, isHovered: boolean): React.CSSProperties {
  switch (variant) {
    // BRONZE, WHITE LABEL, BOLD. The page's primary action, and the only place on
    // the site that carries chroma at all. Deepens on hover.
    case 'primary':
      return {
        background: isHovered ? tokens.accentHover : tokens.accent,
        color: tokens.onAccent,
        // The border matches the fill again. It was `accentEdge` for one pass, to
        // hold the block's boundary while the fill was light enough to lose it —
        // deepening the fill for the white label made the fill carry its own
        // boundary (4.58 at rest, 5.60 on hover) and the edge became a dark line
        // around a dark block for no reason.
        borderColor: isHovered ? tokens.accentHover : tokens.accent,
      };
    // Charcoal ground, paper text — for light sections that want a quieter
    // primary than the bronze, or a second action beside one.
    case 'onDark':
      return {
        background: isHovered ? tokens.ink : tokens.charcoal,
        color: tokens.onDark,
        borderColor: isHovered ? tokens.ink : tokens.charcoal,
      };
    // A PAPER-FILLED VARIANT WAS WRITTEN HERE AND THEN REMOVED, which is worth
    // recording because the reasoning was sound and the premise was not.
    //
    // The accent measures 2.71:1 against charcoal and 3.46 against ink, so a
    // bronze button on a solid dark section would be hard to locate — its label
    // would still be perfectly legible on the bronze, which is the failure
    // a text-contrast audit cannot see. The since-deleted final CTA band and the
    // visualiser card looked like the cases that needed it. (Under the royal
    // blue this replaced the same two numbers were 1.48 and 1.88, so the hazard
    // was worse then and the conclusion is unchanged.)
    //
    // Measured in the running page, neither was. That band's charcoal was a
    // fallback BEHIND a photograph — it only showed while the image loaded — and
    // the visualiser's Buy Now sits on `band`, not on the black card above it. A
    // filled-block audit across all eight routes finds no CTA on a solid dark
    // ground at all, so the variant had no consumer and is gone rather than kept
    // for a case that does not exist. The constraint itself is documented on
    // `accent` in theme.ts, where the next person will actually look.
    //
    // No fill. Only over photography, where it reads as the quieter of two.
    case 'ghost':
      return {
        background: 'transparent',
        color: isHovered ? tokens.card : tokens.onDarkMuted,
        borderColor: isHovered ? tokens.line : tokens.onDarkEdge,
      };
  }
}
