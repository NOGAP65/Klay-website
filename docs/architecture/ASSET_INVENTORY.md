# ASSET INVENTORY — every file in `public/`

**7 September 2026, snapshot at 88 files.** A concurrent session added two fabric masks during this run; the counts are as of assembly. Companion to `DEAD_CODE_REPORT.md`, produced after the four tool fixes and
the CERTAIN deletions. Dimensions are read from file headers; references are exact file and line,
and **comment-only mentions are separated from code references** — the audit tool counts both,
this does not.

---

## DELETIONS THIS PASS: NONE, AND THE REASON IS THE TOOL FIX

| Asked | Found | Why |
|---|---|---|
| Every unreferenced tracked asset in `public/` | **0** | The fixed `audit:assets` reports zero unreferenced |
| The 4 orphaned stickers, *if still orphaned* | **0** | They are not orphaned. See below |
| Every empty directory | **0** | Only `.claude/worktrees`, which is tooling, not repo content — and git cannot track an empty directory in any case |

**Before the guard was fixed this pass would have deleted 5.3 MB of live build inputs.** That is
the concrete value of doing item 3 first.

### The four "orphaned" stickers are script inputs — my earlier finding was wrong

`DEAD_CODE_REPORT.md` §L3 proposed deleting `Forma Wardrobe {2.9, 4.9, 5.0, 8.0} Sticker.png`
(5.3 MB), arguing the reachable set was a closed list of six `legacyFile` literals.

**That reasoning missed how the files are actually consumed.**
`scripts/cut-wardrobe-stickers.mjs:697`:

```js
const files = readdirSync(DIR).filter(f => /^Forma Wardrobe .+ Sticker\.png$/.test(f));
```

**A readdir glob, not a name.** All ten stickers match it. They are the *source artwork* the
cut-outs are generated from — which is why the idiosyncratic dimensions pair off exactly:

| Sticker (source) | Cut-out (generated) | Dimensions |
|---|---|---|
| `Forma Wardrobe 4.0 Sticker.png` | `4.0-white-front.png` | both **1265×1243** |
| `Forma Wardrobe 5.0 Sticker.png` | `5.0-white-front.png` | both **1307×1203** |
| `Forma Wardrobe 7.0L Sticker.png` | `7.0L-white-interior.png` | both **1269×1240** |
| `Forma Wardrobe 9.0L Sticker.png` | `9.0L-white-interior.png` | both **1448×1086** |

Under your own rule — *anything `scripts/` or `tools/` uses is in use* — **all ten are in use.**
Deleting four would silently change what the generator produces on its next run.

**Three findings in that report have now been wrong.** The two route constants, the layouts
barrel caveat, and this. All three were static-analysis conclusions that missed a dynamic
consumer or misread a rule; the pattern is worth naming, because it is the same shape as the
guard bug — *a conclusion drawn from a question that could not see the answer.*

---

## WHAT A SCRIPT CANNOT SEE — FLAGGED FOR YOUR EYE

Everything below is **referenced and live**. These are editorial calls, not dead code.

### 1. `sheer_produced.png` — 3.6 MB, reachable only from dead code

| | |
|---|---|
| Size | **3,620 KB**, 1254×1254 — the second-largest file in `public/` |
| Code reference | `Canvas2DBlindRenderer.tsx:178` |
| The problem | **That is an unreachable `switch` branch**, and the file says so three lines above: *"None of these blind types is reachable… curtains render through Canvas2DCurtainRenderer, not this file."* |
| The live curtain renderer | uses `sheer_weave.png` (1,053 KB) instead, since the D-13 reconciliation |

So 3.6 MB ships to serve a branch that never executes. **Not deleted: the only reference is
inside `Canvas2DBlindRenderer.tsx`, which is E-02.** Removing the asset would leave a protected
file pointing at a missing path, and I cannot edit that file to fix it. **Your call.**

### 2. `Bottom_bar.jpg` — 409 KB, referenced only by a comment

| | |
|---|---|
| Size | **409 KB**, 4944×533 |
| Only mention | `Canvas2DBlindRenderer.tsx:1785` — *"matching product photo Bottom_bar.jpg"* |
| Reality | The rail is drawn **procedurally** by `drawBottomRail`. The photograph is imitated, never loaded |

