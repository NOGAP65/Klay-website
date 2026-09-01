// ---------------------------------------------------------------------------
// TextLink — the secondary path out of a section.
//
// Split out of src/components/home/primitives.tsx at P4-6, decision F. That
// file was 811 lines and eleven exports doing four unrelated jobs: design
// primitives with no product knowledge, two section patterns, a scroll helper,
// and a catalogue tile that knows about prices and swatch rows. Content is
// unchanged — this was a move, and the reasoning in the comments is the
// original's.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';

import { motion, space, tokens, type as typeScale } from '../tokens';

import { useHover } from './useHover';

/** Underlined text link — the secondary path out of a section, deliberately
 * not a button so it can sit beside one without competing. */
export function TextLink({
  to,
  children,
  onDark = false,
  accent = false,
}: {
  to: string;
  children: React.ReactNode;
  onDark?: boolean;
  /** Full strength at rest, not just on hover — for the one secondary link that
   * has to hold its own beside a button rather than recede from it. */
  accent?: boolean;
}) {
  const { hover, bind } = useHover();
  /** THE STRONGEST TEXT COLOUR THE GROUND ALLOWS, which is what the accent and
   * the hover state both resolve to.
   *
   * It was `goldFor`, and the name outlived the colour: on dark it returned the
   * gold that measured 5.53 on charcoal, on light the goldText that measured
   * 5.05 on parchment. The mechanical pass mapped the dark branch to
   * `fillStrong` — ink on a dark ground — so every accent link and every hover
   * on a dark section resolved to near-black on near-black.
   *
   * Now it is simply the top of the ramp for whichever ground it is on, and the
   * accent reads as "full strength against muted siblings" rather than as a
   * second colour. Same trade as the nav's SHOP. */
  const strongest = onDark ? tokens.onDark : tokens.ink;
  const rest = accent ? strongest : onDark ? tokens.onDarkMuted : tokens.inkSoft;
  return (
    <Link
      {...bind}
      to={to}
      style={{
        ...typeScale.body,
        color: hover ? strongest : rest,
        textDecoration: 'none',
        borderBottom: `1px solid ${hover ? strongest : 'currentColor'}`,
        paddingBottom: space.hairline,
        transition: motion.link,
      }}
    >
      {children}
    </Link>
  );
}
