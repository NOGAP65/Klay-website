// ---------------------------------------------------------------------------
// THE SITE CHROME, OWNED IN ONE PLACE. Decision D, Phase 5.
//
// Every page used to render its own `<Nav />` and `<Footer />`. Thirteen files
// each importing the same two components, each deciding for itself which nav
// variant it wanted, and — the part that mattered — each creating an import
// edge from a feature into app chrome.
//
// THAT IS WHAT PRODUCED THE IMPORT CYCLES. `Nav` reads the basket, so it
// imports `@/features/cart`; `CartPage` rendered `<Nav />`, so cart's barrel
// imported it back. Four cycles, all the same sentence: a page imports the
// chrome, and the chrome imports the feature.
//
// Inverting it removes them by construction. The layout renders the chrome and
// the page renders through `<Outlet />`, so nothing flows from a feature to a
// layout. The app layer may import feature barrels — decision D, §2 — and
// nothing imports the app layer. One direction, and the cycle has nowhere to
// close.
//
// PER-ROUTE VARIATION LIVES IN THE ROUTE TABLE, NOT IN THE PAGE. `onLight` and
// `stickBelow` were props each page passed to its own Nav; they are now props
// the router passes to a layout element. The set of pages wanting a light nav
// is a fact about the site's composition, and router.tsx is where the site's
// composition is written down.
// ---------------------------------------------------------------------------

import { Outlet } from 'react-router-dom';

import { Footer } from './Footer';
import { Nav } from './Nav';

import type { NavProps } from './Nav';
import type { ReactNode } from 'react';

export interface RootLayoutProps extends NavProps {
  /** Rendered ABOVE the nav, in flow.
   *
   * Exists for exactly one case and is worth naming rather than generalising:
   * the homepage's trust ticker scrolls above the bar and the nav offsets by
   * its height until it has gone. That is a composition fact — a home section
   * placed above site chrome — and §7 puts "coordinates two features" in the
   * app layer. The alternative was the homepage keeping its own nav, which
   * would have left one page composing chrome and one edge pointing the wrong
   * way for no gain. */
  banner?: ReactNode;
}

export function RootLayout({ banner, ...navProps }: RootLayoutProps) {
  return (
    <>
      {banner}
      <Nav {...navProps} />
      <Outlet />
      <Footer />
    </>
  );
}
