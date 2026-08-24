import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { CATEGORIES } from './data/categories';
import { BLIND_TYPES } from './data/blindTypes';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryPage from './pages/CategoryPage';
import BlindsPage from './pages/BlindsPage';
import HowItWorksPage from './pages/HowItWorksPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import VisualiserPage from './pages/VisualiserPage';
import BookInstallPage from './pages/BookInstallPage';
import BookingConfirmedPage from './pages/BookingConfirmedPage';
import CartPage from './pages/CartPage';
import NotFoundPage from './pages/NotFoundPage';

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

export default function App() {
  return (
    <>
    <ScrollToHash />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      {/* The three top-level categories — Indoor, Outdoor, Wardrobes — each a
          real page rendered by CategoryPage from data/categories.ts. The nav has
          pointed at these slugs all along; until now two of the three landed on
          the 404 page because only /blinds existed.

          Generated from the data so adding a category cannot leave it unrouted,
          and passed as a prop rather than read as a `/:category` param — a bare
          param at the root would swallow /about, /contact and everything else
          declared after it. */}
      {CATEGORIES.map((c) => (
        <Route key={c.slug} path={`/${c.slug}`} element={<CategoryPage slug={c.slug} />} />
      ))}
      {/* One listing page per blind type, generated from the taxonomy so a type
          added to data/blindTypes.ts cannot end up unrouted. Bare /blinds keeps
          showing rollers — that is what every existing link to it expects, and
          the type strip on the page is how you reach the other four. */}
      <Route path="/blinds" element={<BlindsPage />} />
      {BLIND_TYPES.map((t) => (
        <Route key={t.slug} path={`/blinds/${t.slug}`} element={<BlindsPage slug={t.slug} />} />
      ))}
      {/* One page per product, carrying the whole configurator. The old
          category tier (/products/blockout) and per-SKU tier
          (/products/blockout/dusk-white) are gone; ProductDetailPage
          redirects the blind-type slugs to their product. */}
      <Route path="/products/:slug" element={<ProductDetailPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/visualiser" element={<VisualiserPage />} />
      {/* Booking. /book takes the configuration as query params (type, size,
          op, qty, fabric, hw) so a refreshed or shared link still quotes for
          the right blind; /booking/confirmed is Stripe's return URL. */}
      <Route path="/book" element={<BookInstallPage />} />
      <Route path="/booking/confirmed" element={<BookingConfirmedPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}
