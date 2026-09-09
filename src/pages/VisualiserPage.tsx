import { Link, useSearchParams } from 'react-router-dom';

import { radius, tokens } from '@/ds';
import { useIsMobile } from '@/shared';

import { bookingLink } from '../lib/bookingLink';
import { KlayConfigurator, VisualiserControls, useVisualiserStore, ProductCategory } from '@/features/visualiser';

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
  // Decides whether the panel sits beside the stage or under it — see the note
  // on the layout below. The site's ordinary 768px breakpoint, not one of its
  // own: this is the same question every other page asks.
  const isMobile = useIsMobile();
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
    // TWO COLUMNS ON A DESKTOP, ONE ON A PHONE — AND IT USED TO BE TWO ON BOTH.
    //
    // The row below puts a 348px control panel beside a `flex: 1` stage, and the
    // panel is `flexShrink: 0`. On a 390px phone that arithmetic leaves the
    // stage 42px, less its own 28px of padding either side — so the photograph,
    // the renderer and the corner-pin overlay were all laid out inside a strip
    // narrower than one thumb. Measured on a 390px viewport: the stage box came
    // out 56px wide, the overlay's svg 0x0, and no canvas rendered at all.
    //
    // What a customer saw was the controls and nothing else: a visualiser with
    // no visual. Uploading a photo appeared to do nothing, because the thing it
    // loads into had no width to draw in.
    //
    // COLUMN-REVERSE, not column, so the stage comes FIRST. The panel is first
    // in the DOM because on a desktop it is the left-hand column, and stacking
    // it in source order would put the whole form above the photograph — the
    // customer would scroll past every control to reach the thing they came to
    // look at. Reversing the direction of a two-child column is the smallest
    // way to lead with the picture without reordering the markup.
    //
    // The fixed 100vh and the row's `overflow: hidden` go with it: two
    // scroll panes locked inside one viewport is a desktop layout, and on a
    // phone it clips a column that is legitimately taller than the screen. The
    // page scrolls normally instead.
    <div style={{ height: isMobile ? 'auto' : '100vh', minHeight: isMobile ? '100dvh' : undefined, display: 'flex', flexDirection: 'column' }}>
      {/* RootLayout owns the nav — decision D. It is position:fixed and out of
          flow, so paddingTop below reserves its height rather than a spacer. */}
      <div style={{ flex: 1, overflow: isMobile ? 'visible' : 'hidden', paddingTop: 80, display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', background: tokens.paper }}>
        {/* Matches VisualiserSection's rhythm so the same panel doesn't read
            differently on the homepage and here. */}
        <div style={{ width: isMobile ? '100%' : 348, flexShrink: 0, boxSizing: 'border-box', padding: isMobile ? 16 : 28, overflowY: isMobile ? 'visible' : 'auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: 28 }}>
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
            result is taller than the viewport.
            Stacked, it takes the full width and stops being a scroll pane of
            its own — see the note on the wrapper. `minWidth: 0` is what stops a
            wide photo from pushing the flex item past its share in the row
            case, which is the same collapse in the other direction. */}
        <div style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : undefined, boxSizing: 'border-box', padding: isMobile ? 16 : 28, overflowY: isMobile ? 'visible' : 'auto', alignSelf: 'stretch' }}>
          <KlayConfigurator />
        </div>
      </div>
    </div>
  );
}
