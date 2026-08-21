import { useState } from 'react'
import { Link } from 'react-router-dom'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

export function OurStory() {
  const isMobile = useIsMobile()
  const [ctaHover, setCtaHover] = useState(false)

  return (
    <section
      style={{
        background: tokens.warmWhite,
        padding: isMobile ? '80px 24px' : '100px 80px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 40 : 80,
            alignItems: 'center',
          }}
        >
          {/* Image */}
          <div
            style={{
              position: 'relative',
              borderRadius: 20,
              overflow: 'hidden',
              aspectRatio: isMobile ? '4 / 3' : '1 / 1',
              boxShadow: '0 24px 64px rgba(28,24,16,0.1)',
            }}
          >
            <img
              src="/images/lifestyle/room-living.png"
              alt="Klay Interiors team"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 60%, rgba(28,24,16,0.15) 100%)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Text content */}
          <div>
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 11,
                fontWeight: 500,
                color: tokens.onDark,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                margin: 0,
              }}
            >
              Our Story
            </p>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 32 : 44,
                fontWeight: 300,
                color: tokens.ink,
                lineHeight: 1.1,
                margin: 0,
                marginTop: 16,
              }}
            >
              Crafting beautiful spaces, one window at a time.
            </h2>
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 16,
                color: 'rgba(28,24,16,0.65)',
                lineHeight: 1.75,
                margin: 0,
                marginTop: 24,
              }}
            >
              Founded in Melbourne, Klay Interiors was born from a simple belief: every home deserves thoughtfully designed window furnishings. We partner with Australia's finest manufacturers to deliver custom blinds, curtains, and wardrobes that transform your space.
            </p>
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 16,
                color: 'rgba(28,24,16,0.65)',
                lineHeight: 1.75,
                margin: 0,
                marginTop: 16,
              }}
            >
              From our online design studio to your professionally installed blinds, we handle everything — so you can focus on enjoying your home.
            </p>

            <div style={{ marginTop: 36 }}>
              <Link
                to="/about"
                onMouseEnter={() => setCtaHover(true)}
                onMouseLeave={() => setCtaHover(false)}
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 40px',
                  borderRadius: 6,
                  border: `1px solid ${ctaHover ? tokens.line : 'rgba(28,24,16,0.12)'}`,
                  fontFamily: tokens.body,
                  fontSize: 12,
                  fontWeight: 500,
                  color: ctaHover ? tokens.textMuted : tokens.ink,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  transition: 'all 0.3s ease',
                  background: ctaHover ? 'rgba(200,151,58,0.06)' : 'transparent',
                }}
              >
                <span>Learn More About Us</span>
                <span>→</span>
              </Link>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: isMobile ? 32 : 48,
                marginTop: 48,
                paddingTop: 32,
                borderTop: `1px solid rgba(28,24,16,0.08)`,
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: tokens.display,
                    fontSize: isMobile ? 36 : 44,
                    fontWeight: 300,
                    color: tokens.onDark,
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  500+
                </p>
                <p
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 12,
                    color: 'rgba(28,24,16,0.5)',
                    margin: 0,
                    marginTop: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Happy Homes
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: tokens.display,
                    fontSize: isMobile ? 36 : 44,
                    fontWeight: 300,
                    color: tokens.onDark,
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  5.0
                </p>
                <p
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 12,
                    color: 'rgba(28,24,16,0.5)',
                    margin: 0,
                    marginTop: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Google Rating
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: tokens.display,
                    fontSize: isMobile ? 36 : 44,
                    fontWeight: 300,
                    color: tokens.onDark,
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  VIC
                </p>
                <p
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 12,
                    color: 'rgba(28,24,16,0.5)',
                    margin: 0,
                    marginTop: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Service Area
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
