# LINT BASELINE

**Recorded:** 31 August 2026
**Commit:** Phase 1.2 of the architecture migration
**Command:** `npm run lint` (`eslint .`)
**Result at Phase 1.2:** `1033 problems (0 errors, 1033 warnings)` — exit code **0**, 18.4 s
**Result at Phase 2 close:** `867 problems (0 errors, 867 warnings)` — exit **0**. See the movement table.

---

## The rule this file exists to serve

SPECIFICATION.md §11:

> Every new rule starts as `warn` with a recorded baseline count. **The count may go down; it
> may not go up.** At zero it flips to `error` permanently. Turning everything to `error` on
> day one produces 400 failures and the rules get switched off.

**Every rule in `eslint.config.js` is currently `warn`.** `eslint .` therefore exits 0 and the
CI lint step passes. It is *this file*, not the exit code, that holds the line during the
migration. A rule flips to `error` in Phase 6.1 only once its count reaches zero.

---

## Before this baseline could be taken

`npm run lint` had **never completed a run on this repository**. It crashed on the first file
it touched:

```
TypeError: Error while loading rule '@typescript-eslint/no-unused-expressions':
Cannot read properties of undefined (reading 'allowShortCircuit')
```

`eslint@9.39.5` was installed against `typescript-eslint@8.8.1`; the base
`no-unused-expressions` rule's schema shape changed between them, and 8.8.1 read a property
that no longer existed. Task 1 of Phase 1.2 was aligning the toolchain:

| Package | Before | After |
|---|---|---|
| `eslint` | 9.39.5 | 9.39.5 (unchanged) |
| `typescript-eslint` | 8.8.1 | **8.68.0** |
| `@typescript-eslint/eslint-plugin` | 8.8.1 | **8.68.0** |
| `@typescript-eslint/parser` | 8.8.1 | **8.68.0** |
| `eslint-plugin-react-hooks` | 5.1.0-rc-fb9a90fa48 | **7.1.1** |
| `eslint-plugin-import` | — | **2.32.0** (new) |
| `eslint-plugin-boundaries` | — | **7.2.0** (new) |
| `eslint-import-resolver-typescript` | — | **4.4.5** (new) |

**One consequence to understand.** `eslint-plugin-react-hooks` moved from a release candidate
of v5 to v7, which ships rules that did not previously exist — `refs`,
`set-state-in-effect`, `immutability`. Those account for 23 of the findings below and would
have been 23 hard errors under the plugin's own recommended severity. They are `warn` here,
like everything else, per §11. They are **not** noise: `react-hooks/refs` at
`KlayConfigurator.tsx:982` is a genuine "ref value read during render", which is the class of
bug that produces a stale first paint.

---

## Baseline by rule

| Count | Of which frozen | Rule | Falls when |
|---:|---:|---|---|
| **295** | 12 | `klay/no-hardcoded-style-values` | Phase 2.3 applies the closed scale, then feature migration repoints call sites |
| **174** | 30 | `import/order` | Autofixable — `eslint --fix`, once the aliases are in use |
| **169** | 16 | `import/no-relative-parent-imports` | Phase 2–4, as `../../` becomes `@/…` |
| **142** | 10 | `import/no-internal-modules` | Phase 4.4, as features gain barrels |
| **129** | 63 | `@typescript-eslint/naming-convention` | A dedicated rename pass — never inside a move phase |
| **50** | 23 | `max-lines-per-function` | Phase 4.3, when components stop doing three jobs |
| **24** | 11 | `complexity` | Same |
| **16** | 14 | `react-hooks/refs` | Needs real fixes; 14 are frozen |
| **15** | 7 | `max-lines` | Phase 4.3 |
| **5** | 2 | `react-hooks/set-state-in-effect` | Needs real fixes |
| **4** | 0 | `react-refresh/only-export-components` | Phase 2.4 / 3.3, splitting components from helpers |
| **3** | 2 | `@typescript-eslint/no-unused-vars` | 2 are in a protected file — see below |
| **2** | 2 | `max-params` | Frozen |
| **2** | 2 | `react-hooks/immutability` | Frozen |
| **2** | 2 | (unused `eslint-disable` directive) | Frozen — the directives target `exhaustive-deps`, restructured in react-hooks 7 |
| **1** | 0 | `klay/no-direct-env-access` | Phase 2.1, when `config/env.ts` exists |

**16 rules reporting. 1,033 findings across 57 files.**

