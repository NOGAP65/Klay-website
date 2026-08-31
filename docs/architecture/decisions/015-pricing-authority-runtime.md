# ADR-015 — Pricing authority lives in `netlify/`; edge is an optimisation, not a requirement

**Status:** Accepted — amends SPECIFICATION.md §7 and §3
**Date:** 31 August 2026
**Amends:** §7 (where each kind of logic belongs), §3 (target structure). Version 1.0 → 1.1.
**Relates to:** ADR-014, MIGRATION_MAP.md R1

## Context

§7's table says *"Decides what a customer pays → `netlify/edge-functions/`"*, and §3's target
tree annotates `edge-functions/` as "latency-sensitive, and ALL pricing authority".

**There are no edge functions in this repository.** `netlify.toml` declares no
`[[edge_functions]]` block and `netlify/edge-functions/` does not exist. Pricing authority
today sits in a regular serverless function, `netlify/functions/create-checkout-session.ts`,
which:

- imports `priceOrder` from the shared pricing module,
- re-derives the amount from the submitted *configuration*, never from a client-sent price
  (`netlify/lib/booking.ts:114`),
- refuses a zero or negative total (`create-checkout-session.ts:52`),
- and hands Stripe `Math.round(line.amount * 100)` computed from that server-side result.

Read literally, §7 makes the existing, working, correct payment path a specification violation,
and implies the migration must move it to a runtime that does not yet exist — along with the
discrepancy logging §7 describes. That is new work, not a relocation, and it was not in the
migration plan.

## Decision

**Amend §7: pricing authority lives in `netlify/` — functions or edge functions.**

`create-checkout-session` as a serverless function **already satisfies the security
requirement.** What §7 is actually protecting is the trust boundary: the price is decided by
code the customer cannot reach, from a table the customer cannot edit. A serverless function
satisfies that exactly as completely as an edge function does. The runtime is a latency
characteristic, not a security one.

**Amend §3** so `netlify/functions/` is annotated as a legitimate home for pricing authority,
and `edge-functions/` as latency-sensitive work only.

**Moving pricing to the edge is separate, later, optional work.** Out of scope for this
migration. To be sized on its own merits, with its own ADR if it proceeds.

**Do not change the runtime in Phase 6.** Phase 6 moves the pricing module to `shared-core/`
and updates its four consumers. It does not touch which runtime executes them.

### What is unchanged

Everything §7 says about the *rule* stands, and it is the part that matters:

> There is one price table. It lives in `shared-core/pricing/` and is imported by both `src/`
> (to display) and `netlify/` (to decide). The browser's number is display only and never
> trusted. … Duplicating the price table into the edge function "so it's server-side" is the
> wrong fix — you then have two tables that will silently diverge. **Share the module; separate
> the authority.**

The anti-pattern §13 names as The Trusted Client is unaffected. So is The Silent Divergence.

## Consequences

**The migration's scope does not grow.** Phase 6 remains: move the module, update four
`netlify/` imports and two config files, one commit, deploy-preview gate.

**§7's discrepancy-logging sentence is currently unimplemented and stays that way.** *"If they
disagree, the edge function wins and the discrepancy is logged."* There is no comparison and
no logging today — the browser's figure is never sent, so there is nothing to compare it
against. `src/lib/api.ts:3-9` records this deliberately: "Note what is NOT sent: a price."

That is a stronger position than logging a discrepancy, because a discrepancy cannot arise.
**If a future change ever sends the client's price for comparison, the logging becomes
mandatory** — and that change needs its own ADR.

**Accepted risk.** A serverless function has a cold start an edge function does not. On the
checkout path that is a latency cost at the least forgiving moment. It is not a correctness
cost, and there is no measurement of it yet — which is exactly why moving to edge should be
sized on its own evidence rather than adopted because a specification table said so.

**§14 already excludes performance budgets** from this specification. Any future edge move
belongs to that work, not to this one.
