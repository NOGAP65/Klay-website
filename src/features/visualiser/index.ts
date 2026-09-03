// ---------------------------------------------------------------------------
// THE VISUALISER'S PUBLIC ENTRANCE — SPECIFICATION.md §1 rule 3.
//
// The zone came inside features/ at U5. It was `src/visualiser/`, reachable at
// any depth by anyone: thirteen import lines across five files, each naming an
// internal module directly, so every file in the zone was public whether or not
// anyone meant it to be.
//
// THIS FILE IS WHAT MAKES THE MOVE WORTH DOING. Moving the directory changes
// where the code lives; the barrel changes what can reach it. Twenty-one files
// are now internal, and the eleven names below are the whole of what the rest
// of the site may use.
//
// WHY THE SURFACE IS EXACTLY THIS AND NOT MORE. Every export here was already
// imported from outside the zone before the move — nothing was added because it
// looked useful, and §9's rule applies to entrances as much as primitives: a
// name earns its place by having a consumer that already exists. Anything the
// zone needs internally stays internal, including the four protected-IP
// renderers, which nothing outside has ever imported.
//
// THE TWO DEFAULTS KEEP THEIR SHAPE. KlayConfigurator and VisualiserControls
// were default exports and are re-exported as named ones, because a barrel that
// re-exports a default has to name it anyway and `import { KlayConfigurator }`
// says where it came from at the call site.
//
// ONE COLLISION IS DELIBERATE AND WORTH KNOWING ABOUT. `Field` here is the
// visualiser's own control-panel field, not @/ds's form Field. They are
// different components with the same job in different contexts, and the
// visualiser's is bound to the panel's layout. Renaming it is a Phase 7-shaped
// question — U8 — not a move-phase one, so it keeps its name and this note.
// ---------------------------------------------------------------------------

export { default as KlayConfigurator } from './KlayConfigurator';
export { default as VisualiserControls, Field, GroupHeading, PriceBox } from './VisualiserControls';

export {
  useVisualiserStore,
  isJoinery,
  priceWindow,
  MAX_WINDOWS,
  type JobWindow,
  type ProductCategory,
} from './useVisualiserStore';

// Read by the catalogue to build its wardrobe configuration options: the
// finishes, the model list by kind, and the width and colour tables. These are
// data, not components — the catalogue asks the visualiser what a wardrobe can
// be, rather than keeping a second copy of the answer.
export { modelsOfKind, WARDROBE_WIDTHS, WARDROBE_COLOURS } from './wardrobes';
export { HANDLE_FINISHES } from './wardrobeHardware';
