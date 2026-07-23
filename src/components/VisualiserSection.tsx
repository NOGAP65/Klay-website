import { useState } from 'react'
import VisualiserControls from '../visualiser/VisualiserControls'
import KlayConfigurator from '../visualiser/KlayConfigurator'

const FEATURES = [
  'Real fabric textures rendered live',
  'Instant price as you configure',
  'Motorised blind animation',
  'Download your design',
]

export default function VisualiserSection() {
  const [toast, setToast] = useState<string | null>(null)
  const showToast = () => {
    setToast('Coming soon — booking flow in progress')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <section id="visualiser" style={{ display:'flex', flexDirection:'row', width:'100%', minHeight:'100vh', background:'#F5F2ED' }}>
      <div style={{ flex:1, background:'#F5F2ED', padding:'80px 64px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative' }}>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'#C8973A', letterSpacing:'0.3em', textTransform:'uppercase', margin:0 }}>
          The Klay Visualiser
        </p>

        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'64px', fontWeight:300, lineHeight:1.05, color:'#1C1810', margin:0 }}>
          See your blind in your room, <em>before you order.</em>
        </h2>

        <div style={{ marginTop:'40px', display:'flex', flexDirection:'column', gap:'14px' }}>
          {FEATURES.map(f => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'16px', height:'1px', background:'#C8973A', flexShrink:0 }} />
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'#1C1810', opacity:0.55 }}>{f}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop:'48px' }}>
          <VisualiserControls />
        </div>

        <button
          onClick={showToast}
          style={{
            marginTop:'auto',
            width:'100%',
            padding:'16px',
            background:'#C8973A',
            color:'#1C1810',
            fontFamily:"'Inter',sans-serif",
            fontSize:'12px',
            fontWeight:700,
            letterSpacing:'0.2em',
            textTransform:'uppercase',
            border:'none',
            cursor:'pointer',
          }}
        >
          Book Installation →
        </button>

        {toast && (
          <div
            style={{
              position:'absolute',
              bottom:'96px',
              left:'64px',
              right:'64px',
              background:'#1C1810',
              color:'#F5F2ED',
              fontFamily:"'Inter',sans-serif",
              fontSize:'13px',
              padding:'14px 20px',
              boxShadow:'0 4px 24px rgba(0,0,0,0.2)',
              zIndex:10,
            }}
          >
            {toast}
          </div>
        )}
      </div>
      <div style={{ width:'52%', flexShrink:0, background:'#F5F2ED', padding:'48px 48px 48px 0' }}>
        <KlayConfigurator />
      </div>
    </section>
  )
}
