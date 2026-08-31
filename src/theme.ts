// ---------------------------------------------------------------------------
// COMPATIBILITY SHIM. This file no longer defines anything.
//
// The palette, the scales and the helpers moved to src/design-system/tokens/ in
// Phase 2.2a of the architecture migration. Every value is byte-identical to
// what was here; this file re-exports them so that nothing had to change in the
// same commit that moved them.
//
// ---------------------------------------------------------------------------
// WHY THE SHIM EXISTS RATHER THAN A ONE-COMMIT REWRITE.
//
// `theme.ts` had 35 importers — the widest fan-in in the codebase. Splitting it
// and repointing all 35 in one commit would have been a single change touching
// half of src/, which is neither reviewable nor revertible.
//
// AND MORE IMPORTANTLY: roughly a fifth of all token call sites are inside the
// frozen visualiser — `space.xs` is 70% frozen, `lerp` and `tokens.traceTeal`
// are 100% frozen. Those files are excluded from Phases 2–4 and MUST NOT be
// edited, so their imports of `../theme` cannot be repointed at all yet. The
// shim is what lets the migrated half of the codebase move to `@/ds` while the
// frozen half keeps working, unchanged, off the same values.
//
// ---------------------------------------------------------------------------
// WHEN THIS FILE GOES.
//
// When the visualiser unfreezes (P4-7) and the last `from '../theme'` import is
// gone. Not before, and not by deleting it and fixing what breaks — the frozen
// files are frozen for a reason.
//
//   grep -rn "from '.*theme'" src/
//
// Zero hits is the condition. Until then this file is load-bearing.
// ---------------------------------------------------------------------------

export * from './design-system/tokens';
