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

Those 196 cannot fall until the visualiser phase (P4-7). **SUPERSEDED — ADR-020: there is no visualiser phase, so they never fall. See the Phase 4 backfill at the end of this file.** Any measurement of migration progress
should be taken against the **movable 837**, or it will look stalled for reasons that have
nothing to do with the work being done.

`@typescript-eslint/naming-convention` is the clearest case: 63 of its 129 findings are
frozen, so the best achievable count before P4-7 is 66. **ADR-020: 66 is now a permanent floor, not a waypoint.**

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

---

# MOVEMENT — PHASE 4, BACKFILLED

**Recorded:** 1 September 2026, three phases late. P4-1 and P4-3 both closed without an entry
here, which is a process failure and not a small one: §11's mechanism is *"every new rule
starts as `warn` with a recorded baseline count. The count may go down; it may not go up."* A
count that is not written down cannot be compared, and a rule whose count is never compared is
already advisory. **The measurement below is the whole point of the mechanism, and it was
skipped twice.**

## How these numbers were taken

All three snapshots were re-measured **by the same method, from the commits themselves**, in
throwaway git worktrees — not read out of commit messages. `npx eslint . -f json`, aggregated
by rule, at `b77c47b` (Phase 3 close), `b017040` (P4-1) and the current tree (P4-3).

Four columns, because "the count" has meant different things at different times:

| Column | Excludes |
|---|---|
| **ALL** | nothing |
| **MOVABLE** | `src/visualiser/`, `src/visualiser-lab/`, `VisualiserPage.tsx`, `VisualizerLabPage.tsx` |
| **IN-SCOPE (old)** | the two visualiser *directories*, and `netlify/` |
| **IN-SCOPE (new)** | the above **plus** the two visualiser *pages* — the ADR-020 boundary |

`IN-SCOPE (old)` is the measure the P4-1 and P4-3 commit messages quote, and it reproduces
them exactly: 583 at P4-1, 497 at P4-3. **From here on, `IN-SCOPE (new)` is the number that
counts**, because ADR-020 put those two pages permanently out of scope alongside the
directories.

## The totals

| Snapshot | ALL | MOVABLE | IN-SCOPE (old) | IN-SCOPE (new) |
|---|---:|---:|---:|---:|
| **Phase 3 close** — `b77c47b` | 870 | 628 | 588 | 552 |
| **P4-1 marketing** — `b017040` | 866 | 623 | **583** | 547 |
| **P4-3 catalogue** — current | **779** | **537** | **497** | **461** |
| **Δ across Phase 4 so far** | **−91** | **−91** | **−91** | **−91** |

## Per rule, Phase 3 close → P4-1 → P4-3

| Rule | ALL | MOVABLE | IN-SCOPE (new) |
|---|---|---|---|
| `klay/no-hardcoded-style-values` | 295 → 295 → **207** | 269 → 269 → **181** | 269 → 269 → **181** |
| `import/no-internal-modules` | 131 → 129 → 129 | 111 → 109 → 109 | 87 → 85 → 85 |
| `@typescript-eslint/naming-convention` | 128 → 128 → 128 | 66 → 66 → 66 | 66 → 66 → 66 |
| `no-restricted-imports` | 123 → 122 → **124** | 97 → 96 → **98** | 73 → 72 → **74** |
| `import/order` | 60 → 58 → 58 | 28 → 26 → 26 | 3 → 1 → 1 |
| `max-lines-per-function` | 52 → 53 → 53 | 25 → 25 → 25 | 24 → 24 → 24 |
| `complexity` | 25 → 25 → 25 | 13 → 13 → 13 | 11 → 11 → 11 |
| `react-hooks/refs` | 16 → 16 → 16 | 2 → 2 → 2 | 2 → 2 → 2 |
| `max-lines` | 15 → 15 → 15 | 8 → 8 → 8 | 8 → 8 → 8 |
| `max-params` | 8 → 8 → 7 | 0 → 0 → 0 | 0 → 0 → 0 |
| `react-refresh/only-export-components` | 5 → 5 → 5 | 5 → 5 → 5 | 5 → 5 → 5 |
| `react-hooks/set-state-in-effect` | 5 → 5 → 5 | 3 → 3 → 3 | 3 → 3 → 3 |
| `@typescript-eslint/no-unused-vars` | 3 → 3 → 3 | 1 → 1 → 1 | 1 → 1 → 1 |
| `react-hooks/immutability` | 2 → 2 → 2 | 0 → 0 → 0 | 0 → 0 → 0 |
| (unused `eslint-disable`) | 2 → 2 → 2 | 0 → 0 → 0 | 0 → 0 → 0 |
| **TOTAL** | **870 → 866 → 779** | **628 → 623 → 537** | **552 → 547 → 461** |

## THE NUMBER THIS PHASE EXISTED TO PRODUCE

> ### `klay/no-hardcoded-style-values` in `features/catalogue`: **90 → 2**

**This is the scale validating, and it is the first evidence that any of §9 worked.**

