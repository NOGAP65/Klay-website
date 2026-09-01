# DIVERGENCE LOG

**A running count of duplicate implementations found in this codebase.**

This is the evidence for §11. SPECIFICATION.md §0 says every rule must be enforceable by a
machine, because *"a rule that relies on someone remembering it is not a rule, it is a hope."*
The entries below are what happens without that enforcement — and every one of them was
written by someone competent, in code that was individually good.

**Running total: 11 confirmed. 3 resolved, 1 partially resolved, 2 deliberate, 5 open.**

| | Status |
|---|---|
| **D-01** two checkouts | **RESOLVED at P4-5** — the second one is deleted |
| D-02 visualiser fork | Deliberate. Out of this migration's reach — ADR-020 |
| D-03 email regex ×3 | Partially resolved — 2 of 3 share a module; the third needs `shared-core`, Phase 6 |
| D-04 postcode regex ×2 | Deliberate non-extraction, waiting for the same home |
| D-05 three curtain implementations | Open. **Not resolvable by this migration** — ADR-020 |
| D-06 hardware colour maps ×3 | Open. **Not resolvable by this migration** — ADR-020 |
| **D-07** `MOTORISED_ADDON` ×2 | **RESOLVED** — data/products.ts re-exports pricing.ts |
| **D-08** hover state ×2 implementations | **RESOLVED at Phase 7** — 10 hand-rolled sites removed, not renamed |
| **D-09** form-field setter ×2 | Open. Identical helper in two forms. Waits for booking to land in Phase 6 |
| **D-10** reduced-motion snapshot ×4 | **RESOLVED at Phase 7** — usePrefersReducedMotion |
| **D-11** hover solved 3× in the design system | **RESOLVED at Phase 7** — six unused exports deleted, 471 lines. ADR-025 |

The earlier header read "3 resolved, 2 deliberate, 1 open", which never reconciled with the
entries below it. Corrected while D-01 was being closed.

Add an entry the moment one is found, before deciding what to do about it. A divergence that
is only recorded in a commit message is not recorded.

---

## D-01 — Two complete checkouts

**Type:** The Second Implementation (§13) · **Status:** **RESOLVED — 1 September 2026, P4-5**
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

## RESOLVED — the second checkout is deleted

The product decision was made on 1 September 2026, and it was the one §3 had already written
down: *"cart holds basket contents. It does not check out. There is exactly one checkout, in
`features/booking`, and the cart links to it."*

**Removed from `features/cart/components/CartPage.tsx`:** the nine-field form — first name, last
name, email, phone, street address, city, state, postcode, notes — the `alert()`, and the
`clearCart()` that followed it. 474 lines to 267.

**Not wired up. Deleted.** Wiring it would have produced a second checkout that works, which is
the same divergence with the bug removed. The cart now shows what is in the basket and links to
`/book`.

**Its 67 hardcoded design values were not converted to tokens — 43 of them went with the code.**
Converting literals inside a form that was about to be deleted was work with a negative return,
which is why P4-4 deliberately skipped it. 24 remain in the basket view that stays.

### The open gap this leaves, recorded rather than bridged

**`/book` cannot accept a multi-item basket.** It takes ONE configuration in its query string —
`type`, `size`, `op`, `qty`, `fabric`, `hw` — and re-validates it through `parseOrderConfig`.
There is no basket concept anywhere in the payment path.

So the cart's link carries nothing. A customer with three lines in the basket books a measure
and the three lines do not travel with them.

**Deliberately not bridged.** Mapping cart lines onto `/book`'s single-configuration URL would
mean inventing an encoding the server does not parse, or looping the customer through checkout
once per line. Both are a third implementation of the thing just deleted. **The cart line's own
`blindType` is a composite string** (`item.id:variant:colour:…`) built to make cart line ids
unique, and it is not a pricing `BlindType` — it would not validate if it were sent.

**This is a product and payment-path question, and it belongs to `feature:booking` in Phase 6**,
where the checkout is the thing being worked on. Logged here because a gap that is known and
deliberate is a different thing from one nobody has noticed, and only this log records which.

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

## D-07 — `MOTORISED_ADDON = 150`, two copies, one of them across the money boundary

**Type:** The Silent Divergence (§13) · **Status:** **RESOLVED — 1 Sep 2026**
**Found:** 1 Sep 2026, P4-5, while splitting `data/products.ts`

| Location | Consumers |
|---|---|
| `src/lib/pricing.ts:36` | **2** — `pricePerBlind` adds it for a motorised order, and `toPriceBreakdown` prints it as a line. This is the authority. |
| `src/data/products.ts` | **0** |

