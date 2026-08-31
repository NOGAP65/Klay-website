# LINT BASELINE

**Recorded:** 31 August 2026
**Commit:** Phase 1.2 of the architecture migration
**Command:** `npm run lint` (`eslint .`)
**Result:** `1033 problems (0 errors, 1033 warnings)` — exit code **0**, 18.4 s

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