I verified no constructed path reaches it: every `${TEXTURE_ROOT}/…` in that file goes to
`Blockout`, `Sunscreen`, `Light-filter` or `curtains`. **The audit tool calls this file "live"
because its basename appears in a comment** — a real limitation of basename matching, and this
is the only file in `public/` it affects.

Note `Canvas2DBlindRenderer.tsx:151` still lists `Bottom_bar` among the capitalised path segments
"the segments below still have to match" — but no segment below uses it. That comment is stale,
and it is in a protected file.

### 3. Three product images named after retired SKUs

| File | Size | Used as |
|---|---:|---|
| `phoenix-blockout.png` | 1,933 KB | `BLOCKOUT_IMAGE`, `products.ts:49` |
| `soleil-sunscreen.png` | 2,281 KB | `SUNSCREEN_IMAGE`, `products.ts:50` |
| `eclipse-dual-roller.png` | 2,078 KB | `DUAL_IMAGE`, `products.ts:51` |

**Phoenix, Soleil and Eclipse are not products any more.** The range is Dusk, Veil, Duo and Haze.
These are live images whose *filenames* name a catalogue that was replaced — 6.3 MB of correctly
used, misleadingly named artwork. Whether the pictures are also the wrong pictures is the
question I cannot answer by reading; they are the ones the product pages show today.

### 4. `logo_full.png` — 881 KB at 2000×2000 for a nav logo

`Nav.tsx:265` uses it alongside `klay-logo.png` (39 KB, 560×270) at `Nav.tsx:261`. **One nav, two
logo files, a 22× size difference.** Likely a superseded master that stayed wired up.

### 5. Same name, two folders — and they are NOT the same file

`images/categories/wardrobes.jpg` (162 KB) and `images/range/wardrobes.jpg` (171 KB) are both
1280×720 and share a filename. **I hashed them: different files.** Both live, both used. Flagged
only because the name collision invites the assumption they are one image.

### 6. Sets that look like duplicates and are not

Recorded so they can be skipped: the four `process/step-*.png` (all 1672×941), the three
`rooms/room-{3,4,5}.png` (all 1920×1072), the four `openings/opening-*.jpeg` (all 1536×1024), and
`klay-logo.png` / `klay-logo-light.png` (both 560×270 — light and dark variants). Each is a
deliberate set.

### 7. The biggest single opportunity, and it is not a deletion

**The ten source stickers are 15.1 MB of `public/`, and the browser needs six of them.** Four are
build inputs only — used by the generator, never fetched. They are in `public/` because that is
where the generator reads and writes, not because the site serves them.

Moving the four generator-only stickers out of `public/` would cut the deployed bundle by ~5.4 MB
with no runtime change. **That is a build-layout change, not a deletion**, so it is outside this
pass — and it must not be `assets-source/`, which is gitignored.

---

## THE FULL INVENTORY

**88 files, 64.2 MB total.**

### `/ (root)` — 1 files, 2.5 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `hero_video.mp4` | 2543 KB | - | `src/features/home/components/Hero.tsx:40` |

### `/images/brand` — 4 files, 1.0 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `logo_full.png` | 881 KB | 2000x2000 | `src/app/layouts/Nav.tsx:265` |
| `klay-logo-light.png` | 39 KB | 560x270 | `src/app/layouts/Footer.tsx:135`, `src/app/layouts/Nav.tsx:262` +1 |
| `klay-logo.png` | 39 KB | 560x270 | `src/app/layouts/Nav.tsx:261`, `src/app/layouts/Nav.tsx:274` |
| `klay-mark.png` | 14 KB | 200x283 | `index.html:5` |

### `/images/categories` — 2 files, 0.3 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `wardrobes.jpg` | 162 KB | 1280x720 | `src/features/catalogue/constants.ts:315`, `src/features/catalogue/constants.ts:335` |
| `indoor.jpg` | 150 KB | 1280x720 | `src/features/catalogue/components/ProductsPage.tsx:164`, `src/features/catalogue/constants.ts:255` |

