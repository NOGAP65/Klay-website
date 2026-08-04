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
  const { blindType, windowSize, operation, fabricColour, hardwareColour } = useVisualiserStore()

  return (
    <section id="visualiser" style={{ background:'#F5F2ED', padding:'80px 0' }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 40px' }}>
        {/* Row 1: Eyebrow + Headline left (45%), Features right (45%), gap ~10% */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:'10%', marginBottom:'32px' }}>
          <div style={{ flex:'0 0 45%' }}>
            <p style={{ ...eyebrow, marginBottom:'12px' }}>
              The Klay Visualiser
            </p>
            <h2 style={{ ...headline.section, color:tokens.ink, fontSize:36, lineHeight:1.1, margin:0 }}>
              See your blind in your room,<br /><em>before you order.</em>
            </h2>
          </div>

          <div style={{ flex:'0 0 45%', display:'flex', flexDirection:'column', gap:'8px', paddingTop:'8px' }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'14px', height:'1px', background:tokens.gold, flexShrink:0 }} />
                <span style={{ fontFamily:tokens.body, fontSize:'12px', color:tokens.inkSoft }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Canvas left 60%, Controls right 40% */}
        <div style={{ display:'flex', gap:'32px', alignItems:'stretch' }}>
          {/* Canvas area with card feel */}
          <div style={{
            flex:'0 0 60%',
            borderRadius:'4px',
            boxShadow:'0 4px 32px rgba(28,24,16,0.10)',
            overflow:'visible',
            position:'relative',
          }}>
            <KlayConfigurator />
          </div>

          {/* Controls panel */}
          <div style={{ flex:'1 1 40%', display:'flex', flexDirection:'column', justifyContent:'space-between', gap:'24px' }}>
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
                flexShrink:0,
              }}
            >
              Book Installation →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
