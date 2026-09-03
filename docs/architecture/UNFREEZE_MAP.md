# UNFREEZE MAP — Phase 0

**Date:** 3 September 2026 · **Status:** survey only. **Nothing has been moved.**

The zone is unfrozen. E-08, E-09, E-10 and E-11 are retired from both halves of the register;
`npm run check:exceptions` and `npm run verify:scope-guard` both pass against the new set, and
`inScopeFiles()` went from **86 files to 131**.

**The in-scope lint count went from 245 to 723.** That is not a regression — it is the same
codebase, measured honestly for the first time. Every baseline recorded before today used a set
two-thirds this size and is not comparable to one recorded after it.

---

## 0. THE PROTECTED IP FILES — REVIEW TRIGGER FIRED, NOTHING CHANGED INSIDE THEM

E-01 to E-04 carry a review trigger: *the file is modified for any reason, or the visualiser
migrates.* **The second fired today.** Examined, and **content hashes recorded before any work
began**:

| Exception | File | Lines | `git hash-object` | Contents changed? |
|---|---|---:|---|---|
| E-01 | `homography.ts` | 82 | `3e3b09ba5923…` | **No** |
| E-02 | `Canvas2DBlindRenderer.tsx` | 3,496 | `83e374524265…` | **No** |
| E-03 | `CornerPinOverlay.tsx` | 339 | `85acfd9455b9…` | **No** |
| E-04 | `usePhotoUpload.ts` | 141 | `10ad209e5b83…` | **No** |

**All four exemptions stand and remain permanent.** The review confirms the reasoning still
holds: `homography.ts` is 82 lines of projective geometry where splitting risks correctness, and
`Canvas2DBlindRenderer.tsx` is a 3,496-line rendering pipeline whose size is the thing E-02
exempts.

**What changes for them is only what E-08 was separately preventing:** they may now be *moved* and
have their *imports rewritten*. Re-verify these hashes after every commit that touches the zone —
a move must leave all four byte-identical.

---

## 1. EVERY FILE IN THE ZONE

### `src/visualiser/` — 21 files, 15,916 lines

| File | Lines | What it does | Proposed target | §8 |
|---|---:|---|---|---|
| `Canvas2DBlindRenderer.tsx` | 3,496 | Draws blinds and curtains onto the traced window with a homography warp | `features/visualiser/rendering/blind/` | **E-02 exempt** |
| `Canvas2DCurtainRenderer.tsx` | 2,051 | Three.js wave-fold curtain renderer — the live curtain path | `features/visualiser/rendering/curtain/` | **OVER (2,051)** |
| `KlayConfigurator.tsx` | 1,582 | The whole tool: photo upload, corner-pin, category tabs, render surface | `features/visualiser/components/` | **OVER (1,582)** |
| `Canvas2DWardrobeRenderer.tsx` | 1,533 | Draws a wardrobe into a traced opening | `features/visualiser/rendering/wardrobe/` | **OVER (1,533)** |
| `VisualiserControls.tsx` | 976 | The control panel — type, colour, hardware, size, operation | `features/visualiser/components/` | **OVER (976)** |
| `wardrobeScene.ts` | 763 | Builds the 3D wardrobe scene graph | `features/visualiser/rendering/wardrobe/` | **OVER (763)** |
| `wardrobeGeometry.ts` | 715 | Carcass, shelves, rails and dividers as geometry | `features/visualiser/rendering/wardrobe/` | **OVER (715)** |
| `wardrobes.ts` | 676 | The Forma model table, colours, and asset resolution | `features/visualiser/wardrobe/` — **see §3** | **OVER (676)** |
| `useVisualiserStore.ts` | 534 | The zustand store: category, colours, hardware, traced windows | `features/visualiser/store/` | **OVER (534)** |
| `wardrobeComposite.ts` | 523 | Composites artwork cut-outs onto the modelled carcass | `features/visualiser/rendering/wardrobe/` | **OVER (523)** |
| `WardrobeRoomRenderer.tsx` | 405 | Renders a wardrobe into a room photograph | `features/visualiser/rendering/wardrobe/` | **OVER (405)** |
| `CornerPinOverlay.tsx` | 339 | The four-corner drag overlay for tracing a window | `features/visualiser/tracing/` | **E-03 exempt** |
| `whiteBoardTexture.ts` | 278 | Generates the white melamine board texture | `features/visualiser/rendering/wardrobe/` | ok |
| `Wardrobe3D.tsx` | 260 | The React wrapper around the 3D wardrobe scene | `features/visualiser/components/` | ok |
| `wardrobeSlices.ts` | 244 | Slices artwork so fixed-width modules do not stretch | `features/visualiser/rendering/wardrobe/` | ok |
| `WallColourChip.tsx` | 206 | Wall-colour swatch control | `features/visualiser/components/` | ok |
| `wardrobeCutouts.ts` | 160 | **Names cut-out files literally** — see §3 | `features/visualiser/wardrobe/` | ok |
| `usePhotoUpload.ts` | 141 | Reads, orients and downscales the customer's photograph | `features/visualiser/photo/` | **E-04 exempt** |
| `wallColours.ts` | 93 | The wall colour table | `features/visualiser/wardrobe/` | ok |
| `homography.ts` | 82 | Four-point projective transform — the maths under the warp | `features/visualiser/tracing/` | **E-01 exempt** |
| `wardrobeHardware.ts` | 79 | Handle and hardware options | `features/visualiser/wardrobe/` | ok |

**Ten files exceed §8's 300-line error limit and are not exempt.** That is the single largest
body of size debt in the codebase and it is why §3's target tree already anticipated
`rendering/blind/`, `rendering/curtain/` and `rendering/shared/`.

### `src/visualiser-lab/` — 18 files, 12,788 lines

**Proposed target: deletion. See §2.**

---

## 2. THE WARDROBE QUESTION — **RECOMMENDATION: DELETE `visualiser-lab/`**

**It is neither a fork to merge nor a feature to promote. It is a stale copy, and the reconciliation already happened.**

Every one of its 18 files was diffed against its live counterpart:

| | Files |
|---|---:|
| **Byte-identical to `src/visualiser/`** | 8 |
| **Differ — and in every case the LIVE file is newer** | 10 |
| **Exist only in the lab** | **0** |
| **Exist only in `src/visualiser/`** | 3 — `WallColourChip.tsx`, `wallColours.ts`, `wardrobeHardware.ts` |

**The lab holds no unique work.** Its apparent "lab-only" lines are the *older* version of lines
the live file has since changed. Two examples, both decisive:

