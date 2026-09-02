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
//
// ---------------------------------------------------------------------------
// AND IT NOW CARRIES THE CHROME, WHICH IS THE POINT OF PHASE 5.
//
// Routes are grouped by which nav they want, because that is a fact about the
// site's composition and this is where composition is written down. Thirteen
// pages used to each import Nav and Footer and pick a variant for themselves;
// the grouping below is the same information, in one place, where you can read
// off which pages open on a dark hero and which do not.
//
// Every group is a layout route. The page renders through `<Outlet />` and
// imports no chrome at all — which is what removed the four import cycles: a
// feature can no longer reach a layout, so the layout reaching a feature barrel
// closes nothing.
// ---------------------------------------------------------------------------

import { Route, Routes } from 'react-router-dom';

import { CartPage } from '@/features/cart';
import { ProductDetailPage, ProductsPage } from '@/features/catalogue';
import { HomePage, TrustTicker, TICKER_HEIGHT } from '@/features/home';
import { AboutPage, ContactPage, HowItWorksPage } from '@/features/marketing';

import BookingConfirmedPage from '../pages/BookingConfirmedPage';
import BookInstallPage from '../pages/BookInstallPage';
import VisualiserPage from '../pages/VisualiserPage';

import { BareLayout } from './layouts/BareLayout';
import { RootLayout } from './layouts/RootLayout';
import { LegacyBlindTypeRedirect, LegacyCategoryRedirect, LEGACY_CATEGORY_SLUGS } from './routes/legacyRedirects';
import NotFoundPage from './routes/NotFoundPage';


export function AppRoutes() {
  return (
    <Routes>
      {/* THE HOMEPAGE, and the one route whose chrome is arranged differently.
          The trust ticker sits ABOVE the bar, in flow, so it scrolls away and
          the nav takes the top edge for the rest of the page — and the nav
          offsets by the ticker's height until it has gone. That is two features
          being placed relative to each other, which §7 puts here. */}
      <Route element={<RootLayout banner={<TrustTicker />} stickBelow={TICKER_HEIGHT} />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      {/* Pages that open on a dark band or a photograph: the nav sits over it
          and stays in its dark form. */}
      <Route element={<RootLayout />}>
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      {/* Pages that open on paper. `onLight` is the nav's light form, and the
          set of pages needing it is exactly the set that opens on a pale
          ground — which is easier to keep true here than in nine files. */}
      <Route element={<RootLayout onLight />}>
        {/* One page per product, carrying the whole configurator. Every tier
            that used to sit above it — the category pages, the blind-type
            listings, the old per-SKU URLs — now redirects here or to the shop. */}
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />
        {/* Booking. /book takes the configuration as query params (type, size,
            op, qty, fabric, hw) so a refreshed or shared link still quotes for
            the right blind; /booking/confirmed is Stripe's return URL. */}
        <Route path="/book" element={<BookInstallPage />} />
        <Route path="/booking/confirmed" element={<BookingConfirmedPage />} />
        <Route path="/cart" element={<CartPage />} />
      </Route>

      {/* IT OWNS ITS OWN CHROME AND MUST. VisualiserPage mounts its own <Nav />
          and is E-08 — out of this migration, not editable for any reason, an
          import rewrite included. Under RootLayout it would render two navs.
          BareLayout is the honest way to say so in the table.

          /visualizer — the z-spelled wardrobe review page — WAS HERE AND IS
          GONE. Deleting it closed E-07, the visualiser/visualizer spelling
          split, earlier than ADR-013's stated condition: the route was removed
          rather than the two spellings unified. `visualiser` is the house
          spelling and now the only one on a route. */}
      <Route element={<BareLayout />}>
        <Route path="/visualiser" element={<VisualiserPage />} />
      </Route>

      {/* --- retired URLs ------------------------------------------------- */}
      {/* Declared after every real route so none of them can be shadowed, and
          they redirect rather than render, so they need no chrome. */}
      <Route path="/blinds" element={<LegacyCategoryRedirect />} />
      <Route path="/blinds/:slug" element={<LegacyBlindTypeRedirect />} />
      {LEGACY_CATEGORY_SLUGS.map((slug) => (
        <Route key={slug} path={`/${slug}`} element={<LegacyCategoryRedirect slug={slug} />} />
      ))}

      {/* Last, and in the ordinary chrome: a 404 is a page a visitor reads, not
          a redirect. Declared after the retired URLs so those resolve first. */}
      <Route element={<RootLayout onLight />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
