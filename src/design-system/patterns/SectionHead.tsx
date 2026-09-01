// ---------------------------------------------------------------------------
// SectionHead — eyebrow, headline and supporting copy as one block.
//
// Split out of src/components/home/primitives.tsx at P4-6, decision F. That
// file was 811 lines and eleven exports doing four unrelated jobs: design
// primitives with no product knowledge, two section patterns, a scroll helper,
// and a catalogue tile that knows about prices and swatch rows. Content is
// unchanged — this was a move, and the reasoning in the comments is the
// original's.
// ---------------------------------------------------------------------------

import { eyebrow, headline, space, supporting, tokens } from '../tokens';

/** Eyebrow, Cormorant headline, Inter sub — in that order, with the section's
 * own rhythm. `align` centres it for full-width sections and leaves it ranged
 * left for the ones with a column beside them. */
export function SectionHead({
  label,
  title,
  sub,
  align = 'left',
  onDark = false,
  maxWidth = 720,
  style,
}: {
  label?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  align?: 'left' | 'center';
  onDark?: boolean;
  maxWidth?: number;
  style?: React.CSSProperties;
}) {
  const centred = align === 'center';
  return (
    <div
      style={{
        textAlign: align,
        maxWidth,
        marginLeft: centred ? 'auto' : undefined,
        marginRight: centred ? 'auto' : undefined,
        ...style,
      }}
    >
      {label && (
        <p
          style={{
            ...eyebrow,
            ...(onDark ? { color: tokens.onDark } : null),
            marginBottom: space.item,
          }}
        >
          {label}
        </p>
      )}
      <h2
        style={{
          ...headline.section,
          color: onDark ? tokens.paper : tokens.ink,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            ...(onDark ? supporting.onDark : supporting.onLight),
            // Within the head group — eyebrow, headline and sub are one object,
            // so they sit at `md` and the section's own padding provides the
            // between-group distance.
            marginTop: space.item,
            maxWidth: 560,
            marginLeft: centred ? 'auto' : undefined,
            marginRight: centred ? 'auto' : undefined,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
