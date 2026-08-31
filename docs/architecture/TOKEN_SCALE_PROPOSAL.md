# TOKEN SCALE PROPOSAL — Phase 2.3

**Status: PROPOSAL. Nothing here has been applied.**
**Date:** 31 August 2026
**Decides:** SPECIFICATION.md §9 — "The scale is proportional and **closed** — six to eight
steps of spacing, six to eight of type."

The work order for this step is explicit: *"Propose only. Do not apply. I decide the scale;
you apply it afterwards."* No source file was changed by this document.

---

## What is actually there

Measured against the current tree, **excluding the frozen visualiser**, and excluding `0` and
`1` — a zero is a reset and a one is a hairline border; neither is a scale step, and including
them would have buried the real distribution under 303 occurrences of nothing.

| | Distinct values | Occurrences | Frozen (excluded) |
|---|---:|---:|---:|
| **Spacing** | 34 | 303 | 6 distinct / 12 occ |
| **Font size** | 18 | 134 | 2 distinct / 4 occ |

### Spacing, by frequency

| Value | Count | Cum. % | | Value | Count | Cum. % |
|---:|---:|---:|---|---:|---:|---:|
| **16** | 36 | 11.9 | | 10 | 10 | 83.2 |
| **12** | 33 | 22.8 | | 22 | 8 | 85.8 |
| **24** | 27 | 31.7 | | 4 | 6 | 87.8 |
| **20** | 26 | 40.3 | | 48 | 4 | 89.1 |
| **8** | 21 | 47.2 | | 32 | 4 | 90.4 |
| **80** | 20 | 53.8 | | 15 | 3 | 91.4 |
| **14** | 17 | 59.4 | | 64 | 3 | 92.4 |
| **6** | 16 | 64.7 | | 56 | 3 | 93.4 |
| **18** | 13 | 69.0 | | 34, 180, 160, 140, 44, 7 | 2 each | 97.4 |
| **120** | 11 | 72.6 | | 36, 17, 200, 2, 72, 90, 13, 26 | 1 each | 100.0 |
| **40** | 11 | 76.2 | | | | |
| **28** | 11 | 79.9 | | | | |

**The current scale does not describe this codebase.** `theme.ts` offers
4 · 8 · 12 · 20 · 32 · 52 · 84 · 136, and of those eight, `52`, `84` and `136` have **zero**
occurrences in real spacing. Meanwhile the two most-used values on the site — `16` (36) and
`24` (27) — are not on the scale at all. That is the mechanism behind Phase 0's finding that
no file under `src/pages/` references `space.*` even once: the ladder did not have the rungs
people needed, so they stopped climbing it.

### Font size, by frequency

| Value | Count | | Value | Count |
|---:|---:|---|---:|---:|
| **11** | 28 | | 24 | 4 |
| **13** | 24 | | 32 | 3 |
| **14** | 23 | | 34, 18 | 2 each |
| **12** | 16 | | 30, 56, 22, 28, 120, 160 | 1 each |
| 10, 20, 15 | 7 each | | | |
| 16 | 5 | | | |

---

## How the candidates were scored

For each candidate scale, every existing value is mapped to its nearest step:

- **exact %** — share of *occurrences* that land on a step with no change at all. Higher is
  better; it is the proportion of the codebase that needs no visual adjustment.
- **avg drift** — mean pixels moved per occurrence. Lower is better.
- **worst** — the largest single move, which is where a layout is most likely to visibly break.

## Spacing candidates

| Scale | exact % | avg drift | worst move |
|---|---:|---:|---|
| CURRENT — 4·8·12·20·32·52·84·136 | 29.7 | 3.65 | 64px (200→136) |
| A — 4·8·12·16·24·32·48·80 | 49.8 | 5.02 | 120px (200→80) |
| **F — 4·8·12·16·24·40·80·120** | **54.5** | **2.67** | **80px (200→120)** |
| G — 4·8·12·16·24·40·64·120 | 48.8 | 3.54 | 80px (200→120) |
| H — 4·8·12·16·24·48·80·120 | 52.1 | 2.83 | 80px (200→120) |
| J (7 steps) — 4·8·12·16·24·40·80 | 50.8 | 5.05 | 120px (200→80) |
| K — 4·8·12·16·24·40·80·160 | 51.5 | 3.46 | 40px (120→80) |

