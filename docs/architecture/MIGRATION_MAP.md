# KLAY — ARCHITECTURE MIGRATION MAP

**Phase 0. Reconnaissance only. No source file was touched.**

| | |
|---|---|
| Branch | `refactor/architecture-migration`, cut from `main` |
| Base commit | `8708752` — `9e3af32` cherry-picked onto `main` as instructed |
| Read at | 2026-08-31, 11:40–12:30 local |
| Governing document | `docs/architecture/SPECIFICATION.md` — **NOT PRESENT. See the blocker below.** |
| Reference | `docs/STATE_OF_BUILD_2026-08.md`. **Superseded by this document** where numbers differ — every figure here is freshly measured against the current tree. |

---

## BLOCKER — THE SPECIFICATION IS STILL NOT IN THE REPOSITORY

You said it was committed. It is not here, and I checked thoroughly before saying so:

```
git fetch --all                                    → exit 0, nothing new
docs/architecture/                                 → directory does not exist
find . -iname '*SPECIFICATION*' (excl node_modules)→ no match on disk
git ls-tree -r <every ref> | grep -i specification → no match in any tree
   refs checked: main, origin/main, docs/state-of-build-2026-08,
                 origin/docs/state-of-build-2026-08, rebuild-products-section
git log --all --diff-filter=A -- '*SPECIFICATION*' → never added, on any branch, ever
git stash list                                     → empty
```

`origin/main` is at `00bd43d`, timestamped 11:19:31, identical to local `main` before my
cherry-pick. There is no newer commit anywhere to pull.

**Most likely:** it was written in a different working tree, or committed on a machine that
has not pushed.

### What this blocks, precisely

| Phase 0 item | Status |
|---|---|
| 0.1 inventory — path, lines, description | **Done** |
| 0.1 inventory — Proposed target path, Layer | **Provisional.** The work order names the five layers and Phases 3–4 give the folder anatomy, so I have filled these columns from the work order alone. Every row is marked `NEEDS SPEC` in Confidence where the specification would be the deciding authority. |
| 0.2 shared-layer test | **Done** — against the criterion as stated in the work order ("could this be lifted into an unrelated project unmodified?"), not against §2's full definition. |
| 0.3 import graph — cycles, deep relatives, fan-in | **Done** |
| 0.3 — "which rule it breaks" | **Blocked.** I can list every cross-directory import; I cannot say which specification rule each violates. |
| 0.4 size violations | **Done** — thresholds (300 lines / 60 functions) are given in the work order. |
| 0.5 naming — spelling, verbs, abbreviations, booleans | **Done** — the permitted abbreviation list is given in the work order. |
| 0.5 — banned filenames | **Done against a conventional list.** The specification's actual list may differ; result is zero either way. |
| 0.6 token baseline | **Done** |
| 0.7 environment surface | **Done** |
| 0.8 phase ordering | **Done** |
| 0.9 risk register | **Done** |

**Nothing below depends on the specification for its numbers.** When the specification
arrives, the only section that changes is the Layer/Target columns of 0.1 — the measurements
stand.

---

## THE TREE MOVED AGAIN DURING THIS PHASE

Reported for the record, since it changes two things in the map.

At 11:40 `src/visualiser-lab/` held 8 files, byte-identical to `src/visualiser/`. By 12:30
it held **11**, and the fork has genuinely diverged for the first time:

| File | Lines | In `src/visualiser/`? |
|---|---:|---|
| `src/visualiser-lab/wardrobes.ts` | 302 | **No — lab only** |
| `src/visualiser-lab/Canvas2DWardrobeRenderer.tsx` | 131 | **No — lab only** |
| `src/visualiser-lab/useVisualiserStore.ts` | 420 | Yes, but 21 lines longer than the 399-line original |

`public/images/Textures/wardrobes/` also appeared — 10 Forma wardrobe PNGs, untracked,
mtime 12:24.

This is the fork doing exactly what it was created for, and it materially changes my
recommendation on `src/visualiser-lab/` (see the end of this document). It also means the
frozen zone is not merely excluded from migration — it is **actively growing**, and any
figure in this map that includes it has a shelf life.

---

## 0.1 CURRENT-STATE INVENTORY

**64 files, 29,623 lines.** Of those, **18 files / 17,250 lines (58% of `src/`) are in the
frozen zone** and **46 files / 12,373 lines (42%) are movable in Phases 2–4.**

Frozen per your instruction: `src/visualiser/`, `src/visualiser-lab/`, and
`KlayConfigurator.tsx`. Marked **FROZEN** in the Order column; they migrate last.

`Imp` = number of other files importing it.

### `src/` root

| Current path | Lines | What it does | Proposed target | Layer | Confidence | Order |
|---|---:|---|---|---|---|---|
| `src/main.tsx` | 13 | Mounts React into `#root` inside `StrictMode` + `BrowserRouter`. | `src/main.tsx` (stays) | app | CERTAIN | P5 |
| `src/App.tsx` | 118 | 16 `<Route>` declarations + `ScrollToHash`. | `app/router.tsx` + `app/App.tsx` | app | LIKELY | P5 |
| `src/theme.ts` | 563 | Every colour, size, space, radius, shadow, motion constant. Imp **35**. | `ds/tokens/*` | design-system | CERTAIN | P2 |
| `src/vite-env.d.ts` | 2 | Vite ambient types. | stays at `src/` | config | CERTAIN | P1 |
| `src/store.ts` | 16 | `scrollY` (live) + `blindHeight` (dead). Imp 4. | **NEEDS DECISION** — see note A | shared *or* feature | NEEDS DECISION | P3 |

### `src/routes/`

| Current path | Lines | What it does | Proposed target | Layer | Confidence | Order |
|---|---:|---|---|---|---|---|
| `src/routes/legacyRedirects.tsx` | 67 | Redirects the five retired catalogue URLs to the shop or a product. | `app/routes/legacyRedirects.tsx` | app | LIKELY | P5 |

### `src/pages/` — 12 files, 3,754 lines

Each becomes the entry component of a feature, or moves under `app/` if it is a shell.

| Current path | Lines | What it does | Proposed target | Layer | Confidence | Order |
|---|---:|---|---|---|---|---|
| `src/pages/HomePage.tsx` | 214 | Composes ten homepage sections; publishes scroll position. | `features/home/components/HomePage.tsx` | feature:home | LIKELY | P4-6 |
| `src/pages/ProductsPage.tsx` | 646 | The shop: 14 items, four-facet filter rail, `?category=` preselect. | `features/catalogue/components/ProductsPage.tsx` | feature:catalogue | LIKELY | P4-3 |
| `src/pages/ProductDetailPage.tsx` | 538 | One roller product, full visualiser embed, specs, FAQs, cart + quote CTAs. | `features/catalogue/components/ProductDetailPage.tsx` | feature:catalogue | NEEDS DECISION — note B | P4-3 |
| `src/pages/CartPage.tsx` | 473 | Cart lines, total, nine-field form. **Submit handler is `alert()`.** | `features/cart/components/CartPage.tsx` | feature:cart | LIKELY | P4-4 |
| `src/pages/BookInstallPage.tsx` | 548 | `/book`. Prices from URL params, posts to the two real endpoints. | `features/booking/components/BookInstallPage.tsx` | feature:booking | CERTAIN | P4-7 |
| `src/pages/BookingConfirmedPage.tsx` | 176 | Stripe return URL; polls `/api/order-status` six times. | `features/booking/components/BookingConfirmedPage.tsx` | feature:booking | CERTAIN | P4-7 |
| `src/pages/ContactPage.tsx` | 257 | Enquiry form → `/api/request-quote` with placeholder blind fields. | `features/booking/components/ContactPage.tsx` | feature:booking | NEEDS DECISION — note C | P4-7 |
| `src/pages/AboutPage.tsx` | 177 | Company page. Two of its four figures derive from the catalogue. | `features/marketing/components/AboutPage.tsx` | feature:marketing | LIKELY | P4-1 |
| `src/pages/HowItWorksPage.tsx` | 310 | Four steps + six FAQs. | `features/marketing/components/HowItWorksPage.tsx` | feature:marketing | LIKELY | P4-1 |
| `src/pages/NotFoundPage.tsx` | 67 | 404. | `app/routes/NotFoundPage.tsx` | app | LIKELY | P5 |
| `src/pages/VisualiserPage.tsx` | 125 | Standalone visualiser; hostname allowlist gate. | `features/visualiser/components/VisualiserPage.tsx` | feature:visualiser | CERTAIN | **FROZEN** |
| `src/pages/VisualizerLabPage.tsx` | 225 | The `/visualizer` sandbox route. | **NEEDS DECISION** — see the recommendation at the end | feature:visualiser | NEEDS DECISION | **FROZEN** |

### `src/components/` — 8 shared-ish components, 1,754 lines

| Current path | Lines | Imp | What it does | Proposed target | Layer | Confidence | Order |
|---|---:|---:|---|---|---|---|---|
| `src/components/Nav.tsx` | 514 | 12 | Fixed top bar, four links, cart badge, mobile drawer. | `app/layouts/components/Nav.tsx` | app | NEEDS DECISION — note D | P5 |
| `src/components/Footer.tsx` | 207 | 10 | Four columns, product links derived from `PRODUCTS`. | `app/layouts/components/Footer.tsx` | app | NEEDS DECISION — note D | P5 |
| `src/components/FormField.tsx` | 148 | 2 | The one controlled input: label, error, ARIA, focus tint. Exports `DANGER`. | `ds/primitives/Field.tsx` | design-system | LIKELY | P2 |
| `src/components/Honeypot.tsx` | 40 | 2 | Off-screen bot-trap field. | `features/booking/components/Honeypot.tsx` | feature:booking | LIKELY | P4-7 |
| `src/components/Turnstile.tsx` | 126 | 2 | Lazy-loads Cloudflare Turnstile; returns `null` with no site key. | `features/booking/components/Turnstile.tsx` | feature:booking | NEEDS DECISION — note E | P4-7 |
| `src/components/ProductCard.tsx` | 107 | 1 | Adapter: catalogue item → `PhotoTile`. | `features/catalogue/components/ProductCard.tsx` | feature:catalogue | LIKELY | P4-3 |
| `src/components/ProductGlyph.tsx` | 422 | 2 | Eleven hand-drawn SVG product mechanisms. | `features/catalogue/components/ProductGlyph.tsx` | feature:catalogue | LIKELY | P4-3 |
| `src/components/FilterRail.tsx` | 190 | 1 | The shop's four facet groups, tri-state checkboxes, live counts. | `features/catalogue/components/FilterRail.tsx` | feature:catalogue | CERTAIN | P4-3 |

