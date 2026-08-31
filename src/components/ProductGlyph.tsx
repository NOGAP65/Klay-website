// ---------------------------------------------------------------------------
// A LINE DRAWING OF EACH PRODUCT MECHANISM — the five blind types, plus
// curtains, awnings, screens, shutters, wardrobes and shelving.
//
// It was BlindGlyph and covered five things. The single products page needs an
// image for every one of the twenty-two items Klay sells, and public/images has
// photographs of about six of them, so the set grew to cover the range.
//
// There is not one photograph of a venetian, roman, vertical or panel blind
// anywhere in public/images, nor of an awning, a zip screen, a café blind, a
// louvre roof or a shutter. Every frame in the repository is a roller, a
// curtain or a wardrobe. So most of a grid of the full range has nothing to put
// in it.
//
// The wrong answers were both tried in the head first. Reusing a roller
// photograph puts a picture of the wrong product under the word "Venetian",
// which is the same mistake as the kitchen once captioned "Home Office". A grey
// box says "asset missing". Printing the item's own name in the frame — the
// first version of this — repeats the heading that is already two centimetres
// below it.
//
// A drawing of the mechanism says the one thing a photograph would have said and
// the name does not: what this product actually IS. Slats that tilt, folds that
// stack, louvres that rotate, panels that slide past each other, an arm that
// folds out over a deck. Distinguishing one from another at a glance is the whole
// job of the image on a listing card, and these do it — arguably better than a
// styled room shot, which mostly shows the room.
//
// DRAWN IN A 100×100 BOX, stroked in currentColor at a width that reads at both
// sizes it is used: ~340px in a card and ~260px behind a hero. Nothing here is
// filled, so it sits on charcoal or on warm white without a second variant.
//
// This is scaffolding with a clear end. When the photography exists, an `image`
// on the item in data/blindTypes.ts wins and the glyph is simply not rendered.
// ---------------------------------------------------------------------------

