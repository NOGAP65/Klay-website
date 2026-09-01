# PHASE 6 SCOPE

**The payment path, as one unit.** Nothing enters Phase 6 that is not on this list beforehand.

**Gate:** `npm run typecheck` **and** a deploy preview. Not the preview alone — Netlify runs
`vite build`, which never invokes `tsc`, and `netlify/` is bundled separately at deploy, so a
green preview proves the bundle builds and nothing more.

**Maintained from Phase 3 onward.** Every phase that defers something into Phase 6 adds it
here in the same commit that defers it. A phase report that says "deferred to Phase 6" without
a line in this file is incomplete.

---

## Seeded at Phase 3 close

### 1. The pricing module, with its four Netlify consumers, in one commit

`src/lib/pricing.ts` → `shared-core/pricing/`. ADR-014, ADR-015.

Consumers that move in the **same commit**, because between them and the module there is no
green state:

| File | Line | Import |
|---|---:|---|
| `netlify/functions/create-checkout-session.ts` | 24 | `../../src/lib/pricing` |
| `netlify/functions/stripe-webhook.ts` | 26 | `../../src/lib/pricing` |
| `netlify/lib/booking.ts` | 10 | `../../src/lib/pricing` |
| `netlify/lib/notify.ts` | 12 | `../../src/lib/pricing` |

Plus eleven consumers in `src/`, which move to `@/core/pricing`.

**Why this is the most dangerous move in the migration.** `tsc -b` catches a broken import;
`vite build` does not, because Vite never compiles `netlify/`. A Phase 3-style gate can
therefore go green with the payment path broken, and the failure surfaces at deploy, on the
endpoint that takes money. MIGRATION_MAP.md R1.

**Verification after the move:** `grep -rn "pricing" netlify/ tsconfig.functions.json
netlify.toml` must return four import sites plus two config entries.

**Do not change the runtime.** ADR-015: `create-checkout-session` stays a serverless function.
Moving pricing authority to the edge is separate, optional, later work with its own ADR.

**AND LEAVE A PERMANENT RE-EXPORT SHIM AT `src/lib/pricing.ts` — ADR-020.** Four visualiser
files import it relatively (`../lib/pricing`), and the visualiser is out of scope and may not
be edited, an import rewrite included. So the module moves to `shared-core/pricing/` and the
old path stays as a real file re-exporting it. Eleven `src/` consumers still repoint to
`@/core/pricing`; only the four frozen ones keep the old path.

This does not weaken §7. There is still exactly one price table — one table reached by two
paths. A re-export cannot diverge from what it re-exports, and divergence is the failure §13
names.

### 2. `@/core` alias into `tsconfig.functions.json`

The alias must exist in **three** places, not two:

- `tsconfig.app.json` — for `src/`
- `vite.config.ts` — for the bundler
- **`tsconfig.functions.json`** — for `netlify/`, which `tsc -b` typechecks as a separate
  project

Adding it to only the first two produces code that typechecks in the app project and fails in
the functions project. ADR-014.

**Also verify Netlify's esbuild resolves it.** `netlify.toml` sets
`node_bundler = "esbuild"`, which reads path aliases from the tsconfig covering the file. If
it does not pick `@/core` up, the functions build locally and fail at deploy. **This is a
deploy-preview check, not a local one.**

### 3. `isValidEmail` and `formatAUD` into `shared-core`

**`isValidEmail`** — `src/shared/lib/validate/email.ts`. There are currently two copies of
this rule: the shared client one, and `netlify/lib/booking.ts:48`. `shared/` has no route into
`netlify/` (§2), so the duplication cannot be resolved from where it sits. In `shared-core` it
can be imported by both runtimes, and the third copy goes.

**`formatAUD`** — currently in `src/lib/pricing.ts`, so it travels with the module by default.
Worth a deliberate decision rather than a default: §7 says *"Formats for display →
`shared/lib/format/`"*, but `shared-core` may import nothing (ADR-014), so pricing cannot reach
a formatter in `shared/`. Either it stays inside `shared-core/pricing/` — money formatting is
pricing-adjacent and this is the pragmatic answer — or `shared-core/format/` is created as a
sibling. **Decide before the move, not during it.**

### 4. Remove the `useKlayStore` shim and the inert `blindHeight`

`src/store.ts` is a compatibility shim created in Phase 3. It goes when its four consumers
are repointed at `@/app/store/scrollStore`:

`Nav.tsx:52`, `HomePage.tsx:114`, `ProductDetailPage.tsx:15`, `ProductsPage.tsx:45`.

`blindHeight` and `setBlindHeight` are dead — written by nobody, read by nobody, confirmed
across the whole of `src/` in the Phase 0 audit. They survive as inert constants in the shim
and are deleted with it.

**Carry the selector-forwarding note across before deleting the file.** It is recorded in
`app/store/scrollStore.ts` so it survives the shim, but check it is still accurate at the time.

---

## Added during Phase 4

### 5. **BLOCKING** — remove the `feature → legacy` boundary allowance

**Phase 6 does not close while this exists.**

`eslint.config.js` currently permits any file under `src/features/` to import anything under
`src/`. While it is there, most of the layer model is switched off: the rule that says a
feature may reach only design-system, shared, config, core, its own internals and other
feature barrels is, in practice, *"a feature may reach anything"*.

It is scaffolding. A migrated feature still imports `Nav`, `Footer`, `lib/api` and
`data/products`, none of which have reached their destination. Without the allowance the first
feature to move reported violations nobody could action.

