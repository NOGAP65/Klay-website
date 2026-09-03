// ---------------------------------------------------------------------------
// PhotoTile — the edge-to-edge photo tile with a label over it.
//
// IN CATALOGUE, NOT THE DESIGN SYSTEM, and decision F is explicit about why:
// it knows about prices, fabric swatch rows and ProductGlyph. Its only consumer
// is ProductCard, which is catalogue. It lived in components/home/ and no home
// component ever imported it.
//
// Split out of src/components/home/primitives.tsx at P4-6, decision F. That
// file was 811 lines and eleven exports doing four unrelated jobs: design
// primitives with no product knowledge, two section patterns, a scroll helper,
// and a catalogue tile that knows about prices and swatch rows. Content is
// unchanged — this was a move, and the reasoning in the comments is the
// original's.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';

import { radius, space, tokens, type as typeScale, useHover } from '@/ds';
import { useIsMobile } from '@/shared';

import { ProductGlyph } from './ProductGlyph';

/** How many fabric colours print before the row becomes a count. Seven fits the
 * narrowest tile without wrapping. */
const SWATCHES_SHOWN = 7;

/** The colour row, over the photograph, under the note.
 *
 * SAMPLED ACROSS THE CARD, NOT SLICED OFF THE TOP. The colour lists are ordered
 * light to dark, so the first seven are seven near-identical creams and the
 * greens, reds and navies all hide inside the "+7". An even stride spans the
 * whole card, which is the question the row exists to answer: how wide is this
 * range. First and last are always included.
 *
 * SQUARES, NOT CIRCLES — circles read as bullets, squares read as cut cloth, and
 * they sit with a brand whose every button is a 2px rectangle. The hairline is
 * warm white here rather than ink: these sit on a darkened photograph, where an
 * ink border would vanish and the pale swatches would bleed into each other. */
