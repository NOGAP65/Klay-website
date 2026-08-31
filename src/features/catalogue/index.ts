// ---------------------------------------------------------------------------
// CATALOGUE — what Klay sells, and the pages that show it.
//
// The fourteen products, the facet model the shop filters on, the per-product
// configuration options, and the product pages themselves.
//
// This feature's ONLY public entrance. §1 rule 3, ADR-019: other features may
// import this barrel and nothing behind it. `@/features/catalogue` resolves;
// `@/features/catalogue/components/ProductCard` does not.
//
// ---------------------------------------------------------------------------
// WHAT IS PUBLIC, AND WHY EACH ONE HAD TO BE.
//
// The two pages are public because the route table mounts them. That is the
// app layer composing features, which §2 names as one of the three legal forms
// of cross-boundary use.
//
// Everything else here is public for ONE consumer: the homepage's range row and
// its card configurator, which become feature:home at P4-6. They read the
// catalogue, the option fields and the product glyphs. Under §2 that has
// exactly one legal form, and this is it.
//
// THAT IS A LARGER PUBLIC SURFACE THAN A FEATURE SHOULD WANT. ADR-019's warning
// applies directly: "A feature barrel that grows exports for other features to
// consume is drifting toward being a shared layer with a feature's name on it."
//
// When home migrates at P4-6, the question to ask is whether the homepage
// should be reading the catalogue's internals at all, or whether it wants one
// composed thing — a `RangeCards` component owned by catalogue — instead of
// eight primitives it assembles itself. **Six of the exports below would go.**
// Recorded here rather than in a tracker because this file is where anyone will
// next be tempted to add a ninth.
//
// ---------------------------------------------------------------------------
// WHAT IS DELIBERATELY NOT PUBLIC.
//
// `ProductsPage`'s sort comparators (lib/sortProducts) and the facet predicates
// that only the rail uses. Nothing outside catalogue has any business sorting
// a product list, and if something appears to, that is a question rather than
// a new export line.
// ---------------------------------------------------------------------------

// --- routed pages (mounted by the app layer) --------------------------------
export { default as ProductsPage } from './components/ProductsPage';
export { default as ProductDetailPage } from './components/ProductDetailPage';

// --- consumed by feature:home (P4-6) ----------------------------------------
export { ProductGlyph } from './components/ProductGlyph';
export { CATALOGUE, GROUPS, LIGHT_VALUES, type CatalogueItem, type Group } from './constants';
export {
  defaultSelection,
  fieldsFor,
  priceFor,
  configuredLine,
  type ConfigChoice,
  type ConfigField,
  type Selection,
} from './configOptions';
