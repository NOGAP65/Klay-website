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
// §2 sets a CEILING of roughly 15% of src/ by line count: past that, something
// has been misfiled. This layer is at 0.93% (313 lines), and 2.29% excluding
// the out-of-scope visualiser.
//
// ---------------------------------------------------------------------------
// P4-5 — THE CLEAN-UP PASS. RE-TESTED WITH FOUR FEATURES MIGRATED, AND NOTHING
// WAS ADDED.
//
// The phase exists because of a specific expectation: "after four features have
// moved, whatever is genuinely common has revealed itself." marketing,
// catalogue and cart have moved. What they revealed:
//
//   TWO legacy modules are reached by more than one feature — `Nav` and
//   `Footer`, both by all three. Both FAIL the lift test outright (Klay's four
//   links, Klay's ABN), so they are not shared-layer candidates. They are app
//   chrome in the wrong place, and decision D sends them to app/layouts/ at
//   Phase 5.
//
//   NOTHING ELSE is reached by two features at all.
//
//   NO helper is declared twice across features. The two names that appear in
//   more than one — `isMobile` and `product` — are local variables, one of them
//   the result of calling useIsMobile from this very barrel.
//
// SO THE ANSWER TO "what should move into shared/ now" IS: NOTHING. That is a
// result, not an omission. The thing P4-5 was watching for is the shape that
// produced D-03 — one rule needed in three places with nowhere legal to put it
// — and after four features there is not a second instance of it in src/.
//
// The remaining cross-boundary pull is entirely Nav and Footer, and it has an
// answer already scheduled. A shared layer of five genuinely generic things is
// what §2 is aiming at.
// ---------------------------------------------------------------------------
//
// 15% IS A CEILING, NOT A TARGET. Do not add to this folder to justify it. A
// shared layer that is too thin is not a problem — it is what a codebase looks
// like when almost everything genuinely belongs to a feature, which is the
// outcome §2 is aiming at. The junk drawer (§13) is the failure mode with a
// name; "shared/ looks a bit empty" is not.
//
// The only test for entry is the one above: could this be lifted into an
// unrelated project unmodified?
// ---------------------------------------------------------------------------

export { useMediaQuery } from './hooks/useMediaQuery';
export { useIsMobile } from './hooks/useIsMobile';
export { Turnstile, useTurnstileEnabled } from './components/Turnstile';
export { Honeypot } from './components/Honeypot';
export { isValidEmail } from './lib/validate';