### `/images/fabrics` — 19 files, 1.3 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `zip-guide-systems-mesh.webp` | 140 KB | 900x768 | `src/features/catalogue/fabricShots.ts:75` |
| `plantation-shutters.webp` | 130 KB | 900x900 | `src/features/catalogue/constants.ts:237`, `src/features/catalogue/fabricShots.ts:68` |
| `folding-arm-awnings.webp` | 127 KB | 900x768 | `src/features/catalogue/constants.ts:273`, `src/features/catalogue/fabricShots.ts:67` |
| `roller-blinds-sunscreen.webp` | 116 KB | 900x900 | `src/features/catalogue/fabricShots.ts:72` |
| `venetian-blinds.webp` | 112 KB | 900x900 | `src/features/catalogue/fabricShots.ts:74` |
| `roller-blinds-dual.webp` | 105 KB | 900x900 | `src/features/catalogue/fabricShots.ts:70` |
| `curtains-blockout.webp` | 101 KB | 900x900 | `src/features/catalogue/fabricShots.ts:65` |
| `curtains-sheer.webp` | 98 KB | 900x900 | `src/features/catalogue/fabricShots.ts:66` |
| `roller-shutters-aluminium.webp` | 82 KB | 900x768 | `src/features/catalogue/fabricShots.ts:73` |
| `roller-blinds-lightfilter.webp` | 80 KB | 900x900 | `src/features/catalogue/fabricShots.ts:71` |
| `roller-blinds-blockout.webp` | 78 KB | 900x900 | `src/features/catalogue/fabricShots.ts:69` |
| `folding-arm-awnings.mask.png` | 27 KB | 900x768 | `src/features/catalogue/fabricShots.ts:67` |
| `folding-arm-awnings.hardware.png` | 26 KB | 900x768 | `src/features/catalogue/fabricShots.ts:67` |
| `plantation-shutters.mask.png` | 20 KB | 900x900 | `src/features/catalogue/fabricShots.ts:68` |
| `roller-blinds.mask.png` | 20 KB | 900x900 | `src/features/catalogue/fabricShots.ts:69`, `src/features/catalogue/fabricShots.ts:70` +2 |
| `curtains.hardware.png` | 19 KB | 900x900 | `src/features/catalogue/fabricShots.ts:65`, `src/features/catalogue/fabricShots.ts:66` |
| `curtains.mask.png` | 19 KB | 900x900 | `src/features/catalogue/fabricShots.ts:65`, `src/features/catalogue/fabricShots.ts:66` |
| `roller-blinds.hardware.png` | 19 KB | 900x900 | `src/features/catalogue/fabricShots.ts:69`, `src/features/catalogue/fabricShots.ts:70` +2 |
| `venetian-blinds.mask.png` | 19 KB | 900x900 | `src/features/catalogue/fabricShots.ts:74` |

### `/images/process` — 4 files, 6.8 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `step-3-manufacture.png` | 1931 KB | 1672x941 | `src/features/marketing/constants.ts:115` |
| `step-4-install.png` | 1890 KB | 1672x941 | `src/features/marketing/constants.ts:124` |
| `step-2-measure.png` | 1651 KB | 1672x941 | `src/features/marketing/constants.ts:106` |
| `step-1-configure.png` | 1525 KB | 1672x941 | `src/features/marketing/constants.ts:97` |

### `/images/products` — 10 files, 6.7 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `soleil-sunscreen.png` | 2281 KB | 1254x1254 | `src/features/catalogue/products.ts:50`, `src/features/home/components/SocialProof.tsx:49` |
| `eclipse-dual-roller.png` | 2078 KB | 1254x1254 | `src/features/catalogue/products.ts:51` |
| `phoenix-blockout.png` | 1933 KB | 1254x1254 | `src/features/catalogue/products.ts:49` |
| `folding-arm-awnings.webp` | 127 KB | 900x768 | `src/features/catalogue/constants.ts:273`, `src/features/catalogue/fabricShots.ts:67` |
| `pleated-flyscreens.webp` | 106 KB | 1100x619 | `src/features/catalogue/constants.ts:305` |
| `roller-shutters.webp` | 104 KB | 1100x619 | `src/features/catalogue/constants.ts:295` |
| `zip-guide-systems.webp` | 71 KB | 1100x619 | `src/features/catalogue/constants.ts:285` |
| `honeycomb-blinds.webp` | 63 KB | 1100x619 | `src/features/catalogue/constants.ts:199` |
| `plantation-shutters.webp` | 61 KB | 1100x733 | `src/features/catalogue/constants.ts:237`, `src/features/catalogue/fabricShots.ts:68` |
| `frameless-shower-screens.webp` | 45 KB | 1100x619 | `src/features/catalogue/constants.ts:346` |

