import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import RollerBlindsPage from './pages/RollerBlindsPage';
import HowItWorksPage from './pages/HowItWorksPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import VisualiserPage from './pages/VisualiserPage';
import BookInstallPage from './pages/BookInstallPage';
import BookingConfirmedPage from './pages/BookingConfirmedPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/blinds" element={<RollerBlindsPage />} />
      <Route path="/blinds/roller-blinds" element={<RollerBlindsPage />} />
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
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
