# DIVERGENCE LOG

**A running count of duplicate implementations found in this codebase.**

This is the evidence for §11. SPECIFICATION.md §0 says every rule must be enforceable by a
machine, because *"a rule that relies on someone remembering it is not a rule, it is a hope."*
The entries below are what happens without that enforcement — and every one of them was
written by someone competent, in code that was individually good.

**Running total: 6 confirmed. 3 resolved, 2 deliberate, 1 open.**

Add an entry the moment one is found, before deciding what to do about it. A divergence that
is only recorded in a commit message is not recorded.

---

## D-01 — Two complete checkouts

**Type:** The Second Implementation (§13) · **Status:** OPEN
**Found:** 31 Aug 2026, state-of-build audit

`/book` — `src/pages/BookInstallPage.tsx`, 548 lines — is a finished payment path: server-side
re-pricing, validated input, honeypot, rate limiting, a signature-verified idempotent webhook,
and a confirmation page that polls the database rather than trusting the return URL.

`/cart` — `src/pages/CartPage.tsx`, 473 lines — is a second, equally polished checkout whose
submit handler is:

```js
alert('Order submitted! We will contact you shortly to arrange measurement.');
clearCart();
```

No network call. It collects nine fields including a full street address, tells the customer
their order was submitted, and empties the basket so the evidence goes too.

**Neither knew the other existed.** The homepage visualiser's **Buy Now** goes to the broken
one; the working one is behind buttons labelled *Book Installation* and *Get Quote*.

**This is the divergence that caused the specification to be written.** §0 cites it by name.

**Still open.** Not a migration task — it is a product decision about whether the cart is
wired up or removed. MIGRATION_MAP.md R8.

---

## D-02 — The visualiser fork

**Type:** The Second Implementation · **Status:** DELIBERATE, with an exit condition
**Found:** 31 Aug 2026, mid-audit — it appeared while the audit was running

`src/visualiser-lab/` began as a byte-identical copy of `src/visualiser/` — 8 files, 7,819
lines, ~97 kB of production bundle, and no diff.

**It has since earned its keep.** It now holds `wardrobes.ts`, `Canvas2DWardrobeRenderer.tsx`,
`wardrobeGeometry.ts` and a store that has diverged — a whole product category being built
where it cannot break a renderer that four surfaces mount.

**Deliberate, documented, and it has a written exit condition** in
`VisualizerLabPage.tsx`: diff the two, move across what is wanted, delete the page, its route
and the directory together. ADR-013 defers the `visualiser`/`visualizer` spelling split on the
same condition.

**The thing to watch:** every change to the shared eight files is currently applied to both
copies by hand. Four commits did exactly that on 31 Aug.

---

## D-03 — The email regex, three copies

**Type:** The Silent Divergence (§13) · **Status:** PARTIALLY RESOLVED
**Found:** 31 Aug 2026, Phase 3

