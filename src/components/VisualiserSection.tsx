import { useState } from 'react'
import { tokens, eyebrow, headline, motion, shadow } from '../theme'
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
  const [ctaHover, setCtaHover] = useState(false)
  const showToast = () => {
    setToast('Coming soon — booking flow in progress')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    // alignItems:flex-start so the media column is free to be exactly as tall
    // as the photo. Stretching it (the flex default) is what produced the
    // fixed grey panel with the image floating in the middle of it.
    <section id="visualiser" style={{ display:'flex', flexDirection:'row', alignItems:'flex-start', width:'100%', background:tokens.warmWhite, overflow:'hidden', padding:'120px 80px' }}>
      <div style={{ flex:7, background:tokens.warmWhite, paddingRight:'64px', position:'relative' }}>
        {/* No wrapper panel — the configurator supplies its own charcoal
            surface, sized to the photo, so there is no excess to show. */}
        <KlayConfigurator />
      </div>

      <div style={{ flex:3, background:tokens.warmWhite, display:'flex', flexDirection:'column', justifyContent:'flex-start', gap:'32px' }}>
        <p style={eyebrow}>
          The Klay Visualiser
        </p>

        {/* Was a flat 42px — below the 52px floor every other section headline
            holds, which made the site's single most persuasive feature read as
            a sidebar caption next to the canvas rather than as its own moment. */}
        <h2 style={{ ...headline.section, color:tokens.ink }}>
          See your blind in your room, <em>before you order.</em>
        </h2>

        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {FEATURES.map(f => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'16px', height:'1px', background:tokens.gold, flexShrink:0 }} />
              <span style={{ fontFamily:tokens.body, fontSize:'13px', color:tokens.inkSoft }}>{f}</span>
            </div>
          ))}
        </div>

        <VisualiserControls />

        <button
          onClick={showToast}
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          style={{
            width:'100%',
            padding:'17px 16px',
            background: ctaHover ? tokens.goldLight : tokens.gold,
            color:tokens.ink,
            fontFamily:tokens.body,
            fontSize:'11px',
            fontWeight:600,
            letterSpacing:'0.14em',
            textTransform:'uppercase',
            border:'none',
            borderRadius:'2px',
            cursor:'pointer',
            transition: motion.button,
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
              boxShadow: shadow.lift,
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </section>
  )
}
