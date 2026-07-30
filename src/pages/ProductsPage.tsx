import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { useKlayStore } from '../store';
import { tokens, eyebrow, headline, motion, supporting } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  COLOUR_COUNT,
  HARDWARE_HEX,
  HARDWARE_OPTIONS,
  PRODUCTS,
  PRODUCT_COUNT,
  ProductBlindType,
} from '../data/products';

/** Nav is position:fixed and out of flow. Compressed it measures
 * 14 + 55 (logo) + 14 = 83px on desktop, 14 + 44 + 14 = 72px on mobile — the
 * sticky filter bar has to clear that, or it slides under the nav (which wins
 * at zIndex 9000) and gets clipped. */
const NAV_HEIGHT = 83;
const NAV_HEIGHT_MOBILE = 72;

/** How long the filtered cards take to clear out before the list is swapped
 * and the survivors fade back in. Kept in step with CARD_TRANSITION. */
const FILTER_FADE_MS = 180;
const CARD_TRANSITION = 'opacity 0.36s ease, transform 0.36s ease';

type FilterId = 'all' | ProductBlindType;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'blockout', label: 'Blockout' },
  { id: 'sunscreen', label: 'Sunscreen' },
  { id: 'dual', label: 'Dual' },
  { id: 'lightfilter', label: 'Light Filter' },
];

// ---------------------------------------------------------------------------
// Filter pill. Three states — default, hover, active — and inline styles can't
// express :hover, so hover lives in local state like the rest of this codebase.
// ---------------------------------------------------------------------------

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  // Active wins over hover: once selected, the pill shouldn't flicker to the
  // gold outline just because the cursor is still sitting on it.
  const border = active ? tokens.ink : hover ? tokens.gold : tokens.lineStrong;
  const color = active ? tokens.warmWhite : hover ? tokens.gold : tokens.ink;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: tokens.body,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        padding: '8px 20px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        background: active ? tokens.ink : 'transparent',
        border: `1px solid ${border}`,
        color,
        // Opacity rather than a blended hex, per the brief — but only when the
        // pill is idle, since 0.6 on the active pill would mute the reversal.
        opacity: active || hover ? 1 : 0.6,
        transition: `${motion.button}, opacity 0.2s ease`,
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Product card. Square corners, no shadow — the photograph is the object and
// the type below it is a caption, which is what makes a four-product grid read
// as editorial rather than as a row of widgets.
// ---------------------------------------------------------------------------

