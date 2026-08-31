# Klay Interiors — Architecture Specification

**Version:** 1.0
**Date:** 31 August 2026
**Status:** Standing document. This is the constitution, not a work order.
**Owner:** V
**Applies to:** NOGAP65/Klay-website-new. Ella adopts it after Klay proves it.

---

## 0. WHAT THIS DOCUMENT IS AND WHY IT EXISTS

This defines the shape of the Klay codebase: where files live, what they are called, what may
import what, how large anything is allowed to be, and where each kind of logic belongs.

It exists because of a specific, observed failure. On 31 August 2026 the codebase contained
two complete checkout implementations — `/book`, finished and correct, and `/cart`, 473
equally polished lines that wrote nothing to the database. Neither knew the other existed. In
both cases the code was individually well written. The architecture was what failed.

The governing principle: **every rule in this document must be enforceable by a machine.** A
rule that relies on someone remembering it is not a rule, it is a hope. Section 11 is
therefore not an appendix — it is the part that makes the rest real.

---

## 1. THE FIVE RULES

1. **Organise by what it does for the business, not by what kind of file it is.** A folder
   called `components` holding forty unrelated components tells you nothing. A folder called
   `checkout` tells you everything.
2. **Dependencies flow one way: app → features → shared.** Never upward. Never sideways
   between features. A feature that needs another feature's internals is a design error, not
   an import problem.
3. **Every feature has exactly one public entrance.** Its `index.ts`. Anything not exported
   there is private and unreachable from outside. This is what makes a duplicate
   implementation impossible to build by accident.
4. **A file does one thing, and its name says which thing.** If you cannot name a file in
   three words without "and", it is two files.
5. **Business rules that involve money or personal information do not live in components,**
   and never execute in the browser as the authority. The browser may display a price. It may
   never decide one.

---

## 2. THE LAYER MODEL

| Layer | Directory | May import from | Purpose |
|---|---|---|---|
| **App** | `src/app/` | features, design-system, shared, config | Composition only. Routing, providers, layouts. No business logic, no product knowledge. |
| **Features** | `src/features/*/` | design-system, shared, config, and its own internals only | Everything the business does. Each feature self-contained. |
| **Design system** | `src/design-system/` | nothing except itself | Tokens and visual primitives. Knows nothing about blinds, prices, or customers. |
| **Shared** | `src/shared/` | config, other shared | Genuinely generic. If it mentions a domain noun it is not shared, it is a feature. |

**The test for "is this shared?"** Could this be lifted into an unrelated project without
modification? A date formatter, yes. A `formatBlindWidth` function, no.

If `shared/` exceeds roughly **15% of `src/`** by line count, something has been misfiled.

**Cross-feature communication has exactly three legal answers:** B exports it from its
`index.ts` and A imports that; the thing isn't really either feature's and moves to `shared/`;
or the app layer composes them and passes data down as props. Never import from
`features/b/components/Thing.tsx` directly.

---

## 3. TARGET DIRECTORY STRUCTURE

```
src/
├── main.tsx
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   ├── providers.tsx
│   └── layouts/
│       ├── RootLayout.tsx
│       └── BareLayout.tsx
├── config/
│   ├── env.ts          THE ONLY file that reads import.meta.env
│   ├── site.ts
│   └── routes.ts
├── design-system/
│   ├── tokens/
│   │   ├── colour.ts
│   │   ├── space.ts
│   │   ├── type.ts
│   │   ├── radius.ts
│   │   ├── shadow.ts
│   │   ├── motion.ts
│   │   ├── layout.ts
│   │   └── index.ts
│   ├── primitives/
│   │   ├── Box.tsx
│   │   ├── Stack.tsx
│   │   ├── Text.tsx
│   │   ├── Heading.tsx
│   │   ├── Button.tsx
│   │   ├── Field.tsx
│   │   └── index.ts
│   ├── patterns/
│   │   ├── Section.tsx
│   │   ├── SectionBand.tsx
│   │   ├── Card.tsx
│   │   └── index.ts
│   └── index.ts
├── features/
│   ├── catalogue/
│   ├── configurator/
│   ├── visualiser/
│   │   ├── photo/
│   │   ├── tracing/          [PROTECTED IP]
│   │   ├── rendering/
│   │   │   ├── blind/        [PROTECTED IP]
│   │   │   ├── curtain/
│   │   │   └── shared/
│   │   └── compare/
│   ├── cart/                 basket contents only — no checkout
│   ├── booking/              booking, payment, confirmation
│   └── marketing/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── format/
│   │   └── validate/
│   ├── types/
│   └── utils/
└── types/

shared-core/                  imported by BOTH src/ and netlify/
└── pricing/                  the price table and rules over it

netlify/
├── functions/
└── edge-functions/           latency-sensitive, and ALL pricing authority

supabase/
├── migrations/               schema version-controlled here, not in the dashboard
└── seed.sql

docs/
├── architecture/
│   ├── overview.md
│   ├── data-model.md
│   ├── glossary.md
│   └── decisions/            ADR-001 …
├── runbooks/
├── compliance/
└── audit/
```

