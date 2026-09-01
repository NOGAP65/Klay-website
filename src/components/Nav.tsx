// ---------------------------------------------------------------------------
// A RE-EXPORT SHIM, AND IT IS PERMANENT. E-11, ADR-020.
//
// Nav moved to app/layouts/ at Phase 5 — decision D, where app chrome belongs
// and where the app layer is permitted to import feature barrels.
//
// IT COULD NOT MOVE CLEANLY, and the reason is not architectural. Two files
// import it by relative path:
//
//     src/pages/VisualiserPage.tsx      line 5
//     src/pages/VisualizerLabPage.tsx   line 42
//
// Both are E-08. ADR-020 removed the visualiser from this migration and
// withdrew permission to edit those files FOR ANY REASON — an import rewrite
// included. Rewriting those two lines is the smallest edit imaginable and it is
// still an edit, so the old path stays reachable instead.
//
// ONE COMPONENT, TWO PATHS. A re-export cannot diverge from what it re-exports,
// which is the distinction between this and the second copy §13 warns about.
//
// Anything not in that list of two imports @/app/layouts. This file goes when
// E-08 retires and those two files can be touched.
// ---------------------------------------------------------------------------

export { Nav, type NavProps } from '@/app/layouts/Nav';