§9 was written against a specific, humiliating finding: `theme.ts` was well built and had
**zero consumers across all twelve files in `src/pages/`**, with 127 hardcoded pixel values and
21 hardcoded font sizes in their place. *"The tokens were not the problem. Optionality was."*

Phase 3 close said as much, and predicted the shape of the answer:

> *"`klay/no-hardcoded-style-values` is unchanged at 283. The scale was adopted and applied in
> Phase 2.3, but applying it to hardcoded literals is a separate pass that belongs with the
> features that own them. **This number is the measure of whether the scale worked, and it will
> not begin falling until Phase 4.**"*

It fell. **119 substitutions across two passes: 59 landed on a step exactly; 60 moved, almost
all by 1–4px, the largest single move being 90 → 80 in one padding.** A closed eight-step scale
absorbed a real feature's worth of arbitrary values with a maximum distortion of a few pixels —
which is the empirical case for §9's *"a scale constrains, it does not accommodate"* that the
proposal could only argue in principle.

**Two findings remain in catalogue, and both are deliberate.** Both are `boxShadow` literals
close to but not equal to `shadow.rest`. Mapping them would change how two shadows look, and
the shadow scale was never part of what ADR-017 approved — it has four tokens, two with zero
consumers, and call sites writing their own. **It wants the same treatment `space` and `type`
just had, as its own decision.**

**And the conversion found a real gap rather than merely applying the scale.** ADR-017 approved
eight type steps, but `type.ts` carried role names for only six — 20 and 56 were approved sizes
with no way to reach them, so the converter pushed three call sites at 20px down to `lead` (16),
a 4px change to values that were already exactly on the scale. `type.subhead` (20) and
`type.title` (56) were added. **The scale is still closed at eight; this closed a gap rather
than adding a ninth step** — and only a real conversion pass could have surfaced it.

## What else moved, and the one thing that went up

**`no-restricted-imports` rose: 96 → 98 movable.** This is the only rule that went up across
Phase 4, and under §11 a rise is a regression that should fail review. **It is accepted here,
with a reason.** Every file catalogue absorbed brought its `../../` relative climbs with it, and
those climbs are the *measure* of the migration's remaining work rather than new debt — they
clear at Phase 5 (Nav, Footer) and Phase 6 (api, pricing, store, bookingLink).
PHASE_6_SCOPE.md's countdown tracks exactly these edges and is the instrument that holds them.

**`import/no-internal-modules` did not fall at P4-3 (109, flat).** Phase 3 predicted this rule
would *"fall furthest during Phase 4, since every feature that gains a barrel takes a batch of
`../../` with it."* It did not, for the same reason: catalogue gained a barrel, but its files
still reach legacy targets that have no barrel to import.

**`marketing` still carries 49 `klay/no-hardcoded-style-values` findings.** P4-1 moved the
files and did not convert the tokens; P4-3 converted catalogue's. **This is a real gap, not a
rounding error** — `marketing` is the largest remaining pocket of hardcoded values in a
migrated feature, and it should be converted before Phase 4 closes rather than left as the one
feature that moved without being brought onto the scale.

## A discrepancy this backfill found

The P4-1 and P4-3 commit messages both quote a starting figure of **761** in-scope findings.
**No measurement of `b77c47b` reproduces 761 under any of the four scope definitions above** —
the closest is 588. The 583 and 497 endpoints reproduce exactly, so only the baseline they were
subtracted from is unaccounted for.

**Recorded rather than reconciled.** Inventing an explanation for a number nobody can reproduce
is precisely the failure this file guards against, and the two figures that matter — where P4-1
and P4-3 actually landed — are measured and sound.

## Rules that did not move, and why that is still expected

**`@typescript-eslint/naming-convention` held at 66 movable across all three snapshots.** It is
a rename, and renames do not happen inside move phases — ADR-018.

**`max-lines`, `complexity` and `max-lines-per-function` are all flat.** Phase 4 moves files; it
does not split them. The `constants.ts`/`facets.ts` split and the `sortProducts` extraction at
P4-3 were cuts at a seam, and neither half changed.

## AND THE FROZEN-ZONE FOOTNOTE IS NOW PERMANENT — ADR-020

This file previously said the 196 findings inside `src/visualiser/` and `src/visualiser-lab/`
*"cannot fall until the visualiser phase (P4-7)"*, and that *"the best achievable count before
P4-7 is 66"* for `naming-convention`.

**There is no P4-7.** ADR-020 removed the visualiser from the migration entirely. Those
findings — **242 today, 31% of the total**, measured against the ADR-020 boundary — do not fall
in this project at all, and the files may not be edited to make them fall, lint fixes
explicitly included.

**So `ALL` is now a misleading headline and `IN-SCOPE (new)` is the honest one.** A future
reader comparing `ALL` across the migration would conclude the codebase was barely improving,
when in fact 31% of the count is a fixed floor this project is not permitted to touch.

---

# MOVEMENT — P4-4 CART

| Measure | P4-3 | P4-4 | Δ |
|---|---:|---:|---:|
| ALL | 779 | 793 | +14 |
| MOVABLE | 537 | 543 | +6 |
| IN-SCOPE (new) | 461 | 467 | +6 |
| **IN-SCOPE, excluding untracked parallel work** | **461** | **454** | **−7** |

