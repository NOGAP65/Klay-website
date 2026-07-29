import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { tokens } from '../theme';
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
      <div style={{ background: tokens.ink, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: tokens.body, fontSize: '13px', color: 'rgba(245,242,237,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Authorised access only.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      {/* Nav is position:fixed (out of flow) — paddingTop reserves its height
          so it doesn't overlap the controls/canvas row below. */}
      <div style={{ flex: 1, overflow: 'hidden', paddingTop: 80, display: 'flex', background: tokens.warmWhite }}>
        {/* Matches VisualiserSection's rhythm so the same panel doesn't read
            differently on the homepage and here. */}
        <div style={{ width: 348, flexShrink: 0, padding: 28, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <VisualiserControls />
          <button
            onClick={showToast}
            style={{
              width: '100%',
              padding: '15px 16px',
              background: tokens.gold,
              color: tokens.ink,
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: 2,
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
                background: tokens.ink,
                color: tokens.warmWhite,
                fontFamily: tokens.body,
                fontSize: 13,
                padding: '14px 20px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
              }}
            >
              {toast}
            </div>
          )}
        </div>
        {/* alignItems via the parent would stretch this column; instead the
            configurator sizes itself to the photo and this scrolls if the
            result is taller than the viewport. */}
        <div style={{ flex: 1, padding: 28, overflowY: 'auto', alignSelf: 'stretch' }}>
          <KlayConfigurator />
        </div>
      </div>
    </div>
  );
}
