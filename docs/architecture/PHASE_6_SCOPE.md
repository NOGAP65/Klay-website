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

**THE COUNTDOWN CANNOT REACH ZERO — ADR-020. THE EXIT CONDITION IS NOW WRITTEN.**

Three of catalogue's edges point into `src/visualiser/` and are permanent, as are the surviving
`src/data/products.ts` edges. A countdown to zero would never terminate.

**Decided at P4-5. ADR-020's proposal is accepted and the element type exists.**
`eslint.config.js` now declares `legacy-visualiser` — `src/visualiser/**`,
`src/visualiser-lab/**`, `VisualiserPage.tsx`, `VisualizerLabPage.tsx` — ahead of `legacy`,
because boundaries takes the first matching pattern. A feature reaching **that** is a permanent,
allowed edge. A feature reaching the rest of `legacy` is scaffolding.

> ### EXIT CONDITION
>
> **The countdown stands at its permanent floor, and `feature → legacy-visualiser` is the only
> surviving allowance.** At that point the blanket `{ to: { element: { type: 'legacy' } } }`
> line is deleted from the `feature` policy — one line — and the layer model is fully on.

**THE FLOOR IS A MEASUREMENT, NOT A TARGET.** It has moved twice already: 7 when the proposal
was written, **6** after P4-5 took a `data/products.ts` edge away with the SKU split, and **10**
after P4-6, because `VisualiserShowcase` came into `feature:home` carrying three imports of
`src/visualiser/` with it — the same shape `ProductDetailPage` already had.

`npm run check:countdown` prints the floor as `PERMANENT` on every run. It rises whenever a
feature absorbs a file that talks to the out-of-scope zone, and P4-6 was the last such
absorption.

### THE FLOOR FREEZES WHEN PHASE 6 OPENS

**Whatever `PERMANENT` reads on the day Phase 6 opens is recorded here, and that number gates
Phase 6 closing.**

Up to that point the floor is a live measurement and moving is normal — it has moved three
times already (7 → 6 → 10). From that point it is a constant, and the reason is that an exit
condition which recalculates itself is not an exit condition. A floor free to rise during
Phase 6 would let the phase close by growing its own target.

**If the floor moves after the freeze, PHASE 6 DOES NOT CLOSE, and it is reported rather than
re-baselined.** A rise means a feature gained a new permanent edge into the out-of-scope zone
during the phase that was supposed to be removing scaffolding — which is a scope change and a
decision for V, not an arithmetic adjustment.

| | |
|---|---|
| **Floor at Phase 6 open** | *(record it here on the day — do not pre-fill it)* |
| **Measured by** | `npm run check:countdown`, the `PERMANENT` line |
| **If it rises** | Phase 6 does not close. Report to V |
| **If it falls** | Fine, and record why — something left the out-of-scope zone |

Both allowances are in the config now, adjacent and labelled. The temporary one carries
`REMOVE AT PHASE 6.1`; the permanent one carries the reason it survives.

#### Countdown — reported at the end of every remaining P4 feature

| Measured at | Feature files reaching legacy | Distinct targets | Edges | Clearable | Permanent |
|---|---:|---:|---:|---:|---:|
| **P4-1 marketing** | 4 | 4 | 9 | 9 | 0 |
| **P4-3 catalogue** | 9 | **12** | 26 | — | — |
| **P4-3, re-measured after ADR-020** | 9 | 12 | 26 | **19** | **7** |
| **P4-4 cart** | 10 | 11 | 27 | **20** | 7 |
| **P4-5 shared pass** | 11 | 11 | 26 | **20** | **6** |
| **P4-6 home** | 13 | 10 | 34 | **24** | **10** |

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
| `src/data/products.ts` | 4 → **3** | **PARTIALLY CLEARED at P4-5, and the rest is PERMANENT.** Decision H was executed as far as it goes: everything with zero visualiser consumers — the four roller SKUs, the ranges, the counts — moved to `features/catalogue/products.ts`. What stayed is the four symbols six out-of-scope files import: `RYNAMIC_COLOURS`, `CURTAIN_COLOURS`, `HARDWARE_HEX`, `HARDWARE_OPTIONS`. Those three edges do not clear. |
| `src/lib/api.ts` | 2 | **Phase 6** — moves with booking |
| `src/store.ts` | 2 | **Phase 6** — item 4, the useKlayStore shim |
| `src/lib/pricing.ts` | 2 | **Phase 6** — item 1, moves to shared-core behind a permanent re-export shim |
| `src/lib/bookingLink.ts` | 1 | **Phase 6** — decision K, moves with booking |
| ~~`src/components/home/primitives.tsx`~~ | ~~1~~ | **CLEARED at P4-6.** Decision F executed: the CTA family, `useHover` and `TextLink` to `design-system/primitives/`; `SectionHead` and `SectionBand` to `design-system/patterns/`; `scrollToId` to `shared/utils/`; `PhotoTile` to `features/catalogue/`. The file is gone. |
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

---

## DECISIONS REQUIRED BEFORE PHASE 6 OPENS

**These are V's and Bobby's, not the migration's. Phase 6 does not start until both are
answered, because the checkout is what Phase 6 moves and both change its shape.**

They exist because P4-5 deleted the cart's fake checkout (D-01) and the cart now links to
`/book`, which surfaced a gap that had been hidden behind a form that never submitted.

### A. Must checkout accept multiple configurations in one order?

`/book` takes ONE configuration — `type`, `size`, `op`, `qty`, `fabric`, `hw` — and
re-validates it through `parseOrderConfig`. The cart holds many lines. Today the link carries
nothing and a customer with three lines books a measure without them.

**The question is not how to encode a basket in a URL.** It is whether an order is one blind or
many: whether Stripe sees one line item or several, whether the confirmation page and the
webhook reason about an order or a configuration, and whether a measure appointment is booked
per order or per window.

### B. What is the canonical order shape?

`blindType` currently carries two different meanings depending on where it came from.

| Origin | Value | What it is |
|---|---|---|
| The visualiser / `/book` | `'blockout'` | A **pricing input.** `pricePerBlind` keys off it; `isBlindType` validates it |
| A card-configured cart line | `'roller-blinds:blockout:surfmist:white:medium:manual'` | A **composite identity**, built by `configuredLine` so two configurations of one product do not collapse into a single cart row |

The second would not validate if it were sent to `/book`, which is one reason a bridge was not
built. **One field, two incompatible jobs** — and the money path only understands one of them.

The decision is what an order line actually is: which fields are pricing inputs, which are
identity, which are display, and which of those the server must re-derive rather than accept.
§7's rule that the browser may display a price but never decide one depends on the answer.

**Not designed here, deliberately.** Inventing an encoding would be a third implementation of
the thing P4-5 just deleted. DIVERGENCE_LOG.md D-01 records the gap; this records that it
blocks.

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