Two declarations of the same 150. `pricing.ts` does not import the other one; it declares its
own, and nothing anywhere imports the `products.ts` copy.

**It is harmless today and that is exactly what makes it worth logging.** The dead copy sits in
a file full of catalogue data, named like catalogue data, and reads as the place a price would
naturally be corrected. Someone raising the motorisation charge from 150 has better than even
odds of editing the one that changes nothing — and then the site quotes the old figure while the
constant says the new one.

**Found only because the file was being split.** A grep for consumers of `MOTORISED_ADDON`
returned `src/lib/pricing.ts` three times, which looks like an import and two uses. It is a
declaration and two uses.

**RESOLVED, and not deferred.** `data/products.ts` now re-exports `MOTORISED_ADDON` from
`lib/pricing.ts` — one line, one source. Deferring it to Phase 6 was the original plan and it
was the wrong call: a display price that can diverge from a charged price is a customer-facing
failure, not a code-quality one, and it does not wait for a phase. The shim disappears when
pricing moves to `shared-core` and this file is repointed with it.

**This is the seventh divergence, and the first found by the migration rather than by the
audit.** §13's test applies to it exactly: before asking who duplicated this, ask where the
single copy would have gone. Here the answer is not "nowhere legal" — `pricing.ts` was always
available and always correct. This one is a plain duplicate, which makes it the first entry in
this log that better structure alone would not have prevented.

---

## D-08 — Hover state, two implementations

**Type:** The Second Implementation (§13) · **Status:** OPEN — removal scheduled, Phase 7
**Found:** 1 Sep 2026, Phase 7 preparation, by asking whether a thing should exist before
renaming it

| Implementation | Sites |
|---|---:|
| `useHover()` — `design-system/primitives/useHover.ts`, returning `{ hover, bind }` | 8 files |
| `const [xHover, setXHover] = useState(false)` written out by hand | **10 sites across 6 files** |

`src/app/layouts/Nav.tsx` (2), `src/features/catalogue/components/ProductDetailPage.tsx` (4),
`src/app/routes/NotFoundPage.tsx`, `AboutPage.tsx`, `ContactPage.tsx`, `HowItWorksPage.tsx`.

**Found because of the rule Phase 7 was given: establish whether the thing should exist before
renaming it.** All ten were on the rename list — `ctaHover`, `quoteHover`, `cartHover`,
`barCartHover`, `barQuoteHover`, unprefixed booleans every one. Renaming them to `isCtaHovered`
would have produced ten correctly-named duplicates of a hook that already exists, and **a
well-named duplicate looks intentional.** `ctaHover` reads like an oversight; `isCtaHovered`
reads like a decision.

**The hook's own doc comment states the case against them:** *"Hover state plus the two
handlers, so a component that needs three hover targets doesn't declare three useStates by
hand."* `ProductDetailPage` declares four.

**Resolution: removed, not renamed.** Ten sites call `useHover()`; the rename list loses five
identifiers. Phase 7.

---

## D-09 — The form-field setter, two copies

**Type:** The Silent Divergence (§13) · **Status:** OPEN
**Found:** 1 Sep 2026, Phase 7 preparation

```ts
const set = (key: keyof typeof form) => (value: string) =>
  setForm((f) => ({ ...f, [key]: value }));
```

Character-identical in `src/features/marketing/components/ContactPage.tsx:51` and
`src/pages/BookInstallPage.tsx:86`. Both sit above a near-identical
`busy` / `fieldErrors` / `formError` state trio.

**Two forms, written independently, that reached the same correct answer** — which is D-03's
shape exactly, and D-03 is the entry that argued `shared-core` into existence.

**Not extracted yet, and the reason matters.** The two consumers are in different features, and
one of them — `BookInstallPage` — has not migrated: it moves to `features/booking` in Phase 6.
Extracting now would mean choosing a home for a helper whose second consumer is about to move,
which is the mistake D-04 was logged to avoid. **It waits for booking to land**, and then the
question is whether this is a `shared/hooks/useFormState` or two features legitimately having
small forms.

Logged now because the duplicate is known now.

---

## D-10 — The reduced-motion snapshot, four copies

**Type:** The Silent Divergence (§13) · **Status:** **RESOLVED — 1 Sep 2026, Phase 7**
**Found:** 1 Sep 2026, Phase 7 preparation

```ts
const [reduceMotion] = useState(prefersReducedMotion);
```

