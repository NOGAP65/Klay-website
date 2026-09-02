# ADR-026 — An order is the start of a job, not a transaction

**Status:** Accepted — records a shape. **Nothing is modelled by this ADR.**
**Date:** 3 September 2026
**Amends:** nothing yet. Constrains PHASE_6_SCOPE.md's two blocking decisions.

## Context

The business runs a **job** with four stages:

> **payment → measure → manufacture → install**

**Payment is the first stage, not the last.** The site models payment and nothing else. There is
no type, table, column or function for measure, manufacture or install, and none for the person
assigned to any of them.

This was found from the other end. A glossary was written by extracting every domain term that
appears as an identifier, and two rows came out empty: **measure** had no word in the code, and
**check measure** — §6's own worked example of business vocabulary — named a function that does
not exist. The business then confirmed the shape those gaps were pointing at.

**The site is not wrong to model only payment.** It is a website; the rest of the job may belong
in FieldInsight. **What is wrong is that the thing it creates is shaped as if payment were the
end of something.**

## Decision

**Recorded, not modelled: an order is the start of a job, not a transaction.**

No types, no tables, no columns, no interfaces are introduced here. This ADR exists so that the
next decision about the order model is made against the right shape, and so that "we did not
know" is not available later.

## Consequences

### For the order model

**The current shape is a receipt.** `orders` holds the customer, one flat configuration, a price
breakdown and a Stripe reference. It answers *what was bought and did it pay* — which is
complete for a transaction and is stage one of four for a job.

**An order therefore needs to be referenceable by something that has stages.** Not to contain
them — where the stages live is FieldInsight's question, not this codebase's — but an order that
cannot be pointed at from a job is a dead end at the moment the job begins.

**The measured window is not the ordered window, and nothing currently distinguishes them.**
`windowSize` is `small | medium | large` — explicitly *"a pricing band, not a measurement"*. The
measure stage produces real millimetres, which are what gets manufactured. **A field that means
"what we charged for" and a field that means "what we made" cannot be the same field**, and today
only the first exists.

**`price_breakdown jsonb` is the only structured thing on the order**, and it exists for
display. Whatever carries configuration into a job should not be that column by accident.

### For FieldInsight

The CRM is **not started** — `STATE_OF_BUILD_2026-08.md` §13: zero occurrences in the repository.
Its integration notes already anticipated the difficulty without naming the cause:

> *"The customer fields map cleanly. **The configuration does not**: FieldInsight will want line
> items and quantities, and `bookingRow()` produces a single flat configuration."*

**That is this ADR's shape, discovered from the integration side eight weeks earlier.** A flat
configuration does not map to a job because a job has line items, and line items are what the
measure and manufacture stages operate on individually.

**So the order shape and the FieldInsight mapping are one decision, not two.** Designing the
order shape without knowing what FieldInsight calls a job risks a second mapping layer between
two models that were each designed alone — and its API is still **UNKNOWN**; nothing in this
repository describes it. **That is now a blocking dependency for the order shape, not a later
integration task.**

### For PHASE_6_SCOPE's two blocking decisions

**Decision B — the canonical order shape — is resolved in principle.** `blindType` as a
composite identity string (`roller-blinds:blockout:surfmist:white:medium:manual`) is **wrong**,
and this ADR says why rather than merely that it is ugly: it encodes a configuration into a
single field **that the money path cannot read**. `pricePerBlind` needs `blindType`, `windowSize`
and `operation` as separate values; a job needs them separately too, because manufacture acts on
each. One field packing six is unreadable to both ends and was built to satisfy a third — cart
line uniqueness.

**Decision A — multi-item checkout — is unchanged and still with V and Bobby.** This ADR does not
answer it and must not be read as doing so. It does sharpen it: if an order starts a job, then
"can one order contain several blinds" is really *"is a job one window or one house"*, and that
is a question about how Klay schedules a measure, not about a database.

### For what is NOT decided here

- **Where the stages live.** Plausibly FieldInsight, plausibly Supabase, plausibly both. Not
  answered, and answering it needs the CRM's API.
- **Whether the site should show job progress.** A customer asking *"where is my order"* is a
  real product question this ADR does not open.
- **The technician.** Nothing represents one, and the business's own promise — *"the technicians
  who measure your windows are the same people who come back to install them"* — is a continuity
  the codebase cannot currently express. Recorded as a consequence; not a design.

**The order of work follows from the above:** FieldInsight's job model, then the order shape,
then multi-item. Doing the order shape first means designing against a guess.
