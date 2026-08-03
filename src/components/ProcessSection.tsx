import { useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const STEPS = [
  {
    number: '01',
    title: 'Configure',
    desc: 'Choose your blind type, fabric and colour. See it in your room with our visualiser.',
    image: '/images/lifestyle/step-1-configure.png',
  },
  {
    number: '02',
    title: 'We Measure',
    desc: 'A Klay technician visits your home. Precise measurements, down to the millimetre.',
    image: '/images/lifestyle/step-2-measure.png',
  },
  {
    number: '03',
    title: 'Made for You',
    desc: 'Manufactured to your exact specs by Rynamic Industries in South Australia.',
    image: '/images/lifestyle/step-3-manufacture.png',
  },
  {
    number: '04',
    title: 'Installed',
    desc: 'The same technician returns to install. Perfectly fitted, every time.',
    image: '/images/lifestyle/step-4-install.png',
  },
]

function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: tokens.warmWhite,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: hover
          ? '0 16px 40px rgba(28,24,16,0.12)'
          : '0 4px 16px rgba(28,24,16,0.06)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Image */}
      <div style={{ overflow: 'hidden', aspectRatio: '16 / 10' }}>
        <img
          src={step.image}
          alt={step.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transform: hover ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: '20px 20px 24px' }}>
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
              fontSize: 24,
              fontWeight: 200,
              color: tokens.gold,
              opacity: 0.6,
              lineHeight: 1,
            }}
          >
            {step.number}
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: tokens.lineFaint,
            }}
          />
        </div>

        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: 22,
            fontWeight: 300,
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
          {step.desc}
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
            gap: 24,
            marginBottom: 48,
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
                letterSpacing: '0.2em',
                margin: 0,
              }}
            >
              How It Works
            </p>
            <h2
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 32 : 42,
                fontWeight: 300,
                color: tokens.ink,
                lineHeight: 1.15,
                margin: 0,
                marginTop: 12,
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
              padding: '14px 32px',
              borderRadius: 6,
              fontFamily: tokens.body,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              background: ctaHover ? tokens.goldLight : tokens.gold,
              color: tokens.ink,
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
            gap: 24,
          }}
        >
          {STEPS.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </div>
    </section>
  )
}
