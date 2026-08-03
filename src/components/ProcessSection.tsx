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
        borderRadius: 16,
        background: tokens.warmWhite,
        boxShadow: hover
          ? '0 24px 48px rgba(28,24,16,0.18)'
          : '0 8px 32px rgba(28,24,16,0.1)',
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      {/* Image */}
      <div style={{ overflow: 'hidden', aspectRatio: '4 / 3' }}>
        <img
          src={step.image}
          alt={step.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.6s ease',
            transform: hover ? 'scale(1.06)' : 'scale(1)',
          }}
        />
      </div>

      {/* Text content */}
      <div style={{ padding: '32px 28px 36px' }}>
        {/* Step number */}
        <span
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            fontWeight: 600,
            color: tokens.gold,
            display: 'block',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Step {step.number}
        </span>

        {/* Title */}
        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: 26,
            fontWeight: 400,
            color: tokens.ink,
            margin: 0,
            marginTop: 12,
            lineHeight: 1.2,
          }}
        >
          {step.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 15,
            color: 'rgba(28,24,16,0.6)',
            lineHeight: 1.7,
            margin: 0,
            marginTop: 14,
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
        padding: isMobile ? '100px 24px' : '160px 80px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Eyebrow */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 12,
            fontWeight: 500,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
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
            marginTop: 24,
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
            gap: isMobile ? 32 : 28,
            marginTop: 80,
          }}
        >
          {STEPS.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 72 }}>
          <button
            onClick={scrollToVisualiser}
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            style={{
              padding: '20px 56px',
              borderRadius: 8,
              fontFamily: tokens.body,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: ctaHover ? tokens.goldLight : tokens.gold,
              color: tokens.ink,
              border: 'none',
              boxShadow: ctaHover
                ? '0 12px 32px rgba(200,151,58,0.4)'
                : '0 6px 20px rgba(200,151,58,0.3)',
              transform: ctaHover ? 'translateY(-2px)' : 'translateY(0)',
            }}
          >
            Start Designing
          </button>
        </div>
      </div>
    </section>
  )
}
