import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Scroll position, published by the pages that install a listener and read by
// the nav.
//
// Moved from src/store.ts in Phase 3. Decision A, option 2.
//
// ---------------------------------------------------------------------------
// WHY THIS IS STILL A STORE AND NOT A HOOK.
//
// A hook is the better shape. Both writers do exactly `setScrollY(window.scrollY)`
// and nothing else, and the nav reads it only as `scrollY > 60` and
// `Math.max(0, stickBelow - scrollY)` — nothing is expressed here that
// `window.scrollY` could not express directly, and a store for one reader is
// ceremony.
//
// IT STAYS A STORE BECAUSE THE ALTERNATIVE CHANGES BEHAVIOUR ON NINE PAGES.
//
// Twelve pages mount Nav. Only three publish scroll position — HomePage,
// ProductsPage and ProductDetailPage. On the other nine, `scrollY` is
// permanently 0, so `compressed` is always false and the nav never tightens its
// padding from 11px to 8px. A hook reading live window scroll would make it
// compress everywhere.
//
// That is a visible change to nine pages, and a move phase must not change
// behaviour. Whether the nav SHOULD compress site-wide is a design question for
// Bobby and V, not a side effect of a refactor. Recorded as deferred design work
// in MIGRATION_MAP.md, R12.
//
// So: the store survives, the publish/subscribe asymmetry survives with it, and
// the nav behaves in Phase 3 exactly as it behaved in Phase 0.
//
// ---------------------------------------------------------------------------
// ALWAYS SELECT. NEVER SUBSCRIBE TO THE WHOLE STORE.
//
// This note lives here rather than in the shim because the shim is scheduled
// for deletion (PHASE_6_SCOPE.md item 4) and the reasoning has to outlive it.
//
//   useScrollStore((s) => s.setScrollY)      correct
//   useScrollStore()                          re-renders on every scroll
//
// Zustand compares the SELECTOR'S OUTPUT. A component that selects only
// `setScrollY` gets a stable function reference and does not re-render when
// `scrollY` changes — which matters here more than it usually would, because
// HomePage publishes scroll position on every animation frame.
//
// Three pages install that listener. Subscribing to the whole store in any of
// them re-renders the page sixty times a second. Two of the three — HomePage
// and ProductDetailPage — mount the visualiser, so the cost lands on a canvas.
//
// The Phase 3 shim (src/store.ts) forwards the caller's selector into this
// store precisely for this reason: a shim that had subscribed broadly would
// have been a performance regression disguised as a refactor, and it would
// have been invisible in a typecheck, a build and a lint run.
//
// ---------------------------------------------------------------------------
// `blindHeight` IS NOT HERE, AND THAT IS DELIBERATE.
//
// The old store carried a second key, `blindHeight`, written by nobody and read
// by nobody. It is dead and it was not carried across — a new file in a new
// layer should not be born holding something already known to be dead.
//
// It has not been deleted either; deletion is a separate pass. It stays in
// src/store.ts, which is now a shim, with a note. See there.
// ---------------------------------------------------------------------------

interface ScrollState {
  /** Window scroll offset in pixels. 0 on any page that does not publish it. */
  scrollY: number;
  setScrollY: (y: number) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  scrollY: 0,
  setScrollY: (y) => set({ scrollY: y }),
}));
