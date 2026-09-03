# Klay Interiors — Architecture Specification

**Version:** 2.0
**Date:** 31 August 2026 (v1.0), amended 31 Aug (v1.1, v1.2), 1 Sep 2026 (v1.3–v1.8), 3 Sep 2026 (v1.9, v2.0)
**Amendments:** ADR-014 (§2, §3), ADR-015 (§3, §7), ADR-016 (§11), ADR-017 (§9), ADR-018 (§11), ADR-019 (§2), ADR-020 (§12), ADR-022 (§11), ADR-023 (§11, §12), ADR-024 (§5), ADR-025 (§3, §9), ADR-026 (records only). v2.0: §2 denominator, §12 permanence and owners, §11 the test
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
   > **WORKED EXAMPLE, AND IT IS ABOUT A FOLDER OF IMAGES.** `public/images/lifestyle/` held six
   > photographs of finished rooms and four diagrams of how buying works. It was named for what its
   > contents were **not** — neither was a product cut-out — which is the same failure as a
   > `components/` folder holding forty unrelated components, one level down and in a directory
   > nobody thought of as code.
   >
   > It became `rooms/` and `process/` at the asset phase. **Nobody had applied this rule to it
   > because the folder predated the rule**, and because §1 reads as being about source. It is not:
   > it is about how a reader finds a thing, and a reader looking for the install diagram was
   > looking in a folder that could not tell them whether it was there.

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

**If `shared/` exceeds roughly 15% of IN-SCOPE `src/` by line count, something has been misfiled.**

**In-scope, not all of `src/` — and the difference is 3.2×.** The denominator is the set ADR-023
computes from the exception register: every file under `src/` minus the paths any exception
removes from scope. `tools/scope.mjs` already produces it; no second definition is introduced
here.

| Denominator | `src/` lines | `shared/` as a share |
|---|---:|---:|
| All of `src/` | 42,084 | 0.88% |
| **In-scope `src/`** | **13,082** | **2.84%** |

**69% of `src/` by line count is code this specification does not govern.** Measuring a rule about
`shared/` against it produces a number that moves for reasons the rule has no opinion on:

- **Adding out-of-scope code LOWERS the ratio.** Five thousand lines into `visualiser-lab/` and
  `shared/` looks proportionally smaller, having not changed.
- **Deleting out-of-scope code RAISES it.** Retiring E-08 would move `shared/` from 0.88% toward
  2.84% overnight, with not one line added to `shared/`.

**So the rule as written rewarded adding code elsewhere and punished cleanup** — the exact
inversion of what §13 asks for, in a sentence meant to enforce it.

**Harmless at 0.88%, and wrong in a direction that only surfaces when it matters.** The ceiling is
nowhere near either number today. The day it bites is the day someone deletes seventeen thousand
lines of visualiser and finds a rule complaining about a folder they did not touch — which is
precisely the moment a specification most needs to be measuring what it says it measures.

