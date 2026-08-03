import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { PRODUCTS, HARDWARE_HEX, HARDWARE_OPTIONS } from '../data/products';


const FEATURES = [
  {
    title: 'Australian Made',
    description: 'Manufactured by Rynamic Industries in South Australia.',
    icon: '🇦🇺',
  },
  {
    title: '5 Year Warranty',
    description: 'Full coverage on fabric, mechanisms and hardware.',
    icon: '✓',
  },
  {
    title: 'Free Installation',
    description: 'Professional fitting included across Victoria.',
    icon: '🛠',
  },
  {
    title: '14 Fabric Colours',
    description: 'From crisp whites to deep charcoals.',
    icon: '🎨',
  },
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
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${hover ? 'rgba(200,151,58,0.25)' : tokens.lineFaint}`,
        boxShadow: hover
          ? '0 24px 56px rgba(28,24,16,0.15)'
          : '0 4px 24px rgba(28,24,16,0.06)',
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.4s ease',
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
            transform: hover ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.6s ease',
          }}
        />
      </div>

      <div style={{ padding: '28px 24px 32px' }}>
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
              fontSize: 11,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 500,
            }}
          >
            {product.type}
          </span>
          <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {HARDWARE_OPTIONS.map(h => (
              <span
                key={h.id}
                title={h.label}
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

        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: 28,
            fontWeight: 300,
            color: tokens.ink,
            margin: 0,
            marginTop: 12,
            lineHeight: 1.15,
          }}
        >
          {product.name}
        </h3>

        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 14,
            color: 'rgba(28,24,16,0.55)',
            fontStyle: 'italic',
            lineHeight: 1.6,
            margin: 0,
            marginTop: 10,
          }}
        >
          {product.tagline}
        </p>

        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 13,
            color: 'rgba(28,24,16,0.6)',
            lineHeight: 1.65,
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
            gap: 12,
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid ${tokens.lineFaint}`,
          }}
        >
          <span
            style={{
              fontFamily: tokens.display,
              fontSize: 20,
              color: tokens.ink,
            }}
          >
            from ${product.priceFrom}
          </span>
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

export default function RollerBlindsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const setScrollY = useKlayStore(s => s.setScrollY);
  const [activeFilter, setActiveFilter] = useState('all');
  const [ctaHover, setCtaHover] = useState(false);

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
            minHeight: isMobile ? '70vh' : '85vh',
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
                'linear-gradient(90deg, rgba(28,24,16,0.85) 0%, rgba(28,24,16,0.5) 50%, rgba(28,24,16,0.3) 100%)',
            }}
          />

          {/* Content */}
          <div
            style={{
              position: 'relative',
              padding: isMobile ? '120px 24px 80px' : '160px 80px 120px',
              maxWidth: 700,
            }}
          >
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
              Roller Blinds
            </p>

            <h1
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 48 : 72,
                fontWeight: 300,
                color: tokens.warmWhite,
                lineHeight: 1.05,
                margin: 0,
                marginTop: 24,
              }}
            >
              Clean lines. <br />
              <span style={{ color: tokens.goldLight, fontStyle: 'italic' }}>
                Simple elegance.
              </span>
            </h1>

            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 17,
                color: 'rgba(245,242,237,0.7)',
                lineHeight: 1.75,
                margin: 0,
                marginTop: 28,
                maxWidth: 480,
              }}
            >
              The modern classic. A single panel of fabric that rolls up neatly when
              you need light, and drops down for privacy or darkness. Made to measure.
              Installed by hand.
            </p>

            <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
              <button
                onClick={scrollToProducts}
                onMouseEnter={() => setCtaHover(true)}
                onMouseLeave={() => setCtaHover(false)}
                style={{
                  padding: '18px 48px',
                  borderRadius: 8,
                  fontFamily: tokens.body,
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.15em',
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
          </div>
        </section>

        {/* Features strip */}
        <section
          style={{
            background: tokens.charcoal,
            padding: isMobile ? '48px 24px' : '56px 80px',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? 32 : 48,
            }}
          >
            {FEATURES.map((feature) => (
              <div key={feature.title} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{feature.icon}</div>
                <h4
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 13,
                    fontWeight: 500,
                    color: tokens.warmWhite,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    margin: 0,
                  }}
                >
                  {feature.title}
                </h4>
                <p
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 13,
                    color: 'rgba(245,242,237,0.5)',
                    margin: 0,
                    marginTop: 8,
                    lineHeight: 1.5,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Products section */}
        <section
          id="products"
          style={{
            background: tokens.parchment,
            padding: isMobile ? '80px 24px 100px' : '120px 80px 160px',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
                  fontSize: isMobile ? 36 : 48,
                  fontWeight: 300,
                  color: tokens.ink,
                  lineHeight: 1.1,
                  margin: 0,
                  marginTop: 20,
                }}
              >
                Four ways to live with light.
              </h2>
            </div>

            {/* Filter tabs */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 56,
              }}
            >
              {FABRIC_TYPES.map((type) => {
                const isActive = activeFilter === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveFilter(type.id)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 8,
                      fontFamily: tokens.body,
                      fontSize: 12,
                      fontWeight: isActive ? 500 : 400,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
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

            {/* Product grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: 32,
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

        {/* How it works mini section */}
        <section
          style={{
            background: tokens.warmWhite,
            padding: isMobile ? '80px 24px' : '120px 80px',
          }}
        >
          <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
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
              How It Works
            </p>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 36 : 48,
                fontWeight: 300,
                color: tokens.ink,
                lineHeight: 1.1,
                margin: 0,
                marginTop: 20,
              }}
            >
              From screen to window in four steps.
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                gap: 32,
                marginTop: 56,
              }}
            >
              {[
                { num: '01', title: 'Configure', desc: 'Choose fabric and colour' },
                { num: '02', title: 'We Measure', desc: 'Technician visits your home' },
                { num: '03', title: 'Made for You', desc: 'Cut to the millimetre' },
                { num: '04', title: 'Installed', desc: 'Fitted by the same technician' },
              ].map((step) => (
                <div key={step.num}>
                  <div
                    style={{
                      fontFamily: tokens.display,
                      fontSize: 48,
                      fontWeight: 200,
                      color: tokens.gold,
                      opacity: 0.3,
                      lineHeight: 1,
                    }}
                  >
                    {step.num}
                  </div>
                  <h4
                    style={{
                      fontFamily: tokens.display,
                      fontSize: 22,
                      fontWeight: 300,
                      color: tokens.ink,
                      margin: 0,
                      marginTop: 12,
                    }}
                  >
                    {step.title}
                  </h4>
                  <p
                    style={{
                      fontFamily: tokens.body,
                      fontSize: 14,
                      color: 'rgba(28,24,16,0.55)',
                      margin: 0,
                      marginTop: 8,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/visualiser')}
              style={{
                marginTop: 56,
                padding: '18px 48px',
                borderRadius: 8,
                fontFamily: tokens.body,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: tokens.gold,
                color: tokens.ink,
                border: 'none',
                boxShadow: '0 6px 20px rgba(200,151,58,0.3)',
              }}
            >
              Start Designing
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
