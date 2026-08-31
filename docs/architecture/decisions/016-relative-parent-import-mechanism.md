# ADR-016 — `no-restricted-imports` on `../*`, not `import/no-relative-parent-imports`

**Status:** Accepted — amends SPECIFICATION.md §11
**Date:** 31 August 2026
**Amends:** §11 (enforcement mechanism list). Specification version 1.1 → 1.2.
**Relates to:** §10 (imports and paths), LINT_BASELINE.md

## Context

§10 requires: *"Relative imports permitted only within the same feature or folder.
`../../../shared/lib/format` is a lint error."* §11 names `import/no-relative-parent-imports`
as the mechanism.

That rule **resolves the specifier before judging it**, so it cannot distinguish a relative
climb from an alias. `@/ds` imported from `src/pages/` resolves to a parent directory, so it
fires — identically to `../../theme`. Measured during Phase 2: four findings in
`AboutPage.tsx` alone, every one of them on an alias import that Phase 2.2b had *just
introduced as the correct form*.

Two consequences, and the second is the serious one:

1. **The rule reports the desired end state as a violation.** Every alias import the migration
   creates is a new finding. A developer following §10 correctly is told they are wrong.
2. **The count can never reach zero, so the rule can never flip to `error`.** §11's own
   escalation model — *"At zero it flips to error permanently"* — is unreachable for this rule
   by construction. It would sit at `warn` forever, which is the state §11 describes as how
   rules get switched off.

It was also **inflating the baseline by 29**. The Phase 1.2 figure of 169 (153 movable) mixed
genuine `../` climbs with alias imports it had misjudged.

## Decision

**Replace it with `no-restricted-imports` on the pattern `../*`.**

```js
'no-restricted-imports': ['warn', {
  patterns: [{
    group: ['../*'],
    message: 'Relative parent import. Use an alias — @/ds, @/shared, @/config, @/core, ' +
             '@/features/<name> — so the layer is visible at the import site (§10).',
  }],
}],
```

`no-restricted-imports` matches the **specifier text**, which is what §10 is actually about.
§10's own justification is textual, not structural: *"a relative path breaks when a file moves,
and it hides the layer violation — `@/features/cart/components/Thing` is visibly illegal from
inside booking; `../../cart/components/Thing` is not."* The complaint is about what a reader
sees at the import site. An alias passes; a `../` does not.

**The true baseline is 124 movable, not 153.** Recorded in LINT_BASELINE.md as a measurement
correction, explicitly not as progress.

**§11's mechanism table is amended** to name the replacement, and to state why the original
could never flip to `error` — so that nobody restores it on the strength of the specification
naming it.

### One scoped exception

`src/design-system/**` has the rule off. §3's own structure puts `primitives/` and `tokens/`
side by side, so any primitive that uses a token reaches a sibling folder. §10's concern is
*cross-layer* relative imports that hide a violation; inside a single layer there is no
boundary to hide. Recorded in the config, not in §12, because it is a rule scoping decision
rather than an exception to a rule.

## Consequences

**§11's mechanism list is guidance, and this is the precedent for treating it that way.** ADR
approval is still required to deviate — this is that approval — but a named mechanism that
cannot enforce its own rule is not binding. The rule in §10 is unchanged; only the tool is.

**`no-restricted-imports` has one blind spot the old rule did not.** It matches text, so
`../../../deeply/nested` and `../sibling` are treated alike, and it cannot see that
`@/features/cart/...` from inside booking is illegal. That second job belongs to
`boundaries/dependencies`, which does the structural analysis properly. **The two rules
together cover what the one rule was failing to cover alone** — which is worth stating,
because dropping either leaves a real gap.

**This rule is now on the Phase 6.1 escalation path.** At 124 movable it is not close, and it
falls as features migrate; but unlike its predecessor it can actually reach zero.
