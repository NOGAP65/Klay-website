import { useState } from 'react'
import { Link } from 'react-router-dom'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const PRODUCTS = [
  {
    name: 'Roller Blinds',
    tagline: 'Clean lines, timeless elegance',
    image: '/images/Phoenix%20Blockout%20product%20image.png',
    link: '/blinds/roller-blinds',
  },
  {
    name: 'Curtains',
    tagline: 'Flowing warmth & texture',
    image: '/images/lifestyle/room-living.png',
    link: '/curtains',
    comingSoon: true,
  },
  {
    name: 'Wardrobes',
    tagline: 'Custom built-in solutions',
    image: '/images/lifestyle/room-kitchen.png',
    link: '/wardrobes',
    comingSoon: true,
  },
]

/**
 * THE BANNER — a full-bleed statement band.
 *
 * Split out of ProductsBanner so it can sit BETWEEN the category cards and the
 * range. It used to open that component, which put a 480px photo-and-headline
 * band immediately under the hero: two full-width statement blocks back to
 * back, saying much the same thing, before anything had been shown. As a
 * divider it earns its place — it breaks the categories from the products and
 * gives the eye somewhere to rest between two grids.
 *
 * Its eyebrow is no longer "Our Collection": the range directly below it is
 * headed THE COLLECTION, and two adjacent sections claiming the same name read
 * as a mistake.
 */
export function CollectionBanner() {
  const isMobile = useIsMobile()

  return (
    <div
      style={{
        position: 'relative',
        height: isMobile ? 320 : 420,
        backgroundImage: "url('/images/lifestyle/room-kitchen.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(28,24,16,0.35) 0%, rgba(28,24,16,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />
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
            fontSize: 11,
            fontWeight: 500,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            margin: 0,
          }}
        >
          Designed, Measured, Installed
        </p>
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 38 : 56,
            fontWeight: 300,
            color: tokens.warmWhite,
            lineHeight: 1.05,
            margin: 0,
            marginTop: 20,
          }}
        >
          Made for Australian homes.
        </h2>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 16,
            color: 'rgba(245,242,237,0.7)',
            margin: 0,
            marginTop: 20,
            lineHeight: 1.65,
          }}
        >
          Premium window furnishings designed, measured, and installed by our expert team across Victoria.
        </p>
      </div>
    </div>
  )
}

/**
 * THE CATEGORY CARDS — what Klay makes, as three rooms.
 *
 * Now leads the page directly under the hero, so it carries its own header;
 * previously the banner above it did that job. The trailing "View All
 * Products" button is gone: the range follows immediately below the banner and
 * carries its own link, so a button here pointed past the very thing it was
 * standing in front of.
 */
export function ProductsBanner() {
  const isMobile = useIsMobile()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Product cards */}
      <div
        style={{
          background: tokens.warmWhite,
          padding: isMobile ? '64px 24px 72px' : '100px 80px 104px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* The section's own header, since it now opens the page body. */}
          <div style={{ marginBottom: isMobile ? 40 : 60, maxWidth: 620 }}>
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
              What We Make
            </p>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 38 : 56,
                fontWeight: 300,
                color: tokens.ink,
                lineHeight: 1.05,
                margin: 0,
                marginTop: 18,
              }}
            >
              Three ways to dress a window.
            </h2>
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 15,
                color: tokens.inkSoft,
                lineHeight: 1.75,
                margin: 0,
                marginTop: 18,
                maxWidth: 460,
              }}
            >
              Blinds are made and installed today. Curtains and wardrobes are on the way.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? 28 : 32,
            }}
          >
            {PRODUCTS.map((product, index) => {
              const hovered = hoveredIndex === index
              const available = !product.comingSoon
              return (
                <Link
                  key={product.name}
                  to={available ? product.link : '#'}
                  onClick={(e) => !available && e.preventDefault()}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    textDecoration: 'none',
                    display: 'block',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: tokens.warmWhite,
                    border: `1px solid ${hovered && available ? 'rgba(200,151,58,0.2)' : 'rgba(28,24,16,0.06)'}`,
                    boxShadow: hovered && available
                      ? '0 24px 48px rgba(28,24,16,0.14)'
                      : '0 4px 20px rgba(28,24,16,0.05)',
                    transform: hovered && available ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'all 0.4s ease',
                    cursor: available ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 3' }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transform: hovered && available ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.6s ease',
                        filter: available ? 'none' : 'grayscale(30%)',
                      }}
                    />
                    {product.comingSoon && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 14,
                          right: 14,
                          background: tokens.charcoal,
                          color: tokens.gold,
                          fontFamily: tokens.body,
                          fontSize: 10,
                          fontWeight: 500,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          padding: '6px 12px',
                          borderRadius: 4,
                        }}
                      >
                        Coming Soon
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '28px 24px 32px' }}>
                    <h3
                      style={{
                        fontFamily: tokens.display,
                        fontSize: 26,
                        fontWeight: 400,
                        color: tokens.ink,
                        margin: 0,
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
                        margin: 0,
                        marginTop: 8,
                      }}
                    >
                      {product.tagline}
                    </p>
                    {available && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 20,
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
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

        </div>
      </div>
    </section>
  )
}