```
lab   productCategory?: 'blind' | 'curtain' | 'wardrobe';
live  productCategory?: 'blind' | 'curtain' | 'wardrobe' | 'shelving';

lab   { id: '7.0L', … widths: [2400, 3000] … }
live  { id: '7.0L', … widths: WARDROBE_WIDTHS_MM … }
```

The lab is behind on the product category, behind on the model table, and missing three files
entirely. **Last commit touching the lab: 2 September. Touching the live directory: 3 September.**

**Nothing imports it.** Its only consumer was `VisualizerLabPage.tsx`, deleted when E-07 closed —
and that page had already been rewired to import from `src/visualiser/`, which is what its header
recorded: *"the diff against live turned out to be almost purely additive… so it was moved across
rather than reconciled, and src/visualiser is the one copy again. src/visualiser-lab is now
unreferenced."*

### What each option costs

| Option | Cost | Verdict |
|---|---|---|
| **Delete it** | 12,788 lines removed. Zero runtime risk — nothing imports it. Recoverable from git | **RECOMMENDED** |
| **Merge into `src/visualiser/`** | There is nothing to merge. Every difference is the live file being newer; a merge would mean re-applying stale code | **Actively harmful** |
| **Promote to its own feature** | Creates a second visualiser feature from a copy that is behind on every axis, and doubles the size debt in §1 | **No** |

**And it is D-02 in the divergence log, whose exit condition was exactly this**: *"diff the two,
move across what is wanted, delete the page, its route and the directory together."* The page and
route are gone. **The directory is the last step and it is overdue.**

> **This is your call, not mine.** The recommendation is delete, in its own commit, before any
> restructuring — it removes 44% of the zone and every subsequent phase gets smaller.

---

## 3. THE CONSTRUCTED-PATH PROBLEM — **IT CAN BE MADE AUDITABLE, CHEAPLY**

**Yes. `Textures/` becomes movable.**

`wardrobes.ts` has **three** path-construction sites, and two are already statically visible:

| Site | Expression | Auditable today? |
|---|---|---|
| line 446 | `` `${DIR}/${entry.file}` `` | **Yes.** `entry.file` comes from `wardrobeCutouts.ts`, which lists all ten filenames as literals |
| line 665 | `` `${DIR}/${model.legacyFile}` `` | **Yes.** `legacyFile` is a literal field on every model row |
| **line 328** | `` `${DIR}/${model.id}-${slug}-${view}.png` `` | **NO — this is the whole problem** |

**Only one site is opaque, and its inputs are enumerable**: 10 model ids × 4 colour slugs × 3
views = 120 possible names, of which **10 files exist**.

### The mechanism that makes it opaque is also a 404-driven fallback

`loadAsset` resolves `null` on error, and `hasSuppliedArtwork` calls it purely to ask *does this
file exist* — **the renderer discovers its own asset set by provoking 404s in the browser.** The
comment says so plainly: *"a missing file is expected while the set is being produced."*

### The fix, and what it costs

**A manifest: a typed const listing which `(model, colour, view)` combinations have artwork.**

- **Cost: small.** Ten entries, in the file that already holds the model table.
- **`wardrobeAssetPath` keeps its shape** — the manifest gates it rather than replacing it.
- **`hasSuppliedArtwork` becomes synchronous** and stops being a network probe.
- **`Textures/wardrobes/` becomes statically verifiable**, so `npm run audit:assets` can classify
  all 28 files instead of abstaining, and the directory becomes movable and renamable.
- **It removes ten 404s per session** from the browser console.

**The one thing it costs is a habit.** Today, dropping a correctly-named PNG into the folder makes
it appear. With a manifest, a new render needs one line added. **That is the point** — it is the
difference between an asset set that can be verified and one that can only be probed.

> **`Textures/` stays capitalised only if this is declined.** With the manifest it can become
> `public/textures/` with the rest of the asset structure. Without it, it is unauditable forever
> and §12's rule about runtime-assembled paths continues to apply to it.

---

## 4. EVERY SHIM THE FREEZE CREATED, AND WHAT RETIRES IT

From ADR-020's demolition log, now actionable:

| # | Artefact | Retired by | Status |
|---|---|---|---|
| 1 | `src/components/Nav.tsx` re-export shim (E-11) | The page stopped composing chrome, so the import went rather than moved | **DONE — U2** |
| 2 | `BareLayout` | `/visualiser` mounted under `RootLayout onLight`; the layout wrapped nothing else | **DONE — U2** |
| 3 | `src/components/` as a directory | 1 and 2, plus `FormField` repointed to `@/ds` in `BookInstallPage` | **DONE — U2** |
| 4 | `src/theme.ts` shim + `@deprecated` aliases | **Three** zone files repointed to `@/ds`, not the six recorded here — `visualiser-lab/` held the others and went at U1 | **DONE — U2** |
| 5 | `src/data/products.ts` at its legacy path | Split by consumer — decision H, finally executable | U6 |
| 6 | `src/lib/pricing.ts` shim | Never created. **Move it straight to `shared-core/` with no shim** | Phase 6 |
| 7 | `legacy-visualiser` boundary element type | Deleted. The edge it protected is feature -> feature now and needs no exception | **DONE — U5** |
| 8 | The countdown's clearable/permanent split | Rewritten to read the register. **13 permanent became 0** | **DONE — U1** |

**Every shim the freeze created is gone.** Rows 1–4 were the whole of it, and they came out in one
phase because each was one import specifier plus a deletion. The freeze's structural residue is
now only rows 5–7, which are moves rather than shims.

---

## 5. THE FINDINGS, GROUPED BY THE PHASE THAT CLEARS THEM

**439 lint findings in the zone**, on top of the 245 already in scope. Rounded to the phase that
would clear each:

| Rule | Zone | Cleared by |
|---|---:|---|
| `@typescript-eslint/naming-convention` | 81 | **Phase 7** — the naming pass, re-run over the zone |
| `klay/no-banned-abbreviations` | 70 | **Phase 7.** Phase 0 predicted this: mostly single-letter graphics maths (`x`, `y`, `r`, `g`, `b`, `uv`) that §6 should arguably exempt rather than rename |
| `import/order` | 59 | **Autofix**, one commit, `npm run lint:fix` |
| `max-lines-per-function` | 49 | **The restructure** — decomposing the renderers |
| `klay/one-verb-per-concept` | 32 | **Phase 7.** Includes the 24 `draw*` functions Phase 0 called "the most internally consistent naming in the codebase" — likely an exemption, not a rename |
| `complexity` | 28 | The restructure |
| `klay/no-hardcoded-style-values` | 25 | A token pass over the two control components |
| `max-params` | 22 | The restructure |
| `no-restricted-imports` | 16 | **The move itself** — relative climbs become aliases |
| `max-lines` | 11 | The restructure. Two are E-02/E-03 exempt |
| everything else | 46 | Mixed |