function ProductCard({
  product,
  visible,
  onOpen,
}: {
  product: (typeof PRODUCTS)[number];
  visible: boolean;
  onOpen: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <article
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer',
        background: tokens.warmWhite,
        opacity: visible ? 1 : 0,
        // The filter fade and the hover lift share one transform, so a card
        // can't be mid-fade and mid-hover with two competing values.
        transform: visible
          ? hover
            ? 'translateY(0) scale(1.02)'
            : 'translateY(0) scale(1)'
          : 'translateY(8px) scale(1)',
        transition: CARD_TRANSITION,
      }}
    >
      {/* overflow:hidden so the scale-up crops to the frame instead of
          pushing into the 2px gutter and over the neighbouring card. */}
      <div style={{ position: 'relative', aspectRatio: '4 / 5', overflow: 'hidden' }}>
        <img
          src={product.image}
          alt={`${product.name} — ${product.type}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            transform: hover ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.6s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Charcoal at 0.85, not 0.3. At 0.3 the photograph stayed fully
            // legible and the label fought it for attention; at 0.85 the image
            // recedes to a silhouette and the call to action is the only thing
            // left to read, which is what makes the hover feel like a decision
            // point rather than a tint.
            background: 'rgba(44,40,36,0.85)',
            opacity: hover ? 1 : 0,
            // Not just invisible — unhittable, so it can never intercept the
            // pointer and cancel the hover it depends on.
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease',
          }}
        >
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 10,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
            }}
          >
            Configure →
          </span>
        </div>
      </div>

      <div style={{ padding: '20px 0', background: tokens.warmWhite }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 10,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
            }}
          >
            {product.type}
          </span>
          {/* The three hardware finishes every range ships in. Hexes come from
              HARDWARE_HEX so these dots can't drift from the swatches the
              configurator and the canvas renderer draw. */}
          <span style={{ display: 'flex', gap: 5, flexShrink: 0 }} aria-hidden="true">
            {HARDWARE_OPTIONS.map(h => (
              <span
                key={h.id}
                title={h.label}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: HARDWARE_HEX[h.id],
                  border: `1px solid ${tokens.lineFaint}`,
                }}
              />
            ))}
          </span>
        </div>

        <h2 style={{ ...headline.card, color: tokens.ink, margin: '10px 0 0' }}>
          {product.name}
        </h2>
        <p style={{ ...supporting.onLight, fontSize: 12.5, lineHeight: 1.5, margin: '6px 0 0' }}>
          {product.tagline}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid rgba(28,24,16,0.08)',
          }}
        >
          {/* Full-strength ink at 14px — the price is the most-scanned element
              on the card and has to read as stated, not as a footnote. */}
          <span style={{ fontFamily: tokens.body, fontSize: 14, fontWeight: 400, color: tokens.ink }}>
            from ${product.priceFrom}
          </span>
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 10,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              whiteSpace: 'nowrap',
              transform: hover ? 'translateX(3px)' : 'translateX(0)',
              transition: 'transform 0.3s ease',
            }}
          >
            Explore →
          </span>
        </div>
      </div>
    </article>
  );
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const setScrollY = useKlayStore(s => s.setScrollY);

  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [cardsVisible, setCardsVisible] = useState(true);
  const fadeTimerRef = useRef<number | null>(null);

  // Nav's compressed/transparent state is driven by the shared store, and only
  // HomePage was feeding it — so on this page the nav never gained its dark
  // backdrop, and it inherited whatever scroll offset the homepage left
  // behind. Reset it on mount, then keep it current.
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);

  useEffect(
    () => () => {
      if (fadeTimerRef.current !== null) clearTimeout(fadeTimerRef.current);
    },
    [],
  );

  const inlinePad = isMobile ? 24 : 80;
  const navHeight = isMobile ? NAV_HEIGHT_MOBILE : NAV_HEIGHT;

  const visibleProducts =
    activeFilter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.blindType === activeFilter);

  // Two-phase, so the change reads as a reflow rather than a hard cut: the
  // outgoing cards clear out first, then the list is swapped and the
  // survivors settle back in. A CSS transition alone can't animate a grid
  // reflow, and re-keying the cards would only animate the entrance.
  const handleFilter = (id: FilterId) => {
    if (id === activeFilter) return;
    if (fadeTimerRef.current !== null) clearTimeout(fadeTimerRef.current);
    setCardsVisible(false);
    fadeTimerRef.current = window.setTimeout(() => {
      setActiveFilter(id);
      setCardsVisible(true);
      fadeTimerRef.current = null;
    }, FILTER_FADE_MS);
  };

  return (
    <>
      {/* No onLight: the hero is charcoal now, so the nav's default
          warmWhite-while-transparent is correct here. Passing it would put ink
          links on a charcoal ground. */}
      <Nav />

      <main style={{ background: tokens.warmWhite, minHeight: '100vh' }}>
        {/* Charcoal — a bold opening statement, and the contrast that makes the
            warm-white grid below it feel like the page opening up. A light
            hero running straight into a light grid gave the page no entrance
            at all. */}
        <section
          style={{
            background: tokens.charcoal,
            paddingTop: isMobile ? 128 : 180,
            paddingBottom: isMobile ? 80 : 120,
            paddingLeft: inlinePad,
            paddingRight: inlinePad,
          }}
        >
          <div style={eyebrow}>Made to Measure</div>
          <h1
            style={{
              ...headline.hero,
              color: tokens.warmWhite,
              margin: '20px 0 0',
              maxWidth: 900,
            }}
          >
            Every blind, built for your window.
          </h1>
          <p style={{ ...supporting.onDark, margin: '20px 0 0', maxWidth: 560 }}>
            {PRODUCT_COUNT} ranges. {COLOUR_COUNT} fabric colours. Every one cut
            to the millimetre for the window it hangs in, and covered for 5 years.
          </p>
        </section>

        <div
          style={{
            position: 'sticky',
            top: navHeight,
            zIndex: 10,
            // Warm white and opaque — it has to hide the cards scrolling
            // beneath it, so this one is not translucent like the nav above.
            background: tokens.warmWhite,
            borderBottom: `1px solid ${tokens.lineFaint}`,
            paddingLeft: inlinePad,
            paddingRight: inlinePad,
            paddingTop: 24,
            paddingBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <FilterPill
                key={f.id}
                label={f.label}
                active={activeFilter === f.id}
                onClick={() => handleFilter(f.id)}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 11,
              color: tokens.inkFaint,
              whiteSpace: 'nowrap',
            }}
          >
            {visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            // 24px, matching the homepage's collection grid. This was 2px —
            // deliberately, for editorial density — but 2px gutters against
            // 20px of caption padding inside each card read as a rendering
            // error rather than as a choice, and the two product grids on the
            // site disagreeing with each other undercut both.
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 20 : 24,
            paddingLeft: inlinePad,
            paddingRight: inlinePad,
            paddingTop: isMobile ? 48 : 72,
            paddingBottom: isMobile ? 96 : 140,
            // Holds the row height steady while a filter is mid-transition, so
            // the footer doesn't jump up and back down as cards swap.
            alignItems: 'start',
          }}
        >
          {visibleProducts.map(product => (
            <ProductCard
              key={product.slug}
              product={product}
              visible={cardsVisible}
              onOpen={() => navigate(`/products/${product.slug}`)}
            />
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