**Read the last row, not the first three.** Fourteen findings arrived during this phase from
work that is not part of it: an untracked `scripts/cut-wardrobe-stickers.mjs` (13 × `no-undef`,
because the `globals.node` override in `eslint.config.js` covers `tools/**` and `*.config.*` but
not `scripts/**`) and one `max-depth` in an untracked `src/visualiser-lab/wardrobeComposite.ts`.
Both belong to the wardrobe work, neither is committed, and neither is P4-4's.

**P4-4's own contribution is −7**, all of it relative climbs retired by the move:
`no-restricted-imports` 98 → 94 movable, `import/no-internal-modules` 109 → 106.

**`scripts/**` wants the same `globals.node` override `tools/**` has.** Left alone here because
the directory is untracked wardrobe tooling that arrived mid-phase, and editing another
session's in-flight work to tidy a lint count is how merge conflicts get made. Worth doing when
it settles.

## The token conversion was deliberately NOT done, and this is the number

> `klay/no-hardcoded-style-values` in `features/cart`: **67, unchanged.**

P4-3 converted catalogue's 90 → 2 and that was the phase's headline. **P4-4 did not do the
equivalent for cart, on purpose.**

`CartPage.tsx` is 473 lines whose submit handler is `alert()` + `clearCart()`. It is D-01 — the
divergence that caused SPECIFICATION.md to be written — and MIGRATION_MAP R8 says so in terms:

> *"130 hardcoded values, zero design-system usage, a 464-line function, nine form fields, and a
> submit handler that is `alert()` + `clearCart()`. Migrating it faithfully means carefully
> relocating a large amount of code that does nothing. **Flagged because it is a scoping
> question:** if the cart checkout is going to be rewritten anyway, doing that before P4-4 rather
> than after saves migrating 473 lines twice."*

Converting 67 literals inside a page that may be rewritten or deleted is the second half of that
same waste. **The move was structural and reversible; the conversion would not have been.** It
waits on the product decision about whether the cart checks out or links to `/book`.

**So Phase 4 will close with two features off the scale, not one:** `marketing` at 49 and `cart`
at 67. Marketing's is an oversight to correct. Cart's is a decision, recorded here so the two are
not mistaken for each other.

---

# RULE NOT ENFORCING — `import/no-cycle` IS BLIND TO BARREL CYCLES

**Found at P4-4. This belongs with the Phase 2 finding that `eslint-plugin-boundaries` was
misconfigured and silently failing, and it is the more serious of the two.**

§11 lists *"No circular imports → `import/no-cycle`"*. The rule is configured
(`['warn', { maxDepth: Infinity, ignoreExternal: true }]`), `eslint-import-resolver-typescript`
is installed and resolving — `import/no-unresolved` is silent on every `@/` specifier — and the
rule reports **zero**.

**There are two real runtime cycles.**

```
src/features/cart/index.ts
  -> src/features/cart/components/CartPage.tsx
  -> src/components/Nav.tsx
  -> src/features/cart/index.ts

src/features/catalogue/index.ts
  -> src/features/catalogue/components/ProductsPage.tsx
  -> src/features/catalogue/components/ProductCard.tsx
  -> src/components/home/primitives.tsx
  -> src/features/catalogue/index.ts
```

Both close through a value import — `useCartStore` and `ProductGlyph`, neither type-only — so
neither is erased at compile time. Tested at `error` level with a finite `maxDepth` and with
`ignoreExternal: false`; the rule reports nothing either way. **It does not traverse a barrel's
`export … from` re-exports**, and a barrel is the only shape of cycle this architecture can now
produce.

**Phase 0's "Circular imports: ZERO" is therefore stale**, and has been since P4-3 — the
catalogue cycle shipped in that commit, unnoticed, in a repository that believed it had a rule
watching for exactly this.

**`tools/cycle-check.mjs` exists until the rule can be made to work.** `npm run check:cycles`.
It is a DFS over the same alias map the countdown uses, and it excludes type-only edges — an
`import type` cannot form a runtime cycle, and a checker with false positives gets switched off.

## The cart cycle was introduced knowingly, and here is the reasoning

It would have been avoided by having `Nav` import `@/features/cart/store/cartStore` directly.
That trades a cycle for a violation of §1 rule 3 — *"every feature has exactly one public
entrance"* — which is the single rule this migration exists to establish. **A transitional cycle
is the cheaper of the two, and it is not close.**

Both cycles have one cause: **a page imports the chrome, and the chrome imports the feature.**
`CartPage` imports `Nav`; `Nav` reads the basket. `ProductCard` imports `PhotoTile` from
`components/home/primitives`; `primitives` reads `ProductGlyph` from catalogue.

**Both dissolve at Phase 5**, decision D: `Nav` and `Footer` move to `app/layouts/`, the app
layer composes them around routes, and pages stop importing their own chrome. The app layer is
explicitly permitted to import feature barrels, and nothing imports back. The catalogue cycle
additionally clears at P4-6, when decision F splits `primitives.tsx` four ways.

