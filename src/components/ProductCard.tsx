// ---------------------------------------------------------------------------
// THE LISTING CARD — one component, used by the single products page and by the
// five blind-type pages.
//
// It lived inside BlindsPage and knew about BlindType/BlindItem. The products
// page needs the same card for curtains, awnings, wardrobes and shelving, none
// of which are blinds, so it takes plain presentational props now and neither
// page owns the design.
//
// Built against Kookai, Allbirds and DIY Blinds. All three agree on the thing
// Klay's original card was doing wrong:
//
// NO CARD. There is no box — no white panel, no 12px radius, no border, no drop
// shadow, and nothing lifts on hover. The photograph sits straight on the
// section's ground and the type sits under it. A listing grid is a wall of
// photographs, and putting each one in a raised white tray means the eye reads
// twelve trays before it reads a single blind. The original had all five of
// those decorations at once.
//
// PORTRAIT, NOT SQUARE. 4:5 — a window covering hangs, so the frame wants
// height, and every reference grid is portrait for the same reason its subject
// is.
//
// NO BUTTON. The whole tile is the link. A filled gold DESIGN YOURS on every
// card turned the grid into a row of buttons with pictures above them, and gold
// is meant to mean "the one action here" — it cannot mean that twenty times on
// one screen. The only thing the button carried that mattered is whether the
// item is buyable, and the price line says that better: a real number against
// PRICE ON MEASURE.
//
// THE LAST ROW IS WHATEVER VARIES. Colours where a colour card exists; the
// descriptor line where one does not — a venetian has no swatches and its names
// (25mm vs 50mm Aluminium) mean nothing without the sentence.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tokens } from '../theme';
import { ProductGlyph } from './ProductGlyph';

/** How many fabric colours print before the row becomes a count. Seven fits the
 * narrowest column without wrapping, and a wrapped swatch row costs a line of
 * height on every card in the grid to show colours nobody is choosing from a
 * listing page anyway. */
const SWATCHES_SHOWN = 7;

export interface Swatch {
  name: string;
  hex: string;
}

/** The swatch row — the most useful thing one of these cards can say.
 *
 * Four roller blinds photographed in four similar rooms look like the same
 * product four times; what separates them is the fabric, and what makes any of
 * them feel buyable is that it comes in fourteen colours. Kookai and Allbirds
 * both put the colourway row on the card for exactly this reason.
 *
 * SQUARES, NOT CIRCLES. Circles read as bullets or status dots; squares read as
 * cut cloth, and they sit with a brand whose every button is a 2px rectangle.
 * This also replaced three hardware dots that described the bracket rather than
 * the blind and were the same three greys on every card in the grid. */