```
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

| Location | Status |
|---|---|
| `src/pages/BookInstallPage.tsx:119` | **Resolved** — calls `isValidEmail` |
| `src/pages/ContactPage.tsx:69` | **Resolved** — calls `isValidEmail` |
| `netlify/lib/booking.ts:48` | **Open** — across the runtime boundary |

The two client copies now share `src/shared/lib/validate/email.ts`. The server's cannot be
reached from `shared/` (§2), so it goes to `shared-core` in Phase 6 — PHASE_6_SCOPE.md item 3.

Textbook §13: *"Both correct when written, one updated six months later."* All three were
identical, all three written independently, none aware of the others.

---

## D-04 — The postcode regex, two copies

**Type:** The Silent Divergence · **Status:** OPEN, deliberately
**Found:** 31 Aug 2026, Phase 3

```
/^\d{4}$/
```

`src/pages/BookInstallPage.tsx:122` and `netlify/lib/booking.ts:51`.

**Not extracted, on purpose.** There is only one copy in `src/`, so a shared module would have
a single consumer — speculative generality, and §4 says empty folders are noise. It joins
`isValidEmail` in `shared-core` in Phase 6, when the cross-runtime home exists and the
duplication can actually be resolved rather than relocated.

Logged because a duplicate that is known and deliberate is a different thing from a duplicate
nobody has noticed, and only the log records which this is.

---

## D-05 — Three curtain implementations

**Type:** The Second Implementation · **Status:** OPEN
**Found:** 31 Aug 2026, state-of-build audit

| Implementation | Lines | Reachable? |
|---|---:|---|
| `Canvas2DCurtainRenderer.tsx` — three.js, wave-fold physics | 2,052 | **Yes** — the live path |
| `drawNewCurtainArea` in `Canvas2DBlindRenderer.tsx:2483` | ~557 | Yes, for `productCategory === 'curtain'` |
| `drawCurtainArea` in `Canvas2DBlindRenderer.tsx:3047` | ~147 | **No** — reachable only via blind-type strings (`'sheer-curtains'`, `'blockout-curtains'`) that no UI can produce |

Three attempts at drawing a curtain, in two files, one of them unreachable. All inside the
frozen zone. **ADR-020 removed that zone from the migration entirely, so none of the three can
be resolved by this project.** They are resolved by the separate visualiser work, or not at all.

`Canvas2DBlindRenderer.tsx` is protected IP (E-02) and may not be edited — which means the
~704 lines of curtain code inside it can only be addressed when the file is unfrozen.

---

## D-06 — Hardware colour maps, three copies

**Type:** The Silent Divergence · **Status:** OPEN
**Found:** 31 Aug 2026, state-of-build audit

| Location | What it is |
|---|---|
| `src/data/products.ts:230` | `HARDWARE_HEX` — white / black / chrome. The catalogue's own. |
| `Canvas2DBlindRenderer.tsx:1370` | `HARDWARE_FLAT_HEX` — white / black only |
| `Canvas2DCurtainRenderer.tsx:474` | a local `HARDWARE_HEX` |

The blind renderer imports `data/products`' map **and** declares its own. Two of the three are
in the frozen zone. Decision H already schedules the hardware values to move to the visualiser
at P4-7 — but **ADR-020 deleted P4-7 and put decision H out of scope**, so there is no longer a
moment in this migration at which all three collapse. `HARDWARE_HEX` stays in
`src/data/products.ts`, which stays where it is (E-10).

---

## Why this file exists

Six divergences in a codebase of roughly 31,000 lines, written by people who were paying
attention. Not one was the result of carelessness — D-01's two checkouts are both well
written, D-02 is a deliberate engineering decision, and D-03's three regexes are identical
because three competent people independently reached the same correct answer.

**That is the argument.** The failure mode is not bad code. It is code that cannot see other
code, in a structure that does not make the collision visible. Feature barrels (§1 rule 3),
one public entrance per feature, and the enforcement in §11 are aimed at exactly this — and
the count above is how we will know whether they worked.

**The measure of success is that this file stops growing.**

---

## THE SHARED CAUSE — D-03 AND D-05, AND WHY `shared-core` EXISTS

D-03 (an email regex in three places) and D-05 (three curtain implementations) look unrelated.
They have **one cause between them: there was no legal home for a shared thing.**

**D-03.** The rule "an email address has one @, no spaces, and a dot in the domain" is needed
by the booking form, the contact form and the server's validator. The two client copies could
in principle have shared a module. The server's could not — `src/shared/` has no route into
`netlify/` (§2), and until ADR-014 there was no cross-runtime layer at all. So the third copy
was not laziness; **it was the only thing the architecture permitted.** Three competent people
independently wrote the same correct regex because the structure gave them nowhere to put one.

**D-05.** The same shape one level down. Drawing a curtain is needed by the blind renderer's
curtain path and by the dedicated three.js curtain renderer. There is no
`rendering/shared/` — §3's target tree provides one; the codebase does not have it yet — so
each grew its own, and a third implementation is stranded inside
`Canvas2DBlindRenderer.tsx` unreachable from any UI.

**The pattern, stated once:**

> When a thing is needed in two places and the architecture provides no legal home for it, it
> gets written twice. Both copies will be correct. One will be updated six months later.

**That is the case for `shared-core`, in evidence rather than in principle.** ADR-014 gives it
zero dependencies in either direction precisely so it can be that home: importable by a
browser bundle and a Node function that share nothing else. D-03's third copy is the first
thing scheduled to move into it (PHASE_6_SCOPE.md item 3), and D-04's postcode regex — logged
as a *deliberate* non-extraction — is waiting for the same home rather than being relocated
somewhere it does not solve anything.

**And it is the argument for `rendering/shared/` whenever the visualiser is eventually
reorganised** — ADR-020 moved that out of this migration, but the argument travels with the
work rather than with the schedule. Same rule, different scope. If the
visualiser is unfrozen and reorganised without a place for cross-renderer geometry, D-05 will
regenerate — because the condition that produced it will not have changed.

**The test for any future divergence: before asking "who duplicated this?", ask "where would
the single copy have gone?"** If the answer is "nowhere legal", the structure caused it, and
fixing the copies without fixing the structure buys nothing.