**Baseline: 2. It may go down. It may not go up.** Same contract as every other count in this
file, now with something that can actually measure it.

---

# MOVEMENT — P4-5

| Measure | P4-4 | P4-5 | Δ |
|---|---:|---:|---:|
| ALL | 793 | 714 | −79 |
| MOVABLE | 543 | 454 | −89 |
| IN-SCOPE (new) | 467 | 378 | −89 |
| **IN-SCOPE, excluding untracked parallel work** | 454 | **355** | **−99** |

The untracked `scripts/cut-wardrobe-stickers.mjs` now contributes 23 `no-undef` findings, up
from 13, as the wardrobe work continues. Still not this phase's, still not committed. **`scripts/**`
wants the `globals.node` override that `tools/**` has** — it is the second phase in a row this
has been noted, and it is a two-line config change whenever that directory settles.

## The rule that moved, and it moved twice as far as P4-3

> ### `klay/no-hardcoded-style-values`: **181 → 89 movable.** Ninety-two gone.

**Forty-three were deleted rather than converted**, with the cart's checkout form. **Forty-nine
were converted**, in marketing.

| Feature | Before | After | How |
|---|---:|---:|---|
| `catalogue` | 90 | 2 | Converted at P4-3 |
| `marketing` | 49 | **0** | Converted at P4-5 |
| `cart` | 67 | **24** | 43 deleted with the form; the basket view keeps the rest |

**Marketing is the first feature to reach zero.** The conversion is the same shape P4-3
reported: most values landed on a step exactly, and the moves were small — 30 → 26, 28 → 26,
48 → 40, 13 → 14, 11 → 12, 18 → 16.

**Three were not small, and they were the interesting ones.** The three page heroes carried
`180px`, `200px` and `140px` of vertical padding. The space scale is closed at eight steps and
tops out at `focal` (120), so there is no step for any of them — they are not between two steps,
they are **past the end of the scale**.

§9 gives two legal answers and this took the first: *"change the layout to use an existing
step."* All three became `space.focal`. The pages were driven in a browser before and after to
size the change rather than guess at it:

| Page | First heading top, before → after | Page height |
|---|---|---|
| About | 274 → 244 | 2883 → 2878 |
| Contact | 218 → 158 | 1597 → 1456 |
| How it works | 238 → 158 | 4760 → 4675 |

Contact and How-it-works each lost 80px of hero air, which is a real and visible change, and it
is the change §9 asks for: **the scale constrains, the layout moves.** Screenshotted at 1440px
and checked — both heroes still read as heroes.

## The cycle baseline went UP, 2 → 5, and this is the accounting

The contract set at P4-4 was *"baseline 2, may go down, may not go up."* It went up. Recorded
rather than quietly re-baselined.

**All five cycles have one cause, and it is one sentence: app chrome imports a feature barrel,
and feature barrels export pages that import app chrome.**

```
Footer -> catalogue barrel -> ProductsPage      -> Footer
Footer -> catalogue barrel -> ProductDetailPage -> Footer
cart barrel -> CartPage -> Footer -> catalogue barrel -> ProductDetailPage -> cart barrel
cart barrel -> CartPage -> Footer -> catalogue barrel -> ProductsPage -> Nav -> cart barrel
catalogue barrel -> ProductsPage -> ProductCard -> primitives -> catalogue barrel
```

The three new ones arrived with the `data/products.ts` split: `Footer` used to read `PRODUCTS`
from a legacy leaf module that imported nothing, and now reads it from the catalogue barrel,
which is the correct import and also closes a loop.

**The alternative was to have `Footer` import `@/features/catalogue/products` directly.** That
is an internals import, and §1 rule 3 — one public entrance — is the rule the whole migration
exists to establish. **Trading it for a cycle count is the wrong trade**, and it is the same
judgement made for `Nav` at P4-4, for the same reason.

**Verified harmless at runtime, not assumed harmless.** Every route on every cycle was loaded in
a real browser with a populated basket: `/`, `/cart`, `/products`, `/products/dusk`, `/book`.
No console errors, no page errors, every route rendered, the nav badge — the live edge of the
cart cycle — rendered its count. A cycle only bites when a module is *used* during evaluation of
the partially-initialised graph, and every use here is inside a component body.

**All five clear at Phase 5, decision D**, when `Nav` and `Footer` become `app/layouts/` and the
app layer composes them around routes instead of pages importing their own chrome. The
catalogue/primitives one additionally clears at P4-6.

**New baseline: 5. It may go down. It may not go up.** `npm run check:cycles`.

## And the rule count that is now trustworthy

Every number in this file was, until today, produced by rules nobody had ever asked to prove
they worked. `npm run verify:rules` now does that — 13 rules by fixture, 2 by probe, 1 recorded
blind (ADR-022). **`import/no-cycle` is the blind one, and it is worse than P4-4 reported:** it
does not merely fail to traverse barrels, it reports nothing against a two-file `a → b → a`
relative cycle built for no other purpose. It is inert, and §11's circular-import line has never
enforced anything.

