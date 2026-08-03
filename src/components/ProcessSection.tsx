import { useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const STEPS = [
  {
    number: '01',
    title: 'Configure Online',
    description:
      'Choose your blind type, fabric colour and hardware finish. Our visualiser renders it live in your room — try every option before you decide.',
    image: '/images/lifestyle/step-1-configure.png',
  },
  {
    number: '02',
    title: 'We Measure',
    description:
      'A Klay technician visits your home within 7–10 days. Precise measurements, down to the millimetre. No DIY, no guesswork.',
    image: '/images/lifestyle/step-2-measure.png',
  },
  {
    number: '03',
    title: 'Made for You',
    description:
      'Your blinds are manufactured to your exact measurements by Rynamic Industries in South Australia. Australian made, premium quality.',
    image: '/images/lifestyle/step-3-manufacture.png',
  },
  {
    number: '04',
    title: 'Professionally Installed',
    description:
      'The same technician returns to install your blinds. Perfectly fitted, every time. Your home, transformed.',
    image: '/images/lifestyle/step-4-install.png',
  },
]

function StepBlock({
  step,
  index,
}: {
  step: (typeof STEPS)[number]
  index: number
}) {
  const isMobile = useIsMobile()
  const [imageHover, setImageHover] = useState(false)
  const isReversed = index % 2 === 1

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile
          ? 'column'
          : isReversed
            ? 'row-reverse'
            : 'row',
        alignItems: 'center',
        gap: isMobile ? 48 : 80,
      }}
    >
      {/* Image */}
      <div
        onMouseEnter={() => setImageHover(true)}
        onMouseLeave={() => setImageHover(false)}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 24,
          aspectRatio: '16 / 10',
          boxShadow: imageHover
            ? '0 40px 80px rgba(28,24,16,0.22)'
            : '0 16px 48px rgba(28,24,16,0.12)',
          transition: 'box-shadow 0.5s ease',
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
            transform: imageHover ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.7s ease',
          }}
        />
      </div>

      {/* Text content */}
      <div
        style={{
          flex: 1,
          padding: isMobile ? '0' : '24px 0',
        }}
      >
        {/* Large step number */}
        <div
          style={{
            fontFamily: tokens.display,
            fontSize: 100,
            fontWeight: 200,
            color: tokens.gold,
            opacity: 0.2,
            lineHeight: 0.85,
            marginBottom: -20,
          }}
        >
          {step.number}
        </div>

        {/* Step label */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 12,
            fontWeight: 500,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            margin: 0,
          }}
        >
          Step {step.number}
        </p>

        {/* Title */}
        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 32 : 40,
            fontWeight: 300,
            color: tokens.ink,
            lineHeight: 1.15,
            margin: 0,
            marginTop: 16,
          }}
        >
          {step.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 16,
            color: 'rgba(28,24,16,0.6)',
            lineHeight: 1.8,
            margin: 0,
            marginTop: 20,
            maxWidth: 440,
          }}
        >
          {step.description}
        </p>

        {/* Decorative line */}
        <div
          style={{
            width: 60,
            height: 2,
            background: `linear-gradient(90deg, ${tokens.gold} 0%, transparent 100%)`,
            marginTop: 32,
          }}
        />
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 80 : 100 }}>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 12,
              fontWeight: 500,
              color: tokens.gold,
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
              fontSize: isMobile ? 36 : 52,
              fontWeight: 300,
              color: tokens.ink,
              lineHeight: 1.1,
              margin: 0,
              marginTop: 24,
            }}
          >
            Four simple steps to perfect blinds.
          </h2>
        </div>

        {/* Steps */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 80 : 120,
          }}
        >
          {STEPS.map((step, index) => (
            <StepBlock key={step.number} step={step} index={index} />
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 100 }}>
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
