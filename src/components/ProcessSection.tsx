import { useState } from 'react'
import { tokens, motion } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const STEPS = [
  {
    number: '1',
    title: 'Configure',
    description:
      'Choose your blind type, fabric colour and hardware finish. See it rendered live in your room before you commit to anything.',
  },
  {
    number: '2',
    title: 'We Measure',
    description:
      'A Klay technician visits your home within 7–10 days. They take precise measurements — down to the millimetre.',
  },
  {
    number: '3',
    title: 'Made for You',
    description:
      'Your blind is manufactured to your exact measurements by Rynamic Industries in South Australia. No stock. No compromise.',
  },
  {
    number: '4',
    title: 'Installed',
    description:
      "The same technician returns to install. Perfectly fitted, every time. We don't leave until it's right.",
  },
]

export function ProcessSection() {
  const isMobile = useIsMobile()
  const [ctaHover, setCtaHover] = useState(false)

  const scrollToVisualiser = () => {
    document.getElementById('visualiser')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="process"
      style={{
        background: tokens.warmWhite,
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
          }}
        >
          The Process
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 36 : 56,
            fontWeight: 300,
            color: tokens.ink,
            lineHeight: 1.1,
            margin: 0,
            marginTop: 18,
          }}
        >
          From your screen to your window in four steps.
        </h2>

        {/* Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 48 : 48,
            marginTop: 80,
          }}
        >
          {STEPS.map((step) => (
            <div key={step.number} style={{ position: 'relative' }}>
              {/* Large decorative number */}
              <span
                style={{
                  fontFamily: tokens.display,
                  fontSize: isMobile ? 72 : 96,
                  fontWeight: 300,
                  color: tokens.gold,
                  opacity: 0.3,
                  lineHeight: 1,
                  display: 'block',
                  marginBottom: -20,
                }}
              >
                {step.number}
              </span>

              {/* Step title */}
              <h3
                style={{
                  fontFamily: tokens.display,
                  fontSize: isMobile ? 28 : 32,
                  fontWeight: 300,
                  color: tokens.ink,
                  margin: 0,
                  marginTop: 8,
                }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 14,
                  color: 'rgba(28,24,16,0.6)',
                  lineHeight: 1.7,
                  margin: 0,
                  marginTop: 12,
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 64 }}>
          <button
            onClick={scrollToVisualiser}
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            style={{
              padding: '18px 48px',
              borderRadius: 2,
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: motion.button,
              background: ctaHover ? tokens.goldLight : tokens.gold,
              color: tokens.ink,
              border: `1px solid ${ctaHover ? tokens.goldLight : tokens.gold}`,
            }}
          >
            Book Your Installation
          </button>
        </div>
      </div>
    </section>
  )
}
