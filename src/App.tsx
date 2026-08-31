import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import AboutPage from './pages/AboutPage';
import BookingConfirmedPage from './pages/BookingConfirmedPage';
import BookInstallPage from './pages/BookInstallPage';
import CartPage from './pages/CartPage';
import ContactPage from './pages/ContactPage';
import HomePage from './pages/HomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import NotFoundPage from './pages/NotFoundPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductsPage from './pages/ProductsPage';
import VisualiserPage from './pages/VisualiserPage';
import VisualizerLabPage from './pages/VisualizerLabPage';
import {
  LegacyBlindTypeRedirect,
  LegacyCategoryRedirect,
  LEGACY_CATEGORY_SLUGS,
} from './routes/legacyRedirects';

/** Scrolls to `#id` after the route renders.
 *
 * The nav's VISUALISE points at /#visualiser — the homepage's visualiser
 * section rather than the standalone /visualiser page — and react-router does
 * not act on a hash by itself. From another page the element does not exist
 * until the homepage has mounted, so this waits a frame and then a beat: the
 * homepage carries a video hero and several images above the target, and
 * scrolling on the first frame lands on a layout that is still settling.
 *
 * Smooth, because arriving mid-page with no travel reads as a broken link —
 * the movement is what tells you the section was already part of this page. */
function ScrollToHash() {
  // `search` IS A DEPENDENCY, and it has to be. The range row's cards link to
  // '/?type=blockout#visualiser' and '/?category=curtain#visualiser' — same path,
  // same hash, different query. Keyed on pathname and hash alone, clicking the
  // second card after the first was a no-op here: React Router saw no change in
  // either, so the configuration switched underneath a visitor who was never
  // carried to the section showing it.
  const { pathname, hash, search } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    let raf = 0;
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }, 120);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [pathname, hash, search]);

  return null;
}

// ---------------------------------------------------------------------------
// THE ROUTE TABLE. Six real pages and a booking pair.
//
// It used to carry three more tiers than it does: /indoor, /outdoor and
// /wardrobes rendered a category page, /blinds and /blinds/<type> rendered a
// listing page per blind type, and both existed only to hand the visitor down
// to a product. They were the navigation doing a page's job — every one of them
// asked you to narrow before it showed you anything, and none of them could
// sell. /products does the whole range on one screen with the filters visible,
// so the tiers above it had nothing left to say.
//
// What is left is: the homepage, the shop, a product, the visualiser, the two
// company pages the nav points at, how-it-works, and the booking and cart flow.
// Every one is either a destination in the nav or a step in buying.
//
// The dead URLs are redirects, not deletions — see routes/legacyRedirects.
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <>
    <ScrollToHash />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      {/* One page per product, carrying the whole configurator. Every tier that
          used to sit above it — the category pages, the blind-type listings, the
          old per-SKU URLs — now redirects here or to the shop. */}
      <Route path="/products/:slug" element={<ProductDetailPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/visualiser" element={<VisualiserPage />} />
      {/* The sandbox. Deliberately unlinked — it is reachable by typing the URL
          and nothing on the site points at it, because it is a near-duplicate of
          the line above and a visitor who lands on it by accident gets a page
          with a builder's bar across the foot. See VisualizerLabPage. */}
      <Route path="/visualizer" element={<VisualizerLabPage />} />
      {/* Booking. /book takes the configuration as query params (type, size,
          op, qty, fabric, hw) so a refreshed or shared link still quotes for
          the right blind; /booking/confirmed is Stripe's return URL. */}
      <Route path="/book" element={<BookInstallPage />} />
      <Route path="/booking/confirmed" element={<BookingConfirmedPage />} />
      <Route path="/cart" element={<CartPage />} />

      {/* --- retired URLs ------------------------------------------------- */}
      {/* Declared after every real route so none of them can be shadowed, and
          before the catch-all so they redirect rather than 404. */}
      <Route path="/blinds" element={<LegacyCategoryRedirect />} />
      <Route path="/blinds/:slug" element={<LegacyBlindTypeRedirect />} />
      {LEGACY_CATEGORY_SLUGS.map((slug) => (
        <Route key={slug} path={`/${slug}`} element={<LegacyCategoryRedirect slug={slug} />} />
      ))}

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}