import { tokens } from '@/ds';

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

    // --- beyond blinds -----------------------------------------------------

    // Cloth gathered into vertical folds on a track, parted at the centre. The
    // wave is what says fabric: every blind in this file is drawn with straight
    // edges, so a curved hem is the one silhouette that cannot be mistaken for
    // one of them.
    case 'curtains':
      return (
        <>
          <path d="M12 16 H88" strokeWidth="4" />
          <path d="M18 20 Q22 50 18 84 Q26 80 30 84 Q34 50 30 20" />
          <path d="M30 20 Q34 50 30 84 Q38 80 42 84 Q46 50 42 20" />
          <path d="M58 20 Q54 50 58 84 Q50 80 46 84 Q42 50 46 20" />
          <path d="M70 20 Q66 50 70 84 Q62 80 58 84 Q54 50 58 20" />
          <path d="M82 20 Q78 50 82 84 Q74 80 70 84 Q66 50 70 20" />
        </>
      );

    // ONE DRAWING PER MECHANISM, NOT ONE PER RANGE. Awnings first shipped with a
    // single glyph shared by all four of its products, and four identical icons
    // in a row read as a rendering bug rather than as a range — the whole reason
    // these drawings exist is to tell neighbouring cards apart. A folding arm, a
    // straight drop, an outdoor roller and a louvre roof are four genuinely
    // different objects, so they get four drawings.

    // Folding arm: the box on the wall, fabric raking down and out, and the
    // elbowed arm underneath carrying it. The arm is the point — it is what
    // makes this an awning rather than a blind on an angle.
    case 'awnings':
    case 'awning-folding':
      return (
        <>
          <path d="M10 20 V80" strokeWidth="3" />
          <rect x="12" y="18" width="14" height="12" rx="1" />
          <path d="M26 24 L86 44" />
          <path d="M86 44 L86 52" strokeWidth="3" />
          <path d="M26 30 L86 50" />
          <path d="M20 34 L52 56 L84 48" />
          <circle cx="52" cy="56" r="2" />
        </>
      );

    // Straight drop: a hood on the wall and fabric falling dead vertical to a
    // weighted bar, with the wall line drawn beside it. Against the folding arm
    // it is the same box and the opposite geometry, which is exactly the
    // distinction a customer is choosing between.
    case 'awning-straight-drop':
      return (
        <>
          <path d="M10 14 V86" strokeWidth="3" />
          <rect x="12" y="16" width="66" height="9" rx="1" />
          <path d="M18 25 V78" />
          <path d="M72 25 V78" />
          <path d="M18 78 H72" strokeWidth="4" />
          {[38, 52, 66].map(y => (
            <path key={y} d={`M18 ${y} H72`} strokeWidth="0.8" />
          ))}
        </>
      );

    // Outdoor roller: the drum, the fabric, and guide cables pinned top and
    // bottom down both edges. The pins are the difference from an indoor roller
    // — outside, the blind has to be tied down or it lifts in wind.
    case 'outdoor-roller':
      return (
        <>
          <rect x="16" y="16" width="68" height="8" rx="4" />
          <path d="M24 24 V76" />
          <path d="M76 24 V76" />
          <path d="M24 76 H76" strokeWidth="4" />
          <path d="M14 20 V84" strokeDasharray="2 4" />
          <path d="M86 20 V84" strokeDasharray="2 4" />
          <circle cx="14" cy="84" r="2" />
          <circle cx="86" cy="84" r="2" />
        </>
      );

    // Louvre roof: blades seen in section, raked over a post. Drawn overhead
    // rather than head-on, because a louvre roof is the only product in the
    // range you stand underneath.
    case 'louvre-roof':
      return (
        <>
          <path d="M12 22 H88" strokeWidth="3" />
          {[30, 40, 50, 60].map(y => (
            <path key={y} d={`M18 ${y + 5} L82 ${y - 3}`} strokeWidth="2.4" />
          ))}
          <path d="M16 22 V84" strokeWidth="2.4" />
          <path d="M84 22 V84" strokeWidth="2.4" />
        </>
      );

    // Honeycomb: the cells, seen in section. Two rows of hexagonal pockets
    // between a head rail and a bottom bar. The cell is the entire product —
    // it is what traps the air — so the drawing is the cell and nothing else.
    case 'honeycomb-blinds':
      return (
        <>
          <path d="M16 16 H84" strokeWidth="4" />
          {[26, 42, 58].map(y => (
            <g key={y}>
              <path d={`M20 ${y} H80`} />
              {[20, 32, 44, 56, 68, 80].map(x => (
                <path key={x} d={`M${x} ${y} L${x + 6} ${y + 8} L${x} ${y + 16}`} strokeWidth="0.9" />
              ))}
            </g>
          ))}
          <path d="M20 74 H80" strokeWidth="3" />
        </>
      );

    // A roller shutter: interlocking slats in side guides, with the housing box
    // above. The guides and the box are what separate it from an indoor roller
    // — this is a security and insulation product bolted to the outside wall.
    case 'roller-shutters':
      return (
        <>
          <rect x="14" y="14" width="72" height="13" rx="1" strokeWidth="2.4" />
          <path d="M18 27 V84" strokeWidth="3" />
          <path d="M82 27 V84" strokeWidth="3" />
          {[36, 44, 52, 60, 68].map(y => (
            <path key={y} d={`M18 ${y} H82`} strokeWidth="1.6" />
          ))}
          <path d="M18 76 H82" strokeWidth="4" />
        </>
      );

    // A pleated flyscreen: concertina mesh part-drawn across its track, so the
    // pleats bunch at one side and the opening stays clear on the other. The
    // whole selling point is that it folds away to nothing, which a fully closed
    // screen cannot show.
    case 'pleated-flyscreens':
      return (
        <>
          <path d="M12 18 H88" strokeWidth="3" />
          <path d="M12 82 H88" strokeWidth="3" />
          {[16, 22, 28, 34, 40, 46].map(x => (
            <path key={x} d={`M${x} 20 L${x + 3} 50 L${x} 80`} strokeWidth="1.1" />
          ))}
          <path d="M50 20 V80" strokeWidth="2.4" />
          <path d="M50 50 H84" strokeDasharray="3 5" strokeWidth="0.9" />
        </>
      );

    // A frameless shower screen: a fixed panel and a hinged door, drawn as two
    // sheets of glass with hinges and a handle and no frame anywhere. The
    // absence of a surround IS the product, so the only heavy strokes are the
    // hardware.
    case 'shower-screens':
      return (
        <>
          <rect x="14" y="16" width="30" height="68" strokeWidth="1.1" />
          <rect x="50" y="16" width="36" height="68" strokeWidth="1.1" />
          <path d="M50 28 H44" strokeWidth="3" />
          <path d="M50 72 H44" strokeWidth="3" />
          <path d="M79 46 V58" strokeWidth="3" />
          <path d="M20 24 L28 24" strokeWidth="0.8" />
          <path d="M20 30 L34 30" strokeWidth="0.8" />
        </>
      );

    // A zip screen or café blind: mesh in a track, with the tracked edges drawn
    // heavier down both sides. Cross-hatching says weave, and the tracks say the
    // edges are held — which is exactly the difference between a zip screen and
    // an outdoor blind that flaps.
    case 'screens':
      return (
        <>
          <path d="M14 16 H86" strokeWidth="4" />
          <path d="M18 20 V82" strokeWidth="3" />
          <path d="M82 20 V82" strokeWidth="3" />
          <path d="M18 82 H82" strokeWidth="3" />
          {/* The weave is drawn in one corner rather than across the whole
              panel. Full-width cross-hatching produced a dense lattice that read
              as a paned window — the same failure the shutter glyph had — and a
              patch of mesh says "this is a screen" without filling the frame.
              The zip pull on the track is the other half of the story. */}
          {[30, 38, 46, 54].map(y => (
            <path key={`h${y}`} d={`M22 ${y} H50`} strokeWidth="0.8" />
          ))}
          {[26, 34, 42, 50].map(x => (
            <path key={`v${x}`} d={`M${x} 26 V58`} strokeWidth="0.8" />
          ))}
          <circle cx="82" cy="62" r="3" strokeWidth="1.8" />
        </>
      );

    // A plantation shutter: a framed panel with a centre stile and wide louvres
    // on a tilt rod. The frame is what separates it from a venetian — a shutter
    // is joinery fitted to the opening, not a blind hung in front of it.
    case 'shutters':
      return (
        <>
          <rect x="16" y="14" width="68" height="72" strokeWidth="2.4" />
          <path d="M50 14 V86" strokeWidth="2.4" />
          {/* FEW, WIDE AND TILTED. Six fine level rules inside a framed rectangle
              with two verticals drew a window with panes in it, not a shutter.
              Five thick blades on a rake read as louvres, and the tilt is the
              one thing that says they move. */}
          {rows(5, 26, 74).map(y => (
            <path key={y} d={`M21 ${y + 2.5} L45 ${y - 2.5}`} strokeWidth="2.6" />
          ))}
          {rows(5, 26, 74).map(y => (
            <path key={`r${y}`} d={`M55 ${y + 2.5} L79 ${y - 2.5}`} strokeWidth="2.6" />
          ))}
        </>
      );

    // A wardrobe: carcass, two hanging rails, and garments on them. Drawn as an
    // interior rather than as a pair of doors, because a fitted robe is bought
    // for what is inside it and a closed door draws as a blank rectangle.
    case 'wardrobes':
      return (
        <>
          <rect x="14" y="14" width="72" height="72" strokeWidth="2.4" />
          <path d="M50 14 V86" strokeWidth="1.6" />
          <path d="M20 28 H44" strokeWidth="2" />
          <path d="M56 28 H80" strokeWidth="2" />
          {[24, 30, 36].map(x => (
            <path key={`l${x}`} d={`M${x} 28 v6 l-3 4 v18 h6 V38 l-3 -4`} strokeWidth="1" />
          ))}
          {[62, 68, 74].map(x => (
            <path key={`r${x}`} d={`M${x} 28 v6 l-3 4 v18 h6 V38 l-3 -4`} strokeWidth="1" />
          ))}
          <path d="M56 66 H80" strokeWidth="1.6" />
          <path d="M56 76 H80" strokeWidth="1.6" />
        </>
      );

    // Open shelving: uprights and four boards, with stacks of different heights
    // sitting on them. The uneven stacks are what stop it reading as a grid.
    case 'shelving':
      return (
        <>
          <path d="M16 14 V86" strokeWidth="2.4" />
          <path d="M84 14 V86" strokeWidth="2.4" />
          {[30, 48, 66, 84].map(y => (
            <path key={y} d={`M16 ${y} H84`} strokeWidth="2" />
          ))}
          <rect x="22" y="20" width="16" height="10" strokeWidth="1" />
          <rect x="44" y="23" width="10" height="7" strokeWidth="1" />
          <rect x="24" y="40" width="12" height="8" strokeWidth="1" />
          <rect x="56" y="36" width="20" height="12" strokeWidth="1" />
          <rect x="22" y="56" width="22" height="10" strokeWidth="1" />
          <rect x="62" y="58" width="14" height="8" strokeWidth="1" />
          <rect x="30" y="74" width="18" height="10" strokeWidth="1" />
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
export function ProductGlyph({
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