**It comes out when the countdown below reaches zero, and not before.** Removing it earlier
turns unactionable warnings into a wall; leaving it after that is leaving the layer model off.

**THE COUNTDOWN CAN NO LONGER REACH ZERO — ADR-020, AND THIS IS OPEN.** Three of catalogue's
edges point into `src/visualiser/` (`ProductDetailPage` imports `KlayConfigurator`,
`useVisualiserStore`, `VisualiserControls`), and `src/data/products.ts` and the `theme.ts` shim
are permanent for the same reason. Those edges never clear, so "delete the allowance when the
count hits zero" no longer terminates.

**A decision is needed and has not been made.** The likely shape is a narrow, named element
type — `legacy-visualiser`, matching the four out-of-scope paths, which features may import and
nothing else may — so the blanket `feature → anything in src/` allowance can still come out.
That is a proposal in ADR-020, not a decision. **Until it is decided, item 5 stays BLOCKING and
its exit condition is unwritten.**

#### Countdown — reported at the end of every remaining P4 feature

| Measured at | Feature files reaching legacy | Distinct targets | Edges | Clearable | Permanent |
|---|---:|---:|---:|---:|---:|
| **P4-1 marketing** | 4 | 4 | 9 | 9 | 0 |
| **P4-3 catalogue** | 9 | **12** | 26 | — | — |
| **P4-3, re-measured after ADR-020** | 9 | 12 | 26 | **19** | **7** |
| **P4-4 cart** | 10 | 11 | 27 | **20** | 7 |

**The P4-3 row recorded 8 distinct targets. There were 12.** The targets table below listed
eight rows summing to 22 of the 26 edges; `src/store/cartStore.ts` and the three
`src/visualiser/` modules were counted in the edge total but never written down. Corrected
here rather than silently — a countdown whose target list does not reconcile to its own edge
count is not a countdown.

**And `total` is no longer the number to watch. `clearable` is.** ADR-020 made seven of the
twenty-six permanent, so a countdown to zero on the total would never terminate.

**The targets, and what clears each:**

| Target | Edges | Cleared by |
|---|---:|---|
| `src/components/Nav.tsx` | 5 | **Phase 5** — `app/layouts/`, decision D |
| `src/components/Footer.tsx` | 5 | **Phase 5** — `app/layouts/`, decision D |
| `src/data/products.ts` | 4 | **NOTHING — OPEN.** ADR-020 removed P4-7, which was decision H's slot. Six visualiser files import it and may not be edited, so it can neither be split nor moved without a permanent shim. **PERMANENT.** |
| `src/lib/api.ts` | 2 | **Phase 6** — moves with booking |
| `src/store.ts` | 2 | **Phase 6** — item 4, the useKlayStore shim |
| `src/lib/pricing.ts` | 2 | **Phase 6** — item 1, moves to shared-core behind a permanent re-export shim |
| `src/lib/bookingLink.ts` | 1 | **Phase 6** — decision K, moves with booking |
| `src/components/home/primitives.tsx` | 1 | **P4-6** — decision F's four-way split; `PhotoTile` goes to catalogue |
| ~~`src/store/cartStore.ts`~~ | ~~1~~ | **CLEARED at P4-4** — it is `features/cart/store/cartStore.ts` now, reached through the barrel. The first target this countdown has ever retired. |
| `src/visualiser/KlayConfigurator.tsx` | 1 | **NOTHING — ADR-020.** `ProductDetailPage`'s visualiser embed. **PERMANENT.** |
| `src/visualiser/useVisualiserStore.ts` | 1 | **NOTHING — ADR-020. PERMANENT.** |
| `src/visualiser/VisualiserControls.tsx` | 1 | **NOTHING — ADR-020. PERMANENT.** |

**It rose, as predicted: 9 edges → 26 after one more feature.** Nav and Footer went from six
edges to ten, and catalogue brought four new targets with it. This is the shape to expect.

**Expect the count to rise through P4 and collapse at Phase 5.** Every feature that moves
brings its own `Nav`/`Footer` imports with it, so the number gets worse before it gets better;
those two targets carry **twelve of the twenty-seven** edges after P4-4 and will carry most of
whatever P4-6 adds.

**P4-4 retired the first target this countdown has ever cleared** — `src/store/cartStore.ts`,
which is now inside the feature that owns it. Targets go down one at a time; edges go up. Both
are the expected shape.

Command: `node tools/legacy-countdown.mjs`.

---

## Standing entries — deferred to Phase 6 by earlier decisions

| Item | Source |
|---|---|
| The `theme.ts` shim and the deprecated colour and spacing aliases | Phases 2.2a, 2.2c, 2.3. They existed for the frozen visualiser and were to go at P4-7. **ADR-020 deleted P4-7, so they are permanent for the life of this migration** and go with the separate visualiser work |
| `src/components/FormField.tsx` shim | Phase 2.4 — goes when its two consumers migrate |
| Flip zeroed lint rules from `warn` to `error` | Phase 6.1. `klay/no-direct-env-access` is the first eligible, at 0 since Phase 2.1 |
| `knip` and `jscpd` baselines | Phases 6.3, 6.4 — deliberately not taken earlier, against a structure that was about to change |
| Banned-filename CI script | Currently 0 findings, so nothing to hold; worth adding before it can regress |
| `no-restricted-imports` scoping Supabase to `api/` | Waits for the first `api/` directory |
| Remove the temporary `feature → legacy` boundary allowance | Phase 4 scaffolding — see the note in `eslint.config.js`. It must not survive the migration |