`config/env.ts` is the only file that reads `import.meta.env`. Everywhere else imports a
named, typed constant. One file to audit for what ships to the browser. It validates on module
load and throws loudly if a required variable is missing.

`cart` holds basket contents. **It does not check out.** There is exactly one checkout, in
`features/booking`, and the cart links to it.

`shared-core/` sits outside `src/` deliberately. It is neither client nor server code — it is
the contract between them. Both import it by alias.

---

## 4. FEATURE ANATOMY

```
features/booking/
├── api/                    network calls, one function per operation
├── components/             presentation
├── hooks/                  stateful logic
├── lib/                    pure functions, business rules, no React
├── store/                  the feature's Zustand slice, if needed
├── types/
├── constants.ts
└── index.ts                THE PUBLIC API — re-exports only
```

- Not every feature needs every folder. Empty folders are noise.
- `index.ts` re-exports and contains no logic. If it has an `if`, it is wrong.
- `api/` is the only place in a feature that touches the network.
- `lib/` is pure and testable with no React and no network.
- `components/` do not fetch, do not calculate business rules, do not read environment
  variables.

---

## 5. NAMING — FILES

| Kind | Convention | Example |
|---|---|---|
| React component | `PascalCase.tsx`, one per file, filename = component name | `BookingForm.tsx` |
| Hook | `useCamelCase.ts` | `useBookingSubmission.ts` |
| Module | `camelCase.ts` | `createBooking.ts` |
| Types | `thing.types.ts` | `booking.types.ts` |
| Constants | `constants.ts` per feature | — |
| Test | `Thing.test.ts(x)`, beside the file it tests | `calculatePrice.test.ts` |
| Netlify function | `kebab-case.ts` | `create-checkout-session.ts` |
| Migration | `NNNN_description.sql` | `0003_add_booking_status.sql` |
| ADR | `NNN-decision-in-a-phrase.md` | `007-server-side-pricing.md` |

**Banned filenames:** `utils.ts`, `helpers.ts`, `misc.ts`, `common.ts`, `index.ts` containing
logic, `Component2.tsx`, `ThingNew.tsx`, `ThingOld.tsx`, `ThingCopy.tsx`, anything containing
`temp`, `wip`, or `final`.

Each is a decision deferred. `utils.ts` means "I did not want to decide where this goes," and
six months later it is 800 lines that everything imports.

**Australian English in prose and identifiers** — colour, visualiser, organisation. Code
interfacing with a Web or library API uses that API's spelling (`backgroundColor` in a style
object). Pick one spelling per identifier and never both.

---

## 6. NAMING — CODE

| Kind | Convention | Example |
|---|---|---|
| Boolean | `is`/`has`/`can`/`should` prefix | `isSubmitting`, `hasValidPhoto` |
| Array | plural noun | `bookings`, `tracedWindows` |
| Count | `thingCount` | `windowCount` — never `numWindows` |
| Module constant | `SCREAMING_SNAKE_CASE` | `MAX_TRACED_WINDOWS` |
| Local | `camelCase` | `selectedColour` |

| Function kind | Convention | Example |
|---|---|---|
| Returns a value, no side effect | noun-ish or `get` | `getBasePrice` |
| Calculates | `calculate` | `calculateOrderTotal` |
| Fetches over network | `fetch` | `fetchBookingByRef` |
| Creates a record | `create` | `createBooking` |
| Predicate | `is`/`has`/`can` | `isValidPostcode` |
| Transforms | `toX`/`fromX` | `toPriceBreakdown` |
| Handler implementation | `handleX` | `handleSubmit` |
| Handler prop | `onX` | `onSubmit` |

**Pick one verb per concept and never synonyms.** If network retrieval is `fetch`, there is no
`get`, no `load`, no `retrieve`. Synonyms make a codebase unsearchable.

**Abbreviations permitted:** `id`, `url`, `api`, `ref`, `src`, `px`, `db`, `ui`, `cta`.
Everything else spelled out. Not permitted: `cfg`, `btn`, `msg`, `res`, `req`, `tmp`, `val`,
`idx` — except `e` in a two-line catch block.