`klay/no-pure-black` reports **zero**, which is correct and expected: the only two occurrences
of `#000000`/`#1A1A1A` in the repository are inside the `StepsBar` comment that forbids them,
and the rule skips comments by default. See the note in `tools/eslint-rules/no-pure-black.js`.

`klay/no-direct-env-access` reports **exactly one** — `src/components/Turnstile.tsx:35`,
which is the single `import.meta.env` read in the whole of `src/`. It is at 1 today and its
job is to keep it there until Phase 2.1 moves it to `config/env.ts`, after which it is 0 and
can flip to `error`.

---

## Frozen zone

**196 of 1,033 findings (19%) are in `src/visualiser/`, `src/visualiser-lab/` or
`KlayConfigurator.tsx`** — the zone excluded from Phases 2–4.

Those 196 cannot fall until the visualiser phase (P4-7). Any measurement of migration progress
should be taken against the **movable 837**, or it will look stalled for reasons that have
nothing to do with the work being done.

`@typescript-eslint/naming-convention` is the clearest case: 63 of its 129 findings are
frozen, so the best achievable count before P4-7 is 66.

---

## Worst files

| Findings | File | |
|---:|---|---|
| 84 | `src/pages/CartPage.tsx` | Also the file with the most hardcoded values (130) and the stub checkout |
| 81 | `src/pages/ProductDetailPage.tsx` | |
| 65 | `src/pages/ProductsPage.tsx` | Contains the largest function in the codebase (580 lines) |
| 58 | `src/pages/BookInstallPage.tsx` | The working checkout — Phase 6, handle with care |
| 42 | `src/visualiser-lab/KlayConfigurator.tsx` | **FROZEN** |
| 42 | `src/visualiser/KlayConfigurator.tsx` | **FROZEN** |
| 37 | `src/components/home/RangeRow.tsx` | |
| 34 | `src/components/home/VisualiserShowcase.tsx` | |
| 34 | `src/pages/HomePage.tsx` | |
| 34 | `src/pages/HowItWorksPage.tsx` | |
| 33 | `src/pages/ContactPage.tsx` | |
| 29 | `src/pages/AboutPage.tsx` | |
| 26 | `src/components/Nav.tsx` | |
| 25 | `netlify/functions/create-checkout-session.ts` | Mostly `import/order` and naming |
| 24 | `src/pages/VisualizerLabPage.tsx` | |

**The top four are all pages**, which is the same finding the migration map reached from two
other directions: the design system was built for `src/components/home/` and never carried
into `src/pages/`.

---

## Rules configured but not yet reporting

| Rule | Count | Why it is zero |
|---|---:|---|
| `boundaries/element-types` | 0 | Every file is currently classified `legacy`, which has no restrictions. It begins reporting as files move into `app/`, `features/*` and `shared/`. |
| `import/no-cycle` | 0 | There are genuinely no circular imports — confirmed independently in Phase 0. |
| `klay/no-pure-black` | 0 | See above. |
| `import/no-self-import`, `import/no-useless-path-segments` | 0 | Clean. |

`boundaries/element-types` being 0 is not a rule that is switched off — it is a rule waiting
for something to enforce. It is the single most important entry in this table, and its count
going **up** during Phases 3–5 is expected and healthy: it means files have arrived somewhere
the rule can see them.

---

## Deviations from §11's mechanism list, recorded

| §11 says | Implemented as | Why |
|---|---|---|
| `no-restricted-syntax` with file override for `import.meta.env` | Custom rule `klay/no-direct-env-access` | Better targeted; also catches `process.env`, reports on the member expression, and its message names `@/config`. Approved 31 Aug. |
| `import/no-restricted-paths` *or* `eslint-plugin-boundaries` for layer direction | `eslint-plugin-boundaries` | §11 offers both; boundaries carries the element model the layer table needs. |
| File size `max-lines` at both warn and error thresholds (§8) | `max-lines` at the **error** threshold only (300 / 60) | Two severities of one rule is not expressible in a flat config, and reporting at 200 as well would roughly double the baseline without adding information. |
| `@typescript-eslint/naming-convention` | Enabled, and it required **typed linting** (`projectService: true`) | §6 requires an `is`/`has`/`can`/`should` prefix on booleans, and only the typechecker knows what is a boolean. Costs ~18 s per full run. |

**Not yet configured**, deferred with reason:

- **`knip`** (unused exports) and **`jscpd`** (duplication) — §11 lists both as CI gates. They
  are scheduled for Phase 6.3 and 6.4, where the work order asks for them. Adding them now
  would record a baseline against a structure that is about to change completely.
- **Banned filenames** — §11 offers "custom rule or CI script". The count is currently **0**
  (Phase 0 confirmed no `utils.ts`, `helpers.ts` or similar anywhere), so there is nothing to
  hold. Worth adding as a CI script before Phase 3, which is the phase that creates the
  temptation.
- **`no-restricted-imports` scoping Supabase to `api/`** — there is no `api/` directory yet
  and no Supabase client in `src/` at all. Add it in Phase 4 alongside the first `api/` folder.

---

## How to re-measure

```bash
npm run lint                      # human-readable, exits 0 while all rules are warn
npx eslint . -f json -o lint.json # machine-readable, for comparing against this file
```

A rule's count going **up** is a regression and should fail review, even though the exit code
is 0. That is the whole contract of §11, and until Phase 6.1 flips rules to `error` it is
enforced by reading, not by the build.

---

# MOVEMENT — PHASE 2 CLOSE

**867 total, 0 errors.** Movable (excluding the frozen visualiser): **667, down from 837.**

| Rule | All: before → after | Movable: before → after | Δ movable |
|---|---|---|---:|
| `klay/no-hardcoded-style-values` | 295 → 295 | 283 → 283 | — |
| `import/no-internal-modules` | 142 → 142 | 132 → 132 | — |
| **`no-restricted-imports`** *(new — replaces the rule below)* | 0 → 140 | 0 → 124 | **+124** |
| **`import/no-relative-parent-imports`** *(retired)* | 169 → 0 | 153 → 0 | **−153** |
| `@typescript-eslint/naming-convention` | 129 → 128 | 66 → 66 | — |
| `max-lines-per-function` | 50 → 51 | 27 → 27 | — |
| **`import/order`** | 174 → 35 | 144 → 3 | **−141** |
| `complexity` | 24 → 24 | 13 → 13 | — |
| `react-hooks/refs` | 16 → 16 | 2 → 2 | — |
| `max-lines` | 15 → 14 | 8 → 8 | — |
| `react-hooks/set-state-in-effect` | 5 → 5 | 3 → 3 | — |
| `react-refresh/only-export-components` | 4 → 5 | 4 → 5 | **+1** |
| `max-params` | 2 → 5 | 0 → 0 | — |
| `@typescript-eslint/no-unused-vars` | 3 → 3 | 1 → 1 | — |
| `react-hooks/immutability` | 2 → 2 | 0 → 0 | — |
| (unused `eslint-disable`) | 2 → 2 | 0 → 0 | — |
| **`klay/no-direct-env-access`** | 1 → **0** | 1 → **0** | **−1** |
| **TOTAL** | **1033 → 867** | **837 → 667** | **−170** |

## What moved, and why

**`import/order`: 144 → 3 movable.** Autofixed, which is what §10 says to do with it
(*"Blank line between groups, autofixed"*). Phase 2.2b briefly pushed this **up** by 32 —
repointing 29 files from `../theme` to `@/ds` moved those imports into a different group — and
the autofix cleared 141. The three that remain are in files the fixer could not order
unambiguously.

**`klay/no-direct-env-access`: 1 → 0.** Phase 2.1. **This rule is now eligible to flip to
`error` in Phase 6.1** — the first to qualify.

**`react-refresh/only-export-components`: +1.** The new `src/components/FormField.tsx` shim
re-exports a component *and* `DANGER` from the same file. It goes when the shim goes, in
Phase 4.

**`max-params` +3 and `max-lines-per-function` +1 are not ours.** Both are entirely inside the
frozen zone — the wardrobe renderer added during Phase 2 — which is why the movable delta for
each is zero. This is the split the movable column exists to show.

## RULE CHANGE — `import/no-relative-parent-imports` replaced

§11 names `import/no-relative-parent-imports` as the mechanism for §10's ban on relative
parent imports. **It is the wrong rule, and the baseline was overstating the problem by 29.**

The rule resolves a specifier before judging it, so it cannot distinguish a relative climb
from an alias. `@/ds` imported from `src/pages/` resolves to a parent directory, so it fires —
four times in `AboutPage.tsx` alone, on imports that are exactly what the migration is trying
to produce. Two consequences: the count could never reach zero, so the rule could never flip
to `error`; and it reported correct behaviour as a violation, which is how a rule gets
switched off.

