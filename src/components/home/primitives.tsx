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
      {label && <p style={{ ...eyebrow, marginBottom: 22 }}>{label}</p>}
      <h2 style={{ ...headline.section, color: onDark ? tokens.warmWhite : tokens.ink }}>{title}</h2>
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
}: {
  to: string;
  label: string;
  image: string;
  objectPosition?: string;
  minHeight: number;
  /** The label scales with the tile. A 32px label that suits a 420px-tall
   * inspiration tile is undersized on a 660px category tile. */
  labelSize?: string;
}) {
  const { hover, bind } = useHover();
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
      {/* Two stops rather than one. Several of these photographs are pale at the
          bottom edge — a bedspread, a bare floorboard — and a single linear ramp
          strong enough to hold white type over those was dark enough to look
          like a bar across the picture on the others. This ramps late and
          finishes deep, so most of the gradient's weight is in the last 15% where
          the label actually sits. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '46%',
          background:
            'linear-gradient(180deg, rgba(28,24,16,0) 0%, rgba(28,24,16,0.28) 55%, rgba(28,24,16,0.82) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 32,
          bottom: 28,
          right: 32,
          fontFamily: tokens.display,
          fontSize: labelSize,
          fontStyle: 'italic',
          fontWeight: 300,
          lineHeight: 1.1,
          color: tokens.warmWhite,
          // Not decoration — it is what guarantees the label reads on the light
          // tiles without deepening the gradient over the dark ones. Mixed from
          // ink, so it stays warm rather than greying the photograph.
          textShadow: '0 1px 12px rgba(28,24,16,0.55)',
          // The label lifts with the hover rather than staying put, so the
          // whole tile reads as one object responding to the pointer.
          transform: hover ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'transform 0.4s ease',
        }}
      >
        {label}
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
