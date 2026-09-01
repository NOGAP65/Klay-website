# ADR-017 — The adopted scales, closed at eight steps

**Status:** Accepted — amends SPECIFICATION.md §9
**Date:** 31 August 2026
**Amends:** §9 (the design system contract). Specification version 1.1 → 1.2.
**Relates to:** TOKEN_SCALE_PROPOSAL.md, §8

## Context

§9 requires a scale that is *"proportional and closed — six to eight steps of spacing, six to
eight of type"*, without naming the steps. Phase 2.3 measured what the codebase actually
contained and scored seven candidate spacing scales and five type scales against it.

The finding that shaped the outcome: **the scale that existed did not describe the codebase.**
Of `theme.ts`'s eight spacing steps, `52`, `84` and `136` had **zero** real occurrences, while
the two most-used values on the site — `16` (36 occurrences) and `24` (27) — were not steps at
all. That is the mechanism behind Phase 0's finding that no file under `src/pages/` referenced
`space.*` even once. The ladder did not have the rungs people needed, so they stopped climbing
it.

## Decision

### Spacing — eight steps, closed

| Step | Role name | For |
|---:|---|---|
| 4 | `space.hairline` | Icon-to-label, hairline offsets |
| 8 | `space.tight` | A label and the number under it |
| 12 | `space.snug` | Within a row of controls |
| 16 | `space.item` | **Between related elements — the default** |
| 24 | `space.group` | A group's internal block rhythm |
| 40 | `space.section` | Between groups |
| 80 | `space.band` | Standard section padding |
| 120 | `space.focal` | The two focal sections only |

54.5% of existing occurrences land on a step unchanged — nearly double the previous scale's
29.7% — at an average drift of 2.67px, the lowest of the seven candidates. The 2.5×
between-group to within-group ratio the old file argued for is preserved exactly:
`space.item` 16 → `space.section` 40.

### Type — eight steps, closed

**10 · 12 · 14 · 16 · 20 · 26 · 34 · 56**

Ratios 1.2 · 1.17 · 1.14 · 1.25 · 1.3 · 1.31 · 1.65. The existing nine role *names* are kept —
`micro`, `label`, `body`, `lead`, `card`, `numeric`, `section`, `hero`, `ornament` are already
roles and were never the problem. Only the sizes behind them change.

### The rejected candidate, and the principle it establishes

Candidate **T1 — 11 · 13 · 15 · 20 · 26 · 34 · 56** scored *better* on exact match (51.5% vs
45.5%) and was rejected.

T1's first three steps are 11, 13 and 15 — the three most-used font sizes in the codebase
today. A scale built on them is not a scale; it is the current inconsistency written down and
blessed. **Three steps one pixel apart cannot express a hierarchy:** a reader cannot tell 13
from 14, so the distinction does nothing except make the scale unfalsifiable — any value can
be justified as "close to a step".

**This is now the standing principle for every scale decision on this codebase:**

> **A scale constrains, it does not accommodate.** Steps one pixel apart cannot express
> hierarchy. Fitting the scale to current usage optimises the wrong thing — the measure of a
> scale is whether it makes a hierarchy legible, not whether it minimises churn.

T3 costs six percentage points of exact match to get there, and almost all of that cost is
`11→10` (28 occurrences) and `13→12` (24) — 1px moves on small UI labels, the cheapest kind of
change available.

### Two outliers are not scale steps

`120px` and `160px` occur once each — the How It Works step numeral and the 404 numeral. They
are display ornament, not body hierarchy, and forcing them onto a text scale sends both to 56.
They become `type.ornament` and `type.display`. `type.ornament` already existed with zero
consumers.

### Both scales are CLOSED at eight steps

§9 already says "closed". This records what closed means in practice:

**A request for a ninth step is a request to change the design, and it is refused by default.**
The two legitimate responses to a layout that needs a value between two steps are:

