import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const STATS = [
  { number: '14', label: 'FABRIC COLOURS' },
  { number: '5', label: 'YEAR WARRANTY' },
  { number: '2–3', label: 'WEEKS START TO FINISH' },
  { number: '1', label: 'TECHNICIAN, START TO FINISH' },
]

export function ManifestoSection() {
  const isMobile = useIsMobile()

  return (
    <section
      style={{
        background: tokens.charcoal,
        padding: isMobile ? '60px 24px' : '80px 80px',
        width: '100%',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
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
          Why Klay
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 36 : 56,
            fontWeight: 300,
            color: tokens.warmWhite,
            lineHeight: 1.1,
            textAlign: 'center',
            margin: 0,
            marginTop: 20,
          }}
        >
          The window covering industry hasn't changed in 30 years. We're changing it.
        </h2>

        {/* Subtext */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 16,
            color: 'rgba(245,242,237,0.6)',
            textAlign: 'center',
            marginTop: 24,
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.7,
          }}
        >
          No showrooms. No sales reps. No guesswork. Just your blind, built for your window, installed by hand.
        </p>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: isMobile ? 32 : 48,
            marginTop: 64,
          }}
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: isMobile ? 120 : 140,
              }}
            >
              <span
                style={{
                  fontFamily: tokens.display,
                  fontSize: isMobile ? 48 : 64,
                  fontWeight: 300,
                  color: tokens.gold,
                  lineHeight: 1,
                }}
              >
                {stat.number}
              </span>
              <span
                style={{
                  fontFamily: tokens.body,
                  fontSize: 11,
                  fontWeight: 500,
                  color: tokens.warmWhite,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
