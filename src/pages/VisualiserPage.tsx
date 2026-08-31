import { Link, useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { radius, tokens } from '@/ds';
import VisualiserControls from '../visualiser/VisualiserControls';
import KlayConfigurator from '../visualiser/KlayConfigurator';
import { useVisualiserStore, ProductCategory } from '../visualiser/useVisualiserStore';
import { bookingLink } from '../lib/bookingLink';

const CATEGORY_TAB_STYLE = {
  flex: 1,
  padding: '12px 16px',
  fontFamily: tokens.body,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.2s ease, color 0.2s ease',
};

function CategorySwitcher() {
  const { productCategory, setProductCategory } = useVisualiserStore();

  const tabs: { id: ProductCategory; label: string }[] = [
    { id: 'blind', label: 'Blinds' },
    { id: 'curtain', label: 'Curtains' },
  ];

  return (
    <div style={{ display: 'flex', marginBottom: 20 }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setProductCategory(tab.id)}
          style={{
            ...CATEGORY_TAB_STYLE,
            background: productCategory === tab.id ? '#1D1D1D' : 'transparent',
            color: productCategory === tab.id ? '#F8F8F8' : '#1D1D1D',
            border: productCategory === tab.id ? 'none' : '1px solid rgba(29,29,29,0.2)',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function VisualiserPage() {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');
  const hostname = window.location.hostname;
  const allowedHosts = ['localhost', 'klay-website.netlify.app', 'klay-interiors.netlify.app', 'klayinteriors.com.au', 'www.klayinteriors.com.au'];
  const validKeys = ['klay-internal-2026', 'ella-embed-2026'];
  const isAllowed = allowedHosts.includes(hostname) || validKeys.includes(key ?? '');

  // The whole configuration goes into the /book link, so what the customer
  // configured here is what gets quoted or paid for there. Each traced window
  // is one blind, which seeds the quantity; before anything is traced it is 1.
  const { blindType, windowSize, operation, fabricColour, hardwareColour, tracedAreas } =
    useVisualiserStore();
  const confirmedWindows = tracedAreas.filter((a) => a.confirmed).length;

  if (!isAllowed) {
    return (
      <div style={{ background: tokens.ink, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: tokens.body, fontSize: '13px', color: 'rgba(248,248,248,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Authorised access only.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      {/* Nav is position:fixed (out of flow) — paddingTop reserves its height
          so it doesn't overlap the controls/canvas row below. */}
      <div style={{ flex: 1, overflow: 'hidden', paddingTop: 80, display: 'flex', background: tokens.paper }}>
        {/* Matches VisualiserSection's rhythm so the same panel doesn't read
            differently on the homepage and here. */}
        <div style={{ width: 348, flexShrink: 0, padding: 28, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <CategorySwitcher />
          <VisualiserControls showCurtainControls />
          <Link
            to={bookingLink({
              blindType,
              windowSize,
              operation,
              quantity: Math.max(confirmedWindows, 1),
              fabricColour,
              hardwareColour,
            })}
            style={{
              display: 'block',
              width: '100%',
              padding: '15px 16px',
              background: tokens.fillStrong,
              color: tokens.onFillStrong,
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: radius.md,
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            Book Installation →
          </Link>
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