---

# PROMOTION QUEUE AUDIT — 1 September 2026

**Taken under SPECIFICATION.md §11 as amended by ADR-022.** Promotion from `warn` to `error`
requires BOTH conditions: the count has reached zero, **and** the rule has been demonstrated to
fire. Every rule at or near zero is audited here before any promotion happens.

| Rule | Count | Fires? | Verdict |
|---|---:|---|---|
| `klay/no-direct-env-access` | **0** everywhere, since Phase 2.1 | **YES** — fixture `direct-env-access.ts` | **PROMOTABLE.** Both conditions met. The first rule in this codebase to be promoted on evidence rather than on an absence |
| `boundaries/dependencies` | **0** everywhere | **YES** — probes at `src/design-system/probe.ts` and `src/shared/probe.ts` | **HOLD — conditional zero.** See below |
| `import/no-cycle` | **0** everywhere | **NO — INERT** | **REMOVED FROM THE QUEUE.** See below |
| `klay/no-pure-black` | 1 ALL, **0 movable** | **YES** — fixture `pure-black.ts` | **NOT YET.** Its one finding is inside the out-of-scope visualiser and can never be cleared (ADR-020), so its ALL count never reaches zero. Promotable only against the movable count, which is a different contract and needs its own decision |
| `max-params` | 9 ALL, **0 movable** | **YES** — fixture `too-many-params.ts` | **NOT YET.** Same shape: all nine are in the out-of-scope wardrobe renderer |
| `max-depth` | 1 ALL, **0 movable** | **YES** — fixture `too-deep.ts` | **NOT YET.** Same shape |
| `react-hooks/immutability` | 2 ALL, **0 movable** | Not fixtured | **NOT YET**, and it needs a fixture before it could be |

## `import/no-cycle` — off the queue, not waiting in it

It satisfied condition 1 and would have been promoted. It fails condition 2 completely: it
reports nothing against `tools/rule-fixtures/cycle-simple`, a two-file `a → b → a` relative
cycle whose only purpose is to violate it. Tested at `error` level, with a finite `maxDepth`,
and with `ignoreExternal: false`.

**Promoting it would have made `error` the reward for doing nothing**, and locked that in
permanently — §11 says the flip to `error` is one-way. Meanwhile five real cycles exist in
`src/`, found by `tools/cycle-check.mjs`, which is doing the job §11 assigned to this rule.

**It comes off the queue and onto the blind list.** It returns only when
`npm run verify:rules` reports it firing, which the runner checks on every run and prints as
`NOW FIRES — re-test and promote`.

## `boundaries/dependencies` — a real zero, measured against a permissive config

It fires, and its count is genuinely zero. It is still on hold, because **the thing it would
catch is currently allowed.** The temporary `feature → legacy` allowance permits a feature to
import anything under `src/`, which is most of what this rule exists to forbid. Its zero is
therefore a statement about the configuration, not about the code.

**Promote it after PHASE_6_SCOPE item 5** — when the blanket allowance is deleted and only
`feature → legacy-visualiser` survives. Whatever the count is at that moment is the first
unconditional measurement this rule has ever produced.

## The general shape this audit exposed

**Three rules sit at zero movable and non-zero ALL**, and all three are non-zero only inside the
out-of-scope visualiser. Under ADR-020 those findings never fall, so those rules can never
satisfy condition 1 as written — the count *never* reaches zero.

**That is a real gap in §11's mechanism, and it is not resolved here.** Either promotion is
measured against the movable count for rules whose only remaining findings are out of scope, or
those rules stay `warn` forever. The first needs an ADR and a precise definition of "movable";
the second quietly abandons three working rules. **Flagged, not decided.**

---

# MOVEMENT — P4-6 HOME. PHASE 4 IS COMPLETE.

| Measure | P4-5 (+ fixes) | P4-6 | Δ |
|---|---:|---:|---:|
| ALL | 693 | 673 | −20 |
| MOVABLE | 433 | 413 | −20 |
| IN-SCOPE (new) | 357 | 337 | −20 |

**Runtime cycles: 5 → 4.** The catalogue/`primitives` cycle is gone, and it went for the reason
P4-5 predicted: `PhotoTile` is now inside catalogue, so `ProductCard` imports a sibling instead
of reaching out to `components/home/primitives`, which reached back into catalogue's barrel for
`ProductGlyph`. **A cycle removed by putting a file where it belonged, not by working around
it** — which is the argument for the whole exercise in miniature.

The remaining four are all `Nav`/`Footer` ↔ feature barrels and all clear at Phase 5.

## Decision F, executed — one file, eleven exports, four unrelated jobs

`src/components/home/primitives.tsx` was 811 lines. It is gone.

