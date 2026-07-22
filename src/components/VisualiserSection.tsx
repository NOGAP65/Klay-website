import KlayConfigurator from '../visualiser/KlayConfigurator';

export function VisualiserSection() {
  return (
    <section id="visualiser" style={{ background: '#0f0d09', padding: '100px 0 0' }}>

      {/* Intro header */}
      <div style={{ padding: '0 80px 60px', maxWidth: '720px' }}>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: '#C8973A', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '16px' }}>
          THE KLAY VISUALISER
        </p>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(42px,5vw,72px)', fontWeight: 300, color: '#F8F6F2', lineHeight: 0.92, letterSpacing: '-0.02em', marginBottom: '20px' }}>
          See your blind<br />before you buy it.
        </h2>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '15px', color: 'rgba(248,246,242,0.5)', lineHeight: 1.8, maxWidth: '480px' }}>
          Upload a photo of your window — or pick a preset room — and see your exact blind rendered in real time. Configure the range, hardware finish, size and operation. Get an instant price.
        </p>
      </div>

      {/* Visualiser — constrained height */}
      <div style={{ height: '680px', position: 'relative', borderTop: '1px solid rgba(200,151,58,0.12)' }}>
        <KlayConfigurator />
      </div>

    </section>
  );
}
