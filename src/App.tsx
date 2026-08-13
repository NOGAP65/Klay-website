import { Routes, Route } from 'react-router-dom';
import { CATEGORIES } from './data/categories';
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

export default function App() {
  return (
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
      <Route path="/blinds" element={<BlindsPage />} />
      <Route path="/blinds/roller-blinds" element={<BlindsPage />} />
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
  );
}
