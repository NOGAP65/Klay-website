// ---------------------------------------------------------------------------
// MARKETING — the pages that talk about Klay rather than sell a product.
//
// About, How It Works, Contact, and the four-step process data all three of
// them and the homepage draw on.
//
// This is the feature's ONLY public entrance. §1 rule 3: anything not exported
// here is private and unreachable from outside, which is what makes a second
// implementation impossible to build by accident. Enforced by
// `import/no-internal-modules` — `@/features/marketing` resolves,
// `@/features/marketing/components/AboutPage` does not.
//
// Re-exports only. §4: "index.ts re-exports and contains no logic."
//
// ---------------------------------------------------------------------------
// WHY `STEPS` IS PUBLIC AND `sendEnquiry` IS NOT.
//
// STEPS is read by the homepage — StepsBar and RecommendationBanner — which
// becomes feature:home at P4-6. That is a cross-feature dependency, and §2
// gives it exactly one legal form: through this barrel.
//
// sendEnquiry is this feature's own network call. Nothing outside marketing has
// any business posting a contact enquiry, so it stays private. If something
// ever appears to need it, that is the signal to ask why — not to add a line
// here.
//
// ---------------------------------------------------------------------------
// ON CONTACT LIVING HERE AT ALL — decision C.
//
// ContactPage posts to the booking endpoint, so it could reasonably have been
// feature:booking. It is marketing because that is what the page IS to a
// visitor: a way to talk to Klay, not a step in buying something. The endpoint
// it happens to reach is an implementation detail, and api/sendEnquiry is where
// that detail is kept.
//
// It reaches booking's transport through `src/lib/api` today. When booking
// becomes a feature in Phase 6, that import becomes `@/features/booking`.
// ---------------------------------------------------------------------------

export { default as AboutPage } from './components/AboutPage';
export { default as HowItWorksPage } from './components/HowItWorksPage';
export { default as ContactPage } from './components/ContactPage';
export { STEPS, type Step } from './constants';
