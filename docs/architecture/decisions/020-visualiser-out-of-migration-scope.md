# ADR-020 — The visualiser is removed from the migration, not deferred within it

**Status:** Accepted — amends MIGRATION_MAP.md §0.8, PHASE_6_SCOPE.md, SPECIFICATION.md §12
**Date:** 1 September 2026
**Supersedes:** phase slot P4-7 in its entirety. Specification version 1.4 → 1.5.

## Context

`src/visualiser/` and `src/visualiser-lab/` are 20 files and 17,250 lines — 58% of `src/`, 13
inbound edges, four protected IP files. From Phase 0 they were scheduled as **P4-7**, the last
slot of Phase 4, with one entry condition: *"migrates last, and only once you tell me the work
in it has stopped."*

**The work in it has not stopped, and the schedule has been recording that fact without acting
on it.** Wardrobes are being built inside `visualiser-lab/` — a new renderer, a new geometry
module, a new store, a diverging product category. Three of the last ten commits on this branch
are wardrobe development interleaved with migration commits. R4 named this at Phase 0 ("the
frozen zone is a moving target"); R11 called the visualiser phase the migration's critical
path.

What actually happened is that **P4-7 receded at every phase.** A slot whose entry condition is
someone else finishing an unrelated body of work is not a schedule. It is a placeholder that
makes the plan look complete while guaranteeing it cannot close — and every phase that ends
with "cannot be resolved before P4-7" is a phase that has quietly deferred work into a slot
that will not arrive.

The choice is not *when* to migrate the visualiser. It is whether the migration's completion
depends on it.

## Decision

**`src/visualiser/`, `src/visualiser-lab/`, `src/pages/VisualiserPage.tsx` and
`src/pages/VisualizerLabPage.tsx` are removed from the scope of this migration entirely.**

Not deferred to P4-7. **P4-7 is deleted from the plan.** Phase 4 ends at P4-6.

- `features/visualiser/` **is not created.** There is no half-built destination waiting.
- Those files and directories are **not edited for any reason** — not a move, not an import
  rewrite, not an alias swap, not a lint fix, not a token substitution. Phase 0 recorded that
  "an import rewrite is mechanical, which the freeze permits." **That permission is withdrawn.**
- They migrate as **separate later work, on their own schedule**, once wardrobes are stable.
  That work gets its own plan and its own ADR. It is not this project.

## Consequences

### The migration can now finish

This is the point. Every remaining phase — P4-4 cart, P4-5 shared, P4-6 home, Phase 5 app
layer, Phase 6 payment path — depends on nothing that is still being written.

### Anything scheduled into P4-7 has lost its slot, and must be re-answered

| Item | Was | Now |
|---|---|---|
| Decisions **B, G** — visualiser embed component exported from its barrel | Deferred to P4-7 | **Out of scope.** There is no visualiser barrel. `ProductDetailPage` and `VisualiserShowcase` keep importing `src/visualiser/*` by path. |
| Decision **H** — split `src/data/products.ts` by consumer | Deferred to P4-7 | **Out of scope as a split.** See below — `products.ts` now needs an answer that does not touch the visualiser. |
| **E-07** — the `visualiser`/`visualizer` spelling split, and ADR-013 | "When wardrobes ship and the fork resolves" | Unchanged in substance, but explicitly **not this migration's problem.** |
| **D-02** (the visualiser fork), **D-05** (three curtain implementations), **D-06** (hardware colour maps, two of three copies frozen) | Resolvable at P4-7 | **Not resolvable by this migration.** They stay open in the divergence log, which is the correct outcome: the log's job is to record what is true. |
| `theme.ts` shim and the deprecated colour/spacing aliases | Removed at P4-7 | **Permanent for the life of this migration.** The frozen visualiser imports them and may not be edited. |
| The 196 lint findings inside the frozen zone | Fall at P4-7 | **Never fall.** The lint baseline's "movable" column is now the only meaningful number. |

### Two modules can no longer move the way the plan assumed

Both are imported by frozen files, and "import rewrites are permitted" was the mechanism that
let them move. That mechanism is gone.

| Module | Frozen importers | Consequence |
|---|---|---|
| `src/lib/pricing.ts` | `visualiser/useVisualiserStore.ts`, `visualiser/VisualiserControls.tsx`, and both `visualiser-lab/` counterparts — 4 files | **PHASE_6_SCOPE item 1 must leave a re-export shim at `src/lib/pricing.ts`.** The module moves to `shared-core/pricing/`; the old path becomes `export * from '@/core/pricing'` — except the frozen files import it relatively, so the shim stays a real file at that path forever. |
| `src/data/products.ts` | `visualiser/Canvas2DBlindRenderer.tsx`, `visualiser/useVisualiserStore.ts`, `visualiser/VisualiserControls.tsx`, and both `visualiser-lab/` counterparts — 6 files | Same shape. It cannot move without a shim, and it cannot be split by consumer at all. **OPEN — see below.** |

**A shim is not a defeat here.** §7's rule is that there is *one* price table; a re-export is
one table reached by two paths, not two tables. The failure mode §13 names is divergence, and a
file that re-exports cannot diverge from what it re-exports. It costs a file and an entry in
the exceptions register, and it buys a frozen zone nobody has to touch.

### The `feature → legacy` boundary allowance can no longer reach zero — OPEN

PHASE_6_SCOPE item 5 is **BLOCKING**: the temporary `feature → legacy` allowance in
`eslint.config.js` must not survive the migration, because while it exists a feature may import
anything in `src/`.

`features/catalogue/components/ProductDetailPage.tsx` imports three modules from
`src/visualiser/` — `KlayConfigurator`, `useVisualiserStore`, `VisualiserControls`. Under this
ADR those imports are permanent. So are `src/data/products.ts` and the `theme.ts` shim. The
countdown cannot reach zero, and the blanket allowance therefore cannot simply be deleted.

**This needs a decision and does not have one.** It is recorded here rather than resolved,
because inventing an answer is how the booking question stayed open in a chat message for three
days. The shape of the answer is probably a narrow, named, ADR-backed element type —
`legacy-visualiser`, matching those four paths, which features may import and nothing else may
— so that the blanket allowance comes out while the visualiser stays reachable. That is a
proposal, not a decision.

## What this ADR does not say

It does not say the visualiser is badly built, or that it should not eventually live in
`features/visualiser/`. It says a migration cannot be gated on work that is still being
written, and that a slot which has receded at every phase should be named as out of scope
rather than carried as though it were scheduled.

---

# CONSEQUENCES LOG — THE DEMOLITION ORDER

**Every artefact that exists SOLELY because the visualiser is out of scope.**

When the visualiser migrates, this is the list to take apart, and it is the reason the ADR
carries a log rather than a paragraph. **Four times now this exception has SHAPED a decision
rather than merely excluded a file** — and a shaping exception is invisible in the thing it
shaped. Nothing in `BareLayout` says "I exist because of a frozen renderer" unless it is written
down, and by the time someone reads it the reason will be years old.

**Maintained in the same commit as the artefact.** An entry added later is an entry that was
nearly forgotten.

| # | Artefact | Where | What it is | Demolition |
|---|---|---|---|---|
| **1** | `src/data/products.ts` remains at its legacy path | `src/data/` | Decision H was executed only as far as the out-of-scope importers allowed. Six E-08 files import `RYNAMIC_COLOURS`, `CURTAIN_COLOURS`, `HARDWARE_HEX`, `HARDWARE_OPTIONS`. **E-10** | Move the four symbols into `features/visualiser/`; catalogue consumes the colour cards through its barrel. Delete the file. Decision H completes |
| **2** | `theme.ts` shim and the `@deprecated` colour/spacing aliases | `src/theme.ts` | Kept for 12 spacing and 4 font-size occurrences in E-08 files. **E-10**, ADR-017 as amended | Repoint those 16 occurrences, delete the shim and the aliases |
| **3** | Permanent re-export shim at `src/lib/pricing.ts` | `src/lib/` | Four E-08 files import pricing by relative path. **E-09.** *Not yet created — Phase 6 makes it* | Repoint the four, delete the shim. `@/core/pricing` becomes the only path |
| **4** | Re-export shim at `src/components/Nav.tsx` | `src/components/` | `VisualiserPage.tsx` and `VisualizerLabPage.tsx` import `Nav` by relative path. **E-11** | Repoint two import lines, delete the file. `src/components/` disappears entirely once `FormField` also goes |
| **5** | `BareLayout` | `src/app/layouts/` | Exists so the two E-08 pages, which mount their own `<Nav />` and cannot be edited, do not render two navs under `RootLayout` | Move both pages under `RootLayout`, strip their chrome, delete `BareLayout` — unless a genuine no-chrome route has appeared by then |
| **6** | The `legacy-visualiser` boundary element type | `eslint.config.js` | A permanent `feature → legacy-visualiser` allowance so the blanket `feature → legacy` line can be removed at Phase 6.1 without the countdown having to reach an unreachable zero | Delete the element type and its two policies. `feature → legacy` should then be gone too |
| **7** | The countdown's permanent floor | `PHASE_6_SCOPE.md` | Currently **10**. Edges from `features/catalogue` and `features/home` into `src/visualiser/` that no phase clears | Falls to zero. The countdown finally means what its name says |
| **8** | Scope exclusions E-08/E-09/E-10/E-11 | `exceptions.json`, §12 | 4 of 11 exceptions exist for this one decision. They remove ~340 findings from the in-scope count | Delete the four entries. **Files re-enter scope automatically and any rule they violate demotes `error` → `warn`** — ADR-023. Expect that, and expect it to be a lot |
| **9** | The naming rules reading ZERO in scope | `LINT_BASELINE.md` | After Phase 7: `klay/no-banned-abbreviations` **0 in-scope against 45 out**, `one-verb-per-concept` **1 against 19**, `@typescript-eslint/naming-convention` **0 against 63**. Phase 0 predicted it — the genuine violations *"sit largely in the frozen zone"* | **127 findings arrive at once**, and three rules that will be at `error (in-scope)` by then demote straight back to `warn` (ADR-023). Phase 7 finished in a day **because** of E-08, not because the codebase was clean |

| **10** | The two Phase 7 naming rules themselves | `tools/eslint-rules/` | `klay/no-banned-abbreviations` and `klay/one-verb-per-concept` are narrow BECAUSE the graphics maths and the 24 `draw*` functions are out of scope. Phase 0 recommended carving out an exemption for renderer maths; E-08 did it completely and by accident | Re-read both rules against the renderers before the counts are trusted. The banned list may need the graphics-maths exemption Phase 0 actually asked for, and the RENDER verb family was left out on the grounds that it could not fire anyway |

## What the pattern is, stated once

An out-of-scope zone does not stay out of the way.

Every one of these exists because something **in** scope had to reach something **out** of it,
and the boundary could not be crossed by editing the other side. The shim is the general shape:
when you may not touch the importer, you leave the imported path standing.

**That is a cost of the decision, not evidence against it.** ADR-020 was taken because the
alternative — a migration gated on work that never stopped — could not finish at all. But the
cost is nine artefacts and roughly half the repository's lint findings held outside the count,
and it should be paid down deliberately rather than discovered.

**The measure of whether this log worked:** when the visualiser migrates, nothing on this list
is found by accident.

---

# THE E-07 AUDIT — could any of these stop existing rather than wait?

**Run 3 September 2026**, applying the lesson E-07 taught. That exception waited eight weeks for
*"when wardrobes ship and the fork resolves"* and closed in an afternoon when someone asked a
different question: **not "when is the milestone" but "could the excepted thing simply stop
existing".** The z-spelled route was deleted and the exception had nothing left to except.

Every row of the demolition log above, asked that question. **One pair can close early.**

| # | Artefact | Could it stop existing before the visualiser migrates? |
|---|---|---|
| 1 | `data/products.ts` at its legacy path | **No.** Six E-08 files import four symbols from it. The exception exists because they cannot be edited, and nothing makes those imports go away except editing them |
| 2 | `theme.ts` shim and its deprecated aliases | **No.** Six E-08 files import `../theme` directly. Same shape |
| 3 | `pricing.ts` re-export shim | **No.** Four E-08 files import it by relative path |
| **4** | **`components/Nav.tsx` re-export shim — E-11** | **YES. See below** |
| **5** | **`BareLayout`** | **YES, with row 4 — they close together** |
| 6 | `legacy-visualiser` element type | **No.** Needed for as long as any feature imports the visualiser, which is every phase from here |
| 7 | The countdown's permanent floor | **Not an artefact.** It is a measurement, and it stopped being a gate — see PHASE_6_SCOPE item 5 |
| 8 | Scope exclusions E-08/E-09/E-10/E-11 | **E-11 only**, with row 4 |
| 9 | Naming rules at zero in scope | **No.** A consequence of the boundary, not a thing that can be removed |
| 10 | The two naming rules' narrowness | **No.** Same |

## Rows 4 and 5 — the early close, and its cost

**E-11's Nav shim now has exactly one consumer.** It had two until `VisualizerLabPage.tsx` was
deleted; what remains is:

```
src/pages/VisualiserPage.tsx:5   import { Nav } from '../components/Nav';
```

`BareLayout` has the same single consumer — it exists so that page, which mounts its own `<Nav />`
and cannot be edited, does not render two.

**Both artefacts exist for one 126-line file.** And that file is not protected IP. E-01 to E-04
name the four files that are — `homography.ts`, `Canvas2DBlindRenderer.tsx`,
`CornerPinOverlay.tsx`, `usePhotoUpload.ts` — and `VisualiserPage.tsx` is none of them. It is a
route shell: it reads two query params, mounts `KlayConfigurator` and `VisualiserControls`, and
renders a booking link.

**So the question E-07 taught is answerable here: E-08 does not have to cover it.**

Narrowing E-08 to exclude `VisualiserPage.tsx` would let that page:

- import `Nav` from `@/app/layouts` — **E-11 retires, and `src/components/` disappears entirely
  once `FormField` goes**;
- mount under `RootLayout` like every other page — **`BareLayout` retires**;
- keep its three `src/visualiser/*` imports, which are already permanent, already allowed, and
  already counted.

**The cost, stated honestly.** It requires an ADR narrowing E-08, exactly as E-07's close
required retiring an exception — and it means editing a file currently protected, which is not a
thing to do casually or as a side effect of an asset phase. **It is a real candidate, not a
recommendation**, and it belongs to whoever opens the next phase.

**What it is not:** it is not the visualiser migration arriving early. The renderers, the store,
the lab and the protected IP are untouched by it. It is one page leaving a boundary that was
drawn around a directory and swept up a route shell with it.

## And the general form, now that two exceptions have shown it

**E-07 could not close because its condition named someone else's milestone. The countdown floor
could not gate because its number was someone else's to move.** Both were written over things
outside the writer's control.

> **An exception's exit condition, and a phase's, must be written over something the writer
> controls. Otherwise it is a dependency wearing an exit condition's clothes.**

Asked of E-08 itself: its condition is *"the visualiser migration is scheduled as its own
project"* — someone else's decision, on someone else's timing. **That is the right condition for
the renderers and the wrong one for everything the boundary caught by accident.** The audit above
is what asking the question yields; it should be re-run whenever this log grows a row.
