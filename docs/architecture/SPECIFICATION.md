# Klay Interiors — Architecture Specification

**Version:** 1.6
**Date:** 31 August 2026 (v1.0), amended 31 Aug (v1.1, v1.2), 1 Sep 2026 (v1.3–v1.6)
**Amendments:** ADR-014 (§2, §3), ADR-015 (§3, §7), ADR-016 (§11), ADR-017 (§9), ADR-018 (§11), ADR-019 (§2), ADR-020 (§12), ADR-022 (§11)
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
| **App** | `src/app/` | features, design-system, shared, config, **core** | Composition only. Routing, providers, layouts. No business logic, no product knowledge. |
| **Features** | `src/features/*/` | design-system, shared, config, **core**, its own internals, and **other features via their barrel only** | Everything the business does. Each feature self-contained. |
| **Design system** | `src/design-system/` | nothing except itself | Tokens and visual primitives. Knows nothing about blinds, prices, or customers. |
| **Shared** | `src/shared/` | config, other shared | Genuinely generic. If it mentions a domain noun it is not shared, it is a feature. |
| **Core** | `shared-core/` | **nothing** | The contract between the browser and the server. Imported by both runtimes, depends on neither. See ADR-014. |

**`shared-core` has zero dependencies in either direction** — not `src/`, not `netlify/`, not `shared/`. It is imported by two runtimes that share nothing else, so anything it imports would have to be valid in both, and would be added by someone thinking about only one. Enforced as an element type with an empty allow-list. See ADR-014.

**The test for "is this shared?"** Could this be lifted into an unrelated project without
modification? A date formatter, yes. A `formatBlindWidth` function, no.

If `shared/` exceeds roughly **15% of `src/`** by line count, something has been misfiled.

**Cross-feature communication has exactly three legal answers:** B exports it from its
`index.ts` and A imports that; the thing isn't really either feature's and moves to `shared/`;
or the app layer composes them and passes data down as props. Never import from
`features/b/components/Thing.tsx` directly.

**The restriction is not WHETHER a feature may reach another, it is THROUGH WHAT** — ADR-019.
Enforced by two rules that are both necessary: `boundaries/dependencies` answers *may this
layer reach that layer*, and `import/no-internal-modules` answers *through what*, by allowing
`@/features/*` (one segment, the barrel) and not `@/features/*/**`.

A cross-feature import remains a design signal rather than a free action. A feature barrel
that grows exports for other features to consume is drifting toward being a shared layer with
a feature's name on it.

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
│   ├── visualiser/           NOT BUILT BY THIS MIGRATION — E-08, ADR-020.
│   │   ├── photo/            The shape below is the eventual target; the code
│   │   ├── tracing/          stays in src/visualiser/ and src/visualiser-lab/
│   │   ├── rendering/        until that work is scheduled on its own.
│   │   │   ├── blind/
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
├── functions/                pricing authority lives here today — ADR-015
└── edge-functions/           latency-sensitive work. Optional for pricing, not required.

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
| Decides what a customer pays | `netlify/` — functions or edge functions | The browser |

**The pricing rule, stated fully because it is the one that matters.** There is one price
table. It lives in `shared-core/pricing/` and is imported by both `src/` (to display) and
`netlify/` (to decide).

The browser's number is display only and never trusted. The server recalculates from the same
table and its answer is authoritative.

**The runtime is not the point; the trust boundary is.** A serverless function satisfies this
as completely as an edge function — the price is decided by code the customer cannot reach,
from a table the customer cannot edit. `create-checkout-session` already does exactly that.
Moving pricing to the edge is a latency optimisation, sized on its own evidence, and out of
scope for the migration. See ADR-015.

If a future change ever sends the client's figure for comparison, the server's answer wins and
the discrepancy must be logged. Today nothing is sent, so no discrepancy can arise.

Duplicating the price table into the server "so it's server-side" is the wrong fix —
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

### The adopted scales — ADR-017

Both are **closed at eight steps.**

| Step | `space` role | | Step | `type` |
|---:|---|---|---:|---|
| 4 | `hairline` | | 10 | `micro` |
| 8 | `tight` | | 12 | `label` |
| 12 | `snug` | | 14 | `body` |
| 16 | `item` — the default | | 16 | `lead` |
| 24 | `group` | | 20 | — |
| 40 | `section` | | 26 | `card` |
| 80 | `band` | | 34 | `numeric` |
| 120 | `focal` | | 56 | `section` |

