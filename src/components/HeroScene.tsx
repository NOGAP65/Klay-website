import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokens, eyebrow, headline, motion } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const buttonBase: React.CSSProperties = {
  padding: '17px 40px',
  borderRadius: 2,
  fontFamily: tokens.body,
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: motion.button,
}

export default function HeroScene() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [ctaHover, setCtaHover] = useState(false)
  const [linkHover, setLinkHover] = useState(false)
  const scrollToVisualiser = () => {
    document.getElementById('visualiser')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <section style={{ position:'relative', height:'100vh', overflow:'hidden', background:tokens.charcoal }}>
      <video autoPlay muted loop playsInline
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:0 }}>
        <source src="/hero_video.mp4" type="video/mp4" />
      </video>

      {/* Flat 58% ink wash replaced with a directional one: heaviest bottom
          left under the copy, clearing toward the top right so the footage
          still reads. Legibility where it's needed, video everywhere else. */}
      <div
        style={{
          position:'absolute',
          inset:0,
          zIndex:1,
          background:
            'linear-gradient(15deg, rgba(28,24,16,0.86) 0%, rgba(28,24,16,0.62) 42%, rgba(28,24,16,0.34) 100%)',
        }}
      />

      <div style={{ position:'absolute', bottom:'10%', left:isMobile ? '24px' : '80px', right:isMobile ? '24px' : undefined, zIndex:2, maxWidth:'560px' }}>
        <p style={{ ...eyebrow, marginBottom:'22px' }}>
          Australian Made-to-Measure
        </p>
        {/* Capped at 100px, down from 130. Above ~100 the three stacked lines
            pushed the subtext and CTA below the fold on a laptop, which is the
            one thing a hero cannot do — the promise has to arrive with its
            action already visible. */}
        <h1 style={{ ...headline.hero, lineHeight:0.88 }}>
          <span style={{ display:'block', color:tokens.warmWhite }}>Light,</span>
          <span style={{ display:'block', color:tokens.goldLight, fontStyle:'italic' }}>curated</span>
          <span style={{ display:'block', color:tokens.warmWhite }}>for you.</span>
        </h1>
        {/* 0.65 — the top of the muted band rather than its middle, because
            this one sits over moving video rather than a flat ground. */}
        <p style={{ fontFamily:tokens.body, fontSize:'15px', color:'rgba(245,242,237,0.65)', lineHeight:1.75, marginTop:'26px', maxWidth:'420px' }}>
          Blinds, curtains and shutters made precisely for your windows — designed with you, installed by hand across Victoria.
        </p>
        {/* One gold button. The second CTA was a bordered ghost button of near
            equal visual weight, which split the eye at the exact moment the
            hero is meant to point at one thing; demoted to a text link, it
            stays available without competing. */}
        <div style={{ display:'flex', gap:'28px', marginTop:'40px', flexWrap:'wrap', alignItems:'center' }}>
          <button
            onClick={scrollToVisualiser}
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            style={{
              ...buttonBase,
              background: ctaHover ? tokens.goldLight : tokens.gold,
              color: tokens.ink,
              border: `1px solid ${ctaHover ? tokens.goldLight : tokens.gold}`,
            }}
          >
            See It In Your Room
          </button>
          <button
            onClick={() => navigate('/products')}
            onMouseEnter={() => setLinkHover(true)}
            onMouseLeave={() => setLinkHover(false)}
            style={{
              background:'transparent',
              border:'none',
              padding:0,
              cursor:'pointer',
              fontFamily:tokens.body,
              fontSize:'12px',
              fontWeight:500,
              letterSpacing:'0.18em',
              textTransform:'uppercase',
              color: linkHover ? tokens.gold : tokens.warmWhite,
              paddingBottom:4,
              borderBottom:`1px solid ${linkHover ? tokens.gold : tokens.onDarkEdge}`,
              transition: motion.link,
            }}
          >
            Explore Collection
          </button>
        </div>
      </div>

      {!isMobile && (
        <p style={{ position:'absolute', bottom:'48px', right:'80px', zIndex:2, fontFamily:tokens.body, fontSize:'10px', color:'rgba(245,242,237,0.35)', letterSpacing:'0.2em', textTransform:'uppercase', writingMode:'vertical-rl', margin:0 }}>
          Scroll
        </p>
      )}
    </section>
  )
}
