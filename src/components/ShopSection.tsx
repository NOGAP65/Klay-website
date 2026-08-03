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
          height: isMobile ? 400 : 560,
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
            background: 'linear-gradient(180deg, rgba(28,24,16,0.35) 0%, rgba(28,24,16,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Header content */}
        <div
          style={{
            position: 'relative',
            textAlign: 'center',
            padding: '0 24px',
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
              marginTop: 24,
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
              marginTop: 24,
              lineHeight: 1.65,
            }}
          >
            Made-to-measure blinds designed for Australian homes. Each range crafted for a different way of living with light.
          </p>
        </div>
      </div>

      {/* Product cards - 2x2 grid for larger cards */}
      <div
        style={{
          background: tokens.warmWhite,
          padding: isMobile ? '80px 24px 100px' : '120px 80px 160px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? 32 : 40,
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
                    borderRadius: 20,
                    cursor: 'pointer',
                    background: tokens.warmWhite,
                    border: `1px solid ${hovered ? 'rgba(200,151,58,0.25)' : 'rgba(28,24,16,0.06)'}`,
                    transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
                    boxShadow: hovered
                      ? '0 32px 64px rgba(28,24,16,0.18)'
                      : '0 8px 32px rgba(28,24,16,0.06)',
                    transition: 'all 0.4s ease',
                  }}
                >
                  {/* Image - larger aspect ratio */}
                  <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 3' }}>
                    <img
                      src={range.image}
                      alt={range.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        display: 'block',
                        transition: 'transform 0.7s ease',
                        transform: hovered ? 'scale(1.05)' : 'scale(1)',
                      }}
                    />
                    {/* Subtle gradient overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: 'linear-gradient(180deg, transparent 0%, rgba(28,24,16,0.04) 100%)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>

                  {/* Text content */}
                  <div
                    style={{
                      padding: '36px 32px 40px',
                      display: 'flex',
                      flexDirection: 'column',
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
                      }}
                    >
                      {range.range}
                    </div>
                    <h3
                      style={{
                        fontFamily: tokens.display,
                        fontSize: 32,
                        fontWeight: 300,
                        color: tokens.ink,
                        lineHeight: 1.15,
                        margin: 0,
                        marginTop: 12,
                      }}
                    >
                      {range.name}
                    </h3>
                    <p
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 15,
                        lineHeight: 1.7,
                        color: 'rgba(28,24,16,0.55)',
                        fontStyle: 'italic',
                        margin: 0,
                        marginTop: 16,
                      }}
                    >
                      {range.tagline}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 28,
                        paddingTop: 24,
                        borderTop: `1px solid rgba(28,24,16,0.08)`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: tokens.display,
                          fontSize: 22,
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
                          transform: hovered ? 'translateX(6px)' : 'translateX(0)',
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

          <div style={{ marginTop: 80, textAlign: 'center' }}>
            <Link
              to="/products"
              onMouseEnter={() => setLinkHover(true)}
              onMouseLeave={() => setLinkHover(false)}
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                padding: '20px 56px',
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