### `src/components/home/` — 11 files, 4,565 lines

| Current path | Lines | Imp | What it does | Proposed target | Layer | Confidence | Order |
|---|---:|---:|---|---|---|---|---|
| `src/components/home/primitives.tsx` | 810 | 10 | `CtaButton`, `CtaLink`, `SectionBand`, `PhotoTile`, `useHover`, `scrollToId`, `TILE_GAP`. | **SPLIT** — note F | design-system + feature:home | NEEDS DECISION | P2 / P4-6 |
| `src/components/home/RangeRow.tsx` | 1,137 | 1 | Four hero cards; a card's slot widens and a configurator slides in beside it. | `features/home/components/RangeRow.tsx` | feature:home | LIKELY | P4-6 |
| `src/components/home/VisualiserShowcase.tsx` | 699 | 1 | Homepage visualiser embed + window count + job total + **Buy Now → `/cart`**. | `features/home/components/VisualiserShowcase.tsx` | feature:home | NEEDS DECISION — note G | P4-6 |
| `src/components/home/RangeConfigurator.tsx` | 380 | 1 | Five-field panel inside a range card. | `features/home/components/RangeConfigurator.tsx` | feature:home | LIKELY | P4-6 |
| `src/components/home/RecommendationBanner.tsx` | 267 | 1 | Charcoal banner stating the four steps. | `features/home/components/` | feature:home | CERTAIN | P4-6 |
| `src/components/home/StepsBar.tsx` | 256 | 2 | 54px marquee of the four steps; links to `/how-it-works`. | `features/home/components/` | feature:home | LIKELY | P4-6 |
| `src/components/home/Hero.tsx` | 231 | 1 | Full-bleed video hero. | `features/home/components/` | feature:home | CERTAIN | P4-6 |
| `src/components/home/SocialProof.tsx` | 221 | 1 | Five-tile install strip. Imagery is placeholder by its own header. | `features/home/components/` | feature:home | CERTAIN | P4-6 |
| `src/components/home/AboutPanel.tsx` | 211 | 1 | 50/50 panel about Klay. | `features/home/components/` | feature:home | CERTAIN | P4-6 |
| `src/components/home/Testimonials.tsx` | 201 | 1 | Marquee of five reviews. | `features/home/components/` | feature:home | CERTAIN | P4-6 |
| `src/components/home/TrustTicker.tsx` | 152 | 2 | Six credentials moving above the nav. | `features/home/components/` | feature:home | LIKELY | P4-6 |

### `src/data/` — 4 files, 1,077 lines

| Current path | Lines | Imp | What it does | Proposed target | Layer | Confidence | Order |
|---|---:|---:|---|---|---|---|---|
| `src/data/products.ts` | 245 | 12 | 4 roller SKUs, 12-row SKU table, 14 blind colours, 17 curtain colours, 3 hardware hexes. | **SPLIT** — note H | feature:catalogue | NEEDS DECISION | P4-3 |
| `src/data/catalogue.ts` | 395 | 5 | The 14 products, three groups, and the whole facet model. | `features/catalogue/constants.ts` + `features/catalogue/lib/facets.ts` | feature:catalogue | LIKELY | P4-3 |
| `src/data/configOptions.ts` | 308 | 2 | What each product lets you choose; prices a selection; builds a cart line. | **SPLIT** — note I | feature:catalogue + feature:cart | NEEDS DECISION | P4-3 |
| `src/data/steps.ts` | 129 | 3 | Design / Measure / Make / Install + their photographs. | `features/marketing/constants.ts` | feature:marketing | LIKELY | P4-1 |

### `src/lib/`, `src/hooks/`, `src/store/`

| Current path | Lines | Imp | What it does | Proposed target | Layer | Confidence | Order |
|---|---:|---:|---|---|---|---|---|
| `src/lib/pricing.ts` | 192 | 11 (+4 from `netlify/`) | The only place money is worked out. Runs in **both** runtimes. | **NEEDS DECISION** — note J | shared | NEEDS DECISION | P3 |
| `src/lib/api.ts` | 87 | 2 | Browser side of the two booking endpoints. Sends no price. | `features/booking/api/booking.ts` | feature:booking | LIKELY | P4-7 |
| `src/lib/bookingLink.ts` | 34 | 4 | Builds the `/book?…` URL from a configuration. | **NEEDS DECISION** — note K | feature:booking | NEEDS DECISION | P4-7 |
| `src/hooks/useIsMobile.ts` | 30 | **13** | `useMediaQuery` + a 768px `useIsMobile`. | `shared/hooks/useMediaQuery.ts` | shared | CERTAIN | P3 |
| `src/store/cartStore.ts` | 99 | 5 | The basket; persisted to `localStorage` as `klay-cart`. | `features/cart/store/cartStore.ts` | feature:cart | LIKELY | P4-4 |

### `src/visualiser/` — FROZEN, 8 files, 8,398 lines

| Current path | Lines | Imp | Proposed target | Layer | Confidence | Order |
|---|---:|---:|---|---|---|---|
| `src/visualiser/Canvas2DBlindRenderer.tsx` | 3,497 | 1 | `features/visualiser/renderers/` | feature:visualiser | CERTAIN | **FROZEN — PROTECTED IP** |
| `src/visualiser/Canvas2DCurtainRenderer.tsx` | 2,052 | 1 | `features/visualiser/renderers/` | feature:visualiser | CERTAIN | **FROZEN** |
| `src/visualiser/KlayConfigurator.tsx` | 1,230 | 3 | `features/visualiser/components/` | feature:visualiser | CERTAIN | **FROZEN (named explicitly)** |
| `src/visualiser/VisualiserControls.tsx` | 671 | 3 | `features/visualiser/components/` | feature:visualiser | CERTAIN | **FROZEN** |
| `src/visualiser/useVisualiserStore.ts` | 399 | 6 | `features/visualiser/store/` | feature:visualiser | CERTAIN | **FROZEN** |
| `src/visualiser/CornerPinOverlay.tsx` | 324 | 1 | `features/visualiser/components/` | feature:visualiser | CERTAIN | **FROZEN — PROTECTED IP** |
| `src/visualiser/usePhotoUpload.ts` | 142 | 1 | `features/visualiser/hooks/` | feature:visualiser | CERTAIN | **FROZEN — PROTECTED IP** |
| `src/visualiser/homography.ts` | 83 | 2 | `features/visualiser/lib/` | feature:visualiser | CERTAIN | **FROZEN — PROTECTED IP** |

### `src/visualiser-lab/` — FROZEN, 11 files, 8,852 lines

Byte-copies of the eight above, **plus three files that exist only here**:
`wardrobes.ts` (302), `Canvas2DWardrobeRenderer.tsx` (131), and a `useVisualiserStore.ts`
that is 21 lines longer than the original. Target and fate: **NEEDS DECISION** — see the
recommendation at the end of this document.

### RESOLVED — authoritative layer decisions, 2026-08-31

**All eleven are decided. These supersede the options set out in the notes below**, which are
kept for the reasoning that led to them.

| # | Decision | Executes in |
|---|---|---|
| **A** | **Option 1** — `shared/hooks/useScrollPosition.ts`, no store. *Determined:* both writers do exactly `setScrollY(window.scrollY)` and nothing else; `Nav` reads it only as `scrollY > 60` and `Math.max(0, stickBelow - scrollY)`. Nothing is expressed that `window.scrollY` cannot. `blindHeight` is dead and is **not carried** — left for the cleanup pass. | P3 |
| **B, G** | **Option 3** — the visualiser exports an embed component from its barrel; the catalogue page and the homepage showcase render it. | Deferred to unfreeze (P4-7) |
| **C** | **`feature:marketing`**, submitting through booking's barrel. | P4-1 |
| **D** | **Option 1** — `app/layouts/`. **The app layer may import feature barrels.** | P5 |
| **E** | **`shared/components/Turnstile.tsx`.** | P3 |
| **F** | **Split four ways:** `CtaButton` / `CtaLink` / `useHover` → `design-system/primitives/`; `SectionBand` → `design-system/patterns/`; `scrollToId` → `shared/utils/`; **`PhotoTile` → `feature:catalogue`.** *Determined:* `PhotoTile` has exactly one consumer, `src/components/ProductCard.tsx`, which is catalogue. It lives in `components/home/` and no home component imports it. | P2 / P3 / P4-3 |
| **H** | **Split by what the data is** — SKUs → catalogue; colour cards → catalogue (visualiser consumes via barrel); hardware heights → visualiser. **Stays whole until unfreeze.** | Deferred to P4-7 |
| **I** | **Option 1.** | P4-3 |
| **J** | **Option 3** — root-level shared module, aliased into both `src/` and `netlify/`. One commit with all four consumers. | P6 |
| **K** | **Option 1** — `features/booking/lib/`, consumed via barrel. | P6 (with the rest of booking) |

#### Two consequences of these decisions that need your attention

**A changes behaviour on nine pages, and a move phase must not.** Twelve pages mount `Nav`;
only three publish `scrollY`. On the other nine it is permanently `0`, so `compressed` is
always false and the nav never tightens its padding (11px → 8px). A hook reading live window
scroll makes it compress everywhere. The destination is right; **the change is visible and
needs signing off as a deliberate fix when P3 executes it**, or the hook must be opt-in per
page to preserve today's behaviour exactly.

**I collides with J.** `priceFor` does **not** duplicate any pricing logic — verified: it
imports `pricePerBlind`, `isBlindType`, `isWindowSize` and `isOperation` from
`src/lib/pricing.ts` and contains no arithmetic of its own. It is a catalogue→pricing
*adapter*, and its signature takes a `CatalogueItem`. Moving it into the pricing module, as
Option 1 says, would make a **root-level shared module import a feature type** — which J
forbids by construction. *Suggested amendment, for you:* `priceFor` stays in
`feature:catalogue` as the adapter it is; only `configuredLine` moves to `feature:cart`.
Unresolved and not acted on.

### The NEEDS DECISION notes

Kept for the reasoning. **Superseded by the table above.**