### Recommendation: **F — 4 · 8 · 12 · 16 · 24 · 40 · 80 · 120**

Best on both measures that matter: highest exact-match share (54.5%, nearly double the current
scale) and lowest average drift (2.67px). Eight steps, the ceiling §9 allows.

**Why it beats the elegant one.** The current scale is Fibonacci-derived and converges on φ,
which is a lovely property and the reason nobody used it. F is not derived from a constant; it
is derived from what the site actually does, and it still has a defensible shape — the ratios
run 2 · 1.5 · 1.33 · 1.5 · 1.67 · 2 · 1.5, tightening in the middle where fine control matters
and opening at the ends where it does not.

**What it costs.** 45.5% of occurrences move, most by 2–4px. Six values move by 8px or more:
`32→24` (4 occ), `48→40` (4), `56→40` (3), `64→80` (3), and the section paddings `140/160/180/
200 → 120` (7 between them).

### The one thing to decide before applying F

**The values above 96px are not spacing — they are section rhythm.** `80` (20 occ), `120`
(11), `140`, `160`, `180`, `200` are page-section padding, and they are the source of every
large drift in the table. Two ways to handle that, and this is a genuine choice:

1. **Keep them in `space`,** as F does. Simple, one ladder, and `200→120` is a 40% reduction
   in the padding of whichever section uses it — visible, and someone should look at it.
2. **Move them to `layout`,** which already exists and already owns `sectionPad`,
   `sectionPadFocal` and `inlinePad` — all three of which currently have **zero consumers**.
   `space` then tops out at 40 or 48 and covers only within-component spacing, where its exact
   match would rise above 70%.

**I would take option 2**, because it makes `space` honest about what it is for and gives
`layout`'s three unused functions the job they were written for. But it changes the shape of
the proposal, so it is yours.

---

## Type candidates

| Scale | exact % | avg drift | worst move |
|---|---:|---:|---|
| CURRENT roles — 10·12·15·17·26·32·116 | 24.6 | 1.46 | 44px (160→116) |
| **T1 — 11·13·15·20·26·34·56** | **51.5** | 1.83 | 104px (160→56) |
| T2 — 10·12·14·16·20·26·34 | 44.8 | 2.38 | 126px (160→34) |
| T3 (8 steps) — 10·12·14·16·20·26·34·56 | 45.5 | 1.89 | 104px (160→56) |
| T4 (6 steps) — 11·14·17·22·30·44 | 39.6 | 2.26 | 116px (160→44) |

### Recommendation: **T3 — 10 · 12 · 14 · 16 · 20 · 26 · 34 · 56**, with a caveat

T1 scores better on exact match (51.5% vs 45.5%) and it is worth saying why I am not
recommending it: **T1's top three steps are 11, 13 and 15.** Those are the three most-used
sizes today, and a scale built on them is not a scale — it is the current inconsistency
written down and blessed. Three steps one pixel apart cannot express a hierarchy; a reader
cannot tell 13 from 14, so the distinction does nothing except make the scale unfalsifiable.

T3 uses even steps with legible ratios (1.2 · 1.17 · 1.14 · 1.25 · 1.3 · 1.31 · 1.65) and
costs 6 percentage points of exact match to get there. Almost all of that cost is `11→10` (28
occ) and `13→12` (24 occ) — **1px moves on small UI labels**, which is the cheapest kind of
change this table contains.

### Two outliers to name explicitly

`120px` and `160px` are one occurrence each — the How It Works step numeral and the 404
numeral. **They are display ornament, not body hierarchy**, and forcing them onto a text scale
(T3 sends both to 56) would be wrong. `type.ornament` already exists for exactly this and has
zero consumers. Recommend they become `type.ornament` and `type.display` rather than scale
steps.

---

## Full mapping — spacing candidate F