**Roughly half of the 439 disappear with `visualiser-lab/`** — the lab duplicates every finding in
the eight identical files and most of the ten stale ones.

**42 out-of-layer files** are the zone's 39 plus `theme.ts`, `data/products.ts` and
`components/Nav.tsx`. All land inside `features/visualiser/` or retire as shims.

---

## 6. ASSETS IN THE ZONE

| Asset group | Files | Size | Named by | Proposed home |
|---|---:|---:|---|---|
| `Textures/wardrobes/` | 28 | 27 MB | `wardrobes.ts`, `wardrobeCutouts.ts`, `wardrobeScene.ts` | `public/textures/wardrobes/` — **only if §3's manifest is adopted** |
| `Textures/curtains/` | 2 | 7.0 MB | `Canvas2DCurtainRenderer.tsx`, `Canvas2DBlindRenderer.tsx` | `public/textures/curtains/` |
| `Textures/Blockout`, `Sunscreen`, `Light-filter`, `Bottom_bar` | 4 | 0.8 MB | `Canvas2DBlindRenderer.tsx` | `public/textures/fabric/` |
| `Textures/Dual/` | **0** | — | — | **Empty directory — delete** |
| `visualizer pictures/` | 5 | 1.2 MB | `KlayConfigurator.tsx`, %20-encoded | `public/images/openings/` — **and the space and the z-spelling both go** |
| `Preview.png` | 1 | 2.0 MB | `KlayConfigurator.tsx` | `public/images/openings/preview.png` |

**Every reference site is inside the zone**, so each move is a two-file commit: the asset and the
one renderer that names it. **`visualizer pictures/` is the best-value rename in the whole
map** — it removes the last `%20` encoding in the codebase and the last z-spelling on disk.

---

## 7. SEQUENCING

| # | Phase | Why here | Risk |
|---:|---|---|---|
| **U0** | **THE RENDER BASELINE** | **DONE, 3 Sep — and proven able to go red before being trusted.** No move phase opens without it; see the section at the end of this file | — |
| **U1** | **Delete `visualiser-lab/`. DONE, 3 Sep** | 18 files, 13,568 lines, nothing unique. Closed D-02 | **Very low** |
| **U2** | **Retire the shims — Nav, BareLayout, `theme.ts`. DONE, 3 Sep** | Cleared all four demolition rows. One consequence worth knowing: `/visualiser` now has a footer and therefore scrolls | Low |
| **U3** | **Fix the countdown tool; adopt the wardrobe manifest. DONE, 3 Sep — landed with U1** | Both were measurement corrections, and both were wrong in ways their own output could not show | Low |
| **U4** | **Move assets. DONE, 4 Sep** | Everything the visualiser draws is under `images/visualiser/` now. R7 closed. E-02 unblocked by V amending its terms — path references may be updated, behaviour may not | **Medium — silent failure** |
| **U5** | **Move files into `features/visualiser/`. DONE, 3 Sep** | 21 files, one barrel, 13 deep imports became 6 barrel imports. Cleared demolition row 7 as well | Medium |
| **U6** | Split `data/products.ts` — decision H | Finally executable | Low |
| **U7** | Decompose the renderers to §8 limits | The real work, and the only phase that changes code | **HIGH** |
| **U8** | Phase 7 re-run over the zone | Renames last, after structure settles | Low |

**U7 is where the value and the danger both sit**, and it should be its own project with its own
Phase 0. Everything before it is moving, not changing.

---

## 8. RISK REGISTER

| # | Risk | Why it matters | Mitigation |
|---:|---|---|---|
| **R1** | **A broken render fails silently.** No exception, no console error — just a blind that draws wrong | The renderers are the most valuable code in the project and the least verifiable. `tsc` cannot see a wrong pixel | **A visual baseline before U1.** Screenshot every category at a fixed configuration; re-shoot after every commit and compare. Without it, no phase after U4 is verifiable |
| **R2** | **The 404-probe fallback hides missing assets.** `loadAsset` resolves `null` by design, so a mis-moved texture degrades to the legacy sticker rather than erroring | An asset move could "work" and quietly downgrade every wardrobe | Adopt the manifest (§3) **before** U4. Then a missing file is a type error, not a fallback |
| **R3** | **`Canvas2DBlindRenderer.tsx` is 3,496 lines and may not be edited inside.** It can only be moved | Any restructure that needs to touch it is blocked by E-02 | Confirm the hash after every commit. If U7 genuinely requires editing it, that needs a decision from V first |
| **R4** | Deleting `visualiser-lab/` loses work | 12,788 lines | **Verified: it holds nothing unique.** Every difference is the live file being newer. Git holds it regardless |
| **R5** | **Wardrobe work resumes mid-phase** | The zone was unfrozen because that work paused. A restart during U5–U7 puts two sessions in the same files | The unfreeze is a window. If wardrobe work resumes, stop and report — do not merge around it |
| **R6** | The in-scope count triples and swamps the signal | 245 → 723. A regression in the migrated code could hide inside the zone's noise | Report zone and non-zone counts separately until U8 |
| **R7** | `visualizer pictures/` filenames contain spaces AND `..` | `1500 .. opening.jpeg` — a double dot in a URL path is a path-traversal shape that some tooling normalises | Rename in U4. Verify in a real browser, not just a HEAD request |

---

## WHAT I RECOMMEND YOU DECIDE FIRST

1. **`visualiser-lab/`: delete?** It changes the size of every phase after it.
2. **The wardrobe manifest: adopt?** It decides whether `Textures/` is movable or capitalised
   forever, and it gates U4.
3. **The visual baseline: build it before U1?** R1 says nothing after U4 is verifiable without
   one, and it is cheap now and expensive to retrofit.

**Nothing moves until you have read this.**

---

# THE RENDER BASELINE — the gate for the unfreeze

**Built 3 September 2026, before any move phase opened. `npm run baseline`.**

**No move phase opens until this is green, and no phase closes until it is green again.**

## Why the browser checks used in Phases 1–7 are not sufficient here

Every check this migration has relied on asks a question about **loudness**:

| Check | Catches |
|---|---|
| `tsc -b` | A reference that does not resolve |
| `eslint` | A rule violation |
| The route check | A page that fails to render |
| The image check | An `<img>` that 404s, a `background-image` that does not fetch |
| The console watch | An exception |

