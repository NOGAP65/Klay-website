# DEAD CODE AND UNUSED ASSET REPORT

**7 September 2026.** Survey only — **nothing was deleted, nothing was moved.** The one
thing this pass changed is nothing at all; every finding below is a proposal.

Run on `main` at `ac87410`, working tree clean. `knip` and `jscpd` were deferred to Phase 6.4
and had never been run against this codebase; this is their first baseline. Both were run via
`npx` and **are not in `package.json`** — see *Tooling*, below.

---

## READ THIS FIRST — TWO THINGS THAT ARE NOT DEAD CODE

### 1. `npm run audit:assets` has a stale safety guard, and it is currently lying

`tools/asset-audit.mjs:74` decides which assets are too dangerous to classify:

```js
const constructedPath = rel.startsWith('/images/Textures/wardrobes/');
```

**That directory no longer exists.** U4 moved the textures to
`/images/visualiser/textures/wardrobes/`, and the guard was not moved with them. The prefix
matches nothing, so the tool reports:

```
UNSAFE TO CLASSIFY (constructed paths)  : 0  0.0 MB
```

**That zero is false.** Every wardrobe asset addressed by a constructed path is now being
classified by static reference count — the exact failure the guard was written to prevent, and
its own header warns about in capital letters. It is the same class of fault as D-13: a check
that reports success because it is looking at the wrong thing.

**Consequence for this pass:** the four "unreferenced" stickers the tool reports are the only
reason they appear here at all, and I re-derived them by hand rather than trusting the number.
**Fix the guard before anyone deletes an asset on this tool's say-so.**

### 2. A protected-file discrepancy, and a disclosure about my own edits

`exceptions.json` — the machine-readable half, which `npm run check:exceptions` actually
validates — lists **four** protected IP files:

| | |
|---|---|
| E-01 | `src/features/visualiser/homography.ts` |
| E-02 | `src/features/visualiser/Canvas2DBlindRenderer.tsx` |
| E-03 | `src/features/visualiser/CornerPinOverlay.tsx` |
| E-04 | `src/features/visualiser/usePhotoUpload.ts` |