**A — `src/store.ts` (`useKlayStore`).** Two keys. `scrollY` is written by three pages and
read only by `Nav`; `blindHeight` is written by nobody and read by nobody. The store exists
solely to get scroll position from a page to the nav, and the nav is app-layer chrome.
*Options:* (1) `shared/hooks/useScrollPosition.ts` — a hook, no global store, since one
consumer does not need a store; (2) `app/store/scrollStore.ts` — keep it a store, put it
beside the only thing that reads it; (3) delete `blindHeight` and defer — but deletion is
banned until after the structure settles, so it travels either way.

**B — `ProductDetailPage` straddles two features.** It is a catalogue page that mounts
`KlayConfigurator`, `VisualiserControls` and `useVisualiserStore`, and also writes to the
cart. Under a rule of "no feature imports another feature", this file violates it three ways
on its own. *Options:* (1) `feature:catalogue` owns it and the visualiser is exposed through a
public barrel that catalogue is permitted to consume; (2) the page moves to `app/` as a
composition root, where crossing features is legitimate; (3) a thin `features/catalogue` page
that renders a `features/visualiser` embed component through its barrel. This same question
decides `VisualiserShowcase` (note G) and it should be answered once for both.

**C — `ContactPage` is a booking form wearing a marketing hat.** It posts to
`/api/request-quote` with hardcoded placeholder blind fields (`blindType: 'blockout'`,
`windowSize: 'medium'`) and carries the real message in `notes`. *Options:* (1)
`feature:booking`, because that is the endpoint it uses; (2) `feature:marketing`, because
that is what the page is to a visitor, with the submit going through the booking feature's
barrel.

**D — `Nav` and `Footer`.** Imported by 12 and 10 files respectively — the two highest-fan-in
components on the site. Both are app chrome, but `Footer` imports `PRODUCTS` from the
catalogue to build its product column, and `Nav` reads `useCartStore`. If they live in `app/`
and app may not import features, both break. *Options:* (1) they go in `app/layouts/` and
`app/` is permitted to import feature barrels (usual for a composition root); (2) they take
their data as props from the layout, which pushes the coupling up one level; (3) they go in
`shared/components/`, which I think is wrong — they are unmistakably Klay-specific and would
fail the 0.2 test.

**E — `Turnstile`.** Used by the booking form and the contact form. If C puts `ContactPage`
in `feature:booking`, this is trivially `feature:booking`. If not, two features need it and
it becomes a `shared/components/` candidate — but it fails the 0.2 test only weakly (it is
generic Cloudflare plumbing with no Klay knowledge, so it would in fact lift cleanly).

**F — `primitives.tsx` (810 lines) is two files pretending to be one.** `CtaButton`,
`CtaLink` and `useHover` are design-system primitives with no product knowledge.
`PhotoTile`, `SectionBand` and `scrollToId` are homepage furniture — `PhotoTile` in
particular knows about prices, swatch rows and `ProductGlyph`. *Options:* (1) split at that
line, primitives to `ds/primitives/`, the rest to `features/home/components/`; (2) move the
whole file to `features/home/` and let `ds/primitives/` be built fresh in Phase 2.4 — but
then `ProductCard`, which is catalogue, imports a home component.

**G — `VisualiserShowcase`.** Same straddle as B, plus it owns the cart mapping. Decide with B.

**H — `src/data/products.ts` is three unrelated tables.** The four roller SKUs; the blind and
curtain colour cards (consumed by the renderers and the controls); and `HARDWARE_HEX`
(consumed by the renderers). Under a feature-first layout the colour cards belong to the
visualiser and the SKU list belongs to the catalogue — but the file is imported by 12 files
across both. *Options:* (1) split by consumer: SKUs to `feature:catalogue`, colour cards and
hardware to `feature:visualiser`; (2) leave whole as `shared/` product data, accepting that
it fails the 0.2 test; (3) split into `features/catalogue/constants.ts` and a small
`shared/types/product.ts` for the shapes. **Note this is frozen-adjacent:** the visualiser
imports it, so splitting it before Phase 4's last slot means editing frozen files' imports.

**I — `src/data/configOptions.ts` prices things and builds cart lines.** `priceFor()` and
`configuredLine()` are commerce, not catalogue data. *Options:* (1) fields stay in
`feature:catalogue`, `priceFor` moves to the pricing module, `configuredLine` moves to
`feature:cart`; (2) the whole file becomes a `feature:catalogue` concern and cart imports it
through the barrel.

**J — `src/lib/pricing.ts` is the hard one, and it is the one to get right.** It is imported
by 11 files in `src/` and 4 in `netlify/`, via `../../src/lib/pricing`. Two pieces of config
hold that together: `tsconfig.functions.json` includes `src/lib/pricing.ts` in a Node
project, and `netlify.toml` sets `node_bundler = "esbuild"` so the cross-boundary import
bundles. **Moving this file changes a path that a server-side build depends on**, and Phase 6
is the first phase permitted to touch `netlify/`. *Options:* (1) `shared/lib/pricing/` and
update the four `netlify/` imports in Phase 6, accepting that between Phase 3 and Phase 6 the
functions are broken — **unacceptable, it violates green-between-phases**; (2) move it in
Phase 6 only, so client and server move together in one commit; (3) leave it where it is
permanently and declare `src/lib/` a third top-level layer for dual-runtime code; (4) hoist
it out of `src/` entirely to a root `shared/` that both `src/` and `netlify/` import. **My
strong recommendation is (2) or (4).** This is the single decision most able to break `/book`.

**K — `bookingLink.ts`.** Imported by four files, three of which are frozen or
frozen-adjacent (`VisualiserPage`, `VisualizerLabPage`, `VisualiserShowcase`,
`ProductDetailPage`). It is booking's URL contract, consumed by the visualiser. *Options:*
(1) `features/booking/lib/` and consumers import it through booking's barrel; (2)
`shared/lib/` — but it fails the 0.2 test, it encodes Klay's own query-param vocabulary.

---

## 0.2 THE SHARED-LAYER TEST

*Could this be lifted into an unrelated project unmodified?*

**Passes — genuinely shared:**

| File | Why it passes |
|---|---|
| `src/hooks/useIsMobile.ts` | `useMediaQuery` is generic. `useIsMobile`'s 768px constant is a convention, not a Klay fact. |
| `src/components/Turnstile.tsx` | Pure Cloudflare plumbing. Knows nothing about Klay. |
| `src/components/Honeypot.tsx` | A hidden input named `website`. Generic anti-spam. |
| `src/visualiser/homography.ts` | Textbook DLT + Gauss-Jordan. Would lift into any computer-vision project. **Protected IP — commercially valuable, not project-specific.** |

**Fails — proposed for `shared/` by directory habit, but belongs to a feature:**

| File | Why it fails | Where it belongs instead |
|---|---|---|
| `src/lib/pricing.ts` | `BASE_PRICE`, `MOTORISED_ADDON`, `INSTALL_PER_BLIND`, `GST_RATE`, `BlindType` — every line is Klay's commercial model. | Dual-runtime shared code, but **not** generic `shared/`. See note J. |
| `src/lib/bookingLink.ts` | Encodes Klay's `type/size/op/qty/fabric/hw` param names. | `feature:booking` |
| `src/data/products.ts` | Rynamic colour names and hexes. | `feature:catalogue` / `feature:visualiser` — note H |
| `src/store.ts` | Trivial, but exists only to serve Klay's nav. | note A |
| `src/components/Nav.tsx`, `Footer.tsx` | Klay's four links, Klay's address, Klay's ABN. | `app/layouts/` — note D |
| `src/components/FormField.tsx` | Close call. It hardcodes `DANGER = '#A03A28'` and Klay's uppercase-label idiom, but the component shape is generic. | `ds/primitives/Field.tsx` — the design system, not `shared/` |
| `src/components/home/primitives.tsx` | Half generic, half homepage. | Split — note F |

**Nothing currently in the tree is misfiled into a `shared/` directory, because there is no
`shared/` directory yet.** The list above is pre-emptive: these are the files a careless
Phase 3 would sweep into `shared/` on the strength of their current path.

**Projected `shared/` size.** On the strict reading, `shared/` would contain
`useIsMobile.ts` (30) + `Turnstile.tsx` (126) + `Honeypot.tsx` (40) = **196 lines, 0.7% of
`src/`.** Specification §2's ceiling is 15%. Even adding `pricing.ts` (192) it reaches 1.3%.
**There is no risk of an overweight shared layer here; the risk is the opposite** — a
`shared/` so thin it is not worth the folder. Worth confirming that §2's 15% is a ceiling and
not also a target.

---

## 0.3 IMPORT GRAPH, CURRENT STATE

### Circular imports

**ZERO.** Full DFS over all 64 `src/` files and 11 `netlify/` files. No cycle of any length.

### Cross-directory imports inside `src/`

Every cross-top-level-directory edge. Which of these is a *violation* depends on the
specification's layering rules, which I do not have — so this is the raw material, grouped by
what it would mean under the layer names the work order gives.

| Count | Edge | Under a feature-first model this is |
|---:|---|---|
| 39 | `src/pages` → `src/components` | fine once both are inside the same feature; **cross-feature** where a page pulls another feature's component |
| 17 | `src/components` → `src/theme.ts` | fine — everything may import the design system |
| 12 | `src/App.tsx` → `src/pages` | fine — app composes features |
| 12 | `src/pages` → `src/theme.ts` | fine |
| 10 | `src/components` → `src/hooks` | fine — → `shared/` |
| 9 | `src/components` → `src/data` | **likely cross-feature** |
| 7 | `src/pages` → `src/lib` | depends on note J |
| **6** | **`src/pages` → `src/visualiser`** | **cross-feature — the big one** |
| **4** | **`src/components` → `src/visualiser`** | **cross-feature — `VisualiserShowcase` and `RangeRow`** |
| 4 | `src/pages` → `src/data` | likely cross-feature |
| 3 | `src/components` → `src/store` | cart feature consumed by nav — **cross-feature** |
| 3 | `src/pages` → `src/hooks` | fine |
| 3 | `src/pages` → `src/store.ts` | note A |
| **3** | **`src/pages` → `src/visualiser-lab`** | **cross-feature, and into a sandbox** |
| 3 | `src/visualiser` → `src/data` | **cross-feature — frozen zone reaching into catalogue data** |
| 3 | `src/visualiser` → `src/theme.ts` | fine |
| 2 | `src/data` → `src/lib` | `catalogue.ts` and `configOptions.ts` import pricing |
| 2 | `src/pages` → `src/store` | cart |
| 2 | `src/visualiser` → `src/lib` | pricing, from the frozen zone |
| 1 | `src/App.tsx` → `src/routes` | fine |
| 1 | `src/components` → `src/store.ts` | note A |
| 1 | `src/main.tsx` → `src/App.tsx` | fine |

