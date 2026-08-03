import { useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const DIFFERENTIATORS = [
  {
    number: '01',
    title: 'See It Before You Buy',
    body: 'Our visualiser renders your exact blind in your exact room. Upload a photo of your window and watch it transform in real time. No other blind brand in Australia offers this.',
    icon: '👁',
  },
  {
    number: '02',
    title: 'Professional Installation',
    body: 'Every Klay blind comes with professional installation across Victoria. Your technician measures, manufactures to spec, and installs. You do nothing except choose what you love.',
    icon: '🛠',
  },
  {
    number: '03',
    title: 'One Person, Start to Finish',
    body: 'The same technician who measures your windows installs your blinds. They know your home, your windows, and exactly how your blind needs to fit.',
    icon: '👤',
  },
]

export function DifferentiatorsSection() {
  const isMobile = useIsMobile()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section
      style={{
        background: tokens.charcoal,
        padding: isMobile ? '80px 24px' : '120px 80px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
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
          Why Choose Klay
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 38 : 56,
            fontWeight: 300,
            color: tokens.warmWhite,
            lineHeight: 1.08,
            margin: 0,
            marginTop: 20,
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
            gap: 28,
            marginTop: 64,
          }}
        >
          {DIFFERENTIATORS.map((diff, index) => {
            const hovered = hoveredIndex === index
            return (
              <div
                key={diff.number}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  background: hovered
                    ? 'rgba(245,242,237,0.08)'
                    : 'rgba(245,242,237,0.03)',
                  border: `1px solid ${hovered ? 'rgba(200,151,58,0.3)' : 'rgba(245,242,237,0.08)'}`,
                  padding: isMobile ? '36px 28px' : '48px 36px',
                  borderRadius: 16,
                  transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Icon circle */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'rgba(200,151,58,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    marginBottom: 24,
                  }}
                >
                  {diff.icon}
                </div>

                {/* Number badge */}
                <span
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 10,
                    fontWeight: 500,
                    color: tokens.gold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    display: 'block',
                  }}
                >
                  0{index + 1}
                </span>

                {/* Title */}
                <h3
                  style={{
                    fontFamily: tokens.display,
                    fontSize: isMobile ? 26 : 30,
                    fontWeight: 300,
                    color: tokens.warmWhite,
                    margin: 0,
                    marginTop: 12,
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
                    color: 'rgba(245,242,237,0.55)',
                    lineHeight: 1.75,
                    margin: 0,
                    marginTop: 16,
                  }}
                >
                  {diff.body}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
