# ADR-022 — No lint rule is trusted until it has been demonstrated to fire

**Status:** Accepted — amends SPECIFICATION.md §11
**Date:** 1 September 2026
**Amends:** §11 (Enforcement). Specification version 1.5 → 1.6.

## Context

§0 states the governing principle: *"every rule in this document must be enforceable by a
machine. A rule that relies on someone remembering it is not a rule, it is a hope."* §11 is the
section that makes the rest real, and it is a table of rules mapped to mechanisms.

**The table records that a mechanism was chosen. It has never recorded that the mechanism
works.** That distinction turned out to be the whole thing.

`import/no-cycle` is listed against *"No circular imports"*. It is in `eslint.config.js`. The
TypeScript resolver is installed and resolving — `import/no-unresolved` is silent on every `@/`
specifier in the repository. The rule is loaded and its options are schema-validated: pass it a
nonsense option and ESLint refuses to start.

**And it reports nothing. Against anything.**

Not against the two real cycles found at P4-4:

```
cart/index.ts -> CartPage -> Nav -> cart/index.ts
catalogue/index.ts -> ProductsPage -> ProductCard -> primitives -> catalogue/index.ts
```

And not — this is the part that settles it — against a two-file fixture built for no other
purpose than to violate it:

```ts
// alpha.ts
import { beta } from './beta';
export const alpha = () => beta();

// beta.ts
import { alpha } from './alpha';
export const beta = () => alpha;
```

Tested at `error` level, with a finite `maxDepth`, and with `ignoreExternal` off. Nothing.
**The rule is inert, and §11's circular-import line has been unenforced since the day it was
written.**

The catalogue cycle shipped at P4-3 into a repository that believed it had a rule watching for
exactly that, and Phase 0's *"Circular imports: ZERO — full DFS, no cycle of any length"* has
been false ever since without anyone being told.

**This is the second occurrence, not the first.** Phase 2 found that `eslint-plugin-boundaries`
*"was misconfigured and silently failing"* — the config was written against a v5-era shorthand
that v7 still loads while quietly not parsing the same-feature capture rule, *"which is the
single most important policy in the table."* That was caught by accident, and the lesson was
recorded as a note about plugin versions rather than as a rule about verification.

Twice now, the thing that failed was not a rule. It was the assumption that a configured rule is
a working rule.

**A rule reporting zero is indistinguishable from a rule finding nothing wrong.** Worse: under
§11's own baseline mechanism — *"every new rule starts as `warn` with a recorded baseline count.
The count may go down; it may not go up. At zero it flips to `error` permanently"* — a broken
rule reports zero, is judged clean, and is **promoted to `error` as a reward for not working.**
`klay/no-direct-env-access` is currently first in the queue for exactly that promotion, at 0
since Phase 2.1. Its zero happens to be real. Nothing in the process could have told us.

## Decision

**A rule is not trusted until it has been demonstrated to fire. Every rule the project relies on
— custom and third-party alike — has an artefact that violates it, and a runner that asserts a
non-zero count against that artefact.**

Added to §11 as a precondition, not a nicety:

> **No rule counts as enforcement until it has been shown to fail.** Every rule in this table
> carries a fixture that violates it and a check that the rule reports against that fixture. A
> rule that cannot be shown to fire is not enforcing anything, and its zero is not evidence.
> **A rule may not be promoted from `warn` to `error` on the strength of a zero that has not
> been demonstrated to be a real zero.**

`npm run verify:rules` — `tools/verify-rules-fire.mjs`. It loads the real `eslint.config.js`,
because the thing under test is the configuration as shipped rather than a stub of it.

**Two mechanisms, because the rules need different things.**

| | What it is | Why |
|---|---|---|
| **Fixtures** | Real files in `tools/rule-fixtures/`, each a deliberate violation | Excluded from `eslint .` so they cannot pollute the baseline, and linted here with ignores off. The directory carries its own `tsconfig.json`, not referenced by the root, so typed linting works and `tsc -b` never sees it — `@typescript-eslint/naming-convention` can only know a variable is a boolean by asking the typechecker |
| **Probes** | `lintText` against a virtual path under `src/` | `eslint-plugin-boundaries` classifies a file by **where it is**. A fixture in `tools/` is not a design-system file whatever it contains, and putting a real one in `src/design-system/` would pollute the tree the rule exists to protect |

**Current state: 13 rules proven by fixture, 2 by probe, 1 recorded blind.**

## The blind one is listed, not hidden

`import/no-cycle` is named in a `KNOWN_BLIND` list that the runner prints on every run, with
what it fails against and what covers the gap meanwhile (`tools/cycle-check.mjs`,
`npm run check:cycles`). If it ever starts reporting, the runner says so and asks for it to be
promoted.

**This is the part that matters more than the fixtures.** A gap with a name on it is a
liability someone can act on. A gap with no name is a green tick, and a green tick is what this
whole ADR is about.

## Consequences

**The §11 table gains a column in spirit: mechanism, and evidence it works.** A row without
evidence is a hope with a plugin name attached, which is precisely what §0 forbids.

**Rules not yet covered are visible.** The `react-hooks/*` family and
`react-refresh/only-export-components` report non-zero in the ordinary run, so they are
demonstrably alive, but they have no dedicated fixture and are not in `EXPECTED`. `knip` and
`jscpd` are not configured yet (Phases 6.3, 6.4) and get fixtures when they are.

**`klay/no-direct-env-access` can now be promoted honestly.** Its zero is a real zero: the rule
fires against `tools/rule-fixtures/direct-env-access.ts`. That promotion was already scheduled
for Phase 6.1 and would otherwise have rested on nothing.

**The cost is a directory of code that must never be fixed.** `tools/rule-fixtures/README.md`
says so at the top. A fixture repaired by a well-meaning autofix silently removes the proof, so
the directory is excluded from `lint:fix` by being excluded from the lint run altogether.

**And the rule this generalises to.** Not just lint: any check whose success is reported as an
absence — a test suite that runs no tests, a CI step that greps for a pattern that has been
renamed, a typecheck over a project that includes no files. §11's CI gate is a list of commands
whose zero exit codes we have been reading as evidence. This ADR fixes the lint half. **`tsc -b`
covering `netlify/` has never been proven either**, and `vite build` never invokes it.
