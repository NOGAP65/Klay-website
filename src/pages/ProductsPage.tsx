import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { HARDWARE_HEX, HARDWARE_OPTIONS, PRODUCTS, ProductBlindType } from '../data/products';

/** Nav is position:fixed and out of flow. Compressed it measures
 * 14 + 64 (logo) + 14 = 92px on desktop, 14 + 47 + 14 = 75px on mobile — the
 * sticky filter bar has to clear that, or it slides under the nav (which wins
 * at zIndex 9000) and gets clipped. */
const NAV_HEIGHT = 92;
const NAV_HEIGHT_MOBILE = 75;

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
  const border = active ? tokens.ink : hover ? tokens.gold : 'rgba(28,24,16,0.2)';
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
        transition: 'background 0.25s ease, border-color 0.25s ease, color 0.25s ease, opacity 0.25s ease',
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
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
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
            background: 'rgba(28,24,16,0.3)',
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
              color: tokens.warmWhite,
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

        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: 34,
            fontWeight: 300,
            lineHeight: 1.0,
            color: tokens.ink,
            margin: '8px 0 0',
          }}
        >
          {product.name}
        </h2>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 12,
            lineHeight: 1.5,
            color: 'rgba(28,24,16,0.5)',
            margin: '4px 0 0',
          }}
        >
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
          <span style={{ fontFamily: tokens.body, fontSize: 13, fontWeight: 400, color: tokens.ink }}>
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
      {/* onLight: this page's background is warmWhite, the same value as the
          nav's own link colour — without it the links are invisible until the
          page is scrolled far enough for the nav to darken. */}
      <Nav onLight />

      <main style={{ background: tokens.warmWhite, minHeight: '100vh' }}>
        <section
          style={{
            paddingTop: isMobile ? 96 : 120,
            paddingBottom: isMobile ? 40 : 64,
            paddingLeft: inlinePad,
            paddingRight: inlinePad,
          }}
        >
          <div
            style={{
              fontFamily: tokens.body,
              fontSize: 10,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
            }}
          >
            Made to Measure
          </div>
          <h1
            style={{
              fontFamily: tokens.display,
              // Clamped rather than a flat 72px: at 72px this headline
              // overflows a narrow viewport, and it is the first thing on
              // the page.
              fontSize: isMobile ? 'clamp(40px, 12vw, 56px)' : 'clamp(52px, 6vw, 72px)',
              fontWeight: 300,
              lineHeight: 1.0,
              color: tokens.ink,
              margin: '18px 0 0',
              maxWidth: 900,
            }}
          >
            Every blind, built for your window.
          </h1>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 15,
              lineHeight: 1.7,
              color: 'rgba(28,24,16,0.5)',
              margin: '16px 0 0',
              maxWidth: 560,
            }}
          >
            Four ranges. Fourteen fabric colours. One size that fits exactly.
          </p>
          <div style={{ height: 1, background: 'rgba(28,24,16,0.1)', marginTop: isMobile ? 40 : 64 }} />
        </section>

        <div
          style={{
            position: 'sticky',
            top: navHeight,
            zIndex: 10,
            background: tokens.warmWhite,
            borderBottom: '1px solid rgba(28,24,16,0.08)',
            paddingLeft: inlinePad,
            paddingRight: inlinePad,
            paddingTop: 20,
            paddingBottom: 20,
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
              color: 'rgba(28,24,16,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            {visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            // 2px gutters — the photographs almost touch, which is what gives
            // the grid its editorial density.
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: 2,
            paddingLeft: inlinePad,
            paddingRight: inlinePad,
            paddingTop: isMobile ? 40 : 56,
            paddingBottom: isMobile ? 80 : 120,
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