**A renderer does not fail loudly.** It draws to a canvas. If a texture path is wrong, `loadAsset`
resolves `null` **by design** and the legacy sticker is substituted. If a colour lookup misses,
the blind draws in the wrong colour. If a geometry constant shifts, the fold pitch changes.

**Nothing throws. Nothing 404s. The page renders perfectly and the picture is wrong.**

That is a different failure mode and it needs a different check — one that reads the pixels.

## What it does

Five fixed configurations, driven through the real UI, captured from the canvas:

```
blind-blockout-medium-manual        blind-dual-medium-manual
blind-sunscreen-large-motorised     curtain-default
blind-lightfilter-small-manual
```

Each canvas is reduced to a **48×48 luminance grid** — 2,304 cells. A cell differing by more
than 12/255 counts as changed, and **any changed cell is RED**.

**A signature, not a hash, and the difference matters.** A hash of the pixel buffer goes red on
one antialiased pixel and tells you nothing about what moved. The grid survives GPU dithering
and still reports *how much* of the picture changed, which is the difference between a gate you
can act on and one you learn to ignore.

**Stability is polled, not assumed.** Textures load asynchronously and the curtain renderer
animates on entry, so each case waits until two consecutive signatures agree before recording.

## THE TEST, applied to the baseline itself

**A gate that has never been seen to fail is not a gate.** So it was made to fail on purpose,
before being trusted:

| Step | Result |
|---|---|
| Record baselines, run unchanged | **Green** — 0 of 2,304 cells changed, on all five |
| Change one fabric colour — Rynamic White `#F2F0EC` → `#3060C0` in `data/products.ts` | — |
| Run the **image and console check** | **GREEN. Zero broken images, zero errors** |
| Run the **baseline** | **RED — 4 of 5.** 191–214 cells changed, 8.3–9.3% |
| Revert, confirm the file hash matches exactly | `ff7dae05…` before and after |
| Run the baseline again | **Green** — 0 cells, all five |

**Two things that demonstration proves.**

**The loud checks stayed green while the render was wrong.** That is not a criticism of them —
it is precisely the gap this gate exists to fill, demonstrated rather than asserted.

**And the red was diagnostic.** `curtain-default` stayed **green** while all four blind cases went
red, because curtains read `CURTAIN_COLOURS` and blinds read `RYNAMIC_COLOURS`. The gate did not
just say "something changed" — it localised the fault to the blind path.

## Using it

```
npm run baseline           compare — exit 1 on any drift
npm run baseline:update    re-record, after an INTENDED visual change
```

**`baseline:update` is the dangerous command.** It makes red go away by agreeing with whatever is
on screen. Run it only when a visual change was intended, and say so in the commit — an
unexplained baseline update is the same act as deleting a failing test.

The `.json` signatures are committed; they are the gate. The `.png` captures are written beside
them for human comparison and are gitignored — 830 KB each and re-written on every update.

## What it does not cover, stated so nobody assumes otherwise

- **Wardrobes — COVERED AS OF 3 SEPTEMBER.** Five cases, driven from the homepage showcase and
  from RangeRow’s "See in 3D", using the screenshot-decode capture because the surface is WebGL.
  This entry stays because the reason they were missing still matters: they are not reachable from
  `/visualiser`, whose wardrobe entry point was `/visualizer` and went when E-07 closed.
- **The customer's own photograph.** Every case uses the default `Preview.png` window; the
  corner-pin path is untested.
- **Non-white fabric colours**, and every hardware finish.

**Five cases is a floor, not a ceiling.** It covers the blind path and the curtain path across
four fabric types, which is what U1–U3 touch. **U4 needs the wardrobe cases first.**


## WHAT A GREEN BASELINE DOES AND DOES NOT MEAN — KEEP THIS VISIBLE

> ### A green baseline reads the canvas backing store. It would report exactly the same with no nav on the page at all.
>
> **It covers renders. Chrome and routing need the DOM check.**

**This is calibration, not a caveat.** The baseline is the only check in the project that can see a
wrong picture, and that specificity is the point — but a check trusted past its range is worse than
no check, because it is trusted.

`getImageData` reads the canvas's own pixel buffer. Nothing outside the canvas element reaches it:

| Change | Baseline | What actually sees it |
|---|---|---|
| A blind draws in the wrong colour | **RED** | Only the baseline |
| A texture fails to load and falls back | **RED** | Only the baseline |
| A geometry constant shifts | **RED** | Only the baseline |
| **The page loses its nav** | **green** | DOM check |
| **The page renders two navs** | **green** | DOM check |
| **The footer disappears** | **green** | DOM check |
| **A route mounts under the wrong layout** | **green** | DOM check |
| **The page 404s and the canvas is the old one** | green, or "no readable canvas" | DOM check |

**U2 is the worked example.** Retiring `BareLayout` moved `/visualiser` under `RootLayout`, removed
one `<Nav />` and added a `<Footer />`. The baseline was **0 of 2304 on all five cases, before and
after** — correctly, because the canvas did not change. Every visible thing that changed was
invisible to it.

**What discriminated was counting the DOM**: `/visualiser`, `/` and `/book` each reporting exactly
1 nav, 1 footer, 0 console errors, and `/book` rendering its 10 fields. That check would have gone
red on zero navs, on two navs, or on a missing footer, which is the whole of what makes it a check.

> **So a move phase needs both, and neither substitutes.** The baseline answers *"is the picture the
> same?"* The DOM check answers *"is the page the same?"* U2 changed the second deliberately and
> not the first, and only running both could tell those apart.

## EVERY `baseline:update` COMMIT STATES WHAT CHANGED AND WHY IT WAS INTENDED

> **An update with no stated reason is reverted on sight.**

`npm run baseline:update` makes red go away by agreeing with whatever is on screen. It is the one
command in this project that can silence the only check able to see a wrong picture, and it takes
four seconds.

**So the commit message carries the justification, not the diff.** A changed signature file shows
*that* the picture moved; it cannot show whether anyone meant it to. Required in the message:

- **what visually changed** — "the fold pitch on sheers is tighter", "the bottom bar is 2px deeper";
- **why it was intended** — the change that caused it, by name;
- **which cases moved, and by how much** — the `n of 2304 cells (x%)` line the run printed.

**A signature update in a commit that claims to be a move is a contradiction on its face.** Moving
is not changing; if a file only moved, the render is identical and the baseline stays green. **A
red during a move phase means the move was wrong**, and the fix is the code, never the baseline.