**The code uses the words Bobby and Adam use.** If the business calls it a check measure, the
function is `scheduleCheckMeasure`. If Rynamic calls a colour Surfmist, the constant is
`SURFMIST`, not `GREY_2`. Vocabulary lives in `docs/architecture/glossary.md`. When business
and code disagree on a word, the business wins.

---

## 7. WHERE EACH KIND OF LOGIC BELONGS

| The code... | Belongs in | Never in |
|---|---|---|
| Renders markup | `features/*/components/` | — |
| Holds local UI state | The component, or a hook if reused | A global store |
| Holds cross-component state | `features/*/store/` | A component |
| Calls Supabase or `fetch` | `features/*/api/` | A component, a hook, a store |
| Calculates a price | `shared-core/pricing/` | A component. Ever. |
| Validates user input | `features/*/lib/` for shape, edge function for authority | A component as the only check |
| Formats for display | `shared/lib/format/` | Inline in JSX |
| Reads an environment variable | `config/env.ts` | Anywhere else |
| Defines a colour, size, or spacing | `design-system/tokens/` | Inline as a literal |
| Coordinates two features | `src/app/` | Either feature |
| Talks to Stripe | `netlify/` only | The browser |
| Decides what a customer pays | `netlify/edge-functions/` | The browser |

**The pricing rule, stated fully because it is the one that matters.** There is one price
table. It lives in `shared-core/pricing/` and is imported by both `src/` (to display) and
`netlify/` (to decide).

The browser's number is display only and never trusted. The edge function recalculates from
the same table and its answer is authoritative. If they disagree, the edge function wins and
the discrepancy is logged.

Duplicating the price table into the edge function "so it's server-side" is the wrong fix —
you then have two tables that will silently diverge, which is worse than the failure you were
preventing. **Share the module; separate the authority.**

---

## 8. SIZE LIMITS

| Unit | Warn | Error |
|---|---|---|
| Component file | 200 lines | 300 lines |
| Hook file | 120 | 200 |
| Non-component module | 200 | 300 |
| Any single function | 40 | 60 |
| Function parameters | 3 | 4 (beyond that, an options object) |
| Cyclomatic complexity | 8 | 12 |
| Nesting depth | 3 | 4 |

Roughly 300 lines is where a file stops fitting in a screen-and-a-half and a reader stops
holding it in their head. Roughly 60 lines is where a function stops having one job.

**Signals a file needs splitting before it hits the limit:** more than five `useState` calls;
a component that both fetches and renders; a `switch` with more than four meaningfully
different branches; two exported components in one file; JSX you have to scroll to understand.

**Visualiser carve-out:** the four protected IP files are exempt until explicitly unfrozen,
registered in §12. Non-protected visualiser files are **not** exempt — rendering pipelines
decompose well, stages are natural boundaries, and a shader is a file.

---

## 9. THE DESIGN SYSTEM CONTRACT

`theme.ts` was well built and had **zero consumers across all twelve files in `src/pages/`**,
with 127 distinct hardcoded pixel values and 21 hardcoded font sizes in their place. The
tokens were not the problem. **Optionality was.**

- `design-system/tokens/` is the only place a raw colour, spacing, font size, radius, shadow,
  duration or breakpoint value may be written as a literal.
- Everywhere else in `src/`, a numeric literal for those properties in a `style={{}}` object
  is a **lint error**, not a review comment.
- Every token names its **role**, not its value. `space.sectionGap`, not `space.px64`. A value
  can change; a role does not.
- The scale is proportional and **closed** — six to eight steps of spacing, six to eight of
  type. A value between two steps means the design changes or the scale does, deliberately, in
  one file.
- `#000000` and `#1A1A1A` are banned, enforced as a lint error.

Today a developer needing 24px types `24px`. After this the build fails, so they open the
scale and find `space.md`. The scale becomes load-bearing because there is no alternative path.

---

## 10. IMPORTS AND PATHS

```
@/app/*         src/app/*
@/config/*      src/config/*
@/ds/*          src/design-system/*
@/features/*    src/features/*
@/shared/*      src/shared/*
@/core/*        shared-core/*
```

Configured in **both** `tsconfig.json` and `vite.config.ts`, or the editor and the build
disagree.

**Relative imports permitted only within the same feature or folder.**
`../../../shared/lib/format` is a lint error. Beyond tidiness: a relative path breaks when a
file moves, and it hides the layer violation — `@/features/cart/components/Thing` is visibly
illegal from inside booking; `../../cart/components/Thing` is not.

**Import order, enforced:** external packages → `@/config` → `@/ds` → `@/core` → `@/shared` →
own feature → relative → types. Blank line between groups, autofixed.

**Barrel discipline:** import from a feature's `index.ts`, never its internals. Within a
feature, import directly — internal barrels create circular-import risk for no benefit.

