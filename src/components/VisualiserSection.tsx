import { useState } from 'react'
import { Link } from 'react-router-dom'
import { tokens, eyebrow, headline, motion } from '../theme'
import VisualiserControls from '../visualiser/VisualiserControls'
import KlayConfigurator from '../visualiser/KlayConfigurator'
import { useVisualiserStore } from '../visualiser/useVisualiserStore'
import { bookingLink } from '../lib/bookingLink'

const FEATURES = [
  'Real fabric textures rendered live',
  'Instant price as you configure',
  'Motorised blind animation',
  'Download your design',
]

export default function VisualiserSection() {
  const [ctaHover, setCtaHover] = useState(false)
  // The homepage configurator feeds /book the same way the full-page one does,
  // so whatever the visitor has just configured here carries through.
  const { blindType, windowSize, operation, fabricColour, hardwareColour } = useVisualiserStore()

  return (
    <section id="visualiser" style={{ display:'flex', flexDirection:'row', alignItems:'stretch', width:'100%', background:tokens.warmWhite, overflow:'visible', padding:'80px 60px', gap: 32 }}>
      <div style={{ flex:'1 1 55%', background:tokens.warmWhite, position:'relative' }}>
        <KlayConfigurator />
      </div>

      <div style={{ flex:'0 0 340px', background:tokens.warmWhite, display:'flex', flexDirection:'column', justifyContent:'space-between', gap:'16px' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <p style={eyebrow}>
            The Klay Visualiser
          </p>

          <h2 style={{ ...headline.section, color:tokens.ink, fontSize: 36, lineHeight: 1.1 }}>
            See your blind in your room, <em>before you order.</em>
          </h2>

          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'14px', height:'1px', background:tokens.gold, flexShrink:0 }} />
                <span style={{ fontFamily:tokens.body, fontSize:'12px', color:tokens.inkSoft }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <VisualiserControls compact />

        <Link
          to={bookingLink({ blindType, windowSize, operation, fabricColour, hardwareColour })}
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          style={{
            display:'block',
            width:'100%',
            padding:'14px 16px',
            background: ctaHover ? tokens.goldLight : tokens.gold,
            color:tokens.ink,
            fontFamily:tokens.body,
            fontSize:'11px',
            fontWeight:600,
            letterSpacing:'0.14em',
            textTransform:'uppercase',
            border:'none',
            borderRadius:'6px',
            cursor:'pointer',
            transition: motion.button,
            textAlign:'center',
            textDecoration:'none',
            boxSizing:'border-box',
            flexShrink: 0,
          }}
        >
          Book Installation →
        </Link>
      </div>
    </section>
  )
}
