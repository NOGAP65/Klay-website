import { useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const STEPS = [
  { number: '01', title: 'Configure', desc: 'Choose fabric & colour online' },
  { number: '02', title: 'We Measure', desc: 'Technician visits your home' },
  { number: '03', title: 'Made for You', desc: 'Manufactured in South Australia' },
  { number: '04', title: 'Installed', desc: 'Fitted by the same technician' },
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
        background: tokens.charcoal,
        padding: isMobile ? '64px 24px' : '80px 80px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 24,
            marginBottom: isMobile ? 48 : 56,
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
                fontSize: isMobile ? 32 : 40,
                fontWeight: 300,
                color: tokens.warmWhite,
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

        {/* Steps row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 24 : 32,
          }}
        >
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              style={{
                position: 'relative',
                paddingLeft: 20,
                borderLeft: `2px solid ${index === 0 ? tokens.gold : 'rgba(245,242,237,0.15)'}`,
              }}
            >
              <span
                style={{
                  fontFamily: tokens.display,
                  fontSize: 32,
                  fontWeight: 200,
                  color: tokens.gold,
                  opacity: 0.4,
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {step.number}
              </span>
              <h3
                style={{
                  fontFamily: tokens.display,
                  fontSize: 20,
                  fontWeight: 300,
                  color: tokens.warmWhite,
                  margin: 0,
                  marginTop: 8,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 13,
                  color: 'rgba(245,242,237,0.5)',
                  margin: 0,
                  marginTop: 6,
                  lineHeight: 1.5,
                }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