function TileSwatches({ colours }: { colours: { name: string; hex: string }[] }) {
  const shown =
    colours.length <= SWATCHES_SHOWN
      ? colours
      : Array.from({ length: SWATCHES_SHOWN }, (_, i) =>
          colours[Math.round((i * (colours.length - 1)) / (SWATCHES_SHOWN - 1))],
        );
  const rest = colours.length - shown.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: space.hairline, marginTop: space.snug }}>
      {shown.map(c => (
        <span
          key={c.name}
          title={c.name}
          // ONE SWATCH DEFINITION: 20×20, radius 2. It was 13 here, 22 in the
          // configurator and 20 in the visualiser controls — and radius 1 in one
          // place against 50% in another, which drew the same object as a square
          // in one panel and a circle in the next.
          style={{
            width: 20,
            height: 20,
            borderRadius: radius.sm,
            background: c.hex,
            border: `1px solid ${tokens.onDarkEdge}`,
          }}
        />
      ))}
      {rest > 0 && (
        <span
          style={{
            ...typeScale.micro,
            letterSpacing: 'normal',
            textTransform: 'none',
            color: tokens.onDarkMuted,
            marginLeft: space.hairline,
          }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

export function PhotoTile({
  to,
  onActivate,
  label,
  image,
  objectPosition = 'center',
  minHeight,
  labelSize = 'clamp(24px, 2.4vw, 32px)',
  note,
  blurb,
  cta,
  ctaBelow = false,
  alt,
  scrim = 'normal',
  glyph,
  colours,
}: {
  to: string;
  /** ACT INSTEAD OF NAVIGATING. Given, the tile renders as a button and calls
   * this; `to` is then unused.
   *
   * It exists because the shop's cards open a configurator in place rather than
   * leaving for a detail page — the same move the homepage's range row makes,
   * and for the same reason: a photograph is the most clickable thing on a card
   * and what it promises is "show me this one". A tile that navigates and a
   * button underneath that expands would be two controls disagreeing about what
   * the card is for. */
  onActivate?: () => void;
  label: string;
  /** Omit when no photograph of this thing exists. The tile then renders as
   * charcoal with its label and note on it, which is how the range grid handles
   * the types Klay has no photography for — a Venetian tile showing a roller
   * blind is worse than a Venetian tile showing nothing. */
  image?: string;
  objectPosition?: string;
  minHeight: number;
  /** The label scales with the tile. A 32px label that suits a 420px-tall
   * inspiration tile is undersized on a 660px category tile. */
  labelSize?: string;
  /** One gold line under the label — a from-price, or "Coming soon". */
  note?: string;
  /** A line of supporting copy under the label — what is actually in this
   * category, or what the type is for. Whether a tile gets one is the caller's
   * call: it is what stops a photoless tile reading as an empty box, and on a
   * photograph it earns its place only where the label alone is too terse to be
   * useful. */
  blurb?: string;
  /** The action, parked in the bottom-right corner and ALWAYS visible. It is what
   * tells the visitor the tile is a link at all: a photograph with a word on it
   * is not obviously clickable, and the push-in alone is too subtle to carry
   * that. On hover the tile darkens behind it and the chip pops forward.
   *
   * Always-on rather than hover-only because a hover-only CTA does not exist on
   * a touch screen, and this is the primary path into a category. */
  cta?: string;
  /** Puts the CTA chip UNDER the label block instead of beside it.
   *
   * For narrow tiles. The side-by-side row is right on a 480px category tile,
   * where the label and the chip each have room; on the 300px range cards it
   * leaves about 130px for the label once the chip has taken its share, which
   * put "Blockout Curtains" onto three lines. Stacked, the label gets the full
   * width and the chip sits beneath it. */
  ctaBelow?: boolean;
  /** Drawn in the middle of a photoless tile — see components/ProductGlyph.
   * Without it a tile with no photograph is a hairline frame around nothing,
   * which is what the Awnings and Screens tiles were. A line drawing of the
   * mechanism says the one thing the label cannot: what the product IS. */
  glyph?: string;
  /** The fabric colour card, printed as a swatch row under the note. Present
   * only where a real colour list exists — it is the most useful thing a tile
   * can say about a made-to-measure product, and the thing several near
   * identical photographs of roller blinds cannot say at all. */
  colours?: { name: string; hex: string }[];
  /** Alt text, where the label alone is too thin to describe the photograph.
   * Defaults to the label, which is right for a tile captioned "Curtains" over
   * a picture of curtains and wrong for one where the caption is a product name
   * and the picture is a room. */
  alt?: string;
  /** How much of the photograph the darkening ramp covers.
   *
   * 'deep' is for tiles whose label block is TALL — a name, a price, a swatch
   * row and a stacked chip. The default ramp puts its weight in the last
   * fifteen percent of the tile, which is right when the block is a name and a
   * price, and leaves the top of a four-element block sitting on bare
   * photograph. On the pale roller frames that made "Veil" and "$220" almost
   * invisible. Deep starts the ramp higher and finishes darker. */
  scrim?: 'normal' | 'deep';
}) {
  const { isHovered, bind } = useHover();
  const isMobile = useIsMobile();

  // A <button> where there is no destination, an <a> where there is. Reset to
  // nothing so the two lay out identically — the styles below are the tile.
  // `as never` on the spread, because Link and 'button' take genuinely
  // different props and TypeScript cannot narrow a union of components by the
  // value of a variable. The pairing is right by construction two lines up.
  const Tag = (onActivate ? 'button' : Link) as React.ElementType;
  const nav: Record<string, unknown> = onActivate
    ? { onClick: onActivate, type: 'button' }
    : { to };

  return (
    <Tag
      {...bind}
      {...nav}
      style={{
        ...(onActivate
          ? { padding: 0, border: 'none', background: 'none', font: 'inherit', color: 'inherit', textAlign: 'left' as const, width: '100%', cursor: 'pointer' }
          : null),
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        minHeight,
        textDecoration: 'none',
        // ROUNDED ON ALL FOUR, and the note this replaces argued the opposite:
        // "no radius, these grids are edge to edge and a rounded corner would put
        // slivers of section background into the joins where the tiles meet."
        //
        // That was true when it was written and stopped being true when TILE_GAP
        // went from 0 to 4. The tiles no longer meet — there is already a 4px
        // channel of the section's own ground between every pair — so a corner
        // showing that same ground is consistent with the gap rather than a leak
        // through a seam. `overflow: hidden` above is what clips the photograph
        // to it, which is why one line here rounds the image too.
        //
        // All four rather than top-only: these tiles carry their label block over
        // the BOTTOM of the photograph, so a square bottom edge with a rounded top
        // would put the sharp corners exactly where the type is.
        borderRadius: radius.lg,
        //
        // A photoless tile gets a warm diagonal rather than the flat charcoal it
        // had. Flat, it read as a box that had failed to load a picture; lit from
        // one corner it reads as a surface, which is the difference between a gap
        // in the row and a deliberately quiet card. Mixed from the two brand
        // darks, so it stays inside the palette.
        background: image
          ? tokens.charcoal
          : `linear-gradient(145deg, ${tokens.charcoal} 0%, ${tokens.ink} 100%)`,
      }}
    >
      {image && (
        <img
          src={image}
          alt={alt ?? label}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition,
            display: 'block',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.7s ease',
          }}
        />
      )}
      {/* On a photoless tile, a hairline inset from the edges. It gives the
          charcoal something to be — a frame the label sits inside — instead of
          an empty rectangle, and it brightens on hover so the tile still
          answers the pointer without a photograph to push in. */}
      {!image && (
        <div
          style={{
            position: 'absolute',
            inset: 16,
            border: `1px solid ${isHovered ? tokens.onDarkEdge : tokens.onDarkLine}`,
            transition: 'border-color 0.3s ease',
            // The mechanism drawing, centred in the frame and held clear of the
            // label block at the bottom. It scales on hover for the same reason
            // a photograph does — the tile has to answer the pointer, and on a
            // photoless tile there is nothing else to move.
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: '22%',
          }}
        >
          {glyph && (
            <span
              style={{
                display: 'block',
                transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.7s ease',
              }}
            >
              <ProductGlyph type={glyph} size={140} opacity={isHovered ? 0.6 : 0.42} />
            </span>
          )}
        </div>
      )}
      {/* Two stops rather than one. Several of these photographs are pale at the
          bottom edge — a bedspread, a bare floorboard — and a single linear ramp
          strong enough to hold white type over those was dark enough to look
          like a bar across the picture on the others. This ramps late and
          finishes deep, so most of the gradient's weight is in the last 15% where
          the label actually sits. */}
      {/* Only over a photograph. On a charcoal tile there is nothing to darken,
          and the gradient would show as a band across a flat ground. */}
      {image && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: scrim === 'deep' ? '82%' : '58%',
            // Deeper and taller than it was. The labels were getting lost on
            // these photographs — they are warm and bright right down to the
            // bottom edge, and warm white at weight 300 over a sunlit floorboard
            // is decoration rather than a label you notice.
            background:
              scrim === 'deep'
                ? 'linear-gradient(180deg, rgba(29,29,29,0) 0%, rgba(29,29,29,0.42) 38%, rgba(29,29,29,0.80) 66%, rgba(29,29,29,0.95) 100%)'
                : 'linear-gradient(180deg, rgba(29,29,29,0) 0%, rgba(29,29,29,0.30) 48%, rgba(29,29,29,0.92) 100%)',
          }}
        />
      )}
      {/* The black-out. Above the photograph and its gradient, below the label row
          — which is why that row comes after it in the DOM and stays crisp while
          everything behind it dims. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(29,29,29,0.66)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Label bottom-left, action bottom-right, on one baseline. alignItems is
          flex-end so the chip sits level with the bottom of the label block
          however many lines the label and its blurb run to. */}
      <div
        style={{
          position: 'absolute',
          left: isMobile ? space.item : space.group,
          right: isMobile ? space.item : space.group,
          bottom: isMobile ? space.item : space.group,
          display: 'flex',
          ...(ctaBelow
            ? { flexDirection: 'column' as const, alignItems: 'flex-start', gap: space.item }
            : { alignItems: 'flex-end', justifyContent: 'space-between', gap: space.item }),
          // The row lifts with the hover rather than staying put, so the whole
          // tile reads as one object responding to the pointer.
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'transform 0.4s ease',
        }}
      >
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <div
          style={{
            fontFamily: tokens.display,
            fontSize: labelSize,
            fontStyle: 'italic',
            // 400, not 300. Cormorant's light weight is very light, and over a
            // photograph it thins out to the point where the label reads as a
            // watermark.
            fontWeight: 400,
            lineHeight: 1.1,
            color: tokens.paper,
            // Not decoration — it is what guarantees the label reads on the light
            // photographs without deepening the gradient over the dark ones.
            // Mixed from ink, so it stays warm rather than greying the picture.
            textShadow: image ? '0 1px 12px rgba(29,29,29,0.55)' : undefined,
          }}
        >
          {label}
        </div>
        {blurb && (
          <div
            style={{
              ...typeScale.body,
              color: 'rgba(248,248,248,0.82)',
              marginTop: space.tight,
              maxWidth: 280,
              textShadow: image ? '0 1px 10px rgba(29,29,29,0.5)' : undefined,
            }}
          >
            {blurb}
          </div>
        )}
        {note && (
          <div
            style={{
              ...typeScale.micro,
              // Brand gold, and it stays: this note sits over a darkened
              // photograph, not a light ground, so goldText would go muddy here.
              color: tokens.onDark,
              marginTop: space.snug,
              // The label and the blurb both carry one and the price did not,
              // which is backwards: gold on a sunlit windowsill is far closer to
              // its background than warm white is, so "FROM $220" was the one
              // line on the tile you could not read. Deeper than theirs for the
              // same reason.
              textShadow: image ? '0 1px 10px rgba(29,29,29,0.75)' : undefined,
            }}
          >
            {note}
          </div>
        )}
        {colours && <TileSwatches colours={colours} />}
        </div>

        {cta && (
          <span
            style={{
              flexShrink: 0,
              // THE SELECTABLE-PILL BOX, one definition: height 32, 20 either
              // side, radius 2. It was three heights (27 / 34.38 / 37) at three
              // sizes across the page.
              display: 'inline-flex',
              alignItems: 'center',
              height: 32,
              padding: `0 ${space.item}px`,
              borderRadius: radius.md,
              boxSizing: 'border-box',
              ...typeScale.label,
              lineHeight: 1,
              color: tokens.onAccent,
              background: isHovered ? tokens.accentHover : tokens.accent,
              whiteSpace: 'nowrap',
              // Pops forward on hover. transformOrigin is the bottom-right corner
              // it is pinned to, so it grows inward rather than pushing itself
              // past the edge of the tile.
              transform: isHovered ? 'scale(1.08)' : 'scale(1)',
              // The corner the chip is pinned to, so it grows inward rather than
              // pushing itself past the edge of the tile — which side that is
              // depends on whether it sits beside the label or under it.
              transformOrigin: ctaBelow ? 'bottom left' : 'bottom right',
              transition: 'transform 0.28s ease, background 0.28s ease',
            }}
          >
            {cta}
          </span>
        )}
      </div>
    </Tag>
  );
}