**The named cross-feature edges to resolve, by file:**

| From | To | Line |
|---|---|---:|
| `src/pages/ProductDetailPage.tsx` | `../visualiser/KlayConfigurator` | 14 |
| `src/pages/ProductDetailPage.tsx` | `../visualiser/VisualiserControls` | 15 |
| `src/pages/ProductDetailPage.tsx` | `../visualiser/useVisualiserStore` | 16 |
| `src/pages/VisualiserPage.tsx` | `../visualiser/VisualiserControls` | 4 |
| `src/pages/VisualiserPage.tsx` | `../visualiser/KlayConfigurator` | 5 |
| `src/pages/VisualiserPage.tsx` | `../visualiser/useVisualiserStore` | 6 |
| `src/pages/VisualizerLabPage.tsx` | `../visualiser-lab/VisualiserControls` | 41 |
| `src/pages/VisualizerLabPage.tsx` | `../visualiser-lab/KlayConfigurator` | 42 |
| `src/pages/VisualizerLabPage.tsx` | `../visualiser-lab/useVisualiserStore` | 43 |
| `src/components/home/VisualiserShowcase.tsx` | `../../visualiser/KlayConfigurator` | 43 |
| `src/components/home/VisualiserShowcase.tsx` | `../../visualiser/VisualiserControls` | 44 |
| `src/components/home/VisualiserShowcase.tsx` | `../../visualiser/useVisualiserStore` | 51 |
| `src/components/home/RangeRow.tsx` | `../../visualiser/useVisualiserStore` | 112 |
| `src/visualiser/useVisualiserStore.ts` | `../data/products` | 2 |
| `src/visualiser/VisualiserControls.tsx` | `../data/products` | 5 |
| `src/visualiser/Canvas2DBlindRenderer.tsx` | `../data/products` | 3 |
| `src/visualiser/useVisualiserStore.ts` | `../lib/pricing` | 3 |
| `src/visualiser/VisualiserControls.tsx` | `../lib/pricing` | 4 |
| `src/components/Nav.tsx` | `../store/cartStore` | — |
| `src/components/home/VisualiserShowcase.tsx` | `../../store/cartStore` | 39 |
| `src/components/home/RangeConfigurator.tsx` | `../../store/cartStore` | 37 |

**21 edges.** Seven of them originate in or terminate in the frozen zone, so seven cannot be
fixed until the visualiser migrates last.

### Relative imports climbing two or more levels

**38 total. All are exactly two levels; none climbs three or more.**

Ten worst (all equal at 2, listed by blast radius — the four `netlify/` ones matter most
because they cross the runtime boundary):

| File:line | Import |
|---|---|
| `netlify/functions/create-checkout-session.ts:24` | `../../src/lib/pricing` |
| `netlify/functions/stripe-webhook.ts:26` | `../../src/lib/pricing` |
| `netlify/lib/booking.ts:10` | `../../src/lib/pricing` |
| `netlify/lib/notify.ts:12` | `../../src/lib/pricing` |
| `src/components/home/VisualiserShowcase.tsx:43` | `../../visualiser/KlayConfigurator` |
| `src/components/home/VisualiserShowcase.tsx:44` | `../../visualiser/VisualiserControls` |
| `src/components/home/VisualiserShowcase.tsx:51` | `../../visualiser/useVisualiserStore` |
| `src/components/home/RangeRow.tsx:112` | `../../visualiser/useVisualiserStore` |
| `src/components/home/RangeConfigurator.tsx:37` | `../../store/cartStore` |
| `src/components/home/RangeRow.tsx:110` | `../../data/catalogue` |

The remaining 28 are all `src/components/home/*` reaching up to `../../theme`,
`../../hooks/useIsMobile`, `../../data/*` and `../../lib/*`. **Every one of these disappears
the moment Phase 1's path aliases land** — they become `@/ds`, `@/shared/hooks` and so on
without any file moving. That makes Phase 1 worth doing carefully; it retires 28 of 38
without touching a single import's meaning.

### Files imported by more than ten others — the de facto architecture

| Imp | File | Blast radius |
|---:|---|---|
| **35** | `src/theme.ts` | **Widest in the codebase.** Touched by Phase 2.2's token split. Every one of the 35 needs its import rewritten. Mitigation in 0.9. |
| **15** | `src/lib/pricing.ts` | 11 in `src/`, 4 in `netlify/`. Crosses the runtime boundary. See note J — the highest-risk move in the migration. |
| **13** | `src/hooks/useIsMobile.ts` | Cleanest of the five. Passes the 0.2 test, moves to `shared/hooks/`, no ambiguity. |
| **12** | `src/components/Nav.tsx` | Every page mounts it. Moves in Phase 5, after every feature has settled. |
| **12** | `src/data/products.ts` | Reaches into the frozen zone (3 importers there). Cannot be fully split until the visualiser migrates. |

Two of the five — `theme.ts` and `pricing.ts` — are moved by Phases 2 and 3, i.e. **early**.
That is the correct order (rails before features), but it means the two widest-radius moves
happen before the feature structure exists to catch mistakes. Both are addressed in 0.9.

### `netlify/` importing `src/`

Four imports, all of `src/lib/pricing`, all `../../src/lib/pricing`. This is the runtime
boundary crossing and it is deliberate — `tsconfig.functions.json` includes the file and
`netlify.toml` sets esbuild bundling so it works. **Do not move `src/lib/pricing.ts` without
moving these four in the same commit.**

---

## 0.4 SIZE VIOLATIONS, CURRENT STATE

### Files over 300 lines — 26 (of 64). Four are protected IP.

| Lines | File | Genuine unit, or two jobs? |
|---:|---|---|
| 3,497 | `src/visualiser/Canvas2DBlindRenderer.tsx` **[PROTECTED]** | **Two jobs.** ~40 draw functions for a roller blind, plus two complete curtain implementations (`drawNewCurtainArea` 557 lines, `drawCurtainArea` 147 lines) that a separate three.js renderer has superseded. Exempt, but the curtain paths are the natural split. |
| 3,497 | `src/visualiser-lab/Canvas2DBlindRenderer.tsx` **[PROTECTED]** | Byte copy of the above. |
| 2,052 | `src/visualiser/Canvas2DCurtainRenderer.tsx` | **Genuine unit that happens to be long.** A physical cloth model: wave layout, compression front, arc-length depth, damped sway, three shader pairs, a detail-map extractor. Splitting it would mean splitting the physics from the shaders that consume it. |
| 2,052 | `src/visualiser-lab/Canvas2DCurtainRenderer.tsx` | Byte copy. |
| 1,230 | `src/visualiser/KlayConfigurator.tsx` | **Two jobs, and newly so.** It was 726 lines this morning. The four commits since added `BeadChain`, `CurtainCord`, `MotorRemote` and their hardware drawing — inline SVG hardware components living inside the canvas-state container. **FROZEN.** |
| 1,230 | `src/visualiser-lab/KlayConfigurator.tsx` | Byte copy. |
| 1,137 | `src/components/home/RangeRow.tsx` | **Two jobs.** `RangeCard` (388 lines) and `RangeRow` (342) plus the scroll mechanics; 148 lines of the file are design rationale. |
| 810 | `src/components/home/primitives.tsx` | **Two jobs** — design-system primitives and homepage furniture. See note F. |
| 699 | `src/components/home/VisualiserShowcase.tsx` | **Two jobs** — layout, and all of the homepage's commerce. |
| 671 | `src/visualiser/VisualiserControls.tsx` | **Genuine unit.** ~30 controls, each written twice for light and dark grounds. **FROZEN.** |
| 671 | `src/visualiser-lab/VisualiserControls.tsx` | Byte copy. |
| 646 | `src/pages/ProductsPage.tsx` | **Two jobs** — banner/breadcrumb chrome plus the filter-and-grid shop. One 580-line function. |
| 563 | `src/theme.ts` | **Genuine unit, mostly comment.** ~420 of 563 lines are contrast measurements and rationale. Splits cleanly in Phase 2.2. |
| 548 | `src/pages/BookInstallPage.tsx` | **Two jobs** — a nine-field form and a live price breakdown, in one 496-line function. |
| 538 | `src/pages/ProductDetailPage.tsx` | **Three jobs** — 15 inline SVG icons, four static content tables, and the page itself. |
| 514 | `src/components/Nav.tsx` | **Two jobs** — desktop bar and mobile drawer, written separately in one 341-line function. |
| 473 | `src/pages/CartPage.tsx` | **Two jobs** — the line list and a nine-field checkout form, in one 464-line function. |
| 422 | `src/components/ProductGlyph.tsx` | **Genuine unit.** Eleven SVG drawings; one 334-line `Paths()` switch. Data-shaped. |
| 420 | `src/visualiser-lab/useVisualiserStore.ts` | Diverged copy, +21 lines. **FROZEN.** |
| 399 | `src/visualiser/useVisualiserStore.ts` | **Genuine unit.** One store, one mirroring invariant. **FROZEN.** |
| 395 | `src/data/catalogue.ts` | **Two jobs** — the 14-product table and the facet engine. |
| 380 | `src/components/home/RangeConfigurator.tsx` | **Genuine unit.** One panel, one 190-line component. |
| 324 | `src/visualiser/CornerPinOverlay.tsx` **[PROTECTED]** | **Genuine unit.** One SVG overlay with drag handling. |
| 324 | `src/visualiser-lab/CornerPinOverlay.tsx` **[PROTECTED]** | Byte copy. |
| 310 | `src/pages/HowItWorksPage.tsx` | **Two jobs** — the steps page and an FAQ accordion. |
| 308 | `src/data/configOptions.ts` | **Two jobs** — option data and pricing/cart-line logic. See note I. |

Excluding the sandbox fork: **20 files over 300 lines.**

### Functions over 60 lines — 59. Six are in protected files.

