# ADR-021 — `configuredLine` stays in catalogue, and derives its shape from the cart

**Status:** Accepted — resolves decision I, and the amendment left open beside it
**Date:** 1 September 2026
**Amends:** MIGRATION_MAP.md decision I. Executed in P4-4.

## Context

Decision I was recorded as **Option 1**: *"fields stay in `feature:catalogue`, `priceFor` moves
to the pricing module, `configuredLine` moves to `feature:cart`."*

A note was filed directly beneath it, and never acted on:

> **I collides with J.** `priceFor` does **not** duplicate any pricing logic — it imports
> `pricePerBlind`, `isBlindType`, `isWindowSize` and `isOperation` from `src/lib/pricing.ts` and
> contains no arithmetic of its own. It is a catalogue→pricing *adapter*, and its signature takes
> a `CatalogueItem`. Moving it into the pricing module would make a **root-level shared module
> import a feature type** — which J forbids by construction. *Suggested amendment:* `priceFor`
> stays in `feature:catalogue`; only `configuredLine` moves to `feature:cart`. **Unresolved and
> not acted on.**

P4-4 is the phase that has to answer it, because it is the phase that creates `feature:cart`.

## Decision

**Both functions stay in `feature:catalogue`. Neither moves.**

The suggested amendment is adopted for `priceFor` — it is an adapter, and ADR-014 makes
`shared-core` unable to import a feature type even if we wanted it to. **And the same reasoning
is extended to `configuredLine`, which the amendment stopped short of.**

`configuredLine` reads as cart code because of its return value. Look at what it needs to do its
job and it is catalogue code throughout: `fieldsFor`, `priceFor`, `labelOf`, `AT_MEASURE`,
`CatalogueItem`, `Selection`, `ConfigField`, `FieldId`. **Eight things, seven of them
catalogue's, two of them currently private.**

Moving it to cart would mean exporting `labelOf` and `AT_MEASURE` from catalogue's barrel so
that cart could reach them. ADR-019 is explicit about what that is:

> *"A feature barrel that grows exports for other features to consume is drifting toward being a
> shared layer with a feature's name on it."*

Catalogue's barrel already carries that warning in its own header, with a note that six of its
eight exports should go when home migrates at P4-6. **Adding two more so a function can sit on
the other side of the boundary is movement in the wrong direction**, and it buys nothing: the
one consumer, the homepage range configurator, already imports catalogue.

**An adapter belongs with the side that knows the most.** That is the reasoning the map already
accepted for `priceFor`; `configuredLine` is the same shape one level up.

## And the part that is not just a location — the shape is derived, not restated

`ConfiguredLine` declared all twelve of its fields by hand:

```ts
export interface ConfiguredLine {
  name: string; type: string; blindType: string; fabricColour: string
  hardwareColour: string; windowSize: 'small' | 'medium' | 'large'
  operation: 'manual' | 'motorised'; price: number; priceOnMeasure: boolean
  options: { label: string; value: string }[]
}
```

That is `CartItem` minus `id` and `quantity`, written out a second time. It was correct on the
day it was written, and it is **exactly** §13's *Silent Divergence*: *"Two copies of the same
constant, table or rule. Both correct when written, one updated six months later."* Add a field
to the cart line and this file keeps compiling while quietly failing to carry it.

It is now derived:

```ts
export type ConfiguredLine = Omit<CartItem, 'id' | 'quantity'>
```

`addItem` takes precisely `Omit<CartItem, 'id' | 'quantity'>`, so this is not an approximation of
the cart's shape — it is the cart's shape. A field added to `CartItem` now reaches
`configuredLine` as a type error.

**This is the first cross-feature import in the codebase that exists to prevent a divergence
rather than to reuse a component**, and it is worth naming as the pattern: catalogue imports
`type { CartItem }` from `@/features/cart` — through the barrel, type-only, no runtime edge.

**The one cost, stated.** `priceOnMeasure` and `options` are optional on `CartItem` and were
required on the old interface. `configuredLine` sets both on every line it builds, and its only
consumer passes the result straight to `addItem`, so nothing reads them expecting a guarantee
the cart itself does not make. Tightening `CartItem` instead would change what the cart accepts
from four other call sites, which is a cart decision and not this one.

## Consequences

**`feature:cart`'s barrel exports `CartItem` for this reason** and records it in its header.
That is the whole of the new public surface — a type, consumed by one feature, to keep one shape
in one place.

**Decision I is closed.** The MIGRATION_MAP row is updated from Option 1 to this, so the next
reader does not re-open a question that was answered twice and recorded neither time.
