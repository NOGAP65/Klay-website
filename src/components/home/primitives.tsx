// ---------------------------------------------------------------------------
// Shared pieces for the homepage sections.
//
// Inline styles are the house rule, which means every hover state has to be
// tracked in React state and every button re-declares its own fill. Twelve
// sections doing that independently is how a page ends up with nine slightly
// different buttons — so the CTA and the section header live here once.
//
// The CTA rule is narrow on purpose: BRONZE ground with an INK label, or charcoal
// ground with a paper label. Nothing else fills. The one variant that does
// neither is `ghost`, which sits over hero photography and has no fill.
//
// The bronze is the logo's own colour — #A08058, the leg of the k — and the only
// chroma anywhere in the interface. This file is most of where it is spent. See
// `accent` in theme.ts for why the label is ink rather than paper, which is not a
// preference but a consequence of the bronze being a mid-tone.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tokens, eyebrow, headline, motion, space, supporting, type as typeScale } from '../../theme';
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
const ctaBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  ...typeScale.label,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  borderRadius: 2,
  height: 52,
  padding: `0 ${space.lg}px`,
  border: '1px solid transparent',
  transition: motion.button,
  // Belt and braces on the two element types: a <button> inherits a UA
  // line-height that can still push the flex box taller than `height` at some
  // zoom levels.
  boxSizing: 'border-box',
  lineHeight: 1,
};

function ctaFill(variant: CtaVariant, hover: boolean): React.CSSProperties {
  switch (variant) {
    // THE LOGO'S BRONZE, ink label. The page's primary action, and the only place
    // on the site that carries chroma at all. Lightens on hover, because with an
    // ink label that is the only safe direction — see `accentHover`.
    case 'primary':
      return {
        background: hover ? tokens.accentHover : tokens.accent,
        color: tokens.onAccent,
        // THE EDGE IS THE DEEPER BRONZE, not the fill. Matching the border to the
        // fill was right while the fill was dark enough to find on its own; the
        // bronze is a mid-tone and its hover lightens, which took the block to
        // 2.84:1 against paper. `accentEdge` holds the boundary at 6.24 in both
        // states, so the button stops depending on its fill to be findable.
        borderColor: tokens.accentEdge,
      };
    // Charcoal ground, paper text — for light sections that want a quieter
    // primary than the bronze, or a second action beside one.
    case 'onDark':
      return {
        background: hover ? tokens.ink : tokens.charcoal,
        color: tokens.onDark,
        borderColor: hover ? tokens.ink : tokens.charcoal,
      };
    // A PAPER-FILLED VARIANT WAS WRITTEN HERE AND THEN REMOVED, which is worth
    // recording because the reasoning was sound and the premise was not.
    //
    // The accent measures 2.71:1 against charcoal and 3.46 against ink, so a
    // bronze button on a solid dark section would be hard to locate — its label
    // would still be perfectly legible on the bronze, which is the failure
    // a text-contrast audit cannot see. FinalCta and the visualiser card looked
    // like the cases that needed it. (Under the royal blue this replaced the
    // same two numbers were 1.48 and 1.88, so the hazard was worse then and the
    // conclusion is unchanged.)
    //
    // Measured in the running page, neither is. FinalCta's charcoal is a
    // fallback BEHIND a photograph — it only shows while the image loads — and
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
        color: hover ? tokens.card : tokens.onDarkMuted,
        borderColor: hover ? tokens.line : tokens.onDarkEdge,
      };
  }
}

export function CtaLink({
  to,
  variant = 'primary',
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
  variant = 'primary',
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
        paddingBottom: space.xxs,
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
            marginBottom: space.md,
          }}
        >
          {label}
        </p>
      )}
      <h2
        style={{
          ...headline.section,
          color: onDark ? tokens.warmWhite : tokens.ink,
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
            marginTop: space.md,
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
        // On the scale. `compact` is the tighter band used where the row below
        // is the section's real content and the heading is only naming it.
        padding: compact
          ? isMobile
            ? `${space.lg}px ${space.md}px`
            : `${space.xl}px 80px ${space.lg}px`
          : isMobile
            ? `${space.xl}px ${space.md}px`
            : `${space.xxl}px 80px`,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          ...eyebrow,
          // On charcoal the brand gold is the legible one (5.53); goldText is
          // for light grounds only.
          ...(onDark ? { color: tokens.onDark } : null),
          marginBottom: space.md,
        }}
      >
        {label}
      </p>
      {/* Consumes headline.section rather than declaring a 56px clamp of its
          own — the third of the three sizes this role had drifted into. */}
      <h2
        style={{
          ...headline.section,
          color: onDark ? tokens.warmWhite : tokens.ink,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            ...(onDark ? supporting.onDark : supporting.onLight),
            margin: `${space.md}px auto 0`,
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
    <div style={{ display: 'flex', alignItems: 'center', gap: space.xxs, marginTop: space.sm }}>
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
            borderRadius: 2,
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
            marginLeft: space.xxs,
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
            border: `1px solid ${hover ? tokens.onDarkEdge : tokens.onDarkLine}`,
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
          left: isMobile ? space.md : space.lg,
          right: isMobile ? space.md : space.lg,
          bottom: isMobile ? space.md : space.lg,
          display: 'flex',
          ...(ctaBelow
            ? { flexDirection: 'column' as const, alignItems: 'flex-start', gap: space.md }
            : { alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md }),
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
              marginTop: space.xs,
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
              marginTop: space.sm,
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
              padding: `0 ${space.md}px`,
              borderRadius: 2,
              boxSizing: 'border-box',
              ...typeScale.label,
              lineHeight: 1,
              color: tokens.onAccent,
              background: hover ? tokens.accentHover : tokens.accent,
              // The bronze is a mid-tone: 3.45:1 against paper at rest and 2.84 once the
              // hover lightens it, so the fill alone cannot carry the block boundary. An
              // inset ring in the deeper bronze holds it at 6.24 in both states. Drawn as
              // a shadow, not a border, so it costs no layout on a fixed-height button.
              boxShadow: `inset 0 0 0 1px ${tokens.accentEdge}`,
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
        ...typeScale.label,
        // goldText: this link sits on a light card ground, where the brand gold
        // measures 2.11–2.47.
        color: hovered ? tokens.ink : tokens.ink,
        borderBottom: `1px solid ${hovered ? tokens.ink : tokens.line}`,
        paddingBottom: space.xxs,
        whiteSpace: 'nowrap',
        transition: motion.link,
      }}
    >
      {label} →
    </span>
  );
}
