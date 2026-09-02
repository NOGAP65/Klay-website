// ---------------------------------------------------------------------------
// /visualizer — THE WARDROBE ENTRY POINT.
//
// THIS WAS A SANDBOX AND IS NOT ONE ANY MORE. It began as a complete fork of
// the visualiser — src/visualiser-lab, a byte copy of src/visualiser — so that
// the wardrobe work could break whatever it liked without moving the live tool
// under the four surfaces that mount it: /visualiser, the product pages, the
// homepage showcase and the homepage range cards.
//
// That work is done, and the diff against live turned out to be almost purely
// additive: a wider ProductCategory, a wardrobe branch in the controls, a
// wardrobe branch in the configurator, and eight new files nothing else
// imports. So it was moved across rather than reconciled, and src/visualiser is
// the one copy again.
//
// THE URL IS KEPT, because it is where the wardrobe work has been reviewed, and
// it now opens the same module on the wardrobe category rather than a second
// implementation of it. The spelling still tells the two apart — /visualiser is
// the site's own and lands on blinds — but they are no longer different code,
// and the banner says so.
//
// src/visualiser-lab is now unreferenced. It could not be deleted from here;
// deleting it is safe and is the last step of this move.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { radius, tokens } from '@/ds';

import { Nav } from '../components/Nav';
import { bookingLink } from '../lib/bookingLink';
import KlayConfigurator from '../visualiser/KlayConfigurator';
import { useVisualiserStore, ProductCategory } from '../visualiser/useVisualiserStore';
import VisualiserControls from '../visualiser/VisualiserControls';

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
      <span>Wardrobes · the same tool the rest of the site runs</span>
      <Link to="/visualiser" style={{ color: '#FFF7ED', textUnderlineOffset: 3 }}>
        Blinds &amp; curtains →
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

  // WARDROBES ARE NO LONGER SANDBOX-ONLY. This array used to be the whole of
  // why they were: the homepage, the product pages and /visualiser rendered
  // src/visualiser, which had no wardrobe in it, and only this page rendered
  // the fork that did. The fork has been moved across, so all four surfaces
  // carry the same three products and the homepage offers the same three tabs.
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

  // OPENS ON WARDROBES, which is what this URL is for now.
  //
  // It used to open on blinds because it was a byte copy of the live page that
  // happened to also carry a wardrobe tab. Now that every surface carries all
  // three, an address otherwise identical to /visualiser has to be about
  // something, and this is where the wardrobe range is reviewed — which is also
  // what the banner says. Once: a visitor who then clicks Blinds is not argued
  // with.
  //
  // DURING RENDER, NOT IN AN EFFECT, and that is forced. KlayConfigurator picks
  // its default photograph in its own mount effect, reading the category fresh
  // precisely so it loads the right one first time — and child effects run
  // before the parent's. Setting the category from an effect here therefore
  // landed after the child had already started loading the WINDOW photograph,
  // so two loads were in flight and the one that decoded last won: /visualizer
  // opened on the wardrobe tab showing a bedroom window with no wardrobe in it.
  // That is the same race the note on that mount effect describes.
  //
  // A lazy useState initialiser runs during this component's first render,
  // before any child mounts, so the configurator sees 'wardrobe' when it looks.
  // Writing to an external store from a render is the one thing zustand is
  // safe for here: it is idempotent, it runs once, and nothing in React's tree
  // has rendered against the old value yet.
  useState(() => {
    useVisualiserStore.getState().setProductCategory('wardrobe');
    return true;
  });
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
      <div style={{ flex: 1, overflow: 'hidden', paddingTop: 80, paddingBottom: BANNER_H, display: 'flex', background: tokens.paper }}>
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