1. **Change the layout** to use an existing step. This is the answer in almost every case.
2. **Change the scale** — deliberately, in one file, with an ADR amending this one, and
   accepting that every existing consumer of the neighbouring steps is now in a different
   proportional relationship.

**A ninth step added "just for this one case" is how a scale becomes a list.** The previous
scale did not fail because its numbers were wrong; it failed because it was optional, and the
codebase grew 34 distinct spacing values and 18 font sizes alongside it. Eight steps enforced
by lint is a different object from eight steps offered as a convenience.

## Consequences

**Five of the eight old spacing steps change value**, and this is visible on screen:

| Old token | Was | Now | Call sites |
|---|---:|---:|---:|
| `space.xxs` → `hairline` | 4 | 4 | unchanged |
| `space.xs` → `tight` | 8 | 8 | unchanged |
| `space.sm` → `snug` | 12 | 12 | unchanged |
| `space.md` → `item` | 20 | **16** | 75 |
| `space.lg` → `group` | 32 | **24** | 30 |
| `space.xl` → `section` | 52 | **40** | 21 |
| `space.xxl` → `band` | 84 | **80** | 9 |
| `space.xxxl` → `focal` | 136 | **120** | 0 |

The drift was disclosed in the proposal and approved with it. `space.md` → 16 is the largest
single visual change in the migration so far: 75 call sites tighten by 4px. **It should be
looked at on screen**, and it is the reason this ADR records the numbers rather than only the
decision.

**Old t-shirt names survive as `@deprecated` aliases** pointing at the nearest new step, for
the frozen visualiser — which has 12 spacing and 4 font-size occurrences that cannot be
touched until P4-7. They are deleted with the `theme.ts` shim.

> **AMENDED BY ADR-020.** P4-7 no longer exists and the visualiser is out of scope, so those
> 16 occurrences are never touched by this migration. **The `@deprecated` aliases and the
> `theme.ts` shim are therefore permanent for its life** — E-10. They go with the separate
> visualiser work, or not at all.

## THE HERO OBSERVATION — recorded at P4-5, and it is a warning about what to do next

**Three page heroes independently wanted a vertical padding past the top of the scale.**

| Page | Was | Became |
|---|---:|---|
| About | 180px | `space.focal` (120) |
| How it works | 200px | `space.focal` (120) |
| Contact | 180px top, 140px bottom | `space.focal` (120) |

These were not values *between* two steps, which is the case §9 anticipates. The scale is closed
at eight and tops out at `focal` (120); 180 and 200 are **past the end of it.** All three took
§9's first answer — change the layout — and the result was checked in a browser at 1440px: two
heroes lost 80px of air and both still read as heroes.

**THREE IS A PATTERN AND FOUR IS A FINDING.** Three independent authors reaching past the top of
the scale for the same element is the shape D-03 had: not carelessness, but people arriving
separately at the same answer because the structure offered nowhere else to go.

**If a fourth hero wants the same thing in Phase 5, do NOT change a fourth layout. Flag it.**
The question at that point is not whether the layout is wrong, it is whether **full-bleed hero
spacing is its own axis** rather than a step on the body-copy rhythm — the way `type.ornament`
and `type.display` already sit outside the type scale because forcing them onto it would flatten
both.

That would be an amendment to this ADR with its own reasoning, not a ninth step bolted onto
`space`. **The scale stays closed either way.** A separate, named axis for one element is a
different thing from a scale that grows a step whenever something does not fit, and only the
second is the failure §9 describes.

**Applying the scale to hardcoded literals is a separate pass.** There are 283 movable
`klay/no-hardcoded-style-values` findings, and repointing them means editing files that Phase
4 is about to move. Doing both at once is the "moving and changing in one commit" the migration
rules forbid. The scale exists now; the literals migrate with their features.

**`klay/no-hardcoded-style-values` falling from 283 is the measure of whether this worked.**
Not the token count, and not this document.