---

## 11. ENFORCEMENT — THE PART THAT MAKES THIS REAL

| Rule | Mechanism |
|---|---|
| Layer direction | `eslint-plugin-boundaries` / `import/no-restricted-paths` |
| No sideways feature imports | `eslint-plugin-boundaries` |
| Feature public API only | `import/no-internal-modules` |
| No relative parent imports | `import/no-relative-parent-imports` |
| Import ordering | `import/order` |
| File size | `max-lines` |
| Function size | `max-lines-per-function` |
| Complexity | `complexity`, `max-depth`, `max-params` |
| Naming | `@typescript-eslint/naming-convention` |
| Banned filenames | Custom rule or CI script |
| No hardcoded design values | Custom rule over `style={{}}` literals |
| No banned blacks | Custom rule matching `#000`, `#000000`, `#1A1A1A` |
| No `import.meta.env` outside `config/env.ts` | `no-restricted-syntax` with file override |
| No Supabase calls outside `api/` | `no-restricted-imports` with path scoping |
| No circular imports | `import/no-cycle` |
| Unused exports | `knip` |
| Duplication | `jscpd` |

**The CI gate.** Nothing merges to `main` unless `npm run typecheck` returns zero, `eslint`
returns zero errors, `npm run build` passes, `knip` finds no new unused exports, and `jscpd`
reports no new duplication above threshold.

**CI must run these.** As of August 2026 nothing outside a developer's terminal has ever
typechecked this repository — `vite build` never invokes `tsc`, and `netlify/` is bundled
separately at deploy. Wiring CI is a precondition of this specification meaning anything.

**Introducing rules without stopping work:** every new rule starts as `warn` with a recorded
baseline count. The count may go down; it may not go up. At zero it flips to `error`
permanently. Turning everything to `error` on day one produces 400 failures and the rules get
switched off.

---

## 12. EXCEPTIONS REGISTER

| # | Exception | Reason | Review |
|---|---|---|---|
| E-01 | `homography.ts` exempt from size and complexity limits | Protected IP, mathematically dense, splitting risks correctness | On unfreeze |
| E-02 | `Canvas2DBlindRenderer.tsx` exempt from size limits | Protected IP, rendering pipeline | On unfreeze |
| E-03 | `CornerPinOverlay.tsx` exempt from size limits | Protected IP | On unfreeze |
| E-04 | `usePhotoUpload.ts` exempt from size limits | Protected IP | On unfreeze |
| E-05 | `style-src 'unsafe-inline'` in CSP | Inline-styles-only is a brand-level decision; runtime-computed styles cannot be nonced | If styling approach changes |
| E-06 | `design-system/tokens/*` exempt from the no-literal-values rule | It is the source of the values | Permanent |
| E-07 | `visualiser`/`visualizer` spelling split | Live route; unification deferred | When wardrobes ship and the fork resolves |

**Adding to this table requires an ADR. An exception without an ADR is a violation.**

---

## 13. NAMED ANTI-PATTERNS

**The Second Implementation.** Building a feature that already exists because you did not know
it existed. Prevented by feature barrels and one session per working tree. Has happened twice.

**The Junk Drawer.** `utils.ts`, `helpers.ts`, or a `shared/` past 15% of the codebase.

**The God Component.** Fetches, calculates, holds state and renders. Caught by the size limit,
but the size limit is the symptom.

**The Invisible Environment Variable.** `import.meta.env` read directly in a component. Now
nobody knows what ships to the browser.

**The Silent Divergence.** Two copies of the same constant, table or rule. Both correct when
written, one updated six months later.

**The Trusted Client.** Any business decision — price, discount, eligibility — made in the
browser and accepted by the server.

**The Optional Token.** A design system nothing is required to use.

**The Polished Stub.** Code that looks finished, has no TODO, throws no error, and does
nothing. `/cart` was 473 lines of this.

---

## 14. WHAT THIS DOCUMENT DOES NOT COVER

- **Testing strategy.** The codebase has zero tests. Needs its own specification.
- **Performance budgets.** Bundle size, LCP, visualiser render budgets.
- **Accessibility standard.** WCAG level, focus management, contrast enforcement.
- **Mobile architecture.** The visualiser has no mobile branch anywhere. Responsive components
  or a separate path is an architectural decision needing an ADR before it is built.
- **Ella.** Klay-only until proven, then adopted deliberately rather than by drift.

---

## 15. AMENDING THIS DOCUMENT

Changes require an ADR in `docs/architecture/decisions/` recording context, decision and
consequences, referencing this document's section number. This document is then updated and
its version incremented.

**Rules are not amended in passing, in a commit message, or by a session that found one
inconvenient.**
