// ---------------------------------------------------------------------------
// HOME — the homepage and the eleven sections it composes.
//
// This feature's ONLY public entrance. §1 rule 3, ADR-019.
//
// ---------------------------------------------------------------------------
// THE BARREL THAT PROVES THE ORDERING WAS RIGHT.
//
// §0.8 put `home` last of the movable features for a reason worth restating now
// that it has landed: it is the LARGEST CONSUMER, not the largest dependency.
// It imports catalogue, cart, the design system and the shared layer, and
// almost nothing imports it. Moving it first would have meant rewriting its
// eleven files' imports once per subsequent feature; moving it last meant
// rewriting them once.
//
// The evidence that this was right: ONE export. Everything home knows stays
// inside home.
//
//   HomePage   the route table mounts it. That is the app layer composing a
//              feature, which §2 names as one of the three legal forms.
//
// Compare catalogue's barrel, which carries eight exports and a note that six
// of them exist only because the homepage was reaching into it. Now that home
// is a feature with a barrel of its own, that question — should the homepage be
// assembling catalogue primitives, or consuming one composed thing — is
// answerable rather than theoretical. It is the last structural question left
// in Phase 4, and it belongs to whoever opens catalogue's barrel next.
//
// ---------------------------------------------------------------------------
// WHAT IS DELIBERATELY NOT PUBLIC.
//
// All eleven sections. Hero, RangeRow, VisualiserShowcase, SocialProof and the
// rest are the homepage's own composition; nothing outside home has any
// business mounting half a homepage. `furniture.tsx` is private for the same
// reason — TILE_GAP is this page's grid rhythm, not a token.
// ---------------------------------------------------------------------------

export { default as HomePage } from './components/HomePage';

// --- composed by the app layer, not by a page ------------------------------
// The trust ticker sits ABOVE the nav and the nav offsets by its height, so the
// arrangement is chrome composition rather than page content — §7 puts that in
// src/app/, and router.tsx does it. These two exist so it can, and for no other
// consumer. TICKER_HEIGHT is re-exported under a clearer name than the module's
// own BAR_HEIGHT, which reads ambiguously outside the file that defines it.
export { TrustTicker, BAR_HEIGHT as TICKER_HEIGHT } from './components/TrustTicker';
