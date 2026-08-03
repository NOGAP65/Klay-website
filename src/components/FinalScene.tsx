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
        minHeight: isMobile ? '80vh' : '100vh',
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
          backgroundImage: "url('/images/lifestyle/room-kitchen.png')",
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
            'linear-gradient(180deg, rgba(28,24,16,0.4) 0%, rgba(28,24,16,0.75) 50%, rgba(28,24,16,0.9) 100%)',
        }}
      />

      {/* Decorative gold line at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1,
          height: 100,
          background: `linear-gradient(180deg, ${tokens.gold} 0%, transparent 100%)`,
          opacity: 0.4,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          padding: isMobile ? '0 24px' : '0 80px',
          maxWidth: 1000,
        }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            fontWeight: 500,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            margin: 0,
          }}
        >
          Ready to Transform Your Space
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 48 : 88,
            fontWeight: 300,
            color: tokens.warmWhite,
            lineHeight: 1.0,
            margin: 0,
            marginTop: 24,
          }}
        >
          Your room is waiting.
        </h2>

        {/* Subtext */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: isMobile ? 16 : 18,
            color: 'rgba(245,242,237,0.6)',
            lineHeight: 1.7,
            margin: 0,
            marginTop: 28,
            maxWidth: 520,
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
            marginTop: 48,
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
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: primaryHover ? tokens.warmWhite : tokens.gold,
              color: tokens.ink,
              border: 'none',
              boxShadow: primaryHover
                ? '0 12px 32px rgba(245,242,237,0.3)'
                : '0 8px 24px rgba(200,151,58,0.35)',
              transform: primaryHover ? 'translateY(-2px)' : 'translateY(0)',
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
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              background: secondaryHover ? 'rgba(245,242,237,0.1)' : 'transparent',
              color: secondaryHover ? tokens.gold : tokens.warmWhite,
              border: `1px solid ${secondaryHover ? tokens.gold : 'rgba(245,242,237,0.25)'}`,
              display: 'inline-block',
              transform: secondaryHover ? 'translateY(-2px)' : 'translateY(0)',
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
            gap: isMobile ? 24 : 48,
            marginTop: 64,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Made in Australia', icon: '🇦🇺' },
            { label: '5 Year Warranty', icon: '✓' },
            { label: 'Free Installation', icon: '🛠' },
          ].map((badge) => (
            <div
              key={badge.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16 }}>{badge.icon}</span>
              <span
                style={{
                  fontFamily: tokens.body,
                  fontSize: 12,
                  color: 'rgba(245,242,237,0.5)',
                  letterSpacing: '0.05em',
                }}
              >
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative gold line at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1,
          height: 80,
          background: `linear-gradient(0deg, ${tokens.gold} 0%, transparent 100%)`,
          opacity: 0.3,
        }}
      />
    </section>
  )
}