**`SPECIFICATION.md:797` names a fifth**, calling `Canvas2DCurtainRenderer.tsx` *"a protected
IP file (E-02's sibling) that may not be edited at all."* It has no E-number and is in neither
`exceptions.json` nor §12's table. `check:exceptions` passes because it compares **E-numbers,
not paths** — so the two halves disagree about which files are protected and no check can see
it. That is a divergence in the exceptions register itself.

**What I need to disclose:**

- **I edited `Canvas2DCurtainRenderer.tsx` heavily** this session — the D-13 reconciliation
  (`8ae608f`) and the surface attributes (`03c1462`). If §797 is right, that was not permitted.
  Note that `main`'s own eight curtain commits on 4 September edited it freely, so the operative
  practice has been that it is *not* protected — but the prose says otherwise and I did not
  check before editing.
- **I edited `Canvas2DBlindRenderer.tsx`, which IS E-02**, in `03c1462`. One line:
  `data-render-surface="blind"`. E-02's terms are *"PATH REFERENCES MAY BE UPDATED. BEHAVIOUR
  MAY NOT."* A DOM attribute is not a path reference. It changes no rendering, but it is not
  obviously inside the letter of the exception either.

Both are yours to rule on. I have not touched either file in this pass.

---

## SUMMARY

| Category | Found | Confidence |
|---|---:|---|
| Broken asset references (live defects) | **0** | CERTAIN |
| Unused files | 3 | CERTAIN |
| Unused dependencies | 1 + 3 dev | CERTAIN / LIKELY |
| Unused exports — value | 44 | mixed, see below |
| Unused exports — type | 42 | mixed |
| Dead config constants | 2 | CERTAIN |
| Unused route constants | 2 | CERTAIN |
| Unreachable routes | 0 | CERTAIN |
| Page components with no route | 0 | CERTAIN |
| Empty directories | 0 | CERTAIN |
| Stray files | 1 | CERTAIN |
| Unreferenced assets | 4 (5.3 MB) | LIKELY |
| Assets under constructed paths | 30 (48 MB) | UNSAFE |
| TODO / FIXME / HACK / XXX | **0** | CERTAIN |
| Commented-out code | **0** | CERTAIN |
| Duplication (jscpd) | 20 clones, 1.22% | baseline |

**Two categories came back genuinely empty and that is worth stating plainly: there are no
TODO/FIXME/HACK markers anywhere in `src/`, `netlify/`, `tools/` or `scripts/`, and there is no
commented-out code.** Eleven candidates matched a code-shaped-comment heuristic; all eleven are
documentation — run instructions, usage examples, and a before/after annotation. That is
unusual and it is a property worth keeping.

---

## BROKEN ASSET REFERENCES — LIVE DEFECTS

**None.** Reported separately and prominently as instructed, and the honest result is a clean one.

- `npm run check:asset-paths` — **every literal asset path resolves to a file in `public/`, at
  the case on disk.**
- `PRESET_ROOMS_WINDOW` (`KlayConfigurator.tsx:716`) names `room-3/4/5.png`; **all three exist.**
  This was the known defect and it was fixed in `09c8dfc`, before this pass.
- `PRESET_ROOMS_WARDROBE` names four `opening-*.jpeg`; all four exist.
- The **constructed** blind textures (`Canvas2DBlindRenderer.tsx:161-170`) were checked by hand
  because no static tool can follow them — `Blockout/Blockout_fabric.png`,
  `Sunscreen/Sunscreen.png`, `Light-filter/light_filter.png` all resolve.
- The `Textures/Dual/` empty directory named in the task **no longer exists.** U4 removed
  `public/images/Textures/` wholesale. The `case 'dual':` branch returns the Blockout texture by
  design, not by accident.

Verified against the filesystem, never over HTTP — a SPA answers 200 for a missing path, so an
HTTP check here proves nothing.

---

# CERTAIN

Nothing in this section depends on a judgement call. Each item states what proves it.

## C1 — Unused files (3 files, 543 lines)

| File | Lines | Proof |
|---|---:|---|
| `src/features/catalogue/components/ProductCard.tsx` | 114 | No `import` anywhere names it. Confirmed by knip **and** by an independent scan of all 111 `src` files. The only mentions repo-wide are three prose comments *about* it |
| `src/features/catalogue/components/PhotoTile.tsx` | 425 | Imported by exactly one file — `ProductCard.tsx:28` — which is itself dead. Transitively unreachable |
| `src/app/layouts/index.ts` | 4 | Barrel re-exporting `RootLayout`, `Nav`, `Footer`. **Nothing imports the barrel**; `router.tsx:44` imports `./layouts/RootLayout` directly |

**`ProductCard` and `PhotoTile` are a pair and must be judged together** — deleting `ProductCard`
alone leaves `PhotoTile` orphaned. `ShopCard.tsx:12` records why they died: *"The first pass
reused ProductCard… that reads at 480px wide on a category page and it does not read at 290."*
The replacement landed; the original stayed.

**`src/app/layouts/index.ts` carries a caveat.** §4 requires a barrel per layer, so this file may
exist to satisfy the architecture rather than to be imported. Deleting it is a **specification
question, not a dead-code question** — I would leave it and instead ask why `router.tsx` bypasses
it. Listed here because it is provably unimported; flagged because "unimported" and "should not
exist" are different claims.

**Not a finding:** `src/vite-env.d.ts` has no importer either. It is a `/// <reference>` ambient
declaration consumed by `tsc`. My scan flagged it; knip correctly did not. It stays.

## C2 — Stray file

| Path | Detail |
|---|---|
| `LEGACY` | **A 0-byte file** at the repo root, created 3 Sep, untracked and un-ignored. Not a directory — almost certainly a shell redirect that lost its target. Nothing references it |

## C3 — Unused dependency: `lucide-react`

`package.json:31`. **Zero import sites.** The only two mentions repo-wide are:

- `src/features/home/components/RangeRow.tsx:157` — a comment that already says so:
  *"lucide-react is in package.json and nothing in src imports it; the site draws its own icons"*
- `vite.config.ts:31` — `optimizeDeps: { exclude: ['lucide-react'] }`

**Removing the dependency requires removing that `vite.config.ts` line in the same commit**, or
Vite is configured to exclude a package that is not installed. That is the whole change; there is
no code to migrate because nothing imports it.

## C4 — Dead config constants

| Symbol | Location | Proof |
|---|---|---|
| `isDevelopment` | `src/config/env.ts:86` | Read by nothing. Re-exported through `src/config/index.ts:5` and the re-export is unused too |
| `isProduction` | `src/config/env.ts:87` | Same, via `index.ts:6` |

Both are `import.meta.env.DEV` / `.PROD` passthroughs. **There is no feature flag gated behind
either** — I checked for that specifically, since the task asked about code gated behind a flag
that has never run. There is none: no flag in the codebase guards an unreached branch.

## C5 — Unused route constants (the route is live, the constant is not)

| Constant | Location | Why it is unused |
|---|---|---|
| `routes.home` | `src/config/routes.ts:26` | `/` is reached, but never through this constant |
| `routes.bookingConfirmed` | `src/config/routes.ts:33` | The route is live and reached — **`netlify/functions/create-checkout-session.ts:102` hardcodes the string** into Stripe's `success_url` rather than importing the constant |

**`bookingConfirmed` is the interesting one and I would not delete it.** A constant exists so one
value has one home; the Netlify function writes the path out by hand instead, which is precisely
the shape D-12 was about. **The fix is to use the constant, not to delete it** — though note the
function is server-side and `src/config` may not be importable from `netlify/` under §2. That
makes it a `shared-core` candidate rather than a deletion.

`routes.productsInCategory` and `routes.contactAbout` are also flagged by knip but are **false
positives worth stating**: both are called through local wrappers (`enquire()` in
`catalogue/constants.ts`, and the legacy redirects build the same URL). Do not delete.

## C6 — Empty directories

**None in the repository.** The only empty directory anywhere is `.claude/worktrees`, which
belongs to the tooling and is not repo content.

**This category is close to vacuous by construction, and that is worth recording once: git cannot
track an empty directory.** One can only ever exist in a working tree, never in a commit — so
"empty directories in the repo" can only ever mean local debris. `Textures/Dual/` is gone with the
rest of `public/images/Textures/`.

## C7 — No unreachable routes, no orphan pages

- **13 routes defined**, all reachable: nav (`/`, `/products`, `/visualiser`, `/about`,
  `/contact`), footer (`/how-it-works`), cart icon (`/cart`), shop cards (`/products/:slug`),
  the booking flow (`/book`, `/booking/confirmed` via Stripe's return), `*` (404), and the two
  legacy redirects (`/blinds`, `/blinds/:slug`) which are **deliberately unlinked** — they exist
  for URLs already indexed in the wild.
- **11 page components, 11 routed.** No page component lacks a route.

## C8 — No TODO / FIXME / HACK / XXX, and no commented-out code

Zero across `src/`, `netlify/`, `tools/`, `scripts/`. See the note in *Summary*.

---

# LIKELY

Each of these is very probably dead. Each has one reason it is not CERTAIN, stated.

## L1 — The distinction that governs most of the export findings

knip reports **86 unused exports (44 value, 42 type)**. Read carefully, **most of these are not
dead code at all.** They split into three kinds, and only one is a deletion:

| Kind | What it means | Right action |
|---|---|---|
| **Unnecessary `export`** | The symbol *is* used — inside its own file. Only the keyword is surplus | Drop `export`. **Deletes nothing** |
| **Barrel surface** | Exported from a feature barrel as public API; no cross-feature consumer *yet* | Usually keep — §1 rule 3 makes barrels the feature's front door |
| **Genuinely unreachable** | Nothing anywhere reads it | Delete |

**Reporting all 86 as "dead code" would be wrong**, so they are separated below.

### L1a — Unnecessary export keyword (symbol is alive, export is not)

Verified individually: each is referenced within its own file.

| Symbol | File | Used at |
|---|---|---|
| `WARDROBE_CUTOUTS` | `visualiser/wardrobeCutouts.ts:26` | same file, `:160` |
| `FABRIC_SHOTS` | `catalogue/fabricShots.ts:44` | same file, `:68-70` |
| `availabilityOf` | `catalogue/lib/facets.ts:53` | same file, `:66` |
| `matches` | `catalogue/lib/facets.ts:63` | same file |
| `openingWidthFor` | `visualiser/KlayConfigurator.tsx:765` | same file, `:1028`, `:1506` |
| `BASE_PRICE`, `INSTALL_PER_BLIND`, `INSTALL_CALLOUT_MINIMUM`, `GST_RATE`, `normaliseQuantity` | `lib/pricing.ts` | all consumed by `pricePerBlind` / `quoteTotals` in the same file |

**These are zero-risk to de-export and zero-benefit to delete.** Note `src/shared/index.ts:18`
documents `BASE_PRICE`, `INSTALL_PER_BLIND` and `GST_RATE` as pricing's public vocabulary — so
de-exporting them contradicts a written statement. Worth a glance before acting.

### L1b — Dead re-export chain

| Symbol | Location | Note |
|---|---|---|
| `MOTORISED_ADDON` | `src/data/products.ts:179` | `export { MOTORISED_ADDON } from '../lib/pricing'` — **this re-export is D-07's resolution** and nothing consumes it. The constant itself is alive inside `pricing.ts` |

Deleting the re-export line is safe. **It would, however, remove the artefact D-07 was closed
with** — the log says *"RESOLVED — data/products.ts re-exports pricing.ts."* Removing it does not
reintroduce the duplication, but the log entry should be annotated if it goes.

### L1c — Genuinely unreachable exports

| Symbol | Location |
|---|---|
| `ArrowLink` | `features/home/furniture.tsx:39` |
| `SKU_CATALOGUE`, `RANGES`, `SKU_COUNT`, `PRICING_NOTE` | `catalogue/products.ts:108,132,146,160` |
| `WARDROBE_SHELF_DEPTH_MM`, `wardrobeDimensions`, `suppliedAssetPath`, `viewForTrace`, `tracedRecedesLeft`, `hasSuppliedArtwork` | `visualiser/wardrobes.ts` |
| `RAIL_RADIUS_MM` | `visualiser/wardrobeGeometry.ts:370` |
| `resolvedWidthMm`, `renderPlan` | `visualiser/wardrobeSlices.ts:200,226` |
| `drawSeatingShadow` | `visualiser/wardrobeComposite.ts:289` |
| `OPEN_MS`, `CLOSE_MS`, `TRAVEL_MS`, `STAGGER_MS`, `STAGGER_SPAN_MS`, `columnWidth` | `catalogue/components/ShopCard.tsx:69-132` |
| `productBySlug`, `GROUPS`, `LIGHT_VALUES`, `priceFor`, `configuredLine` | `catalogue/index.ts` (barrel) |

**Why not CERTAIN:** two sub-cases need a human.

1. **The `ShopCard` timing constants** (`OPEN_MS`, `TRAVEL_MS`, `STAGGER_SPAN_MS`…) were the
   open/close animation's shared vocabulary when `ProductsPage` drove the expansion. The card
   now animates itself. They are dead, but they encode **measured design decisions** with long
   rationales attached — `STAGGER_SPAN_MS` records *"90, down from 170… at 90 it is one motion
   with a lead."* Deleting the constant deletes the finding. Consider keeping the comment.
2. **The `catalogue/index.ts` barrel exports** are the feature's public API. Nothing imports them
   *today*; §1 rule 3 says other features must come through this door. Removing them is an
   architecture call.

### L1d — 42 unused exported types

Almost all are **prop and shape interfaces exported beside the component they describe**
(`WardrobeRendererProps`, `ShopCardProps`, `WallColourChipProps`, `PhotoProfile`, `CarcassBox`…).
This is idiomatic and harmless — a consumer needs the props type the moment anyone wraps the
component. **My recommendation is to leave every one of them**, and I would not spend a batch on
this category. Full list in the knip output; not reproduced here because acting on it is not
advised.

## L2 — Unused devDependencies

| Package | Confidence | Reason |
|---|---|---|
| `@types/react-router-dom` | **High** | It types **react-router v5**; this project runs **v7**, which ships its own types. Stale by two majors |
| `@typescript-eslint/eslint-plugin` | Medium | `eslint.config.js:7` imports the umbrella `typescript-eslint`, which depends on both. The direct entries are redundant *if* nothing resolves them by name |
| `@typescript-eslint/parser` | Medium | Same |

**The two `@typescript-eslint/*` entries need a proof, not an argument:** remove them, run
`npm run lint`, confirm the count stays at 0 errors / 618 warnings. If it moves, put them back.

## L3 — Four orphaned wardrobe stickers (5.3 MB)

| File | Size |
|---|---:|
| `Forma Wardrobe 2.9 Sticker.png` | 1,277 KB |
| `Forma Wardrobe 4.9 Sticker.png` | 1,360 KB |
| `Forma Wardrobe 5.0 Sticker.png` | 1,401 KB |
| `Forma Wardrobe 8.0 Sticker.png` | 1,380 KB |

All under `public/images/visualiser/textures/wardrobes/`.

**This is a constructed path, and I am deliberately placing it in LIKELY rather than UNSAFE — here
is the reasoning so you can overrule it.** The loader is:

```js
img.src = encodeURI(`${DIR}/${model.legacyFile}`);   // wardrobes.ts:714
```

A constructed path normally defeats static analysis. **This one does not, because the input set
is closed**: `legacyFile` is a required field on every model, every value is a string literal in
`wardrobes.ts`, and there are exactly ten of them — six naming a sticker, four empty (`LIN01`,
`LIN02`, `LIN05`, `LINBR02`). So the reachable set is fully enumerable:

- **Named, therefore live (6):** `3.0`, `4.0`, `6.0`, `7.0L`, `9.0L`, `12.0U`
- **On disk (10):** the above plus `2.9`, `4.9`, `5.0`, `8.0`
- **Orphans (4):** the table above

`npm run check:wardrobe-assets` independently agrees — *"6 legacy stickers referenced"* against
10 files.

**Why still not CERTAIN:** the enumeration is only valid while `legacyFile` is assigned literally.
Anything that ever computes it — a data file, an API, a model added at runtime — invalidates the
whole argument silently. **I would delete these only together with a check that asserts
`legacyFile` values remain literal.**

## L4 — Five generated `contents/` PNGs (198 KB)

`textures/wardrobes/contents/{box,hanging-long,hanging-short,shoes,stack}.png`

**Your rule says anything referenced by `scripts/` or `tools/` is used, so by that rule these are
used and I am not proposing deletion.** Recording the nuance because it is the interesting part:
`scripts/cut-wardrobe-stickers.mjs:720` **writes** them, and **nothing reads them** — not the
script, not `src/`. They are generator output with no consumer.

That is a real question about the generator, not a deletion candidate. Left alone.

---

# UNSAFE TO DETERMINE

**Nothing in this section may be deleted on the strength of anything in this report.** Each item
is either addressed by a path no static tool can follow, or lives inside a protected file.

## U1 — Assets under constructed paths (~30 files, ~48 MB)

Everything under `public/images/visualiser/textures/wardrobes/` reached by expression:

| Construction | Site | What it can reach |
|---|---|---|
| `` `${DIR}/${entry.file}` `` | `wardrobes.ts:370`, `:490` | the ten `*-white-*.png` cut-outs, via the `WARDROBE_CUTOUTS` manifest |
| `` `${DIR}/finishes/${slug}.jpg` `` | `wardrobes.ts:304-306` | `natural-oak`, `antico-oak`, `notaio-walnut` |
| `` encodeURI(`${DIR}/${model.legacyFile}`) `` | `wardrobes.ts:714` | the six named stickers (see L3) |

**A file here can be loaded at runtime while appearing in no source file at all.** The static
reference count is not evidence about them in either direction.

**This is the class `audit:assets` was built to protect and currently does not** — see the
opening section. Until that guard is repointed at
`/images/visualiser/textures/wardrobes/`, treat every number that tool prints about wardrobe
assets as unverified.

`npm run check:wardrobe-assets` is the trustworthy check here — it reads the manifest and asserts
every named file is on disk. It passes: *10 cut-outs, 5 models claiming artwork, 6 legacy
stickers.* Note it proves **manifest → disk**, not **disk → manifest**; it cannot find an orphan.

## U2 — Inside the four protected IP files

**Reported and stopped, exactly as instructed. No edit proposed.**

| Finding | File | Detail |
|---|---|---|
| `applyHomography` unused | `homography.ts:64` (**E-01**) | Zero references repo-wide. The file's other export is used; this one is not |
| `UsePhotoUploadResult` type unused | `usePhotoUpload.ts:6` (**E-04**) | Exported interface, no consumer |
| Unreachable `switch` branches | `Canvas2DBlindRenderer.tsx:177-181` (**E-02**) | `case 'sheer'`, `'sheer-curtains'`, `'blockout-curtains-light'`, `'blockout-curtains-dark'`. **The file's own comment already says so:** *"None of these blind types is reachable (the picker offers blockout, sunscreen, lightfilter and dual, and curtains render through Canvas2DCurtainRenderer, not this file)."* The paths they return do resolve, so this is dead code, not a broken reference |
| 14-line self-clone | `CornerPinOverlay.tsx:142 ↔ :187` (**E-03**) | jscpd finding, inside a protected file |

E-01–E-04 exempt these files from **size and complexity limits**; they are not scope exclusions.
But their terms — *"PATH REFERENCES MAY BE UPDATED. BEHAVIOUR MAY NOT"* — put every item above
out of reach of a dead-code pass. **They stop here.**

## U3 — `assets-source/` — out of scope for deletion, and not for the reason you'd expect

51 files, **85 MB**. `.gitignore:57` ignores `/assets-source/` wholesale.

**It is not in the repository.** Nothing there is tracked, so there is no git history to recover
it from — which inverts your stated recovery model. Your instruction was *"git history is the
recovery path"*; for this directory **there is no git history**, and a deletion is unrecoverable.

Its contents are working masters — supplied renders, curtain reference plates, fabric
photographs, wardrobe reference — i.e. inputs to `scripts/` and to manual asset production, not
web assets. Two of its files were the source for images deleted earlier today.

**Recommendation: exclude `assets-source/` from this pass entirely.** If it needs pruning that is
a backup-and-archive job, not a dead-code deletion.

---

# DUPLICATION BASELINE (jscpd)

First run against this codebase. Structure has settled, so this is measuring something real.

| Format | Files | Lines | Clones | Duplicated lines |
|---|---:|---:|---:|---|
| javascript | 60 | 9,235 | 12 | 243 (2.63%) |
| typescript | 67 | 8,975 | 2 | 23 (0.26%) |
| tsx | 44 | 11,119 | 6 | 92 (0.83%) |
| **Total** | **171** | **29,329** | **20** | **358 (1.22%)** |

Tokens: 4,605 of 242,993 (**1.9%**). Settings: `--min-lines 8 --min-tokens 60`,
`rule-fixtures` excluded (they are deliberate duplicates that exist to prove lint rules fire).

**1.22% is a healthy number** and it is the first real measurement of §13's subject. Record it as
the Phase 6.4 baseline.

The twenty clones, largest first:

| Lines | Location A | Location B |
|---:|---|---|
| 52 | `VisualiserControls.tsx:898` | `VisualiserControls.tsx:782` |
| 34 | `BookInstallPage.tsx:254` | `ContactPage.tsx:163` |
| 33 | `BookInstallPage.tsx:254` | `ContactPage.tsx:164` |
| 27 | `render-baseline.mjs:158` | `render-baseline.mjs:121` |
| 26 | `VisualiserControls.tsx:754` | `VisualiserControls.tsx:436` |
| 21 | `cut-fabric-mask.mjs:558` | `cut-fabric-mask.mjs:384` |
| 21 | `VisualiserControls.tsx:877` | `VisualiserControls.tsx:754` |
| 19 | `HowItWorksPage.tsx:188` | `HowItWorksPage.tsx:150` |
| 17 | `ProductDetailPage.tsx:490` | `ProductDetailPage.tsx:305` |
| 15 | `create-checkout-session.ts:34` | `request-quote.ts:26` |
| 14 | `CornerPinOverlay.tsx:187` | `CornerPinOverlay.tsx:142` |
| 13 | `cut-fabric-mask.mjs:415` | `cut-fabric-mask.mjs:290` |
| 13 | `HowItWorksPage.tsx:212` | `HowItWorksPage.tsx:161` |
| 13 | `ProductDetailPage.tsx:245` | `HomePage.tsx:119` |
| 11 | `AboutPage.tsx:154` | `HowItWorksPage.tsx:289` |
| 10 | `render-baseline.mjs:149` | `render-baseline.mjs:112` |
| 10 | `cut-fabric-mask.mjs:442` | `cut-fabric-mask.mjs:310` |
| 10 | `ShopCard.tsx:474` | `ShopCard.tsx:446` |
| 10 | `wardrobeGeometry.ts:656` | `wardrobeGeometry.ts:533` |
| 9 | `cut-fabric-mask.mjs:434` | `cut-fabric-mask.mjs:302` |

**Three are worth a look and the rest are noise:**

1. **`BookInstallPage` ↔ `ContactPage`, 34 lines.** The largest *cross-file* clone and the only
   one spanning two features. This is **D-09** — the form-field setter — with more shared shape
   than that entry recorded. D-09 is open and waiting for booking to land in Phase 6; this
   measures it.
2. **`create-checkout-session.ts` ↔ `request-quote.ts`, 15 lines.** Two Netlify functions sharing
   env/validation preamble. A `shared-core` candidate, which is the D-03 argument again.
3. **`VisualiserControls.tsx`, 99 lines across three self-clones.** Intra-file repetition in one
   component — a local extraction, no architecture in it.

`ShopCard.tsx:446 ↔ :474` is the masked-hardware/fabric layer pair, which is inherent to the
technique. `CornerPinOverlay` is protected (U2).

---

# TOOLING — HOW THIS WAS RUN, AND WHAT IS NOT COMMITTED

**Neither `knip` nor `jscpd` was added to `package.json`.** Both ran via `npx`, so this pass added
no dependency and changed no file. If they are to become gates, that is a deliberate second step.

**knip needs a config or its output is unusable.** With defaults it reported 26 unused files —
including all 18 `tools/rule-fixtures/*`, which exist *precisely* to be unimported (they prove
lint rules fire) and would have been catastrophic to act on. The config used here lives at
`scratchpad/knip.json` and is reproduced below; **it belongs in the repo as `knip.json` if knip is
adopted**, because the next person to run `npx knip` with defaults gets the same wrong answer.

```json
{
  "entry": [
    "src/main.tsx", "netlify/functions/*.ts", "tools/*.mjs",
    "tools/eslint-rules/index.js", "tools/eslint-rules/verify.mjs",
    "scripts/*.mjs", "research.mjs", "eslint.config.js",
    "vite.config.ts", "tailwind.config.js", "postcss.config.js"
  ],
  "project": ["src/**/*.{ts,tsx}", "netlify/**/*.ts", "tools/**/*.{mjs,js}", "scripts/**/*.mjs"],
  "ignore": ["tools/rule-fixtures/**", "LEGACY/**", "dist/**"],
  "ignoreDependencies": ["autoprefixer", "postcss", "tailwindcss"]
}
```

`autoprefixer`, `postcss` and `tailwindcss` are ignored because they are resolved by
`postcss.config.js` / `tailwind.config.js` at build time rather than imported — knip reports them
as unused otherwise, and they are not.

**Install hooks:** the task asked specifically. `package.json` declares no `preinstall`,
`install` or `postinstall`, and **none of the 40 direct dependencies declares one either.**
Nothing here runs code at install time.

---

# SUGGESTED BATCHES

Ordered by risk. Nothing proceeds without your approval.

**Batch 1 — zero-risk, no behaviour anywhere (4 items)**
`LEGACY` (0-byte stray) · `@types/react-router-dom` · `isDevelopment` / `isProduction` and their
two re-exports.

**Batch 2 — dead components (2 files, 539 lines)**
`ProductCard.tsx` + `PhotoTile.tsx`, together. Gate: typecheck, build, baseline, and load
`/products` — `ShopCard` is the live path and must be unaffected.

**Batch 3 — `lucide-react`**
Dependency **and** the `vite.config.ts:31` exclusion, one commit. Gate: clean `npm ci` and build.

**Batch 4 — needs a proof first**
`@typescript-eslint/eslint-plugin` + `parser`. Remove, run `npm run lint`, require
0 errors / 618 warnings unchanged. Revert if it moves.

**Batch 5 — judgement, not mechanics**
The `ShopCard` timing constants and `catalogue/index.ts` barrel surface (L1c) — each deletes a
recorded design decision or an architectural front door. Worth deciding deliberately, not in bulk.

**Batch 6 — 5.3 MB of stickers, after a guard exists**
L3's four orphans. **Precondition: repoint `asset-audit.mjs:74` at the real texture directory
first**, so the tool that classifies them is telling the truth.

**Not scheduled:** everything in UNSAFE, `assets-source/`, the 42 unused types (L1d), and
`src/app/layouts/index.ts` (a §4 question).

**Recommended before any batch:** fix `asset-audit.mjs:74`. It is a one-line change, it is a live
fault in a safety check, and every asset decision below it is currently unverified.

---

# WHAT WOULD HAVE CAUGHT THE STALE GUARD

A note in the shape §0 asks for, since this is the second stale-guard finding in two days — the
render baseline read the wrong canvas, and now the asset audit tests a directory that no longer
exists. Both are checks that pass by looking at nothing.

**Neither was catchable by a rule that reads code.** The shared property is that a check's own
*input* went stale while the check kept reporting success. The condition that would catch both:

> A guard whose scope is expressed as a path prefix must assert that the prefix matches at least
> one file. A selector that matches nothing is a failing check, not a passing one.

That is enforceable, it is cheap, and it would have fired on `asset-audit.mjs:74` the day U4 moved
the textures.
