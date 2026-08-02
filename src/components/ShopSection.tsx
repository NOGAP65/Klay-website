import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tokens, headline, layout, motion, shadow } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { RANGES, SKU_COUNT } from '../data/products';

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
          height: isMobile ? 280 : 400,
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
            background: 'rgba(28,24,16,0.5)',
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
              fontSize: 10,
              fontWeight: 500,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              margin: 0,
            }}
          >
            The Collection
          </p>
          <h2
            style={{
              fontFamily: tokens.display,
              fontSize: isMobile ? 36 : 56,
              fontWeight: 300,
              color: tokens.warmWhite,
              lineHeight: 1.1,
              margin: 0,
              marginTop: 18,
            }}
          >
            Four ranges. One perfect fit.
          </h2>
        </div>
      </div>

      {/* Product cards on warm white */}
      <div
        style={{
          background: tokens.warmWhite,
          padding: layout.sectionPad(isMobile),
        }}
      >
        <div style={{ maxWidth: layout.gridMax, margin: '0 auto' }}>
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
                    borderRadius: 2,
                    cursor: 'pointer',
                    background: tokens.charcoal,
                    transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
                    boxShadow: hovered ? shadow.lift : shadow.rest,
                    transition: motion.card,
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
                        transition: 'transform 0.7s ease',
                        transform: hovered ? 'scale(1.05)' : 'scale(1)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(180deg, rgba(28,24,16,0) 55%, rgba(44,40,36,0.85) 100%)`,
                        pointerEvents: 'none',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      padding: '22px 22px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 9.5,
                        color: tokens.gold,
                        textTransform: 'uppercase',
                        letterSpacing: '0.24em',
                        marginBottom: 10,
                      }}
                    >
                      {range.range}
                    </div>
                    <div style={{ ...headline.card, color: tokens.onDark }}>
                      {range.name}
                    </div>
                    <div
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 12.5,
                        lineHeight: 1.5,
                        color: tokens.onDarkMuted,
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
                        marginTop: 22,
                        paddingTop: 16,
                        borderTop: `1px solid ${tokens.onDarkLine}`,
                      }}
                    >
                      <span style={{ fontFamily: tokens.body, fontSize: 13.5, color: tokens.onDark }}>
                        {range.price}
                      </span>
                      <span
                        style={{
                          fontFamily: tokens.body,
                          fontSize: 10.5,
                          color: tokens.gold,
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          transform: hovered ? 'translateX(3px)' : 'translateX(0)',
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

          <div style={{ marginTop: 64, textAlign: 'center' }}>
            <Link
              to="/products"
              onMouseEnter={() => setLinkHover(true)}
              onMouseLeave={() => setLinkHover(false)}
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                borderBottom: `1px solid ${linkHover ? tokens.gold : tokens.goldLine}`,
                paddingBottom: 5,
                fontFamily: tokens.body,
                fontSize: 11,
                color: linkHover ? tokens.goldLight : tokens.gold,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                transition: motion.link,
              }}
            >
              View all {SKU_COUNT} products →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
