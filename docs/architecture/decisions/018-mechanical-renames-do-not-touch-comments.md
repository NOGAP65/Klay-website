# ADR-018 — Automated renames do not touch comments

**Status:** Accepted — amends SPECIFICATION.md §11
**Date:** 1 September 2026
**Amends:** §11 (enforcement). Specification version 1.2 → 1.3.

## Context

Phase 2.3 repointed 147 call sites from the spacing scale's t-shirt names to its role names
with a scripted `\bspace\.md\b → space.item` substitution across `src/`.

It also rewrote this, in `src/theme.ts`:

```diff
-// frozen visualiser — `space.xs` is 70% frozen, `lerp` and `tokens.traceTeal`
+// frozen visualiser — `space.tight` is 70% frozen, `lerp` and `tokens.traceTeal`
```

**The comment is now false.** It documents which identifiers the *frozen* visualiser still
imports — and the frozen zone was deliberately excluded from the rename, so it still imports
`space.xs`. The substitution was correct everywhere it touched code and wrong in the one place
it touched prose.

It was caught, and only because the diff was checked line by line against a filter for
non-import changes. A second occurrence would have been missed.

**The general shape of the problem:** a comment referring to an identifier is usually not the
same claim as the code referring to it. Comments describe history (*"this was `warmWhite`
until the palette went neutral"*), state what other code does (*"the frozen zone still imports
`space.xs`"*), and record reasoning about names that no longer exist. A rename that treats
prose as code turns accurate documentation into confident misinformation — which is worse than
a stale comment, because it reads as current.

## Decision

**A scripted or automated rename operates on code only. It does not modify comments.**

Comments referencing a renamed identifier get a **separate, reviewed pass** — read, not
substituted, because deciding whether a mention should change requires knowing what the
sentence is claiming.

Practically, for anyone running one of these:

1. Restrict the substitution to code, or run it over everything and then **diff the comment
   lines specifically**:
   ```
   git diff -U0 | grep -E '^\+' | grep -E '^\+\s*(//|\*|/\*)' | grep '<new-identifier>'
   ```
   Any output is a comment the rename touched. Review each one.
2. Do the prose pass **as its own commit**, so a reviewer sees documentation changes separately
   from mechanical ones.
3. Where a comment is *about* the old name — history, or another layer's usage — **leave the
   old name and add the new one**, rather than replacing it.

## Consequences

**This is a working practice, not a machine-enforced rule, and §11 is the section that says
practices are hopes.** It is placed there anyway, deliberately: §11 is where anyone reaches
for the rules about tooling, and a rule about how tooling is *run* belongs beside the rules
about what tooling *checks*. The grep above is the closest thing to enforcement available, and
it is written down so it can be run.

**Accepted cost.** Comments will drift behind renames. A stale comment that says
`space.md` after `space.md` is gone is a small, visible, self-announcing problem. A comment
rewritten to say `space.tight` about code that imports `space.xs` is a silent one. The first
failure mode is strictly better than the second.

**It applies to the whole migration**, and most sharply to the passes still coming: the
literal-to-token conversion in Phase 4, the naming-convention pass (66 movable findings), and
the deletion pass after the structure settles.