Top of the list; the full 59 are in the raw data. Every one over 300 lines is a React
component doing its own layout inline.

| Lines | Function | Note |
|---:|---|---|
| 580 | `ProductsPage()` `src/pages/ProductsPage.tsx:66` | The single largest function in the codebase. |
| 547 | `Canvas2DCurtainRenderer()` `:1505` | The three.js mount effect. **FROZEN.** |
| 523 | `KlayConfigurator()` `:707` | **FROZEN.** |
| 496 | `BookInstallPage()` `:52` | Touches `/book` — Phase 6 or later. |
| 464 | `CartPage()` `:9` | Contains the `alert()` stub. |
| 388 | `RangeCard()` `src/components/home/RangeRow.tsx:406` | |
| 364 | `ProductDetailPage()` `:174` | |
| 349 | `VisualiserShowcase()` `:350` | |
| 342 | `RangeRow()` `:795` | |
| 341 | `Nav()` `:173` | |
| 334 | `Paths()` `src/components/ProductGlyph.tsx:44` | A switch over eleven SVG bodies — genuinely one unit. |
| 318 | `PhotoTile()` `src/components/home/primitives.tsx:470` | |
| 305 | `VisualiserControls()` `:366` | **FROZEN.** |
| 291 | `init()` `Canvas2DCurtainRenderer.tsx:1665` | **FROZEN.** |
| 228 | `ContactPage()` `:29` | |
| 222 | `drawPanel()` `Canvas2DBlindRenderer.tsx:2621` | **PROTECTED — exempt.** |
| 190 | `RangeConfigurator()` `:190` | |
| 183 | `RecommendationBanner()` `:84` | |
| 178 | `HowItWorksPage()` `:132` | |
| 172 | `AboutPanel()` `:39` | |
| 160 | `Hero()` `:71` | |
| 151 | `buildDetailTexture()` `Canvas2DCurtainRenderer.tsx:1328` | **FROZEN.** |
| 147 | `AboutPage()` `:30` | |
| 145 | `writePanelMesh()` `Canvas2DCurtainRenderer.tsx:731` | **FROZEN.** |
| 140 | `render()` `Canvas2DBlindRenderer.tsx:3331` | **PROTECTED — exempt.** |
| 130 | `BookingConfirmedPage()` `:34` | |
| 121 | `WindowPicker()` `VisualiserShowcase.tsx:228` | |
| 104 | `Footer()` `:103` | |
| 103 | `usePhotoUpload()` `:39` | **PROTECTED — exempt.** |

Remaining 30 are between 62 and 100 lines.

**Protected-file summary: 4 files and 6 functions breach the thresholds and are exempt.**
Counted, per the work order, not excused from the count.

---

## 0.5 NAMING VIOLATIONS, CURRENT STATE

### Banned filenames

**ZERO.** No `utils.ts`, `util.ts`, `helpers.ts`, `helper.ts`, `misc.ts`, `common.ts`,
`shared.ts`, `stuff.ts`. There is also **no `index.ts` anywhere in `src/`** — barrels do not
exist yet, which makes Phase 4.4 pure addition rather than reconciliation.

*Caveat: checked against a conventional banned list. If the specification's list differs, the
result is unlikely to change — there are no aggregator files of any name in this tree.*

### `visualiser` vs `visualizer`

**Both spellings are live, and the collision is load-bearing.**

- `visualiser` (British): **230 occurrences**
- `visualizer` (American): **10 occurrences**

| Path | Spelling |
|---|---|
| `src/visualiser/` (8 files) | British |
| `src/visualiser-lab/` (11 files) | British |
| `src/pages/VisualiserPage.tsx` | British |
| `src/components/home/VisualiserShowcase.tsx` | British |
| **`src/pages/VisualizerLabPage.tsx`** | **American** |

**Four files contain both spellings:**

| File | `-iser` | `-izer` |
|---|---:|---:|
| `src/App.tsx` | 10 | 5 |
| `src/pages/VisualizerLabPage.tsx` | 25 | 3 |
| `src/visualiser/Canvas2DBlindRenderer.tsx` | 1 | 1 |
| `src/visualiser-lab/Canvas2DBlindRenderer.tsx` | 1 | 1 |

**This is not an accident and must not be "fixed" mechanically.** `VisualizerLabPage.tsx:27-30`
states the design: *"SPELLING IS THE SWITCH. Live is /visualiser (British, as the rest of the
site spells it), sandbox is /visualizer (American)."* The routes `/visualiser` and
`/visualizer` are two different pages distinguished by one letter. A blanket rename collapses
them. **Flagged as NEEDS DECISION**, tied to the `visualiser-lab` recommendation below.

The two `Canvas2DBlindRenderer.tsx` hits are incidental — the word `VisualizerConfigurator`
appears in a doc comment at line 6 describing a component that no longer exists under that
name.

### Verb families — five families use synonyms

| Family | Synonyms in use | Occurrences |
|---|---|---|
| **READ** | `get` · `load` | `getOrUploadTexture`, `getTexturePath` / `loadFromUrl`, `loadImage`, `loadScript` |
| **WRITE** | `set` · `update` · `write` · `store` | `set`, `setHardwareFill`, `setScrollY` / `update` / `writePanelMesh`, `writeThrough` / `store` |
| **CREATE** | `make` · `create` · `build` · `new` | `makeMaterial` / `createCheckoutSession`, `createGLState`, `createPanelMesh` / `buildAreaParams`, `buildDetailTexture` / `newSwayState` |
| **DELETE** | `remove` · `clear` · `drop` | `removeChip` / `clear` / `dropMetres`, `dropPx` |
| **TRANSFORM** | `parse` · `normalise` · `clean` | `parseOrderConfig` / `normaliseQuantity` / `clean` |
| **RENDER** | `format` · `render` · `draw` | `formatAUD` / `render`, `renderScale` / 24 × `draw*` |

Consistent already: **CHECK** (only `check*`) and **COMPUTE** (only `compute*`).

Two cautions before anyone standardises these:

1. **`drop` in the DELETE family is a false positive.** `dropMetres` and `dropPx` are curtain
   *drop* — the vertical dimension of a window covering. Domain vocabulary, not a verb.
2. **The 24 `draw*` functions are a deliberate, consistent family** inside the renderers.
   They are the most internally consistent naming in the codebase and they are frozen.

The genuine inconsistencies worth fixing are **READ** (`get` vs `load`) and **CREATE**
(four synonyms for one idea), both of which sit largely in the frozen zone.

### Abbreviations outside the permitted list

Permitted: `id, url, api, ref, src, px, db, ui, cta`. Declared identifiers only
(`const`/`let`/`var`/`function`), so loop counters and destructured props are excluded.

| Count | Abbreviation | Assessment |
|---:|---|---|
| 24 | `g` | Colour channel (green). Renderer maths. |
| 20 | `r` | Colour channel (red) / radius. Renderer maths. |
| 12 | `y` | Coordinate. |
| 10 | `b` | Colour channel (blue). |
| 10 | `img` | **Genuine violation** — should be `image`. |
| 10 | `h` | Height, or homography matrix. |
| 10 | `x` | Coordinate. |
| 8 | `config` | Arguably fine; it is a whole word in common use. |
| 8 | `w` | Width. |
| 6 | `a` | Alpha channel. |
| 4 | `bl` / `br` | Bottom-left / bottom-right corner. Domain vocabulary for the traced quad. |
| 4 | `len` | **Genuine violation** — should be `length`. |
| 4 | `ctx` | Canvas 2D context. Near-universal convention. |
| 2 | `info`, `gl`, `spec`, `idx`, `std`, `init`, `hw`, `pct`, `el` | `idx`→`index`, `el`→`element`, `pct`→`percent` are **genuine**; `gl` (WebGL context) and `hw` (hardware, and a URL param name) are domain. |
| 1 | `opts`, `params` | Minor. |

**Honest read: most of these are single-letter maths variables inside the two renderers and
should be left alone.** `x`, `y`, `w`, `h`, `r`, `g`, `b`, `a`, `tl`, `tr`, `br`, `bl`, `uv`
are the standard vocabulary of graphics code, and renaming them to `xCoordinate` would make
the shaders harder to read, not easier. **The genuine violations outside the frozen zone are
`img` (10), `len` (4), `idx` (2), `el` (2) and `pct` (2) — 20 sites in total.** I would
recommend the specification carve out an explicit exemption for graphics maths rather than
try to enforce this in the renderers.

### Booleans not prefixed `is`/`has`/`can`/`should`

**134 occurrences.** Three shapes: typed `boolean` fields on interfaces and props, `const`
initialised to a boolean literal, and `useState(true|false)`.

The largest recurring offenders:

| Name | Sites | Comment |
|---|---:|---|
| `hover` / `*Hover` | 14 | `cartHover`, `ctaHover`, `quoteHover`, `barCartHover`, `barQuoteHover`, `checkoutHover`, `menuOpen`… The inline-styles-only rule forces a hover state variable per interactive element. **This is the single biggest source, and it is a consequence of ADR-003.** |
| `onDark` | 5 | A prop on `primitives`, `Nav`, `VisualiserControls`. Would become `isOnDark`, which reads worse. |
| `selected`, `open`, `ready`, `dimmed`, `stacked`, `framed`, `closing`, `paused`, `matched`, `disabled` | ~20 | Adjectives. `isSelected`, `isOpen`, `isReady` all read naturally. |
| `required`, `textarea`, `compact`, `accent`, `wide`, `fill`, `indent`, `strong`, `solid`, `onLight` | ~15 | Props on design-system-ish components. `required` and `textarea` mirror HTML attribute names deliberately. |
| `priceOnMeasure` | 2 | Domain flag on `CartItem` and `ConfiguredLine`. `isPricedOnMeasure` would be clearer. |
| `cancelled`, `mounted`, `ticking`, `synced`, `scriptLoaded`, `submitted`, `busy`, `found`, `quoteSent`, `addedToCart`, `autoRunning`, `dragging`, `pressed`, `focused`, `showSortDropdown`, `drawerOpen` | ~30 | Mixed. `busy` is `Mode | null`, not a boolean — a false positive from my detector. |

**Of the 134, roughly 40 sit in the frozen zone.** The remaining ~94 are mechanical renames
with no behavioural risk — but they are *renames*, so by the work order's own rule they
belong in a dedicated pass, not inside a move phase.