| Went to | What | Why |
|---|---|---|
| `design-system/primitives/` | `useHover`, `cta.ts` (variants, base box, fills), `CtaButton`, `CtaLink`, `TextLink` | No product knowledge. The CTA is the brand's one piece of chroma and it belongs where the tokens are |
| `design-system/patterns/` *(new)* | `SectionHead`, `SectionBand` | Primitives composed into a shape the brand repeats, still knowing nothing about blinds |
| `shared/utils/` | `scrollToId` | Passes the 0.2 lift test outright — names no Klay noun |
| `features/catalogue/` | `PhotoTile` and its two private helpers | Knows about prices, swatch rows and `ProductGlyph`. Its only consumer is `ProductCard` |
| `features/home/furniture.tsx` | `TILE_GAP`, `ArrowLink` | The homepage's own grid rhythm, and one dead export |

**`ctaBase` and `ctaFill` became exports rather than being duplicated.** Splitting `CtaButton`
and `CtaLink` into one file each — §5, one component per file — would otherwise have meant two
copies of the geometry, and the comment on `ctaBase` exists precisely because that geometry had
already drifted to six different heights once.

**`ArrowLink` has zero consumers and was deliberately NOT promoted into the design system.**
Moving a dead export into `@/ds` would have made it a public component with nothing using it.
It sits in home's private `furniture.tsx` flagged as a `knip` candidate for Phase 6.3, which is
where a deletion decision belongs rather than in a move phase.

## The barrel that proves the ordering was right

**`features/home/index.ts` exports ONE thing: `HomePage`.**

§0.8 put home last on the grounds that it is the largest *consumer* rather than the largest
dependency — *"moving it first means rewriting its 11 files' imports once per subsequent
feature; moving it last means rewriting them once."* The one-export barrel is the evidence: home
imports catalogue, cart, the design system and shared, and **nothing imports home.**

Set that beside catalogue's barrel, which carries eight exports and its own note that six of
them exist only because the homepage was reaching into it. That question is now answerable
rather than theoretical, and it is the last structural question left in Phase 4.

## Phase 4 closes here

| Slot | Feature | State |
|---|---|---|
| P4-1 | `marketing` | Done. Tokens converted at P4-5 |
| P4-2 | `booking` | **Deferred whole to Phase 6** — resolved, not skipped |
| P4-3 | `catalogue` | Done. 90 → 2 hardcoded values |
| P4-4 | `cart` | Done. Second checkout deleted at P4-5 |
| P4-5 | shared clean-up | Done. **Added nothing**, which was the result |
| P4-6 | `home` | Done |
| ~~P4-7~~ | ~~visualiser~~ | **Deleted from the plan** — ADR-020 |

**What is left in `src/` outside a layer:** `Nav`, `Footer`, `FormField`, `App.tsx`,
`routes/`, `store.ts`, `theme.ts`, `lib/` (api, pricing, bookingLink), `data/products.ts`, the
three remaining `pages/` (BookInstall, BookingConfirmed, NotFound), and the out-of-scope
visualiser. Every one of those has a named destination in Phase 5 or Phase 6, or an exception
number saying it stays.

**`klay/no-hardcoded-style-values` in home is 6.** Low because Phase 2.3 already repointed these
files from `../theme` to `@/ds`; the conversion pass they still want is small and was not done
here, because P4-6 was a move and mixing a 4,796-line move with a token pass would make both
unreviewable.

**`@typescript-eslint/naming-convention` in home is 26**, and 26 of those are the `hover`
variable returned by `useHover` — a boolean without an `is` prefix, in eleven files. It is one
rename in one hook plus its call sites, it is not a move-phase action (ADR-018), and it is now
the single largest cluster of that rule left in the codebase.

---

# MOVEMENT — PHASE 5, THE APP LAYER

| Measure | P4-6 | Phase 5 | Δ |
|---|---:|---:|---:|
| ALL | 673 | 648 | −25 |
| **IN-SCOPE** (ADR-023) | 334 | **307** | **−27** |
| **Runtime import cycles** | 4 | **0** | **−4** |
| `feature → legacy` edges | 34 | 20 | −14 |
| — of which clearable | 24 | **10** | **−14** |
| — of which permanent | 10 | 10 | — |

## ZERO CYCLES. All four went, and they went by construction rather than by repair.

Every cycle this codebase has ever had was one sentence: **a page imports the chrome, and the
chrome imports the feature.** `Nav` reads the basket so it imports `@/features/cart`; `CartPage`
rendered `<Nav />`, so cart's barrel imported it back.

Phase 5 inverted it. `RootLayout` renders the chrome, the page renders through `<Outlet />`, and
**nothing flows from a feature to a layout.** The app layer may import feature barrels (decision
D, §2) and nothing imports the app layer, so there is no longer anywhere for a cycle to close.

That is the difference between removing a cycle and breaking one: no import was rewritten to
dodge a loop. Thirteen pages stopped rendering site chrome, which they should never have been
doing, and the loops had nothing left to travel through.

**The count is now a real zero, and `import/no-cycle` still cannot see it.** ADR-022's point
stands: `tools/cycle-check.mjs` produced every one of these numbers.

## `Nav` and `Footer` stopped being countdown targets entirely

They carried **fourteen of the twenty-four clearable edges** at P4-6 — the two highest-fan-in
components on the site, imported by every feature. Both are gone from the list.

