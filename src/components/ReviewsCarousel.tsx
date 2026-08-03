import { useEffect, useRef, useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const REVIEWS = [
  {
    name: 'Sarah M.',
    location: 'Toorak',
    text: 'Absolutely love my new roller blinds. The visualiser helped me choose the perfect fabric, and the installation was flawless.',
    rating: 5,
  },
  {
    name: 'James L.',
    location: 'Brighton',
    text: 'From start to finish, the Klay team were professional and attentive. The blinds look stunning and the quality is exceptional.',
    rating: 5,
  },
  {
    name: 'Emma T.',
    location: 'South Yarra',
    text: 'Best decision we made for our renovation. The made-to-measure fit is perfect and the motorised feature is a game changer.',
    rating: 5,
  },
  {
    name: 'Michael R.',
    location: 'Hawthorn',
    text: 'Exceptional service and quality. The installer took his time to ensure everything was perfect. Highly recommend.',
    rating: 5,
  },
  {
    name: 'Lisa K.',
    location: 'Malvern',
    text: 'The online design process was so easy. I could see exactly how my blinds would look before ordering. Beautiful results.',
    rating: 5,
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          style={{
            color: i < rating ? tokens.gold : 'rgba(28,24,16,0.15)',
            fontSize: 14,
          }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export function ReviewsCarousel() {
  const isMobile = useIsMobile()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  const duplicatedReviews = [...REVIEWS, ...REVIEWS, ...REVIEWS]

  useEffect(() => {
    const el = scrollRef.current
    if (!el || isPaused) return

    let animationId: number
    let start: number | null = null
    const speed = 0.15

    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const elapsed = timestamp - start

      el.scrollLeft = (elapsed * speed) % (el.scrollWidth / 3)

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [isPaused])

  return (
    <section
      id="reviews"
      style={{
        background: tokens.warmWhite,
        padding: isMobile ? '80px 0' : '100px 0',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
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
            Customer Reviews
          </p>
          <h2
            style={{
              fontFamily: tokens.display,
              fontSize: isMobile ? 30 : 40,
              fontWeight: 300,
              color: tokens.ink,
              lineHeight: 1.15,
              margin: 0,
              marginTop: 12,
            }}
          >
            Trusted by homeowners across Australia.
          </h2>
        </div>
      </div>

      {/* Scrolling carousel */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          display: 'flex',
          gap: 24,
          padding: '0 24px',
          overflowX: 'hidden',
          cursor: 'grab',
        }}
      >
        {duplicatedReviews.map((review, index) => (
          <div
            key={`${review.name}-${index}`}
            style={{
              flexShrink: 0,
              width: isMobile ? 280 : 340,
              background: tokens.parchment,
              borderRadius: 16,
              padding: isMobile ? '28px 24px' : '32px 28px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <StarRating rating={review.rating} />

            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 15,
                color: tokens.ink,
                lineHeight: 1.7,
                margin: 0,
                marginTop: 16,
                flex: 1,
              }}
            >
              "{review.text}"
            </p>

            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: `1px solid rgba(28,24,16,0.08)`,
              }}
            >
              <p
                style={{
                  fontFamily: tokens.display,
                  fontSize: 16,
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
                  fontSize: 12,
                  color: 'rgba(28,24,16,0.5)',
                  margin: 0,
                  marginTop: 2,
                }}
              >
                {review.location}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Google rating badge */}
      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            background: tokens.parchment,
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ color: '#FBBC04', fontSize: 18 }}>★</span>
            ))}
          </div>
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 14,
              color: tokens.ink,
            }}
          >
            5.0 on Google Reviews
          </span>
        </div>
      </div>
    </section>
  )
}
