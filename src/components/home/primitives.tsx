// ---------------------------------------------------------------------------
// Shared pieces for the homepage sections.
//
// Inline styles are the house rule, which means every hover state has to be
// tracked in React state and every button re-declares its own fill. Twelve
// sections doing that independently is how a page ends up with nine slightly
// different gold buttons — so the CTA and the section header live here once.
//
// The CTA rule is narrow on purpose: gold ground with ink text, or charcoal
// ground with gold text. Nothing else fills. The one variant that does neither
// is `ghost`, which sits over hero photography and has no fill at all.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tokens, eyebrow, headline, motion } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ProductGlyph } from '../ProductGlyph';

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

/** Hover state plus the two handlers, so a component that needs three hover
 * targets doesn't declare three useStates by hand. */
export function useHover() {
  const [hover, setHover] = useState(false);
  return {
    hover,
    bind: {
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
    },
  };
}

export type CtaVariant = 'gold' | 'onDark' | 'ghost';

const ctaBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: tokens.body,
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  borderRadius: 2,
  padding: '19px 42px',
  border: '1px solid transparent',
  transition: motion.button,
};

function ctaFill(variant: CtaVariant, hover: boolean): React.CSSProperties {
  switch (variant) {
    // Gold ground, ink text. The page's primary action.
    case 'gold':
      return {
        background: hover ? tokens.goldLight : tokens.gold,
        color: tokens.ink,
        borderColor: hover ? tokens.goldLight : tokens.gold,
      };
    // Charcoal ground, gold text — the inverse, for use on light sections
    // where a gold fill would be the third gold thing in view.
    case 'onDark':
      return {
        background: hover ? tokens.ink : tokens.charcoal,
        color: tokens.gold,
        borderColor: hover ? tokens.ink : tokens.charcoal,
      };
    // No fill. Only over photography, where it reads as the quieter of two.
    case 'ghost':
      return {
        background: 'transparent',
        color: hover ? tokens.gold : tokens.warmWhite,
        borderColor: hover ? tokens.gold : tokens.onDarkEdge,
      };
  }
}

