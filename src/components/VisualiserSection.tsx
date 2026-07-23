import { useState } from 'react'
import KlayConfigurator from '../visualiser/KlayConfigurator'

export default function VisualiserSection() {
  const [toast, setToast] = useState<string | null>(null)
  const showToast = () => {
    setToast('Coming soon — booking flow in progress')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <section id="visualiser" style={{ background:'#F5F2ED', display:'flex', width:'100%', minHeight:'80vh', borderTop:'1px solid rgba(28,24,20,0.08)', borderBottom:'1px solid rgba(28,24,20,0.08)' }}>
      <div style={{ width:'400px', flexShrink:0, background:'#F5F2ED', padding:'80px 56px', display:'flex', flexDirection:'column', justifyContent:'space-between', borderRight:'1px solid rgba(28,24,20,0.08)', position:'relative' }}>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'#C8973A', letterSpacing:'0.25em', textTransform:'uppercase', margin:0 }}>
          The Klay Visualiser
        </p>

        <div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'52px', fontWeight:300, color:'#1C1810', lineHeight:1.1, margin:0 }}>
            See your blind<br />in your room,<br /><em style={{ color:'#C8973A' }}>before you order.</em>
          </h2>
          <div style={{ marginTop:'32px', display:'flex', flexDirection:'column', gap:'16px' }}>
            {['Real fabric textures rendered live','Instant price as you configure','Motorised blind animation','Download your design'].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'16px', height:'1px', background:'#C8973A', flexShrink:0 }} />
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(28,24,16,0.6)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={showToast}
          style={{
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
              left:'56px',
              right:'56px',
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
      <div style={{ flex:1, position:'relative', overflow:'hidden', background:'#2C2824', minHeight:'80vh' }}>
        <KlayConfigurator />
      </div>
    </section>
  )
}
