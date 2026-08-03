import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { PRODUCTS, HARDWARE_HEX, HARDWARE_OPTIONS } from '../data/products';

const FEATURES = [
  { label: 'Australian Made', icon: '🇦🇺' },
  { label: '5 Year Warranty', icon: '✓' },
  { label: 'Free Installation', icon: '🛠' },
  { label: '14 Colours', icon: '🎨' },
];

const FABRIC_TYPES = [
  { id: 'all', label: 'All Fabrics' },
  { id: 'blockout', label: 'Blockout' },
  { id: 'sunscreen', label: 'Sunscreen' },
  { id: 'dual', label: 'Dual' },
  { id: 'lightfilter', label: 'Light Filter' },
];

function ProductCard({
  product,
  onOpen,
}: {
  product: (typeof PRODUCTS)[number];
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
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${hover ? 'rgba(200,151,58,0.2)' : tokens.lineFaint}`,
        boxShadow: hover
          ? '0 16px 40px rgba(28,24,16,0.12)'
          : '0 2px 12px rgba(28,24,16,0.04)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden' }}>
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
            transition: 'transform 0.5s ease',
          }}
        />
      </div>

      <div style={{ padding: '20px 16px 24px' }}>
        <span
          style={{
            fontFamily: tokens.body,
            fontSize: 10,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 500,
          }}
        >
          {product.type}
        </span>

        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: 24,
            fontWeight: 300,
            color: tokens.ink,
            margin: 0,
            marginTop: 8,
            lineHeight: 1.2,
          }}
        >
          {product.name}
        </h3>

        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 13,
            color: 'rgba(28,24,16,0.5)',
            fontStyle: 'italic',
            lineHeight: 1.5,
            margin: 0,
            marginTop: 6,
          }}
        >
          {product.tagline}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${tokens.lineFaint}`,
          }}
        >
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 15,
              fontWeight: 500,
              color: tokens.ink,
            }}
          >
            from ${product.priceFrom}
          </span>
          <span style={{ display: 'flex', gap: 5 }}>
            {HARDWARE_OPTIONS.map(h => (
              <span
                key={h.id}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: HARDWARE_HEX[h.id],
                  border: `1px solid ${tokens.lineFaint}`,
                }}
              />
            ))}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function RollerBlindsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const setScrollY = useKlayStore(s => s.setScrollY);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);

  const visibleProducts =
    activeFilter === 'all'
      ? PRODUCTS
      : PRODUCTS.filter(p => p.blindType === activeFilter);

  return (
    <>
      <Nav />

      <main style={{ background: tokens.warmWhite, minHeight: '100vh' }}>
        {/* Compact header */}
        <section
          style={{
            background: tokens.charcoal,
            paddingTop: isMobile ? 100 : 120,
            paddingBottom: isMobile ? 40 : 56,
            paddingLeft: isMobile ? 24 : 80,
            paddingRight: isMobile ? 24 : 80,
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Breadcrumb */}
            <nav
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                color: 'rgba(245,242,237,0.5)',
                marginBottom: 20,
              }}
            >
              <Link to="/" style={{ color: 'rgba(245,242,237,0.5)', textDecoration: 'none' }}>
                Home
              </Link>
              <span style={{ margin: '0 8px' }}>/</span>
              <Link to="/blinds" style={{ color: 'rgba(245,242,237,0.5)', textDecoration: 'none' }}>
                Blinds
              </Link>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ color: tokens.warmWhite }}>Roller Blinds</span>
            </nav>

            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'flex-end',
                gap: 24,
              }}
            >
              <div>
                <h1
                  style={{
                    fontFamily: tokens.display,
                    fontSize: isMobile ? 36 : 48,
                    fontWeight: 300,
                    color: tokens.warmWhite,
                    lineHeight: 1.1,
                    margin: 0,
                  }}
                >
                  Roller Blinds
                </h1>
                <p
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 15,
                    color: 'rgba(245,242,237,0.6)',
                    lineHeight: 1.6,
                    margin: 0,
                    marginTop: 12,
                    maxWidth: 500,
                  }}
                >
                  Clean lines, simple elegance. Made to measure and professionally installed.
                </p>
              </div>

              {/* Trust badges inline */}
              <div
                style={{
                  display: 'flex',
                  gap: isMobile ? 16 : 24,
                  flexWrap: 'wrap',
                }}
              >
                {FEATURES.map((f) => (
                  <div
                    key={f.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: tokens.body,
                      fontSize: 12,
                      color: 'rgba(245,242,237,0.6)',
                    }}
                  >
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <section
          style={{
            background: tokens.warmWhite,
            borderBottom: `1px solid ${tokens.lineFaint}`,
            position: 'sticky',
            top: 80,
            zIndex: 100,
            padding: isMobile ? '16px 24px' : '20px 80px',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FABRIC_TYPES.map((type) => {
                const isActive = activeFilter === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveFilter(type.id)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 6,
                      fontFamily: tokens.body,
                      fontSize: 12,
                      fontWeight: isActive ? 500 : 400,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: isActive ? tokens.ink : 'transparent',
                      color: isActive ? tokens.warmWhite : tokens.ink,
                      border: `1px solid ${isActive ? tokens.ink : tokens.line}`,
                    }}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
            <span
              style={{
                fontFamily: tokens.body,
                fontSize: 13,
                color: tokens.inkFaint,
              }}
            >
              {visibleProducts.length} products
            </span>
          </div>
        </section>

        {/* Product grid */}
        <section
          style={{
            background: tokens.warmWhite,
            padding: isMobile ? '40px 24px 80px' : '56px 80px 120px',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: isMobile ? 16 : 24,
              }}
            >
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  onOpen={() => navigate(`/products/${product.slug}`)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Info section */}
        <section
          style={{
            background: tokens.parchment,
            padding: isMobile ? '64px 24px' : '80px 80px',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 40,
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: tokens.display,
                  fontSize: 24,
                  fontWeight: 300,
                  color: tokens.ink,
                  margin: 0,
                }}
              >
                What are Roller Blinds?
              </h3>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 14,
                  color: 'rgba(28,24,16,0.6)',
                  lineHeight: 1.7,
                  margin: 0,
                  marginTop: 16,
                }}
              >
                A single panel of fabric that rolls up neatly when you need light, and drops down for privacy or darkness. The modern classic for any room.
              </p>
            </div>
            <div>
              <h3
                style={{
                  fontFamily: tokens.display,
                  fontSize: 24,
                  fontWeight: 300,
                  color: tokens.ink,
                  margin: 0,
                }}
              >
                How It Works
              </h3>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 14,
                  color: 'rgba(28,24,16,0.6)',
                  lineHeight: 1.7,
                  margin: 0,
                  marginTop: 16,
                }}
              >
                Configure online, we measure at your home, manufactured in SA, then installed by the same technician. All included in the price.
              </p>
            </div>
            <div>
              <h3
                style={{
                  fontFamily: tokens.display,
                  fontSize: 24,
                  fontWeight: 300,
                  color: tokens.ink,
                  margin: 0,
                }}
              >
                Need Help?
              </h3>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 14,
                  color: 'rgba(28,24,16,0.6)',
                  lineHeight: 1.7,
                  margin: 0,
                  marginTop: 16,
                }}
              >
                Try our visualiser to see blinds in your room, or call us on 1300 00 KLAY. We're here to help.
              </p>
              <Link
                to="/visualiser"
                style={{
                  display: 'inline-block',
                  marginTop: 16,
                  fontFamily: tokens.body,
                  fontSize: 13,
                  color: tokens.gold,
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Try the Visualiser →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