export function CtaLink({
  to,
  variant = 'gold',
  children,
  style,
}: {
  to: string;
  variant?: CtaVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { hover, bind } = useHover();
  return (
    <Link {...bind} to={to} style={{ ...ctaBase, ...ctaFill(variant, hover), ...style }}>
      {children}
    </Link>
  );
}

export function CtaButton({
  onClick,
  variant = 'gold',
  children,
  style,
}: {
  onClick: () => void;
  variant?: CtaVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { hover, bind } = useHover();
  return (
    <button {...bind} onClick={onClick} style={{ ...ctaBase, ...ctaFill(variant, hover), ...style }}>
      {children}
    </button>
  );
}

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
  /** Gold at rest, not just on hover — for the one secondary link that has to
   * hold its own beside a gold button rather than recede from it. */
  accent?: boolean;
}) {
  const { hover, bind } = useHover();
  const rest = accent ? tokens.gold : onDark ? tokens.onDarkMuted : tokens.inkSoft;
  return (
    <Link
      {...bind}
      to={to}
      style={{
        fontFamily: tokens.body,
        fontSize: 13,
        color: hover ? tokens.gold : rest,
        textDecoration: 'none',
        borderBottom: `1px solid ${hover ? tokens.gold : 'currentColor'}`,
        paddingBottom: 2,
        transition: motion.link,
      }}
    >
      {children}
    </Link>
  );
}

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
  titleSize,
  style,
}: {
  label?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  align?: 'left' | 'center';
  onDark?: boolean;
  maxWidth?: number;
  /** Overrides the section scale for a headline that has to be quieter than its
   * neighbours — a long one, or one in a section that is deliberately compact.
   * Note that `style` lands on the WRAPPER, not the heading, so a fontSize
   * passed there silently does nothing. */
  titleSize?: string;
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
      {label && <p style={{ ...eyebrow, marginBottom: 22 }}>{label}</p>}
      <h2
        style={{
          ...headline.section,
          color: onDark ? tokens.warmWhite : tokens.ink,
          ...(titleSize ? { fontSize: titleSize } : null),
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 16,
            lineHeight: 1.7,
            color: onDark ? tokens.onDarkMuted : tokens.inkSoft,
            margin: 0,
            marginTop: 20,
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

/** Smooth-scrolls to a section on this page. Both hero CTAs and the closing
 * CTA point back into the page rather than navigating away — the visualiser is
 * the conversion surface and it is already here. */
export const scrollToId = (id: string) => () => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

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
        padding: compact
          ? isMobile
            ? '34px 24px 30px'
            : '46px 80px 40px'
          : isMobile
            ? '52px 24px'
            : '76px 80px',
        textAlign: 'center',
      }}
    >
      <p style={{ ...eyebrow, marginBottom: 16 }}>{label}</p>
      <h2
        style={{
          fontFamily: tokens.display,
          fontSize: 'clamp(34px, 4.4vw, 56px)',
          fontWeight: 300,
          lineHeight: 1.05,
          color: onDark ? tokens.warmWhite : tokens.ink,
          margin: 0,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 15,
            lineHeight: 1.7,
            color: onDark ? tokens.onDarkMuted : tokens.inkSoft,
            margin: '18px auto 0',
            maxWidth: 520,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PhotoTile — the edge-to-edge photo tile with a label over it.
//
// Two sections are built from this: the 2x2 room grid and the row of four
// inspiration tiles. They are the same object at different grid dimensions —
// full-bleed photograph, Cormorant italic label bottom-left, a gradient at the
// bottom only, and a slow push-in on hover — so it is defined once rather than
// twice with the gradients and the zoom timings drifting apart.
//
// The gradient is confined to the bottom third. A wash over the whole tile
// would dull the photograph everywhere to make legible a label that only
// occupies one corner.
// ---------------------------------------------------------------------------

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
            border: '1px solid rgba(245,242,237,0.45)',
          }}
        />
      ))}
      {rest > 0 && (
        <span
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            color: 'rgba(245,242,237,0.75)',
            marginLeft: 4,
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
  label,
  image,
  objectPosition = 'center',
  minHeight,
  labelSize = 'clamp(24px, 2.4vw, 32px)',
  note,
  blurb,
  cta,
  ctaBelow = false,
  onCta,
  alt,
  scrim = 'normal',
  glyph,
  colours,
}: {
  to: string;
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
  /** Makes the chip its OWN action rather than part of the tile's link.
   *
   * The range row uses it to put the product straight in the cart: the tile
   * still navigates to the product for anyone who wants to read about it, and
   * the chip is the express path for anyone who has already decided. Two
   * destinations on one card, which is why the chip has to swallow the click
   * before the surrounding Link sees it.
   *
   * A span rather than a button, because a <button> inside an <a> is invalid
   * HTML — nested interactive content. It carries the button role and answers
   * Enter and Space itself, so a keyboard gets both actions the pointer does. */
  onCta?: () => void;
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
  const { hover, bind } = useHover();
  const isMobile = useIsMobile();

  return (
    <Link
      {...bind}
      to={to}
      style={{
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        minHeight,
        textDecoration: 'none',
        // No radius: these grids are edge to edge, and a rounded corner would put
        // slivers of section background into the joins where the tiles meet.
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
            transform: hover ? 'scale(1.05)' : 'scale(1)',
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
            border: `1px solid ${hover ? tokens.goldLine : tokens.onDarkLine}`,
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
                transform: hover ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.7s ease',
              }}
            >
              <ProductGlyph type={glyph} size={140} opacity={hover ? 0.6 : 0.42} />
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
                ? 'linear-gradient(180deg, rgba(28,24,16,0) 0%, rgba(28,24,16,0.42) 38%, rgba(28,24,16,0.80) 66%, rgba(28,24,16,0.95) 100%)'
                : 'linear-gradient(180deg, rgba(28,24,16,0) 0%, rgba(28,24,16,0.30) 48%, rgba(28,24,16,0.92) 100%)',
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
          background: 'rgba(28,24,16,0.66)',
          opacity: hover ? 1 : 0,
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
          left: isMobile ? 22 : 32,
          right: isMobile ? 22 : 32,
          bottom: isMobile ? 22 : 28,
          display: 'flex',
          ...(ctaBelow
            ? { flexDirection: 'column' as const, alignItems: 'flex-start', gap: 14 }
            : { alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }),
          // The row lifts with the hover rather than staying put, so the whole
          // tile reads as one object responding to the pointer.
          transform: hover ? 'translateY(-4px)' : 'translateY(0)',
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
            color: tokens.warmWhite,
            // Not decoration — it is what guarantees the label reads on the light
            // photographs without deepening the gradient over the dark ones.
            // Mixed from ink, so it stays warm rather than greying the picture.
            textShadow: image ? '0 1px 12px rgba(28,24,16,0.55)' : undefined,
          }}
        >
          {label}
        </div>
        {blurb && (
          <div
            style={{
              fontFamily: tokens.body,
              fontSize: 13,
              lineHeight: 1.6,
              color: 'rgba(245,242,237,0.82)',
              marginTop: 8,
              maxWidth: 280,
              textShadow: image ? '0 1px 10px rgba(28,24,16,0.5)' : undefined,
            }}
          >
            {blurb}
          </div>
        )}
        {note && (
          <div
            style={{
              fontFamily: tokens.body,
              fontSize: 10.5,
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: tokens.gold,
              marginTop: 10,
              // The label and the blurb both carry one and the price did not,
              // which is backwards: gold on a sunlit windowsill is far closer to
              // its background than warm white is, so "FROM $220" was the one
              // line on the tile you could not read. Deeper than theirs for the
              // same reason.
              textShadow: image ? '0 1px 10px rgba(28,24,16,0.75)' : undefined,
            }}
          >
            {note}
          </div>
        )}
        {colours && <TileSwatches colours={colours} />}
        </div>

        {cta && (
          <span
            {...(onCta
              ? {
                  role: 'button',
                  tabIndex: 0,
                  onClick: (e: React.MouseEvent) => {
                    // Both, and both matter: preventDefault stops the Link
                    // navigating, stopPropagation stops the tile's own handlers
                    // treating this as a click on the card.
                    e.preventDefault();
                    e.stopPropagation();
                    onCta();
                  },
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    e.stopPropagation();
                    onCta();
                  },
                }
              : null)}
            style={{
              flexShrink: 0,
              display: 'inline-block',
              padding: isMobile ? '10px 18px' : '12px 22px',
              fontFamily: tokens.body,
              fontSize: 10.5,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: tokens.ink,
              background: hover ? tokens.goldLight : tokens.gold,
              whiteSpace: 'nowrap',
              // Pops forward on hover. transformOrigin is the bottom-right corner
              // it is pinned to, so it grows inward rather than pushing itself
              // past the edge of the tile.
              transform: hover ? 'scale(1.08)' : 'scale(1)',
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
    </Link>
  );
}

/** "Shop Now →" / "Explore Curtains →". A link, not a button: these sit inside
 * or beneath a card that is itself clickable, and a second filled button would
 * make the card look like it had two actions. */
export function ArrowLink({ label, hovered }: { label: string; hovered: boolean }) {
  return (
    <span
      style={{
        fontFamily: tokens.body,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: hovered ? tokens.gold : tokens.ink,
        borderBottom: `1px solid ${hovered ? tokens.gold : tokens.line}`,
        paddingBottom: 3,
        whiteSpace: 'nowrap',
        transition: motion.link,
      }}
    >
      {label} →
    </span>
  );
}
