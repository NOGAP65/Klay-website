import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { RANGES } from '../data/products';

export function ShopSection() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [linkHover, setLinkHover] = useState(false);

  return (
    <section id="collection">
      {/* Hero header with background image */}
      <div
        style={{
          position: 'relative',
          height: isMobile ? 320 : 440,
          backgroundImage: "url('/images/lifestyle/room-kitchen.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Dark overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(28,24,16,0.35) 0%, rgba(28,24,16,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Header content */}
        <div
          style={{
            position: 'relative',
            textAlign: 'center',
            padding: '0 24px',
          }}
        >
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 500,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              margin: 0,
            }}
          >
            The Collection
          </p>
          <h2
            style={{
              fontFamily: tokens.display,
              fontSize: isMobile ? 42 : 64,
              fontWeight: 300,
              color: tokens.warmWhite,
              lineHeight: 1.05,
              margin: 0,
              marginTop: 16,
            }}
          >
            Four ranges. One perfect fit.
          </h2>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 16,
              color: 'rgba(245,242,237,0.7)',
              margin: 0,
              marginTop: 16,
              maxWidth: 480,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            Made-to-measure blinds designed for Australian homes.
          </p>
        </div>
      </div>

      {/* Product cards */}
      <div
        style={{
          background: tokens.warmWhite,
          padding: isMobile ? '60px 24px 80px' : '80px 80px 100px',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: isMobile ? 20 : 24,
            }}
          >
            {RANGES.map((range, index) => {
              const hovered = hoveredIndex === index;
              return (
                <article
                  key={range.slug}
                  onClick={() => navigate(`/products/${range.productSlug}`)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(i => (i === index ? null : i))}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: 16,
                    cursor: 'pointer',
                    background: tokens.warmWhite,
                    border: `1px solid ${hovered ? 'rgba(200,151,58,0.3)' : 'rgba(28,24,16,0.08)'}`,
                    transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                    boxShadow: hovered
                      ? '0 20px 48px rgba(28,24,16,0.18)'
                      : '0 4px 20px rgba(28,24,16,0.06)',
                    transition: 'all 0.35s ease',
                  }}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 5' }}>
                    <img
                      src={range.image}
                      alt={range.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        display: 'block',
                        transition: 'transform 0.6s ease',
                        transform: hovered ? 'scale(1.06)' : 'scale(1)',
                      }}
                    />
                    {/* Subtle gradient at bottom */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '40%',
                        background: 'linear-gradient(180deg, transparent 0%, rgba(28,24,16,0.03) 100%)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      padding: '24px 24px 28px',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 10,
                        color: tokens.gold,
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        marginBottom: 8,
                      }}
                    >
                      {range.range}
                    </div>
                    <div
                      style={{
                        fontFamily: tokens.display,
                        fontSize: 28,
                        fontWeight: 300,
                        color: tokens.ink,
                        lineHeight: 1.1,
                      }}
                    >
                      {range.name}
                    </div>
                    <div
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 13,
                        lineHeight: 1.55,
                        color: 'rgba(28,24,16,0.5)',
                        fontStyle: 'italic',
                        marginTop: 10,
                        flex: 1,
                      }}
                    >
                      {range.tagline}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 20,
                        paddingTop: 16,
                        borderTop: `1px solid rgba(28,24,16,0.08)`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: tokens.display,
                          fontSize: 18,
                          color: tokens.ink,
                        }}
                      >
                        {range.price}
                      </span>
                      <span
                        style={{
                          fontFamily: tokens.body,
                          fontSize: 11,
                          color: tokens.gold,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          fontWeight: 500,
                          transform: hovered ? 'translateX(4px)' : 'translateX(0)',
                          transition: 'transform 0.3s ease',
                        }}
                      >
                        Explore →
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div style={{ marginTop: 56, textAlign: 'center' }}>
            <Link
              to="/products"
              onMouseEnter={() => setLinkHover(true)}
              onMouseLeave={() => setLinkHover(false)}
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                padding: '16px 40px',
                borderRadius: 8,
                border: `1px solid ${linkHover ? tokens.gold : 'rgba(28,24,16,0.15)'}`,
                fontFamily: tokens.body,
                fontSize: 12,
                fontWeight: 500,
                color: linkHover ? tokens.gold : tokens.ink,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                transition: 'all 0.25s ease',
                background: linkHover ? 'rgba(200,151,58,0.08)' : 'transparent',
              }}
            >
              View All Products
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