The rule is deliberately blunt because the failure is silent and the temptation is highest exactly
when the phase is nearly finished.

## WARDROBE CASES ARE A GATE ON U4 — **SATISFIED, 3 SEPTEMBER**

> ### The gate is met. Five wardrobe cases exist, and all five were made to fail before being trusted.
>
> `npm run baseline` now runs **ten** cases: the original five over blinds and curtains, and five
> over wardrobes.

| Case | Surface | Covers |
|---|---|---|
| `wardrobe-builtin-forma1-white` | Showcase → WARDROBES | Built-in, white |
| `wardrobe-builtin-forma2-walnut` | Showcase → WARDROBES | Built-in, **non-white** — a textured finish |
| `wardrobe-walkin-12u-white` | Showcase → WARDROBES | Walk-in, white |
| `wardrobe-walkin-9l-oak` | Showcase → WARDROBES | Walk-in, **a second non-white** finish |
| `wardrobe-see-in-3d` | **RangeRow → "SEE IN 3D"** | The other entry path into the same panel |

**Both surfaces that reach wardrobes are driven**, and the two non-white cases matter most:
`suppliedAssetPath` returns `null` for anything but white, so a white-only set would never
exercise the fallback, and the finishes are the only part drawn from a texture file rather than
from geometry.

### AND THEY WERE PROVEN TO FAIL FIRST, TWICE

**A gate nobody has seen fail is not a gate**, and that applies to each new case rather than to the
harness alone. Two perturbations, both reverted with the file hash identical either side:

| Perturbation | Result |
|---|---|
| `WARDROBE_HEIGHT_MM` 2016 → 1600 | **All 5 wardrobe cases RED** — 162 to 340 cells, 7.0% to 14.8%. **All 5 blind and curtain cases green** |
| `notaio-walnut.jpg` → `natural-oak.jpg` | **Only `wardrobe-builtin-forma2-walnut` RED** — 94 cells, 4.1%. The other **nine green** |

**The second is the more important demonstration.** The first proves the cases can go red at all;
the second proves the report is *diagnostic* — it localised a one-texture change to the single case
that uses that texture, and left the white and oak wardrobes alone. A gate that says only
"something moved" is one people learn to ignore.

### The capture path is different, and it had to be

**`getContext('2d')` returns `null` on the wardrobe canvas** — the surface is WebGL, so the read
the original five use sees nothing there. The wardrobe cases screenshot the canvas element and
decode the PNG back into a fresh 2D context inside the page, then grid it identically: same 48×48,
same threshold, same comparison. Only the read changed.

**And the harness now fails rather than skips when a canvas cannot be read**, which is what stops a
future case being added, recording `null`, and passing. That was a real hole: added before this
fix, a wardrobe case would have been silently inert.

### What the update did NOT do, checked rather than assumed

`baseline:update` re-records **every** case, including the five that already existed — so it could
have masked drift in them. The five original signature files were hashed before and after: **byte
identical**. The re-record was a no-op on them, and the ten-case green that follows is therefore a
real comparison, not a fresh recording of whatever was on screen.

---

**The original text of this gate follows, for the record.**

**U4 does not open until the render baseline covers wardrobes.**

**Wardrobes currently have zero render coverage.** The five cases drive `/visualiser`, which
offers BLINDS and CURTAINS only — the wardrobe entry point was `/visualizer`, deleted when E-07
closed. Every wardrobe render in the codebase is presently unverifiable.

**And U4 moves wardrobe assets** — 28 files, 27 MB, the largest asset group in the zone, reached
through the constructed path in §3. **That is R1's exact condition in the one area with no
baseline**: a mis-moved texture does not 404 loudly, it resolves `null` by design and silently
substitutes the legacy sticker. The picture degrades and every check stays green.

**Build them before U4, through the two surfaces that reach wardrobes:**

| Surface | How |
|---|---|
| Homepage `VisualiserShowcase` | The **Wardrobes** tab — `productCategory === 'wardrobe'` |
| Homepage `RangeRow` | The **"See in 3D"** action on a wardrobe card |

**Cover at least: a built-in model, a walk-in model, and one non-white finish** — the last matters
because `suppliedArtwork` returns `null` for anything but white, so a white-only baseline would
not exercise the fallback path at all.

**And prove the wardrobe cases can go red**, the same way the first five were: perturb one wardrobe
constant, confirm red, revert, confirm green. A gate that has not been seen to fail is not a gate,
and that applies to each new case, not just to the harness.

---

## WHAT ADOPTING THE MANIFEST FOUND — TWO AMENDMENTS TO THE U4 GATE

**Both found by trying to prove the manifest change moved nothing, and failing to prove it the
easy way.** Recorded here because each changes what the U4 gate has to be.

### 1. THE WARDROBE SURFACE IS WEBGL. THE BASELINE CANNOT READ IT.

`tools/render-baseline.mjs` signatures a canvas with `getContext('2d')` and `getImageData`. On the
wardrobe surface **`getContext('2d')` returns `null`** — the canvas already holds a WebGL context,
because the live wardrobe view is `Wardrobe3D`. The five existing cases are all Canvas2D, which is
why this never came up.

**A wardrobe case added to the current harness would not go red. It would record `null` and pass.**
That is worse than no coverage, and it is the shape the harness already had: `stableSignature`
returns `null` and the case is skipped rather than failed.

**So the wardrobe cases need a different capture path**, proven working here: screenshot the canvas
element, decode the PNG back into a fresh 2D context in the page, then grid it as before. Same
48×48 signature, same threshold, same comparison — only the read changes.

**And `render-baseline.mjs` must fail on a null signature rather than skip it**, or the harness
keeps a way to be quietly inert. That is a fix to make before U4, not during it.

### 2. THE SUPPLIED CUT-OUTS ARE CURRENTLY DRAWN BY NOTHING


### CORRECTION, 4 SEPTEMBER — "DRAWN BY NOTHING" WAS WRONG

**The cut-outs are drawn. `wardrobeScene.ts` loads them for `Wardrobe3D`'s sticker**, on the live
surface, with `ROOM_VIEW_READY` still false:

```ts
const sticker = cut && isWhite ? await load(`.../wardrobes/${cut.file}`) : null;
```

An itemised network trace over the wardrobe tab requests **three of them, all 200** —
`12.0U-white-interior.png`, `4.0-white-front.png`, `7.0L-white-interior.png`.

**What was actually observed, and what was wrongly inferred from it.** Hiding
`12.0U-white-interior.png` moved **0 of 2304 cells**, and the earlier trace counted six wardrobe
requests without listing them. From those two facts the conclusion drawn was "no cut-out is
fetched". **The count was never itemised — the cut-outs were almost certainly among those six all
along.**

