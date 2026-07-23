import KlayConfigurator from '../visualiser/KlayConfigurator'

export default function VisualiserSection() {
  return (
    <section id="visualiser" style={{ background:'#F5F2ED', display:'flex', alignItems:'flex-start', minHeight:'520px', borderTop:'1px solid rgba(28,24,20,0.08)', borderBottom:'1px solid rgba(28,24,20,0.08)' }}>
      <div style={{ width:'320px', flexShrink:0, padding:'64px 48px', display:'flex', flexDirection:'column', justifyContent:'center', borderRight:'1px solid rgba(28,24,20,0.08)' }}>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'#C8973A', letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:'20px' }}>
          The Klay Visualiser
        </p>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(32px,3.5vw,52px)', fontWeight:300, color:'#1C1810', lineHeight:1.0, letterSpacing:'-0.02em', marginBottom:'20px' }}>
          See your blind<br />in your room,<br /><em style={{ color:'#C8973A' }}>before you order.</em>
        </h2>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(28,24,20,0.55)', lineHeight:1.8, marginBottom:'28px' }}>
          Upload a photo of your window or pick a preset room. See your exact blind rendered live. Adjust range, hardware and size. Instant pricing.
        </p>
        {['Real fabric textures rendered live','Instant price as you configure','Motorised blind animation','Download your design'].map(f => (
          <div key={f} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
            <div style={{ width:'16px', height:'1px', background:'#C8973A', flexShrink:0 }} />
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(28,24,20,0.6)' }}>{f}</span>
          </div>
        ))}
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(28,24,20,0.3)', lineHeight:1.6, marginTop:'24px' }}>
          Our technician confirms measurements on-site before your blind is made.
        </p>
      </div>
      <div style={{ flex:1, position:'relative', overflow:'hidden', background:'#1C1810' }}>
        <KlayConfigurator />
      </div>
    </section>
  )
}
