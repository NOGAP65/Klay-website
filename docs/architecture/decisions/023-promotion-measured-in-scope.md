# ADR-023 — Promotion is measured against the in-scope count

**Status:** Accepted — amends SPECIFICATION.md §11, §12
**Date:** 1 September 2026
**Amends:** §11 (the promotion mechanism), §12 (the register gains a machine-readable half).
Specification version 1.6 → 1.7.

## Context

ADR-022 made promotion from `warn` to `error` require two conditions: the count reached zero,
and the rule demonstrated to fire. The P4-5 audit then ran into a case neither condition
handles.

**Three working rules can never satisfy condition 1.** `klay/no-pure-black`, `max-params` and
`max-depth` each sit at zero across everything the migration governs, and non-zero overall —
and every remaining finding is inside `src/visualiser/`. ADR-020 put that zone out of scope and
withdrew permission to edit it for any reason. **Those findings never fall.** Under §11 as
written, the count never reaches zero, and three rules that work and are already clean stay
`warn` for the life of the project.

The alternative reading — promote them anyway — is worse, because it makes `error` a claim the
build cannot honour: the rules would report errors in files nobody is allowed to fix.

**The gap is not really about the visualiser.** It is that §11 counted findings in a codebase
whose boundaries §12 had already redrawn, and never reconciled the two. The exceptions register
says which files the specification does not govern; the promotion count was ignoring it.

## Decision

**Promotion is measured against the IN-SCOPE count.**

```
in-scope = every file under src/
           MINUS the paths named by any exception carrying excludesFromScope
           MINUS netlify/, scripts/, tools/, assets-source/
```

**The set is computed from the exception register, not hand-maintained.** This is the load-
bearing half of the decision. A second, hand-kept list of "files we are not counting" is exactly
the silent divergence §13 names, and it would go stale the moment an exception retired.

- `docs/architecture/exceptions.json` is the machine-readable half of §12. Each entry carries
  its `E-` number, its paths, and whether it removes those paths from the count.
- `tools/scope.mjs` computes scope from it. `npm run check:scope` reports the count by rule.
- `npm run check:exceptions` asserts every `E-` number in §12 appears in the JSON and the
  reverse. Two copies of one list, held in agreement by a check rather than by memory.

The four flat exclusions are **not** exceptions and deliberately do not live in the register.
`netlify/` is a separate runtime on a separate tsconfig; `tools/` and `scripts/` are build-time;
`assets-source/` holds no code. None is a concession about `src/`, which is what §12 is for.

### When an exception retires, its files re-enter scope

**And any rule they violate demotes from `error` back to `warn` until the count clears.**

This is the part that keeps the definition honest. Promotion on an in-scope zero is a claim
about a smaller codebase, and when that codebase gets bigger the claim has to be re-earned. The
demotion is automatic and expected — not a regression, and not a reason to keep an exception
alive to protect a green tick.

Because scope is computed rather than listed, re-entry needs no action: delete the exception's
entry and its files are counted on the next run.

### A rule promoted this way is marked `error (in-scope)`

**It is not treated as equivalent to a globally-zero rule.** The distinction is recorded in
`LINT_BASELINE.md` beside the count. `klay/no-direct-env-access` is zero *everywhere* — there is
no file in the repository violating it. `max-params` is zero *in scope* and has nine findings in
the wardrobe renderer. Both may be `error`; only the first is a statement about the codebase.

Collapsing the two would mean a future reader seeing `error` and concluding the rule holds
everywhere, then finding nine violations. That is a smaller version of the same mistake
ADR-022 exists to prevent: a green signal that does not mean what it appears to.

## The re-audit, run under this definition

| Rule | In-scope | Out-of-scope | Fires? | Verdict |
|---|---:|---:|---|---|
| `klay/no-direct-env-access` | **0** | 0 | YES | **PROMOTE — `error`.** Globally zero |
| `klay/no-pure-black` | **0** | 1 (E-08) | YES | **PROMOTE — `error (in-scope)`** |
| `max-params` | **0** | 9 (E-08) | YES | **PROMOTE — `error (in-scope)`** |
| `max-depth` | **0** | 1 (E-08) | YES | **PROMOTE — `error (in-scope)`** |
| `@typescript-eslint/no-unused-vars` | **0** | 4 (E-08) | YES | **PROMOTE — `error (in-scope)`** |
| `react-hooks/immutability` | **0** | 2 (E-08) | **NO FIXTURE** | **HOLD.** Condition 1 met, condition 2 unproven. Needs a fixture first — ADR-022 |
| `boundaries/dependencies` | **0** | 0 | YES (probe) | **HOLD.** Conditional zero: the temporary `feature → legacy` allowance permits most of what it would catch |
| `import/no-cycle` | 0 | 0 | **NO — INERT** | **BLIND LIST.** Not a candidate |

**The promotions are not applied by this ADR.** They are scheduled for Phase 6.1, which is where
§11 already puts the flip, and they now arrive with the evidence attached rather than as a
consequence of an absence.

## Consequences

**The headline number changes, and it should.** In-scope is 334 findings against 674 overall —
E-08 alone accounts for 261. Every previous baseline entry used a looser definition that
excluded only the visualiser directories and `netlify/`. **The old numbers are not restated**;
the definition is dated, and LINT_BASELINE.md records which measure each entry used.

**§12 rows now carry paths that a tool reads.** Adding an exception still requires an ADR and a
§12 row; it also requires a JSON entry, and `check:exceptions` fails the build if either is
missing. An exception that tooling cannot see silently inflates the promotion count's
denominator, which is the failure this closes.

**`boundaries` and `scope.mjs` have different granularity, and that is now written down rather
than papered over.** E-08 names two directories and two individual files.
`eslint-plugin-boundaries` classifies by folder — file patterns are silently partial-matched,
and it warns about them. So the element list carries only the two directories, and the two pages
are covered where files *can* be expressed: `scope.mjs`. Discovered because the plugin's warning
surfaced the moment the scope tool ran alongside it.
