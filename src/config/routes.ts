// ---------------------------------------------------------------------------
// EVERY PATH THE SITE KNOWS ABOUT, once.
//
// Created because its trigger fired — "a path string referenced twice" — and it
// had fired ten times over: `/products` appeared in ten places, `/contact` in
// six, `/cart` in five, `/about` and `/visualiser` in four each.
//
// WHAT A LOOSE PATH LITERAL ACTUALLY COSTS. It is not tidiness. A route that is
// renamed has to be found, and `grep '/products'` also returns `/products/dusk`,
// `/products?category=wardrobes` and the word in prose. The one that gets missed
// is a dead link, which nothing in the build can see: TypeScript is happy, the
// router matches nothing, and the visitor gets the 404 page. The redirects in
// `app/routes/legacyRedirects` exist because that has already happened once, at
// a scale that needed a whole tier of URLs kept alive.
//
// FUNCTIONS FOR THE PARAMETERISED ONES, deliberately. `product('dusk')` cannot
// produce `/product/dusk` or forget the slash, and it puts the encoding in one
// place. A template literal at the call site can do both.
//
// THE ROUTER STILL OWNS THE PATTERNS. `router.tsx` declares `/products/:slug`
// as a route pattern; this module builds concrete URLs to link to. They are two
// different jobs and the patterns are not duplicated here — a pattern with one
// consumer is not a constant, it is a route definition.
// ---------------------------------------------------------------------------

export const home = '/';
export const products = '/products';
export const about = '/about';
export const contact = '/contact';
export const howItWorks = '/how-it-works';
export const cart = '/cart';
export const book = '/book';
export const bookingConfirmed = '/booking/confirmed';

/** The standalone visualiser. `/visualizer` — the z-spelled sandbox — is
 * deliberately absent: it is unlinked, reachable only by typing the URL, and
 * giving it a constant would invite something to link to it. ADR-013, E-07. */
export const visualiser = '/visualiser';

/** One product page. */
export const product = (slug: string) => `/products/${slug}`;

/** The shop, pre-narrowed. The parameter is a catalogue item id or a group
 * slug — whatever `groupForCategoryParam` resolves, which is the same set the
 * legacy redirects hand over. */
export const productsInCategory = (category: string) =>
  `/products?category=${encodeURIComponent(category)}`;

/** The contact form, with the enquiry pre-labelled. */
export const contactAbout = (subject: string) =>
  `/contact?product=${encodeURIComponent(subject)}`;
