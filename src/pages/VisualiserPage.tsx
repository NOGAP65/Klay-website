import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import VisualiserControls from '../visualiser/VisualiserControls';
import KlayConfigurator from '../visualiser/KlayConfigurator';

export default function VisualiserPage() {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');
  const hostname = window.location.hostname;
  const allowedHosts = ['localhost', 'klay-website.netlify.app', 'klay-interiors.netlify.app', 'klayinteriors.com.au', 'www.klayinteriors.com.au'];
  const validKeys = ['klay-internal-2026', 'ella-embed-2026'];
  const isAllowed = allowedHosts.includes(hostname) || validKeys.includes(key ?? '');

  const [toast, setToast] = useState<string | null>(null);
  const showToast = () => {
    setToast('Coming soon — booking flow in progress');
    setTimeout(() => setToast(null), 3000);
  };

  if (!isAllowed) {
    return (
      <div style={{ background: '#0a0806', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(248,246,242,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Authorised access only.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      {/* Nav is position:fixed (out of flow) — paddingTop reserves its height
          so it doesn't overlap the controls/canvas row below. */}
      <div style={{ flex: 1, overflow: 'hidden', paddingTop: 80, display: 'flex', background: '#F5F2ED' }}>
        <div style={{ width: 340, flexShrink: 0, padding: 24, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <VisualiserControls />
          <button
            onClick={showToast}
            style={{
              marginTop: 24,
              width: '100%',
              padding: 16,
              background: '#C8973A',
              color: '#1C1810',
              fontFamily: "'Inter',sans-serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Book Installation →
          </button>
          {toast && (
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: 24,
                right: 24,
                background: '#1C1810',
                color: '#F5F2ED',
                fontFamily: "'Inter',sans-serif",
                fontSize: 13,
                padding: '14px 20px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
              }}
            >
              {toast}
            </div>
          )}
        </div>
        <div style={{ flex: 1, padding: 24 }}>
          <KlayConfigurator />
        </div>
      </div>
    </div>
  );
}