Replaced with `no-restricted-imports` on the pattern `../*`, which matches the **specifier
text** — the thing §10 is actually about. An alias passes; a `../` does not.

**The genuine count is 124 movable, not 153.** The 29-finding difference was alias imports
being miscounted. This is not progress and is not recorded as any; it is a correction to the
measurement.

This is a §11 mechanism deviation and is recorded in the deviations table above. It does not
require an ADR — §11 lists mechanisms as guidance and the rule it enforces is unchanged.

## Also corrected in Phase 2

**`eslint-plugin-boundaries` was misconfigured and silently failing.** The config was written
against the v5-era API — `rules`, `element-types`, bare string selectors — which loads with
deprecation warnings but **does not parse the same-feature capture policy**:

```
[boundaries/element-types] Detected an unrecognized selector shape in 1 policy at indices: 1.
```

Index 1 is the `feature → its own internals` policy, which is the single most important entry
in the layer table: it is what stops feature A importing feature B. It was being dropped.
Migrated to the v7 API (`boundaries/dependencies`, `policies`, `{ to: { element: … } }`
selectors, `{{…}}` templates) and the warnings are gone.

The rule still reports **0**, correctly — every file is still classified `legacy`, which has
no restrictions. But it will now actually work when features arrive.

**`design-system` was importing the legacy layer, and the rule caught it.** Phase 2.4's first
attempt at `Field.tsx` re-exported `FormField` from `src/components/`.
`boundaries/element-types` rejected it within seconds: §2 says design-system may import
nothing except itself, and a re-export is still an import. The body was moved instead. Worth
recording because it is the first time in this migration that the enforcement caught a
violation the author had not spotted — which is the entire argument of §11.

---

# MOVEMENT — PHASE 3 CLOSE

**845 total, 0 errors.** Movable: **639, down from 837 at the Phase 1.2 baseline.**

| Rule | Movable: baseline → P2 → P3 | Δ from baseline |
|---|---|---:|
| `klay/no-hardcoded-style-values` | 283 → 283 → 283 | — |
| `import/no-internal-modules` | 132 → 132 → **121** | **−11** |
| `no-restricted-imports` *(replaces the rule below)* | — → 124 → **107** | — |
| `import/no-relative-parent-imports` *(retired)* | 153 → 0 → 0 | −153 |
| `@typescript-eslint/naming-convention` | 66 → 66 → 66 | — |
| `import/order` | 144 → 3 → **3** | **−141** |
| `max-lines-per-function` | 27 → 27 → 27 | — |
| `complexity` | 13 → 13 → 13 | — |
| `max-lines` | 8 → 8 → 8 | — |
| `react-refresh/only-export-components` | 4 → 5 → 5 | +1 |
| `react-hooks/set-state-in-effect` | 3 → 3 → 3 | — |
| `react-hooks/refs` | 2 → 2 → 2 | — |
| `@typescript-eslint/no-unused-vars` | 1 → 1 → 1 | — |
| `klay/no-direct-env-access` | 1 → **0** → **0** | **−1** |
| **TOTAL movable** | **837 → 667 → 639** | **−198** |

## What moved in Phase 3

**`no-restricted-imports`: 124 → 107.** Seventeen relative parent imports retired by the
shared-layer moves. This is the rule that will fall furthest during Phase 4, since every
feature that gains a barrel takes a batch of `../../` with it.

**`import/no-internal-modules`: 132 → 121.** Eleven consumers now import `@/shared` — the
barrel — rather than reaching for `../components/Turnstile` directly. §1 rule 3 working as
intended for the first time.

**`import/order` held at 3** after two autofix passes. The `@/shared` moves pushed it to 34
mid-phase; `eslint --fix` cleared 31.

## Rules that did not move, and why that is expected

**`klay/no-hardcoded-style-values` is unchanged at 283.** The scale was adopted and applied in
Phase 2.3, but applying it to hardcoded literals is a separate pass that belongs with the
features that own them — ADR-017. **This number is the measure of whether the scale worked,
and it will not begin falling until Phase 4.**

**`@typescript-eslint/naming-convention` is unchanged at 66.** It is a rename, and renames do
not happen inside move phases.

**`max-params` rose from 2 to 8 in the ALL column and stayed at 0 movable.** All six are in
the wardrobe renderer being written in the frozen zone.
