import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens } from '../theme';

const DARK = '#0f0d09';

export default function VisualiserPage() {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');
  const hostname = window.location.hostname;
  const allowedHosts = ['localhost', 'klay-interiors.netlify.app', 'klayinteriors.com.au', 'www.klayinteriors.com.au'];
  const validKeys = ['klay-internal-2026', 'ella-embed-2026'];
  const isAllowed = allowedHosts.includes(hostname) || validKeys.includes(key ?? '');
  const [isLoading, setIsLoading] = useState(true);

  if (!isAllowed) {
    return (
      <div style={{ background: '#0a0806', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(248,246,242,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Authorised access only.</p>
      </div>
    );
  }

  return (
    <>
      <Nav />

      <section style={{ background: DARK, padding: '48px 80px 32px' }}>
        <div
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            marginBottom: 12,
          }}
        >
          Klay Visualiser
        </div>
        <h1
          style={{
            fontFamily: tokens.display,
            fontSize: 'clamp(36px, 4vw, 56px)',
            fontWeight: 300,
            color: tokens.warmWhite,
            lineHeight: 0.92,
            margin: 0,
          }}
        >
          Design your blind.
        </h1>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 14,
            color: 'rgba(248,246,242,0.5)',
            marginTop: 12,
            maxWidth: 520,
          }}
        >
          Upload a photo of your window — or choose a preset room — and see your exact blind
          before ordering.
        </p>
      </section>

      <section style={{ position: 'relative', width: '100%', height: 'calc(100vh - 80px)', background: '#0a0806' }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0a0806',
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                border: `1px solid ${tokens.gold}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: tokens.display,
                fontSize: 32,
                color: tokens.gold,
              }}
            >
              K
            </div>
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 13,
                color: 'rgba(248,246,242,0.4)',
                marginTop: 20,
              }}
            >
              Loading visualiser...
            </p>
          </div>
        )}

        <iframe
          src="https://ella-lifestyle.netlify.app/visualizer?embed=klay&key=ella-embed-2026"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          title="Klay Visualiser"
          allow="camera"
          loading="lazy"
          onLoad={() => setIsLoading(false)}
        />
      </section>

      <Footer />
    </>
  );
}
