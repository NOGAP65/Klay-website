# PHASE 7 SCOPE — THE NAMING PASS

> **EXECUTED 1 September 2026.** naming-convention 65 -> 0 in-scope,
> no-banned-abbreviations 1 -> 0, one-verb-per-concept holding at 1 as an accepted
> exemption. Three of the four commits were REMOVALS. The inventory below is kept
> as the record of what was decided and why; results are in LINT_BASELINE.md.
>
> **Still open:** D-11 — five design-system primitives with no consumer, and a
> Button written to end the hover duplication that the duplication outlived.
> A decision above a naming pass; scheduled for the knip baseline at Phase 6.3.

**Renames, as their own reviewed commits, after the structure has stopped moving.**

**Why it is a phase and not a chore.** ADR-018 exists because a scripted rename in Phase 2.3
rewrote a comment into confident misinformation. §11 records the rule that came out of it:

> **AUTOMATED RENAMES DO NOT TOUCH COMMENTS.** A scripted substitution operates on code only.
> Comments referencing a renamed identifier get a separate, reviewed pass.

A rename inside a move phase is unreviewable: the diff is already full of files changing paths,
and a substitution buried in it gets read as part of the move. So renames were deferred every
time they came up during Phases 4–6, and this is where they land. **Phase 7 exists to keep
ADR-018 intact**, not to tidy up afterwards.

**Entry condition:** Phase 6 closed. Structure is final; nothing is moving paths any more.

**Gate:** `npm run typecheck`, `npm run check:scope` (the rule's in-scope count falls and nothing
else rises), `npm run verify:rules`, and a deploy preview.

---

## The rule this phase clears

`@typescript-eslint/naming-convention` — **65 in-scope findings.** §6:

> **Boolean** — `is`/`has`/`can`/`should` prefix — `isSubmitting`, `hasValidPhoto`

It has been flat at 65–66 since the Phase 1.2 baseline, through every phase, and every phase
recorded the same sentence: *"it is a rename, and renames do not happen inside move phases."*

---

## The seeded list has been REPLACED by the measured inventory below

This section used to carry a hand-written cluster list assembled while Phases 4-6 were running.
It has been deleted rather than kept beside the inventory, because two lists of the same thing in
one document is the divergence this project keeps finding in code — and a stale one in a scope
document is worse, since it is what someone plans from.

**The inventory below is measured, not remembered:** `node tools/lint-scope.mjs --cluster <rule>`,
against the in-scope definition ADR-023 gives. Two things changed when it was measured properly.
The hover cluster is 14 findings for `hover` itself plus 10 hand-rolled duplicates, not 26 of one
kind. And the verb-family and abbreviation work turned out to be two identifiers rather than a
programme, because 62 of those 64 findings are inside E-08.

---

## The `visualiser`/`visualizer` split is NOT in this phase

E-07 and ADR-013. The two spellings live in out-of-scope code (E-08), which may not be edited for
any reason. It travels with the visualiser's own migration.


---

# THE RULE THAT COMES BEFORE ANY RENAME

> **Establish whether the thing should exist before renaming it. Anything that turns out to be a
> duplicate goes to `DIVERGENCE_LOG.md` and is REMOVED, not renamed.**

**Because a well-named duplicate looks intentional and gets harder to find.** `ctaHover` reads as
an oversight. `isCtaHovered` reads as a decision — correctly named, §6-compliant, invisible to
review, and still the tenth hand-rolled copy of a hook that already exists.

A naming pass is the last time anyone will look at these identifiers one at a time. **Spending
that attention on spelling and not on existence wastes the only pass they get**, and leaves the
codebase measurably cleaner by the lint count and no better at all.

**It found two divergences on its first application** — D-08 and D-09 below, neither of which
any lint rule reports, both sitting on the rename list.

Every row of the inventory therefore carries a verdict before it carries a new name:

| Verdict | Meaning |
|---|---|
| **REMOVE** | It duplicates something. Log it, delete it, do not rename it |
| **RENAME** | It should exist and it is misnamed |
| **RENAME + REVIEW** | It should exist, but the name is wrong about more than its prefix |
| **EXEMPT** | The rule is wrong here. Record why, in the file |