**The right explanation for the zero is different, and it is worse news, not better.** When the
sticker fails to load the renderer falls back to the modelled white carcass — and for a *white*
wardrobe a photographic white board and a modelled white board are close enough that a 48×48
luminance grid at threshold 12 cannot separate them. **The cut-out path is live and
under-observable, not dead.**

**The gate is unchanged and the reasoning for it is unchanged**: render cases still cannot vouch
for the cut-outs, so `check:wardrobe-assets` is still what covers them. But the 27 MB is **not**
dormant artwork waiting on a flag — it is being drawn right now, and a mis-moved file degrades a
live picture in a way the baseline cannot see.

The ten cut-out PNGs, `wardrobeCutouts.ts`, `wardrobeArtwork`'s supplied branch and
`wardrobeCutoutFor` are **not reached by any live surface**:

| | |
|---|---|
| `WardrobeRoomRenderer` | Behind `ROOM_VIEW_READY = false` — the wardrobe tab renders `Wardrobe3D` instead |
| `Canvas2DWardrobeRenderer` | Not mounted anywhere. Its one importer takes `buildCarcass` off it |

**Measured twice, not inferred.** Hiding `12.0U-white-interior.png` and re-driving all twelve
configurations moved **0 of 2304 cells** on every one. A network trace over the same twelve makes
**six requests** under `/Textures/wardrobes/`, **all 200** — no cut-out is fetched at all.

**What this means for U4.** The wardrobe baseline cases can cover the `Wardrobe3D` path — geometry,
the three finish textures, hardware, wall colour — and **they cannot cover the cut-out path**,
because there is no surface to drive it through. A mis-moved cut-out would move nothing, pass every
check, and surface only when someone flips `ROOM_VIEW_READY`.

**So the cut-outs get a different kind of gate**, which is what `npm run check:wardrobe-assets`
is: it reads the manifest and the model table and asserts every file they name is on disk. Not a
render check — an existence check, for the assets a render check structurally cannot reach.

> **U4's gate is therefore both:** wardrobe render cases over the `Wardrobe3D` path, **and**
> `check:wardrobe-assets` green over the cut-out path. Neither substitutes for the other.

**A decision worth taking separately from the migration:** 27 MB of cut-out artwork and the
machinery around it currently render nothing. That is not a reason to delete it — it is finished
work waiting on `ROOM_VIEW_READY`, which is a different thing from `/cart` or the five primitives.
Asked the D-02 question, *what does this contain that nothing else does*, the answer is a real
list: photographic renders of ten layouts that nothing else in the repo has. **It stays.** But it
should be moved in U4 knowing that nothing will tell you if it breaks except the existence check.

---

# DECISIONS TAKEN AT U2, 3 SEPTEMBER 2026

## `/visualiser` KEEPS THE FOOTER AND KEEPS SCROLLING

> **V: "Leave `/visualiser` scrolling. Gaining the site footer is more correct than a
> viewport-locked pane. Not a regression."**

The page was exactly `100vh` with no scroll while it composed its own chrome. Under `RootLayout` it
gains a `<Footer />` below the tool, so the document is 1530px against an 1100px viewport.

**Recorded because it would otherwise read as a defect to the next person who measured it** — a
tool page that used to fit the viewport and now does not looks like a layout regression, and the
scroll is the visible trace of a decision rather than an accident. The tool itself is unchanged;
the footer is appended below it, as on every other page.

## WORKING AGREEMENT WITH THE PARALLEL SESSION: NAMED PATHS ONLY

> **V: "The commit sweep is my error. I committed with a broad `git add` while your `git rm`s were
> staged. From here I use named paths only while you are running."**

`8703253 "Let the photograph be the card"` contains four deletions it does not mention —
`theme.ts`, `Nav.tsx`, `FormField.tsx`, `BareLayout.tsx` — because a broad `git add` swept up work
that was staged and not yet committed.

**Nothing was lost and the tree was correct.** What was lost was the *reason*: four files
disappeared in a commit about a card photograph, and the explanation for those deletions lives in
`b6b548f` instead, one commit later.

**Both halves of the mitigation stand:**

| | |
|---|---|
| **Named paths only** | Neither session uses `git add -A`, `git add .` or `git commit -a` while the other is running |
| **Smaller commits** | Staged-but-uncommitted work is exposed for as long as it sits there. The window is the risk, so keep it short |

**The general form is worth keeping past this project.** A shared working tree makes the index a
shared resource, and `git add -A` is a claim over all of it. **The staging area is the only place in
git where two agents can silently take each other's work**, because it is the one piece of state
that is neither committed nor owned.

---

# MILESTONE — ADR-020's DEMOLITION LOG IS FULLY DISCHARGED

**3 September 2026, at U5.** Every artefact the freeze created has been removed, and the boundary
element type that existed to describe it is gone with it.

| # | Artefact | Cleared |
|---|---|---|
| 1 | `src/components/Nav.tsx` re-export shim | U2 |
| 2 | `BareLayout` | U2 |
| 3 | `src/components/` as a directory | U2 |
| 4 | `src/theme.ts` shim | U2 |
| 7 | `legacy-visualiser` boundary element type | U5 |
| 8 | The countdown's clearable/permanent split | U1 |

**Rows 5 and 6 are not on this list and never were the freeze's doing.** `data/products.ts` at its
legacy path (U6) and `lib/pricing.ts` into `shared-core/` (Phase 6) are ordinary migration steps
that would have been due whether or not the visualiser was ever frozen. The log conflated them
with the shims because they appeared in the same document; they are separate work.

## THE TOTAL COST OF THE FREEZE

> ### Four import changes and four deletions.

| The four deletions | The four import changes |
|---|---|
| `src/theme.ts` | `Canvas2DBlindRenderer.tsx` → `@/ds` |
| `src/components/Nav.tsx` | `KlayConfigurator.tsx` → `@/ds` |
| `src/components/FormField.tsx` | `VisualiserControls.tsx` → `@/ds` |
| `src/app/layouts/BareLayout.tsx` | `BookInstallPage.tsx` → `@/ds` |

**That is the whole bill, and it is worth writing down because the number is so much smaller than
the freeze felt.** For months these were load-bearing: `theme.ts` was described in its own header
as the thing that let the migrated half of the codebase move while the frozen half kept working,
and it was true. Retiring it took one afternoon and four lines.

## WHAT THAT DOES AND DOES NOT SAY

