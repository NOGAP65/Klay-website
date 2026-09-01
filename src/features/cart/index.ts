// ---------------------------------------------------------------------------
// CART — the basket, and the page that shows it.
//
// This feature's ONLY public entrance. §1 rule 3, ADR-019: other features may
// import this barrel and nothing behind it. `@/features/cart` resolves;
// `@/features/cart/store/cartStore` does not.
//
// ---------------------------------------------------------------------------
// THE CART DOES NOT CHECK OUT. §3 states this as a rule and it is the reason
// this feature exists as its own thing rather than as part of booking:
//
//     "cart holds basket contents. It does not check out. There is exactly one
//      checkout, in features/booking, and the cart links to it."
//
// THAT IS NOT YET TRUE OF THE CODE, and the gap is D-01 — the divergence that
// caused SPECIFICATION.md to be written. CartPage collects nine fields
// including a full street address, then calls alert() and clearCart(). It
// writes nothing anywhere. The real checkout is /book.
//
// This phase MOVED that file. It did not fix it, and deliberately so: whether
// the cart is wired to booking or removed is a product decision, MIGRATION_MAP
// R8 flags it as a scoping question, and it is not a migration task. The
// divergence log is where its status lives.
//
// ---------------------------------------------------------------------------
// WHAT IS PUBLIC, AND WHY EACH ONE HAD TO BE.
//
// `CartPage` — the route table mounts it. The app layer composing features is
// one of §2's three legal forms.
//
// `useCartStore` — four surfaces outside this feature put things in the basket
// or read its size: the nav's badge, the homepage range configurator, the
// homepage visualiser showcase, and the catalogue's product detail page. A
// basket that only the basket page can reach is not a basket.
//
// `CartItem` — the shape of a line. Public because `configuredLine` in
// catalogue builds one, and ADR-021 has it derive its return type from this
// rather than restate the twelve fields. That derivation is the whole point:
// a restated shape is a silent divergence waiting for one side to gain a field.
//
// ---------------------------------------------------------------------------
// WHAT IS DELIBERATELY NOT PUBLIC.
//
// Nothing yet — the feature is two files. The line to hold is the one §3 draws:
// if something that submits an order ever appears in here, it is in the wrong
// feature, and the answer is booking's barrel rather than a new export below.
// ---------------------------------------------------------------------------

// --- routed page (mounted by the app layer) ---------------------------------
export { default as CartPage } from './components/CartPage';

// --- the basket itself ------------------------------------------------------
export { useCartStore, type CartItem } from './store/cartStore';
