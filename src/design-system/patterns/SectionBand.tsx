// ---------------------------------------------------------------------------
// SectionBand — a full-bleed section ground with a contained inner column.
//
// Split out of src/components/home/primitives.tsx at P4-6, decision F. That
// file was 811 lines and eleven exports doing four unrelated jobs: design
// primitives with no product knowledge, two section patterns, a scroll helper,
// and a catalogue tile that knows about prices and swatch rows. Content is
// unchanged — this was a move, and the reasoning in the comments is the
// original's.
// ---------------------------------------------------------------------------

import { eyebrow, headline, space, supporting, tokens } from '../tokens';

/** The warm-white band that introduces a wall of edge-to-edge tiles: gold
 * eyebrow, big Cormorant line, centred. Used by the category grid and the range
 * grid, which is why it lives here — the two have to be the same object, and
 * they were drifting the moment there were two of them.
 *
 * Deliberately not SectionHead. That one is a headline block for a contained
 * section and sizes itself to sit inside one; this is a full-width band whose
 * job is to caption photographs, so its heading runs bigger and its padding
 * stays well short of a real section's. */
export function SectionBand({
  label,
  title,
  sub,
  isMobile,
  onDark = false,
  compact = false,
}: {
  label: string;
  title: React.ReactNode;
  /** One line under the heading, where the heading alone leaves a real question
   * open — how to use the visualiser, or whose homes the install strip is
   * showing. The category and range bands take none: above a wall of labelled
   * photographs a sub is the page explaining a picture. */
  sub?: React.ReactNode;
  isMobile: boolean;
  /** Flips the heading and sub for a dark ground. The eyebrow needs no variant:
   * gold holds on both. */
  onDark?: boolean;
  /** Tighter padding, same type. For the one band sitting directly under the
   * hero, where the section's job is to get product on screen and every pixel of
   * air above it pushes the first card below the fold. Deliberately does NOT
   * change the heading size — the bands are the page's one section-opening voice
   * and a second scale would undo that. */
  compact?: boolean;
}) {
  return (
    <div
      style={{
        // On the scale. `compact` is the tighter band used where the row below
        // is the section's real content and the heading is only naming it.
        padding: compact
          ? isMobile
            ? `${space.group}px ${space.item}px`
            : `${space.section}px 80px ${space.group}px`
          : isMobile
            ? `${space.section}px ${space.item}px`
            : `${space.band}px 80px`,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          ...eyebrow,
          // On charcoal the brand gold is the legible one (5.53); goldText is
          // for light grounds only.
          ...(onDark ? { color: tokens.onDark } : null),
          marginBottom: space.item,
        }}
      >
        {label}
      </p>
      {/* Consumes headline.section rather than declaring a 56px clamp of its
          own — the third of the three sizes this role had drifted into. */}
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
            margin: `${space.item}px auto 0`,
            maxWidth: 520,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
