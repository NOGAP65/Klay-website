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
  isMobile,
}: {
  label: string;
  title: React.ReactNode;
  isMobile: boolean;
}) {
  return (
    <div style={{ padding: isMobile ? '52px 24px' : '76px 80px', textAlign: 'center' }}>
      <p style={{ ...eyebrow, marginBottom: 16 }}>{label}</p>
      <h2
        style={{
          fontFamily: tokens.display,
          fontSize: 'clamp(34px, 4.4vw, 56px)',
          fontWeight: 300,
          lineHeight: 1.05,
          color: tokens.ink,
          margin: 0,
        }}
      >
        {title}
      </h2>
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

export function PhotoTile({
  to,
  label,
  image,
  objectPosition = 'center',
  minHeight,
  labelSize = 'clamp(24px, 2.4vw, 32px)',
  note,
  blurb,
  hoverCta,
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
  /** The action revealed on hover — "Shop Now", "Enquire". It is what tells the
   * visitor the tile is a link at all: a photograph with a word on it is not
   * obviously clickable, and the push-in alone is too subtle to carry that.
   *
   * On a pointer device the whole tile darkens and the CTA lands in the middle of
   * it. On a touch screen, where there is no hover, it sits under the label
   * instead and is always visible — a permanent full-tile scrim would mean the
   * photographs never being seen properly on a phone at all. */
  hoverCta?: string;
}) {
  const { hover, bind } = useHover();
  const isMobile = useIsMobile();
  // The scrim-and-centred-CTA treatment is a pointer behaviour. On touch it
  // degrades to a chip under the label — see the note on hoverCta.
  const overlay = !!hoverCta && !isMobile;
  const inlineChip = !!hoverCta && isMobile;

  const chipStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '12px 24px',
    fontFamily: tokens.body,
    fontSize: 10.5,
    fontWeight: 500,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: tokens.ink,
    background: tokens.gold,
    whiteSpace: 'nowrap',
  };

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
        // No radius and no gap: these grids are edge to edge, and a rounded
        // corner would put four slivers of section background into the middle
        // of the block where the tiles meet.
        background: tokens.charcoal,
      }}
    >
      {image && (
        <img
          src={image}
          alt={label}
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
          }}
        />
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
            height: '58%',
            // Deeper and taller than it was. The labels were getting lost on
            // these photographs — they are warm and bright right down to the
            // bottom edge, and warm white at weight 300 over a sunlit floorboard
            // is decoration rather than a label you notice.
            background:
              'linear-gradient(180deg, rgba(28,24,16,0) 0%, rgba(28,24,16,0.30) 48%, rgba(28,24,16,0.92) 100%)',
          }}
        />
      )}
      {/* The black-out. Above the photograph and its gradient, below the label —
          which is why the label stack comes after it in the DOM and stays crisp
          while everything behind it dims. */}
      {overlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(28,24,16,0.66)',
            opacity: hover ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
      {overlay && (
        <div
          aria-hidden={!hover}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: hover ? 1 : 0,
            transform: hover ? 'scale(1)' : 'scale(0.96)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          <span style={chipStyle}>{hoverCta}</span>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: 32,
          bottom: 28,
          right: 32,
          // The label lifts with the hover rather than staying put, so the whole
          // tile reads as one object responding to the pointer.
          transform: hover ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'transform 0.4s ease',
        }}
      >
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
            }}
          >
            {note}
          </div>
        )}
        {inlineChip && (
          <div style={{ ...chipStyle, marginTop: 16, padding: '10px 20px', fontSize: 10 }}>
            {hoverCta}
          </div>
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