| Existing | → step | Occurrences | Drift |
|---:|---:|---:|---:|
| 2 | 4 | 1 | +2 |
| **4** | **4** | **6** | — |
| 6 | 4 | 16 | −2 |
| 7 | 8 | 2 | +1 |
| **8** | **8** | **21** | — |
| 10 | 8 | 10 | −2 |
| **12** | **12** | **33** | — |
| 13 | 12 | 1 | −1 |
| 14 | 12 | 17 | −2 |
| 15 | 16 | 3 | +1 |
| **16** | **16** | **36** | — |
| 17 | 16 | 1 | −1 |
| 18 | 16 | 13 | −2 |
| 20 | 16 | 26 | −4 |
| 22 | 24 | 8 | +2 |
| **24** | **24** | **27** | — |
| 26 | 24 | 1 | −2 |
| 28 | 24 | 11 | −4 |
| 32 | 24 | 4 | −8 |
| 34 | 40 | 2 | +6 |
| 36 | 40 | 1 | +4 |
| **40** | **40** | **11** | — |
| 44 | 40 | 2 | −4 |
| 48 | 40 | 4 | −8 |
| 56 | 40 | 3 | −16 |
| 64 | 80 | 3 | +16 |
| 72 | 80 | 1 | +8 |
| **80** | **80** | **20** | — |
| 90 | 80 | 1 | −10 |
| **120** | **120** | **11** | — |
| 140 | 120 | 2 | −20 |
| 160 | 120 | 2 | −40 |
| 180 | 120 | 2 | −60 |
| 200 | 120 | 1 | −80 |

**165 of 303 occurrences (54.5%) do not move.**

## Full mapping — type candidate T3

| Existing | → step | Occurrences | Drift |
|---:|---:|---:|---:|
| **10** | **10** | **7** | — |
| 11 | 10 | 28 | −1 |
| **12** | **12** | **16** | — |
| 13 | 12 | 24 | −1 |
| **14** | **14** | **23** | — |
| 15 | 14 | 7 | −1 |
| **16** | **16** | **5** | — |
| 18 | 16 | 2 | −2 |
| **20** | **20** | **7** | — |
| 22 | 20 | 1 | −2 |
| 24 | 26 | 4 | +2 |
| 28 | 26 | 1 | −2 |
| 30 | 26 | 1 | −4 |
| 32 | 34 | 3 | +2 |
| **34** | **34** | **2** | — |
| **56** | **56** | **1** | — |
| 120 | *ornament* | 1 | — (see caveat) |
| 160 | *display* | 1 | — (see caveat) |

**61 of 134 occurrences (45.5%) do not move**, and 59 of the 73 that do move by exactly 1px.

---

## Naming, which is the other half of §9

§9 requires role names, not value names: `space.sectionGap`, not `space.px64`. The current
scale is named in t-shirt sizes — `space.md`, `space.xl` — which is neither. A t-shirt size
does not say what a step is *for*, which is why the ladder can grow a ninth rung without
anyone noticing.

Proposed role names, contingent on the scale being agreed:

| Step (F) | Role name | What it is for |
|---:|---|---|
| 4 | `space.hairline` | Icon-to-label, hairline offsets |
| 8 | `space.tight` | A label and the number under it |
| 12 | `space.snug` | Within a row of controls |
| 16 | `space.item` | **Between related elements — the default** |
| 24 | `space.group` | A group's internal block rhythm |
| 40 | `space.section` | Between groups |
| 80 | `space.band` | Standard section padding |
| 120 | `space.focal` | The two focal sections only |

The 2.5× between-group to within-group ratio the current file argues for
(`space.item` 16 → `space.section` 40) is preserved at exactly 2.5.

**Not proposed here:** whether the type scale takes role names
(`type.label` / `type.body` / `type.heading`) or keeps the nine existing role names it already
has. The type scale's names are already roles — `micro`, `label`, `body`, `lead`, `card`,
`numeric`, `section`, `hero`, `ornament` — and are not the problem. Only the *sizes* behind
them are.

---

## What applying this would involve, once decided

1. Rewrite `design-system/tokens/space.ts` and `type.ts` with the agreed steps and names.
2. Keep the old names as `@deprecated` aliases pointing at the nearest new step — the frozen
   visualiser has 12 spacing and 4 font-size occurrences that cannot be touched until P4-7.
3. Repoint the movable call sites, one commit per token group, never mixed with a file move.
4. Expect `klay/no-hardcoded-style-values` to fall from 295 as literals become tokens; that
   number is the measure of whether this worked.

**Do not apply any of it until the scale is agreed.** A scale applied and then revised costs
twice, and the second pass lands on files that have since moved.
