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

| # | Artefact | Retired by | Order |
|---|---|---|---|
| 1 | `src/components/Nav.tsx` re-export shim (E-11) | Repoint `VisualiserPage.tsx` to `@/app/layouts` | **First — one line** |
| 2 | `BareLayout` | Mount `VisualiserPage` under `RootLayout`, strip its own `<Nav />` | With 1 |
| 3 | `src/components/` as a directory | 1 and 2, plus `FormField.tsx` reaching its two consumers | After 1, 2 |
| 4 | `src/theme.ts` shim + `@deprecated` aliases | Repoint 6 zone files from `../theme` to `@/ds` | Early — mechanical |
| 5 | `src/data/products.ts` at its legacy path | Split by consumer — decision H, finally executable | Mid |
| 6 | `src/lib/pricing.ts` shim | Never created. **Move it straight to `shared-core/` with no shim** | Phase 6 |
| 7 | `legacy-visualiser` boundary element type | Delete when the zone is inside `features/` | Last |
| 8 | The countdown's clearable/permanent split | **See the note below** | Immediately |

**`tools/legacy-countdown.mjs` is now measuring a world that no longer exists.** It hardcodes
`isOutOfScope` and a `PERMANENT` map from ADR-020, so it still reports **13 permanent edges that
are now all clearable**. It is a measurement instrument reporting a stale fact — exactly what THE
TEST is for — and it should be corrected before any phase uses its number.

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
| **U1** | **Delete `visualiser-lab/`** | Removes 44% of the zone before anything is restructured. Nothing imports it | **Very low** |
| **U2** | Retire the shims — Nav, BareLayout, `theme.ts` | Mechanical import rewrites, no logic touched. Clears four demolition rows | Low |
| **U3** | Fix the countdown tool; adopt the wardrobe manifest | Both are measurement corrections. Nothing can be verified properly until they land | Low |
| **U4** | Move assets: `Textures/`, openings, `Preview.png` | Depends on U3's manifest for the wardrobe set | **Medium — silent failure** |
| **U5** | Move files into `features/visualiser/` | The move itself. Paths only, no decomposition | Medium |
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

- **Wardrobes.** Not reachable from `/visualiser` — the entry point was `/visualizer`, deleted
  when E-07 closed. Wardrobe cases have to be driven from the homepage showcase and **should be
  added before any wardrobe asset moves**, which is U4.
- **The customer's own photograph.** Every case uses the default `Preview.png` window; the
  corner-pin path is untested.
- **Non-white fabric colours**, and every hardware finish.

**Five cases is a floor, not a ceiling.** It covers the blind path and the curtain path across
four fabric types, which is what U1–U3 touch. **U4 needs the wardrobe cases first.**

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

## WARDROBE CASES ARE A GATE ON U4

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
