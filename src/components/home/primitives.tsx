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

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { tokens, eyebrow, headline, layout, motion } from '../../theme';

/** Leading inset for a full-bleed horizontal rail, so its first item lines up
 * with the contained headline above it: the container inset while the viewport
 * is narrower than gridMax, and the inset plus the centring margin once it is
 * wider. Used as BOTH padding-left and scroll-padding-left — see the note in
 * CategoryStrip for what a mismatch between the two does. */
export const railPadding = (isMobile: boolean) =>
  `max(${layout.inlinePad(isMobile)}px, calc((100vw - ${layout.gridMax}px) / 2 + ${layout.inlinePad(isMobile)}px))`;

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

/** The page's primary CTA — one label and one destination, used by the hero,
 * the visualiser and the closing CTA. Three different labels for the same
 * intent (Design Yours / Add to Cart / Start Designing) read as three different
 * offers; "Buy Now" is the page's actual job and it should be answered without
 * deciding which button means it.
 *
 * It goes to the shop rather than to the configurator, which is the call made
 * when this CTA was introduced: buying starts with seeing what is for sale and
 * what it costs. /products resolves it — see ProductsPage. The one exception is
 * the visualiser's own Buy Now, which has a configuration in hand and so buys
 * THAT, straight into the cart. */
export const BUY_NOW_LABEL = 'Buy Now';
export const BUY_NOW_TO = '/products';

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
}: {
  to: string;
  children: React.ReactNode;
  onDark?: boolean;
}) {
  const { hover, bind } = useHover();
  const rest = onDark ? tokens.onDarkMuted : tokens.inkSoft;
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
// Horizontal rails.
//
// Both the category strip and the range carousel run to the viewport edge and
// scroll sideways. Neither can rely on a peeking tile to advertise that: how
// much of the next one shows is a function of viewport width, and at some
// widths the last visible tile lands flush against the edge and the row reads
// as complete. So both get explicit arrows — and both hide them when there is
// nothing to scroll, which is the case for three range cards on a wide desktop.
// ---------------------------------------------------------------------------

export function useRail(gap: number) {
  const railRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      if (rail) setOverflows(rail.scrollWidth > rail.clientWidth + 1);
    };
    measure();
    // The rails contain photographs, so the scrollWidth on the first paint can
    // predate layout settling; a ResizeObserver catches that as well as the
    // viewport changing.
    const observer = new ResizeObserver(measure);
    if (railRef.current) observer.observe(railRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  /** One tile plus its gap, so a click always lands the next tile on the same
   * left edge rather than drifting by a fraction of a tile each time. */
  const nudge = (direction: 1 | -1) => () => {
    const rail = railRef.current;
    if (!rail) return;
    const tile = rail.firstElementChild as HTMLElement | null;
    const step = tile ? tile.offsetWidth + gap : rail.clientWidth * 0.8;
    rail.scrollBy({ left: step * direction, behavior: 'smooth' });
  };

  return { railRef, overflows, nudge };
}

export function RailArrow({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  const { hover, bind } = useHover();
  return (
    <button
      {...bind}
      aria-label={dir === 'prev' ? 'Scroll left' : 'Scroll right'}
      onClick={onClick}
      style={{
        width: 42,
        height: 42,
        borderRadius: '50%',
        border: `1px solid ${hover ? tokens.gold : tokens.line}`,
        background: hover ? tokens.gold : 'transparent',
        color: tokens.ink,
        fontFamily: tokens.body,
        fontSize: 15,
        lineHeight: 1,
        cursor: 'pointer',
        transition: motion.button,
      }}
    >
      {dir === 'prev' ? '←' : '→'}
    </button>
  );
}

export function RailArrows({ nudge }: { nudge: (d: 1 | -1) => () => void }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexShrink: 0, paddingBottom: 6 }}>
      <RailArrow dir="prev" onClick={nudge(-1)} />
      <RailArrow dir="next" onClick={nudge(1)} />
    </div>
  );
}
