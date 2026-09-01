// ---------------------------------------------------------------------------
// HOMEPAGE FURNITURE — what was left of components/home/primitives.tsx.
//
// Decision F split that file four ways at P4-6. The CTA family, useHover and
// TextLink went to design-system/primitives; SectionHead and SectionBand to
// design-system/patterns; scrollToId to shared/utils; PhotoTile to catalogue,
// which was its only consumer.
//
// These two had nowhere else to be. TILE_GAP is the homepage's own grid rhythm
// and is read by two home sections. ArrowLink is read by NOTHING — it is a dead
// export, kept here rather than promoted into the design system, where it would
// have become a public component with no consumer. It is a knip candidate at
// Phase 6.3, and that is the right place to decide it rather than a move phase.
// ---------------------------------------------------------------------------

import { motion, space, tokens, type as typeScale } from '@/ds';

/** The strip between tiles in every edge-to-edge grid on the page — categories,
 * the range, the install shots, the journal row.
 *
 * It was 0: the photographs met with nothing between them. Butted together they
 * read as one continuous photographic wall, and at the joins between two pale
 * frames it became genuinely unclear where one tile ended and the next began —
 * three category tiles looked like one wide picture with three captions on it.
 *
 * 4px, and the gap is always the SECTION'S OWN GROUND rather than a drawn line,
 * because grid gap shows whatever is behind it. So the strip is warm white
 * between the category tiles, parchment between the range cards and charcoal
 * between the journal tiles, and it never reads as a border — which is the
 * distinction between this and putting a 1px rule around every tile.
 *
 * Only between tiles. Grid gap adds nothing at the outer edges, so every one of
 * these grids still runs to the edge of the viewport. */
export const TILE_GAP = 4;

/** "Shop Now →" / "Explore Curtains →". A link, not a button: these sit inside
 * or beneath a card that is itself clickable, and a second filled button would
 * make the card look like it had two actions. */
export function ArrowLink({ label, hovered }: { label: string; hovered: boolean }) {
  return (
    <span
      style={{
        ...typeScale.label,
        // goldText: this link sits on a light card ground, where the brand gold
        // measures 2.11–2.47.
        color: hovered ? tokens.ink : tokens.ink,
        borderBottom: `1px solid ${hovered ? tokens.ink : tokens.line}`,
        paddingBottom: space.hairline,
        whiteSpace: 'nowrap',
        transition: motion.link,
      }}
    >
      {label} →
    </span>
  );
}
