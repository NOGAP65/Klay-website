// ---------------------------------------------------------------------------
// A LINE DRAWING OF EACH BLIND MECHANISM — roller, venetian, roman, vertical,
// panel.
//
// There is not one photograph of a venetian, roman, vertical or panel blind
// anywhere in public/images. Every frame in the repository is a roller or a
// curtain. So four of the five blind listing pages have a hero and a grid of
// cards with nothing to put in them.
//
// The wrong answers were both tried in the head first. Reusing a roller
// photograph puts a picture of the wrong product under the word "Venetian",
// which is the same mistake as the kitchen once captioned "Home Office". A grey
// box says "asset missing". Printing the item's own name in the frame — the
// first version of this — repeats the heading that is already two centimetres
// below it.
//
// A drawing of the mechanism says the one thing a photograph would have said and
// the name does not: what this blind actually IS. Slats that tilt, folds that
// stack, louvres that rotate, panels that slide past each other. Four line
// drawings distinguish four products at a glance, which is the whole job of the
// image on a listing card.
//
// DRAWN IN A 100×100 BOX, stroked in currentColor at a width that reads at both
// sizes it is used: ~340px in a card and ~260px behind a hero. Nothing here is
// filled, so it sits on charcoal or on warm white without a second variant.
//
// This is scaffolding with a clear end. When the photography exists, an `image`
// on the item in data/blindTypes.ts wins and the glyph is simply not rendered.
// ---------------------------------------------------------------------------

import { tokens } from '../theme';

/** Evenly spaced horizontal rules between two y values — the slats of a
 * venetian and, at a different rhythm, the folds of a roman. */
const rows = (count: number, from: number, to: number) =>
  Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));

function Paths({ type, ground }: { type: string; ground: string }) {
  switch (type) {
    // The tube across the top with a single sheet of fabric hanging from it, and
    // the weighted bottom bar drawn heavier — the one detail that separates a
    // roller from a blank rectangle.
    case 'roller-blinds':
      return (
        <>
          <rect x="16" y="18" width="68" height="8" rx="4" />
          <path d="M20 26 V74" />
          <path d="M80 26 V74" />
          <path d="M20 74 H80" strokeWidth="4" />
          <path d="M50 74 V82" />
          <circle cx="50" cy="84" r="2.5" />
        </>
      );

    // Slats, tilted. The tilt is the point of a venetian and a stack of level
    // rules would read as a roman, so every slat is drawn on a slight rake with
    // the ladder cords down either side.
    case 'venetian-blinds':
      return (
        <>
          <path d="M16 16 H84" strokeWidth="4" />
          {rows(7, 27, 78).map(y => (
            <path key={y} d={`M22 ${y + 2} L78 ${y - 2}`} />
          ))}
          <path d="M31 16 V80" strokeDasharray="3 5" />
          <path d="M69 16 V80" strokeDasharray="3 5" />
        </>
      );

    // Folds bunched into the top third, flat cloth below. A roman is one sheet
    // that gathers, so the rules crowd where it stacks and stop where it hangs.
    case 'roman-blinds':
      return (
        <>
          <path d="M16 16 H84" strokeWidth="4" />
          {[24, 31, 38, 45].map(y => (
            <path key={y} d={`M20 ${y} Q50 ${y + 6} 80 ${y}`} />
          ))}
          <path d="M20 45 V80" />
          <path d="M80 45 V80" />
          <path d="M20 80 H80" strokeWidth="3" />
        </>
      );

    // Louvres hanging from a track, one rotated out of plane at the left to show
    // that they turn rather than merely part.
    case 'vertical-blinds':
      return (
        <>
          <path d="M14 18 H86" strokeWidth="4" />
          {[24, 36, 48, 60, 72].map(x => (
            <path key={x} d={`M${x} 22 V84`} />
          ))}
          <path d="M24 22 L30 26 V84 L24 80 Z" />
          <path d="M84 22 V84" />
        </>
      );

    // Wide panels stacked in depth, each offset from the last — the drawing has
    // to say "sliding past one another", which is the only thing that separates
    // a panel glide from a very wide vertical.
    //
    // FILLED WITH THE GROUND, and that is the whole trick. Drawn as three
    // outlines with fill:none, the overlapping edges all stay visible and the
    // three panels merge into one lattice that reads as a window grid. Painting
    // each in the background colour before stroking it lets the near panel
    // occlude the far one, which is what makes the depth legible. They are
    // stepped down the y axis for the same reason.
    case 'panel-blinds':
      return (
        <>
          <path d="M12 15 H88" strokeWidth="4" />
          <rect x="52" y="20" width="30" height="62" fill={ground} />
          <rect x="34" y="23" width="30" height="62" fill={ground} />
          <rect x="16" y="26" width="30" height="62" fill={ground} />
        </>
      );

    default:
      return null;
  }
}

/**
 * @param type   Blind type slug — the same one the route and data/blindTypes.ts use.
 * @param size   Rendered square. A number is px; a percentage string sizes it
 *               against the parent, which is what the cards want — the frame is
 *               aspect-ratio 1/1 and its actual px size depends on the column
 *               count, so the drawing has to take its share rather than a fixed
 *               number that is right at three columns and wrong at four.
 * @param color  Stroke. Defaults to warm white, for the charcoal grounds this
 *               is drawn on everywhere today.
 */
export function BlindGlyph({
  type,
  size = 200,
  color = tokens.warmWhite,
  opacity = 0.55,
  ground = tokens.charcoal,
}: {
  type: string;
  size?: number | string;
  color?: string;
  opacity?: number;
  /** The colour behind the drawing. Only the panel glide uses it — see the note
   * on that case — but it has to match whatever the drawing is sitting on, or
   * the occluded panels appear as charcoal blocks on a pale ground. */
  ground?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity, display: 'block', transition: 'opacity 0.3s ease' }}
      aria-hidden="true"
    >
      <Paths type={type} ground={ground} />
    </svg>
  );
}
