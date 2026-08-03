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
          height: isMobile ? 360 : 500,
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
            background: 'linear-gradient(180deg, rgba(28,24,16,0.3) 0%, rgba(28,24,16,0.55) 100%)',
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
              fontSize: 12,
              fontWeight: 500,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              margin: 0,
            }}
          >
            The Collection
          </p>
          <h2
            style={{
              fontFamily: tokens.display,
              fontSize: isMobile ? 40 : 60,
              fontWeight: 300,
              color: tokens.warmWhite,
              lineHeight: 1.05,
              margin: 0,
              marginTop: 20,
            }}
          >
            Four ranges. One perfect fit.
          </h2>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 17,
              color: 'rgba(245,242,237,0.7)',
              margin: 0,
              marginTop: 20,
              maxWidth: 500,
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
          padding: isMobile ? '80px 24px 100px' : '120px 80px 140px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: isMobile ? 28 : 28,
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
                    border: `1px solid ${hovered ? 'rgba(200,151,58,0.3)' : 'rgba(28,24,16,0.06)'}`,
                    transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
                    boxShadow: hovered
                      ? '0 24px 56px rgba(28,24,16,0.2)'
                      : '0 4px 24px rgba(28,24,16,0.06)',
                    transition: 'all 0.4s ease',
                  }}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3 / 4' }}>
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
                  </div>

                  <div
                    style={{
                      padding: '28px 24px 32px',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 11,
                        color: tokens.gold,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        fontWeight: 500,
                        marginBottom: 10,
                      }}
                    >
                      {range.range}
                    </div>
                    <div
                      style={{
                        fontFamily: tokens.display,
                        fontSize: 26,
                        fontWeight: 400,
                        color: tokens.ink,
                        lineHeight: 1.15,
                      }}
                    >
                      {range.name}
                    </div>
                    <div
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: 'rgba(28,24,16,0.55)',
                        fontStyle: 'italic',
                        marginTop: 12,
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
                        marginTop: 24,
                        paddingTop: 20,
                        borderTop: `1px solid rgba(28,24,16,0.08)`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: tokens.display,
                          fontSize: 20,
                          color: tokens.ink,
                        }}
                      >
                        {range.price}
                      </span>
                      <span
                        style={{
                          fontFamily: tokens.body,
                          fontSize: 12,
                          color: tokens.gold,
                          letterSpacing: '0.1em',
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

          <div style={{ marginTop: 72, textAlign: 'center' }}>
            <Link
              to="/products"
              onMouseEnter={() => setLinkHover(true)}
              onMouseLeave={() => setLinkHover(false)}
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                padding: '18px 48px',
                borderRadius: 8,
                border: `1px solid ${linkHover ? tokens.gold : 'rgba(28,24,16,0.12)'}`,
                fontFamily: tokens.body,
                fontSize: 13,
                fontWeight: 500,
                color: linkHover ? tokens.gold : tokens.ink,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                transition: 'all 0.3s ease',
                background: linkHover ? 'rgba(200,151,58,0.06)' : 'transparent',
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
