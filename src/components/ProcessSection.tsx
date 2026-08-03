import { useState } from 'react'
import { tokens, motion } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const STEPS = [
  {
    number: '1',
    title: 'Configure',
    image: '/images/lifestyle/step-1-configure.png',
    description:
      'Choose your blind type, fabric colour and hardware finish. See it rendered live in your room before you commit to anything.',
  },
  {
    number: '2',
    title: 'We Measure',
    image: '/images/lifestyle/step-2-measure.png',
    description:
      'A Klay technician visits your home within 7–10 days. They take precise measurements — down to the millimetre.',
  },
  {
    number: '3',
    title: 'Made for You',
    image: '/images/lifestyle/step-3-manufacture.png',
    description:
      'Your blind is manufactured to your exact measurements by Rynamic Industries in South Australia. No stock. No compromise.',
  },
  {
    number: '4',
    title: 'Installed',
    image: '/images/lifestyle/step-4-install.png',
    description:
      "The same technician returns to install. Perfectly fitted, every time. We don't leave until it's right.",
  },
]

function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        background: tokens.warmWhite,
        boxShadow: '0 2px 20px rgba(28,24,16,0.08)',
      }}
    >
      {/* Image */}
      <div style={{ overflow: 'hidden', height: 220 }}>
        <img
          src={step.image}
          alt={step.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.4s ease',
            transform: hover ? 'scale(1.03)' : 'scale(1)',
          }}
        />
      </div>

      {/* Text content */}
      <div style={{ padding: '24px 20px 28px' }}>
        {/* Step number */}
        <span
          style={{
            fontFamily: tokens.display,
            fontSize: 13,
            fontWeight: 400,
            color: tokens.gold,
            display: 'block',
            letterSpacing: '0.05em',
          }}
        >
          Step {step.number}
        </span>

        {/* Title */}
        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: 28,
            fontWeight: 300,
            color: tokens.ink,
            margin: 0,
            marginTop: 6,
            lineHeight: 1.1,
          }}
        >
          {step.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 13,
            color: 'rgba(28,24,16,0.6)',
            lineHeight: 1.7,
            margin: 0,
            marginTop: 10,
          }}
        >
          {step.description}
        </p>
      </div>
    </div>
  )
}

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
        position: 'relative',
        backgroundImage: "url('/images/lifestyle/fabric-texture.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Light overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(234,229,220,0.92)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
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
            How It Works
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
            From your screen to your window in four steps.
          </h2>

          {/* Steps */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: isMobile ? 24 : 28,
              marginTop: 56,
            }}
          >
            {STEPS.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: 56 }}>
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
              Start Designing
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
