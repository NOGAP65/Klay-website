import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tokens, eyebrow, headline, layout, motion, shadow, supporting } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { COLOUR_COUNT, PRODUCT_COUNT, RANGES, SKU_COUNT } from '../data/products';

export function ShopSection() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [linkHover, setLinkHover] = useState(false);

  return (
    // Warm white — the consideration moment. This is where desire, already
    // built by the visualiser and validated by the installs above, turns into
    // "which one". The photographs have to carry it, and they read cleanest on
    // the lightest ground the palette has.
    // id="collection" — FinalScene's CTA and the Footer both used to link to
    // #collection, which only existed on CollectionScene, a component the
    // homepage doesn't render. Both anchors were dead.
    <section
      id="collection"
      style={{
        background: tokens.warmWhite,
        padding: layout.sectionPad(isMobile),
      }}
    >
      <div style={{ maxWidth: layout.gridMax, margin: '0 auto' }}>
        <div style={{ ...eyebrow, marginBottom: 18 }}>The Collection</div>
        <h2 style={{ ...headline.section, color: tokens.ink }}>
          Four ranges. One perfect fit.
        </h2>
        <p style={{ ...supporting.onLight, marginTop: 20, maxWidth: 520 }}>
          {PRODUCT_COUNT} made-to-measure blinds, {COLOUR_COUNT} fabric colours,
          a 5 year warranty. Every one built to your window and installed by
          hand across Victoria.
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
                  // Lifts AND scales on hover rather than only darkening the
                  // photo — the whole card responds, which reads as a real
                  // object being picked up.
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
                    {/* Price at full strength, not muted. It is the single
                        most-scanned element on a product card, and at
                        onDarkMuted it was quieter than the tagline above it —
                        a confident price is a trust signal, a hidden one
                        reads as something to be negotiated. */}
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
    </section>
  );
}
