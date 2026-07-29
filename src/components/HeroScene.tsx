import { useNavigate } from 'react-router-dom'
import { tokens } from '../theme'
import { useIsMobile } from '../hooks/useIsMobile'

const buttonBase: React.CSSProperties = {
  padding: '15px 36px',
  borderRadius: 2,
  fontFamily: tokens.body,
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background 0.3s ease, border-color 0.3s ease, color 0.3s ease',
}

export default function HeroScene() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
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
        <p style={{ fontFamily:tokens.body, fontSize:'11px', color:tokens.gold, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:'20px' }}>
          Australian Made-to-Measure
        </p>
        <h1 style={{ fontFamily:tokens.display, fontSize:'clamp(56px,9vw,130px)', fontWeight:300, lineHeight:0.88, margin:0 }}>
          <span style={{ display:'block', color:tokens.warmWhite }}>Light,</span>
          <span style={{ display:'block', color:tokens.goldLight, fontStyle:'italic' }}>curated</span>
          <span style={{ display:'block', color:tokens.warmWhite }}>for you.</span>
        </h1>
        <p style={{ fontFamily:tokens.body, fontSize:'15px', color:'rgba(245,242,237,0.68)', lineHeight:1.75, marginTop:'22px', maxWidth:'420px' }}>
          Blinds, curtains and shutters made precisely for your windows — designed with you, installed by hand across Victoria.
        </p>
        <div style={{ display:'flex', gap:'14px', marginTop:'34px', flexWrap:'wrap' }}>
          <button
            onClick={scrollToVisualiser}
            style={{ ...buttonBase, background:tokens.gold, color:tokens.ink, border:`1px solid ${tokens.gold}` }}
            onMouseEnter={e => { e.currentTarget.style.background = tokens.goldLight }}
            onMouseLeave={e => { e.currentTarget.style.background = tokens.gold }}
          >
            Design Yours
          </button>
          <button
            onClick={() => navigate('/products')}
            style={{ ...buttonBase, background:'transparent', color:tokens.warmWhite, border:`1px solid ${tokens.onDarkEdge}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = tokens.gold; e.currentTarget.style.color = tokens.gold }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.onDarkEdge; e.currentTarget.style.color = tokens.warmWhite }}
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
