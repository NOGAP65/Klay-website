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

export function ProductsBanner() {
  const isMobile = useIsMobile()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [ctaHover, setCtaHover] = useState(false)

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hero header with background image */}
      <div
        style={{
          position: 'relative',
          height: isMobile ? 360 : 480,
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
            Our Collection
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

      {/* Product cards */}
      <div
        style={{
          background: tokens.warmWhite,
          padding: isMobile ? '64px 24px 80px' : '100px 80px 120px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
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

          <div style={{ marginTop: 64, textAlign: 'center' }}>
            <Link
              to="/blinds"
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                padding: '18px 48px',
                borderRadius: 6,
                border: `1px solid ${ctaHover ? tokens.gold : 'rgba(28,24,16,0.12)'}`,
                fontFamily: tokens.body,
                fontSize: 12,
                fontWeight: 500,
                color: ctaHover ? tokens.gold : tokens.ink,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                transition: 'all 0.3s ease',
                background: ctaHover ? 'rgba(200,151,58,0.06)' : 'transparent',
              }}
            >
              View All Products
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
