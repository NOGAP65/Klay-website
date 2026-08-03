import { useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const PLACEHOLDERS = [
  { id: 1, aspectRatio: '9 / 16' },
  { id: 2, aspectRatio: '9 / 16' },
  { id: 3, aspectRatio: '9 / 16' },
  { id: 4, aspectRatio: '9 / 16' },
  { id: 5, aspectRatio: '9 / 16' },
  { id: 6, aspectRatio: '9 / 16' },
]

export function SocialMedia() {
  const isMobile = useIsMobile()
  const [ctaHover, setCtaHover] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section
      style={{
        background: tokens.charcoal,
        padding: isMobile ? '80px 24px' : '100px 80px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 56 }}>
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
            Follow Along
          </p>
          <h2
            style={{
              fontFamily: tokens.display,
              fontSize: isMobile ? 30 : 40,
              fontWeight: 300,
              color: tokens.warmWhite,
              lineHeight: 1.15,
              margin: 0,
              marginTop: 12,
            }}
          >
            @KLAYINTERIORS
          </h2>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 15,
              color: 'rgba(245,242,237,0.6)',
              margin: 0,
              marginTop: 16,
              lineHeight: 1.65,
            }}
          >
            Design inspiration, behind-the-scenes, and real customer transformations.
          </p>
        </div>

        {/* Video grid - 3x2 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? 12 : 20,
          }}
        >
          {PLACEHOLDERS.slice(0, isMobile ? 4 : 6).map((item, index) => {
            const hovered = hoveredIndex === index
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  position: 'relative',
                  aspectRatio: item.aspectRatio,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'rgba(245,242,237,0.05)',
                  border: `1px solid ${hovered ? 'rgba(200,151,58,0.3)' : 'rgba(245,242,237,0.1)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: hovered ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {/* Play button placeholder */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: hovered ? tokens.gold : 'rgba(245,242,237,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderTop: '10px solid transparent',
                        borderBottom: '10px solid transparent',
                        borderLeft: `16px solid ${hovered ? tokens.ink : tokens.warmWhite}`,
                        marginLeft: 4,
                        transition: 'border-color 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Reel label */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    fontFamily: tokens.body,
                    fontSize: 10,
                    fontWeight: 500,
                    color: tokens.warmWhite,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    opacity: 0.7,
                  }}
                >
                  Reel {item.id}
                </div>
              </div>
            )
          })}
        </div>

        {/* Instagram CTA */}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <a
            href="https://instagram.com/klayinteriors"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 40px',
              borderRadius: 6,
              border: `1px solid ${ctaHover ? tokens.gold : 'rgba(245,242,237,0.2)'}`,
              fontFamily: tokens.body,
              fontSize: 12,
              fontWeight: 500,
              color: ctaHover ? tokens.gold : tokens.warmWhite,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              transition: 'all 0.3s ease',
              background: ctaHover ? 'rgba(200,151,58,0.08)' : 'transparent',
            }}
          >
            <span>Follow on Instagram</span>
            <span style={{ fontSize: 16 }}>→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
