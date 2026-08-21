import { useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const STEPS = [
  {
    number: '01',
    title: 'Design Online',
    description: 'Choose your blind, fabric, and colour. See it in your room with our visualiser.',
    image: '/images/lifestyle/step-1-configure.png',
  },
  {
    number: '02',
    title: 'We Measure',
    description: 'A Klay technician visits your home. Precise measurements, no guesswork.',
    image: '/images/lifestyle/step-2-measure.png',
  },
  {
    number: '03',
    title: 'Made for You',
    description: 'Manufactured to your exact specs by Rynamic Industries in South Australia.',
    image: '/images/lifestyle/step-3-manufacture.png',
  },
  {
    number: '04',
    title: 'Installed',
    description: 'The same technician returns to install. Perfectly fitted, every time.',
    image: '/images/lifestyle/step-4-install.png',
  },
]

export function HowItWorks() {
  const isMobile = useIsMobile()
  const [ctaHover, setCtaHover] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const scrollToVisualiser = () => {
    document.getElementById('visualiser')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="process"
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
            gap: 20,
            marginBottom: isMobile ? 48 : 56,
          }}
        >
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
              How It Works
            </p>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 30 : 40,
                fontWeight: 300,
                color: tokens.ink,
                lineHeight: 1.15,
                margin: 0,
                marginTop: 10,
              }}
            >
              Four steps to perfect blinds.
            </h2>
          </div>

          <button
            onClick={scrollToVisualiser}
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            style={{
              padding: '14px 36px',
              borderRadius: 6,
              fontFamily: tokens.body,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              background: ctaHover ? tokens.fillStrongHover : tokens.fillStrong,
              color: tokens.onFillStrong,
              border: 'none',
              flexShrink: 0,
            }}
          >
            Start Designing
          </button>
        </div>

        {/* Steps grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 36 : 24,
          }}
        >
          {STEPS.map((step, index) => {
            const hovered = hoveredIndex === index
            return (
              <div
                key={step.number}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                {/* Image */}
                <div
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 14,
                    aspectRatio: '4 / 3',
                    boxShadow: hovered
                      ? '0 16px 32px rgba(28,24,16,0.12)'
                      : '0 6px 20px rgba(28,24,16,0.06)',
                    transition: 'box-shadow 0.4s ease',
                  }}
                >
                  <img
                    src={step.image}
                    alt={step.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transform: hovered ? 'scale(1.04)' : 'scale(1)',
                      transition: 'transform 0.5s ease',
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{ marginTop: 20 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: tokens.display,
                        fontSize: 28,
                        fontWeight: 200,
                        color: tokens.onDark,
                        lineHeight: 1,
                      }}
                    >
                      {step.number}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 1,
                        background: `linear-gradient(90deg, ${tokens.fillStrong}40 0%, transparent 100%)`,
                      }}
                    />
                  </div>

                  <h3
                    style={{
                      fontFamily: tokens.display,
                      fontSize: 20,
                      fontWeight: 400,
                      color: tokens.ink,
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {step.title}
                  </h3>

                  <p
                    style={{
                      fontFamily: tokens.body,
                      fontSize: 13,
                      color: 'rgba(28,24,16,0.55)',
                      lineHeight: 1.6,
                      margin: 0,
                      marginTop: 8,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
