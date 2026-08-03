import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const REVIEWS = [
  {
    text: "Finally a blind company that actually comes to you. The technician was on time, knew exactly what he was doing, and the blind fits perfectly. Couldn't be happier.",
    name: 'Sarah M., Brighton',
  },
  {
    text: "The visualiser is incredible. I spent an hour trying different colours in my living room before I even placed the order. Ended up with exactly what I pictured.",
    name: 'James T., South Yarra',
  },
  {
    text: "Three windows, all measured and installed in one visit. The quality is exceptional — these are not cheap blinds. Worth every cent.",
    name: 'Priya K., Hawthorn',
  },
]

export function ReviewsSection() {
  const isMobile = useIsMobile()

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
            fontSize: 10,
            fontWeight: 500,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
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
            fontSize: isMobile ? 36 : 52,
            fontWeight: 300,
            color: tokens.ink,
            lineHeight: 1.1,
            margin: 0,
            marginTop: 18,
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
            marginTop: 56,
          }}
        >
          {REVIEWS.map((review, index) => (
            <div
              key={index}
              style={{
                background: tokens.warmWhite,
                padding: isMobile ? '32px 24px' : '36px 32px',
                boxShadow: '0 2px 20px rgba(28,24,16,0.06)',
                borderRadius: 2,
              }}
            >
              {/* Stars */}
              <div
                style={{
                  color: tokens.gold,
                  fontSize: 15,
                  letterSpacing: '0.08em',
                  marginBottom: 18,
                }}
              >
                ★★★★★
              </div>

              {/* Review text */}
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 15,
                  color: 'rgba(28,24,16,0.7)',
                  lineHeight: 1.75,
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                "{review.text}"
              </p>

              {/* Reviewer name */}
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 11,
                  fontWeight: 500,
                  color: tokens.gold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  margin: 0,
                  marginTop: 22,
                }}
              >
                — {review.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
