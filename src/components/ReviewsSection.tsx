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
        background: tokens.parchment,
        padding: isMobile ? '80px 24px' : '120px 80px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Eyebrow */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            fontWeight: 500,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            margin: 0,
            textAlign: 'center',
          }}
        >
          What Our Customers Say
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 38 : 56,
            fontWeight: 300,
            color: tokens.ink,
            lineHeight: 1.08,
            margin: 0,
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          Loved by homeowners across Victoria.
        </h2>

        {/* Review cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 28,
            marginTop: 64,
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
                  padding: isMobile ? '36px 28px' : '40px 36px',
                  boxShadow: hovered
                    ? '0 16px 40px rgba(28,24,16,0.12)'
                    : '0 4px 24px rgba(28,24,16,0.06)',
                  borderRadius: 16,
                  border: `1px solid ${hovered ? 'rgba(200,151,58,0.2)' : 'rgba(28,24,16,0.04)'}`,
                  transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Stars */}
                <div
                  style={{
                    color: tokens.gold,
                    fontSize: 16,
                    letterSpacing: '0.1em',
                    marginBottom: 20,
                  }}
                >
                  ★★★★★
                </div>

                {/* Review text */}
                <p
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 15,
                    color: 'rgba(28,24,16,0.65)',
                    lineHeight: 1.8,
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  "{review.text}"
                </p>

                {/* Reviewer info */}
                <div
                  style={{
                    marginTop: 28,
                    paddingTop: 20,
                    borderTop: '1px solid rgba(28,24,16,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {/* Avatar placeholder */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${tokens.parchment} 0%, rgba(200,151,58,0.15) 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: tokens.display,
                      fontSize: 18,
                      color: tokens.gold,
                      fontWeight: 400,
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
                        color: 'rgba(28,24,16,0.45)',
                        margin: 0,
                        marginTop: 2,
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
