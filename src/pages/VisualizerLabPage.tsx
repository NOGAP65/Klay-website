// ---------------------------------------------------------------------------
// /visualizer — THE VISUALISER SANDBOX.
//
// A COMPLETE FORK OF THE VISUALISER, and the point is that it shares nothing.
// This page renders src/visualiser-lab/*, a byte copy of src/visualiser/* taken
// at the commit that introduced it. Break whatever you like in here; the live
// tool does not move.
//
// WHY FORK THE WHOLE MODULE RATHER THAN JUST THIS PAGE. The visualiser is ~8k
// lines across nine files, and four surfaces mount them:
//
//     /visualiser                the live standalone page
//     /products/<slug>           ProductDetailPage's configurator
//     homepage #visualiser       components/home/VisualiserShowcase
//     homepage range cards       RangeRow, for the store alone
//
// A page-level copy would still have imported the shared renderers, controls
// and store, so editing a renderer to try something here would have changed all
// four at once — exactly the accident this page exists to prevent.
//
// THE STORE IS THE SUBTLE HALF. useVisualiserStore is a zustand store created
// at module scope, so it is one global object shared by everything that imports
// it. The fork gets its own instance for free by being a separate module: a
// fabric picked in the lab cannot leak into the live page's state, and the lab
// cannot be handed stale state left behind by the homepage.
//
// SPELLING IS THE SWITCH. Live is /visualiser (British, as the rest of the site
// spells it), sandbox is /visualizer (American). One letter is a thin thing to
// hang a distinction on, so the page also says which one it is in a bar across
// the top.
//
// WHEN THE WORK IS DONE: diff visualiser-lab against visualiser, move across
// what you want, then delete this page, its route and the lab directory
// together. This is scaffolding, not a second product.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { radius, tokens } from '../theme';
import VisualiserControls from '../visualiser-lab/VisualiserControls';
import KlayConfigurator from '../visualiser-lab/KlayConfigurator';
import { useVisualiserStore, ProductCategory } from '../visualiser-lab/useVisualiserStore';
import { bookingLink } from '../lib/bookingLink';

const BANNER_H = 30;

/** Says which visualiser you are looking at, because the two URLs differ by one
 * letter and the pages are otherwise identical.
 *
 * ALONG THE BOTTOM, not the top, and that is forced rather than chosen: Nav is
 * position:fixed at top 0 with zIndex 9000, so a bar in normal flow above it
 * gets covered, and a fixed bar at top 0 would have to outrank the nav and then
 * sit on top of the logo. The foot of the viewport is the one full-width strip
 * on this page that nothing else claims.
 *
 * Amber rather than anything from the site's own palette on purpose: nothing
 * else here is this colour, so it cannot be mistaken for chrome that belongs to
 * the product. */
function SandboxBanner() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: BANNER_H,
        // Over the nav's 9000, so it stays legible if the two ever meet.
        zIndex: 9500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        background: '#B45309',
        color: '#FFF7ED',
        fontFamily: tokens.body,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        boxSizing: 'border-box',
      }}
    >
      <span>Sandbox · renders visualiser-lab · the live tool is untouched</span>
      <Link to="/visualiser" style={{ color: '#FFF7ED', textUnderlineOffset: 3 }}>
        Live page →
      </Link>
    </div>
  );
}

/** The panel's one full-width action. Shared by both CTAs so the wardrobe's
 * enquiry button cannot drift from the blind's booking button on anything but
 * the colour that is meant to separate them. */
const CTA_STYLE: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '15px 16px',
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
};

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

  // WARDROBES ARE SANDBOX-ONLY, and this array is the whole of why. The
  // homepage showcase, the product pages and /visualiser render the components
  // in src/visualiser, which has no wardrobe in it at all; this page renders
  // src/visualiser-lab, which does. Nothing has to be feature-flagged, because
  // the two module trees simply carry different products — and that separation
  // is exactly what the fork was for.
  const tabs: { id: ProductCategory; label: string }[] = [
    { id: 'blind', label: 'Blinds' },
    { id: 'curtain', label: 'Curtains' },
    { id: 'wardrobe', label: 'Wardrobes' },
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

export default function VisualizerLabPage() {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');
  const hostname = window.location.hostname;
  const allowedHosts = ['localhost', 'klay-website.netlify.app', 'klay-interiors.netlify.app', 'klayinteriors.com.au', 'www.klayinteriors.com.au'];
  const validKeys = ['klay-internal-2026', 'ella-embed-2026'];
  const isAllowed = allowedHosts.includes(hostname) || validKeys.includes(key ?? '');

  // Keep the sandbox out of the index. It is a near-duplicate of /visualiser on
  // the same domain, which is the shape a search engine reads as the original
  // having competition. Removed on unmount so the tag cannot outlive the page
  // and go on suppressing the rest of the site.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  // The whole configuration goes into the /book link, so what the customer
  // configured here is what gets quoted or paid for there. Each traced window
  // is one blind, which seeds the quantity; before anything is traced it is 1.
  const { blindType, windowSize, operation, fabricColour, hardwareColour, tracedAreas, productCategory } =
    useVisualiserStore();
  const isWardrobe = productCategory === 'wardrobe';
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
      <SandboxBanner />
      <Nav />
      {/* Nav is position:fixed (out of flow) — paddingTop reserves its height
          so it doesn't overlap the controls/canvas row below. The banner is
          fixed too, at the foot, so paddingBottom reserves its height for the
          same reason: without it the Book Installation button and the bottom of
          the canvas sit underneath the bar. */}
      <div style={{ flex: 1, overflow: 'hidden', paddingTop: 80, paddingBottom: BANNER_H, display: 'flex', background: tokens.warmWhite }}>
        {/* Matches VisualiserSection's rhythm so the same panel doesn't read
            differently on the homepage and here. */}
        <div style={{ width: 348, flexShrink: 0, padding: 28, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <CategorySwitcher />
          <VisualiserControls showCurtainControls />
          {isWardrobe ? (
            // Wardrobes are quoted on measure — the catalogue prices them that
            // way and sends them to the contact form. bookingLink below encodes
            // a blind's type, size and operation, none of which a wardrobe has,
            // so pointing it at /book would carry a roller blind's configuration
            // under a wardrobe's name.
            <Link
              to="/contact?product=Wardrobes"
              style={{ ...CTA_STYLE, background: tokens.accent, color: tokens.onAccent }}
            >
              Enquire About This Wardrobe →
            </Link>
          ) : (
          <Link
            to={bookingLink({
              blindType,
              windowSize,
              operation,
              quantity: Math.max(confirmedWindows, 1),
              fabricColour,
              hardwareColour,
            })}
            style={{ ...CTA_STYLE, background: tokens.fillStrong, color: tokens.onFillStrong }}
          >
            Book Installation →
          </Link>
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
