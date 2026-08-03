import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const DIFFERENTIATORS = [
  {
    number: '01',
    title: 'See It Before You Buy',
    body: 'Our visualiser renders your exact blind in your exact room. Upload a photo of your window and watch it transform in real time. No other blind brand in Australia offers this.',
  },
  {
    number: '02',
    title: 'Professional Installation',
    body: 'Every Klay blind comes with professional installation across Victoria. Your technician measures, manufactures to spec, and installs. You do nothing except choose what you love.',
  },
  {
    number: '03',
    title: 'One Person, Start to Finish',
    body: 'The same technician who measures your windows installs your blinds. They know your home, your windows, and exactly how your blind needs to fit.',
  },
]

export function DifferentiatorsSection() {
  const isMobile = useIsMobile()

  return (
    <section
      style={{
        background: tokens.charcoal,
        padding: isMobile ? '80px 24px' : '100px 80px',
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
          Why Choose Klay
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 36 : 52,
            fontWeight: 300,
            color: tokens.warmWhite,
            lineHeight: 1.1,
            margin: 0,
            marginTop: 18,
            textAlign: 'center',
          }}
        >
          We do things differently.
        </h2>

        {/* Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 24,
            marginTop: 56,
          }}
        >
          {DIFFERENTIATORS.map((diff) => (
            <div
              key={diff.number}
              style={{
                background: 'rgba(245,242,237,0.04)',
                border: '1px solid rgba(245,242,237,0.08)',
                padding: isMobile ? '32px 24px' : '40px 32px',
                borderRadius: 2,
              }}
            >
              {/* Large number */}
              <span
                style={{
                  fontFamily: tokens.display,
                  fontSize: 40,
                  fontWeight: 300,
                  color: tokens.gold,
                  opacity: 0.5,
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {diff.number}
              </span>

              {/* Title */}
              <h3
                style={{
                  fontFamily: tokens.display,
                  fontSize: isMobile ? 24 : 28,
                  fontWeight: 300,
                  color: tokens.warmWhite,
                  margin: 0,
                  marginTop: 14,
                  lineHeight: 1.15,
                }}
              >
                {diff.title}
              </h3>

              {/* Body */}
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 14,
                  color: 'rgba(245,242,237,0.6)',
                  lineHeight: 1.7,
                  margin: 0,
                  marginTop: 14,
                }}
              >
                {diff.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