### `/images/range` — 2 files, 0.3 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `wardrobes.jpg` | 171 KB | 1280x720 | `src/features/catalogue/constants.ts:315`, `src/features/catalogue/constants.ts:335` |
| `sheer-curtains.jpg` | 149 KB | 1280x720 | `src/features/home/components/RecommendationBanner.tsx:52` |

### `/images/rooms` — 6 files, 6.9 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `room-living.png` | 2181 KB | 1672x941 | `src/features/home/components/Hero.tsx:46`, `src/features/marketing/components/AboutPanel.tsx:28` |
| `room-kitchen.png` | 1898 KB | 1672x941 | `src/features/catalogue/constants.ts:184`, `src/features/home/components/SocialProof.tsx:51` |
| `room-3.png` | 869 KB | 1920x1072 | `src/features/home/components/SocialProof.tsx:50`, `src/features/visualiser/KlayConfigurator.tsx:716` |
| `room-4.png` | 867 KB | 1920x1072 | `src/features/home/components/SocialProof.tsx:48`, `src/features/visualiser/KlayConfigurator.tsx:716` |
| `room-5.png` | 832 KB | 1920x1072 | `src/features/marketing/components/AboutPage.tsx:44`, `src/features/visualiser/KlayConfigurator.tsx:716` |
| `hero-room.jpg` | 375 KB | 1920x1694 | `src/features/catalogue/components/ProductsPage.tsx:145`, `src/features/home/components/SocialProof.tsx:55` |

### `/images/visualiser` — 1 files, 2.0 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `preview.png` | 2053 KB | 1254x1254 | `src/features/visualiser/KlayConfigurator.tsx:778` |

### `/images/visualiser/openings` — 4 files, 0.9 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `opening-1500.jpeg` | 241 KB | 1536x1024 | `src/features/visualiser/KlayConfigurator.tsx:748`, `src/features/visualiser/KlayConfigurator.tsx:791` |
| `opening-2400.jpeg` | 240 KB | 1536x1024 | `src/features/visualiser/KlayConfigurator.tsx:751` |
| `opening-2100.jpeg` | 229 KB | 1536x1024 | `src/features/visualiser/KlayConfigurator.tsx:750` |
| `opening-1800.jpeg` | 194 KB | 1536x1024 | `src/features/visualiser/KlayConfigurator.tsx:749` |

### `/images/visualiser/textures/Blockout` — 1 files, 0.1 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `Blockout_fabric.png` | 123 KB | 512x512 | `src/features/visualiser/Canvas2DBlindRenderer.tsx:163`, `src/features/visualiser/Canvas2DBlindRenderer.tsx:168` +1 |

### `/images/visualiser/textures/Bottom_bar` — 1 files, 0.4 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `Bottom_bar.jpg` | 409 KB | 4944x533 | *comment only:* `src/features/visualiser/Canvas2DBlindRenderer.tsx:1785` |

### `/images/visualiser/textures/Light-filter` — 1 files, 0.1 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `light_filter.png` | 100 KB | 512x512 | `src/features/visualiser/Canvas2DBlindRenderer.tsx:165` |

### `/images/visualiser/textures/Sunscreen` — 1 files, 0.2 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `Sunscreen.png` | 156 KB | 512x512 | `src/features/visualiser/Canvas2DBlindRenderer.tsx:164` |

### `/images/visualiser/textures/curtains` — 3 files, 7.9 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `sheer_produced.png` | 3620 KB | 1254x1254 | `src/features/visualiser/Canvas2DBlindRenderer.tsx:178` |
| `Blockout_produced.png` | 3458 KB | 1254x1254 | `src/features/visualiser/Canvas2DBlindRenderer.tsx:180`, `src/features/visualiser/Canvas2DCurtainRenderer.tsx:1689` |
| `sheer_weave.png` | 1053 KB | 1024x1024 | `src/features/visualiser/Canvas2DCurtainRenderer.tsx:1705` |