---

## 0.6 DESIGN TOKEN BASELINE

Freshly measured. **These numbers supersede `STATE_OF_BUILD_2026-08.md`** — the tree has
grown by ~1,600 lines since that document, almost all of it in the frozen zone.

### Every token, with import and usage counts

**78 exported. 21 with zero consumers (27%).** Full table in the appendix; the shape:

| Band | Tokens | Note |
|---|---|---|
| Heavily used (>20 sites) | `tokens.body` 111 · `tokens.ink` 100 · `space.md` 75 · `tokens.warmWhite` 73 · `tokens.onDark` 43 · `radius.md` 42 · `eyebrow` 42 · `space.xs` 37 · `tokens.line` 34 · `tokens.inkSoft` 32 · `space.lg` 30 · `tokens.display` 28 · `space.sm` 27 · `tokens.charcoal` 21 · `tokens.onDarkMuted` 21 · `space.xl` 21 · `supporting.onLight` 21 | The working core — 17 tokens carry most of the site. |
| Used (2–20) | 40 tokens | |
| Used once | `tokens.paper` · `tokens.card` · `tokens.accentEdge` · `tokens.accentWash` · `tokens.textFaint` · `type.label` · `shadow.lift` | Declared for a system, used for a single case. |
| **Zero consumers** | **21** | Below. |

**The 21 with zero consumers:**

```
tokens.band          tokens.dark          tokens.textDark      tokens.textMid
tokens.fillFaint     tokens.scrimSoft     space.xxxl           type.ornament
type.hero            type.section         type.card            type.numeric
type.lead            type.body            type.micro           shadow.restOnDark
shadow.liftOnDark    layout.sectionPad    layout.sectionPadFocal
headline.card        easeOutCubic
```

Three distinct failures:

1. **Six orphaned colour tokens** — declared with contrast measurements, referenced nowhere.
2. **The entire nine-role `type` scale.** `headline.hero/section/card` are *aliases* of
   `type.hero/section/card` and `eyebrow` spreads `type.micro`, so three are consumed
   indirectly. **`type.ornament`, `type.numeric`, `type.lead` and `type.body` are consumed by
   nothing at all** — and `type.body` is the definition of all body copy on the site.
3. **`layout.sectionPad` and `sectionPadFocal`** are functions taking `isMobile`, called by
   nobody — and the three pages with no mobile layout at all (About, Contact, How It Works)
   are exactly the pages they were written for.

**How much of the token usage is inside the frozen zone:** `space.xs` 26 of 37 sites (70%),
`space.md` 24 of 75 (32%), `lerp` 10 of 10 (100%), `tokens.traceTeal` 4 of 4 (100%),
`tokens.onDark` 14 of 43 (33%). **Phase 2.2's rename pass cannot reach roughly a fifth of all
token call sites** until the visualiser unfreezes. Addressed in 0.9.

### Distinct hardcoded pixel values — **128**

Against a spacing scale of eight steps (4, 8, 12, 20, 32, 52, 84, 136).

Top 25 by occurrence:

| Count | Value | | Count | Value |
|---:|---|---|---:|---|
| 195 | `1px` | | 12 | `5px` |
| 108 | `0px` | | 11 | `7px` |
| 55 | `12px` ✓ on scale | | 11 | `64px` |
| 49 | `16px` | | 10 | `22px` |
| 46 | `20px` ✓ | | 9 | `480px` |
| 44 | `24px` | | 8 | `400px` |
| 42 | `4px` ✓ | | 8 | `1254px` |
| 41 | `80px` | | 7 | `52px` ✓ |
| 38 | `6px` | | 7 | `360px` |
| 35 | `8px` ✓ | | 7 | `1200px` |
| 27 | `10px` | | 6 | `34px` · `56px` · `60px` · `900px` · `4000px` |
| 23 | `32px` ✓ | | 5 | `15px` · `300px` · `520px` |
| 22 | `2px` | | | |
| 21 | `14px` · `40px` | | | |

Reading this honestly: **`1px` (195) and `0px` (108) are borders and resets, not spacing** —
303 of the occurrences are not scale candidates at all. Of the genuine spacing values, five
of the eight scale steps are already the most-used values (12, 20, 4, 8, 32), which is a good
sign for Phase 2.3. The long tail — `277px`, `443px`, `621px`, `717px`, `719px`, `945px`,
`1254px` — are measurements taken off a screenshot, and several are one-offs in a single file.

### Distinct hardcoded font sizes — **23**

| Count | Size | | Count | Size |
|---:|---|---|---:|---|
| 28 | `11px` | | 2 | `7px` · `8px` · `18px` · `34px` |
| 24 | `13px` | | 1 | `17px` · `22px` · `26px` · `28px` |
| 23 | `14px` | | 1 | `30px` · `56px` · `116px` · `120px` · `160px` |
| 17 | `12px` | | | |
| 8 | `10px` · `15px` | | | |
| 7 | `20px` | | | |
| 5 | `16px` | | | |
| 4 | `24px` · `32px` | | | |

Three of these (17, 26, 116) occur only inside `theme.ts` as the scale's own definitions.
**Two new sizes appeared this morning — `7px` and `8px`, both in `KlayConfigurator.tsx`** —
which is the count moving in the wrong direction while the frozen zone is worked on.

### Hex literals not in `theme.ts` — **123**

Up from 56 this morning; the increase is entirely `KlayConfigurator.tsx` hardware colours
(×2 for the fork) and the new `wardrobes.ts`.

| Group | Count | Assessment |
|---|---:|---|
| `src/data/products.ts:157-233` | 34 | **Legitimate.** Fabric and hardware colour cards — product data, not interface colour. |
| `src/visualiser*/KlayConfigurator.tsx` | 38 (19 × 2) | **New today.** Bead-chain, cord and motor-remote hardware shading. Renderer-adjacent, but in a component file. |
| `src/visualiser*/Canvas2DBlindRenderer.tsx` | 24 (12 × 2) | **Legitimate.** Lighting-model constants. |
| `src/visualiser-lab/wardrobes.ts:60-69` | 10 | **New today.** Wardrobe finish colours — product data. |
| `src/visualiser*/Canvas2DCurtainRenderer.tsx` | 2 | Legitimate. |
| `src/pages/VisualizerLabPage.tsx` | 3 | Deliberate — the sandbox banner's amber, chosen to be unmistakably not-product. |
| `src/components/FormField.tsx:147` | 1 | `DANGER = '#A03A28'`, declared once and exported. |
| **Real palette drift** | **11** | Below. |

**The 11 genuine drift sites:**

| File:line | Literal | Note |
|---|---|---|
| `src/pages/AboutPage.tsx:8` | `#0f0d09` | In a comment recording the value's removal |
| `src/pages/ContactPage.tsx:11` | `#0f0d09` | Same |
| `src/pages/HowItWorksPage.tsx:9` | `#0f0d09` | Same |
| `src/pages/NotFoundPage.tsx:7` | `#0f0d09` | Same |
| `src/components/home/StepsBar.tsx:26` | `#1A1A1A` | In the comment that bans it |
| `src/components/Nav.tsx:233` | `#E5E5E5` | **Live.** One step off `tokens.parchment` (`#EDEDED`), used nowhere else. |
| `src/pages/HowItWorksPage.tsx:61` | `#2a3a4a`, `#4a5a6a` | **Live.** A blue gradient, entirely outside the neutral palette. |

Plus `VisualiserPage.tsx:38-40` and `VisualizerLabPage.tsx:122-124` hardcoding `'#1D1D1D'`,
`'#F8F8F8'` and `'rgba(29,29,29,0.2)'` as strings — correct values, wrong source.

### `#000` / `#000000` / `#1A1A1A` — **2 occurrences**

Both in `src/components/home/StepsBar.tsx:25-26`, both **inside the comment that forbids
them**:

> *"Charcoal rather than black, because Klay has no black in it — #000000 and #1A1A1A are
> both banned outright."*

**Zero rendered occurrences.** The custom lint rule in Phase 1.3 will flag these two and they
are false positives — worth an inline disable with a note rather than editing the comment.

Separately, `rgba(0,0,0,X)` **is** used for shadows: `KlayConfigurator.tsx:43-45` builds its
raised-button shadows from `rgba(0,0,0,0.28)` through `rgba(0,0,0,0.5)`. The blind renderer
went the other way (`shadowRgba(a) = rgba(20,16,10,${a})`, with a comment on why). **Consider
whether the Phase 1.3 rule should catch `rgba(0,0,0,*)` as well as hex.**

### Inline style occurrences — **627** (136 in the frozen zone)

### The three files with the most hardcoded values

| Hardcoded values | File | Why it is the hard case |
|---:|---|---|
| **130** | `src/pages/CartPage.tsx` | Zero `space.*`, zero `type.*`. Nine form fields, each with a fully inline `style` object repeating the same six properties. **The single worst file, and it is the stub checkout** — worth deciding whether to migrate it or replace it. |
| **104** | `src/pages/ProductDetailPage.tsx` | 15 inline SVGs with literal `width`/`height`, four content tables, a sticky bar with its own spacing. |
| **104** | `src/visualiser/KlayConfigurator.tsx` **[FROZEN]** | Was not in the top three this morning. The new hardware components brought 19 hex literals and two new font sizes. Tied with the above and rising. |

Runners-up: `ProductsPage.tsx` (102), `HowItWorksPage.tsx` (100), `BookInstallPage.tsx` (82).

**Every one of the top six is a page.** Not one is in `src/components/home/`, which is the
only directory that consistently consumes the design system. This is the same split found in
the state-of-build document, now measured a second way and confirmed: **`theme.ts` was built
for the homepage and never carried into `src/pages/`.**

---

## 0.7 ENVIRONMENT VARIABLE SURFACE

**One read, in one file.**

| File:line | Variable |
|---|---|
| `src/components/Turnstile.tsx:35` | `VITE_TURNSTILE_SITE_KEY` |

```ts
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
```

No other `import.meta.env` read anywhere in `src/`. **No `process.env` read in `src/` at
all** — the nine server variables are read exclusively through `netlify/lib/env.ts` and
`netlify/lib/antispam.ts`.

