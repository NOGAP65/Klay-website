import KlayConfigurator from '../visualiser/KlayConfigurator';

export function VisualiserSection() {
  return (
    <section id="visualiser" style={{ background: '#0f0d09', display: 'flex', minHeight: '700px' }}>

      {/* Left — intro text */}
      <div style={{
        width: '380px',
        flexShrink: 0,
        padding: '80px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRight: '1px solid rgba(200,151,58,0.12)',
      }}>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: '#C8973A', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '20px' }}>
          THE KLAY VISUALISER
        </p>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(36px,4vw,60px)', fontWeight: 300, color: '#F8F6F2', lineHeight: 0.92, letterSpacing: '-0.02em', marginBottom: '24px' }}>
          See your blind<br />before<br />you buy it.
        </h2>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '14px', color: 'rgba(248,246,242,0.5)', lineHeight: 1.8, marginBottom: '32px' }}>
          Upload a photo of your window — or pick a preset room — and see your exact blind in real time. Configure range, finish, size and operation. Get an instant price.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {['Real fabric textures rendered live', 'Instant pricing as you configure', 'Motorised blind animation', 'Before/after comparison mode'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '20px', height: '1px', background: '#C8973A', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(248,246,242,0.6)' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — visualiser */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <KlayConfigurator />
      </div>

    </section>
  );
}
