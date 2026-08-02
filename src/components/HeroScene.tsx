import { useState } from 'react'
import { tokens, motion } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const buttonBase: React.CSSProperties = {
  padding: '18px 48px',
  borderRadius: 2,
  fontFamily: tokens.body,
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: motion.button,
  textDecoration: 'none',
  display: 'inline-block',
}

export default function HeroScene() {
  const isMobile = useIsMobile()
  const [primaryHover, setPrimaryHover] = useState(false)
  const [secondaryHover, setSecondaryHover] = useState(false)

  const scrollToVisualiser = () => {
    document.getElementById('visualiser')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToProcess = () => {
    document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: tokens.charcoal }}>
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      >
        <source src="/hero_video.mp4" type="video/mp4" />
      </video>

      {/* Directional overlay: heaviest at bottom-left under copy */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'linear-gradient(15deg, rgba(28,24,16,0.86) 0%, rgba(28,24,16,0.62) 42%, rgba(28,24,16,0.34) 100%)',
        }}
      />

      {/* Bottom gradient for CTA readability */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '35%',
          zIndex: 1,
          background: 'linear-gradient(to top, rgba(28,24,16,0.7) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Headline - positioned left */}
      <div
        style={{
          position: 'absolute',
          bottom: '22%',
          left: isMobile ? '24px' : '80px',
          right: isMobile ? '24px' : undefined,
          zIndex: 2,
          maxWidth: '700px',
        }}
      >
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 10,
            fontWeight: 500,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            marginBottom: 22,
          }}
        >
          Australian Made-to-Measure
        </p>
        <h1
          style={{
            fontFamily: tokens.display,
            fontSize: 'clamp(72px, 10vw, 140px)',
            fontWeight: 300,
            lineHeight: 0.88,
            margin: 0,
          }}
        >
          <span style={{ display: 'block', color: tokens.warmWhite }}>Light,</span>
          <span style={{ display: 'block', color: tokens.goldLight, fontStyle: 'italic' }}>curated</span>
          <span style={{ display: 'block', color: tokens.warmWhite }}>for you.</span>
        </h1>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 15,
            color: 'rgba(245,242,237,0.65)',
            lineHeight: 1.75,
            marginTop: 26,
            maxWidth: 420,
          }}
        >
          Blinds, curtains and shutters made precisely for your windows — designed with you, installed by hand across
          Victoria.
        </p>
      </div>

      {/* CTAs - bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? '6%' : '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={scrollToVisualiser}
          onMouseEnter={() => setPrimaryHover(true)}
          onMouseLeave={() => setPrimaryHover(false)}
          style={{
            ...buttonBase,
            background: primaryHover ? tokens.goldLight : tokens.gold,
            color: tokens.ink,
            border: `1px solid ${primaryHover ? tokens.goldLight : tokens.gold}`,
          }}
        >
          Design Yours
        </button>
        <button
          onClick={scrollToProcess}
          onMouseEnter={() => setSecondaryHover(true)}
          onMouseLeave={() => setSecondaryHover(false)}
          style={{
            ...buttonBase,
            background: 'transparent',
            color: secondaryHover ? tokens.gold : tokens.warmWhite,
            border: `1px solid ${secondaryHover ? tokens.gold : tokens.onDarkEdge}`,
          }}
        >
          How It Works
        </button>
      </div>

      {!isMobile && (
        <p
          style={{
            position: 'absolute',
            bottom: 48,
            right: 80,
            zIndex: 2,
            fontFamily: tokens.body,
            fontSize: 10,
            color: 'rgba(245,242,237,0.35)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            writingMode: 'vertical-rl',
            margin: 0,
          }}
        >
          Scroll
        </p>
      )}
    </section>
  )
}
