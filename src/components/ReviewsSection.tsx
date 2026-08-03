import { useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const REVIEWS = [
  {
    text: "Finally a blind company that actually comes to you. The technician was on time, knew exactly what he was doing, and the blind fits perfectly. Couldn't be happier.",
    name: 'Sarah M.',
    location: 'Brighton',
  },
  {
    text: "The visualiser is incredible. I spent an hour trying different colours in my living room before I even placed the order. Ended up with exactly what I pictured.",
    name: 'James T.',
    location: 'South Yarra',
  },
  {
    text: "Three windows, all measured and installed in one visit. The quality is exceptional — these are not cheap blinds. Worth every cent.",
    name: 'Priya K.',
    location: 'Hawthorn',
  },
]

export function ReviewsSection() {
  const isMobile = useIsMobile()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section
      id="reviews"
      style={{
        position: 'relative',
        padding: isMobile ? '100px 24px' : '160px 80px',
        overflow: 'hidden',
      }}
    >
      {/* Fabric texture background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/images/lifestyle/fabric-texture.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Warm overlay to blend with brand */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(234,229,220,0.92)',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            marginBottom: isMobile ? 64 : 80,
            gap: 32,
          }}
        >
          <div>
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
              Customer Stories
            </p>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 38 : 52,
                fontWeight: 300,
                color: tokens.ink,
                lineHeight: 1.1,
                margin: 0,
                marginTop: 24,
              }}
            >
              Loved across Victoria.
            </h2>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: isMobile ? 40 : 64,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: tokens.display,
                  fontSize: isMobile ? 40 : 56,
                  fontWeight: 300,
                  color: tokens.gold,
                  lineHeight: 1,
                }}
              >
                500+
              </div>
              <div
                style={{
                  fontFamily: tokens.body,
                  fontSize: 12,
                  color: 'rgba(28,24,16,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginTop: 10,
                }}
              >
                Happy Homes
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: tokens.display,
                  fontSize: isMobile ? 40 : 56,
                  fontWeight: 300,
                  color: tokens.gold,
                  lineHeight: 1,
                }}
              >
                4.9
              </div>
              <div
                style={{
                  fontFamily: tokens.body,
                  fontSize: 12,
                  color: 'rgba(28,24,16,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginTop: 10,
                }}
              >
                Star Rating
              </div>
            </div>
          </div>
        </div>

        {/* Review cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 32,
          }}
        >
          {REVIEWS.map((review, index) => {
            const hovered = hoveredIndex === index
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  background: tokens.warmWhite,
                  padding: isMobile ? '40px 32px' : '48px 40px',
                  borderRadius: 20,
                  boxShadow: hovered
                    ? '0 24px 56px rgba(28,24,16,0.16)'
                    : '0 8px 32px rgba(28,24,16,0.08)',
                  border: `1px solid ${hovered ? 'rgba(200,151,58,0.2)' : 'rgba(28,24,16,0.04)'}`,
                  transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                  transition: 'all 0.4s ease',
                }}
              >
                {/* Stars */}
                <div
                  style={{
                    color: tokens.gold,
                    fontSize: 18,
                    letterSpacing: '0.08em',
                    marginBottom: 28,
                  }}
                >
                  ★★★★★
                </div>

                {/* Quote */}
                <p
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 16,
                    color: 'rgba(28,24,16,0.7)',
                    lineHeight: 1.85,
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  "{review.text}"
                </p>

                {/* Author */}
                <div
                  style={{
                    marginTop: 36,
                    paddingTop: 28,
                    borderTop: '1px solid rgba(28,24,16,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${tokens.parchment} 0%, rgba(200,151,58,0.15) 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: tokens.display,
                      fontSize: 20,
                      color: tokens.gold,
                    }}
                  >
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 15,
                        fontWeight: 500,
                        color: tokens.ink,
                        margin: 0,
                      }}
                    >
                      {review.name}
                    </p>
                    <p
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 13,
                        color: 'rgba(28,24,16,0.45)',
                        margin: 0,
                        marginTop: 4,
                      }}
                    >
                      {review.location}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