**It does not say the freeze was wrong.** The shims were cheap *because* they were shims — each was
a re-export that could not diverge from what it re-exported, which is precisely why unwinding them
was mechanical. §13's warning is about a *second copy*; a re-export is not one, and this is the
evidence for that distinction rather than an argument against it.

**What it does say is that the cost was in the constraint, not the code.** The four files were
trivial. What was expensive was everything the freeze made impossible while it stood: `theme.ts`
could not be split, decision H could not run, `products.ts` could not move, the countdown could not
reach zero, and — the one nobody priced — **a defect sat behind `ROOM_VIEW_READY` for months
because no check could reach the code and no one was allowed to.**

> **A freeze is not paid for in the scaffolding it erects. It is paid for in the work that queues
> behind it, and that bill is invisible until it is lifted.**

**The queue is what U6 onward now clears.** Four import changes bought back the ability to do all
of it.

---

# THE REMAINING PLAN, STATED — 3 SEPTEMBER 2026

**The sequence did not run in order, so it is written out here rather than inferred from the table
above.** U1, U2, U3 and U5 are done; U4 is next.

## WHAT U3 WAS, AND WHAT BECAME OF IT

> ### U3 is COMPLETE. It was ABSORBED into U1 — not deferred, not skipped.

**U3 was two measurement corrections**, and it was placed before U4 because nothing could be
verified properly until both landed:

| | What it was | Where it actually landed |
|---|---|---|
| **Fix the countdown** | `legacy-countdown.mjs` hardcoded ADR-020 and reported 13 permanent edges that had all become clearable | Its own commit, immediately after U1's deletion |
| **Adopt the wardrobe manifest** | `wardrobeAssetPath` built filenames instead of reading the generated manifest | Its own commit, immediately after U1's deletion |

**It was absorbed because you asked for both in the same instruction as U1**, and both were
prerequisites for trusting anything measured afterwards. They kept their own commits, so the record
is not lost — only the phase number is, which is why it is written down here.

**And absorbing it changed what U4 needs.** U3's whole purpose was to make U4's asset move
verifiable, and it did: `check:wardrobe-assets` exists because of it. But adopting the manifest is
also what uncovered the seven-of-ten defect and the fact that the wardrobe surface is WebGL —
**both of which added conditions to U4 that the original table did not know about.**

## THE REMAINING PHASES

| # | Phase | State | What it depends on |
|---:|---|---|---|
| **U4** | **Move assets** — `Textures/`, openings, `Preview.png` | **NEXT** | The wardrobe baseline cases, and `check:wardrobe-assets` |
| **U6** | Split `data/products.ts` — decision H | Ready | Nothing. Executable since the unfreeze |
| **U7** | Decompose the renderers to §8 limits | **Not scheduled** | Its own Phase 0 — see below |
| **U8** | Phase 7 re-run over the zone | Last | U7, or an explicit decision to run it without |

**There is no U9.** U8 closes the unfreeze.

### U4 — what it moves and what gates it

**28 wardrobe files, 27 MB**, plus the window openings and `Preview.png`. Reached through a
constructed path, which is R1 in the one area the render baseline could not see.

**Two gates, and neither substitutes for the other:**

1. **The wardrobe render cases** — over the `Wardrobe3D` path, using the screenshot-decode capture,
   because `getContext('2d')` returns `null` on that canvas and the U0 harness would have skipped
   rather than failed.
2. **`check:wardrobe-assets`** — over the cut-out path, which **no render check can reach**, because
   nothing draws the cut-outs while `ROOM_VIEW_READY` is false.

**Also in U4: R7.** `visualizer pictures/` filenames contain spaces *and* `..` — `1500 .. opening.jpeg`
is a path-traversal shape some tooling normalises. Rename them here, and verify in a real browser
rather than with a HEAD request.

### U6 — the one with no blockers

Decision H has been executable since the unfreeze and is waiting only on its turn. `products.ts` is
imported by three visualiser files, all in scope now, so the split can finally run by consumer.

### U7 — should not run as a phase of this project

**It is the only phase that changes code rather than moving it**, it touches the four protected-IP
files, and E-02 forbids editing inside `Canvas2DBlindRenderer.tsx` — 3,496 lines that can currently
only be moved. **If U7 genuinely requires editing it, that needs a decision from V before U7 opens,
not during it.**

> **Recommendation: U7 is its own project with its own Phase 0.** Everything before it is moving,
> not changing, and that distinction is what has kept every phase so far verifiable.

### U8 — and what it inherits

The naming pass over the zone: 81 `naming-convention` and 70 `no-banned-abbreviations` findings.
**Phase 0 predicted the second group would be mostly single-letter graphics maths** — `x`, `y`, `r`,
`g`, `b`, `uv` — and that §6 should arguably exempt them rather than rename them. That call is still
open and belongs to U8.

**U8 also inherits one deliberate deferral from U5:** the visualiser barrel exports `Field`, which
collides by name with `@/ds`'s form `Field`. They are different components doing the same job in
different contexts. Renaming is a Phase 7-shaped question, so it was left for U8 with a note at the
barrel.

---

# U4 — ASSETS MOVED, AND WHAT E-02 BLOCKED

**4 September 2026. Partially complete, deliberately.**

## WHAT MOVED

| From | To | Size |
|---|---|---|
| `images/Textures/wardrobes/` | `images/visualiser/textures/wardrobes/` | **27 MB, 22 files** |
| `images/Preview.png` | `images/visualiser/preview.png` | 2.1 MB |
| `images/visualizer pictures/` | `images/visualiser/openings/` | 920 KB, 4 files |

**R7 is closed.** The opening photographs were `visualizer pictures/1500 .. opening.jpeg` — the
American spelling the house style had already rejected, a space in every name, and a literal `..`
in one, which is a path-traversal shape some tooling normalises. Every reference had to be
percent-encoded by hand to be fetchable, and the encoded string carried around so `openingWidthFor`
could match it back. They are now `opening-1500.jpeg` and so on, and **no reference needs encoding
at all.**

**And `2700mm.jpeg` is now `opening-2400.jpeg`, which fixes a name that was wrong.** The dimension
drawn across the top of that photograph reads 2400 and the cabinet is the width of the other
four-door shot. The supplier's filename disagreed with their own artwork. The file is now named for
what it shows instead of carrying a comment explaining that it is not.

## WHAT DID NOT MOVE, AND WHY — R3 ARRIVED EARLY

> ### `Blockout/`, `Sunscreen/`, `Light-filter/`, `curtains/` stay at `public/images/Textures/`.