`type.ornament` and `type.display` sit outside the type scale. They are display ornament —
one occurrence each — not body hierarchy, and forcing them onto a text scale would flatten
both.

**WHAT A REQUEST FOR A NINTH STEP REQUIRES.** It is refused by default. There are exactly two
legitimate responses to a layout that needs a value between two steps:

1. **Change the layout** to use an existing step. This is the answer in almost every case.
2. **Change the scale** — deliberately, in one file, with an ADR amending ADR-017, and
   accepting that every consumer of the neighbouring steps is now in a different proportional
   relationship.

A ninth step added "just for this one case" is how a scale becomes a list. The previous scale
did not fail because its numbers were wrong. It failed because it was optional, and the
codebase grew 34 distinct spacing values and 18 font sizes alongside it.

**AND THE PRINCIPLE THAT SETTLES SCALE ARGUMENTS.** The best-scoring candidate was rejected:
its first three steps were 11, 13 and 15 — the three most-used sizes in the codebase — and a
scale built on current usage is the current inconsistency written down and blessed.

> **A scale constrains, it does not accommodate.** Steps one pixel apart cannot express
> hierarchy. The measure of a scale is whether it makes a hierarchy legible, not whether it
> minimises churn.
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
| No relative parent imports | **`no-restricted-imports`** with pattern `../*` — see the note below |
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

> **WHY NOT `import/no-relative-parent-imports` — ADR-016.** That rule resolves a specifier
> before judging it, so it cannot tell a relative climb from an alias: `@/ds` imported from
> `src/pages/` resolves to a parent directory and fires, exactly like `../../theme`. Two
> consequences. It reports the desired end state as a violation — it was flagging four alias
> imports in `AboutPage.tsx` that Phase 2.2b had just introduced as the correct form. And
> **its count can never reach zero, so it can never flip to `error`**, which makes it
> permanently advisory: the state this section describes as how rules get switched off. It was
> also inflating the baseline by 29.
>
> `no-restricted-imports` matches the SPECIFIER TEXT, which is what §10 is actually about —
> §10's own justification is that a reader should see the layer at the import site. An alias
> passes; a `../` does not.
>
> **Do not restore the original rule on the strength of this section having once named it.**
> The two rules are not interchangeable, and the structural half of the job —
> `@/features/cart/...` being illegal from inside booking — belongs to
> `boundaries/dependencies`, which does it properly.

**The CI gate.** Nothing merges to `main` unless `npm run typecheck` returns zero, `eslint`
returns zero errors, `npm run build` passes, `knip` finds no new unused exports, and `jscpd`
reports no new duplication above threshold.

**CI must run these.** As of August 2026 nothing outside a developer's terminal has ever
typechecked this repository — `vite build` never invokes `tsc`, and `netlify/` is bundled
separately at deploy. Wiring CI is a precondition of this specification meaning anything.

**AUTOMATED RENAMES DO NOT TOUCH COMMENTS — ADR-018.** A scripted substitution operates on
code only. Comments referencing a renamed identifier get a separate, reviewed pass.

A comment mentioning an identifier is usually not making the same claim the code is. It
describes history, or states what *other* code does. Phase 2.3's rename rewrote a note reading
"the frozen visualiser still imports `space.xs`" into "…imports `space.tight`" — false, because
the frozen zone was deliberately excluded from that rename. A stale comment is a small, visible
problem; a comment rewritten into confident misinformation is a silent one.

After any scripted rename, check what it did to prose:

```
git diff -U0 | grep -E '^+' | grep -E '^+s*(//|*|/*)' | grep '<new-identifier>'
```

Any output is a comment the rename touched. Review each. Where a comment is *about* the old
name, leave the old name and add the new one rather than replacing it.

**AND AUTOMATED FIXERS DO NOT REMOVE SUPPRESSION DIRECTIVES.** No `eslint-disable`, no
`@ts-expect-error`, no `@ts-ignore`, no `biome-ignore` — not by `--fix`, not by a codemod.

