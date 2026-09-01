# ADR-025 — Primitives are extracted from duplication, not created from a target tree

**Status:** Accepted — amends SPECIFICATION.md §3, §9
**Date:** 1 September 2026
**Amends:** §3 (the target directory structure), §9 (the design system contract).
Specification version 1.7 → 1.8.

## Context

§3 draws the target tree, and under `design-system/primitives/` it lists:

```
├── primitives/
│   ├── Box.tsx
│   ├── Stack.tsx
│   ├── Text.tsx
│   ├── Heading.tsx
│   ├── Button.tsx
│   ├── Field.tsx
│   └── index.ts
```

Those files were then created, because the specification listed them. **Five of the six were
never used by anything.** At Phase 7 they had zero consumers between them, across every phase of
the migration, and they were deleted along with `SectionHead` — 471 lines.

**This was an error in writing §3, and the owner has recorded it as his own.** It is worth
stating plainly because the alternative reading — that six components were written badly, or that
the codebase failed to adopt them — is wrong and would send the next person looking in the wrong
place.

### The evidence, because it is unusually clean

The design system contains two populations, and they behave completely differently.

| Extracted from duplication | Created from §3's list |
|---|---|
| `useHover` — 12 consumers | `Box` — 0 |
| `CtaLink` — 4 | `Stack` — 0 |
| `CtaButton` — 2 | `Text` — 0 |
| `TextLink` — 1 | `Heading` — 0 |
| `usePrefersReducedMotion` — 4 | `Button` — 0 |
| `SectionBand` — 3 | `SectionHead` — 0 |

Every member of the left column came out of a real, counted duplication — nine slightly different
buttons, ten hand-rolled hover states, the same reduced-motion snapshot in four files. Every one
was adopted the moment it existed, because its consumers already existed and were doing the work
by hand.

Every member of the right column was written first and offered second. **Adoption of that column
is zero. Not low — zero.**

### `Button` is the case that settles it

`primitives/Button.tsx` was not a careless file. Its header identified the exact problem it
should have solved:

> *"every interactive element has to hold its own hover boolean … the single largest source of
> boolean-naming findings in the lint baseline — fourteen `*Hover` variables across the codebase,
> each one a component re-solving this. **Solving it once here is most of why this primitive
> exists.**"*

It was right about the problem, right about the count, and it solved nothing. The fourteen
variables outlived it. Phase 7 removed ten of them and replaced them with `useHover` — a hook
extracted from the same duplication a year later, adopted immediately, by the same components
that had ignored `Button`.

**A primitive that correctly diagnoses a duplication and is not adopted by it is not a primitive.
It is a proposal.**

## Decision

**§3's primitives list is illustrative, not a manifest. Primitives are extracted from observed
duplication. They are not created because a tree diagram names them.**

Added to §9:

> **A primitive earns its place by removing a duplication that already exists.** Before adding
> one, name the call sites it will replace and count them. If the answer is "components will use
> this once they exist", that is a proposal, and the place for it is a note — not a file.
>
> **A thin primitives folder is a healthy state, not an incomplete one.** It means the codebase's
> repetition has been found and named. An empty one means none has been found yet, which is
> either true or a measurement problem, and neither is fixed by writing components.

And §3 is annotated so its tree cannot be read as a checklist again.

## Consequences

**§3's other lists are subject to the same reading, and the correction generalises.** Sixteen
entries in the target tree did not exist. **None of them should be created because §3 draws
them** — §4 already says the right thing about folders (*"not every feature needs every folder;
empty folders are noise"*), and this ADR extends it from folders to files.

That generalisation is now written into §3 as a requirement rather than a warning: **every
unbuilt entry states the observation that would cause it to exist**, and the five that could not
were deleted. See the section below.

**The design system now has six exports, and that is the honest number.** `Field`, `useHover`,
`usePrefersReducedMotion`, the CTA family, `TextLink`, `SectionBand`. Every one has a consumer
and every one arrived because something was being done twice.

**It does not weaken §9's central argument.** §9 exists because `theme.ts` had zero consumers
across twelve pages while 127 hardcoded pixel values sat beside it, and its conclusion — *"the
tokens were not the problem, optionality was"* — is unaffected. **Tokens and primitives fail
differently.** A token is not optional: §9 made the literal a lint error, so there is no other way
to write a colour, and adoption followed. A component cannot be made mandatory that way — there
is no rule that says "use `Box` instead of a `div`", and there should not be. So a token can be
specified ahead of demand and a component cannot.

**AND §3 NOW GIVES EVERY UNBUILT ENTRY A TRIGGER, WHICH IS THE SAME RULE GENERALISED.** An
entry that cannot say what observation would cause it to exist is a prediction rather than a
target. Fifteen unbuilt entries were given triggers; **five could not be and were deleted from
the tree** — patterns/Section.tsx, patterns/Card.tsx, src/types/, docs/architecture/overview.md
and docs/audit/. Two triggers turned out to have already fired: `config/site.ts` (contact details
in three files, D-12) and `config/routes.ts` (`/products` referenced nine times). A third — the
glossary §6 already depends on — has never existed at all.

**The deletion is reversible and the git history holds it.** If a real duplication of stacked
layout or heading levels appears later, the extraction is the same work it always was, done from
evidence rather than from a diagram.