**They are named by `Canvas2DBlindRenderer.tsx`, which is E-02.**

```ts
const TEXTURE_ROOT = '/images/Textures';
```

Moving them requires changing that constant, and **a string constant is neither a move nor an
import rewrite** — it is a content edit, which §12 does not permit on a protected file. The edit
was made, caught on review of the diff, and reverted; all four protected hashes are unchanged.

**This is R3, and the register expected it at U7.** It says: *"Any restructure that needs to touch
it is blocked by E-02… If U7 genuinely requires editing it, that needs a decision from V first."*
It turns out **U4 needs it too** — an asset move is a restructure from the perspective of a file
that hardcodes a path.

### The decision this needs from V

**Three options, and the third is the one I would take:**

| | Option | Cost |
|---|---|---|
| **A** | Leave the split as it is | `Textures/` and `visualiser/textures/` both exist. Honest, and confusing to the next reader |
| **B** | Authorise the one-line change to `TEXTURE_ROOT` | Same shape as the two import rewrites already authorised. One line, no logic |
| **C** | Move the four directories and add a redirect | Adds indirection to avoid a one-line edit. Worse than B |

**B is one line in a 3,496-line file, and it is a path constant, not logic.** But it is exactly the
kind of edit E-02 exists to prevent being made casually, so it is recorded here rather than taken.

**Until then the split is documented rather than tidy**, which is the correct trade: a confusing
directory layout is recoverable, and an unauthorised edit to protected IP is a broken promise.

## VERIFICATION

**Baseline green either side, all ten cases** — including the five wardrobe cases built for exactly
this move. `check:asset-paths` green over 46 literal paths. `check:wardrobe-assets` green.
Protected IP: four hashes unchanged. Zero 4xx or 5xx across the homepage, the wardrobe tab and the
visualiser upload state; zero broken images by `naturalWidth`.

**And the moved wardrobe cut-outs were confirmed fetched at their new path** — itemised, not
counted: `12.0U-white-interior.png`, `4.0-white-front.png`, `7.0L-white-interior.png`, all 200.
That itemisation is what produced the correction above.

---

# U4 COMPLETE — 4 SEPTEMBER 2026

**V authorised the `TEXTURE_ROOT` edit and the four remaining directories moved with it.**
`public/images/Textures/` no longer exists; everything the visualiser draws is under
`public/images/visualiser/`.

| | |
|---|---|
| `textures/wardrobes/` | 27 MB, 22 files |
| `textures/{Blockout, Sunscreen, Light-filter, curtains, Bottom_bar}` | Moved at the amendment |
| `openings/` | 4 files, R7 closed |
| `preview.png` | 2.1 MB |

**`Bottom_bar/` moved with them and is unreferenced** — its only mention in code is a comment. It is
not deleted: `public/` deletions are V's call. Flagged for the next asset pass.

## R3 ARRIVED THREE PHASES EARLY, AND THE REASON IS GENERAL

**The risk register put R3 at U7**, the decomposition phase — the one that changes code. It says:
*"Any restructure that needs to touch `Canvas2DBlindRenderer.tsx` is blocked by E-02."*

**It arrived at U4, an asset move, which the register classified as "moving, not changing".**

> ### An asset move IS a restructure, from the perspective of a file that hardcodes a path.
>
> The distinction between *moving* and *changing* is drawn from the code's point of view. A file
> that names a location in a string does not share that point of view: **to it, the world moving is
> indistinguishable from being edited.** Both arrive as "this constant is now wrong."

**That generalises past this file.** Any hardcoded reference — an asset path, a route string, a
config key, a directory constant — converts a move somewhere else into an edit here. **The more
paths a file hardcodes, the more of the project's "moving, not changing" work becomes "changing"
for that file specifically.**

**Which is why the amendment was the right response rather than a one-off exception.** The old terms
made it impossible to move an asset that a protected file names — not hard, impossible — and that
was never the intent of protecting the file. `TEXTURE_ROOT` is *where something lives*, not *what
the file does*.

**And it means R3 should be expected again**, at U6 and U7, in the same shape: some file that
hardcodes something will make a move look like an edit. The question to ask each time is the
amended one — *could this change what the file produces?*

---

# A STATED RESOLUTION LIMIT OF THE RENDER BASELINE

> ## At 48×48 with a threshold of 12, a photographic white board and a modelled white carcass do not separate.
>
> ### The render check cannot see a failed wardrobe sticker at all. This is a property of the gate, not of the assets.

**Measured, not supposed.** Hiding `12.0U-white-interior.png` and re-driving every wardrobe
configuration moved **0 of 2304 cells** — on the case that uses that exact file.

**The sticker is genuinely loaded and drawn.** `wardrobeScene.ts` projects it onto the carcass in
`Wardrobe3D`, on the live surface, with `ROOM_VIEW_READY` still false. When it fails to load the
renderer falls back to the modelled carcass — and both are white melamine, lit the same way, in the
same place. **A coarse luminance grid is exactly the wrong instrument for that difference.**

### Why the limit is correct rather than a bug to fix

**Lowering the threshold or raising the grid would not fix it and would break something that works.**
The 48×48 grid and threshold 12 were chosen so the gate survives GPU dithering and antialiasing —
that is what makes it usable at all, and it is why it reports **0 cells** across ten cases run
repeatedly rather than a flutter of one-cell noise that people learn to ignore. Chasing a
white-on-white difference would trade a reliable gate for a flaky one.

**And the difference it cannot see is real but small in luminance terms**, which is precisely the
case a signature is designed to tolerate. The instrument is right; its range is what it is.

### So this is the justification for `check:wardrobe-assets`

> **The render check covers geometry, finishes, hardware and wall colour. It does not cover whether
> the correct cut-out was found.** Nothing pixel-based can, at any resolution that stays stable.

`npm run check:wardrobe-assets` reads the manifest and the model table and asserts every file they
name is on disk. **It is not a weaker substitute for a render check — it is the only instrument that
can answer this particular question**, and it answers it without needing the feature on, without a
browser, and without a threshold to tune.

**Two gates, two questions, neither redundant:**

| | Question | Blind to |
|---|---|---|
| Render cases | Does it draw the same picture? | A sticker that silently fell back to the modelled carcass |
| `check:wardrobe-assets` | Do the files it names exist? | Anything about how they are drawn |

**And the correction that produced this is worth keeping visible.** The zero was first read as "the
cut-outs are drawn by nothing" — dead weight waiting on a flag. It is the opposite: **live artwork,
under-observed.** A mis-moved cut-out degrades a real picture that ten green cases would not
notice.
