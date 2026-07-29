import { useState } from 'react'
import { tokens } from '../theme'
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
    // alignItems:flex-start so the media column is free to be exactly as tall
    // as the photo. Stretching it (the flex default) is what produced the
    // fixed grey panel with the image floating in the middle of it.
    <section id="visualiser" style={{ display:'flex', flexDirection:'row', alignItems:'flex-start', width:'100%', background:tokens.warmWhite, overflow:'hidden' }}>
      <div style={{ flex:7, background:tokens.warmWhite, padding:'48px', position:'relative' }}>
        {/* No wrapper panel — the configurator supplies its own charcoal
            surface, sized to the photo, so there is no excess to show. */}
        <KlayConfigurator />
      </div>

      <div style={{ flex:3, background:tokens.warmWhite, padding:'48px', display:'flex', flexDirection:'column', justifyContent:'flex-start', gap:'28px' }}>
        <p style={{ fontFamily:tokens.body, fontSize:'10px', color:tokens.gold, letterSpacing:'0.3em', textTransform:'uppercase', margin:0 }}>
          The Klay Visualiser
        </p>

        <h2 style={{ fontFamily:tokens.display, fontSize:'42px', fontWeight:300, lineHeight:1.1, color:tokens.ink, margin:0 }}>
          See your blind in your room, <em>before you order.</em>
        </h2>

        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {FEATURES.map(f => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'16px', height:'1px', background:tokens.gold, flexShrink:0 }} />
              <span style={{ fontFamily:tokens.body, fontSize:'12px', color:tokens.ink, opacity:0.55 }}>{f}</span>
            </div>
          ))}
        </div>

        <VisualiserControls />

        <button
          onClick={showToast}
          style={{
            width:'100%',
            padding:'15px 16px',
            background:tokens.gold,
            color:tokens.ink,
            fontFamily:tokens.body,
            fontSize:'11px',
            fontWeight:600,
            letterSpacing:'0.14em',
            textTransform:'uppercase',
            border:'none',
            borderRadius:'2px',
            cursor:'pointer',
          }}
        >
          Book Installation →
        </button>

        {toast && (
          <div
            style={{
              background:tokens.ink,
              color:tokens.warmWhite,
              fontFamily:tokens.body,
              fontSize:'13px',
              padding:'14px 20px',
              boxShadow:'0 4px 24px rgba(0,0,0,0.2)',
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </section>
  )
}
