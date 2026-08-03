import { useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const STEPS = [
  {
    number: '01',
    title: 'Configure',
    image: '/images/lifestyle/step-1-configure.png',
    description:
      'Choose your blind type, fabric colour and hardware finish. See it rendered live in your room.',
  },
  {
    number: '02',
    title: 'We Measure',
    image: '/images/lifestyle/step-2-measure.png',
    description:
      'A Klay technician visits your home within 7–10 days. Precise measurements, down to the millimetre.',
  },
  {
    number: '03',
    title: 'Made for You',
    image: '/images/lifestyle/step-3-manufacture.png',
    description:
      'Manufactured to your exact measurements by Rynamic Industries in South Australia.',
  },
  {
    number: '04',
    title: 'Installed',
    image: '/images/lifestyle/step-4-install.png',
    description:
      "The same technician returns to install. Perfectly fitted, every time.",
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
        borderRadius: 20,
        background: tokens.warmWhite,
        boxShadow: hover
          ? '0 20px 40px rgba(28,24,16,0.15)'
          : '0 4px 24px rgba(28,24,16,0.08)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* Image */}
      <div style={{ overflow: 'hidden', height: 260 }}>
        <img
          src={step.image}
          alt={step.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.5s ease',
            transform: hover ? 'scale(1.05)' : 'scale(1)',
          }}
        />
      </div>

      {/* Text content */}
      <div style={{ padding: '28px 24px 32px' }}>
        {/* Step number */}
        <span
          style={{
            fontFamily: tokens.display,
            fontSize: 13,
            fontWeight: 400,
            color: tokens.gold,
            display: 'block',
            letterSpacing: '0.1em',
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
            marginTop: 8,
            lineHeight: 1.15,
          }}
        >
          {step.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 14,
            color: 'rgba(28,24,16,0.55)',
            lineHeight: 1.65,
            margin: 0,
            marginTop: 12,
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
        background: tokens.parchment,
        padding: isMobile ? '80px 24px' : '120px 80px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
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
          How It Works
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
          Four simple steps to perfect blinds.
        </h2>

        {/* Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 24 : 24,
            marginTop: 64,
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
              padding: '18px 52px',
              borderRadius: 8,
              fontFamily: tokens.body,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              background: ctaHover ? tokens.goldLight : tokens.gold,
              color: tokens.ink,
              border: 'none',
              boxShadow: ctaHover
                ? '0 8px 24px rgba(200,151,58,0.4)'
                : '0 4px 16px rgba(200,151,58,0.25)',
            }}
          >
            Start Designing
          </button>
        </div>
      </div>
    </section>
  )
}