**15% remains a ceiling and not a target.** §2's other paragraph on this stands: a thin `shared/`
is what a codebase looks like when almost everything genuinely belongs to a feature.

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
│   ├── primitives/       ILLUSTRATIVE, NOT A MANIFEST — ADR-025.
│   │                     This list was read as a checklist and the files were
│   │                     created because it named them. Five of the six were
│   │                     never used by anything and were deleted at Phase 7.
│   │                     Primitives are EXTRACTED from duplication. See §9.
│   ├── patterns/
│   │   ├── SectionBand.tsx
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
│   ├── data-model.md
│   ├── glossary.md
│   └── decisions/            ADR-001 …
├── runbooks/
└── compliance/
```

**EVERY UNBUILT ENTRY ABOVE HAS A TRIGGER — ADR-025.** The tree is a destination, and a
destination is not a checklist. §4 already says it about folders — *"not every feature needs
every folder; empty folders are noise"* — and §9 says it about primitives. This says it about
the whole tree, in the only form that holds: **an entry that cannot say what would cause it to
exist is a prediction, not a target, and does not belong here.**

### THE TRIGGERS ARE AUDITED AT THE CLOSE OF EVERY PHASE, AND A FIRED TRIGGER IS A FINDING

Not a backlog item. **A trigger that has fired means the duplication it was written to prevent
already exists**, and the entry is built in that phase.

**A NAMED ENTRY READS AS COVERAGE. That is the failure mode of a target tree, and it is why this
paragraph is in the specification rather than in a process note.**

`config/site.ts` was in this tree from the day it was written. It was never built. Underneath the
name, the phone number, email and street address were written out in three files, the trading
hours drifted into two different wordings of the same fact, and the Instagram URL reached a
fourth file. **Nobody was careless.** Every author saw `config/site.ts` in the tree, read it as
"the site's details have a home", and had no reason to check that the home was empty — the entry
looked like the problem was solved.

An unbuilt entry with a trigger is a claim about the future. **An unbuilt entry whose trigger has
fired is a claim that is now false**, and it is more dangerous than no entry at all, because it
suppresses the question it was meant to raise.

So: at every phase close, walk the table below and check each condition against the codebase.
`config/site.ts` and `config/routes.ts` were both found this way, both on the first audit, and
both had fired long before anyone looked.

Fifteen entries below did not exist when the triggers were written. **Two were built immediately
because their conditions had already been met** — they are marked BUILT. One more, the glossary,
had never had a chance to fire because §6 already required it.

| Unbuilt entry | What causes it to exist |
|---|---|
| `app/providers.tsx` | A **second** app-wide provider. `BrowserRouter` is the only one today and sits inline in `main.tsx`, where one provider belongs |
| ~~`config/site.ts`~~ **BUILT** | A business fact written in two places. **FIRED: three files, and a fourth for the Instagram URL.** D-12 |
| ~~`config/routes.ts`~~ **BUILT** | A path string referenced twice. **FIRED: `/products` ten times, `/contact` six, `/cart` five** |
| `features/booking/` | **Phase 6.** Scheduled, not speculative |
| `features/visualiser/` | The visualiser migration being scheduled as its own project. E-08, ADR-020 |
| `features/configurator/` | `RangeConfigurator` and `KlayConfigurator` being found to share logic rather than a name. Cannot be assessed while one of them is E-08 |
| `shared/lib/supabase/` | `src/` needing to read Supabase directly, from a second file. **Zero do today** — every query is in `netlify/lib/db.ts`, which is where §7 puts the authority. `@supabase/supabase-js` is nonetheless an installed dependency that `src/` never imports; a knip finding for 6.3 |
| `shared/lib/format/` | A display formatter with consumers in two features. `formatAUD` is the only one and travels with pricing to `shared-core` |
| `shared/types/` | A type needed by two features that belongs to neither. `CartItem` is cross-feature but belongs to cart, which is why it is exported from cart's barrel and not from here |
| `shared-core/pricing/` | **Phase 6, item 1.** Scheduled |
| `netlify/edge-functions/` | A latency measurement that justifies one. ADR-015: moving pricing to the edge is optional, separate, and sized on its own evidence |
| `supabase/seed.sql` | A second environment needing deterministic starting data |
| `docs/architecture/data-model.md` | The first relationship a single migration file does not show — a foreign key across two tables |
| ~~`docs/architecture/glossary.md`~~ **BUILT, INCOMPLETE** | §6 said *"vocabulary lives in `docs/architecture/glossary.md`"* and it did not exist — a section of this document depending on a file nobody wrote. The code half is extracted; the business half is pending from V, and §6 says the business wins |
| `docs/compliance/` | The first accepted compliance obligation — a privacy commitment, a retention rule, a PCI scope statement |

## FIVE ENTRIES WERE DELETED FROM THE TREE BECAUSE THEY FAILED THIS TEST

Not deferred. Removed, because no observation could be named that would create them.

| Deleted | Why it had no trigger |
|---|---|
| `design-system/patterns/Section.tsx` | No section shell is written twice. `layout.sectionPad` already carries the only part that repeats, and it is a token — which under §9 is exactly the half that *can* be specified ahead of demand |
| `design-system/patterns/Card.tsx` | No card is written twice. `ProductCard` and `PhotoTile` are catalogue's, know about prices, and would not survive the lift test |
| `src/types/` | Duplicated `shared/types/`. **Two entries for one idea**, with no rule distinguishing them — the reliable outcome of which is a type in each and no way to know which is right |
| `docs/architecture/overview.md` | Nothing was identified that it would hold which this document does not. An overview of a specification is a second specification |
| `docs/audit/` | The one audit performed became `MIGRATION_MAP.md`. No second kind of audit was named, and a folder for future audits is the shape this rule exists to catch |

**These five are the same failure as `Box` and `Stack`: written from a picture of a finished
codebase rather than from a codebase.** The picture was drawn before the work and was wrong in
the specific way a picture is always wrong — it is complete, and real structure is not. Git holds
them; if a trigger ever fires, the entry comes back with its evidence attached.

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
| React component | `PascalCase.tsx`, one per file, filename = component name — **but see the shared-definition exception below** | `BookingForm.tsx` |
| Hook | `useCamelCase.ts` | `useBookingSubmission.ts` |
| Module | `camelCase.ts` | `createBooking.ts` |
| Types | `thing.types.ts` | `booking.types.ts` |
| Constants | `constants.ts` per feature | — |
| Test | `Thing.test.ts(x)`, beside the file it tests | `calculatePrice.test.ts` |
| Netlify function | `kebab-case.ts` | `create-checkout-session.ts` |
| Migration | `NNNN_description.sql` | `0003_add_booking_status.sql` |
| ADR | `NNN-decision-in-a-phrase.md` | `007-server-side-pricing.md` |

**ONE COMPONENT PER FILE, EXCEPT WHERE A SHARED DEFINITION HAS ALREADY DRIFTED — ADR-024.**

> One component per file, except where two components share a definition whose duplication has
> previously caused drift. The shared definition stays with them, and the reason is recorded in
> the file.

Three conditions, all required: the components genuinely share it; duplication has **previously**
caused drift, as a matter of record rather than prediction; and the reason is written in the file.

`CtaButton` and `CtaLink` are the worked example — the same button as a `<button>` and an `<a>`,
which had already drifted to six different heights when the geometry was not shared. The
preferred resolution is the one P4-6 took: the shared definition in a non-component
`camelCase.ts` module (`design-system/primitives/cta.ts`) with one component per component file,
which satisfies the letter as well as the intent. The exception covers the case where even that
third file is ceremony.

**This is not cover for two unrelated components in one file.** §8's signal stands unless the
drift can be named.

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

### A PRIMITIVE EARNS ITS PLACE BY REMOVING A DUPLICATION THAT ALREADY EXISTS — ADR-025

**Primitives are extracted. They are not created from a target tree.**

Before adding one, name the call sites it will replace and count them. If the answer is
*"components will use this once it exists"*, that is a proposal, and the place for a proposal is
a note — not a file.

**A thin primitives folder is a healthy state, not an incomplete one.** It means the codebase's
repetition has been found and named. An empty one means none has been found yet, which is either
true or a measurement problem, and neither is fixed by writing components.

### WHY A TOKEN MAY BE SPECIFIED AHEAD OF DEMAND AND A COMPONENT MAY NOT

This section holds two rules that look contradictory. Tokens are declared up front and adoption
is compelled. Primitives are extracted from duplication and never declared up front. **The
difference is not preference. It is that only one of them can have its alternative path closed.**

**A token has no alternative path.** A numeric literal in a `style={{}}` object is a lint error,
so there is no other way to write a colour or a spacing. The scale becomes load-bearing because
nothing else is reachable — which is exactly what §9's opening finding demanded, after `theme.ts`
sat unused beside 127 hardcoded pixel values. *The tokens were not the problem; optionality was.*
Closing the alternative fixed it.

**A component's alternative path cannot be closed, and should not be.** There is no rule that
says "use `Box` instead of a `div`", and a codebase that tried to enforce one would be worse for
it. A `div` is always available, always correct, and always cheaper than importing something. So
a primitive is never adopted because it exists — it is adopted because it removes work its
consumers are already doing by hand.

**Which is why a specified token converges and a specified component does not.** The rule below
follows from that, and so does the fact that a thin primitives folder is a healthy state rather
than an unfinished one.

**The evidence is in this repository.** §3's tree listed `Box`, `Stack`, `Text`, `Heading` and
`Button`; they were created because it listed them, and across every phase of the migration not
one was imported by anything. They were deleted at Phase 7 with `SectionHead` — 471 lines. Every
primitive that *was* adopted came out of counted duplication: nine slightly different buttons,
ten hand-rolled hover states, one reduced-motion snapshot written four times. Adoption of the
extracted set was immediate and total; adoption of the specified set was zero.

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

### AND THE TOOLCHAIN IS HELD TO THIS SECTION TOO

**§11's argument applies to the tools that modify the codebase exactly as it applies to the
codebase.** *"A rule that relies on someone remembering it is not a rule, it is a hope."*

Twice during this migration a correct scope check already existed in `tools/` and an ad-hoc
substitute was written instead — the second time editing a file E-08 protects. **Neither was
ignorance of the rule.** The cause was an asymmetry: two lines of `readdirSync` are faster to
write than an import is to look up.

So the bypass is closed rather than discouraged.

- **`tools/scope.mjs` is the only source of "which files may be touched"**, computed from the
  exception register. It exports `inScopeFiles()` — no glob, no filter, no arguments — so nothing
  has a reason to write its own walker.
- **`assertInScope` throws**, and every write in `tools/codemod.mjs` goes through it. There is no
  parameter that widens scope, because a parameter is a bypass with a default.
- **`npm run verify:scope-guard`** proves it refuses, against eleven out-of-scope shapes including
  the exact file that was edited — and proves it still allows in-scope files, since a guard that
  refuses everything demonstrates nothing.

**Making the correct path mandatory does not fix an asymmetry of effort. Making it shorter
does.** The list is now one import and no arguments; the ad-hoc version is the longer one to
write.

### AND THE TEST THAT DECIDES WHETHER ANY OF THIS IS WORKING

> **What would this output if it were broken?**
> **If the answer is "the same thing", it is not a check.**

**The general test, and it is not about lint rules.** It applies to every signal this document
relies on — a rule's count, a `grep`'s empty result, a guard's passing test, `tsc -b`'s exit code,
a browser check that only watches for thrown errors, a `git push` that returns silently.

Each of those has, in this project, output exactly what it outputs when working while being
wrong. **Every one was believed at the time.**

**The remedy is to make it fail on purpose, once** — which is what `npm run verify:rules` and
`npm run verify:scope-guard` are, and why §11 requires them before a rule may be promoted. A
signal nobody has seen fail is not evidence; it is a habit.

`docs/runbooks/verifying-source-transforms.md` carries the seven instances and the three shapes
they take.

### AN EXIT CONDITION MUST NOT BE WRITTEN OVER SOMETHING THE PHASE DOES NOT CONTROL

> **Ask of every condition phrased "when X reaches Y": who can change Y?**
>
> If the answer is anyone other than the work the condition governs, it is not an exit condition.
> It is a dependency wearing one's clothes.

**Two failed in practice before this was written down.**

**E-07** deferred the `visualiser`/`visualizer` spelling split until *"wardrobes ship and the fork
resolves"* — someone else's milestone, on someone else's timing. It waited eight weeks and then
closed in an afternoon, by a route being deleted. The condition had never been reachable by the
work it governed.

**The countdown floor** was to be frozen at Phase 6's opening and gate its closing. It moved four
times — 7 → 6 → 10 → 13 — and the last rise came from wardrobe work adding two modules that
catalogue imports. Freezing it would have made Phase 6's completion depend on whether anyone
shipped wardrobe code during it.

**Both looked like exit conditions until something moved them.** That is the tell: a condition
that cannot be distinguished from a real one by reading it, only by watching it move.

---

### THE AUDIT OF THIS DOCUMENT'S OWN CONDITIONS

**Run 3 September 2026.** Every condition in this specification phrased as a threshold or a
milestone, asked *who can change Y*. **Seven failed. Two more were weak.**

**All nine are now resolved, and none by rewording.** Four became permanent exceptions with a
review trigger; four gained an owner who can be asked; one — §2's ceiling — was measured against
the wrong denominator and is now measured against the right one. The verdict column below records
what each became.

| Condition | Where | Who can change Y | Verdict |
|---|---|---|---|
| *"On unfreeze"* | **E-01 – E-04** | Whoever decides the visualiser is unfrozen — not this project | **RESOLVED: now PERMANENT with a review trigger.** These files may never unfreeze. A permanent exception is a documented decision; a temporary one that never ends is rot |
| *"When that work is scheduled on its own, with its own plan"* | **E-08** | Whoever schedules the visualiser migration | **RESOLVED: owner V**, called when the wardrobe work pauses. A person can be asked; a milestone cannot |
| *"With E-08"* | **E-09, E-10, E-11** | Same as E-08 | **RESOLVED: owner V**, by inheritance. E-11 is separately known to be closeable early — ADR-020's audit |
| *"If `shared/` exceeds roughly 15% of `src/`"* | **§2** | Anyone writing ANY code in `src/`, including out-of-scope code | **RESOLVED: measured against IN-SCOPE `src/`** — ADR-023's computed set. 0.88% -> 2.84%, a 3.2× correction, because 69% of `src/` was code the rule has no opinion on |
| *"The visualiser migration being scheduled as its own project"* | **§3**, the `features/visualiser/` trigger | Same as E-08 | **RESOLVED: owner V**, with E-08 |
| *"If styling approach changes"* | **E-05** | Whoever changes the styling approach | **WEAK.** It is a review trigger rather than an expiry, so nothing is blocked by it — but nothing will ever fire it either |
| *"At zero it flips to `error` permanently"* | **§11** | Anyone who writes a violation before the flip happens | **WEAK.** The consequence is only "wait longer", not a phase that cannot close. Named because it is the same shape |
| *"Phase 6 closes when `CLEARABLE` reaches zero"* | PHASE_6_SCOPE | Mostly the phase — a second session adding a `feature → legacy` import raises it too | **ACCEPTED WITH AN OWNER.** No condition survives another session writing code, and inventing one that claimed to would be theatre. It moves, it is reported, **V decides** |
| *"Klay-only until proven"* | **§14** | Undefined — nobody owns "proven" | **WEAK.** Not a gate on anything, so it costs nothing today |

### §2's 15% ceiling is the interesting failure

*"If `shared/` exceeds roughly 15% of `src/` by line count, something has been misfiled."*

**The denominator includes code the rule is not about.** `src/` is 128 files, 42 of them
out-of-scope. So:

- A parallel session adding 5,000 lines to `visualiser-lab/` **lowers** `shared/`'s percentage.
  The rule relaxes because of code it has no opinion on.
- Deleting out-of-scope code **raises** it. Retiring E-08 could push `shared/` toward the ceiling
  without a single line being added to `shared/`.

**Today it is harmless — `shared/` is at 0.93%, two orders of magnitude below the ceiling.** It is
recorded because the number is not measuring what the sentence says it measures, and the day it
matters is the day someone deletes 17,000 lines of visualiser.

**The fix is not to change the ratio.** It is to state the denominator: the ceiling is over the
code this specification governs, which is the in-scope set ADR-023 already defines. Left as a
finding rather than an amendment, because changing a rule nobody is near is how a specification
accumulates edits nobody needed.

### What the four "On unfreeze" exceptions actually need

**They are not wrong to depend on the visualiser — they are exemptions FOR the visualiser.**
E-01 to E-04 exempt four protected IP files from size and complexity limits, and those files
genuinely cannot be reviewed until someone works on them.

**The failure is that "on unfreeze" is not a date, a trigger or an owner.** It is a word that
sounds like a condition. ADR-020's audit asks the better question of every such row — *could the
excepted thing stop existing rather than wait* — and that is the form to use whenever one of
these is revisited.

---

### HOW CHANGE IS VERIFIED — THE STANDING RULE

> **Read the diff for judgement errors. Use the typechecker for mechanical ones.**
> **The typechecker holds the whole file; a reviewer holds a fragment.**

`docs/runbooks/verifying-source-transforms.md`. **This supersedes "review the diff carefully" as
this project's default**, because careful reading is precisely what fails on the mechanical half
and reading harder does not fix it.

A reviewer sees a hunk with three lines of context. What is needed to catch a mechanical error is
usually outside that window — another binding of the same name ninety lines down, a consumer in
another file, a value that is a number where a boolean was assumed. The compiler holds all of it
for free. Conversely, no tool can tell you a correct change was the wrong change: a state-keyed
map renamed as though it were a boolean compiles, and so does a worse name.

**Give each class of error to the thing that can see it.** Anything that transforms source runs
the typechecker per operation, not per batch. Anything that makes a decision gets read by a
person.

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

### PROMOTION FROM `warn` TO `error` REQUIRES BOTH CONDITIONS

| | Condition | Evidence |
|---|---|---|
| **1** | The **in-scope** count has reached **zero** | `npm run check:scope` |
| **2** | The rule has been **demonstrated to fire** against a fixture built to violate it | `npm run verify:rules` |

**IN-SCOPE IS DEFINED, AND COMPUTED — ADR-023.**

```
in-scope = every file under src/
           MINUS the paths named by any exception in §12 that excludes from scope
           MINUS netlify/, scripts/, tools/, assets-source/
