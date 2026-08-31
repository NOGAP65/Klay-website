# ADR-014 — `shared-core` is a zero-dependency contract between two runtimes

**Status:** Accepted — amends SPECIFICATION.md §2
**Date:** 31 August 2026
**Amends:** §2 (the layer model). Specification version 1.0 → 1.1.
**Relates to:** §3 (target structure), §7 (pricing), §10 (`@/core/*` alias)

## Context

§7 requires exactly one price table, in `shared-core/pricing/`, imported by `src/` to display
a price and by `netlify/` to decide one. §3 places `shared-core/` outside `src/` deliberately:
"It is neither client nor server code — it is the contract between them." §10 gives it the
alias `@/core/*`.

**§2's layer table does not permit anyone to import it.** It says features may import from
"design-system, shared, config, and its own internals only", and app from "features,
design-system, shared, config". `core` appears in neither list.

Left as written, the rule that enforces §2 would forbid the import that §7 mandates. The first
time `eslint-plugin-boundaries` is configured against the specification as literally written,
`features/booking` importing `@/core/pricing` is a violation.

This was found while wiring boundaries in Phase 1.2, before any file had moved — which is the
cheapest possible moment to find it.

## Decision

**Amend §2's layer table so that both App and Features may import `shared-core` via `@/core`.**

**`shared-core` may import nothing.** Not `src/`, not `netlify/`, not `shared/`. Zero
dependencies in either direction.

| Layer | May import from |
|---|---|
| App | features, design-system, shared, config, **core** |
| Features | design-system, shared, config, **core**, and its own internals |
| Design system | nothing except itself |
| Shared | config, other shared |
| **Core** (`shared-core/`) | **nothing** |

Declared in `eslint.config.js` as an element type with an empty allow-list:

```js
{ from: 'core', allow: [] }
```

### Why zero dependencies, and not "may import shared"

`shared-core` is imported by two runtimes that share nothing else. A browser bundle and a Node
function have different globals, different module resolution and different build pipelines.
The moment `shared-core` imports anything, that thing must also be valid in both — and the
dependency will be added by someone thinking about only one of them.

`src/lib/pricing.ts` already demonstrates the discipline this formalises. Its header says:

> It follows that this file must stay pure — no React, no `window`, no imports that reach for
> either. It runs in a Node function as readily as in the SPA.

That constraint currently holds because one person wrote it down and everyone since has
respected it. An empty allow-list makes it a build failure instead.

The `shared/` layer is the tempting exception and is refused deliberately: `shared/` is
browser-oriented (it holds `shared/components/`, `shared/hooks/`), and permitting
`core → shared` would let a React hook reach the server by two hops.

## Consequences

**The `@/core/*` alias must exist in `tsconfig`, `vite.config.ts` *and*
`tsconfig.functions.json`** — the last of these because `netlify/` imports it too, and that
project is typechecked separately by `tsc -b`. Adding it to only the first two produces code
that typechecks in the app project and fails in the functions project.

**`shared-core/` cannot import `src/lib/pricing.ts`'s current neighbours.** The move in Phase 6
is not a relocation of one file — every transitive import it carries must be checked against
the empty allow-list first. `pricing.ts` today imports nothing at all, so this is currently
free. It will not stay free by accident.

**One known collision, unresolved.** `priceFor` in `src/data/configOptions.ts` delegates to
`pricePerBlind` and takes a `CatalogueItem` — a catalogue type. Moving `priceFor` into
`shared-core/pricing/`, as decision I proposed, would make `shared-core` import a feature type
and breach this ADR by construction. The suggested amendment is that `priceFor` stays in
`features/catalogue` as the adapter it is, and only `configuredLine` moves. **Not yet
decided.** Recorded in MIGRATION_MAP.md.

**Netlify's bundler must follow the alias.** `netlify.toml` sets `node_bundler = "esbuild"`,
which resolves TypeScript path aliases from the tsconfig that covers the file. If it does not
pick up `@/core`, the functions will build locally and fail at deploy — the failure shape the
migration map flags as the most dangerous in the whole project (R1). **Verify this on a deploy
preview in Phase 6, not on a local build.**