**`config/env.ts` is therefore a one-variable module**, and Phase 2.1's "validate on module
load — throw a clear error naming the missing variable" needs a decision:
`VITE_TURNSTILE_SITE_KEY` is currently **optional by design** — `Turnstile.tsx:118` returns
`null` when it is absent, and `netlify/lib/antispam.ts:31-34` skips verification server-side
to match. **Throwing on a missing value would break local development and any deploy that has
deliberately not enabled captcha.** Recommend `config/env.ts` exposes it as
`turnstileSiteKey: string | undefined` with an explicit `isTurnstileEnabled` boolean, and
reserves throwing for variables that are genuinely required — of which there are currently
none on the client.

---

## 0.8 PHASE ORDERING RECOMMENDATION

**Principle: least-depended-upon first.** A feature with no inbound edges can move without
anything else noticing. A feature everything imports must move last, when there is nothing
left to break.

Inbound edges per proposed feature, counted from the current graph:

| Feature | Files | Lines | Inbound edges from other features | Notes |
|---|---:|---:|---:|---|
| `marketing` | 3 | 616 | **0** | Nothing imports About, How It Works or `steps.ts` except themselves and the homepage. |
| `booking` | 5 | 1,133 | **2** | `bookingLink` consumed by visualiser and catalogue. |
| `catalogue` | 7 | 2,613 | **6** | `products.ts` reaches into the frozen zone. |
| `cart` | 2 | 572 | **4** | `Nav` badge, `VisualiserShowcase`, `RangeConfigurator`, `ProductDetailPage`. |
| `home` | 11 | 4,565 | **1** | Imports everything, is imported by almost nothing. |
| `visualiser` | 20 | 17,250 | **13** | **FROZEN.** |

### Recommended order

| Slot | Feature | Reason |
|---:|---|---|
| **P4-1** | **`marketing`** | Zero inbound edges. Three self-contained pages. The safest possible first feature — it proves the folder anatomy, the barrel pattern and the alias rewiring on something that cannot break checkout. |
| **P4-2** | **`booking`** *(structure only — see caution)* | Small, well-bounded, already has a clean `api.ts`. **But it owns `/book`, which the work order protects until Phase 6.** Recommend moving only `ContactPage`, `Honeypot` and `Turnstile` here in P4-2 and deferring `BookInstallPage`, `BookingConfirmedPage` and `api.ts` to Phase 6. Alternatively move the whole feature at P4-7. **This is a NEEDS DECISION.** |
| **P4-3** | **`catalogue`** | Seven files, the facet engine, the product tables. Moderate inbound. Must precede `cart` and `home`, both of which consume it. |
| **P4-4** | **`cart`** | Two files, but four inbound edges — needs `catalogue` settled first so `configuredLine` has somewhere to land (note I). |
| **P4-5** | **`shared` clean-up pass** | Not a feature. After four features have moved, whatever is genuinely common has revealed itself. Re-run the 0.2 test before finalising `shared/`. |
| **P4-6** | **`home`** | 4,565 lines across 11 files, and it imports *every* other feature. Moving it earlier means rewriting its imports twice. Last of the movable features. |
| **P4-7** | **`visualiser` + `visualiser-lab`** | **FROZEN.** 17,250 lines, 58% of `src/`, 13 inbound edges, four protected IP files, and under active daily development. Migrates last, and only once you tell me the work in it has stopped. |

### Two departures from a naive dependency order worth explaining

**`home` goes late despite having almost no inbound edges.** Dependency order would put it
early. But it is the *largest consumer* — it imports catalogue, cart, visualiser, marketing
data and the design system. Moving it first means rewriting its 11 files' imports once per
subsequent feature. Moving it last means rewriting them once.

**`booking` is split.** Its natural slot is second, but three of its five files are the
`/book` payment path the work order fences off until Phase 6. Splitting a feature across
phases is ugly; the alternative is leaving `ContactPage` homeless for five phases. Your call.

### And the ordering constraint the freeze creates

`src/data/products.ts` (12 inbound, 3 of them from the frozen zone) and `src/lib/pricing.ts`
(15 inbound, 2 from frozen, 4 from `netlify/`) **cannot be fully resolved until the
visualiser unfreezes.** Both are scheduled for Phases 2–3, before the freeze lifts.

**Recommendation: move them, but do not split them, until Phase 4-7.** Relocate the file and
update every import including the frozen zone's — that is an import-path edit, which the
freeze permits (you froze the files from *migration*, and an import rewrite is mechanical).
Splitting `products.ts` by consumer, which note H proposes, must wait.

---

## 0.9 RISK REGISTER

Ordered by expected cost.

### R1 — Moving `src/lib/pricing.ts` breaks the Netlify functions silently

**Specifics.** Four files import it as `../../src/lib/pricing`:
`netlify/functions/create-checkout-session.ts:24`, `netlify/functions/stripe-webhook.ts:26`,
`netlify/lib/booking.ts:10`, `netlify/lib/notify.ts:12`. Two further pieces of config depend
on the literal path: `tsconfig.functions.json:27` lists `"src/lib/pricing.ts"` in `include`,
and `netlify.toml:13` sets `node_bundler = "esbuild"` so the cross-boundary import bundles at
deploy time.

**Why it is dangerous.** `npx tsc -b` will catch a broken import. `npm run build` (Vite)
**will not** — Vite does not compile `netlify/`. So the Phase 3 gate as written can go green
with the payment path broken, and the failure surfaces at deploy, on the endpoint that takes
money.

**Mitigation.** (1) Do not move this file in Phase 3. Move it in Phase 6 together with its
four consumers and both config files, in **one commit**. (2) Make `npm run typecheck` the
gate — see the verified note below; a separate `-p tsconfig.functions.json` run is **not**
needed. (3) After any move, `grep -rn "lib/pricing" netlify/ tsconfig.functions.json
netlify.toml` and confirm four plus two hits.

> **VERIFIED 2026-08-31 14:05 — correction to this risk and to R9.**
>
> `npm run typecheck` is `tsc -b`, and `tsc -b --verbose` shows it builds **all three**
> referenced projects every run:
>
> ```
> Building project '.../tsconfig.app.json'...
> Building project '.../tsconfig.node.json'...
> Building project '.../tsconfig.functions.json'...
> ```
>
> `tsc -p tsconfig.functions.json --listFiles` confirms the functions program contains all
> eleven `netlify/**` files **plus** `src/lib/pricing.ts`. A second consecutive run rebuilt
> all three rather than reporting them up to date, so the incremental cache does not mask
> errors either.
>
> **`netlify/` is therefore already covered by `npm run typecheck`. No Phase 1 fix is
> required for coverage.** What remains true is that the *work order's* stated gate,
> `tsc --noEmit`, checks nothing at all in this repository — the root `tsconfig.json` is
> `{files: [], references: [...]}` and plain `tsc --noEmit` does not walk project
> references. **The gate must be written as `npm run typecheck`.**
>
> **A second, separate gap that this verification exposed:** neither the deploy nor CI runs
> a typecheck at all. `netlify.toml` sets `command = "npm run build"`, which is `vite build`,
> which does not invoke `tsc`. Vite transforms 107 modules — `src/` only; `netlify/` is
> bundled independently by Netlify's esbuild at deploy time. There is no `.github/workflows`
> directory and no CI configuration anywhere in the repository. **Nothing outside a
> developer's own terminal has ever typechecked this codebase.** Phase 1.4 is where that
> gets fixed, and it matters most for Phase 6, whose gate is a deploy preview.

### R2 — The `theme.ts` split touches 35 files at once

**Specifics.** `src/theme.ts` has the widest fan-in in the codebase. Phase 2.2 splits it into
eight modules *and* Phase 2.2 renames every token. Done together that is one commit touching
35 files with two kinds of change in it — precisely what the work order's "moving is not
changing" rule forbids.

**Mitigation.** Split it into two commits. **2.2a:** create `ds/tokens/*`, have `src/theme.ts`
re-export from them, change no call site. Green gate. **2.2b:** repoint the 35 importers at
`@/ds`, still no renames. Green gate. **Renames become a third commit, or Phase 6.** This
keeps every step revertible and keeps the rename out of the move.

### R3 — ~20% of token call sites are unreachable behind the freeze

**Specifics.** `space.xs` is 70% frozen (26 of 37 sites), `lerp` and `tokens.traceTeal` are
100% frozen, `space.md` 32%, `tokens.onDark` 33%. A token rename applied only to the movable
42% of the tree leaves the frozen 58% importing names that no longer exist.

**Mitigation.** Keep `src/theme.ts` as a compatibility re-export shim for the whole migration
and delete it in the post-migration cleanup pass. The frozen zone keeps importing
`../theme`; the migrated code imports `@/ds`. Both resolve to the same values. Costs one file
and removes the coupling entirely.

### R4 — The frozen zone is a moving target

**Specifics.** `src/visualiser-lab/` gained three files and ~450 lines between 11:40 and 12:30
**during this phase**. `KlayConfigurator.tsx` grew 726 → 1,230 lines this morning. Any Phase
4-7 plan written now against specific line numbers or a specific file list will be wrong.

**Mitigation.** Re-run Phase 0's inventory against the frozen zone immediately before Phase
4-7, not before Phase 1. Treat the visualiser figures in this document as a snapshot, not a
plan. And get an explicit "the visualiser work is finished" from you before that phase opens.

### R5 — Two `useVisualiserStore` module-scope globals become three

**Specifics.** `useVisualiserStore` is created at module scope, so each *module* is one global
store instance. `src/visualiser/` and `src/visualiser-lab/` are two separate instances today —
that is the fork's stated purpose (`VisualizerLabPage.tsx:21-25`). If Phase 4-7 moves both
into `features/visualiser/` and someone "deduplicates" the store, the sandbox silently starts
sharing state with the live page and a fabric picked in the lab leaks into production.

**Mitigation.** Whatever happens to `visualiser-lab`, do not merge the two stores as part of a
move. That is a behaviour change wearing a refactor's clothes.

### R6 — Renaming `visualizer` → `visualiser` collapses two routes into one

**Specifics.** `/visualiser` and `/visualizer` are different pages distinguished by one
letter, by design. A find-and-replace across `src/App.tsx` (which contains both spellings, 10
and 5 occurrences) merges them or shadows one.

**Mitigation.** Resolve `visualiser-lab`'s fate first. If the sandbox stays, the spelling
collision is a deliberate design decision and belongs in an ADR, not a lint rule. If it goes,
the collision goes with it.

