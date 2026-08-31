# ADR-013 — The `visualiser` / `visualizer` spelling split is deferred debt

**Status:** Accepted — deferral, not design
**Date:** 31 August 2026
**Relates to:** SPECIFICATION.md §5 (Australian English), §12 (E-07)

## Context

SPECIFICATION.md §5 requires Australian English in identifiers — *colour*, *visualiser*,
*organisation* — and says: "Pick one spelling per identifier and never both."

The codebase carries both, and the split is load-bearing:

| Path | Spelling | What it is |
|---|---|---|
| `src/visualiser/` (8 files) | British | The live rendering engine |
| `src/pages/VisualiserPage.tsx` → `/visualiser` | British | The live standalone page |
| `src/components/home/VisualiserShowcase.tsx` | British | The homepage embed |
| `src/visualiser-lab/` (11 files) | British | A fork of the engine |
| `src/pages/VisualizerLabPage.tsx` → `/visualizer` | **American** | The sandbox page |

Measured 31 August 2026: 230 occurrences of `visualiser`, 10 of `visualizer`. Four files
contain both — `src/App.tsx` (10 / 5), `src/pages/VisualizerLabPage.tsx` (25 / 3), and both
copies of `Canvas2DBlindRenderer.tsx` (1 / 1, an incidental mention in a doc comment).

`VisualizerLabPage.tsx:27-30` states the intent:

> SPELLING IS THE SWITCH. Live is /visualiser (British, as the rest of the site spells it),
> sandbox is /visualizer (American). One letter is a thin thing to hang a distinction on, so
> the page also says which one it is in a bar across the top.

**`/visualiser` and `/visualizer` are two different live routes distinguished by one letter.**
A mechanical rename collapses them, or shadows one behind the other in the route table.

The fork is not dead scaffolding. Between 11:40 and 12:30 on 31 August it gained
`wardrobes.ts` (302 lines), `Canvas2DWardrobeRenderer.tsx` (131 lines), a `useVisualiserStore`
that has diverged from the original, and ten Forma wardrobe assets. A new product category is
being built in it.

## Decision

**Defer.** The split stands as recorded debt, not as intended design.

It is registered as **E-07** in the exceptions register, and this ADR is the record §12
requires — an exception without an ADR is a violation.

**This ADR does not endorse the split.** §5 is right and the codebase is in breach of it. What
is being decided is *when* to fix it, not *whether*.

### Resolution condition

The debt is discharged when **both** are true:

1. The wardrobe work in `src/visualiser-lab/` has shipped, and
2. the fork has resolved — either merged back into `src/visualiser/` or deleted, per the exit
   condition already written into `VisualizerLabPage.tsx`.

At that point there is one visualiser, one route, and no reason for two spellings. The rename
is then mechanical and safe: one directory, one page component, one route path, and the four
files that currently contain both spellings.

**Until then, do not "fix" this.** A find-and-replace across `src/App.tsx` merges two routes.

## Consequences

**Accepted.** A reader meeting `/visualizer` for the first time has no way to know the
spelling is meaningful without opening the page component. The banner across the foot of the
sandbox mitigates this for anyone who loads it; it does nothing for someone reading the route
table.

**Accepted.** Any lint rule enforcing §5's spelling requirement must carve out these paths, or
it reports five findings that nobody is permitted to fix. No such rule is configured today.

**Accepted.** The split is a second thing depending on the visualiser phase, which is already
the migration's critical path (MIGRATION_MAP.md, R11).

**Watch for.** If the wardrobe work runs long, the two spellings will be copied into new files
by anyone working in the lab. The count going above 10 is the signal that this deferral is
costing more than it saves, and should trigger revisiting rather than waiting.