Character-identical in `Hero.tsx:77`, `StepsBar.tsx:197`, `Testimonials.tsx:136` and
`TrustTicker.tsx:95` — the four homepage sections that animate.

**All four correct, all four identical, none aware of the others.** §13 in one line: *"Both
correct when written, one updated six months later."* The six-months-later change here is
obvious once named — swapping the snapshot for a live subscription so a marquee stops when the
visitor changes an OS setting mid-session. Done in three of four files, the homepage would have
had two motion policies and no error anywhere.

**Resolved: `design-system/primitives/usePrefersReducedMotion`.** Four call sites.

**Two things decided while extracting it, both recorded in the hook.**

**It is not in `shared/`.** §2 lets `shared` import config and other shared, not the design
system — and the query string it needs is `prefersReducedMotion` in `tokens/motion.ts`. A shared
version would have had to inline that string a second time, so a hook extracted to remove a
duplication would have created one. The design system may import itself, so it sits beside
`useHover`.

**It stays a snapshot.** `shared/hooks/useMediaQuery` already exists and would give live updates,
which is arguably the better behaviour. That is a behaviour change, and Phase 7 is a naming and
de-duplication pass — an extraction that quietly alters what the page does is not an extraction.
**Left as its own decision, with the argument written where someone will find it.**

---

## D-11 — The hover problem has THREE solutions in the design system, and the unused one was built for it

**Type:** The Second Implementation (§13) · **Status:** **RESOLVED — 1 Sep 2026, Phase 7**
**Found:** 1 Sep 2026, Phase 7, while removing D-08

Inline styles cannot express `:hover`, so every interactive element holds a hover boolean. The
design system solves this **three times**:

| Solution | In-scope consumers |
|---|---:|
| `useHover()` | **12 files** |
| `CtaButton` / `CtaLink` — the hook wrapped in a button | 2 and 4 |
| **`primitives/Button.tsx`** | **0** |

`Button.tsx` was built for exactly this. Its own header says so:

> *"WHY THIS TRACKS HOVER IN REACT STATE … every interactive element has to hold its own hover
> boolean. That is a consequence of ADR-003 and it is the single largest source of
> boolean-naming findings in the lint baseline — fourteen `*Hover` variables across the
> codebase, each one a component re-solving this. **Solving it once here is most of why this
> primitive exists.**"*

**It was never adopted.** The fourteen `*Hover` variables it names went on existing until Phase 7
deleted ten of them (D-08) — and they were replaced with `useHover`, not with `Button`. A
primitive written to end a duplication, which the duplication then outlived.

### And it is not alone

Checked while confirming the above. Of the six original design-system primitives, **five have
zero in-scope consumers**: `Box`, `Stack`, `Text`, `Heading`, `Button`. Only `Field` is used, by
one file. `SectionHead` — moved into `patterns/` at P4-6 — also has none; its single mention is a
comment in `Hero` explaining that the h1 is written out *rather than* going through it.

That is §13's **Polished Stub** at the layer level: *"Code that looks finished, has no TODO,
throws no error, and does nothing."*

### RESOLVED — deleted, and the specification amended so it cannot recur

**All six are gone**: `Box`, `Stack`, `Text`, `Heading`, `Button`, `SectionHead`. 471 lines.

**And ADR-025 fixes the cause rather than the instance.** The reading below was resolved in
favour of DESCRIPTIVE, and §3 and §9 were amended: primitives are extracted from observed
duplication, never created from a target tree, and a thin primitives folder is a healthy state.
The owner recorded the original §3 list as his own error in writing it.

The two readings, kept because the reasoning is why the answer is not obvious:

**Deleting six exports from the design system is a decision about what the design system is
for**, and it is above a naming pass. There are two defensible readings and the log should not
pick one:

1. **Descriptive** — the design system records what the codebase uses. Then five unused
   primitives are dead code, and they go.
2. **Aspirational** — it is the vocabulary the codebase should converge on. Then the finding is
   not that `Button` is unused but that six components should be using it, and deleting it
   removes the target.

**The evidence leans to (1), and it is worth stating.** `useHover`, `CtaButton` and `CtaLink`
were extracted from real duplication and were adopted immediately. `Box`, `Stack`, `Text`,
`Heading` and `Button` were written ahead of demand and have not been adopted in any phase since.
That is the difference between extracting a primitive and proposing one.

**Scheduled for the `knip` baseline at Phase 6.3**, which is where unused exports get their
number. Flagged to V now because a naming pass is where it surfaced and the reason would be lost
by then.

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
