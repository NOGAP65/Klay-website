import { useState, useEffect } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const REVIEWS = [
  {
    text: "Finally a blind company that actually comes to you. The technician was on time, knew exactly what he was doing, and the blind fits perfectly. Couldn't be happier.",
    name: 'Sarah M.',
    location: 'Brighton',
    rating: 5,
  },
  {
    text: "The visualiser is incredible. I spent an hour trying different colours in my living room before I even placed the order. Ended up with exactly what I pictured.",
    name: 'James T.',
    location: 'South Yarra',
    rating: 5,
  },
  {
    text: "Three windows, all measured and installed in one visit. The quality is exceptional — these are not cheap blinds. Worth every cent.",
    name: 'Priya K.',
    location: 'Hawthorn',
    rating: 5,
  },
  {
    text: "I was skeptical about ordering blinds online, but the whole process was seamless. The visualiser matched reality perfectly.",
    name: 'Michael R.',
    location: 'Toorak',
    rating: 5,
  },
]

export function ReviewsSection() {
  const isMobile = useIsMobile()
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % REVIEWS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
      id="reviews"
      style={{
        position: 'relative',
        minHeight: isMobile ? 'auto' : '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/images/lifestyle/room-living.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(28,24,16,0.85) 0%, rgba(28,24,16,0.7) 50%, rgba(28,24,16,0.85) 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          padding: isMobile ? '100px 24px' : '140px 80px',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'flex-end',
              marginBottom: isMobile ? 48 : 64,
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
                  letterSpacing: '0.25em',
                  margin: 0,
                }}
              >
                Customer Stories
              </p>
              <h2
                style={{
                  fontFamily: tokens.display,
                  fontSize: isMobile ? 40 : 56,
                  fontWeight: 300,
                  color: tokens.warmWhite,
                  lineHeight: 1.05,
                  margin: 0,
                  marginTop: 16,
                }}
              >
                Loved across Victoria.
              </h2>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: isMobile ? 32 : 56,
              }}
            >
              <div style={{ textAlign: isMobile ? 'left' : 'center' }}>
                <div
                  style={{
                    fontFamily: tokens.display,
                    fontSize: isMobile ? 36 : 48,
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
                    color: 'rgba(245,242,237,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: 8,
                  }}
                >
                  Happy Homes
                </div>
              </div>
              <div style={{ textAlign: isMobile ? 'left' : 'center' }}>
                <div
                  style={{
                    fontFamily: tokens.display,
                    fontSize: isMobile ? 36 : 48,
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
                    color: 'rgba(245,242,237,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: 8,
                  }}
                >
                  Average Rating
                </div>
              </div>
            </div>
          </div>

          {/* Review cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: 20,
            }}
          >
            {REVIEWS.map((review, index) => {
              const isActive = activeIndex === index
              const isHovered = hoveredIndex === index
              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setActiveIndex(index)}
                  style={{
                    background: isActive || isHovered
                      ? 'rgba(245,242,237,0.12)'
                      : 'rgba(245,242,237,0.05)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isActive ? 'rgba(200,151,58,0.4)' : 'rgba(245,242,237,0.1)'}`,
                    padding: isMobile ? '32px 24px' : '36px 28px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.35s ease',
                  }}
                >
                  {/* Stars */}
                  <div
                    style={{
                      color: tokens.gold,
                      fontSize: 14,
                      letterSpacing: '0.1em',
                      marginBottom: 20,
                    }}
                  >
                    {'★'.repeat(review.rating)}
                  </div>

                  {/* Quote */}
                  <p
                    style={{
                      fontFamily: tokens.body,
                      fontSize: 14,
                      color: 'rgba(245,242,237,0.85)',
                      lineHeight: 1.75,
                      fontStyle: 'italic',
                      margin: 0,
                      minHeight: isMobile ? 'auto' : 120,
                    }}
                  >
                    "{review.text}"
                  </p>

                  {/* Author */}
                  <div
                    style={{
                      marginTop: 24,
                      paddingTop: 20,
                      borderTop: '1px solid rgba(245,242,237,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, rgba(200,151,58,0.3) 0%, rgba(200,151,58,0.15) 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: tokens.display,
                        fontSize: 16,
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
                          color: tokens.warmWhite,
                          margin: 0,
                        }}
                      >
                        {review.name}
                      </p>
                      <p
                        style={{
                          fontFamily: tokens.body,
                          fontSize: 11,
                          color: 'rgba(245,242,237,0.4)',
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

          {/* Progress dots */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              marginTop: 40,
            }}
          >
            {REVIEWS.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                style={{
                  width: activeIndex === index ? 32 : 10,
                  height: 10,
                  borderRadius: 5,
                  border: 'none',
                  background: activeIndex === index
                    ? tokens.gold
                    : 'rgba(245,242,237,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