---

# THE RENAME INVENTORY

**67 in-scope findings, 41 distinct identifiers, across three rules.** Measured with
`node tools/lint-scope.mjs --cluster <rule>`.

> **This is the inventory AS PLANNED, kept as the record of what was decided before anything was
> touched.** It has been executed. Two verdicts changed on contact with the code and both are
> marked below — `stacked` was not renamed apart, and `reduceMotion` became `shouldReduceMotion`
> once D-10 gave it a hook. Results in LINT_BASELINE.md.

## REMOVE — 11 findings, 5 identifiers. Do these first; they shrink everything below.

| Identifier | Sites | Verdict |
|---|---:|---|
| `ctaHover` | 5 files | **D-08.** Hand-rolled `useState(false)` beside `useHover()`, which 8 other files already use |
| `quoteHover`, `cartHover`, `barCartHover`, `barQuoteHover` | 6 sites, 2 files | **D-08.** Same. `ProductDetailPage` declares four of them; `useHover`'s own doc comment says it exists so that a component needing three hover targets does not do this |

**Ten sites become `useHover()` calls. Five identifiers leave the rename list by being deleted.**

## RENAME — 24 identifiers. Ordinary unprefixed booleans, §6.

**One rename, not fourteen: `hover` → `isHovered`.** It is the property `useHover` returns and
the parameter `ctaFill(variant, hover)` takes. Rename it at the definition and the eleven
consumers follow mechanically. **Do this AFTER the REMOVE block**, or ten of the call sites you
are about to touch will not exist yet.

| Identifier | Files | Suggested |
|---|---:|---|
| `hover` | 11 | `isHovered` — one rename at `useHover.ts` + `cta.ts` |
| `reduceMotion` | 4 | `prefersReducedMotion` is already the token's name; the local should not disagree with it. **See REVIEW** |
| `turnstileEnabled` | 2 | `isTurnstileEnabled` — rename at `useTurnstileEnabled`, two call sites follow |
| `fourUp` | 2 | `isFourUp` |
| `open`, `menuOpen`, `drawerOpen`, `collapsed`, `closing` | 5 | `isOpen`, `isMenuOpen`, `isDrawerOpen`, `isCollapsed`, `isClosing` |
| `compressed`, `alwaysSolid`, `solidBar`, `onDarkGround` | 4 | Nav's own state. `isCompressed`, `isAlwaysSolid`, `isSolidBar`, `isOnDarkGround` |
| `active` | 2 | `isActive` |
| `external`, `centred`, `focused`, `synced`, `narrow`, `ready`, `paused`, `busy`, `submitted`, `hot`, `wideRow`, `glyphOnLight`, `showSortDropdown`, `addedToCart`, `quoteSent`, `follows`, `onItsOwn` | 1 each | `is`/`has`/`should` prefix as appropriate |

## RENAME + REVIEW — 4 identifiers. The name is wrong about more than its prefix.

| Identifier | Where | Why it needs more than a prefix |
|---|---|---|
| `dead` | `FilterRail.tsx:102` | `count === 0 && state === 'off'` — the option cannot combine with what is ticked. **`dead` does not say that.** `isUnavailable` or `isUncombinable`. Phase 4-5 flagged this: a boolean called `dead` in a codebase that just spent six phases finding dead code is either badly named or pointing at something. It is badly named |
| `stacked` | `RangeRow.tsx:804`, `RecommendationBanner.tsx:85` | ~~Rename them apart, or one will be assumed to imply the other.~~ **REVERSED ON EXECUTION.** They are local flags in separate modules, neither is passed between them, and both genuinely mean stacked at their own breakpoint. Renaming them apart would have made the code claim a distinction it does not have. Both became `isStacked` |
| `reduceMotion` | 4 files | Each is `useState(prefersReducedMotion)` — the same four-line snapshot of the same token in four files. Not a divergence (all four are identical and correct), but a `usePrefersReducedMotion` hook is the obvious home. **Decide before renaming four copies** |
| `onItsOwn`, `follows` | `VisualiserShowcase.tsx:250-251` | Layout booleans whose names describe prose rather than state. Prefixing gives `isOnItsOwn` / `isFollows`, and the second is not English. Needs a real name |

