// ---------------------------------------------------------------------------
// THE SHARED LAYER'S PUBLIC ENTRANCE — `@/shared`.
//
// SPECIFICATION.md §2: genuinely generic. "If it mentions a domain noun it is
// not shared, it is a feature." The test is whether it could be lifted into an
// unrelated project unmodified.
//
// EVERYTHING HERE PASSED THAT TEST EXPLICITLY:
//
//   useMediaQuery   subscribes to a media query. Nothing Klay about it.
//   useIsMobile     a 768px convention over the above.
//   Turnstile       Cloudflare plumbing. Knows nothing about blinds.
//   Honeypot        a hidden input named `website`. Generic anti-spam.
//   isValidEmail    one @, no spaces, a dot. Was three copies.
//
// WHAT WAS KEPT OUT, and why, because the list is the more useful half:
//
//   lib/pricing         BASE_PRICE, INSTALL_PER_BLIND, GST_RATE. Klay's
//                       commercial model. Goes to shared-core/ — ADR-014.
//   lib/bookingLink     encodes Klay's own type/size/op query vocabulary.
//   data/products       Rynamic colour names. feature:catalogue.
//   Nav, Footer         Klay's four links, Klay's ABN. app/layouts/.
//   FormField           went to @/ds as Field — it is a design primitive, and
//                       the design system is not the same thing as `shared`.
//
// §2 also sets a ceiling: if shared/ passes roughly 15% of src/ by line count,
// something has been misfiled. It is currently about 1%. The risk here is the
// opposite of a junk drawer — a shared layer so thin it is not worth the folder.
// That is the correct problem to have.
// ---------------------------------------------------------------------------

export { useMediaQuery } from './hooks/useMediaQuery';
export { useIsMobile } from './hooks/useIsMobile';
export { Turnstile, useTurnstileEnabled } from './components/Turnstile';
export { Honeypot } from './components/Honeypot';
export { isValidEmail } from './lib/validate';