### R7 — `KlayConfigurator.tsx` is frozen but `VisualiserShowcase` and `ProductDetailPage` are not

**Specifics.** Both import `KlayConfigurator`, `VisualiserControls` and `useVisualiserStore`
directly. Moving those two consumers in P4-3 and P4-6 while their target is frozen means
writing imports that point at `src/visualiser/`, then rewriting them again in P4-7.

**Mitigation.** Accept the double rewrite — it is two lines per file — or create
`features/visualiser/index.ts` as a barrel in Phase 4-3 that re-exports from the current
frozen paths. Consumers import the barrel from then on; P4-7 changes only what the barrel
points at. **I recommend the barrel.** It is additive, touches no frozen file, and makes P4-7
a one-file change for every downstream consumer.

### R8 — `CartPage.tsx` is the worst file to migrate and may not be worth migrating

**Specifics.** 130 hardcoded values, zero design-system usage, a 464-line function, nine form
fields, and a submit handler that is `alert()` + `clearCart()`. Migrating it faithfully means
carefully relocating a large amount of code that does nothing.

**Mitigation.** None needed for the migration itself — it moves like anything else. **Flagged
because it is a scoping question:** if the cart checkout is going to be rewritten anyway,
doing that before P4-4 rather than after saves migrating 473 lines twice. Your call; not mine
to make.

### R9 — The gate as written in the work order checks nothing, and nothing outside a developer's terminal checks anything

**Specifics.** The work order's gate is `tsc --noEmit`, `eslint`, `npm run build`.
**Plain `npx tsc --noEmit` reads no files in this repository** — the root `tsconfig.json` is
`{files: [], references: [...]}` and does not walk project references. It exits 0 having
checked nothing. `README.md:13-18` records this.

**Verified 2026-08-31:** `npm run typecheck` (`tsc -b`) **does** build all three projects
including `tsconfig.functions.json`, whose program contains every `netlify/**` file plus
`src/lib/pricing.ts`. So coverage is not the problem — *naming the wrong command* is. See
the verified block under R1.

**And neither the deploy nor CI typechecks at all.** `netlify.toml` runs `npm run build`
(`vite build`), which never invokes `tsc`; there is no `.github/` directory and no CI
configuration in the repository.

**Mitigation.** (1) The phase gate is **`npm run typecheck` + `npm run build` + the app
renders** — never `tsc --noEmit`. (2) Phase 1.4 must add `npm run typecheck` to CI as a
blocking gate, because today a type error reaches production unchallenged. (3) For Phase 6,
whose gate is a deploy preview, the preview only proves the bundle builds — add an explicit
`npm run typecheck` step before pushing, since Netlify will not do it.

### R10 — `npm run lint` currently crashes, so Phase 1.2's baseline cannot be taken as-is

**Specifics.** `eslint .` fails on the first file with
`TypeError: Cannot read properties of undefined (reading 'allowShortCircuit')` — eslint 9.39.5
against `typescript-eslint` 8.x. It has never linted this repository.

**Mitigation.** Phase 1.2 must begin by aligning those two versions, before any rule is added
or any baseline recorded. Budget for it; it is a dependency-resolution task, not a config
task, and `npm audit fix` will not do it.

### R11 — THE VISUALISER PHASE IS THE MIGRATION'S CRITICAL PATH

**Specifics.** Five of the eleven authoritative layer decisions cannot be executed until the
freeze lifts:

| Decision | What is blocked |
|---|---|
| **B** | The catalogue page cannot render a visualiser embed until the visualiser has a barrel to export one from. |
| **G** | Same, for the homepage showcase. |
| **H** | `src/data/products.ts` cannot be split by consumer while three of its twelve importers are frozen. It stays whole. |
| **K** | `bookingLink.ts` moves to `features/booking/lib/`, and three of its four consumers are frozen or frozen-adjacent — so the import rewrite happens twice, or behind a barrel. |
| **F (part)** | `PhotoTile` → catalogue is unblocked, but the `design-system/primitives` half is consumed by frozen files, which cannot be repointed. |

Add to those the seven cross-feature import edges (of 21) that begin or end in the frozen
zone, and roughly a fifth of all design-token call sites (R3).

**Why this is the critical path and not merely a late phase.** Every other phase can be
finished, gated and reverted independently. The visualiser phase is the only one that
*unblocks other people's work* — five decisions and seven edges are waiting on it, and none
of them can be closed out until it runs. It is also the largest single body of work in the
migration (18 files, 17,250 lines, 58% of `src/`), contains all four protected IP files, and
is the only phase whose scope is still growing: `visualiser-lab` gained three files and
~450 lines during Phase 0 alone.

**Mitigation.** (1) Treat the visualiser phase's start date as the migration's schedule
driver — everything downstream of those five decisions is idle until it opens. (2) Build
`features/visualiser/index.ts` as a barrel **early**, in P4-3, re-exporting from the current
frozen paths: it is additive, touches no frozen file, and turns P4-7 into a one-file change
for every downstream consumer (see R7). (3) Re-run Phase 0's inventory against the frozen
zone immediately before the phase opens, not before Phase 1 — the figures in this document
are a snapshot. (4) Get an explicit "the visualiser work is finished" before opening it.

### R12 — DEFERRED DESIGN WORK: should the nav compress on every page?

**Not a risk to the migration. A design question the migration surfaced, parked so that it is
not answered by accident.**

**Specifics.** Twelve pages mount `Nav`. Only three publish scroll position — `HomePage`,
`ProductsPage`, `ProductDetailPage`. On the other nine `scrollY` is permanently `0`, so
`compressed` (`Nav.tsx:176`, `scrollY > 60`) is always false and the nav never tightens its
padding from 11px to 8px (`NAV_PAD`, `Nav.tsx:85`).

Whether that is deliberate or an accident of which pages happened to get a scroll listener is
**UNKNOWN** — nothing in the code says, and the comment at `Nav.tsx:206-208` describes the
asymmetry without justifying it.

**Why it is recorded here.** Decision A's correct destination is a hook
(`shared/hooks/useScrollPosition`), since both writers do nothing but
`setScrollY(window.scrollY)`. A hook reading live window scroll would make the nav compress on
all twelve pages — **a visible change to nine of them, arriving as a side effect of a
refactor.**

**Resolution.** Phase 3 took option 2 instead: the store survives, moved to
`app/store/scrollStore.ts`, and the publish/subscribe asymmetry survives with it. The nav
behaves after Phase 3 exactly as it behaved at Phase 0.

**What is owed.** A design decision from Bobby and V: should the nav compress site-wide? If
yes, it is a two-line change (a hook, or a listener in `RootLayout`) plus a look at nine pages.
If no, the three pages that publish should stop, and the compression removed — because a
behaviour that exists on a quarter of the site by accident is worse than either answer.

**Do not resolve this inside a structural phase.** The whole point of parking it is that the
answer should be a decision, not a consequence.

---

## THE `src/visualiser-lab/` DECISION

You left this as `[your decision here]` — an unfilled placeholder — and asked me to report
but not act. So: my recommendation, and the reasoning, for you to decide.

**What changed today.** This morning `visualiser-lab` was a byte-identical copy of
`visualiser` — 7,819 duplicated lines, ~97 kB of bundle, and no diff. On that evidence the
state-of-build document called it dead scaffolding, and it was right.

**It is not that any more.** As of 12:30 it holds three things that exist nowhere else:
`wardrobes.ts` (302 lines), `Canvas2DWardrobeRenderer.tsx` (131 lines), and a
`useVisualiserStore.ts` 21 lines longer than the original — plus ten new Forma wardrobe
PNGs in `public/images/Textures/wardrobes/`. A whole new product category is being built in
there. **The fork is doing exactly the job it was created to do.**

**My recommendation: keep it, and change nothing about it during this migration.**

- It is earning its keep now, and it is the only place the wardrobe work can happen without
  touching a live renderer four surfaces mount.
- Its own header states the exit condition — *"diff visualiser-lab against visualiser, move
  across what you want, then delete this page, its route and the lab directory together"* —
  and that condition is not met while the wardrobe work is unfinished.
- Merging or deleting it is a **product** decision about when wardrobes ship, not an
  architecture decision, and it should not be forced by a refactor's tidiness.

**What I would ask you to accept alongside that:**

1. **The ~97 kB is a real cost paid by every visitor**, for a route nothing links to. If the
   wardrobe work will run for weeks, consider lazy-loading `/visualizer` — one
   `React.lazy` in the route table, no change to the lab itself. That is a Phase 5 task and
   I would put it there.
2. **The 21-line drift in `useVisualiserStore.ts` is the thing to watch.** Byte-identical
   forks are easy to reason about; a fork that has diverged in a store is where the wardrobe
   work will eventually be painful to bring across. Worth a note in the lab's header
   recording what diverged and why.
3. **Keep the spelling as it is.** `/visualiser` vs `/visualizer` is deliberate and
   documented; it should become ADR-013 rather than a lint exception.
4. **It migrates at P4-7 with the live visualiser, as one unit** — not separately, and not
   earlier.

**Marked NEEDS DECISION.** I have not acted on it.

---

## SUMMARY — PHASE 0 BASELINE

```
PHASE 0 BASELINE
base_commit: 8708752
files_src: 64
loc_src: 29623
files_frozen: 18
loc_frozen: 17250
files_movable: 46
loc_movable: 12373
circular_imports: 0
cross_feature_edges: 21
relative_parent_imports: 38
relative_parent_imports_depth_3_plus: 0
files_over_300_lines: 26
files_over_300_lines_excl_fork: 20
functions_over_60_lines: 59
protected_files_over_300: 4
protected_functions_over_60: 6
banned_filenames: 0
index_barrels_existing: 0
spelling_collision_files: 4
verb_families_with_synonyms: 6
abbreviation_violations_outside_frozen: 20
boolean_prefix_violations: 134
theme_tokens_exported: 78
theme_tokens_zero_consumers: 21
hardcoded_px_distinct: 128
hardcoded_font_sizes_distinct: 23
hardcoded_hex_not_in_theme: 123
banned_black_occurrences: 2
inline_style_occurrences: 627
env_reads_in_src: 1
typescript_errors: 0
build_status: PASS
needs_decision_items: 11
risks_registered: 10
```

**Green at the end of Phase 0:** `npm run typecheck` exits 0; `npm run build` passes in
4.60 s; no source file was modified.