What remains clearable is ten edges over five targets, and every one has a Phase 6 line already
written: `store.ts` (3, the `useKlayStore` shim), `lib/pricing.ts` (3), `lib/api.ts` (2) and
`lib/bookingLink.ts` (2) — all four of them item 1, item 4 or "moves with booking".

**Phase 6 is now the only thing between the countdown and its floor.**

## Per-route variation moved from thirteen files to one table

`onLight` and `stickBelow` were props each page passed to its own `Nav`. They are now props the
router passes to a layout element, and routes are grouped by which nav they want.

That is the same information in one place, and it is the place it belongs: which pages open on a
pale ground is a fact about the site's composition, and `router.tsx` is where composition is
written down. Keeping nine files in agreement about it was the previous arrangement.

## Two things Phase 5 could not do cleanly, both for the same reason

**`Nav` could not move without a shim — E-11.** `VisualiserPage.tsx` and `VisualizerLabPage.tsx`
import it by relative path and are E-08: not editable for any reason, an import rewrite
included. Rewriting those two lines is the smallest edit imaginable and it is still an edit, so
`src/components/Nav.tsx` stays as a re-export. `Footer` had no such consumer and moved cleanly.

**`BareLayout` exists for those same two pages.** They mount their own `<Nav />` and cannot stop,
so under `RootLayout` they would render two. A route under `BareLayout` makes the claim "this
page owns its own chrome", which a reader of the route table can see — a route with no layout at
all would say nothing.

**That is the third and fourth time E-08 has shaped a decision rather than merely excluded a
file** (after `pricing.ts` and `products.ts`). The pattern is worth naming: an out-of-scope zone
does not stay out of the way. It reaches into every phase that touches anything it imports.

## Verified in a browser, not inferred

The route table was restructured — nested layout routes, a moved catch-all, chrome removed from
thirteen files. Inspecting the diff would not have told us whether it still resolves.

- **All twelve routes** render, with chrome exactly once. `/products` reports two `<nav>`
  elements and always did: the second is its own "Home / Shop" breadcrumb.
- **All six retired URLs still land** where `legacyRedirects` says — `/blinds` → `/products`,
  `/blinds/roller-blinds` → `/products/dusk`, the three category slugs, and the type fallback.
- **The homepage is pixel-identical**: 10 sections, 6181px, zero console errors, the ticker
  still above the bar with the nav offset behind it.

A structural phase that changes what the visitor sees has done something wrong. This one did not.

---

# PHASE 7 PREPARATION — two rules added, baselined, no renames executed

**Phase 6 is blocked on two decisions with V and Bobby, so Phase 7 preparation ran instead.
Preparation only: the rules exist and are baselined; the inventory is written; nothing has been
renamed.**

| Rule | In-scope | Out-of-scope (E-08) | Fires? |
|---|---:|---:|---|
| `klay/no-banned-abbreviations` *(new)* | **1** | 44 | YES — fixture |
| `klay/one-verb-per-concept` *(new)* | **1** | 18 | YES — fixture |
| `@typescript-eslint/naming-convention` | 65 | 63 | YES |

**Written before the rename, not after.** A rule introduced after a cleanup has no baseline to
have moved, so the cleanup cannot be shown to have worked — and under ADR-022 a rule's count
means nothing until the rule is proven to fire. Both fire; `npm run verify:rules` is now 15 by
fixture, 2 by probe, 1 blind.

## Both baselines confirm Phase 0 rather than contradicting it

§0.5 measured verb families and abbreviations across the whole codebase and concluded the genuine
violations *"sit largely in the frozen zone."* **62 of the 64 findings are inside E-08.**

So the in-scope work is two identifiers — and one of those is a false positive in a rule written
this phase (`loadScript` injects a `<script>` element; §6's verb rule is about network
retrieval). **Recorded rather than renamed to satisfy my own rule.**

**The value of these two rules is preventing regression, not cleaning up.** ADR-020's
consequences log records that both counts jump by 62 the day E-08 retires.

## And the preparation found two divergences, which is the point of the rule that governs it

Phase 7 carries a rule ahead of any rename: **establish whether the thing should exist first.**
Applied to the inventory, it moved 11 findings out of the rename column and into the divergence
log:

- **D-08** — hover state has two implementations. `useHover()` in 8 files, and 10 hand-rolled
  `useState(false)` sites across 6 more. All ten were on the rename list. Renaming them would
  have produced ten correctly-named duplicates, **and a well-named duplicate looks intentional.**
- **D-09** — the form-field `set` helper, character-identical in `ContactPage` and
  `BookInstallPage`. Not extracted yet: one consumer moves to `features/booking` in Phase 6, and
  choosing a home for it now is the mistake D-04 was logged to avoid.

Neither is reported by any lint rule. Both were found by asking a question the lint count cannot
ask.

---

# PHASE 7 — EXECUTED

| Rule | Before | After |
|---|---:|---:|
| `@typescript-eslint/naming-convention` | 65 | **0** |
| `klay/no-banned-abbreviations` | 1 | **0** |
| `klay/one-verb-per-concept` | 1 | 1 — accepted exemption |
| **IN-SCOPE, all rules** | 309 | **242** |

