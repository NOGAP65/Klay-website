import { useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const REVIEWS = [
  {
    text: "The visualiser is incredible. I spent an hour trying different colours before I ordered. Ended up with exactly what I pictured.",
    name: 'James T.',
    location: 'South Yarra',
  },
  {
    text: "Finally a blind company that comes to you. The technician was on time, knew exactly what he was doing, and the blind fits perfectly.",
    name: 'Sarah M.',
    location: 'Brighton',
  },
  {
    text: "Three windows, all measured and installed in one visit. The quality is exceptional — worth every cent.",
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
        background: tokens.parchment,
        padding: isMobile ? '80px 24px' : '100px 80px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: isMobile ? 48 : 56,
            gap: 24,
          }}
        >
          <div>
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
              Customer Reviews
            </p>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 32 : 40,
                fontWeight: 300,
                color: tokens.ink,
                lineHeight: 1.15,
                margin: 0,
                marginTop: 12,
              }}
            >
              Loved across Victoria.
            </h2>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <div
                style={{
                  fontFamily: tokens.display,
                  fontSize: 36,
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
                  fontSize: 11,
                  color: 'rgba(28,24,16,0.45)',
                  marginTop: 4,
                }}
              >
                Homes
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: tokens.display,
                  fontSize: 36,
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
                  fontSize: 11,
                  color: 'rgba(28,24,16,0.45)',
                  marginTop: 4,
                }}
              >
                Rating
              </div>
            </div>
          </div>
        </div>

        {/* Review cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 24,
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
                  padding: '32px 28px',
                  borderRadius: 12,
                  boxShadow: hovered
                    ? '0 12px 32px rgba(28,24,16,0.1)'
                    : '0 2px 12px rgba(28,24,16,0.04)',
                  transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Stars */}
                <div
                  style={{
                    color: tokens.gold,
                    fontSize: 14,
                    letterSpacing: '0.05em',
                    marginBottom: 16,
                  }}
                >
                  ★★★★★
                </div>

                {/* Quote */}
                <p
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 15,
                    color: 'rgba(28,24,16,0.65)',
                    lineHeight: 1.7,
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  "{review.text}"
                </p>

                {/* Author */}
                <div
                  style={{
                    marginTop: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: tokens.parchment,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: tokens.display,
                      fontSize: 14,
                      color: tokens.gold,
                    }}
                  >
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 13,
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
                        fontSize: 11,
                        color: 'rgba(28,24,16,0.4)',
                        margin: 0,
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