A stripped suppression is worse than a stripped comment, because **it lints clean**. The
directive was load-bearing: something was suppressed for a reason, that reason is usually
written on the line above, and removing it either re-enables a rule the author had judged
wrong or silently changes what the tool is checking. Neither shows up in a diff review that is
scanning for logic changes.

This is not hypothetical here. `eslint --fix` removed two
`// eslint-disable-next-line react-hooks/exhaustive-deps` directives from
`Canvas2DCurtainRenderer.tsx` — a **protected IP file** (E-02's sibling) that may not be
edited at all — and the run reported zero errors. Use `npm run lint:fix`, which is scoped, and
check the diff for removed directives:

```
git diff | grep -E '^-.*(eslint-disable|ts-expect-error|ts-ignore)'
```

**NO RULE COUNTS AS ENFORCEMENT UNTIL IT HAS BEEN SHOWN TO FAIL — ADR-022.**

Every rule in the table above carries a fixture that violates it, and a check that the rule
reports against that fixture. **A rule that cannot be shown to fire is not enforcing anything,
and its zero is not evidence.**

`npm run verify:rules`. It loads the real `eslint.config.js`, because the thing under test is
the configuration as shipped.

This exists because the table has twice recorded a mechanism that was not working.
`eslint-plugin-boundaries` was misconfigured and silently failing until Phase 2 caught it by
accident. `import/no-cycle` is loaded, schema-validated, resolving — and **inert**: it reports
nothing against a two-file `a → b → a` fixture built for no other purpose. §11's circular-import
line has never enforced anything, and a real cycle shipped at P4-3 into a repository that
believed otherwise.

**A rule reporting zero is indistinguishable from a rule finding nothing wrong.** Which makes
the mechanism below actively dangerous on its own: a broken rule reports zero, is judged clean,
and is promoted to `error` as a reward for not working.

**Introducing rules without stopping work:** every new rule starts as `warn` with a recorded
baseline count. The count may go down; it may not go up. At zero it flips to `error`
permanently. Turning everything to `error` on day one produces 400 failures and the rules get
switched off.

**A rule may not be promoted from `warn` to `error` on the strength of a zero that has not been
demonstrated to be a real zero.** The promotion asks two questions, not one: is the count zero,
and does the rule fire when it should?

**The same doubt applies to anything whose success is an absence** — a test suite that runs no
tests, a CI step grepping for a renamed pattern, a typecheck over a project that includes no
files. `tsc -b`'s coverage of `netlify/` has never been proven either, and `vite build` never
invokes it.

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
| E-08 | `src/visualiser/`, `src/visualiser-lab/`, `VisualiserPage.tsx`, `VisualizerLabPage.tsx` are outside the migration and outside every rule in this document | ADR-020. Under active development; the slot for them receded at every phase. They are not moved, not renamed, not re-aliased, not lint-fixed | When that work is scheduled on its own, with its own plan |
| E-09 | A permanent re-export shim at `src/lib/pricing.ts` after the module moves to `shared-core/pricing/` | ADR-020. Four E-08 files import it by relative path and may not be edited. One table, two paths — a re-export cannot diverge from what it re-exports | With E-08 |
| E-10 | `src/data/products.ts` and `src/theme.ts` stay where they are | ADR-020. Imported by E-08 files. `products.ts` additionally cannot be split by consumer, which was decision H | With E-08 |

**Adding to this table requires an ADR. An exception without an ADR is a violation.**

**E-08 is the largest exception in this table by a wide margin — 58% of `src/`.** It is stated
plainly rather than buried: for the life of this migration, the majority of the codebase by
line count is not governed by this document. That is the honest description of the situation
ADR-020 records, and naming it is the only thing that stops it being forgotten.

---

## 13. NAMED ANTI-PATTERNS

**The Second Implementation.** Building a feature that already exists because you did not know
it existed. Prevented by feature barrels and one session per working tree.

**The count is kept in `docs/architecture/DIVERGENCE_LOG.md`, and it is the strongest evidence
for why §11 exists.** Six divergences found so far in ~31,000 lines — two complete checkouts,
a forked visualiser, an email regex in three places, a postcode regex in two, three curtain
implementations, and three hardware colour maps. Not one was carelessness: D-03's three
regexes are identical because three competent people independently reached the same correct
answer. The failure mode is not bad code, it is code that cannot see other code.

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
