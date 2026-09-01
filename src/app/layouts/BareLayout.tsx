// ---------------------------------------------------------------------------
// NO CHROME. The layout for routes that render their own.
//
// It exists for the two out-of-scope visualiser pages, and for no other reason.
// `VisualiserPage.tsx` and `VisualizerLabPage.tsx` each mount their own `<Nav />`
// and may not be edited — E-08, ADR-020 — so mounting them under RootLayout
// would put two navs on the page. They go here instead, and the fact that they
// compose their own chrome stays true until they are migrated on their own
// schedule.
//
// It is deliberately not empty of meaning: a route under BareLayout is making
// the claim "this page owns its own chrome", which a reader of router.tsx can
// see. A route with no layout at all would say nothing.
//
// SPECIFICATION.md §3 names this file. Nothing in scope should need it — if an
// in-scope page ends up here, the question is why it is rendering site chrome
// rather than why it needs this layout.
// ---------------------------------------------------------------------------

import { Outlet } from 'react-router-dom';

export function BareLayout() {
  return <Outlet />;
}
