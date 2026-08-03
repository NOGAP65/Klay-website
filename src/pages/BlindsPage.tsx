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
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${hover ? 'rgba(200,151,58,0.2)' : tokens.lineFaint}`,
        boxShadow: hover
          ? '0 20px 48px rgba(28,24,16,0.14)'
          : '0 4px 16px rgba(28,24,16,0.05)',
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.35s ease',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden' }}>
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

      <div style={{ padding: '24px 20px 28px' }}>
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
            fontSize: 28,
            fontWeight: 300,
            color: tokens.ink,
            margin: 0,
            marginTop: 10,
            lineHeight: 1.15,
          }}
        >
          {product.name}
        </h3>

        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 14,
            color: 'rgba(28,24,16,0.5)',
            fontStyle: 'italic',
            lineHeight: 1.5,
            margin: 0,
            marginTop: 8,
          }}
        >
          {product.tagline}
        </p>

        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 13,
            color: 'rgba(28,24,16,0.55)',
            lineHeight: 1.6,
            margin: 0,
            marginTop: 12,
          }}
        >
          {product.description}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 20,
            paddingTop: 20,
            borderTop: `1px solid ${tokens.lineFaint}`,
          }}
        >
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 16,
              fontWeight: 500,
              color: tokens.ink,
            }}
          >
            from ${product.priceFrom}
          </span>
          <span style={{ display: 'flex', gap: 6 }}>
            {HARDWARE_OPTIONS.map(h => (
              <span
                key={h.id}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: HARDWARE_HEX[h.id],
                  border: `1px solid ${tokens.lineFaint}`,
                }}
              />
            ))}
          </span>
        </div>

        <div
          style={{
            marginTop: 20,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 12,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 500,
              transform: hover ? 'translateX(4px)' : 'translateX(0)',
              transition: 'transform 0.3s ease',
            }}
          >
            Configure →
          </span>
        </div>
      </div>
    </article>
  );
}

export default function BlindsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const setScrollY = useKlayStore(s => s.setScrollY);
  const [ctaHover, setCtaHover] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);

  const scrollToProducts = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Nav />

      <main style={{ background: tokens.warmWhite, minHeight: '100vh' }}>
        {/* Hero */}
        <section
          style={{
            position: 'relative',
            height: isMobile ? '60vh' : '70vh',
            minHeight: isMobile ? 400 : 500,
            maxHeight: 700,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Background image */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: "url('/images/Phoenix%20Blockout%20product%20image.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          {/* Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, rgba(28,24,16,0.8) 0%, rgba(28,24,16,0.4) 60%, rgba(28,24,16,0.2) 100%)',
            }}
          />

          {/* Content */}
          <div
            style={{
              position: 'relative',
              padding: isMobile ? '100px 24px 60px' : '120px 80px 80px',
              maxWidth: 600,
            }}
          >
            {/* Breadcrumb */}
            <nav
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                color: 'rgba(245,242,237,0.5)',
                marginBottom: 24,
              }}
            >
              <Link to="/" style={{ color: 'rgba(245,242,237,0.5)', textDecoration: 'none' }}>
                Home
              </Link>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ color: tokens.warmWhite }}>Blinds</span>
            </nav>

            <h1
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 44 : 64,
                fontWeight: 300,
                color: tokens.warmWhite,
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              Roller Blinds
            </h1>

            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 17,
                color: 'rgba(245,242,237,0.7)',
                lineHeight: 1.7,
                margin: 0,
                marginTop: 20,
                maxWidth: 440,
              }}
            >
              Clean lines, simple elegance. A single panel of fabric that rolls up neatly when you need light, and drops down for privacy. Made to measure. Professionally installed.
            </p>

            {/* Trust badges */}
            <div
              style={{
                display: 'flex',
                gap: 20,
                flexWrap: 'wrap',
                marginTop: 32,
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

            <button
              onClick={scrollToProducts}
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                marginTop: 40,
                padding: '18px 48px',
                borderRadius: 8,
                fontFamily: tokens.body,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: ctaHover ? tokens.goldLight : tokens.gold,
                color: tokens.ink,
                border: 'none',
                boxShadow: '0 8px 24px rgba(200,151,58,0.35)',
              }}
            >
              View Collection
            </button>
          </div>
        </section>

        {/* Products section */}
        <section
          id="products"
          style={{
            background: tokens.parchment,
            padding: isMobile ? '80px 24px 100px' : '100px 80px 140px',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 12,
                  fontWeight: 500,
                  color: tokens.gold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  margin: 0,
                }}
              >
                Choose Your Fabric
              </p>
              <h2
                style={{
                  fontFamily: tokens.display,
                  fontSize: isMobile ? 34 : 48,
                  fontWeight: 300,
                  color: tokens.ink,
                  lineHeight: 1.1,
                  margin: 0,
                  marginTop: 20,
                }}
              >
                Four ways to live with light.
              </h2>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 16,
                  color: 'rgba(28,24,16,0.55)',
                  margin: 0,
                  marginTop: 16,
                  maxWidth: 500,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                Each fabric type serves a different purpose. Pick the one that fits your room.
              </p>
            </div>

            {/* Product grid - 2x2 for larger cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: isMobile ? 24 : 32,
              }}
            >
              {PRODUCTS.map((product) => (
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
            background: tokens.warmWhite,
            padding: isMobile ? '64px 24px' : '100px 80px',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 48,
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: tokens.display,
                  fontSize: 26,
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
                  fontSize: 15,
                  color: 'rgba(28,24,16,0.6)',
                  lineHeight: 1.75,
                  margin: 0,
                  marginTop: 16,
                }}
              >
                The modern classic. A single panel of fabric on a spring-loaded or chain-operated roller. Clean, minimal, and effective at controlling light and privacy.
              </p>
            </div>
            <div>
              <h3
                style={{
                  fontFamily: tokens.display,
                  fontSize: 26,
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
                  fontSize: 15,
                  color: 'rgba(28,24,16,0.6)',
                  lineHeight: 1.75,
                  margin: 0,
                  marginTop: 16,
                }}
              >
                Configure online with our visualiser. A technician measures at your home. We manufacture in SA. The same technician returns to install. All included.
              </p>
            </div>
            <div>
              <h3
                style={{
                  fontFamily: tokens.display,
                  fontSize: 26,
                  fontWeight: 300,
                  color: tokens.ink,
                  margin: 0,
                }}
              >
                Need Help Choosing?
              </h3>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 15,
                  color: 'rgba(28,24,16,0.6)',
                  lineHeight: 1.75,
                  margin: 0,
                  marginTop: 16,
                }}
              >
                Try our visualiser to see blinds in your room, or call 1300 00 KLAY. We're here to help you find the right fabric.
              </p>
              <Link
                to="/visualiser"
                style={{
                  display: 'inline-block',
                  marginTop: 20,
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
