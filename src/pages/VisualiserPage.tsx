import { useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import KlayConfigurator from '../visualiser/KlayConfigurator';

export default function VisualiserPage() {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');
  const hostname = window.location.hostname;
  const allowedHosts = ['localhost', 'klay-interiors.netlify.app', 'klayinteriors.com.au', 'www.klayinteriors.com.au'];
  const validKeys = ['klay-internal-2026', 'ella-embed-2026'];
  const isAllowed = allowedHosts.includes(hostname) || validKeys.includes(key ?? '');

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
          so it doesn't overlap the configurator's own header row. */}
      <div style={{ flex: 1, overflow: 'hidden', paddingTop: 80 }}>
        <KlayConfigurator />
      </div>
    </div>
  );
}
