import KlayConfigurator from '../visualiser/KlayConfigurator';

export function VisualiserSection() {
  return (
    <section id="visualiser" style={{ background: '#0f0d09' }}>
      <div style={{ padding: '100px 80px 48px' }}>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'#C8973A', letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:'16px' }}>
          THE KLAY VISUALISER
        </p>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'60px' }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(42px,5vw,72px)', fontWeight:300, color:'#F8F6F2', lineHeight:0.92, letterSpacing:'-0.02em', flexShrink:0 }}>
            See your blind<br />before you buy it.
          </h2>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(248,246,242,0.5)', lineHeight:1.8, maxWidth:'420px', paddingBottom:'6px' }}>
            Upload a photo of your window — or pick a preset room — and see your exact blind rendered live. Configure range, finish, size and operation. Instant pricing.
          </p>
        </div>
      </div>
      <div style={{ height:'680px', borderTop:'1px solid rgba(200,151,58,0.12)' }}>
        <KlayConfigurator />
      </div>
    </section>
  );
}