Three of four commits were removals. **That is the finding, not an aside.**

## What the governing rule bought

> *Establish whether the thing should exist before renaming it.*

| | |
|---|---|
| Identifiers on the original list | 41 |
| **Deleted rather than renamed** | **10 sites, 5 identifiers** (D-08) |
| **De-duplicated rather than renamed** | **4 sites → 1 hook** (D-10) |
| Renamed | 24 |
| Exempted, with the reason recorded in the file | 2 |
| **New divergences found by asking** | **D-08, D-10, D-11** |

**Fourteen of the 41 were not naming problems.** They were two duplications and a third that
runs deeper, and every one of them was sitting on a list headed "rename these". Renaming them
would have produced correctly-named, §6-compliant, lint-clean duplicates — and a well-named
duplicate is harder to find than a badly-named one, because nothing about it looks like a
mistake.

## The four judgement calls, and one I reversed

| Was | Became | Why a prefix was not enough |
|---|---|---|
| `dead` | `isUnavailable` | `count === 0 && state === 'off'` — ticking it returns nothing. `dead` never said that |
| `onItsOwn` | `hasOwnSettings` | A window customised independently |
| `follows` | `isFollowingWindowOne` | `isFollows` is not English |
| `reduceMotion` | `shouldReduceMotion` | §6 permits `should`, and it reads at every call site |

**`stacked` stayed `isStacked` in both files, and this reverses my own recommendation.** The
inventory said to rename them apart — RangeRow derives it from `FOUR_UP`, RecommendationBanner
from its own `STACK` query, and one might be read as implying the other. Having read both: they
are local flags in separate modules, neither is passed between them, and both genuinely mean
stacked at their own breakpoint. **Renaming them apart would have made the code claim a
distinction it does not have.** The concern did not survive contact with the code.

## Two errors the typechecker caught, both mine

**`NAV_PAD.compressed` is an object key naming a nav state, not a boolean.** The substitution
renamed the key and not the access, because the access is preceded by a dot. §6's boolean rule is
about variables; a padding map keyed by state name is not one.

**The `active` scoping was wrong, and the cause generalises.** My comment mask collapses each
multi-line comment to a single placeholder line, so the line ranges I passed were *masked*-line
numbers rather than source ones and landed in the wrong scope. `VisualiserShowcase` has three
bindings called `active` — two booleans and, at line 231, a **number** prop holding the window
index. Renaming that one would have collided with the `isActive` two lines below it.

**Neither reached a commit, and neither would have been caught by review.** Both produce
plausible-looking diffs. `tsc -b` found them in seconds, which is the argument for running the
typechecker between substitutions rather than at the end of a batch.

## The exemptions, expressed as suppressions rather than as a permanent count

`matches` in `useMediaQuery` carries an `eslint-disable-next-line` with the reason above it. §5:
code interfacing with a Web API uses that API's spelling — it is the property `MediaQueryList`
gives, read from `window.matchMedia(query).matches` three lines below, and a hook that renamed it
would disagree with the thing it wraps.

**That takes `naming-convention` to a real zero rather than a permanent 1**, which matters under
ADR-023: a rule sitting at 1 forever cannot be promoted, and "1, but it's fine" is not a state
the mechanism can represent. A written suppression is how an exemption is said out loud.

`loadScript` stays and the rule stays at 1. **Accepted as a false positive in a rule written this
phase** — §6's verb rule is about network retrieval, this injects a `<script>` element, and
`fetchScript` would be wrong. A rule that forces a wrong name is broken; renaming to satisfy it
would make the code lie. `one-verb-per-concept` is therefore **not promotable**, and the honest
next step is narrowing the rule rather than editing the code.

## One finding I introduced and fixed

`usePrefersReducedMotion` held `prefers`, unprefixed — created by the D-10 extraction earlier in
the same phase. Counting it as pre-existing would have been dishonest.

## Verification

ADR-018's check ran on every substitution and was clean: **no comment was rewritten.** The
comments that still say "hover" were read and left — every one is prose about the concept
("deepens on hover", "the tile darkens behind it"), not a stale identifier reference. Rewriting
them would be ADR-018's mistake pointing the other way.

In the browser: all twelve routes render chrome exactly once, all six retired URLs still land,
hover responds on every converted control, and the homepage is unchanged at 6181px with zero
console errors.

## What Phase 7 leaves open

**D-11 — the hover problem has three solutions in the design system**, and the unused one was
built for it. `primitives/Button.tsx` says in its own header that solving this once is most of
why it exists; it has zero consumers, and the fourteen `*Hover` variables it names outlived it.
Five of six original primitives have no in-scope consumer at all. **That is a decision about what
the design system is for, it is above a naming pass, and it is scheduled for the `knip` baseline
at Phase 6.3.**

**And the counts are small because of E-08, not because the codebase is clean.** 127 naming
findings sit in the out-of-scope visualiser. ADR-020's consequences log records that they arrive
at once, and that three rules at `error (in-scope)` demote straight back to `warn` when they do.