function SwatchRow({ colours }: { colours: Swatch[] }) {
  // SAMPLED ACROSS THE CARD, NOT SLICED OFF THE TOP. The colour list is ordered
  // light to dark, so the first seven were seven near-identical creams, under
  // which the range appeared to be beige and beige only — Forest Green, Red,
  // Deep Ocean Blue and Black were all hidden inside the "+7". An even stride
  // spans the whole card, which is the question the row exists to answer: how
  // wide is this range. First and last are always included.
  const shown =
    colours.length <= SWATCHES_SHOWN
      ? colours
      : Array.from({ length: SWATCHES_SHOWN }, (_, i) =>
          colours[Math.round((i * (colours.length - 1)) / (SWATCHES_SHOWN - 1))],
        );
  const rest = colours.length - shown.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
      {shown.map(c => (
        <span
          key={c.name}
          title={c.name}
          style={{
            width: 13,
            height: 13,
            borderRadius: 1,
            background: c.hex,
            // A hairline on every swatch, not only the pale ones. Without it
            // White and Surfmist dissolve into the parchment ground and the row
            // appears to start three swatches in.
            border: '1px solid rgba(28,24,16,0.16)',
          }}
        />
      ))}
      {rest > 0 && (
        <span
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            color: 'rgba(28,24,16,0.45)',
            marginLeft: 4,
            letterSpacing: '0.02em',
          }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

export interface ProductCardProps {
  /** Where the whole tile goes. */
  to: string;
  name: string;
  /** Small caps line above the name. The range on the all-products grid, the
   * fabric or finish on a single-type page — whichever is the useful
   * distinction in that context. */
  eyebrow: string;
  /** Shown in the last row when there are no `colours`. */
  tagline?: string;
  /** Present only where the item is genuinely priced and buyable. Without it
   * the card says PRICE ON MEASURE, which is the honest state for everything
   * Klay makes to measure and has never had a price grid for. */
  priceFrom?: number;
  image?: string;
  imagePosition?: string;
  /** ProductGlyph key, drawn on charcoal where no photograph exists. */
  glyph?: string;
  colours?: Swatch[];
}

export function ProductCard({
  to,
  name,
  eyebrow,
  tagline,
  priceFrom,
  image,
  imagePosition,
  glyph,
  colours,
}: ProductCardProps) {
  const [hover, setHover] = useState(false);
  const buyable = priceFrom !== undefined;

  return (
    <Link
      to={to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'block', textDecoration: 'none' }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '4 / 5',
          overflow: 'hidden',
          borderRadius: 2,
          background: image ? '#EEEAE4' : tokens.charcoal,
        }}
      >
        {image ? (
          <img
            src={image}
            alt={`${name} — ${eyebrow}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: imagePosition ?? 'center',
              display: 'block',
              // The only thing hover does. The card does not move, gain a
              // shadow or change colour — the photograph breathes, and that is
              // enough to say the tile is live.
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        ) : (
          // NO PHOTOGRAPH OF THIS PRODUCT EXISTS — see the note at the top of
          // ProductGlyph. A line drawing of the mechanism, rather than a
          // photograph of the wrong product or the item's own name repeated a
          // centimetre above where it already appears. One shoot replaces this
          // with an `image` in the data and nothing here changes.
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <ProductGlyph type={glyph ?? ''} size="58%" opacity={hover ? 0.68 : 0.5} />
          </div>
        )}
      </div>

      {/* Muted rather than gold: gold on every card in a twenty-card grid stops
          being an accent and becomes the grid's body colour. */}
      <div
        style={{
          fontFamily: tokens.body,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(28,24,16,0.45)',
          marginTop: 16,
        }}
      >
        {eyebrow}
      </div>

      {/* Name and price share a baseline. Two rows would push the swatches below
          the fold on a short viewport, and name-left / price-right is the
          arrangement every reference grid uses. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 5,
        }}
      >
        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: 21,
            fontWeight: 300,
            lineHeight: 1.15,
            margin: 0,
            color: hover ? tokens.gold : tokens.ink,
            transition: 'color 0.25s ease',
          }}
        >
          {name}
        </h3>
        <span
          style={{
            fontFamily: tokens.body,
            // The buyable/enquiry distinction the gold button used to carry. A
            // price is a number; "price on measure" is a sentence, so it is set
            // smaller and quieter rather than pretending to be one.
            fontSize: buyable ? 14 : 10,
            fontWeight: buyable ? 500 : 400,
            letterSpacing: buyable ? undefined : '0.1em',
            textTransform: buyable ? undefined : 'uppercase',
            whiteSpace: 'nowrap',
            color: buyable ? tokens.ink : 'rgba(28,24,16,0.42)',
          }}
        >
          {buyable ? `From $${priceFrom}` : 'Price on measure'}
        </span>
      </div>

      {colours ? (
        <SwatchRow colours={colours} />
      ) : tagline ? (
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 13,
            lineHeight: 1.45,
            color: 'rgba(28,24,16,0.5)',
            margin: 0,
            marginTop: 10,
          }}
        >
          {tagline}
        </p>
      ) : null}
    </Link>
  );
}
