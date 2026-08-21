import { useState } from 'react'
import { Link } from 'react-router-dom'
import { tokens, eyebrow, headline, supporting, layout, container, motion, shadow } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'
import { PRODUCTS } from '../data/products'

/**
 * THE COLLECTION — the four products, named and priced, on the homepage.
 *
 * WHY THIS EXISTS. The homepage did not show what Klay sells. It showed three
 * category tiles — Roller Blinds, Curtains, Wardrobes — two of which said
 * COMING SOON, and it showed them at position five, after a full-height
 * configurator. Meanwhile src/data/products.ts already held four finished
 * products with names, taglines, descriptions and prices (Dusk, Veil, Duo,
 * Haze) and not one of them appeared anywhere on the page.
 *
 * So a visitor could scroll the entire homepage of an ecommerce site and never
 * learn a single product name or a single price. That is the failure this
 * section fixes, and it is why it sits directly under the hero.
 *
 * EVERY FIGURE COMES FROM PRODUCTS. The dead ShopSection.tsx hardcoded
 * "From $189" while products.ts said 220 — the exact drift that happens the
 * moment a price is typed into a component. Nothing here is a literal.
 *
 * The card is deliberately quiet: a large photograph, a serif name, one line
 * of copy, a price. No badges, no ribbons, no hover captions. On a luxury
 * page the restraint IS the styling — the photograph has to carry it.
 */
export function CollectionSection() {
  const isMobile = useIsMobile()
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <section
      id="collection"
      style={{
        background: tokens.warmWhite,
        padding: layout.sectionPad(isMobile),
      }}
    >
      <div style={container(layout.gridMax)}>
        {/* Header. Left-aligned rather than centred: it shares the hero's
            inline edge, so the eye continues down one line rather than
            resetting to the middle of the page. */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
            marginBottom: isMobile ? 40 : 64,
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <p style={eyebrow}>THE COLLECTION</p>
            {/* color is NOT optional here. headline.section carries no colour
                of its own and inherits, and what it inherits on this page is
                near-white — every other call site in the codebase adds
                tokens.ink for exactly this reason. Without it the headline
                renders invisible on the warm-white ground. */}
            <h2 style={{ ...headline.section, color: tokens.ink, marginTop: 18 }}>
              Four blinds.
              <br />
              <em style={{ fontStyle: 'italic', color: tokens.onDark }}>Every kind of light.</em>
            </h2>
            <p style={{ ...supporting.onLight, marginTop: 20, maxWidth: 440 }}>
              Made to measure, professionally installed, and priced before you commit to
              anything. Every price below includes measuring and installation.
            </p>
          </div>

          {!isMobile && (
            <Link
              to="/products"
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: tokens.ink,
                textDecoration: 'none',
                paddingBottom: 6,
                borderBottom: `1px solid ${tokens.lineStrong}`,
                transition: motion.link,
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderBottomColor = tokens.fillStrong)}
              onMouseLeave={e => (e.currentTarget.style.borderBottomColor = tokens.lineStrong)}
            >
              View all products
            </Link>
          )}
        </div>

        {/* Four across on desktop, two on tablet, one on a phone. auto-fit with
            a min() track so the single column can collapse below the minimum
            instead of overflowing a narrow viewport. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(min(260px, 100%), 1fr))`,
            gap: isMobile ? 28 : 32,
          }}
        >
          {PRODUCTS.map(p => {
            const on = hovered === p.slug
            return (
              <Link
                key={p.slug}
                to={`/products/${p.slug}`}
                onMouseEnter={() => setHovered(p.slug)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  color: 'inherit',
                  transform: on && !isMobile ? 'translateY(-6px)' : 'translateY(0)',
                  transition: motion.card,
                }}
              >
                {/* 4:5 portrait. Blinds are tall objects — a landscape crop
                    cuts the drop, which is the part being sold. */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '4 / 5',
                    overflow: 'hidden',
                    background: tokens.parchment,
                    boxShadow: on && !isMobile ? shadow.lift : shadow.rest,
                    transition: motion.card,
                  }}
                >
                  <img
                    src={p.image}
                    alt={`${p.name} — ${p.type}`}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transform: on && !isMobile ? 'scale(1.04)' : 'scale(1)',
                      transition: 'transform 0.6s ease',
                    }}
                  />

                  {/* On the photograph itself, bottom-left — the same move the
                      Ella cards make. On a white chip rather than straight onto
                      the image: these are bright interiors and 11px type laid
                      directly on one is unreadable whatever colour it is. */}
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      bottom: 14,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 999,
                      background: on ? tokens.fillStrong : 'rgba(255,255,255,0.94)',
                      color: tokens.ink,
                      fontFamily: tokens.body,
                      fontSize: 10.5,
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      transition: 'background 0.3s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    View in your space
                    <span aria-hidden="true">&rarr;</span>
                  </span>
                </div>

                <div style={{ paddingTop: 20 }}>
                  <p
                    style={{
                      ...eyebrow,
                      color: tokens.textMuted,
                      fontSize: 9.5,
                      letterSpacing: '0.24em',
                    }}
                  >
                    {p.type.toUpperCase()}
                  </p>

                  <h3
                    style={{
                      ...headline.card,
                      // See the note on the section headline — headline.* has
                      // no colour and inherits white here.
                      color: tokens.ink,
                      fontSize: 'clamp(24px, 2.2vw, 30px)',
                      marginTop: 10,
                    }}
                  >
                    {p.name}
                  </h3>

                  <p
                    style={{
                      ...supporting.onLight,
                      fontSize: 14,
                      lineHeight: 1.6,
                      marginTop: 8,
                    }}
                  >
                    {p.tagline}
                  </p>

                  {/* The price, on its own rule. This is the line the old
                      homepage never had anywhere on it. */}
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 14,
                      borderTop: `1px solid ${tokens.lineFaint}`,
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: tokens.display,
                        fontSize: 22,
                        fontWeight: 300,
                        color: tokens.ink,
                      }}
                    >
                      ${p.priceFrom}
                      <span
                        style={{
                          fontFamily: tokens.body,
                          fontSize: 11,
                          color: tokens.textMuted,
                          marginLeft: 7,
                          letterSpacing: '0.04em',
                        }}
                      >
                        installed
                      </span>
                    </span>

                    <span
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: on ? tokens.fillStrong : tokens.textMuted,
                        transition: motion.link,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Configure
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {isMobile && (
          <div style={{ marginTop: 36, textAlign: 'center' }}>
            <Link
              to="/products"
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: tokens.ink,
                textDecoration: 'none',
                paddingBottom: 6,
                borderBottom: `1px solid ${tokens.lineStrong}`,
              }}
            >
              View all products
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default CollectionSection
