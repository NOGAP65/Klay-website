import { useState } from 'react'
import { tokens, motion } from '../theme'
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
        background: tokens.charcoal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: isMobile ? '100px 24px' : '160px 80px',
        textAlign: 'center',
      }}
    >
      {/* Subtle gold glow from bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: 'radial-gradient(ellipse at 50% 120%, rgba(200,151,58,0.2) 0%, transparent 55%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
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
          Ready to Transform Your Windows
        </p>

        {/* Headline */}
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 52 : 80,
            fontWeight: 300,
            color: tokens.warmWhite,
            lineHeight: 1.0,
            margin: 0,
            marginTop: 20,
          }}
        >
          Your room is waiting.
        </h2>

        {/* Subtext */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 16,
            color: 'rgba(245,242,237,0.5)',
            lineHeight: 1.7,
            margin: 0,
            marginTop: 24,
            maxWidth: 480,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Configure your blind, see it in your room, book your installation. All online. All Klay.
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
              padding: '18px 48px',
              borderRadius: 2,
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: motion.button,
              background: primaryHover ? tokens.goldLight : tokens.gold,
              color: tokens.ink,
              border: `1px solid ${primaryHover ? tokens.goldLight : tokens.gold}`,
            }}
          >
            Design Yours
          </button>
          <a
            href="tel:1300005529"
            onMouseEnter={() => setSecondaryHover(true)}
            onMouseLeave={() => setSecondaryHover(false)}
            style={{
              padding: '18px 48px',
              borderRadius: 2,
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: motion.button,
              textDecoration: 'none',
              background: 'transparent',
              color: secondaryHover ? tokens.gold : tokens.warmWhite,
              border: `1px solid ${secondaryHover ? tokens.gold : tokens.onDarkEdge}`,
              display: 'inline-block',
            }}
          >
            Call 1300 00 KLAY
          </a>
        </div>
      </div>
    </section>
  )
}
