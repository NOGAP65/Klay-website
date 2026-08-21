import { useState } from 'react'
import { Link } from 'react-router-dom'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const buttonBase: React.CSSProperties = {
  padding: '16px 40px',
  borderRadius: 6,
  fontFamily: tokens.body,
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
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


  return (
    <section
      style={{
        position: 'relative',
        height: isMobile ? '70vh' : '80vh',
        minHeight: isMobile ? 500 : 600,
        maxHeight: 800,
        overflow: 'hidden',
        background: tokens.charcoal,
        marginTop: 72,
      }}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      >
        <source src="/hero_video.mp4" type="video/mp4" />
      </video>

      {/* Directional overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'linear-gradient(15deg, rgba(28,24,16,0.82) 0%, rgba(28,24,16,0.55) 42%, rgba(28,24,16,0.28) 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: isMobile ? '0 24px' : '0 80px',
          maxWidth: 800,
        }}
      >
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 10,
            fontWeight: 500,
            color: tokens.onDark,
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            margin: 0,
          }}
        >
          Australian Made-to-Measure
        </p>

        <h1
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 52 : 80,
            fontWeight: 300,
            lineHeight: 0.95,
            margin: 0,
            marginTop: 20,
          }}
        >
          <span style={{ color: tokens.warmWhite }}>Light,</span>
          <br />
          <span style={{ color: tokens.onDark, fontStyle: 'italic' }}>curated</span>
          <br />
          <span style={{ color: tokens.warmWhite }}>for you.</span>
        </h1>

        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 15,
            color: 'rgba(245,242,237,0.65)',
            lineHeight: 1.7,
            margin: 0,
            marginTop: 24,
            maxWidth: 420,
          }}
        >
          Blinds, curtains and shutters made precisely for your windows — designed with you, installed by hand across Victoria.
        </p>

        <div
          style={{
            display: 'flex',
            // center, because Buy Now is now the taller of the two — without
            // it the secondary sits on the primary's top edge.
            alignItems: 'center',
            gap: 14,
            marginTop: 36,
            flexWrap: 'wrap',
          }}
        >
          {/* BUY NOW is the primary and is deliberately the larger of the two:
              taller, wider, and a size up in type. Two buttons at identical
              weight ask the visitor to choose between them; this one is the
              page's actual job and should be answered without deciding.
              It goes to the shop, not the configurator — buying starts with
              seeing what is for sale. */}
          <Link
            to="/products"
            onMouseEnter={() => setPrimaryHover(true)}
            onMouseLeave={() => setPrimaryHover(false)}
            style={{
              ...buttonBase,
              padding: '20px 66px',
              fontSize: '13px',
              letterSpacing: '0.14em',
              background: primaryHover ? tokens.fillStrongHover : tokens.fillStrong,
              color: tokens.onFillStrong,
              border: 'none',
              boxShadow: primaryHover
                ? '0 14px 30px rgba(28,24,16,0.30)'
                : '0 8px 20px rgba(28,24,16,0.20)',
            }}
          >
            Buy Now
          </Link>
          <button
            onClick={scrollToVisualiser}
            onMouseEnter={() => setSecondaryHover(true)}
            onMouseLeave={() => setSecondaryHover(false)}
            style={{
              ...buttonBase,
              background: 'transparent',
              color: secondaryHover ? tokens.card : tokens.onDarkMuted,
              border: `1px solid ${secondaryHover ? tokens.line : 'rgba(245,242,237,0.3)'}`,
            }}
          >
            Design Yours
          </button>
        </div>
      </div>
    </section>
  )
}
