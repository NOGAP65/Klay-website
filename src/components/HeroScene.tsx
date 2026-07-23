import { useNavigate } from 'react-router-dom'

export default function HeroScene() {
  const navigate = useNavigate()
  const scrollToVisualiser = () => {
    document.getElementById('visualiser')?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <section style={{ position:'relative', height:'100vh', overflow:'hidden', background:'#2C2824' }}>
      <video autoPlay muted loop playsInline
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:0 }}>
        <source src="/hero_video.mp4" type="video/mp4" />
      </video>
      <div style={{ position:'absolute', inset:0, background:'rgba(28,24,16,0.58)', zIndex:1 }} />
      <div style={{ position:'absolute', bottom:'10%', left:'80px', zIndex:2, maxWidth:'560px' }}>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'#C8973A', letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:'20px' }}>
          Australian Made-to-Measure
        </p>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(60px,9vw,130px)', fontWeight:300, lineHeight:0.88, margin:0 }}>
          <span style={{ display:'block', color:'#F5F2ED' }}>Light,</span>
          <span style={{ display:'block', color:'#D9AE60', fontStyle:'italic' }}>curated</span>
          <span style={{ display:'block', color:'#F5F2ED' }}>for you.</span>
        </h1>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'15px', color:'rgba(245,242,237,0.6)', lineHeight:1.8, marginTop:'20px', maxWidth:'420px' }}>
          Blinds, curtains and shutters made precisely for your windows — designed with you, installed by hand across Victoria.
        </p>
        <div style={{ display:'flex', gap:'16px', marginTop:'32px', flexWrap:'wrap' }}>
          <button onClick={scrollToVisualiser} style={{ background:'#C8973A', color:'#1C1810', padding:'14px 36px', fontFamily:"'Inter',sans-serif", fontSize:'12px', letterSpacing:'0.2em', textTransform:'uppercase', border:'none', cursor:'pointer' }}>
            Design Yours
          </button>
          <button onClick={() => navigate('/products')} style={{ background:'transparent', color:'#F5F2ED', padding:'14px 36px', fontFamily:"'Inter',sans-serif", fontSize:'12px', letterSpacing:'0.2em', textTransform:'uppercase', border:'1px solid rgba(245,242,237,0.3)', cursor:'pointer' }}>
            Explore Collection
          </button>
        </div>
      </div>
      <p style={{ position:'absolute', bottom:'48px', right:'80px', zIndex:2, fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(245,242,237,0.3)', letterSpacing:'0.2em', textTransform:'uppercase', writingMode:'vertical-rl', margin:0 }}>
        Scroll
      </p>
    </section>
  )
}