## EXEMPT — 2 findings. The rule is wrong here, and that is a finding about the rule.

| Finding | Rule | Why exempt |
|---|---|---|
| `matches` in `useMediaQuery.ts:21` | naming-convention | It mirrors `window.matchMedia(q).matches` — the Web API's own word. §5: *"Code interfacing with a Web or library API uses that API's spelling."* Renaming it to `isMatching` makes the hook disagree with the thing it wraps |
| `loadScript` in `Turnstile.tsx:45` | `klay/one-verb-per-concept` | **A false positive in a rule I wrote this phase.** §6's verb rule is about NETWORK RETRIEVAL — *"if network retrieval is `fetch`, there is no `get`, no `load`"*. This injects a `<script>` element; `loadScript` is the idiomatic name and `fetchScript` would be wrong. Either add an exemption or narrow the family. **Recorded rather than quietly renamed to satisfy my own rule** |

## The abbreviation rule's single in-scope finding

| Finding | Verdict |
|---|---|
| `opts` — `configOptions.ts:210` | **RENAME** → `options`. §6: everything not on the permitted list is spelled out |

`specRows` and `params` were considered and are **not** flagged: `spec` is product-specification
domain vocabulary, and `params` is `URLSearchParams`' own word. Both were deliberately left off
the banned list — a rule that guessed at "looks abbreviated" would flag them, and a rule with
false positives gets switched off.

---

# BASELINE — the two new rules, recorded before any rename

| Rule | In-scope | Out-of-scope (E-08) | Fires? |
|---|---:|---:|---|
| `klay/no-banned-abbreviations` | **1** | 44 | YES — `tools/rule-fixtures/banned-abbreviations.ts` |
| `klay/one-verb-per-concept` | **1** | 18 | YES — `tools/rule-fixtures/verb-synonyms.ts` |
| `@typescript-eslint/naming-convention` | **65** | 63 | YES |

**Both new rules were written and proven to fire BEFORE any rename** — ADR-022, and the reason
the order matters: a rule introduced after a cleanup has no baseline to have moved, so the
cleanup cannot be shown to have worked.

**And the baselines confirm what Phase 0 predicted rather than contradicting it.** §0.5 measured
these two problems across the whole codebase and concluded the genuine violations *"sit largely
in the frozen zone"*. They do: 62 of the 64 findings are inside E-08, permanently out of scope.

**So Phase 7's abbreviation and verb work is two identifiers, one of which is my own rule's false
positive.** That is a real result and not an anticlimax — it means the in-scope codebase was
already close to §6 on those two points, and the rules now hold it there. Their value is
preventing regression, not cleaning up. **ADR-020's consequences log records that these counts
jump by 62 the day E-08 retires.**

---

## The tool

**`tools/codemod.mjs`.** Written after this phase, from what it got wrong twice — a
line-preserving comment mask, and typechecking per rename with an automatic revert of any that
breaks. `docs/runbooks/verifying-source-transforms.md` is the reasoning. **The next naming pass
starts from that tool, not from a fresh script.**

## How a Phase 7 commit is shaped

**One concept per commit.** `hover` → `isHovered` is one commit across eleven files; it is not
eleven commits, and it is not one commit with `reduceMotion` in it too.

**The code substitution and the comment pass are separate steps in that commit, and the second
is done by reading — ADR-018.** After the scripted half:

```
git diff -U0 | grep -E '^\+' | grep -E '^\+\s*(//|\*|/\*)' | grep '<new-identifier>'
```

Any output is a comment the rename touched. Review each one. **Where a comment is *about* the old
name — describing history, or what other code does — leave the old name and add the new one
rather than replacing it.**

**And check nothing was silently un-suppressed:**

```
git diff | grep -E '^-.*(eslint-disable|ts-expect-error|ts-ignore)'
```

**Record the count before and after in LINT_BASELINE.md.** The rule is at 65 in-scope. It may go
down. It may not go up.
