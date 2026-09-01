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
