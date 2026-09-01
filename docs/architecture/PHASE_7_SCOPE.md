# PHASE 7 SCOPE — THE NAMING PASS

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

## 1. **THE `hover` CLUSTER — 26 findings across 11 files. Do this one first.**

**It is one rename, not twenty-six.** `useHover` returns `{ hover, bind }`, and every consumer
destructures `hover` — a boolean without an `is` prefix. Rename the property once in
`design-system/primitives/useHover.ts` and the call sites follow mechanically.

```
design-system/primitives/useHover.ts     the definition
  -> 11 files across ds/primitives, features/home, features/catalogue
```

**`hover` is also a parameter name in `ctaFill(variant, hover)`** — same rename, same commit,
because a reader tracing the value through both should not meet two names for it.

**Suggested:** `isHovered`. Not `isHover`: §6 wants a predicate that reads as a state, and the
`bind` handlers set it from mouse enter/leave.

**The related cluster goes with it** — same shape, same commit is acceptable **only** if the
diff stays readable, otherwise one commit each:

| Identifier | Files |
|---|---:|
| `ctaHover` | 5 |
| `cartHover` | 2 |
| `quoteHover`, `barCartHover`, `barQuoteHover` | 1 each |

These are local `useState` booleans named for what they track, in components that predate
`useHover`. **Several of them should not be renamed but deleted** — a component holding
`ctaHover` by hand is a component that could be calling `useHover`. Check before renaming; a
rename that preserves a duplication is the wrong fix.

## 2. The remaining boolean clusters — 39 findings

| Identifier | Files | Note |
|---|---:|---|
| `reduceMotion` | 4 | `prefersReducedMotion` already exists as a token export; this is the local. Pick one name |
| `fourUp`, `stacked`, `wideRow`, `narrow` | 2, 2, 1, 1 | Layout-mode booleans. `isFourUp`, `isStacked`, … |
| `open`, `menuOpen`, `drawerOpen`, `closing`, `collapsed`, `compressed` | 1–2 each | Nav and drawer state. **`compressed` is the one from decision A** — the nav padding flag, and its behaviour question is recorded in MIGRATION_MAP §0.1 |
| `turnstileEnabled` | 2 | `useTurnstileEnabled` returns it; rename at the hook, like `hover` |
| `external`, `alwaysSolid`, `solidBar`, `onDarkGround`, `glyphOnLight`, `centred`, `focused`, `synced`, `addedToCart`, `showSortDropdown`, `dead` | 1 each | Ordinary locals |

**`dead` is worth a look rather than a prefix.** A boolean called `dead` in a codebase that has
just spent six phases finding dead code is either badly named or pointing at something.

---

## 3. Verb families and abbreviations — deferred from Phase 0, never actioned

MIGRATION_MAP §0.5 recorded two more naming findings at baseline that no phase has touched:

- **Five verb families use synonyms.** §6: *"Pick one verb per concept and never synonyms. If
  network retrieval is `fetch`, there is no `get`, no `load`, no `retrieve`. Synonyms make a
  codebase unsearchable."*
- **Abbreviations outside the permitted list.** §6 permits `id`, `url`, `api`, `ref`, `src`,
  `px`, `db`, `ui`, `cta`; not `cfg`, `btn`, `msg`, `res`, `req`, `tmp`, `val`, `idx`.

Neither is machine-enforced today. **Both want a rule before they want a rename** — otherwise
the pass is done by eye, cannot be measured, and regresses. Under ADR-022 any such rule needs a
fixture proving it fires before its count means anything.

---

## 4. The `visualiser`/`visualizer` split is NOT in this phase

E-07 and ADR-013. The two spellings live in out-of-scope code (E-08), which may not be edited for
any reason. It travels with the visualiser's own migration.

---

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
