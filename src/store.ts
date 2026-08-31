import { useScrollStore } from './app/store/scrollStore';

// ---------------------------------------------------------------------------
// COMPATIBILITY SHIM. Scroll position moved to app/store/scrollStore.ts in
// Phase 3 (decision A, option 2 — it stays a store so the nav keeps behaving
// exactly as it does today; see the note there).
//
// `useKlayStore` is re-exported so its four consumers did not have to change in
// the same commit that moved it. They are repointed at `@/app/store/scrollStore`
// when Nav and the pages migrate in Phases 4 and 5, and this file goes with the
// last of them.
//
// ---------------------------------------------------------------------------
// THE SELECTOR IS PASSED THROUGH, AND THAT MATTERS MORE THAN IT LOOKS.
//
// All four consumers use the selector form: `useKlayStore((s) => s.scrollY)` or
// `(s) => s.setScrollY`. Zustand compares the selector's OUTPUT, so a page that
// selects only `setScrollY` gets a stable function reference and does not
// re-render when `scrollY` changes.
//
// HomePage publishes scroll position on every animation frame. A shim that
// subscribed to the whole store instead of forwarding the selector would
// re-render three pages sixty times a second — a performance regression
// disguised as a refactor. Hence the pass-through.
//
// ---------------------------------------------------------------------------
// `blindHeight` IS DEAD AND IS STILL HERE.
//
// Written by nobody and read by nobody — confirmed across the whole of src/ in
// the Phase 0 audit. It was NOT carried into the new store, because a new file
// in a new layer should not be born holding something already known to be dead.
//
// It is not deleted either. Nothing in this migration deletes; that is a single
// pass after the structure settles, so one review can see everything being
// removed at once rather than finding deletions scattered through twenty
// structural commits.
//
// So it survives as an inert constant on a type that is already scheduled for
// removal. Nothing reads it, and if anything ever did it would read 0 — which
// is what it read before.
// ---------------------------------------------------------------------------

interface KlayState {
  scrollY: number;
  setScrollY: (y: number) => void;
  /** @deprecated Dead. Written by nobody, read by nobody. Awaiting cleanup. */
  blindHeight: number;
  /** @deprecated Dead. Never called. */
  setBlindHeight: (h: number) => void;
}

/** Stable references, so a selector that touched them would still memoise. */
const DEAD = {
  blindHeight: 0,
  setBlindHeight: () => {},
} as const;

/** @deprecated Import `useScrollStore` from `@/app/store/scrollStore`. */
export function useKlayStore<T>(selector: (state: KlayState) => T): T {
  return useScrollStore((scroll) => selector({ ...scroll, ...DEAD }));
}
