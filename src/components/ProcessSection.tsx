import { useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const STEPS = [
  {
    number: '01',
    title: 'Design Online',
    desc: 'Choose your blind, pick your fabric, and see it in your room with our visualiser.',
    icon: '✦',
  },
  {
    number: '02',
    title: 'We Measure',
    desc: 'A Klay technician visits your home for precise measurements.',
    icon: '◇',
  },
  {
    number: '03',
    title: 'Made for You',
    desc: 'Manufactured to your exact specs in South Australia.',
    icon: '○',
  },
  {
    number: '04',
    title: 'Installed',
    desc: 'Professional installation by the same technician who measured.',
    icon: '▽',
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
        background: tokens.parchment,
        padding: isMobile ? '80px 24px' : '100px 80px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 24,
            marginBottom: isMobile ? 56 : 72,
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

        {/* Timeline steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 0 : 0,
            position: 'relative',
          }}
        >
          {/* Connecting line - desktop only */}
          {!isMobile && (
            <div
              style={{
                position: 'absolute',
                top: 28,
                left: 'calc(12.5% + 14px)',
                right: 'calc(12.5% + 14px)',
                height: 1,
                background: 'rgba(200,151,58,0.3)',
              }}
            />
          )}

          {STEPS.map((step, index) => (
            <div
              key={step.number}
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                alignItems: isMobile ? 'flex-start' : 'center',
                textAlign: isMobile ? 'left' : 'center',
                padding: isMobile ? '24px 0' : '0 16px',
                borderBottom: isMobile && index < STEPS.length - 1 ? `1px solid rgba(28,24,16,0.08)` : 'none',
                position: 'relative',
              }}
            >
              {/* Number circle */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: tokens.warmWhite,
                  border: `2px solid ${tokens.gold}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: tokens.display,
                  fontSize: 20,
                  fontWeight: 300,
                  color: tokens.gold,
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {step.number}
              </div>

              {/* Content */}
              <div
                style={{
                  marginLeft: isMobile ? 20 : 0,
                  marginTop: isMobile ? 0 : 28,
                }}
              >
                <h3
                  style={{
                    fontFamily: tokens.display,
                    fontSize: isMobile ? 20 : 22,
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
                    fontSize: 14,
                    color: 'rgba(28,24,16,0.55)',
                    lineHeight: 1.65,
                    margin: 0,
                    marginTop: 10,
                    maxWidth: isMobile ? 280 : 200,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
