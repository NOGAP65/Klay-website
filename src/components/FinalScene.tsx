import { useState } from 'react'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

export function FinalScene() {
  const isMobile = useIsMobile()
  const [primaryHover, setPrimaryHover] = useState(false)
  const [secondaryHover, setSecondaryHover] = useState(false)

  const scrollToVisualiser = () => {
    document.getElementById('visualiser')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="final"
      style={{
        position: 'relative',
        minHeight: isMobile ? '70vh' : '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/images/lifestyle/room-living.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(28,24,16,0.5) 0%, rgba(28,24,16,0.75) 50%, rgba(28,24,16,0.88) 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          padding: isMobile ? '80px 24px' : '120px 80px',
          maxWidth: 900,
        }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 12,
            fontWeight: 500,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            margin: 0,
          }}
        >
          Ready to Transform Your Space
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 44 : 72,
            fontWeight: 300,
            color: tokens.warmWhite,
            lineHeight: 1.05,
            margin: 0,
            marginTop: 28,
          }}
        >
          Your room is waiting.
        </h2>

        {/* Subtext */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: isMobile ? 16 : 18,
            color: 'rgba(245,242,237,0.65)',
            lineHeight: 1.75,
            margin: 0,
            marginTop: 32,
            maxWidth: 540,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Design your perfect blind in minutes. See it in your room. Book professional installation. All online.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: 56,
          }}
        >
          <button
            onClick={scrollToVisualiser}
            onMouseEnter={() => setPrimaryHover(true)}
            onMouseLeave={() => setPrimaryHover(false)}
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
              background: primaryHover ? tokens.warmWhite : tokens.gold,
              color: tokens.ink,
              border: 'none',
              boxShadow: primaryHover
                ? '0 16px 40px rgba(245,242,237,0.35)'
                : '0 12px 32px rgba(200,151,58,0.4)',
              transform: primaryHover ? 'translateY(-3px)' : 'translateY(0)',
            }}
          >
            Start Designing
          </button>
          <a
            href="tel:1300005529"
            onMouseEnter={() => setSecondaryHover(true)}
            onMouseLeave={() => setSecondaryHover(false)}
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
              textDecoration: 'none',
              background: secondaryHover ? 'rgba(245,242,237,0.1)' : 'transparent',
              color: secondaryHover ? tokens.gold : tokens.warmWhite,
              border: `1px solid ${secondaryHover ? tokens.gold : 'rgba(245,242,237,0.3)'}`,
              display: 'inline-block',
              transform: secondaryHover ? 'translateY(-3px)' : 'translateY(0)',
            }}
          >
            Call 1300 00 KLAY
          </a>
        </div>

        {/* Trust badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? 32 : 56,
            marginTop: 72,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Made in Australia' },
            { label: '5 Year Warranty' },
            { label: 'Free Installation' },
          ].map((badge) => (
            <div
              key={badge.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: tokens.gold,
                }}
              />
              <span
                style={{
                  fontFamily: tokens.body,
                  fontSize: 13,
                  color: 'rgba(245,242,237,0.6)',
                  letterSpacing: '0.05em',
                }}
              >
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
