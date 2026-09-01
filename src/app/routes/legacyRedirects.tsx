// ---------------------------------------------------------------------------
// LEGACY ROUTE REDIRECTS — the catalogue tier that /products replaced.
//
// The site used to carry three tiers above a product: a category page
// (/indoor, /outdoor, /wardrobes), a blind-type listing page (/blinds and
// /blinds/<type>), and then the product itself. All three asked the visitor to
// narrow before showing them anything, and /products now does the narrowing in
// filters on one page with the whole range visible behind them.
//
// So those pages are gone and these rules stand in their place. They are
// redirects rather than deletions because the URLs are in the wild — printed,
// linked, indexed — and a 404 spends a visitor who was already on their way in.
//
// EVERY RULE LANDS SOMEWHERE THAT ANSWERS THE ORIGINAL REQUEST:
//
//   /blinds/roller-blinds   the one buyable blind type, so it goes to the
//                           product itself rather than the shop. Dusk is the
//                           blockout — the cheapest of the four rollers and the
//                           from-price the old listing page quoted — and the
//                           product page becomes any of the other three when
//                           the fabric is switched. See ProductDetailPage.
//
//   /blinds/<other type>    the shop, pre-narrowed by ?category=<slug>. The
//                           slugs are catalogue item ids, which is exactly what
//                           groupForCategoryParam already resolves, so a
//                           roman-blinds link opens the shop filtered to Indoor.
//
//   /indoor|/outdoor|       the shop pre-narrowed to that group. Same parameter,
//   /wardrobes              same resolver — it has understood these three since
//                           the shop was built.
//
//   /blinds                 bare shop. Nothing to preserve; the visitor asked
//                           for a list and that is the list.
//
// `replace` on every one of them: the dead URL must not sit in history, or Back
// from the shop returns to a redirect that immediately throws the visitor
// forward again — a trapped Back button.
// ---------------------------------------------------------------------------

import { Navigate, useParams } from 'react-router-dom';

/** The blind type that has a real product behind it, and where it goes. Every
 * other type is a made-to-measure enquiry with no page of its own. */
const TYPE_WITH_PRODUCT: Record<string, string> = {
  'roller-blinds': '/products/dusk',
};

/** /blinds/<slug>. Reads the slug off the route rather than taking a prop so one
 * element covers all the old type pages. */
export function LegacyBlindTypeRedirect() {
  const { slug } = useParams();
  if (!slug) return <Navigate to="/products" replace />;
  const product = TYPE_WITH_PRODUCT[slug];
  return <Navigate to={product ?? `/products?category=${slug}`} replace />;
}

/** /indoor, /outdoor, /wardrobes — and bare /blinds, which passes no slug
 * because there is nothing about it to preserve. */
export function LegacyCategoryRedirect({ slug }: { slug?: string }) {
  return <Navigate to={slug ? `/products?category=${slug}` : '/products'} replace />;
}

/** The three old top-level category slugs. Listed here rather than derived from
 * data/categories.ts because that file went with the pages — this is the whole
 * of what survives it. */
export const LEGACY_CATEGORY_SLUGS = ['indoor', 'outdoor', 'wardrobes'];
