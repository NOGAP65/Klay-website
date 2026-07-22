import KlayConfigurator from '../visualiser/KlayConfigurator';

export function VisualiserSection() {
  return (
    <section id="visualiser" style={{
      background: '#0f0d09',
      borderTop: '1px solid rgba(200,151,58,0.12)',
      borderBottom: '1px solid rgba(200,151,58,0.12)',
    }}>
      {/* Section label */}
      <div style={{ padding: '48px 80px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '24px', height: '1px', background: '#C8973A' }} />
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: '#C8973A', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            The Klay Visualiser
          </p>
        </div>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: 'rgba(248,246,242,0.3)', letterSpacing: '0.1em' }}>
          Upload your window photo — see your blind live
        </p>
      </div>

      {/* Visualiser */}
      <div style={{ height: '75vh', minHeight: '580px', maxHeight: '780px', marginTop: '24px' }}>
        <KlayConfigurator />
      </div>
    </section>
  );
}