```

**The set is computed from the exception register, not hand-maintained.**
`docs/architecture/exceptions.json` is §12's machine-readable half;
`npm run check:exceptions` asserts the two halves carry the same `E-` numbers. A second,
hand-kept list of what is not being counted is the silent divergence §13 names.

**When an exception retires, its files re-enter scope, and any rule they violate demotes from
`error` back to `warn` until the count clears.** Promotion on an in-scope zero is a claim about a
smaller codebase; when the codebase grows the claim is re-earned. That demotion is expected, and
it is not a reason to keep an exception alive to protect a green tick.

**A rule promoted this way is marked `error (in-scope)` and is NOT equivalent to a globally-zero
rule.** `klay/no-direct-env-access` is zero everywhere. `max-params` is zero in scope with nine
findings in the out-of-scope renderer. Both may be `error`; only the first is a statement about
the whole codebase, and collapsing them would be a green signal that does not mean what it
appears to.

**Neither condition is sufficient alone, and condition 2 is the one that was missing.** A rule
satisfying only 1 is indistinguishable from a rule that does nothing — which is exactly what
`import/no-cycle` was, and it was next in line behind `klay/no-direct-env-access` to be rewarded
for it.

**Every rule in the promotion queue is audited against both before any promotion happens**, and
the audit is recorded in LINT_BASELINE.md with the date it was taken. A rule that fails
condition 2 does not wait in the queue — it comes off the queue and onto the blind list until
it can be made to work or replaced.

**And a zero measured against a permissive configuration is a conditional zero.**
`boundaries/dependencies` reads zero today partly because the temporary `feature → legacy`
allowance permits most of what it would otherwise catch. It fires, and its count is zero, and it
still may not be promoted until the scaffolding it is being measured against is gone. Record the
condition with the count.

**The same doubt applies to anything whose success is an absence** — a test suite that runs no
tests, a CI step grepping for a renamed pattern, a typecheck over a project that includes no
files. `tsc -b`'s coverage of `netlify/` has never been proven either, and `vite build` never
invokes it.

---

## 12. EXCEPTIONS REGISTER

| # | Exception | Reason | Permanent? / Review |
|---|---|---|---|
| E-01 | `homography.ts` exempt from size and complexity limits | Protected IP, mathematically dense, splitting risks correctness | **PERMANENT.** Review if the file is modified, or when the visualiser migrates |
| E-02 | `Canvas2DBlindRenderer.tsx` exempt from size limits | Protected IP, rendering pipeline | **PERMANENT.** Review if the file is modified, or when the visualiser migrates |
| E-03 | `CornerPinOverlay.tsx` exempt from size limits | Protected IP | **PERMANENT.** Review if the file is modified, or when the visualiser migrates |
| E-04 | `usePhotoUpload.ts` exempt from size limits | Protected IP | **PERMANENT.** Review if the file is modified, or when the visualiser migrates |
| E-05 | `style-src 'unsafe-inline'` in CSP | Inline-styles-only is a brand-level decision; runtime-computed styles cannot be nonced | If styling approach changes |
| E-06 | `design-system/tokens/*` exempt from the no-literal-values rule | It is the source of the values | Permanent |
| E-08 | `src/visualiser/`, `src/visualiser-lab/` and `VisualiserPage.tsx` are outside the migration and outside every rule in this document | ADR-020. Under active development; the slot for them receded at every phase. They are not moved, not renamed, not re-aliased, not lint-fixed | **Owner: V** — called when the wardrobe work pauses |
| E-09 | A permanent re-export shim at `src/lib/pricing.ts` after the module moves to `shared-core/pricing/` | ADR-020. Four E-08 files import it by relative path and may not be edited. One table, two paths — a re-export cannot diverge from what it re-exports | With E-08 — **owner: V** |
| E-10 | `src/data/products.ts` and `src/theme.ts` stay where they are | ADR-020. Imported by E-08 files. `products.ts` additionally cannot be split by consumer, which was decision H | With E-08 — **owner: V** |
| E-11 | A permanent re-export shim at `src/components/Nav.tsx` after `Nav` moves to `app/layouts/` | Phase 5, decision D. `VisualiserPage.tsx` imports it by relative path and is E-08 (it was two files until `VisualizerLabPage.tsx` was deleted) — an import rewrite is still an edit. One component, two paths; a re-export cannot diverge from what it re-exports | With E-08 — **owner: V** |

**RETIRED — E-07**, the `visualiser`/`visualizer` spelling split, on 3 September 2026. The
z-spelled route and its page were deleted rather than the two spellings unified, so the exception
had nothing left to except. **It closed earlier than ADR-013's stated condition** — which was
"when wardrobes ship and the fork resolves" — because removing the surface resolved it before the
condition could be met. ADR-013 records the difference. Kept as prose rather than a table row so
that `npm run check:exceptions` sees a retired exception in neither half.

### A RUNTIME-ASSEMBLED ASSET PATH IS UNAUDITABLE, AND THAT IS PERMANENT

**An asset whose path is built at runtime may not be moved by any automated pass.**

`src/visualiser/wardrobes.ts` builds every wardrobe render's URL as:

```ts
`${DIR}/${model.id}-${wardrobeColour(colourName).slug}-${view}.png`
```

**Twenty-eight files load through that expression and appear in no source file at all.** A
static reference check — `grep`, an import graph, `npm run audit:assets` — cannot see them,
because the string that names them does not exist until the moment it is used.

**This is a permanent class, not a gap in the tool.** No better audit closes it: the information
is not in the source. A checker that guessed would be worse than one that abstains, because it
would report a confident answer about files it cannot observe.

**The only safe treatment is to leave them.** `audit:assets` reports the directory as
**UNSAFE TO CLASSIFY** rather than as referenced or unreferenced, and nothing under it is moved,
renamed or deleted on the strength of a count.

**The general rule this is an instance of.** §11 can enforce what a tool can see. **There is no
typechecker for a string path**, and a *constructed* string path cannot be read either — so an
asset directory addressed by expression is outside every mechanism in this document and has to
be handled by knowing about it. Naming it here is the only enforcement available.

### A REVIEW COLUMN, NOT AN EXIT COLUMN — AND EVERY ROW EITHER IS PERMANENT OR HAS AN OWNER

The right-hand column above used to hold exit conditions. **Five of them failed §11's test** —
they were written over things nobody in this project controls. Both halves of the register are now
explicit about which kind of row each is.

**PERMANENT — E-01, E-02, E-03, E-04.** The four protected IP files. Their review column read
*"on unfreeze"*, which named no date, no trigger and no owner: **a word that sounds like a
condition.** These files may never unfreeze, and an exception waiting for an event that may not
happen is not deferred, it is rotting.

They are now **permanent exceptions with a review trigger**, which is a different thing:

> **Review when the file is modified for any reason, or when the visualiser migrates.**

A trigger fires on an observable event and asks a question. An exit condition promises an ending.
**These have no ending, and saying so is more honest than implying one** — a permanent exception
is a documented decision, and the decision is that `homography.ts` is mathematically dense enough
that splitting it risks correctness. That reasoning does not expire.

**OWNED — E-08, and E-09, E-10, E-11 by inheritance.** E-08's condition was *"when that work is
scheduled on its own"* — someone else's decision on someone else's timing, and the root that four
other exceptions inherit.

> **Owner: V. Called when the wardrobe work pauses.**

**An owner is a real condition because there is someone who can be asked.** A milestone can
recede indefinitely and nobody is answerable for it; a person can say "not yet" and be asked
again next month. That is the difference §11's rule is pointing at, and it is why this is a fix
rather than a rewording.

**`exceptions.json` carries `permanent` and `owner` as fields**, so the distinction is
machine-readable rather than a shade of prose, and `npm run check:exceptions` keeps both halves
in agreement.

**Adding to this table requires an ADR. An exception without an ADR is a violation.**

**AND A ROW IN `docs/architecture/exceptions.json` — ADR-023.** That file is this table's
machine-readable half: tooling cannot read a markdown table reliably, and the promotion count in
§11 is computed from the register rather than from a second list someone keeps by hand. An
exception tooling cannot see silently inflates that count's denominator.
`npm run check:exceptions` fails if either half is missing an `E-` number.

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

**The Junk Drawer.** `utils.ts`, `helpers.ts`, or a `shared/` past 15% of the IN-SCOPE codebase — §2. Measured against the set this document governs, not against everything on disk.

**The God Component.** Fetches, calculates, holds state and renders. Caught by the size limit,
but the size limit is the symptom.

**The Invisible Environment Variable.** `import.meta.env` read directly in a component. Now
nobody knows what ships to the browser.

**The Silent Divergence.** Two copies of the same constant, table or rule. Both correct when
written, one updated six months later.

> **TWO PRESENTATIONS OF ONE FACT IS FINE. TWO FACTS IS NOT.**

That is the test, and it is sharper than counting copies. The footer renders the opening hours as
`Mon–Fri 8am–6pm` and the contact page as `Monday – Friday, 8am – 6pm`. Two strings, one fact —
so `config/site.ts` holds `hoursShort` and `hoursLong`, both derived from a single decision about
when Klay is open, and neither is a duplicate. Collapsing them would force one surface to render
the other's format, which is a worse outcome reached by obeying the rule literally.

**What makes a second copy a divergence is that it can be changed alone and be wrong.** A phone
number written out twice can disagree. A phone number and a `tel:` href cannot — they are one
fact in two forms, and `config/site.ts` keeps both for exactly that reason.

**Apply the test before extracting, not after.** The failure this anti-pattern names is two
things that must agree and might not. Deduplicating two things that were never required to be
byte-identical produces a shared constant nobody can change without breaking a surface it was
never about.

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
