# ADR-019 — Features may import other features, through the barrel only

**Status:** Accepted — amends SPECIFICATION.md §2
**Date:** 1 September 2026
**Amends:** §2 (the layer model table). Specification version 1.3 → 1.4.

## Context

§2 contradicted itself.

The **table** said a feature may import from *"design-system, shared, config, core, and its own
internals only"* — no cross-feature imports at all.

The **prose**, four paragraphs below it, said: *"Cross-feature communication has exactly three
legal answers: B exports it from its `index.ts` and A imports that; the thing isn't really
either feature's and moves to `shared/`; or the app layer composes them and passes data down
as props."*

The first answer in that list is a cross-feature import, which the table forbids.

Found in Phase 4-1, by trying to do the obvious thing. `STEPS` — the four-step process data —
is read by `HowItWorksPage` (marketing) and by `StepsBar` and `RecommendationBanner`, which
become feature:home at P4-6. Under the table there was **no legal way** for the homepage to
read four steps out of marketing: not through the barrel, and `shared/` would have been wrong
because `STEPS` is Klay's own process copy and fails the lift test outright.

`eslint-plugin-boundaries` had been configured from the table and forbade feature → feature
entirely.

## Decision

**The prose is correct. The table is amended to match it.**

> Features may import: design-system, shared, config, core, their own internals, and
> **other features via their barrel only**.

**The restriction was never *whether* a feature may reach another. It is *through what*.**

That distinction is what makes the rule enforceable, and it is already enforced — by two rules
working together, which is why neither is redundant:

| Rule | Answers |
|---|---|
| `boundaries/dependencies` | *May this layer reach that layer at all?* Now: yes, feature → feature. |
| `import/no-internal-modules` | *Through what?* Its allow-list contains `@/features/*` — one segment, the barrel — and **not** `@/features/*/**`. `@/features/catalogue` passes; `@/features/catalogue/components/ProductCard` does not. |

Dropping either leaves a real gap. Boundaries alone would permit reaching into another
feature's internals; `no-internal-modules` alone would permit a feature reaching a layer it has
no business in.

## Consequences

**§1 rule 3 is unaffected and is the point.** *"Every feature has exactly one public entrance.
Anything not exported there is private and unreachable from outside."* That is what stops a
second implementation being built by accident, and it is preserved exactly — a feature's
internals remain unreachable. What changes is that its *barrel* is now reachable, which it
always had to be for the barrel to mean anything.

**A cross-feature import is still a design signal, not a free action.** §2's other two answers
exist for a reason. Before adding one, the questions are still: does this belong to either
feature, or to `shared/`? Could the app layer compose them instead? A feature barrel that
grows exports for other features to consume is drifting toward being a shared layer with a
feature's name on it.

**The barrel is now load-bearing for review.** Anything exported from a feature's `index.ts`
is a public commitment to the rest of the codebase. `features/marketing/index.ts` records
which of its exports are public and why, and which are deliberately not — `sendEnquiry` stays
private because nothing outside marketing has business posting a contact enquiry. That habit
is what keeps this amendment from becoming a hole.
