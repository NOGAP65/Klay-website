import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { RANGES, SKU_COUNT } from '../data/products';

export function ShopSection() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    // Parchment: one deliberate step deeper than the visualiser's warm white
    // above it, so the two light sections separate without needing another
    // dark band. (Was #EAE5DC — a fourth off-white outside the palette.)
    // id="collection" — FinalScene's "Design Yours" and the Footer both link
    // to #collection, which previously only existed on CollectionScene, a
    // component the homepage doesn't render. Both anchors were dead.
    <section
      id="collection"
      style={{
        background: tokens.parchment,
        padding: isMobile ? '72px 24px' : '108px 80px',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            marginBottom: 16,
          }}
        >
          The Collection
        </div>
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 'clamp(38px, 11vw, 52px)' : 'clamp(42px, 5vw, 68px)',
            fontWeight: 300,
            color: tokens.ink,
            lineHeight: 0.94,
            margin: 0,
          }}
        >
          Shop the range.
        </h2>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 15,
            lineHeight: 1.6,
            color: tokens.inkSoft,
            marginTop: 18,
            maxWidth: 520,
          }}
        >
          Four made-to-measure blinds. Every one built to your window and
          installed by hand across Victoria.
        </p>

        <div
          style={{
            display: 'grid',
            // Four across on desktop, stacked on mobile. A gap rather than
            // the old 2px hairline — the cards read as objects now, not as
            // one sliced-up block.
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 20 : 24,
            marginTop: 56,
          }}
        >
          {RANGES.map((range, index) => {
            const hovered = hoveredIndex === index;
            return (
              <article
                key={range.slug}
                onClick={() => navigate(`/products/${range.slug}`)}
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
                  // Lifts on hover rather than only darkening the photo —
                  // the whole card responds, which reads as a real object.
                  transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                  boxShadow: hovered
                    ? '0 22px 44px rgba(28,24,16,0.26)'
                    : '0 8px 20px rgba(28,24,16,0.12)',
                  transition: 'transform 0.4s ease, box-shadow 0.4s ease',
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
                  {/* Keeps the photo sitting on the charcoal body instead of
                      stopping at a hard edge against it. */}
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
                  <div
                    style={{
                      fontFamily: tokens.display,
                      fontSize: 32,
                      fontWeight: 300,
                      lineHeight: 1,
                      color: tokens.onDark,
                    }}
                  >
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
                    <span style={{ fontFamily: tokens.body, fontSize: 12.5, color: tokens.onDarkMuted }}>
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

        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <Link
            to="/products"
            style={{
              textDecoration: 'none',
              display: 'inline-block',
              borderBottom: `1px solid ${tokens.goldLine}`,
              paddingBottom: 5,
              fontFamily: tokens.body,
              fontSize: 11,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
            }}
          >
            View all {SKU_COUNT} products →
          </Link>
        </div>
      </div>
    </section>
  );
}