### `/images/visualiser/textures/wardrobes` — 20 files, 26.4 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `Forma Wardrobe 12.0U Sticker.png` | 1834 KB | 1254x1254 | `scripts/cut-wardrobe-stickers.mjs:697` *(readdir glob)* |
| `Forma Wardrobe 9.0L Sticker.png` | 1743 KB | 1448x1086 | `scripts/cut-wardrobe-stickers.mjs:697` *(readdir glob)* |
| `Forma Wardrobe 6.0 Sticker.png` | 1646 KB | 1254x1254 | `scripts/cut-wardrobe-stickers.mjs:697` *(readdir glob)* |
| `12.0U-white-interior.png` | 1635 KB | 1254x1254 | `src/features/visualiser/wardrobeCutouts.ts:30` |
| `Forma Wardrobe 7.0L Sticker.png` | 1609 KB | 1269x1240 | `scripts/cut-wardrobe-stickers.mjs:697` *(readdir glob)* |
| `9.0L-white-interior.png` | 1497 KB | 1448x1086 | `src/features/visualiser/wardrobeCutouts.ts:147` |
| `Forma Wardrobe 4.0 Sticker.png` | 1437 KB | 1265x1243 | `scripts/cut-wardrobe-stickers.mjs:697` *(readdir glob)* |
| `Forma Wardrobe 5.0 Sticker.png` | 1401 KB | 1307x1203 | `scripts/cut-wardrobe-stickers.mjs:697` *(readdir glob)* |
| `Forma Wardrobe 3.0 Sticker.png` | 1387 KB | 1254x1254 | `scripts/cut-wardrobe-stickers.mjs:697` *(readdir glob)* |
| `Forma Wardrobe 8.0 Sticker.png` | 1380 KB | 1254x1254 | `scripts/cut-wardrobe-stickers.mjs:697` *(readdir glob)* |
| `Forma Wardrobe 4.9 Sticker.png` | 1360 KB | 1254x1254 | `scripts/cut-wardrobe-stickers.mjs:697` *(readdir glob)* |
| `7.0L-white-interior.png` | 1350 KB | 1269x1240 | `src/features/visualiser/wardrobeCutouts.ts:121` |
| `6.0-white-front.png` | 1324 KB | 1254x1254 | `src/features/visualiser/wardrobeCutouts.ts:108` |
| `Forma Wardrobe 2.9 Sticker.png` | 1277 KB | 1254x1254 | `scripts/cut-wardrobe-stickers.mjs:697` *(readdir glob)* |
| `4.0-white-front.png` | 1110 KB | 1265x1243 | `src/features/visualiser/wardrobeCutouts.ts:69`, `scripts/cut-wardrobe-stickers.mjs:618` |
| `8.0-white-front.png` | 1091 KB | 1178x1234 | `src/features/visualiser/wardrobeCutouts.ts:134` |
| `5.0-white-front.png` | 1073 KB | 1307x1203 | `src/features/visualiser/wardrobeCutouts.ts:95` |
| `3.0-white-front.png` | 993 KB | 1254x1254 | `src/features/visualiser/wardrobeCutouts.ts:56`, `scripts/cut-wardrobe-stickers.mjs:601` +3 |
| `4.9-white-angle.png` | 952 KB | 1254x1254 | `src/features/visualiser/wardrobeCutouts.ts:82` |
| `2.9-white-front.png` | 922 KB | 1254x1254 | `src/features/visualiser/wardrobeCutouts.ts:43` |

### `/images/visualiser/textures/wardrobes/contents` — 5 files, 0.2 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `hanging-long.png` | 89 KB | 160x423 | `scripts/cut-wardrobe-stickers.mjs:601` |
| `hanging-short.png` | 60 KB | 160x294 | `scripts/cut-wardrobe-stickers.mjs:616` |
| `box.png` | 23 KB | 191x76 | `scripts/cut-wardrobe-stickers.mjs:622` |
| `stack.png` | 14 KB | 154x49 | `scripts/cut-wardrobe-stickers.mjs:618` |
| `shoes.png` | 12 KB | 104x68 | `scripts/cut-wardrobe-stickers.mjs:621` |

### `/images/visualiser/textures/wardrobes/finishes` — 3 files, 0.2 MB

| File | Size | Dimensions | Referenced by |
|---|---:|---|---|
| `notaio-walnut.jpg` | 80 KB | 512x1024 | `src/features/visualiser/wardrobes.ts:306` |
| `antico-oak.jpg` | 72 KB | 512x1024 | `src/features/visualiser/wardrobes.ts:305` |
| `natural-oak.jpg` | 70 KB | 512x1024 | `src/features/visualiser/wardrobes.ts:304` |
