# ADR-024 — A shared definition may stay with the components that share it

**Status:** Accepted — amends SPECIFICATION.md §5
**Date:** 1 September 2026
**Amends:** §5 (one component per file). Specification version 1.6 → 1.7.

## Context

§5 says: *"React component: `PascalCase.tsx`, one per file, filename = component name."* The
rule is right and the reason is good — two exported components in one file is listed in §8 as a
signal the file needs splitting.

P4-6 hit a case where obeying it literally would have caused the exact defect the code it was
splitting exists to document.

`CtaButton` and `CtaLink` are the same button rendered as a `<button>` and an `<a>`. They share
`ctaBase` — the geometry — and `ctaFill`, the three variants. The comment on `ctaBase` records
what happened the last time that geometry was not shared:

> *"The page rendered this button at six heights (40 / 44 / 51.19 / 55 / 59.19), and the
> 55-vs-59.19 pair is the tell: `CtaButton` renders a `<button>` and `CtaLink` renders an `<a>`,
> both sized from padding plus whatever line-height the UA applies to that element. Two elements,
> two UA defaults, one padding — they will drift apart forever."*

**Splitting them into one file each, with the shared definition copied into both, would have
rebuilt that drift.** The rule intended to keep files small would have produced two divergent
copies of the one thing that must not diverge.

## Decision

**§5 gains an exception, stated narrowly:**

> One component per file, **except where two components share a definition whose duplication has
> previously caused drift.** The shared definition stays with them, and the reason is recorded in
> the file.

Three conditions, all required:

1. **Two or more components genuinely share the definition** — not "might one day".
2. **Duplication has previously caused drift**, and that is a matter of record rather than
   prediction. Not "could diverge": *did*.
3. **The reason is written in the file**, so the next reader finds the history at the point of
   temptation rather than in a decision log they will not open.

**The worked example is the one that produced this.** `design-system/primitives/cta.ts` holds
`CtaVariant`, `ctaBase` and `ctaFill`. `CtaButton.tsx` and `CtaLink.tsx` are one component each
and import from it. That satisfies §5's letter as well as its intent: three files, one component
per component file, and the shared definition in a `camelCase.ts` module that is not a component
at all.

**That is the preferred shape, and it is what P4-6 did.** The exception exists for cases where
even that separation is wrong — where the shared thing is small enough that a third file is
ceremony — and in those cases both components live together and the file says why.

## What this is not

**It is not a licence for a file with two unrelated components in it.** §8's signal stands:
*"two exported components in one file"* still means the file wants splitting, unless condition 2
is met with evidence.

**It is not retroactive cover.** Condition 2 requires a recorded instance of drift. A file that
merely feels cohesive does not qualify, and the honest test is whether you can name the bug.

## Consequences

**§5's banned-filename list is unaffected.** This changes what may live in a file, not what a
file may be called.

**The reason lives at the call site of the temptation.** ADR-018 makes the same argument about
comments: a note explaining why something is the way it is belongs where someone would otherwise
change it. `cta.ts` carries the six-heights story in full, and that comment is now load-bearing —
it is the evidence for condition 2, and deleting it as "just history" would remove the
justification for the file's shape.
