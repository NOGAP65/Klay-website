import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import * as routes from '@/config/routes';

import { HomePage, TrustTicker, TICKER_HEIGHT } from '@/features/home';

import { RootLayout } from './layouts/RootLayout';
import NotFoundPage from './routes/NotFoundPage';

const ProductsPage = lazy(() => import('@/features/catalogue/components/ProductsPage'));
const CartPage = lazy(() => import('@/features/cart/components/CartPage'));
const AboutPage = lazy(() => import('@/features/marketing/components/AboutPage'));
const ContactPage = lazy(() => import('@/features/marketing/components/ContactPage'));
const HowItWorksPage = lazy(() => import('@/features/marketing/components/HowItWorksPage'));
const BookingConfirmedPage = lazy(() => import('@/features/booking/components/BookingConfirmedPage'));
const BookInstallPage = lazy(() => import('@/features/booking/components/BookInstallPage'));
const VisualiserPage = lazy(() => import('@/features/visualiser/VisualiserPage'));

/** Only active customer pages are routed. Retired and unknown URLs stay 404s. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout banner={<TrustTicker />} stickBelow={TICKER_HEIGHT} />}>
        <Route path={routes.home} element={<HomePage />} />
      </Route>
      <Route element={<RootLayout />}>
        <Route path={routes.products} element={<ProductsPage />} />
        <Route path={routes.howItWorks} element={<HowItWorksPage />} />
        <Route path={routes.about} element={<AboutPage />} />
      </Route>
      <Route element={<RootLayout onLight />}>
        <Route path={routes.contact} element={<ContactPage />} />
        <Route path={routes.book} element={<BookInstallPage />} />
        {/* Required return destination for the existing checkout integration. */}
        <Route path={routes.bookingConfirmed} element={<BookingConfirmedPage />} />
        <Route path={routes.cart} element={<CartPage />} />
        <Route path={routes.visualiser} element={<VisualiserPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
