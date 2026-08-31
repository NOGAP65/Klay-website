# KLAY — STATE OF THE BUILD

**Read-only reconnaissance. No file in this repository was modified except this one.**

| | |
|---|---|
| Repository | `C:/Users/lathv/Klay-website-new` |
| Branch | `main` |
| Commit this document was written against | `786e996` — *"Fork the visualiser to /visualizer so it can be worked on in the open"*, itself sitting on `7499360` *"Tear out the tier above the shop and redirect what pointed at it"* |
| Read at | 2026-08-31, 09:24–09:55 local |
| Method | Static read of every file in `src/`, `netlify/`, `supabase/` and every root config; import graph built mechanically; `npm run build`, `tsc -b`, `npm run lint`, `npm audit` executed and quoted verbatim. |

> ### ONE NOTE BEFORE YOU READ ANYTHING ELSE
>
> **The repository changed underneath this audit while it was running, and that is not a
> mistake in the numbers — it is something you should know about.** At 09:24 there were 53
> tracked files under `src/`. At 09:34 a directory `src/visualiser-lab/` appeared — 8 files,
> 7,819 lines, a byte-identical copy of `src/visualiser/`. At 09:36 a page
> `src/pages/VisualizerLabPage.tsx` appeared and `src/App.tsx` gained a `/visualizer` route
> pointing at it. All of it was then committed as `786e996`, *"Fork the visualiser to
> /visualizer so it can be worked on in the open"*.
>
> That was somebody else — another session, or you — working in this checkout at the same
> time. I wrote nothing but this file. This document describes the tree at `786e996`, which
> includes that fork. **It ships in the production bundle and it costs ~97 kB** (§2), so
> where a figure depends on it I give the number both ways.

---

## 1. THE ONE-PAGE SUMMARY

### What this application is

Klay is a Melbourne window-furnishings business — blinds, curtains, awnings, wardrobes,
screens, shower screens — and this is its shopfront. Its one genuinely distinctive asset is
a photorealistic visualiser: a customer uploads a photograph of their own window, drags four
pins onto the glass, and the site draws a real roller blind or a wave-fold curtain into the
photograph with correct perspective, fabric weave, light bleed and hardware. Everything else
on the site — the homepage, the shop, the product pages — exists to get someone to that tool
and then to take an order off the back of it.

### What a customer can actually do today, end to end

They land on the homepage and are shown a moving credentials bar, a video hero, the four-step
process, four hero products with configurators on them, and then the visualiser. The
visualiser loads a stock room photograph automatically and renders a blind onto it with no
interaction required. They can change blind type, fabric colour, hardware finish, size and
operation, and watch the render repaint. They can upload their own photograph and trace their
own window. They can set how many windows the job has and configure each one differently.

From there the journey **forks, and the two forks do not meet**.

**Fork A — "Book Installation" / "Get Quote".** Every button labelled this builds a `/book`
URL carrying the configuration in query parameters. `/book` shows a priced breakdown, takes
name, email, phone, address, suburb, postcode, preferred date and notes, and offers two
buttons: *Pay & book* and *Request a quote instead*. Both post to real Netlify Functions,
which validate the input, re-derive the price on the server, write a row to Supabase, send
email via Resend, and — on the pay path — open a Stripe Checkout session and redirect. **This
fork is fully built.** It works the moment eight environment variables are set in Netlify and
one SQL file is run against Supabase. Nothing is missing from the code.

**Fork B — "Add to Cart" / "Buy Now".** The homepage's visualiser, the homepage's product
cards, and every product page have a cart button. It adds a line to a `localStorage`-backed
cart and sends the customer to `/cart`. The cart lists the lines, totals them, and presents a
full checkout form — first name, last name, email, phone, address, city, state, postcode,
notes. Pressing **Request Quote & Measure** runs this, at `src/pages/CartPage.tsx:31-35`:

```js
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  alert('Order submitted! We will contact you shortly to arrange measurement.');
  clearCart();
};
```

A browser alert box, and the basket is emptied. **No network call. Nothing is stored. Nothing
is emailed. The customer's name, address and phone number are collected and discarded.** The
customer is told their order was submitted and it was not.

### What a customer cannot do yet, and why

- **They cannot buy anything through the cart.** The cart's checkout is the `alert()` above.
- **They cannot pay for a curtain.** Curtains are enquiry-only by design —
  `CURTAIN_ENQUIRY = '/contact'` (`src/components/home/VisualiserShowcase.tsx:61`) — because
  the cart line has no field for wave-fold heading, mount or the XL size curtains go to.
- **They cannot buy ten of the fourteen products.** Only roller blinds are priced. Roman,
  honeycomb, venetian, vertical, shutters, curtains, awnings, zip guides, shutters,
  flyscreens, wardrobes, shelving and shower screens all route to `/contact?product=<name>`.
- **They cannot receive anything after submitting**, unless the deploy has `RESEND_API_KEY`
  set. See §12.
- **They cannot log in.** There is no authentication anywhere in this application.
- **They cannot use the visualiser comfortably on a phone.** No file under `src/visualiser/`
  contains any mobile branch; the sidebar is a hard-coded `width: 348` (`VisualiserPage.tsx:81`).

### The shape of the system in five sentences

Almost everything runs in the browser: a Vite-built React 18 single-page app with no CSS
files, no server rendering and no code splitting, shipped as one 1,020 kB JavaScript bundle.
Four Netlify Functions run server-side in Node and are the only code that holds a secret —
they own the Supabase service-role key, the Stripe secret key and the Resend key. Two
Postgres tables in Supabase (`quote_requests` and `orders`) hold everything that is
persisted; Row Level Security is on with no policies, so the browser cannot reach them at
all. Stripe hosts the payment page, so no card data ever touches Klay's code. The cart is
the exception to all of this: it lives in the visitor's own `localStorage` and never leaves
the browser.

### The three things most likely to break

1. **`src/pages/CartPage.tsx:31`** — the `alert()` checkout. It is not going to break; it is
   already broken, and it is broken in the way that costs the most, because it looks like it
   worked.
2. **`src/visualiser/Canvas2DBlindRenderer.tsx:153`** — the texture paths are case-sensitive
   (`/images/Textures`, `Light-filter`). They resolve on the Windows dev machine and 404 on
   Netlify's Linux host if anyone ever "tidies" the capitalisation. The file says so itself,
   which is the only thing protecting it.
3. **`src/visualiser/KlayConfigurator.tsx:245`** — `DEFAULT_WINDOW_CORNERS_PCT`, four
   hard-coded corner positions measured against one specific 1254×1254 photograph. Replace
   `/images/Preview.png` without re-measuring and every first-time visitor sees a blind
   hanging off the side of a window.

### The single biggest gap between what exists and a site that can take money

**It is not Stripe.** Stripe is written, correct, server-priced, webhook-verified and
idempotent. The gap is that the site has **two checkouts, and the finished one is the one
customers are least likely to reach.** The homepage's centrepiece — the visualiser, the most
prominent buying surface on the site — has a **Buy Now** button that goes to the dead cart.
The working checkout is behind buttons labelled *Book Installation* and *Get Quote*.

Close that and you have a site that takes money. The remaining work is configuration: run one
SQL file, set eight environment variables, register one Stripe webhook, verify one email
domain, and confirm one placeholder number (`INSTALL_PER_BLIND = 60`,
`src/lib/pricing.ts:51`, which the code itself flags as never having been signed off).

---

## 2. COMPLETE FILE MANIFEST

73 TypeScript files across `src/` and `netlify/`, plus 11 root config files.
`Imports` is the number of *other files in this repo* that import it.

Status key: **LIVE** (in the running app) · **PARTIAL** (works but incomplete) ·
**STUB** (exists but does nothing real) · **ORPHAN** (imported by nothing) ·
**DEAD** (leftover scaffolding).

### `src/` — application root (4 files, 696 lines)

The entry point, the route table, and the global design tokens. Nothing here holds business
logic; `theme.ts` is the largest file in the directory and is entirely constants.

| Path | Lines | What it does | Imports | Status |
|---|---:|---|---:|---|
| `src/main.tsx` | 13 | Mounts React into `#root` inside `StrictMode` and `BrowserRouter`. | 0 | LIVE (entry) |
| `src/App.tsx` | 118 | The route table — 16 `<Route>` declarations resolving to 18 paths — plus `ScrollToHash`, which scrolls to `#visualiser` after a route renders. | 1 | LIVE |
| `src/theme.ts` | 563 | Every colour, type size, spacing step, radius, shadow and transition on the site, as plain objects spread into inline styles. There is no CSS file anywhere in `src/`. | 35 | LIVE |
| `src/vite-env.d.ts` | 2 | Vite client type reference. | 0 | LIVE (ambient) |

### `src/routes/` (1 file, 67 lines)

Redirect components standing in for the three-tier catalogue that `/products` replaced.

| Path | Lines | What it does | Imports | Status |
|---|---:|---|---:|---|
| `src/routes/legacyRedirects.tsx` | 67 | Sends the retired URLs `/blinds`, `/blinds/<type>`, `/indoor`, `/outdoor`, `/wardrobes` to the shop or to a product, with `replace` so Back is not trapped. | 1 | LIVE |

### `src/pages/` — one file per route (12 files, 3,756 lines)

Every page composes `Nav`, its own sections, and `Footer`. None is lazy-loaded.

| Path | Lines | What it does | Imports | Status |
|---|---:|---|---:|---|
| `src/pages/HomePage.tsx` | 214 | Assembles the ten homepage sections in order and publishes scroll position to the nav. Almost the whole file is a 97-line comment explaining the section order. | 1 | LIVE |
| `src/pages/ProductsPage.tsx` | 646 | The shop. All 14 catalogue items on one page behind a four-facet filter rail; `?category=` preselects a filter. | 1 | LIVE |
| `src/pages/ProductDetailPage.tsx` | 538 | One page per roller product, carrying the full visualiser, features, specs, FAQs, an Add-to-Cart button and a Get-Quote link. Switching fabric rewrites the URL to the matching product. | 1 | LIVE |
| `src/pages/VisualiserPage.tsx` | 125 | Standalone full-height visualiser: category tabs, controls sidebar, canvas, Book Installation. **Gated by a hostname allowlist** (line 54). | 1 | LIVE |
| `src/pages/VisualizerLabPage.tsx` | 225 | A near-identical copy of the page above, rendering the forked `visualiser-lab/` modules instead. Self-described as "scaffolding, not a second product". | 1 | DEAD |
| `src/pages/BookInstallPage.tsx` | 548 | `/book`. Reads the configuration from query params, prices it, takes customer details, and posts to either `/api/request-quote` or `/api/create-checkout-session`. **The only working checkout on the site.** | 1 | LIVE |
| `src/pages/BookingConfirmedPage.tsx` | 176 | Stripe's return URL. Polls `/api/order-status` up to six times rather than assuming payment succeeded because the URL was reached. | 1 | LIVE |
| `src/pages/CartPage.tsx` | 473 | Lists cart lines, totals them, renders a nine-field checkout form whose submit handler is `alert()` + `clearCart()`. | 1 | **STUB** |
| `src/pages/ContactPage.tsx` | 257 | Contact details and an enquiry form that posts to `/api/request-quote` with placeholder blind fields, using `notes` to carry the message. | 1 | LIVE |
| `src/pages/AboutPage.tsx` | 177 | Company page. Four values, four credentials (two derived from the catalogue so they cannot go stale), one CTA. | 1 | LIVE |
| `src/pages/HowItWorksPage.tsx` | 310 | The four steps with their photographs, plus six FAQs. | 1 | LIVE |
| `src/pages/NotFoundPage.tsx` | 67 | 404. | 1 | LIVE |

### `src/components/` — shared UI (8 files, 1,754 lines)

Everything used by more than one page, plus the two anti-spam widgets.

| Path | Lines | What it does | Imports | Status |
|---|---:|---|---:|---|
| `src/components/Nav.tsx` | 514 | The fixed top bar: logo, four links (Shop · Visualise · About · Contact), cart badge, Shop Now button. Collapses to a drawer below 860px. | 12 | LIVE |
| `src/components/Footer.tsx` | 207 | Four columns, derived from `PRODUCTS` so a renamed product cannot leave a dead link. Privacy / Terms / Warranty all point at `/contact`. | 10 | PARTIAL |
| `src/components/ProductGlyph.tsx` | 422 | Hand-drawn SVG line diagrams of eleven product mechanisms, used wherever no photograph exists — which is most of the range. Self-described as scaffolding until photography arrives. | 2 | LIVE |
| `src/components/ProductCard.tsx` | 107 | Adapter turning a catalogue item into the homepage's `PhotoTile`. Prints `Price on measure` when no price exists. | 1 | LIVE |
| `src/components/FilterRail.tsx` | 190 | The shop's four facet groups with nested, tri-state checkboxes and live counts. | 1 | LIVE |
| `src/components/FormField.tsx` | 148 | The one controlled input on the site: label, value, error, ARIA wiring, focus tint. Exports `DANGER = '#A03A28'`. | 2 | LIVE |
| `src/components/Honeypot.tsx` | 40 | Off-screen `website` field. Server silently drops the request and fakes success if filled. | 2 | LIVE |
| `src/components/Turnstile.tsx` | 126 | Loads Cloudflare Turnstile lazily and returns `null` when `VITE_TURNSTILE_SITE_KEY` is unset. | 2 | PARTIAL — inert until the key is set |

### `src/components/home/` — homepage sections (11 files, 4,565 lines)

One file per band of the homepage, plus `primitives.tsx`, which holds the CTA button, the
section header and `PhotoTile` so twelve sections cannot each invent their own.

| Path | Lines | What it does | Imports | Status |
|---|---:|---|---:|---|
| `src/components/home/RangeRow.tsx` | 1,137 | Four hero products in one row; clicking Shop Now widens a card's slot and slides a configurator in beside the photograph. The largest non-renderer file in the repo. | 1 | LIVE |
| `src/components/home/primitives.tsx` | 810 | `CtaButton`, `CtaLink`, `SectionBand`, `PhotoTile`, `useHover`, `scrollToId`, `TILE_GAP`. | 10 | LIVE |
| `src/components/home/VisualiserShowcase.tsx` | 699 | The homepage visualiser embed and the commerce around it: window count, per-window editing, job total, **Buy Now → `/cart`**. | 1 | PARTIAL — its Buy Now lands on the stub cart |
| `src/components/home/RangeConfigurator.tsx` | 380 | The five-field panel inside a range card. Fields come from `data/configOptions`, not from this file. | 1 | LIVE |
| `src/components/home/RecommendationBanner.tsx` | 267 | Charcoal banner stating the four steps. Replaced a "not sure where to start?" block whose recommender quiz never existed. | 1 | LIVE |
| `src/components/home/StepsBar.tsx` | 256 | 54px marquee of the four steps; the whole bar links to `/how-it-works`. | 2 | LIVE |
| `src/components/home/Hero.tsx` | 231 | Full-bleed video hero: eyebrow, headline, one CTA. Falls back to a still under `prefers-reduced-motion`. | 1 | LIVE |
| `src/components/home/SocialProof.tsx` | 221 | Five-tile "in your home" install strip. **Its own header says the imagery is placeholder renders, not real installs.** | 1 | PARTIAL |
| `src/components/home/AboutPanel.tsx` | 211 | 50/50 panel about Klay rather than about a product. | 1 | LIVE |
| `src/components/home/Testimonials.tsx` | 201 | Continuous marquee of five reviews. | 1 | LIVE |
| `src/components/home/TrustTicker.tsx` | 152 | Six credentials moving across the top of the page, above the nav. | 2 | LIVE |

### `src/visualiser/` — the rendering engine (8 files, 7,819 lines, 39% of `src/`)

The protected IP. Four surfaces mount these: `/visualiser`, `/products/:slug`, the homepage
showcase, and the homepage range cards (store only).

| Path | Lines | What it does | Imports | Status |
|---|---:|---|---:|---|
| `src/visualiser/Canvas2DBlindRenderer.tsx` | 3,497 | Draws a roller blind into a photograph: Canvas2D for shadow, light leak, cassette, bottom rail and chain; raw WebGL for the perspective-correct fabric itself. Also contains both curtain fallback paths. | 1 | LIVE |
| `src/visualiser/Canvas2DCurtainRenderer.tsx` | 1,976 | A completely separate three.js renderer for wave-fold curtains, with a physical wave model, arc-length depth and a damped sway simulation. | 1 | LIVE |
| `src/visualiser/KlayConfigurator.tsx` | 727 | Owns the canvas box and its three states (upload / trace / rendered), the roll slider, the motor animation and the Download button. | 3 | LIVE |
| `src/visualiser/VisualiserControls.tsx` | 671 | The configuration panel — type, colour card, hardware, size, operation, curtain fields — with a light and a dark skin. | 3 | LIVE |
| `src/visualiser/useVisualiserStore.ts` | 399 | The zustand store: one job, many windows, window 1 leading until a window is customised. | 6 | LIVE |
| `src/visualiser/CornerPinOverlay.tsx` | 324 | The four draggable crosshairs and four midpoint diamonds the customer traces their window with. | 1 | LIVE |
| `src/visualiser/usePhotoUpload.ts` | 142 | File picker, camera capture, 15 MB cap, downscale to 1600px, preset loader. | 1 | LIVE |
| `src/visualiser/homography.ts` | 83 | Computes the 3×3 homography by DLT + Gauss-Jordan, applies it, and transposes it for WebGL. 83 lines, and the reason the whole thing works. | 1 | LIVE |

### `src/visualiser-lab/` — the sandbox fork (8 files, 7,819 lines)

**Byte-for-byte identical to `src/visualiser/`.** All eight files diff clean. Created
2026-08-31 09:34, committed as `786e996`, and reachable in production at `/visualizer` (American
spelling) subject to the same hostname allowlist. Every one is **DEAD** by its own
documentation: *"When the work is done: diff visualiser-lab against visualiser, move across
what you want, then delete this page, its route and the lab directory together."*

| Path | Lines | Imports | Status |
|---|---:|---:|---|
| `src/visualiser-lab/Canvas2DBlindRenderer.tsx` | 3,497 | 1 | DEAD |
| `src/visualiser-lab/Canvas2DCurtainRenderer.tsx` | 1,976 | 1 | DEAD |
| `src/visualiser-lab/KlayConfigurator.tsx` | 727 | 1 | DEAD |
| `src/visualiser-lab/VisualiserControls.tsx` | 671 | 1 | DEAD |
| `src/visualiser-lab/useVisualiserStore.ts` | 399 | 3 | DEAD |
| `src/visualiser-lab/CornerPinOverlay.tsx` | 324 | 1 | DEAD |
| `src/visualiser-lab/usePhotoUpload.ts` | 142 | 1 | DEAD |
| `src/visualiser-lab/homography.ts` | 83 | 1 | DEAD |

**Measured cost:** the production bundle built before this fork existed was 923,431 bytes
(`dist/assets/index-DBszLGhd.js`, present on disk at 09:24). The build I ran at 09:40, with
the fork in place, produced 1,020,334 bytes. **+96,903 bytes of minified JavaScript, ~10.5%,
shipped to every visitor for a sandbox nothing links to.**

### `src/data/` — the catalogue (4 files, 1,077 lines)

Pure data with long editorial comments. No React, no side effects.

| Path | Lines | What it does | Imports | Status |
|---|---:|---|---:|---|
| `src/data/catalogue.ts` | 395 | The 14 products Klay actually sells, grouped Indoor / Outdoor / Other, plus the facet model (`matches`, `applyFacets`, `countFor`) the shop's filter rail runs on. | 5 | LIVE |
| `src/data/configOptions.ts` | 308 | What each of the 14 products lets you choose, capped at five fields because the cart line has five configurable columns. Also prices a selection and turns it into a cart line. Header warns the choice lists are editorial, not read off a Klay price list. | 2 | LIVE |
| `src/data/products.ts` | 245 | The four roller SKUs, the 12-entry SKU table, the 14-colour Rynamic blind card, the 17-colour curtain card, and the three hardware hexes. | 12 | LIVE |
| `src/data/steps.ts` | 129 | Design / Measure / Make / Install, with the four purpose-shot photographs. 90 of its 129 lines are a comment explaining the copywriting. | 3 | LIVE |

### `src/lib/`, `src/hooks/`, `src/store/` (6 files, 458 lines)

| Path | Lines | What it does | Imports | Status |
|---|---:|---|---:|---|
| `src/lib/pricing.ts` | 192 | **The single most important file in the repo.** The only place money is worked out, imported by both the browser and the checkout function so the two cannot disagree. | 15 | LIVE |
| `src/lib/api.ts` | 87 | The browser's side of the two booking endpoints. Deliberately sends no price. | 2 | LIVE |
| `src/lib/bookingLink.ts` | 34 | Builds `/book?type=…&size=…&op=…&qty=…&fabric=…&hw=…` from a configuration. | 4 | LIVE |
| `src/hooks/useIsMobile.ts` | 30 | `useMediaQuery` plus a 768px `useIsMobile`. The nav uses a different threshold (860px). | 13 | LIVE |
| `src/store/cartStore.ts` | 99 | The cart: 1 state key, 6 actions, persisted to `localStorage` under `klay-cart`. | 5 | PARTIAL — feeds a checkout that does nothing |
| `src/store.ts` | 16 | Two globals — `scrollY` and `blindHeight`. **`blindHeight` is written by nobody and read by nobody.** | 4 | PARTIAL |

### `netlify/functions/` — the server (4 files, 404 lines)

Every file in this directory is deployed as its own HTTP endpoint. All four declare their own
`config.path`, and `netlify.toml` carries a matching `/api/*` redirect as a belt to that
braces.

| Path | Lines | What it does | Imports | Status |
|---|---:|---|---:|---|
| `netlify/functions/create-checkout-session.ts` | 127 | Rate-limits, checks honeypot and Turnstile, validates, **re-derives the price server-side**, writes an `orders` row as `pending_payment`, opens a Stripe Checkout session itemised line-for-line with the on-screen breakdown, links the session id back, returns the URL. | 0 (endpoint) | LIVE |
| `netlify/functions/stripe-webhook.ts` | 157 | Verifies the signature against the **raw** body, then handles `completed`, `async_payment_succeeded`, `async_payment_failed` and `expired`. Idempotent via `.neq('status','paid')`. The only thing that can mark an order paid. | 0 (endpoint) | LIVE |
| `netlify/functions/request-quote.ts` | 66 | The no-money path: writes a `quote_requests` row, then fires both emails with `Promise.allSettled` so a mail failure cannot lose the lead. | 0 (endpoint) | LIVE |
| `netlify/functions/order-status.ts` | 54 | `GET ?session_id=cs_…`. Returns status, amount and quantity only — deliberately no name, email or address. | 0 (endpoint) | LIVE |

### `netlify/lib/` — shared server code (7 files, 591 lines)

Deliberately outside `functions/` so it is not deployed as endpoints.

| Path | Lines | What it does | Imports | Status |
|---|---:|---|---:|---|
| `netlify/lib/notify.ts` | 180 | Four Resend emails — quote alert, quote acknowledgement, paid alert, paid receipt — as inline-styled HTML with escaped customer data. Every send failure is logged and swallowed. | 2 | LIVE |
| `netlify/lib/booking.ts` | 138 | Validates and shapes an incoming booking. Strips HTML, collapses whitespace, caps lengths, checks email / postcode / date / phone shape. **Never reads a price from the request.** | 3 | LIVE |
| `netlify/lib/rateLimit.ts` | 69 | In-memory sliding window, 5 requests per 60s per IP. Resets on cold start; the file says so. | 2 | LIVE |
| `netlify/lib/antispam.ts` | 64 | Honeypot check and Turnstile server verification. Skips verification entirely when `TURNSTILE_SECRET_KEY` is unset. | 2 | PARTIAL |
| `netlify/lib/env.ts` | 63 | Reads the eight server env vars and reports which are missing per capability, so a half-configured deploy returns a diagnosable 503. | 6 | LIVE |
| `netlify/lib/http.ts` | 53 | `json`, `badRequest`, `methodNotAllowed`, `notConfigured`, `serverError` (logs the real error, returns a generic one with a search ref), `readJson`. No permissive CORS, on purpose. | 5 | LIVE |
| `netlify/lib/db.ts` | 24 | Cached Supabase client built with the **service-role key**. Lives under `netlify/` and reads a non-`VITE_` var precisely so the browser can never construct it. | 4 | LIVE |

### Root config files

| Path | Lines | What it does | Status |
|---|---:|---|---|
| `package.json` | 45 | 10 dependencies, 20 devDependencies. Still named `vite-react-typescript-starter`, version `0.0.0`. | LIVE |
| `netlify.toml` | 52 | Build command, functions directory, esbuild bundler, a strict CSP, and the `/api/*` → functions redirect ordered ahead of the SPA catch-all. | LIVE |
| `index.html` | 210 | The shell. Carries the entire global stylesheet inline — reset, link colour, body ground, two scrollbar treatments and eleven `@keyframes`. **Its OG and Twitter images still point at `https://bolt.new/static/og_default.png`.** | PARTIAL |
| `tsconfig.json` | 14 | `{ files: [], references: [app, node, functions] }`. | LIVE |
| `tsconfig.app.json` | 24 | `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. | LIVE |
| `tsconfig.functions.json` | 28 | Covers `netlify/**/*.ts` **and** `src/lib/pricing.ts`, so the shared pricing module is checked in both worlds. Same strictness. | LIVE |
| `tsconfig.node.json` | 22 | Covers `vite.config.ts` alone. | LIVE |
| `vite.config.ts` | 10 | React plugin, `optimizeDeps.exclude: ['lucide-react']`. No build options, no chunking, no sourcemap setting. | LIVE |
| `eslint.config.js` | 28 | Flat config, recommended JS + TS, react-hooks, react-refresh. | **PARTIAL — the lint script crashes; see §16** |
| `tailwind.config.js` | 8 | Tailwind content globs. | **DEAD** |
| `postcss.config.js` | 6 | `tailwindcss` + `autoprefixer`. | **DEAD** |
| `.gitignore` | 26 | See §15. | LIVE |
| `.env.example` | 52 | Ten variable names with documentation. See §15. | LIVE |
| `README.md` | 113 | See §19. | LIVE |
| `research.mjs` | 24 | A one-off playwright-core script that screenshots three pages against `localhost:5176`. Not referenced by any script in `package.json`. | **DEAD** |
| `.bolt/config.json`, `.bolt/prompt` | — | Bolt.new starter scaffolding. `config.json` is `{"worktree":{"bgIsolation":"none"}}`. | **DEAD** |

> **Tailwind is configured and produces nothing.** There is no `.css` file anywhere in `src/`
> or `public/`, no `@tailwind` directive in the repository, and `src/main.tsx` imports no
> stylesheet. PostCSS runs Tailwind over a project with no stylesheet to inject into. Every
> style on this site is an inline `style={{…}}` object or one of the rules in `index.html`.

### `public/` — 79 files, 108.4 MB total

**41 of 79 files (69.2 MB, 64% by weight) are referenced by nothing in `src/` or
`index.html`, and all of them are copied to `dist/` and deployed.**

**Referenced (38 files):**

| File | Bytes | Used by |
|---|---:|---|
| `/images/Textures/curtains/sheer_produced.png` | 3,707,288 | Curtain renderer `FABRIC_SAMPLE` |
| `/images/Textures/curtains/Blockout_produced.png` | 3,541,243 | Curtain renderer `FABRIC_SAMPLE` |
| `/hero_video.mp4` | 2,603,937 | `Hero.tsx` |
| `/images/Soleil Sunscreen product image.png` | 2,336,098 | `products.ts` (Veil, and Haze as a stand-in) |
| `/images/lifestyle/room-living.png` | 2,233,339 | `AboutPanel.tsx`, hero still fallback |
| `/images/Eclipse Dual Roller product image.png` | 2,127,941 | `products.ts` (Duo) |
| `/images/Preview.png` | 2,102,204 | **The visualiser's default window** — paired to `DEFAULT_WINDOW_CORNERS_PCT` |
| `/images/Phoenix Blockout product image.png` | 1,979,653 | `products.ts` (Dusk) |
| `/images/lifestyle/step-3-manufacture.png` | 1,976,916 | `steps.ts` |
| `/images/lifestyle/room-kitchen.png` | 1,943,385 | `catalogue.ts` (Roller Blinds tile) |
| `/images/lifestyle/step-4-install.png` | 1,935,490 | `steps.ts` |
| `/images/lifestyle/step-2-measure.png` | 1,690,323 | `steps.ts` |
| `/images/lifestyle/step-1-configure.png` | 1,561,883 | `steps.ts` |
| `/images/logo_full.png` | 902,178 | Nav / Footer logo |
| `/images/room-3.png` | 889,705 | `PRESET_ROOMS`, `KlayConfigurator.tsx:224` |
| `/images/room-4.png` | 888,179 | `PRESET_ROOMS` |
| `/images/room-5.png` | 852,344 | `PRESET_ROOMS` |
| `/images/Textures/Bottom_bar/Bottom_bar.jpg` | 418,482 | Blind renderer hardware |
| `/images/hero-room.jpg` | 384,449 | Hero still fallback |
| `/images/range/wardrobes.jpg` | 174,815 | `catalogue.ts` |
| `/images/categories/wardrobes.jpg` | 165,411 | `catalogue.ts` |
| `/images/Textures/Sunscreen/Sunscreen.png` | 159,681 | Blind renderer fabric |
| `/images/categories/indoor.jpg` | 154,056 | `catalogue.ts` |
| `/images/range/sheer-curtains.jpg` | 152,750 | `catalogue.ts` |
| `/images/Textures/Blockout/Blockout_fabric.png` | 125,446 | Blind renderer fabric |
| `/images/products/pleated-flyscreens.webp` | 108,850 | `catalogue.ts` |
| `/images/products/roller-shutters.webp` | 106,814 | `catalogue.ts` |
| `/images/Textures/Light-filter/light_filter.png` | 102,210 | Blind renderer fabric |
| `/images/products/folding-arm-awnings.webp` | 94,212 | `catalogue.ts` |
| `/images/products/zip-guide-systems.webp` | 72,734 | `catalogue.ts` |
| `/images/products/honeycomb-blinds.webp` | 64,488 | `catalogue.ts` |
| `/images/products/plantation-shutters.webp` | 62,446 | `catalogue.ts` |
| `/images/products/roman-blinds.webp` | 54,708 | `catalogue.ts` |
| `/images/products/vertical-blinds.webp` | 53,252 | `catalogue.ts` |
| `/images/products/frameless-shower-screens.webp` | 46,184 | `catalogue.ts` |
| `/images/klay-logo-light.png` | 39,876 | Nav |
| `/images/klay-logo.png` | 39,798 | Nav |
| `/images/klay-mark.png` | 14,084 | Favicon (`index.html:5`) |

**Unreferenced (41 files, 69.2 MB) — all deployed:**

| File | Bytes | Note |
|---|---:|---|
| `/images/Product Ai Renders for website.zip` | 20,998,238 | **A 21 MB zip archive deployed to the public web root.** Untracked in git. |
| `/images/Product Ai Renders for website/` (10 PNGs) | 21,250,256 total | The unzipped contents. Untracked. Nothing imports them. |
| `/images/Textures/curtains/reference/` (7 PNGs) | 12,713,172 total | Reference shots the curtain renderer was tuned against. Development material. |
| `/images/Outdoor_window.png` | 2,820,978 | |
| `/images/Textures/curtains/sfold_base.png` | 2,578,955 | Superseded — the renderer draws wave fold only |
| `/images/lifestyle/fabric-texture.png` | 2,257,860 | |
| `/images/static-imafge.png` | 1,721,515 | Filename misspelt; nothing uses it |
| `/images/room-1.png` | 1,040,301 | `PRESET_ROOMS` uses 3, 4 and 5 only |
| `/images/room-2.png` | 887,764 | Same |
| `/images/types/veil.png` `duo.png` `haze.png` `dusk.png` | 3,451,347 total | Superseded by the "product image" PNGs |
| `/images/Textures/curtains/Sheer_curtains_1.png` | 608,414 | Superseded by `sheer_produced.png` |
| `/images/Textures/curtains/Blockout_curtains_1.png` | 401,750 | Superseded by `Blockout_produced.png` |
| `/images/Textures/Tube/Top_tube.jpg` | 405,281 | The renderer draws the tube procedurally |
| `/images/Textures/Tube/Top_tube_side.jpg` | 81,180 | Same |
| `/images/Textures/Bottom_bar/Botton_bar_side.jpg` | 25,948 | Filename misspelt ("Botton") |
| `/images/outdoor-window.jpg` | 397,353 | |
| `/images/curtains-room.jpg` | 302,749 | |
| `/images/outdoor-window-curtains.jpg` | 275,931 | |
| `/images/categories/outdoor.jpg` | 164,469 | Only `indoor` and `wardrobes` are used |
| `/images/logo_letter.png` | 79,396 | |
| `/images/products/roller-blinds.webp` | 52,234 | Roller Blinds uses a lifestyle shot instead |
| `/images/klay-mark-light.png` | 13,357 | |
| `/images/.claude/settings.local.json` | 934 | **A Claude Code permissions file inside the public web root.** No secrets in it, but it carries absolute Windows paths under `C:\Users\lathv\` and is served at `https://<site>/images/.claude/settings.local.json`. |

Also: **14 `curtain-*.png` screenshots (8.4 MB) sit untracked at the repository root** —
`curtain-3d.png`, `curtain-sfold.png`, `curtain-v3.png`, `curtain-fixed.png` and ten more.
Development artefacts from tuning the curtain renderer. They are not under `public/`, so they
do not deploy, but they are in the working tree. `public/images/klay 2.png` shows as deleted
but not staged.

### Every file over 400 lines, descending

| Lines | Path | Why it is that big |
|---:|---|---|
| 3,497 | `src/visualiser/Canvas2DBlindRenderer.tsx` | ~40 top-level draw functions — shadow, sheen, ambient occlusion, light leak, vignette, contact shadow, translucent bleed, cassette, bottom rail, chain, dual-roller path, **and two separate curtain paths** — plus a full WebGL vertex/fragment shader pair inline. |
| 3,497 | `src/visualiser-lab/Canvas2DBlindRenderer.tsx` | Byte copy of the above. |
| 1,976 | `src/visualiser/Canvas2DCurtainRenderer.tsx` | A physical model: wave widths, compression front, arc-length depth, a damped-pendulum sway with a 50-frame history buffer, three shader pairs (fabric, track, track cap), and a fabric detail-map extractor. ~35 named physical constants. |
| 1,976 | `src/visualiser-lab/Canvas2DCurtainRenderer.tsx` | Byte copy. |
| 1,137 | `src/components/home/RangeRow.tsx` | The sideways-opening card mechanic: a scrollable row whose slots animate `flex-basis`, plus the badge, the header, the scroll nudging and 148 lines of design rationale. |
| 810 | `src/components/home/primitives.tsx` | Five shared components, each carrying its own hover-state machine because inline styles cannot express `:hover`. |
| 727 | `src/visualiser/KlayConfigurator.tsx` | A hand-built slider, a hand-built raised button with press states, the motor animation loop, three canvas states, the default-window seeding logic and the download handler. |
| 727 | `src/visualiser-lab/KlayConfigurator.tsx` | Byte copy. |
| 699 | `src/components/home/VisualiserShowcase.tsx` | Layout plus all of the homepage's commerce: window count, per-window tabs, job total, cart mapping. |
| 671 | `src/visualiser/VisualiserControls.tsx` | ~30 controls, each written twice — once for the light ground and once for the dark — resolved through a `skin()` indirection. |
| 671 | `src/visualiser-lab/VisualiserControls.tsx` | Byte copy. |
| 646 | `src/pages/ProductsPage.tsx` | Photographic banner, breadcrumb, filter rail wiring, responsive grid, empty state, and the `?category=` resolver. |
| 563 | `src/theme.ts` | ~420 of its 563 lines are comments recording contrast measurements and the reasoning behind each token. |
| 548 | `src/pages/BookInstallPage.tsx` | Two submit paths, nine form fields, a live price breakdown, honeypot, Turnstile, a success state and a cancelled-payment state. |
| 538 | `src/pages/ProductDetailPage.tsx` | 15 inline SVG icons, four feature tables, four spec tables, four FAQ tables, the visualiser, two CTAs and a sticky mobile bar. |
| 514 | `src/components/Nav.tsx` | Desktop bar and mobile drawer written separately, plus scroll-driven positioning. |
| 473 | `src/pages/CartPage.tsx` | 370 of those lines are a nine-field checkout form that submits to `alert()`. |
| 422 | `src/components/ProductGlyph.tsx` | Eleven hand-drawn SVG mechanisms. |

**18 files over 400 lines; 14 excluding the sandbox fork.**

### Every ORPHAN and DEAD file

**ORPHAN (imported by nothing) — 6 files, and all six are correct:**
`src/main.tsx` (the entry point, referenced from `index.html`), `src/vite-env.d.ts` (ambient
types), and the four `netlify/functions/*.ts` (HTTP endpoints, invoked by URL).
**There are no accidental orphans in this codebase.**

**DEAD (leftover scaffolding) — 13 items:**

| Item | Why |
|---|---|
| `src/visualiser-lab/` (8 files, 7,819 lines) | Byte-copy of `src/visualiser/`. Adds ~97 kB to the production bundle. |
| `src/pages/VisualizerLabPage.tsx` (225 lines) | The route that mounts it. Unlinked from anywhere on the site. |
| `tailwind.config.js` | Tailwind is configured and there is no stylesheet for it to act on. |
| `postcss.config.js` | Runs Tailwind over nothing. |
| `research.mjs` | One-off screenshot script pointing at a port the project does not use. |
| `.bolt/config.json` | Bolt.new starter residue. |
| `.bolt/prompt` | Bolt.new starter residue. |
| 14 × `curtain-*.png` at repo root (8.4 MB) | Development screenshots. |
| `public/images/Product Ai Renders for website.zip` (21 MB) | Deployed to the web root, referenced by nothing. |
| `public/images/Product Ai Renders for website/` (21.3 MB) | Same. |
| `public/images/Textures/curtains/reference/` (12.7 MB) | Renderer tuning references. |
| `public/images/.claude/settings.local.json` | A tooling file published on the live site. |
| `public/images/static-imafge.png`, `types/*.png`, `room-1/2.png`, and the other superseded assets | Listed in full above. |

---

## 3. THE ARCHITECTURE, EXPLAINED

### 3.1 The layers

**The browser UI.** A React 18 single-page app, `src/pages/` and `src/components/`. It runs
entirely on the visitor's machine. There is no server rendering, no code splitting and no CSS
file — every visual property is an inline `style={{…}}` object reading constants out of
`src/theme.ts`, with a handful of rules that inline styles cannot express (scrollbars,
keyframes, `::selection`) kept in a `<style>` block in `index.html`. One consequence worth
stating plainly: the whole site, every page, arrives as one 1,020 kB JavaScript file before
anything appears on screen.

**Client state.** Three zustand stores, all created at module scope, so each is one global
object shared by everything that imports it. `src/store.ts` holds scroll position;
`src/store/cartStore.ts` holds the basket and persists it to `localStorage`;
`src/visualiser/useVisualiserStore.ts` holds the whole visualiser configuration. Nothing
else holds cross-component state.

**The rendering engines.** `src/visualiser/`, and they are the only part of this codebase
doing anything a competitor could not reproduce in a week. Two independent engines: a
Canvas2D + raw-WebGL blind renderer and a three.js curtain renderer. They share no code. See
§6.

**Data access.** There is almost none in the browser. The React app makes exactly two kinds
of outbound call: a `POST` to one of two booking endpoints, and a `GET` to a status endpoint.
There is no Supabase client in the browser bundle — `@supabase/supabase-js` is imported by
exactly one file, `netlify/lib/db.ts`, which is server-only.

**Serverless functions.** Four Netlify Functions in `netlify/functions/`, running in Node on
Netlify's infrastructure, sharing seven modules in `netlify/lib/`. These hold every secret
the system has. They are the only code that can reach the database.

**Database.** Supabase Postgres. Two tables, `quote_requests` and `orders`, defined in
`supabase/migrations/0001_bookings.sql`. Row Level Security is enabled on both with no
policies at all, and all grants are revoked from `anon` and `authenticated` — so nothing but
the service-role key can touch them.

**There are no Netlify Edge Functions.** `netlify.toml` declares no `[[edge_functions]]`
block and there is no `netlify/edge-functions/` directory.

### 3.2 The trust boundary map

| Context | Runs where | Can a customer see this code? | Can a customer tamper with its inputs? | What credentials does it hold? |
|---|---|---|---|---|
| **The React app** (all of `src/`) | The visitor's browser | **YES** — the entire bundle, unminified logic and all, is downloadable. There are no sourcemaps, but minified logic is still readable. | **YES, completely.** Every value it sends — query params, form fields, the cart in `localStorage` — is under the customer's control. | `VITE_TURNSTILE_SITE_KEY` only, which is a *public* site key by design. Nothing else. |
| **`/api/request-quote`** | Netlify Functions (Node, server) | NO | Request body only, and it is treated as hostile: validated, HTML-stripped, length-capped, rate-limited, honeypot- and Turnstile-checked. | `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` |
| **`/api/create-checkout-session`** | Netlify Functions (Node, server) | NO | Request body only. **The price is never read from it** — the configuration is, and the amount is re-derived. | `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `TURNSTILE_SECRET_KEY` |
| **`/api/stripe-webhook`** | Netlify Functions (Node, server) | NO | Only if they can forge an HMAC signature over the raw body — i.e. no. Unsigned or badly signed requests are rejected 400 before the payload is parsed. | `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **`/api/order-status`** | Netlify Functions (Node, server) | NO | The `session_id` query param. Shape-checked (`cs_` prefix, ≤200 chars) before it reaches the database, and the response deliberately omits every personal field on the row. | `SUPABASE_SERVICE_ROLE_KEY` |
| **Supabase / Postgres** | Supabase cloud | NO | Not directly. RLS on, zero policies, grants revoked from `anon` and `authenticated`. | — |
| **Stripe Checkout** | Stripe's own hosted page | The page, yes — it is Stripe's. | The customer enters their own card details there. Klay's code never sees them. | — |
| **Cloudflare Turnstile** | The visitor's browser, loading a script from `challenges.cloudflare.com` | YES | They receive a token; the server verifies it against Cloudflare. | Public site key in the browser; secret key server-side only. |
| **Google Fonts** | The visitor's browser (`@import` in `index.html:23`) | YES | No | — |

**The single most important line in this table:** the React app can be tampered with
completely, and it does not matter, because the only two things it sends that could cost
money — the configuration and the customer's details — are both re-validated and re-priced on
the server before anything is charged.

### 3.3 The diagram

```
                          ┌──────────────────────────────────────┐
                          │            THE BROWSER               │
                          │   (everything here is public and      │
                          │    fully under the customer's control)│
                          └──────────────────────────────────────┘
                                          │
   ┌──────────────────────────────────────┼───────────────────────────────────────┐
   │                                      │                                       │
   ▼                                      ▼                                       ▼
┌─────────────────┐          ┌────────────────────────┐            ┌──────────────────────┐
│  VISUALISER     │          │  CATALOGUE + SHOP      │            │  CART                │
│  useVisualiser  │          │  data/catalogue.ts     │            │  store/cartStore.ts  │
│  Store          │          │  data/products.ts      │            │  ↕ localStorage      │
│                 │          │  data/configOptions.ts │            │    "klay-cart"       │
│  Canvas2DBlind  │          │  (all static, in the   │            └──────────┬───────────┘
│  Renderer  ────▶│  WebGL   │   bundle)              │                       │
│  Canvas2DCurtain│  three.js└────────────────────────┘                       │
│  Renderer       │                       │                                   │
└────────┬────────┘                       │                                   │
         │                                │                                   │
         │  bookingLink()                 │  "Add to Cart" / "Buy Now"         │
         │  ?type&size&op&qty&fabric&hw   │                                    │
         ▼                                ▼                                    ▼
   ┌──────────────────────────────┐                              ┌──────────────────────┐
   │  /book — BookInstallPage     │                              │  /cart — CartPage    │
   │  name, email, phone, address │                              │  9 form fields       │
   │  + live price breakdown      │                              │                      │
   └───────┬──────────────┬───────┘                              │   handleSubmit()     │
           │              │                                      │   → alert()          │
   "Request a quote"   "Pay & book"                              │   → clearCart()      │
           │              │                                      │                      │
           │              │                                      │   ✗ NOTHING LEAVES   │
           │              │                                      │     THE BROWSER      │
           │              │                                      └──────────────────────┘
           │              │
═══════════╪══════════════╪═══════════ T R U S T   B O U N D A R Y ═════════════════════
           │              │
           ▼              ▼
  ┌─────────────────┐  ┌──────────────────────────┐
  │ /api/           │  │ /api/                    │
  │ request-quote   │  │ create-checkout-session  │
  │                 │  │                          │
  │ rate limit      │  │ rate limit               │
  │ honeypot        │  │ honeypot                 │
  │ turnstile       │  │ turnstile                │
  │ parseBooking()  │  │ parseBooking()           │
  │ priceOrder()    │  │ priceOrder()  ◀── THE AMOUNT IS DECIDED HERE,
  │                 │  │                    NEVER READ FROM THE REQUEST
  └────────┬────────┘  └───────┬──────────────┬───┘
           │                   │              │
   INSERT  │           INSERT  │              │ create session
   quote_  │           orders  │              │ (amount in cents)
   requests│        'pending_  │              │
           │          payment' │              ▼
           │                   │      ┌────────────────────┐
           │                   │      │   STRIPE           │
           │                   │      │   hosted checkout  │
           │                   │      └─────────┬──────────┘
           │                   │                │
           │                   │      redirect  │  webhook
           ▼                   ▼        to      │  checkout.session.completed
  ┌───────────────────────────────────┐ /booking│  (signed, raw body)
  │  SUPABASE POSTGRES                │ /confirmed
  │  RLS ON, ZERO POLICIES            │         │
  │  grants revoked from anon         │         ▼
  │                                   │  ┌──────────────────────┐
  │  quote_requests   orders          │◀─│ /api/stripe-webhook  │
  └───────────────────────────────────┘  │ verify signature     │
           ▲                              │ UPDATE status='paid' │
           │                              │ .neq('status','paid')│
           │  SELECT status,              │   ← idempotency guard│
           │  amount_cents, quantity      └──────────┬───────────┘
           │  (no personal fields)                   │
  ┌────────┴──────────┐                              │ 2 × Resend
  │ /api/order-status │◀── polled 6× by              ▼
  └───────────────────┘    /booking/confirmed  ┌───────────────┐
                                               │  RESEND       │
                                               │  4 templates  │
                                               │  best-effort  │
                                               └───────────────┘
```

**Arrows that do not exist and are worth naming:** there is no arrow from the browser to
Supabase (no client library in the bundle), no arrow from the cart to anything, and no arrow
from anywhere to a CRM.

### 3.4 Where the business logic lives

**Where is a product's price determined?**
`src/lib/pricing.ts:150` — `priceOrder()`, built on the `BASE_PRICE` table at line 28,
`MOTORISED_ADDON` at line 36, `INSTALL_PER_BLIND` at line 51 and
`INSTALL_CALLOUT_MINIMUM` at line 55. A second, smaller path exists for curtains:
`src/visualiser/useVisualiserStore.ts:149` — `priceWindow()`, using `CURTAIN_BASE_PRICES`
at line 39. A third exists for the homepage range cards:
`src/data/configOptions.ts:249` — `priceFor()`, which delegates to `pricePerBlind()` for
rollers and returns `null` for everything else.

**Does that code run in the browser? YES.** `src/lib/pricing.ts` is imported by 15 files, ten
of them in `src/`. It ships in the bundle.

**It also runs on the server, and that is the point.** `netlify/lib/booking.ts:10` imports
`parseOrderConfig` and `priceOrder` from `../../src/lib/pricing`, and
`tsconfig.functions.json:27` explicitly includes `src/lib/pricing.ts` in the functions
project so it is typechecked in both worlds. `netlify.toml:13` sets `node_bundler = "esbuild"`
so that cross-boundary import actually bundles.

**Where is a price checked before anything is saved?**
`netlify/lib/booking.ts:114` — `priced: priceOrder(config)`. The request body's own idea of a
price, if it sends one, is never read. `netlify/functions/create-checkout-session.ts:52`
additionally refuses a zero or negative total, and line 84 hands Stripe
`Math.round(line.amount * 100)` computed from that server-side result. The comment at
`src/lib/pricing.ts:12-16` states the rule: *"the server never accepts a price from the
client… Otherwise a hand-edited request could buy a $2,000 job for a dollar."*

**Where is customer input validated?**
Three places, in this order:
1. `src/pages/BookInstallPage.tsx:115` (`localErrors`) and `src/pages/ContactPage.tsx:65` —
   client-side courtesy checks, explicitly described in the code as *"courtesy, not the
   boundary"*.
2. `netlify/lib/booking.ts:64` — `parseBooking()`, the real boundary. HTML stripped
   (line 34), whitespace collapsed, lengths capped per field (120 / 200 / 40 / 240 / 120 /
   8 / 20 / 2000), email / postcode / date / phone shape-checked (lines 48–58).
3. Postgres, via enum types and `check (quantity between 1 and 40)` —
   `supabase/migrations/0001_bookings.sql:59` and `:102`.

**The cart path has none of this.** `src/pages/CartPage.tsx` runs no validation beyond the
browser's own `required` attributes, because nothing is ever sent.

**Where is a booking reference generated?**
Postgres: `id uuid primary key default gen_random_uuid()` —
`supabase/migrations/0001_bookings.sql:42` (quote_requests) and `:82` (orders). The id is
returned to the browser at `netlify/functions/request-quote.ts:59` and echoed into the alert
email at `netlify/lib/notify.ts:93`. There is no human-readable reference number anywhere —
a customer's "reference" is a raw UUID.

**Is there any authentication or user login in this application at all?**
**NO.** Nowhere. No login page, no session, no `supabase.auth` call, no cookie, no JWT, no
password field. `netlify/lib/db.ts:19` explicitly disables session persistence. The two
things that stand in for auth are (a) the Stripe session id, which is unguessable and gates
`/api/order-status`, and (b) a **hostname allowlist** on the visualiser pages —
`src/pages/VisualiserPage.tsx:54-56`:

```js
const allowedHosts = ['localhost', 'klay-website.netlify.app', 'klay-interiors.netlify.app', 'klayinteriors.com.au', 'www.klayinteriors.com.au'];
const validKeys = ['klay-internal-2026', 'ella-embed-2026'];
const isAllowed = allowedHosts.includes(hostname) || validKeys.includes(key ?? '');
```

Both of those bypass keys are hard-coded in the browser bundle and readable by anyone. This
is not authentication and should not be mistaken for it; it stops the page appearing on a
copy of the site served from an unexpected domain, and nothing more.

---

## 4. THE CUSTOMER JOURNEY, TRACED THROUGH THE CODE

### The main path: homepage → a booking in the database

| # | What the customer sees | Component | State that changes | Network | Written where |
|---:|---|---|---|---|---|
| 1 | A moving bar of six credentials above everything | `TrustTicker.tsx` | local `paused` | — | — |
| 2 | Charcoal nav: KLAY · SHOP · VISUALISE · ABOUT · CONTACT · cart · SHOP NOW | `Nav.tsx` | reads `useKlayStore.scrollY` | — | — |
| 3 | Full-bleed video hero, one headline, one CTA | `Hero.tsx` (video `/hero_video.mp4`) | — | Browser fetches 2.6 MB video | — |
| 4 | 54px marquee: DESIGN · MEASURE · MAKE · INSTALL | `StepsBar.tsx` ← `data/steps.ts` | — | — | — |
| 5 | Four hero product cards | `RangeRow.tsx` ← `data/catalogue.ts` | — | — | — |
| 6 | Clicks **Shop Now** on Roller Blinds; the card widens and a configurator slides in beside the photo | `RangeRow.tsx` → `RangeConfigurator.tsx` ← `data/configOptions.ts` | local `openId`, `Selection` | — | — |
| 7 | Scrolls to the visualiser; a blind is **already rendered** on a stock room photo | `VisualiserShowcase.tsx` → `KlayConfigurator.tsx` | `photoUrl` = `/images/Preview.png`; one `TracedArea` seeded from `DEFAULT_WINDOW_CORNERS_PCT` (`KlayConfigurator.tsx:245`) | Browser fetches `Preview.png` (2.1 MB) + up to 3 fabric textures | — |
| 8 | Changes fabric to Forest Green; the render repaints | `VisualiserControls.tsx` → `useVisualiserStore.setFabricColour` → `writeThrough` (`useVisualiserStore.ts:172`) | `fabricColour` + every following window | — | — |
| 9 | Sets the job to 3 windows and configures window 2 differently | `VisualiserShowcase.tsx` → `setWindowCount`, `setActiveWindow` | `windows[]`, `activeWindow`, `customised` flags | — | — |
| 10a | Clicks **Book Installation →** | `bookingLink()` (`src/lib/bookingLink.ts:23`) | — | — | **The configuration goes into the URL**, not into any store |
| 11 | `/book` shows the configuration, a line-item breakdown and a total | `BookInstallPage.tsx` — `parseOrderConfig` then `priceOrder` from the URL params | local `quantity`, `form` | — | — |
| 12 | Fills nine fields | `FormField.tsx` × 8 + `Honeypot` + `Turnstile` | local `form`, `honeypot`, `turnstileToken` | — | — |
| 13a | Clicks **Request a quote instead** | `submit('quote')` → `requestQuote()` (`src/lib/api.ts:81`) | `busy = 'quote'` | `POST /api/request-quote` | Rate-limit → honeypot → Turnstile → `parseBooking` → **`INSERT INTO quote_requests`** with `estimate_cents` |
| 14a | "Request received" | `BookInstallPage.tsx:167` | `quoteSent = true` | — | Two Resend emails fired with `Promise.allSettled` — the 200 does not depend on them |
| 13b | Clicks **Pay $X & book** | `submit('pay')` → `createCheckoutSession()` | `busy = 'pay'`, never cleared (deliberate — stops a double session) | `POST /api/create-checkout-session` | **`INSERT INTO orders` status `pending_payment`** with the server-derived `amount_cents` and `price_breakdown`, then a Stripe session, then `UPDATE orders SET stripe_session_id` |
| 14b | Redirected to Stripe's hosted page | `window.location.assign(result.data.url)` | — | Leaves the site | — |
| 15b | Pays; Stripe redirects to `/booking/confirmed?session_id=cs_…` | `BookingConfirmedPage.tsx` | `state = 'checking'` | `GET /api/order-status`, polled up to 6× at 1.6s | — |
| 16b | Meanwhile Stripe calls the webhook | `stripe-webhook.ts` | — | — | Signature verified against the raw body → **`UPDATE orders SET status='paid'` with `.neq('status','paid')`** → two Resend emails |
| 17b | "Thank you — you're booked" | `BookingConfirmedPage.tsx` | `state = 'paid'` | — | — |

**Where does this journey stop or break?** It does not — **provided the deploy is
configured.** With no env vars set, step 13 returns HTTP 503 with a message naming the exact
variables to add (`netlify/lib/http.ts:27`). Running `npm run dev` alone (Vite without
`netlify dev`), step 13 gets a 404 and `src/lib/api.ts:59` reports *"Booking is not available
on this environment yet."* Both are honest failures, not silent ones.

**The alternative step 10 is where it does break.**

| # | What the customer sees | Component | Result |
|---:|---|---|---|
| 10b | Clicks **Buy Now** in the homepage visualiser | `VisualiserShowcase.tsx:388-409` | One `addItem()` per window, then `navigate('/cart')` |
| 10c | Or clicks **Add to Cart** on a product page | `ProductDetailPage.tsx:310` and `:500` | `addItem()`, button flashes "✓ Added" for 2s |
| 11' | `/cart` lists the lines and a total | `CartPage.tsx` | Reads `localStorage` |
| 12' | Fills nine fields: first name, last name, email, phone, address, city, state, postcode, notes | `CartPage.tsx:217-432` | local `formData` |
| 13' | Clicks **Request Quote & Measure** | `CartPage.tsx:31-35` | **`alert('Order submitted! We will contact you shortly to arrange measurement.')` then `clearCart()`.** No `fetch`. No row. No email. The basket is emptied so the evidence is gone too. |

**This is the break.** The customer is told their order was submitted; it was not.

### A customer uploading a photo and tracing a window

1. In the rendered state, clicks **Visualise in your own room** — `KlayConfigurator.tsx:508`
   sets `showUploadPrompt`.
2. Chooses **Upload** or **Take photo** — `usePhotoUpload.ts:71` / `:89` create a hidden
   `<input type=file>` (the camera one sets `capture="environment"`).
3. `processFile` (line 46) rejects >15 MB and non-images, decodes with
   `createImageBitmap(file, { imageOrientation: 'from-image' })` so EXIF rotation is honoured,
   downscales to a 1600px longest edge, and produces a JPEG data URL at quality 0.9.
4. An effect pushes `photoUrl` into the store and calls `clearTracedAreas()`
   (`KlayConfigurator.tsx:314`). Because `hasSeededDefaultRef` is already true, this also sets
   `defaultWindowActive = false` — the default-window mode ends and real tracing begins.
5. `CornerPinOverlay` mounts with four corners at 10%/90% of the image
   (`CornerPinOverlay.tsx:15`). Corner handles are crosshairs with a 16px invisible hit
   radius; four midpoint diamonds move two corners together along one axis, which is what
   lets a customer match perspective.
6. **Confirm outline** → `overlayRef.current.confirm()` → `handleConfirmTrace`
   (`KlayConfigurator.tsx:381`) adds a `TracedArea` with `confirmed: true` and a
   `crypto.randomUUID()` id.
7. The renderer takes over. `computeHomography(corners, UNIT_SQUARE)` maps the quad to
   texture space and the fragment shader samples the fabric with true per-pixel perspective.
8. **Download** (`KlayConfigurator.tsx:387`) reads the canvas back as a JPEG and triggers a
   local save. Nothing is uploaded. **The photograph never leaves the browser** — there is no
   storage bucket and no upload endpoint.

### A customer configuring a curtain rather than a blind

1. Clicks the **Curtains** tab — `setProductCategory('curtain')`
   (`useVisualiserStore.ts:332`).
2. The store reconciles the selected colour name against the curtain card, on the flat fields
   **and on every window**, because blinds and curtains are different colour cards and a few
   names appear in both at different hexes.
3. `VisualiserControls` with `showCurtainControls` reveals fabric type (blockout / sheer),
   mount (ceiling / window), size (small…XL) and operation.
4. `KlayConfigurator` dispatches to `Canvas2DCurtainRenderer` — a completely different engine
   (three.js) from the blind path.
5. Price comes from `priceWindow(w, 'curtain')` — `CURTAIN_BASE_PRICES` 320/420/560/720 plus
   a `CURTAIN_MOTOR_ADDON` of 200.
6. **And then it stops.** There is no Buy Now for a curtain.
   `VisualiserShowcase.tsx:61` sets `CURTAIN_ENQUIRY = '/contact'`, and the comment at
   lines 58–60 gives the reason: *"CartItem could not describe the order anyway, since it has
   no mount, no wave-fold heading and a windowSize that stops at large where curtains go to
   XL."* A curtain customer is sent to the contact form. Note also that `/book` and
   `lib/pricing.ts` know nothing about curtains at all — `BlindType` has four members and
   none of them is a curtain, so a curtain cannot travel down the working checkout even if
   someone wired the button up.

### A customer trying to pay

Traced above as steps 13b–17b. In code it is complete. What is *not* in code:
- No Stripe key is set anywhere in this repository (`.env.example` line 25 is empty).
- No webhook endpoint is registered — that is a Stripe dashboard action.
- `INSTALL_PER_BLIND = 60` is flagged in its own comment as *"a placeholder rather than a rate
  anyone at Klay has signed off"* (`src/lib/pricing.ts:38-50`), and it is currently included
  in every amount charged.

So today, on a deploy with no env vars, pressing **Pay & book** produces a 503 whose body
reads: *"This feature is not configured yet. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
STRIPE_SECRET_KEY in the Netlify environment variables."*

---

## 5. FEATURE COMPLETION MATRIX

**DONE** / **WORKS BUT ROUGH** / **HALF BUILT** / **STUB ONLY** / **NOT STARTED**

| Feature | Status | Evidence | What remains |
|---|---|---|---|
| Homepage | **DONE** | `src/pages/HomePage.tsx:135-211` — ten sections, all real | Nothing functional. The install strip's imagery is placeholder (see below). |
| Navigation | **DONE** | `src/components/Nav.tsx:125` — four links, cart badge, CTA; drawer below 860px | Nothing. |
| Shop / `/products` | **DONE** | `src/pages/ProductsPage.tsx`; 14 items from `data/catalogue.ts:116`; filter rail `FilterRail.tsx` | Nothing functional. |
| Product page — roller blinds | **DONE** | `src/pages/ProductDetailPage.tsx`; four slugs `dusk`/`veil`/`duo`/`haze` | The Add-to-Cart button leads to the stub cart. |
| Product page — the other 10 products | **NOT STARTED** | `data/catalogue.ts:140` etc. — `to: enquire('Roman Blinds')` → `/contact?product=…` | Ten products have no page, no price and no configurator. This is deliberate ("price on measure"), but it means 10 of 14 products cannot be bought. |
| Blind configurator | **DONE** | `VisualiserControls.tsx` + `useVisualiserStore.ts`; type, colour (14), hardware (3), size (3), operation (2) | Nothing. |
| Curtain configurator | **WORKS BUT ROUGH** | `VisualiserControls.tsx` with `showCurtainControls`; `CURTAIN_BASE_PRICES` at `useVisualiserStore.ts:39` | It configures and prices, but nothing downstream accepts a curtain — see the row for curtain purchase below. |
| Photo upload | **DONE** | `src/visualiser/usePhotoUpload.ts` — file picker, camera, 15 MB cap, EXIF-correct decode, 1600px downscale | Nothing. |
| Corner-pin tracing | **DONE** | `src/visualiser/CornerPinOverlay.tsx` — 4 crosshairs + 4 midpoint handles, fixed on-screen size via `ResizeObserver` | Nothing. |
| Blind rendering | **DONE** | `Canvas2DBlindRenderer.tsx` — 3,497 lines, WebGL fabric + ~40 Canvas2D lighting passes | Nothing. Genuinely finished. |
| Curtain rendering | **WORKS BUT ROUGH** | `Canvas2DCurtainRenderer.tsx` — three.js, wave physics, sway simulation | 14 tuning screenshots at the repo root and 7 reference PNGs in `public/` indicate active iteration. The renderer is functional; the visual match is still being judged. **UNKNOWN** whether it is signed off — nothing in the repo says. |
| Compare mode (A/B split) | **DONE** | `Canvas2DBlindRenderer.tsx:3378-3420` — one shared divider, both halves clipped and drawn, labelled | Nothing. |
| Multi-window jobs | **DONE** | `useVisualiserStore.ts:353` `setWindowCount`, `:373` `setActiveWindow`, `:384` `applyActiveToAll`, `:172` `writeThrough` | Nothing. The follow/customise model is carefully thought through. |
| Cart | **HALF BUILT** | `src/store/cartStore.ts` — works, persists to `localStorage` | The store is fine. It feeds a checkout that does nothing. |
| Checkout form (`/cart`) | **STUB ONLY** | `src/pages/CartPage.tsx:31-35` — `alert()` + `clearCart()`, no `fetch` | Everything. It collects nine fields of PII including a full address and throws them away while telling the customer it succeeded. |
| Checkout form (`/book`) | **DONE** | `src/pages/BookInstallPage.tsx:127-165` — two real endpoints | Nothing in code. |
| Booking submission | **DONE** | `netlify/functions/request-quote.ts` → `INSERT INTO quote_requests` | Requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set, and the migration run. |
| Payment (blinds) | **DONE in code, NOT CONFIGURED** | `create-checkout-session.ts` + `stripe-webhook.ts` + `order-status.ts` | 6 config steps, no code. See §11. |
| Payment (curtains) | **NOT STARTED** | `CURTAIN_ENQUIRY = '/contact'` — `VisualiserShowcase.tsx:61`; `BlindType` in `lib/pricing.ts:19` has no curtain member | The whole pricing model, the cart line shape and the DB enums would all need a curtain variant. |
| Email confirmation | **DONE in code, NOT CONFIGURED** | `netlify/lib/notify.ts` — 4 templates | `RESEND_API_KEY` + a verified sending domain. See §12. |
| CRM handoff (FieldInsight) | **NOT STARTED** | **Zero occurrences of "FieldInsight" in the entire repository.** | Everything. See §13. |
| Anti-spam | **HALF BUILT** | Honeypot works unconditionally (`antispam.ts:17`); Turnstile is skipped entirely when `TURNSTILE_SECRET_KEY` is unset (`antispam.ts:31-34`) | Set the two Turnstile keys. Until then the only protection is the honeypot and a per-instance rate limiter that resets on cold start. |
| Mobile responsiveness — homepage | **WORKS BUT ROUGH** | 13 files consume `useIsMobile`; `RangeRow`, `Hero`, `SocialProof`, `Nav`, `Footer` all branch | Fine. |
| Mobile responsiveness — About / Contact / How It Works | **HALF BUILT** | None of the three imports `useIsMobile`. `ContactPage.tsx:117` is `padding: '180px 80px 0'`; `AboutPage.tsx:40` `'180px 80px 120px'`; `HowItWorksPage.tsx:144` `'200px 80px 120px'` | 160px of horizontal padding on a 390px phone leaves 230px of content width. These three pages have no mobile branch at all. |
| Mobile responsiveness — the visualiser | **NOT STARTED** | **No file under `src/visualiser/` contains `isMobile`, `useMediaQuery` or a media query.** `VisualiserPage.tsx:81` is a hard `width: 348, flexShrink: 0` sidebar next to `flex: 1` canvas. | The site's centrepiece has no phone layout. |
| About page | **DONE** | `src/pages/AboutPage.tsx` | Desktop only, above. |
| How It Works page | **DONE** | `src/pages/HowItWorksPage.tsx` — 4 steps + 6 FAQs | Desktop only, above. |
| Contact page | **DONE** | `src/pages/ContactPage.tsx:86` posts to `/api/request-quote` | Desktop only, above. |
| 404 | **DONE** | `src/pages/NotFoundPage.tsx` | Nothing. |
| Legacy URL redirects | **DONE** | `src/routes/legacyRedirects.tsx` | Nothing. |
| Privacy / Terms / Warranty pages | **NOT STARTED** | `src/components/Footer.tsx:197` — all three `<FooterLink to="/contact">` | Three legal pages. A site taking card payments in Australia needs at least a privacy policy and terms of sale. |
| Journal / blog | **NOT STARTED** | Removed; `Footer.tsx:87-90` records why — *"It never had a blog behind it"* | Nothing planned. |
| Recommendation quiz | **NOT STARTED** | `RecommendationBanner.tsx:5-12` — *"The recommender did not exist — there is no quiz route and no quiz component in the app"* | The banner now states the four steps instead. Honest. |
| Authentication / accounts | **NOT STARTED** | Nothing anywhere. | — |
| Order history / customer portal | **NOT STARTED** | Nothing anywhere. | — |
| Admin view of bookings | **NOT STARTED** | The `handled`, `handled_at` and `internal_notes` columns exist in both tables but nothing writes them. | Today the only way to read a booking is the Supabase dashboard. |
| Tests | **NOT STARTED** | Zero `*.test.*`, `*.spec.*` or `__tests__` anywhere. | — |
| CI | **NOT STARTED** | No `.github/` directory. | — |

**Tally: 20 DONE · 4 WORKS BUT ROUGH · 4 HALF BUILT · 1 STUB ONLY · 13 NOT STARTED.**

---

## 6. THE VISUALISER

7,819 lines across eight files — 39% of `src/` — and the reason this site is worth more than
a template.

### 6.1 The blind renderer

**Technology:** a hybrid. `Canvas2DBlindRenderer.tsx` paints into a `<canvas>` 2D context for
everything that is light and geometry, and drops to **raw WebGL 1** (not three.js) for the
fabric itself, because the fabric is the one thing that needs true per-pixel perspective
correction. The GL surface is an offscreen context whose output is composited back into the
2D canvas.

**The pipeline, photo to rendered blind:**

| Stage | What happens | Where |
|---|---|---|
| 1. Acquire | Photo loaded and decoded; canvas sized to the photo's natural pixels; the photo drawn as the base layer | `Canvas2DBlindRenderer.tsx:3355-3372` |
| 2. Resolve areas | Confirmed areas separated from the one being actively traced; every needed texture path collected (a dual roller needs two) and all loaded in parallel | `:3341-3352` |
| 3. Pre-fabric depth | A recess shadow inside the traced quad, before anything is drawn over it, so the blind reads as sitting *in* the frame | `drawPreFabricDepth`, `:785` |
| 4. Background diffusion | The photograph behind a translucent fabric is blurred, cached per radius | `diffusedPhoto` `:824`, `drawBackgroundDiffusion` `:863` |
| 5. **The fabric (WebGL)** | `computeHomography(corners, UNIT_SQUARE)` → `toColumnMajor` → `uniformMatrix3fv`; the fragment shader samples the real fabric photo, tints it to the chosen hex, and applies a per-type weave model | `drawQuad` `:741`, shaders `:252` and `:263` |
| 6. Fabric surface | Vignette, centre light, translucent light bleed — all keyed off the fabric's own luminance | `:1168`, `:1209`, `:1248` |
| 7. Light leak | Warm daylight around the fabric edges, per blind type, from a `LEAK_BY_TYPE` table | `:1008`, `drawLightLeak` `:1038` |
| 8. Hardware — cassette | The roller tube, drawn as a real cylinder whose **diameter grows as the blind rolls up** — 45mm bare, 65mm fully wound | `TUBE_BARE_MM`/`TUBE_FULL_MM` `:1448`, `rollDiameterMm` `:1459`, `drawCassette` `:1612` |
| 9. Hardware — bottom rail and chain | Slim flat-top rail, chrome gradient or flat fill by finish | `drawBottomRail` `:1780`, `HARDWARE_FLAT_HEX` `:1370`, `CHROME_GRADIENT_STOPS` `:1377` |
| 10. Contact and drop shadows | Where the rail meets the sill, and under the cassette | `:1127`, `:1278`, `:1320` |
| 11. Room dimming | A single wash over the whole canvas once every blind is down — **once, not per area**, so a two-window room is not darkened twice | `drawRoomDimming` `:3229`, `ROOM_DIM_MAX = 0.08` |
| 12. Trace overlay | Dashed teal quad for the area being traced; small teal dots on confirmed areas | `:3452-3494` |

Dispatch happens at `drawBlindArea` (`:1923`): `productCategory === 'curtain'` →
`drawNewCurtainArea`; `blindType` is a curtain string → `drawCurtainArea`; `dual` →
`drawDualBlindArea`; otherwise the roller path inline.

### 6.2 The curtain renderer

**Technology: three.js.** `Canvas2DCurtainRenderer.tsx` shares nothing with the blind
renderer — different library, different file, different props shape (four corner points as
`{x,y}` objects rather than tuples).

**The pipeline:**

| Stage | What happens | Where |
|---|---|---|
| 1. Wave layout | Nine waves per panel, fixed. Each wave's *width* is computed explicitly in JS — not displaced in a shader — and the compression front travels from the leading edge outward as the panel opens | `WAVES_PER_PANEL = 9` `:72`, `waveWidths` `:553`, `panelLayout` `:578` |
| 2. Real-world scale | One wave per 160mm of track. This is the renderer's only link to physical units, and the sway model needs it because a pendulum's period depends on metres, not pixels | `WAVE_PITCH_MM = 160` `:84` |
| 3. Depth from arc length | The fabric between two carriers is a fixed length, so as carriers close the cloth goes **forward into the room** — a stacked curtain is deeper than a shut one | `DEPTH_SHUT = 0.33`, `DEPTH_PACKED = 0.36` `:110-111` |
| 4. Sway simulation | A damped pendulum with gravity, air resistance, acceleration gain, a per-fold stagger and a 50-frame history buffer, stepped at a capped 1/20s | `:206-299`, `stepSway` `:371`, `sampleSway` `:345` |
| 5. Mesh | 10 columns per wave × 8 rows, rewritten each frame | `COLS_PER_WAVE = 10`, `ROWS = 8` `:440-441`, `writePanelMesh` `:716` |
| 6. Fabric detail map | The real swatch photo is decomposed into low- and high-frequency components at 1024px and normalised to target standard deviations, so the weave is used as *relief* rather than as colour | `buildDetailTexture` `:1295`, `DETAIL_SIZE = 1024`, `SLOPE_TARGET_STD = 0.16`, `DETAIL_TARGET_STD = 0.055` |
| 7. Track | Separate shaders for the track face and its end caps; runners every 80mm | `:1085`, `:1192`, `RUNNER_PITCH_MM = 80` `:1072` |

**What is finished:** the wave model, the compression physics, the depth-from-arc-length
relationship, the sway, the track, and the fabric detail extraction. All of it runs.

**What is still being tuned:** the visual match. Fourteen `curtain-*.png` screenshots at the
repository root, dated 5 August across a 55-minute window, are named for successive attempts
— `curtain-3d`, `curtain-3d-v2`, `curtain-3d-depth`, `curtain-fabric`, `curtain-sfold`,
`curtain-sheer`, `curtain-ref-match`, `curtain-fixed`, `curtain-restored`. Seven full-size
reference photographs sit in `public/images/Textures/curtains/reference/` (12.7 MB) including
`Pencil_pleat_blockout.png`, `Pinch_pleat_blockout.png` and `box_pleat_blockout.png` — three
headings the renderer explicitly no longer draws (`useVisualiserStore.ts:29-31`: *"The
heading used to be a choice of four… The range is wave fold only"*). **UNKNOWN** whether the
current output is signed off; nothing in the repo records a decision.

### 6.3 The homography / corner-pin system

**The problem.** A photograph of a window is a photograph of a rectangle taken at an angle,
so the window is a *quadrilateral* on screen, not a rectangle. If you paste a fabric image
into that quad by stretching it, the weave runs parallel to the edges of the quad instead of
parallel to the edges of the real window, and the eye reads it instantly as a sticker.

**The solution.** `src/visualiser/homography.ts` computes the unique 3×3 projective transform
that maps the traced quad onto the unit square. `computeHomography` (line 13) builds the
standard DLT system — 8 equations in 8 unknowns, `h[8]` fixed to 1 — and solves it with
Gauss-Jordan elimination and partial pivoting (`solveLinearSystem`, line 33), throwing
`"Degenerate quad — corners are collinear or coincident"` if the pivot falls below 1e-12.
`toColumnMajor` (line 76) transposes it into the layout `uniformMatrix3fv` wants, because
WebGL 1 does not accept `transpose = true`.

The fragment shader then applies that matrix **per pixel**, including the perspective divide.
That is the whole trick: the texture is sampled with true perspective correction, per pixel,
rather than the per-vertex interpolation you get by splitting a quad into two triangles. A
blind rendered this way has a weave that converges the way the real window's edges converge.

**Why it is protected IP.** Not because the mathematics is secret — DLT homography is in
every computer-vision textbook. It is protected because of what surrounds it: the pairing of
a customer-draggable four-point overlay with a shader that consumes the result correctly, the
midpoint handles that let a non-technical customer match perspective without understanding
what they are matching, and 3,497 lines of lighting model that make the output believable.
The 83 lines of `homography.ts` are the hinge that the other 7,700 turn on.

### 6.4 The interface between the visualiser and the rest of the app

**In:** three optional props on `KlayConfigurator` (`defaultBlindType`, `mediaMaxVh`) and
five on `VisualiserControls` (`lockedRange`, `compact`, `showCurtainControls`, `onDark`,
`showPrice`). Everything else arrives through the shared store.

**Out:** nothing is returned by callback. Consumers read the store directly.
`VisualiserShowcase`, `ProductDetailPage`, `VisualiserPage` and `VisualizerLabPage` all pull
`blindType`, `windowSize`, `operation`, `fabricColour`, `hardwareColour`, `tracedAreas` and
`windows` out of `useVisualiserStore` and turn them into either a `bookingLink()` URL or a
cart line.

**Reads and writes:** the visualiser owns `useVisualiserStore` entirely. It reads
`data/products.ts` (colour cards, hardware hexes), `lib/pricing.ts` (`pricePerBlind`) and
`theme.ts`. It writes nothing outside its own store.

**One thing to understand:** the store is created at module scope, so it is a **single global
instance shared by every mount on the page and across navigations**. `KlayConfigurator`
releases `lockedRange` on unmount specifically because of this
(`KlayConfigurator.tsx:283`), and there is a 12-line comment at `:333-345` about a bug where
arriving from the homepage left stale state that stopped the product page ever seeding.

### 6.5 How the two renderers relate

**Almost entirely separate.** Shared: `RenderedArea`/`AreaParams` (the props shape), the
store, and the colour cards. Not shared: the graphics library (raw WebGL vs three.js), the
homography (only the blind renderer imports it), the lighting model, the texture handling,
the colour helpers. Both files independently define `hexToRgb` and `luma01`
(`Canvas2DBlindRenderer.tsx:55`/`:87` and `Canvas2DCurtainRenderer.tsx:507`/`:502`), and both
independently define a hardware hex map (`HARDWARE_FLAT_HEX` at `:1370` vs a local
`HARDWARE_HEX` at `Canvas2DCurtainRenderer.tsx:474`, neither of which is
`data/products.ts`'s `HARDWARE_HEX`, which the blind renderer *also* imports).

**Quantified duplication:**

| Pair | Duplicated 20-line windows |
|---|---:|
| `visualiser/Canvas2DBlindRenderer` ↔ `visualiser-lab/Canvas2DBlindRenderer` | ~3,130 (byte-identical) |
| `visualiser/Canvas2DCurtainRenderer` ↔ lab copy | ~1,743 (byte-identical) |
| `visualiser/KlayConfigurator` ↔ lab copy | ~661 (byte-identical) |
| `visualiser/VisualiserControls` ↔ lab copy | ~612 (byte-identical) |
| `visualiser/useVisualiserStore` ↔ lab copy | ~343 (byte-identical) |
| `visualiser/CornerPinOverlay` ↔ lab copy | ~279 (byte-identical) |
| `visualiser/usePhotoUpload` ↔ lab copy | ~106 (byte-identical) |
| `visualiser/homography` ↔ lab copy | ~56 (byte-identical) |
| `pages/VisualiserPage` ↔ `pages/VisualizerLabPage` | ~45 |
| `pages/BookInstallPage` ↔ `pages/ContactPage` | ~12 (the shared form idiom) |

**Between the two *renderers* themselves: zero 20-line windows in common.** The duplication in
this codebase is entirely the sandbox fork, not the engines.

**Within** `Canvas2DBlindRenderer.tsx` there are two curtain implementations —
`drawNewCurtainArea` (line 2483, 557 lines) and `drawCurtainArea` (line 3047, 147 lines).
Both are still reachable: the first for `productCategory === 'curtain'`, the second for the
legacy blind-type strings `'sheer-curtains'` and `'blockout-curtains'`. Nothing in the current
UI can produce those strings — `VisualiserControls` offers only the four roller types, and
curtains go through the three.js renderer. **`drawCurtainArea` and its 147 lines are
unreachable in practice**, as is the third curtain implementation this file's header comment
describes.

### 6.6 Every texture, asset and colour the renderers depend on

**Blind renderer textures** — `TEXTURE_ROOT = '/images/Textures'`, `:153`:

| Blind type | Path | On disk? |
|---|---|---|
| `blockout` | `/images/Textures/Blockout/Blockout_fabric.png` | Yes, 125,446 B |
| `sunscreen` | `/images/Textures/Sunscreen/Sunscreen.png` | Yes, 159,681 B |
| `lightfilter` | `/images/Textures/Light-filter/light_filter.png` | Yes, 102,210 B |
| `dual` | Blockout front + Sunscreen back | Yes |
| `sheer`, `sheer-curtains` | `/images/Textures/curtains/sheer_produced.png` | Yes, 3.7 MB — but unreachable code |
| `blockout-curtains-light/dark` | `/images/Textures/curtains/Blockout_produced.png` | Yes, 3.5 MB — but unreachable code |

**Curtain renderer textures** — `FABRIC_SAMPLE`, `:1239`:
`blockout` → `/images/Textures/curtains/Blockout_produced.png`;
`sheer` → `/images/Textures/curtains/sheer_produced.png`.

> **The case-sensitivity trap, stated twice in the code.** `Canvas2DBlindRenderer.tsx:146-152`
> and `Canvas2DCurtainRenderer.tsx:1240-1244` both warn that these paths are served verbatim
> by a Linux host where `Textures` ≠ `textures` and `Light-filter` ≠ `light-filter`. The
> capitalisation is inconsistent on disk *by accident and now on purpose* —
> `Blockout_produced` capitalised, `sheer_produced` not, `curtains` lowercase. A well-meaning
> tidy-up here 404s in production only, after deploy.

**Colours:** `RYNAMIC_COLOURS` (14 entries, `data/products.ts:156`) for blinds,
`CURTAIN_COLOURS` (17 entries, `:198`, each hex sampled from a real swatch photograph and
annotated with its measured luminance) for curtains, `HARDWARE_HEX` (3 entries, `:230`).
`tokens.traceTeal = '#4ABFB5'` in `theme.ts:253` exists solely so the renderer's reference
dots match `TEAL` in `CornerPinOverlay.tsx:21`.

**Room photography:** `PRESET_ROOMS = ['/images/room-3.png', '/images/room-4.png',
'/images/room-5.png']` (`KlayConfigurator.tsx:224`) and `DEFAULT_WINDOW_URL =
'/images/Preview.png'` (`:230`).

### 6.7 Known rough edges visible in the code

**There is not one `TODO`, `FIXME`, `HACK` or `XXX` comment in `src/` or `netlify/`.** That is
unusual and worth saying. What is there instead is a great deal of prose explaining decisions.
The rough edges have to be inferred:

1. **`DEFAULT_WINDOW_CORNERS_PCT`** (`KlayConfigurator.tsx:245`) — four corner positions
   measured by hand against one 1254×1254 photograph. The comment says: *"These pins are
   paired to this photo and only this photo. Swapping DEFAULT_WINDOW_URL without re-measuring
   will hang the blind off its window."*
2. **`void baseRailShape;`** (`Canvas2DBlindRenderer.tsx:1959`) — a prop kept only for API
   compatibility, explicitly discarded.
3. **Two dead curtain paths inside the blind renderer** — §6.5 above, ~704 lines.
4. **Magic numbers, by the dozen.** The blind renderer carries `REFERENCE_BLIND_W = 400`,
   `FABRIC_TEXTURE_AMOUNT = 0.5`, `POT_SIZE = 512`, `CASSETTE_HEIGHT_RATIO = 0.04`,
   `RAIL_HEIGHT_RATIO = 0.018`, `FRONT_LAYER_MAX_DROP = 0.7`,
   `DUAL_BACK_OPACITY_SCALE = 0.85`, `SUNSCREEN_OPACITY_DARK/LIGHT = 0.24/0.7`,
   `ROOM_DIM_MAX = 0.08`. The curtain renderer carries about 35 more. **Every one of them is
   named and most carry a comment justifying the value** — this is tuned code, not sloppy
   code, but there is no way to re-derive any of them from first principles.
5. **Three `eslint-disable-next-line react-hooks/exhaustive-deps`** in `KlayConfigurator.tsx`
   (lines 284, 305, 320) and one in `Canvas2DBlindRenderer.tsx:3494`, each with a comment
   explaining the deliberate dependency choice.
6. **`tracedAreasKey = JSON.stringify(tracedAreas)`** (`Canvas2DBlindRenderer.tsx:3322`) — the
   render effect is keyed on a JSON serialisation of the traced areas to avoid re-running on
   every parent render. It works and it is documented; it is also a full serialise on every
   render of a multi-window job.
7. **No mobile branch anywhere in the visualiser** — see §5.
8. **`Haze` (light filter) has no real assets or pricing.** `data/products.ts:68-70` reuses
   the Sunscreen photograph; `lib/pricing.ts:25-27` says light filter *"has no catalogue
   pricing of its own yet, so it tracks Sunscreen until a real number is supplied."* One of
   four purchasable products is a placeholder.

---

## 7. STATE MANAGEMENT

Three zustand stores. A fourth exists as a byte copy inside the sandbox fork and is a
genuinely separate global instance — that is the fork's stated reason for existing.

### 7.1 `src/store.ts` — `useKlayStore` (16 lines)

Scroll position, published so the nav can react to it.

| Key | Type | Purpose |
|---|---|---|
| `scrollY` | number | Current window scroll. Written by `HomePage`, `ProductsPage`, `ProductDetailPage` from rAF-throttled listeners. Read by `Nav`. |
| `blindHeight` | number | **Written by nobody. Read by nobody.** Dead state. |

| Action | Purpose |
|---|---|
| `setScrollY(y)` | Called from three pages' scroll handlers. |
| `setBlindHeight(h)` | **Never called.** |

**2 keys, 2 actions.** Read by 4 files (`Nav`, `HomePage`, `ProductDetailPage`,
`ProductsPage`); written by 3 (the pages).

### 7.2 `src/store/cartStore.ts` — `useCartStore` (99 lines)

The basket. Persisted to `localStorage`.

| Key | Type | Purpose |
|---|---|---|
| `items` | `CartItem[]` | Every line in the basket. |

`CartItem` carries 13 fields: `id`, `name`, `type`, `blindType`, `fabricColour`,
`hardwareColour`, `windowSize`, `operation`, `price`, `quantity`, `priceOnMeasure?`,
`options?`.

| Action | Purpose |
|---|---|
| `addItem(item)` | Builds a synthetic id from `blindType-fabric-hardware-size-operation`; merges into an existing identical line by bumping quantity. |
| `removeItem(id)` | Drops a line. |
| `updateQuantity(id, n)` | Sets quantity, or removes at ≤0. |
| `clearCart()` | Empties. Called on "checkout". |
| `getTotal()` | Sums `price × quantity` — a **derived value exposed as an action**. |
| `getItemCount()` | Sums `quantity` — likewise derived. |

**1 key, 6 actions** (4 real, 2 selectors). Read by 5 files: `Nav` (badge),
`CartPage`, `ProductDetailPage`, `VisualiserShowcase`, `RangeConfigurator`. Written by 4
(all but `Nav`).

### 7.3 `src/visualiser/useVisualiserStore.ts` — `useVisualiserStore` (399 lines)

The whole visualiser configuration, plus the multi-window job model.

**21 state keys:**

| Key | Purpose |
|---|---|
| `productCategory` | `'blind'` or `'curtain'`. Deliberately **not** per-window — the two leave the site down different paths. |
| `blindType` | One of the four roller types. |
| `fabricColour` | A colour *name*, resolved against whichever card the category selects. |
| `hardwareColour` | `white` / `black` / `chrome`. |
| `windowSize` | `small` / `medium` / `large`. |
| `operation` | `manual` / `motorised`. |
| `curtainType` | `blockout` / `sheer`. |
| `curtainOperation` | `manual` / `motorised`. |
| `curtainMount` | `ceiling` / `window`. |
| `curtainSize` | `small` / `medium` / `large` / `xl`. |
| `curtainOpenness` | 0–1. |
| `windows` | `JobWindow[]` — the job. Each carries all nine configurable fields plus a `customised` flag. |
| `activeWindow` | Index into `windows`. |
| `lockedRange` | When set, the type picker is hidden. |
| `defaultWindowActive` | True until the customer supplies their own photo. |
| `photoUrl` | Data URL or preset path. |
| `rollPosition` | 0 open → 1 closed. |
| `tracedAreas` | `TracedArea[]` — corners plus a snapshot of the configuration. |
| `activeAreaId` | The area currently being traced, if any. |
| `compareMode` | A/B split on or off. |
| `compareDivider` | 0–1. |

**8 computed selectors:** `getCurrentPrice`, `getCurtainPrice`, `getJobTotal`,
`windowsMatch`, `getFabricColor`, `getHardwareColor`, `isConfigComplete`, plus the exported
helpers `coloursFor` and `priceWindow`.

**24 actions:** `setProductCategory` (which also reconciles colour names across every
window), `setBlindType`, `setFabricColour`, `setHardwareColour`, `setWindowSize`,
`setOperation`, `setLockedRange`, `setDefaultWindowActive`, `setWindowCount`,
`setActiveWindow`, `applyActiveToAll`, `setCurtainType`, `setCurtainOperation`,
`setCurtainMount`, `setCurtainSize`, `setCurtainOpenness`, `setPhotoUrl`, `setRollPosition`,
`addTracedArea`, `updateTracedArea`, `removeTracedArea`, `clearTracedAreas`, `setActiveArea`,
`setCompareMode`, `setCompareDivider`.

Read by 6 files: `KlayConfigurator`, `VisualiserControls`, `VisualiserPage`,
`VisualizerLabPage`, `ProductDetailPage`, `VisualiserShowcase`, `RangeRow`. Written by all
except `RangeRow`.

### 7.4 State that exists in two places

**Yes, deliberately, and it is the store's central design.** The nine configuration fields —
`blindType`, `fabricColour`, `hardwareColour`, `windowSize`, `operation`, `curtainType`,
`curtainOperation`, `curtainMount`, `curtainSize` — exist **both** as flat top-level store
keys **and** inside `windows[activeWindow]`. The flat fields mirror the active window.

Every setter routes through `writeThrough` (`:172`), which keeps them in step. The reason is
stated at `:61-67`: the renderers, the configurator and three separate embeds of
`VisualiserControls` all read the flat fields, and *"not one of them has to learn that a job
can hold more than one window."*

`configOf` (`:131`) spells the nine fields out one by one rather than destructuring,
specifically so that adding a tenth field to `WindowConfig` fails to compile instead of
silently going unmirrored.

**A second, smaller duplication:** `TracedArea` snapshots `blindType`, `fabricColor`,
`hardwareColor` and `controlType` at the moment the trace is confirmed — but
`KlayConfigurator.tsx:470-482` overwrites all four from live store state before passing them
to the renderer. The snapshot is written and never read.

### 7.5 State that is stored but could be calculated

- `cartStore.getTotal()` and `getItemCount()` are already derived, correctly.
- `useKlayStore.blindHeight` is stored and neither written nor read.
- `TracedArea.blindType` / `fabricColor` / `hardwareColor` / `controlType` — stored, then
  overwritten from live state before use (above).
- `windowsMatch()` is derived on demand, correctly.
- `defaultWindowActive` could in principle be derived from `photoUrl === DEFAULT_WINDOW_URL`,
  but the store's comment explains why it is not: the flag has to survive the moment between
  the URL changing and the trace being re-seeded.

### 7.6 localStorage, sessionStorage, cookies

**One use, and only one.** `src/store/cartStore.ts:44-97` wraps the store in zustand's
`persist` middleware with `name: 'klay-cart'`, which writes to `localStorage` under that key.
The whole `items` array — every product name, fabric, hardware, size, operation, price and
quantity — is serialised there.

**No `sessionStorage` anywhere. No `document.cookie` anywhere. No analytics, no tracking
pixel, no consent banner** — because there is nothing to consent to. The only third-party
scripts the browser loads are Google Fonts (`index.html:23`) and, when configured, Cloudflare
Turnstile (`Turnstile.tsx:59`).

### 7.7 Is any price, total or discount held in client state?

**YES — and it matters differently on each of the two paths.**

- **`CartItem.price`** (`cartStore.ts:13`) is a number written by the browser and persisted to
  `localStorage`, where the customer can edit it freely with devtools. `getTotal()` sums it.
  `CartPage` prints it. **Nothing ever validates it, because nothing ever sends it anywhere.**
  Today the exposure is zero — the cart submits to `alert()`. **The moment anyone wires the
  cart's submit button to a real endpoint, this becomes a live "buy a $2,000 job for a
  dollar" hole unless that endpoint re-prices from the configuration the way `/book` does.**
- **The `/book` path holds a price in client state too** — `priced` in
  `BookInstallPage.tsx:76` — but it is display-only. `src/lib/api.ts:3-9` states it
  explicitly: *"Note what is NOT sent: a price."* `BookingPayload` has no price field, and
  `netlify/lib/booking.ts` never reads one.
- **There is no discount, coupon or promotion mechanism anywhere in this codebase.**

---

## 8. ROUTING AND PAGES

### 8.1 Every route

`src/App.tsx` declares 16 `<Route>` elements; one is a `.map` over three slugs, so 18 paths
resolve at runtime.

| Path | Component | File | Line |
|---|---|---|---:|
| `/` | `HomePage` | `src/pages/HomePage.tsx` | 82 |
| `/products` | `ProductsPage` | `src/pages/ProductsPage.tsx` | 83 |
| `/products/:slug` | `ProductDetailPage` | `src/pages/ProductDetailPage.tsx` | 87 |
| `/how-it-works` | `HowItWorksPage` | `src/pages/HowItWorksPage.tsx` | 88 |
| `/about` | `AboutPage` | `src/pages/AboutPage.tsx` | 89 |
| `/contact` | `ContactPage` | `src/pages/ContactPage.tsx` | 90 |
| `/visualiser` | `VisualiserPage` | `src/pages/VisualiserPage.tsx` | 91 |
| `/visualizer` | `VisualizerLabPage` | `src/pages/VisualizerLabPage.tsx` | 96 |
| `/book` | `BookInstallPage` | `src/pages/BookInstallPage.tsx` | 100 |
| `/booking/confirmed` | `BookingConfirmedPage` | `src/pages/BookingConfirmedPage.tsx` | 101 |
| `/cart` | `CartPage` | `src/pages/CartPage.tsx` | 102 |
| `/blinds` | `LegacyCategoryRedirect` → `/products` | `src/routes/legacyRedirects.tsx` | 107 |
| `/blinds/:slug` | `LegacyBlindTypeRedirect` → `/products/dusk` or `/products?category=…` | same | 108 |
| `/indoor` | `LegacyCategoryRedirect` → `/products?category=indoor` | same | 110 |
| `/outdoor` | `LegacyCategoryRedirect` → `/products?category=outdoor` | same | 110 |
| `/wardrobes` | `LegacyCategoryRedirect` → `/products?category=wardrobes` | same | 110 |
| `*` | `NotFoundPage` | `src/pages/NotFoundPage.tsx` | 113 |

Server-side, `netlify.toml` adds `/api/*` → `/.netlify/functions/:splat` **ordered above** the
SPA catch-all `/*` → `/index.html`, with a comment explaining that reversing the order is the
classic "my function returns HTML" bug.

### 8.2 Page components with no route pointing at them

**None.** Every file in `src/pages/` is routed.

### 8.3 Routes not reachable from any navigation element

| Route | Reachable from |
|---|---|
| `/visualizer` | **Nothing.** Deliberately unlinked — `App.tsx:92-95`: *"Deliberately unlinked — it is reachable by typing the URL and nothing on the site points at it."* |
| `/visualiser` | **Nothing in the nav.** The nav's VISUALISE link points at `/#visualiser`, the homepage section, not this page — `Nav.tsx:127-132` explains that `/visualiser` is host-gated and *"a bare link to it can dead-end depending on where the site is served from."* Reachable only by typing the URL or from the `?range=` links the code still supports. |
| `/booking/confirmed` | Only as Stripe's `success_url`. Correct. |
| `/book` | Reachable from every "Book Installation" / "Get Quote" CTA via `bookingLink()`. |
| `/how-it-works` | **Not in the nav** (`Nav.tsx:122-124` explains why). Reachable from the steps bar, the footer's Company column, and `/about`. |
| `/cart` | The nav's cart icon and every "Buy Now". |

**So the site's two most valuable surfaces — the standalone visualiser and the sandbox — are
unreachable by clicking.** That is intentional for the sandbox and a deliberate trade for
`/visualiser`, but it means a visitor's only route to the tool is the homepage embed.

### 8.4 Code splitting

**None.** Every one of the twelve page components is a static `import` at the top of
`src/App.tsx` (lines 8–18). There is no `React.lazy`, no `Suspense`, and no dynamic `import()`
anywhere in `src/`. `vite.config.ts` sets no `manualChunks`. The build emits exactly one
JavaScript file, and Vite's own warning says so:

```
(!) Some chunks are larger than 500 kB after minification.
dist/assets/index-Ct8adgkR.js  1,020.06 kB │ gzip: 291.22 kB
```

Consequently a visitor landing on `/contact` downloads three.js, both 3,500-line renderers,
the sandbox fork of both, and the whole catalogue before the page appears.

### 8.5 The navigation as implemented, versus the six-category structure

**As implemented** — `Nav.tsx:125`:

```
KLAY   |   SHOP · VISUALISE · ABOUT · CONTACT   |   [cart]  [SHOP NOW]
```

Four words. `SHOP` and `SHOP NOW` both go to `/products`. `VISUALISE` goes to `/#visualiser`.
Nothing opens on hover. Below 860px the whole thing collapses to a drawer.

The nav's header records three previous versions and why each was abandoned: category
dropdowns (Indoor/Outdoor/Wardrobes — *"the business's filing system, not the customer's
question"*), a single OUR RANGE menu, and the six ranges spelled across the bar (*"it spent
the entire width of the nav on a taxonomy"*).

**Versus the planned six categories — Curtains, Blinds, Awnings, Wardrobes, Screens,
Shelving:**

| Planned category | Exists as a nav item? | Exists as a catalogue group? | Exists as products? | Buyable? |
|---|---|---|---|---|
| **Curtains** | No | No — it is one item inside `Indoor` | 1 catalogue item, `curtains` | No — enquiry only |
| **Blinds** | No | No — six items inside `Indoor` | Roller, Roman, Honeycomb, Venetian, Vertical, + Plantation Shutters | Roller only |
| **Awnings** | No | No — inside `Outdoor` | 1 item, `folding-arm-awnings` | No |
| **Wardrobes** | No | No — inside `Other` | 1 item, `wardrobes` | No |
| **Screens** | No | No | Partially: `zip-guide-systems`, `pleated-flyscreens`, `frameless-shower-screens` are three separate items, not one "Screens" category | No |
| **Shelving** | No | No — inside `Other` | 1 item, `shelving` | No |

**The six-category structure does not exist in this codebase in any form.** What exists is a
**three**-group taxonomy — `Indoor` / `Outdoor` / `Other` (`data/catalogue.ts:33`) — with 14
products distributed across it, surfaced as the shop's filter rail rather than as navigation.
The catalogue's header explicitly calls that grouping *"the business's own"* and says it
replaced a 22-item list that had *"invented Panel Blinds, Straight Drop Awnings, Louvre Roofs,
Café Blinds and Outdoor Roller Blinds."*

Moving to six categories would mean: a new grouping field on `CatalogueItem`, a rewritten
`FilterRail`, a decision on where Plantation Shutters and Shower Screens live, and a nav
change the last three iterations of that file deliberately walked away from.

---

## 9. THE BACKEND SURFACE

### 9.1 Supabase

The schema **is** version-controlled in the repository: `supabase/migrations/0001_bookings.sql`,
149 lines, the only file in `supabase/`. Whether it has ever been *run* against a live project
is **UNKNOWN** — there is no migration history table dump, no `supabase/config.toml`, no CLI
link file, and `.env.example` carries only the placeholder `https://your-project.supabase.co`.

> **Note on the filename.** It is called `0001_bookings.sql` and **there is no `bookings`
> table.** It defines `quote_requests` and `orders`. If you go looking for a table called
> `bookings` you will not find one.

**Tables defined: 2.**

| Table | What it stores |
|---|---|
| `public.quote_requests` | Somebody asking Klay to come and measure, with the configuration they built in the visualiser attached, and the estimate they were shown at the time. No money involved. |
| `public.orders` | Somebody paying up front. One row per Stripe Checkout session, written before the redirect and settled by the webhook. |

**Five enum types** are also defined: `klay_blind_type` (blockout/sunscreen/lightfilter/dual),
`klay_window_size` (small/medium/large), `klay_operation` (manual/motorised),
`klay_request_kind` (quote/payment — **defined and used by no column**), and
`klay_order_status` (pending_payment/paid/failed/expired/refunded).

#### Every column of `orders` (the closest thing to a "bookings" table)

| Column | Type | Constraint |
|---|---|---|
| `id` | `uuid` | primary key, `default gen_random_uuid()` |
| `created_at` | `timestamptz` | not null, `default now()` |
| `updated_at` | `timestamptz` | not null, `default now()`, maintained by trigger `orders_touch_updated_at` |
| `status` | `klay_order_status` | not null, `default 'pending_payment'` |
| `name` | `text` | **not null** |
| `email` | `text` | **not null** |
| `phone` | `text` | nullable |
| `address` | `text` | nullable |
| `suburb` | `text` | nullable |
| `postcode` | `text` | nullable — **no four-digit check at the DB level**; that is enforced in `netlify/lib/booking.ts:78` only |
| `preferred_date` | `date` | nullable |
| `notes` | `text` | nullable |
| `blind_type` | `klay_blind_type` | not null |
| `window_size` | `klay_window_size` | not null |
| `operation` | `klay_operation` | not null |
| `quantity` | `integer` | not null, `default 1`, `check (quantity between 1 and 40)` |
| `fabric_colour` | `text` | nullable |
| `hardware_colour` | `text` | nullable |
| `amount_cents` | `integer` | not null, `check (amount_cents >= 0)` |
| `currency` | `text` | not null, `default 'aud'` |
| `price_breakdown` | `jsonb` | nullable — the line items priced at purchase time |
| `stripe_session_id` | `text` | **unique**, nullable |
| `stripe_payment_intent` | `text` | nullable |
| `paid_at` | `timestamptz` | nullable |
| `handled` | `boolean` | not null, `default false` — **nothing in the codebase ever sets it** |
| `internal_notes` | `text` | nullable — **nothing ever writes it** |

`quote_requests` carries the same customer and configuration columns plus
`estimate_cents integer not null check (estimate_cents >= 0)`, `handled`, `handled_at` and
`internal_notes`. It has **no** money, Stripe or status columns.

**Indexes:** `quote_requests_created_at_idx`, `quote_requests_unhandled_idx` (partial,
`where not handled`), `orders_created_at_idx`, `orders_status_idx`, `orders_session_idx`.

#### Row Level Security

Enabled on both tables. Quoted verbatim, lines 144–145:

```sql
alter table public.quote_requests enable row level security;
alter table public.orders enable row level security;
```

#### Every policy

**There are none.** Zero `create policy` statements in the file. That is deliberate and the
migration says so at lines 7–11:

```sql
-- SECURITY MODEL: the browser never touches these tables. Every write arrives
-- through a Netlify function holding the service-role key, so RLS is enabled
-- with *no* public policies at all — that combination denies anon/authenticated
-- outright while the service role bypasses RLS by design. A leaked anon key
-- therefore reads nothing and writes nothing here.
```

#### Every GRANT statement

There are no `grant` statements. There are two `revoke` statements, lines 148–149:

```sql
revoke all on public.quote_requests from anon, authenticated;
revoke all on public.orders from anon, authenticated;
```

#### What could a stranger with only the public key do to each table?

| Table | Read? | Insert? | Update? | Delete? |
|---|---|---|---|---|
| `public.quote_requests` | **NO** | **NO** | **NO** | **NO** |
| `public.orders` | **NO** | **NO** | **NO** | **NO** |

Two independent mechanisms produce that answer, and either alone would be sufficient: RLS
enabled with zero policies denies `anon` and `authenticated` outright, and the table grants
are revoked from both roles on top of that.

**And there is a third layer that matters more than either:** the anon key is not in the
browser bundle at all. `@supabase/supabase-js` is imported by exactly one file in this
repository — `netlify/lib/db.ts` — which is server-only. There is no
`VITE_SUPABASE_ANON_KEY` read anywhere in `src/`. `netlify.toml:7` sets
`SECRETS_SCAN_OMIT_KEYS = "VITE_SUPABASE_URL"` in anticipation of a browser-side Supabase
client that does not currently exist.

This is the strongest part of the whole system.

#### Storage buckets

**None.** No bucket is created in the SQL, no `storage.from(...)` call exists anywhere, and
customer photographs never leave the browser — `usePhotoUpload.ts` produces a data URL and
`KlayConfigurator`'s Download button reads the canvas back locally.

### 9.2 Serverless and edge functions

**Four Netlify Functions exist. Zero Netlify Edge Functions exist.**

| Function | File | Trigger | What it does |
|---|---|---|---|
| `request-quote` | `netlify/functions/request-quote.ts` | `POST /api/request-quote` (declared both as `config.path` and via the `netlify.toml` redirect) | Rate-limit → honeypot → Turnstile → validate → insert `quote_requests` → fire two emails via `Promise.allSettled` → return `{ok, id}`. Returns 200 even if both emails fail, because the row is the record. |
| `create-checkout-session` | `netlify/functions/create-checkout-session.ts` | `POST /api/create-checkout-session` | Same gauntlet, then re-derives the amount with `priceOrder()`, inserts `orders` as `pending_payment`, creates a Stripe Checkout session itemised from the same `priced.lines` the customer saw, updates the row with the session id, returns the URL. |
| `stripe-webhook` | `netlify/functions/stripe-webhook.ts` | `POST /api/stripe-webhook`, called by Stripe | Reads the **raw** body first, verifies the HMAC signature, then handles four event types. Marks paid with `.neq('status','paid')` so a duplicate delivery matches no rows and sends no second email. |
| `order-status` | `netlify/functions/order-status.ts` | `GET /api/order-status?session_id=cs_…` | Shape-checks the id, returns `{found, status, amountCents, quantity}` and nothing else. |

`netlify.toml:18-19` gives `stripe-webhook` `included_files = []` with the comment *"The
webhook needs Stripe's exact bytes to verify the signature, so it must not be parsed or
re-encoded on the way in."*

**Not "all logic runs in the browser."** All *presentation* runs in the browser; all money,
validation and persistence run in these four functions.

---

## 10. EVERY OUTBOUND NETWORK CALL

Every call site in `src/`. The list is short, and that is the point.

| File:line | Talks to | Read/Write | Data sent | From the customer? |
|---|---|---|---|---|
| `src/lib/api.ts:45` (via `requestQuote`, `:81`) | `POST /api/request-quote` — own origin | **Write** | `BookingPayload`: name, email, phone, address, suburb, postcode, preferredDate, notes, blindType, windowSize, operation, quantity, fabricColour, hardwareColour, website (honeypot), turnstileToken | **YES — all of it.** Server treats it as hostile: validated, HTML-stripped, length-capped. |
| `src/lib/api.ts:45` (via `createCheckoutSession`, `:85`) | `POST /api/create-checkout-session` — own origin | **Write** | Identical payload. **No price field exists on the type.** | **YES.** Server re-derives the amount. |
| `src/pages/BookingConfirmedPage.tsx:53` | `GET /api/order-status?session_id=…` — own origin | **Read** | One Stripe session id, `encodeURIComponent`-escaped | Indirectly — it arrives in Stripe's `success_url`. Shape-checked server-side; the response deliberately omits every personal field. |
| `src/components/Turnstile.tsx:59` | `https://challenges.cloudflare.com/turnstile/v0/api.js` — script tag | Read (script load) | Nothing but the request itself. The widget then renders a Cloudflare iframe. | No |
| `index.html:23` | `https://fonts.googleapis.com` (`@import`), which pulls from `fonts.gstatic.com` | Read | Nothing but the request | No |
| `src/components/home/Hero.tsx` (`HERO_VIDEO`) | `/hero_video.mp4` — own origin | Read | — | No |
| `src/visualiser/usePhotoUpload.ts:128`, `Canvas2DBlindRenderer.tsx:91` | Own-origin images: `Preview.png`, `room-*.png`, the fabric textures | Read | — | No |
| `src/components/home/SocialProof.tsx:482` | `https://www.instagram.com/klayinteriors` | Navigation only (an `<a>`) | — | No |

**Server-side, for completeness:**

| File:line | Talks to | Read/Write | Data sent |
|---|---|---|---|
| `netlify/lib/db.ts:18` | Supabase Postgres, service-role key | Read + Write | Full booking rows |
| `netlify/functions/create-checkout-session.ts:76` | Stripe API | Write | Line items, customer email, order id in metadata |
| `netlify/functions/stripe-webhook.ts:119` | Stripe SDK signature verification | — | — |
| `netlify/lib/notify.ts:26` | Resend API | Write | Customer name, email, phone, full address, notes, configuration, price |
| `netlify/lib/antispam.ts:42` | `https://challenges.cloudflare.com/turnstile/v0/siteverify` | Write | The Turnstile token and the client IP |

**Total browser call sites that transmit customer data: 3.** All three are same-origin. There
is no analytics, no error reporting, no session recorder, no chat widget, no tag manager, and
no third-party script other than Turnstile and Google Fonts. The CSP in `netlify.toml:33`
enforces this — `connect-src` allows only `'self'`, `*.supabase.co`, `api.stripe.com` and
`challenges.cloudflare.com`.

---

## 11. PAYMENTS

The premise handed to me was that Stripe is not connected. **That is true of the
configuration and false of the code.** The integration is written, and written carefully.
What is missing is entirely outside this repository.

### 11.1 Every mention of Stripe

**67 occurrences** across `src/`, `netlify/`, `supabase/`, `netlify.toml`, `.env.example`,
`package.json` and `README.md` (excluding the sandbox fork and the word "stripes" in the
renderers' weave comments).

**Real integration code (`netlify/`):**

| File:line | Context |
|---|---|
| `create-checkout-session.ts:17` | `import Stripe from 'stripe'` |
| `create-checkout-session.ts:74` | `const stripe = new Stripe(e.stripeSecretKey)` — `apiVersion` deliberately omitted so the SDK uses the version it was built against |
| `create-checkout-session.ts:76-106` | `stripe.checkout.sessions.create({...})` — mode `payment`, line items built from `priced.lines`, `customer_email`, `client_reference_id`, metadata carrying `order_id` and the configuration, `success_url` and `cancel_url` from `SITE_URL`, `submit_type: 'pay'` |
| `create-checkout-session.ts:111-118` | `UPDATE orders SET stripe_session_id` |
| `stripe-webhook.ts:21` | `import Stripe from 'stripe'` |
| `stripe-webhook.ts:110-111` | Rejects a missing `stripe-signature` header with 400 |
| `stripe-webhook.ts:114` | `const raw = await req.text()` — the raw body, read before and instead of any JSON parse |
| `stripe-webhook.ts:119` | `stripe.webhooks.constructEventAsync(raw, signature, e.stripeWebhookSecret)` |
| `stripe-webhook.ts:128-148` | The four event cases |
| `stripe-webhook.ts:59` | `.neq('status', 'paid')` — the idempotency guard |
| `lib/env.ts:17-18, 31-32, 40-41, 57-58` | `stripeSecretKey`, `stripeWebhookSecret`, the `payments` and `webhook` capability lists |

**Browser code (`src/`) — 8 mentions, all of them comments or copy, no SDK:**

| File:line | Context |
|---|---|
| `src/lib/api.ts:84` | `/** Pay-now path: returns the Stripe Checkout URL to redirect to. */` |
| `src/lib/api.ts:85` | `createCheckoutSession` — a `fetch` to own origin, nothing more |
| `src/pages/BookInstallPage.tsx:156` | Comment: *"Hand off to Stripe. Deliberately not clearing `busy`…"* |
| `src/pages/BookInstallPage.tsx:160` | `window.location.assign(result.data.url)` |
| `src/pages/BookInstallPage.tsx:537` | Customer-facing copy: *"Card payments are handled by Stripe. Klay never sees your card details."* |
| `src/pages/BookingConfirmedPage.tsx:9,15,18,56` | Comments about the return URL and the webhook race |
| `src/lib/pricing.ts:5,82,148` | Comments about which figure Stripe is handed |
| `src/App.tsx:93` | Comment: *"/booking/confirmed is Stripe's return URL"* |

**The Stripe JavaScript SDK is not loaded in the browser at all.** No `@stripe/stripe-js`, no
Stripe Elements, no `<script src="js.stripe.com">`. The entire payment UI is Stripe's own
hosted page, reached by a full-page redirect. That is why the customer-facing claim on
`BookInstallPage.tsx:537` is true.

**Configuration and schema:**

| File:line | Context |
|---|---|
| `package.json:21` | `"stripe": "^22.4.0"` |
| `netlify.toml:16-19` | `[functions."stripe-webhook"] included_files = []` |
| `netlify.toml:33` | CSP allows `connect-src https://api.stripe.com` and `frame-src https://js.stripe.com` — **both currently unused**, since the integration is a redirect and there is no embedded frame |
| `.env.example:22-28` | The `--- Stripe ---` block: `STRIPE_SECRET_KEY=` and `STRIPE_WEBHOOK_SECRET=`, both empty |
| `supabase/migrations/0001_bookings.sql:115-116, 126` | `stripe_session_id text unique`, `stripe_payment_intent text`, `orders_session_idx` |
| `README.md:34, 70-79, 97, 108` | Setup instructions |

### 11.2 Placeholders, commented-out code, TODOs, dead references

- **No commented-out Stripe code anywhere.** No `// const stripe = ...`, no stub returning a
  fake session.
- **No `TODO` comments anywhere in the repository** (§18).
- **One flagged placeholder, and it is about money.** `src/lib/pricing.ts:38-51`:

  > *"CONFIRM THIS NUMBER BEFORE TAKING REAL PAYMENTS. The configurator has always shown its
  > estimate as '+ professional installation across Victoria' — i.e. install was quoted
  > separately and never priced in the code. Charging the full amount up front means the
  > checkout has to include it, so it needs a value, and this is a placeholder rather than a
  > rate anyone at Klay has signed off."*

  `INSTALL_PER_BLIND = 60`, with `INSTALL_CALLOUT_MINIMUM = 120`. On a single medium blockout
  blind this is $120 of a $380 total — **32% of what would be charged is a number nobody has
  approved.**
- **Two dead CSP entries.** `connect-src https://api.stripe.com` and
  `frame-src https://js.stripe.com` are allowed but nothing uses them. Harmless; they would be
  needed if Elements were ever embedded.
- **One unused enum.** `klay_request_kind as enum ('quote', 'payment')` is created at
  `0001_bookings.sql:31` and no column has that type.

### 11.3 Environment variables named for Stripe

| Variable | `VITE_`? | In browser bundle? | Set in `.env.example`? | Read at |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | No | **No** | Present, **empty** | `netlify/lib/env.ts:40` |
| `STRIPE_WEBHOOK_SECRET` | No | **No** | Present, **empty** | `netlify/lib/env.ts:41` |

Both are read exclusively through `netlify/lib/env.ts`, which is imported only by
server-side files. `env.ts:5-7` states the rule: *"none of it is prefixed VITE_, so Vite will
not inline any of it into the browser bundle. That distinction is the whole security
boundary."**Whether either is set in the live Netlify environment is UNKNOWN** — I cannot
see Netlify's dashboard from here.

### 11.4 What happens today when a customer reaches the end of the checkout flow

**It depends entirely on which of the two checkouts they reached.**

**Via `/book` — "Pay $X & book":**

1. `submit('pay')` runs local validation; if `VITE_TURNSTILE_SITE_KEY` is set and no token
   has been received, it stops with *"Please complete the verification challenge."*
2. `createCheckoutSession(payload())` POSTs to `/api/create-checkout-session`.
3. **On a Vite-only dev server** the request 404s and the customer sees *"Booking is not
   available on this environment yet."* (`src/lib/api.ts:59`)
4. **On a Netlify deploy with no env vars**, `missing(e, 'database')` and
   `missing(e, 'payments')` both return names, so the function returns **HTTP 503** with body
   `{"error":"This feature is not configured yet.","detail":"Set SUPABASE_URL,
   SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY in the Netlify environment variables."}`.
   `BookInstallPage` shows that `detail`-less `error` string in a red alert box and re-enables
   the buttons. **Nothing is charged, nothing is stored, and the customer is told plainly.**
5. **On a fully configured deploy**: an `orders` row is written, a Stripe session is created,
   and the browser is redirected to Stripe. The button stays disabled through the redirect so
   an impatient second click cannot open a second session.

**Via `/cart` — "Request Quote & Measure":**

1. `handleSubmit` fires. There is no validation beyond the browser's `required` attributes.
2. `alert('Order submitted! We will contact you shortly to arrange measurement.')`
3. `clearCart()`
4. The customer is left on an empty cart, believing an order was placed.

**No network request. No row. No email. Regardless of how the deploy is configured.**

### 11.5 Is the checkout form collecting anything it should not be collecting yet?

**`/book`: no.** It collects name, email, phone, street address, suburb, postcode, preferred
date and notes. Every one is needed to send a technician to a house, all are length-capped and
HTML-stripped server-side, and none is a payment credential. There is no card number, CVV,
expiry or cardholder field anywhere in `src/` — deliberately, because Stripe's hosted page
takes those.

**`/cart`: yes, in the sense that matters.** It collects first name, last name, email, phone,
street address, city, state and postcode — a complete identification of a real person at a
real address — and then discards all of it while telling the customer it was submitted. The
problem is not that the fields are sensitive; it is that collecting personal data under a
false statement of what will happen to it is the one thing a form must not do. Under the
Australian Privacy Principles this is a live compliance exposure, not merely a bug.

### 11.6 What would need to exist for a real payment to be taken

Derived from what is visibly absent, not from generic Stripe knowledge. **No new code is
required for the `/book` path.**

1. **Run the migration.** Open Supabase → SQL Editor and execute
   `supabase/migrations/0001_bookings.sql` verbatim. Without it, every insert fails and
   `serverError('request-quote:insert', …)` returns a 500. *(No file changes.)*
2. **Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`** in Netlify → Environment variables.
   Read by `netlify/lib/env.ts:38-39`. Without them every endpoint returns 503.
   *(No file changes.)*
3. **Set `STRIPE_SECRET_KEY`.** Read by `netlify/lib/env.ts:40`. Use `sk_test_…` until a full
   payment has been tested. *(No file changes.)*
4. **Register the webhook** at `https://<site>/api/stripe-webhook` in the Stripe dashboard,
   subscribed to `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and
   `checkout.session.expired`, and put its signing secret in **`STRIPE_WEBHOOK_SECRET`**.
   Without this, payments succeed and every order stays `pending_payment` forever, because
   `netlify/functions/stripe-webhook.ts` is the only code that can write `status = 'paid'`.
   *(No file changes.)*
5. **Confirm or change `INSTALL_PER_BLIND`** — `src/lib/pricing.ts:51`. This is the only
   **file edit** on the list. Setting it to `0` removes the installation line from the
   breakdown by itself; leaving it at `60` charges an unapproved rate on every order.
6. **Set `SITE_URL`** (or rely on Netlify's injected `URL`) — `netlify/lib/env.ts:48`. Wrong
   here means Stripe redirects the customer to `http://localhost:8888` after paying.
7. **Set `RESEND_API_KEY` and a verified `KLAY_NOTIFY_FROM`** — §12. Not required for a
   payment to *succeed*, but without it a paying customer gets Stripe's card receipt and
   nothing from Klay.
8. **Set `VITE_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`** — until then
   `netlify/lib/antispam.ts:31-34` skips captcha verification entirely and the only defence
   is a honeypot and a rate limiter that resets on every cold start.
9. **Then, separately: fix the cart.** `src/pages/CartPage.tsx:31-35` must either post to a
   real endpoint or stop pretending. If it is wired up, the endpoint **must re-price from the
   configuration** the way `create-checkout-session.ts` does — `CartItem.price` is
   browser-authored and lives in `localStorage`. Note also that the existing endpoints take a
   *single* `OrderConfig`; a multi-line cart has no server-side representation today, so this
   is real work: a new function, a new table or a line-items column, and a `parseBooking`
   variant that accepts an array.
10. **Write a privacy policy and terms of sale.** `src/components/Footer.tsx:197` currently
    points Privacy, Terms and Warranty at `/contact`.

---

## 12. EMAIL — RESEND

Same shape as Stripe: **the code is complete, the configuration is absent.**

### 12.1 Every mention of Resend or email

**22 occurrences.** All the real ones are in `netlify/lib/notify.ts` and `netlify/lib/env.ts`.

| File:line | Context |
|---|---|
| `netlify/lib/notify.ts:10` | `import { Resend } from 'resend'` — the only import of the SDK anywhere |
| `netlify/lib/notify.ts:17-42` | `send(to, subject, html, replyTo)` — checks `missing(e, 'email')` first and returns `{sent:false, reason:'not configured'}` without throwing; wraps the actual send in try/catch |
| `netlify/lib/notify.ts:25-32` | `new Resend(e.resendApiKey)` → `resend.emails.send({from, to, subject, html, replyTo?})` |
| `netlify/lib/notify.ts:45-46` | `esc()` — escapes `&`, `<`, `>`, `"` in every customer-supplied value |
| `netlify/lib/notify.ts:81` | `notifyQuoteRequest` — internal alert, `replyTo` set to the customer so replying to the alert replies to them |
| `netlify/lib/notify.ts:101` | `acknowledgeQuoteRequest` — customer acknowledgement |
| `netlify/lib/notify.ts:122` | `notifyOrderPaid` — internal "PAID — $X — Name" alert |
| `netlify/lib/notify.ts:154` | `confirmOrderPaid` — customer receipt |
| `netlify/lib/env.ts:19, 33, 42, 45-46, 59` | `resendApiKey`, the `email` capability list, `KLAY_NOTIFY_TO` (default `vedant@nogap.net.au`), `KLAY_NOTIFY_FROM` (default `Klay Interiors <onboarding@resend.dev>`) |
| `netlify/functions/request-quote.ts:54-57` | Both quote emails fired together in `Promise.allSettled` |
| `netlify/functions/stripe-webhook.ts:76-91` | Both paid emails fired together in `Promise.allSettled` |
| `package.json:20` | `"resend": "^6.18.1"` |
| `.env.example:30-38` | The `--- Email (Resend) ---` block |
| `README.md` | Setup step 4 |

**Nothing in `src/` sends email.** There is no `mailto:` form action, no EmailJS, no Formspree.
The only `mailto:` on the site is the footer's contact link.

**Four templates exist, all inline-styled HTML built by the same `shell()` wrapper.** Note
that `shell()` at `notify.ts:73-74` still paints a `border-top: 3px solid #C8973A` and a
gold kicker — **the retired brand gold**, which `src/theme.ts:10` says was removed from the
site entirely. The emails are still on the old palette. Cosmetic, but it means a Klay email
will not match a Klay page.

### 12.2 What a customer receives today after submitting a booking

**It depends on `RESEND_API_KEY`, and I cannot see whether it is set in Netlify.**

- **If `RESEND_API_KEY` is unset:** `missing(e, 'email')` returns `['RESEND_API_KEY']`,
  `send()` logs `[notify] skipped "…" — RESEND_API_KEY not set` and returns without sending.
  **THE CUSTOMER RECEIVES NOTHING.** The page still shows *"we've sent a confirmation to
  <their email>"* (`BookInstallPage.tsx:187-189`), which is a claim the system did not honour.
- **If `RESEND_API_KEY` is set but `KLAY_NOTIFY_FROM` is left at its default
  `onboarding@resend.dev`:** Resend's shared onboarding sender only delivers to the address
  that owns the Resend account. **Every customer acknowledgement is silently rejected** — a
  send failure, logged and swallowed. `.env.example:35-37` and README step 4 both warn about
  exactly this.
- **If both are set correctly:** the customer gets one email —
  *"We have your request — Klay Interiors"* on the quote path, or *"Order confirmed — Klay
  Interiors"* plus Stripe's own card receipt on the paid path.

**Via the cart, in every configuration: THE CUSTOMER RECEIVES NOTHING**, because nothing is
sent.

### 12.3 What Bobby or the office receives today

To `KLAY_NOTIFY_TO`, which **defaults to `vedant@nogap.net.au`** (`netlify/lib/env.ts:44`) —
not to a Klay address, and not to Bobby.

- **Unset `RESEND_API_KEY`: nothing.** The row is in Supabase and the only way to see it is
  the Supabase dashboard. There is no admin page in this application (§5).
- **Configured:** *"New quote request — <name>"* with a full details table and the estimate,
  or *"PAID — $X — <name>"*. Both carry the row's UUID as the reference.
- **From the cart: nothing, ever.**

### 12.4 What would need to exist

1. **Set `RESEND_API_KEY`** in Netlify. Read at `netlify/lib/env.ts:42`. *(No file changes.)*
2. **Verify a sending domain in Resend and set `KLAY_NOTIFY_FROM`** to an address on it —
   e.g. `Klay Interiors <hello@klayinteriors.com.au>`. Until this is done customer email does
   not deliver. *(No file changes.)*
3. **Set `KLAY_NOTIFY_TO`** to wherever Klay actually reads enquiries. The default is a
   personal address hard-coded at `netlify/lib/env.ts:44` and **it will silently be used if
   the variable is unset.** *(No file changes, but the default itself is worth changing in
   `env.ts`.)*
4. **Repaint the templates.** `netlify/lib/notify.ts:50-51, 73-75` still use `#C8973A` gold,
   `#8A8580` warm grey and `#1C1810` warm near-black — all three retired from `src/theme.ts`.
   Emails do not import the theme (they cannot; it is a browser module), so this is a manual
   sync. *(Edit `netlify/lib/notify.ts`.)*
5. **Decide what the cart sends**, if the cart is ever wired up. `notify.ts`'s
   `detailsTable()` renders exactly one configuration; a multi-line cart has no template.
   *(New code in `netlify/lib/notify.ts`.)*
6. **Stop the UI claiming an email was sent when it may not have been.**
   `BookInstallPage.tsx:187` says *"we've sent a confirmation to X"* unconditionally on a 200,
   and a 200 is returned even when both sends fail — by design, so a mail outage cannot lose a
   lead. The design is right; the copy is not. *(Edit `src/pages/BookInstallPage.tsx`.)*

---

## 13. CRM — FIELDINSIGHT

### 13.1 Every mention of FieldInsight, webhooks, or job creation

**FieldInsight: zero occurrences.** I searched the entire repository — every file, every
extension, excluding only `node_modules/` and `.git/` — for `fieldinsight`, `field insight`
and `field-insight`, case-insensitively. **Zero hits.** There is no client, no adapter, no
environment variable, no commented-out block, no type definition, no dead import and no
mention in any comment or in the README.

**Webhooks: 24 occurrences, all of them Stripe's**, listed in §11. There is no outbound
webhook of any kind — nothing in this codebase POSTs to a third-party URL except Stripe's own
SDK, Resend's own SDK and Cloudflare's `siteverify`.

**Job creation: nothing.** No "job", "work order", "schedule", "technician assignment" or
"dispatch" concept exists in the code or the schema. The nearest thing is
`preferred_date date` — a customer's stated preference, stored and never acted on.

### 13.2 What happens to a booking after it lands in the database

**Nothing automated. There is no onward path at all.**

The row is written. Two emails may or may not be sent. And then it sits there. Specifically:

- The schema anticipates a manual process and provides for it: `handled boolean not null
  default false`, `handled_at timestamptz` and `internal_notes text` exist on
  `quote_requests`, and `handled` / `internal_notes` on `orders`. There is even a partial
  index built for the workflow —
  `quote_requests_unhandled_idx on (created_at desc) where not handled`.
- **Nothing in this codebase ever writes any of those columns.** No function updates
  `handled`. No UI displays them. The partial index exists to make a query fast that nothing
  runs.
- There is **no admin page** in the application (§5). The only way to read a booking is the
  Supabase dashboard or a SQL client.
- So the real onward path today is: someone at Klay reads the alert email (if Resend is
  configured, and if it goes to the right address rather than the hard-coded
  `vedant@nogap.net.au` default) and re-keys the job into whatever system they actually use.

### 13.3 What would need to exist

All of it. Nothing is started. Assuming FieldInsight has an HTTP API — **UNKNOWN**; nothing
in this repository describes it:

1. **A new file, `netlify/lib/crm.ts`**, holding the client, following the shape
   `netlify/lib/notify.ts` already establishes: read the key from `env()`, return
   `{sent:false, reason:'not configured'}` when it is missing, log-and-swallow every failure
   so a CRM outage cannot lose a lead that is already in the database.
2. **Two new entries in `netlify/lib/env.ts`** — a `FIELDINSIGHT_API_KEY` (and probably a base
   URL) added to `ServerEnv`, to the `REQUIRED` map (line 29) and to `missing()`'s lookup
   (line 54).
3. **Two call sites**, both inside the existing `Promise.allSettled` blocks so the CRM cannot
   fail a request: `netlify/functions/request-quote.ts:54` and
   `netlify/functions/stripe-webhook.ts:76`.
4. **A mapping from `ParsedBooking` to whatever FieldInsight calls a job.** The customer
   fields map cleanly. The configuration does not: FieldInsight will want line items and
   quantities, and `bookingRow()` (`netlify/lib/booking.ts:120`) produces a single flat
   configuration. `orders.price_breakdown jsonb` is the closest thing to line items that
   exists.
5. **Two new columns**, `fieldinsight_job_id text` and `synced_at timestamptz`, on both
   tables — otherwise a retry creates a duplicate job, and nothing can tell which bookings
   made it across. This means a **new migration file**, `supabase/migrations/0002_*.sql`.
6. **A retry path.** A best-effort fire-and-forget is right for email and wrong for a CRM: a
   lost email is an annoyance, a lost job is a missed appointment. That means either a
   scheduled function sweeping `where fieldinsight_job_id is null`, or an admin view that
   surfaces the gap — and there is no scheduled function and no admin view in this repo.
7. **CSP.** `netlify.toml:33` is `default-src 'self'` with a named allowlist. A server-to-server
   call is unaffected, but if any part of this were ever done from the browser the CSP would
   have to name the host.

---

## 14. THE DESIGN SYSTEM

`src/theme.ts`, 563 lines, imported by **35 of the 54 application files** — the most-imported
module in the repository. Roughly 420 of its 563 lines are comments recording contrast
measurements and the reasoning behind each value.

### 14.1 Every exported token

**78 exported tokens across nine groups plus five standalone exports.** `files` is how many
files reference it; `sites` is how many times.

**`tokens` — colour and font (36)**

| Token | Value | Files | Sites |
|---|---|---:|---:|
| `body` | `'Inter', sans-serif` | 19 | 104 |
| `ink` | `#1D1D1D` | 25 | 98 |
| `warmWhite` | `#F8F8F8` (alias of `paper`) | 23 | 69 |
| `onDark` | `#F8F8F8` | 17 | 36 |
| `line` | `rgba(29,29,29,0.5)` | 11 | 32 |
| `inkSoft` | `rgba(29,29,29,0.7)` | 12 | 31 |
| `display` | `'Cormorant Garamond', serif` | 12 | 27 |
| `charcoal` | `#303030` | 13 | 20 |
| `onDarkMuted` | `rgba(248,248,248,0.6)` | 7 | 19 |
| `lineStrong` | `rgba(29,29,29,0.2)` | 6 | 18 |
| `accent` | `#8A6C46` | 10 | 17 |
| `lineFaint` | `rgba(29,29,29,0.08)` | 8 | 16 |
| `fillStrong` | `#1D1D1D` | 11 | 15 |
| `onDarkEdge` | `rgba(248,248,248,0.45)` | 9 | 14 |
| `onAccent` | `#FFFFFF` | 9 | 13 |
| `accentHover` | `#7A5F3C` | 9 | 12 |
| `parchment` | `#EDEDED` (alias of `band`) | 8 | 11 |
| `onFillStrong` | `#F8F8F8` | 8 | 10 |
| `onDarkLine` | `rgba(248,248,248,0.08)` | 5 | 10 |
| `inkFaint` | `rgba(29,29,29,0.4)` | 4 | 9 |
| `cream` | `#FFFFFF` (alias of `card`) | 6 | 8 |
| `textMuted` | `#5C5C5C` | 2 | 3 |
| `fillStrongHover` | `#3D3D3D` | 1 | 2 |
| `traceTeal` | `#4ABFB5` | 1 | 2 |
| `paper` | `#F8F8F8` | 1 | 1 |
| `card` | `#FFFFFF` | 1 | 1 |
| `accentEdge` | `#725838` | 1 | 1 |
| `accentWash` | `#F5EFE4` | 1 | 1 |
| `textFaint` | `#757575` | 1 | 1 |
| `scrim` | `rgba(29,29,29,0.8)` | 1 | 1 |
| **`band`** | `#EDEDED` | **0** | **0** |
| **`dark`** | `#1D1D1D` | **0** | **0** |
| **`textDark`** | `#1D1D1D` | **0** | **0** |
| **`textMid`** | `#4A4A4A` | **0** | **0** |
| **`fillFaint`** | `rgba(29,29,29,0.15)` | **0** | **0** |
| **`scrimSoft`** | `rgba(29,29,29,0.45)` | **0** | **0** |

**`space` — the Fibonacci ladder (8)**

| Token | Value | Files | Sites |
|---|---:|---:|---:|
| `md` | 20 | 14 | 63 |
| `lg` | 32 | 13 | 28 |
| `xs` | 8 | 9 | 26 |
| `sm` | 12 | 9 | 24 |
| `xl` | 52 | 9 | 19 |
| `xxs` | 4 | 7 | 12 |
| `xxl` | 84 | 8 | 9 |
| **`xxxl`** | **136** | **0** | **0** |

**`type` — the nine type roles (9). Every one has zero direct consumers.**

`ornament` (116), `hero` (clamp 38–76), `section` (clamp 38–64), `card` (26), `numeric` (32),
`lead` (17), `body` (15), `micro` (10) — **0 sites each**; `label` (12) — 1 site.

This is not quite as bad as it looks: `headline.hero/section/card` are declared as *aliases*
of `type.hero/section/card` (line 459), and `eyebrow` spreads `type.micro`. So `type.hero`,
`type.section` and `type.micro` are consumed indirectly. **`type.ornament`, `type.numeric`,
`type.lead` and `type.body` are consumed by nothing at all**, directly or indirectly — and
`type.body` is the definition of *all body copy on the site*.

**`radius` (3)** — `md` (6): 13 files / 42 sites · `sm` (3): 4 / 4 · `lg` (10): 3 / 3
**`motion` (3)** — `button`: 12 / 20 · `link`: 4 / 5 · `card`: 1 / 2
**`shadow` (4)** — `rest`: 2 / 3 · `lift`: 1 / 1 · **`restOnDark`: 0 / 0** · **`liftOnDark`: 0 / 0**
**`layout` (5)** — `inlinePad`: 4 / 8 · `gridMax`: 3 / 3 · `containerMax`: 2 / 2 ·
**`sectionPad`: 0 / 0** · **`sectionPadFocal`: 0 / 0**
**`headline` (3)** — `section`: 8 / 19 · `hero`: 4 / 4 · **`card`: 0 / 0**
**`supporting` (2)** — `onLight`: 6 / 21 · `onDark`: 3 / 4
**Standalone (5)** — `eyebrow`: 14 / 42 · `container`: 6 / 8 · `prefersReducedMotion`: 4 / 8 ·
`lerp`: 1 / 5 · **`easeOutCubic`: 0 / 0**

### 14.2 Tokens with zero consumers

**21 of 78 — 27% of the design system is declared and unused.**

```
tokens.band          tokens.dark          tokens.textDark      tokens.textMid
tokens.fillFaint     tokens.scrimSoft     space.xxxl           type.ornament
type.hero            type.section         type.card            type.numeric
type.lead            type.body            type.micro           shadow.restOnDark
shadow.liftOnDark    layout.sectionPad    layout.sectionPadFocal
headline.card        easeOutCubic
```

Three groups of failure, and they are different problems:

1. **Genuinely orphaned colour tokens (6).** `band`, `dark`, `textDark`, `textMid`,
   `fillFaint` and `scrimSoft` are declared with careful contrast notes and referenced
   nowhere. `fillFaint`'s comment even explains the specific bug it was introduced to fix.
2. **The whole `type` scale (9), which is the serious one.** `theme.ts:315-321` says: *"Nine
   roles, one size each. The same role is never two sizes. Before this the page rendered 21
   distinct font sizes."* **The page still renders 21 distinct font sizes** (§14.4). The scale
   was written; the migration to it was not carried out. `type.body` — the definition of body
   copy — has zero consumers while 8 files hardcode `fontSize: 15`.
3. **Layout and motion helpers (6).** `layout.sectionPad` and `sectionPadFocal` are functions
   taking `isMobile` and returning a padding string. **Nothing calls either**, and the three
   pages with no mobile layout at all (About, Contact, How It Works) are exactly the pages
   they were written for. `space.xxxl` (136) is documented as *"the two focal sections only"*
   and neither uses it.

### 14.3 Hardcoded pixel values

**127 distinct numeric values** across `src/` (excluding the sandbox fork), counted from
CSS-numeric props and `NNpx` string literals:

```
-9999, -4, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20,
22, 24, 26, 27, 28, 32, 34, 36, 38, 40, 41, 42, 44, 48, 52, 53, 54, 56, 58, 60, 63, 64,
66, 72, 76, 78, 80, 84, 85, 90, 96, 100, 103, 110, 116, 120, 130, 140, 148, 160, 170,
180, 182, 190, 192, 195, 200, 220, 232, 250, 260, 270, 274, 276, 277, 278, 280, 300,
320, 340, 348, 360, 380, 390, 400, 420, 425, 436, 443, 460, 470, 480, 512, 520, 524,
559, 560, 588, 621, 635, 640, 649, 660, 700, 717, 719, 720, 768, 800, 850, 860, 900,
940, 945, 1000, 1024, 1100, 1200, 1240, 1250, 1254, 1535, 1600, 4000
```

The spacing scale offers eight values — 4, 8, 12, 20, 32, 52, 84, 136 — and
`theme.ts:290-291` says *"If a layout needs a value that is not here, the layout is wrong.
Report it rather than adding a ninth."* **This is the report: there are 127.** Seven of the
eight scale steps are in use; the eighth (136) is not; and 119 other values are in use
alongside them. Values like 274, 276, 277, 278 and 443, 460, 470 appearing within a few pixels
of each other are the signature of measurements taken off a screenshot rather than chosen from
a ladder.

### 14.4 Hardcoded font sizes

**21 distinct values**, which is exactly the number `theme.ts:317` says the type scale was
created to eliminate:

```
10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28, 30, 32, 34, 56, 116, 120, 160
```

By frequency: `11px` × 28 · `13px` × 24 · `14px` × 23 · `12px` × 17 · `10px` × 8 ·
`15px` × 8 · `20px` × 7 · `16px` × 5 · `24px` × 4 · `32px` × 4 · `34px` × 2 · `18px` × 2 ·
and one each of 22, 26, 28, 30, 56, 116, 120, 160.

Three of these (17, 26, 116) occur only inside `theme.ts` itself, as the scale's own
definitions. **The other 18 are hardcoded at call sites while a token defining the same role
sits unused.**

### 14.5 Every hex colour literal in `src/` not in `theme.ts`

**56 occurrences.** They fall into four groups, and only two are problems.

**(a) Product data — 33 occurrences, all legitimate.** `src/data/products.ts:157-215` and
`:231-233`: the 14 `RYNAMIC_COLOURS`, the 17 `CURTAIN_COLOURS` and the 3 `HARDWARE_HEX`
values. These are fabric and hardware colours, not interface colours. They belong in the
catalogue.

**(b) Renderer internals — 13 occurrences, all legitimate.** `Canvas2DBlindRenderer.tsx:1378-80`
(`#C0BEBB`, `#E0DEDA`, `#A8A6A2` — the chrome gradient), `:1486` (`#FFF`), `:1852`
(`#FAFAFA`), `:2856-58` (eight values in the dual-roller and hardware shading), and
`Canvas2DCurtainRenderer.tsx:477` (`#B0AEA8`). These are lighting model constants inside a
photorealistic renderer, not UI colour.

**(c) Legitimately declared one-offs — 1.** `src/components/FormField.tsx:147`,
`DANGER = '#A03A28'`, documented as *"The one red on the site."* It is exported and used by
two pages. Arguably it should live in `theme.ts`; it is at least declared once.

**(d) Real drift — 9 occurrences, and these are the problem:**

| File:line | Literal | Note |
|---|---|---|
| `src/pages/AboutPage.tsx:8` | `#0f0d09` | In a comment saying the value was removed |
| `src/pages/ContactPage.tsx:11` | `#0f0d09` | Same |
| `src/pages/HowItWorksPage.tsx:9` | `#0f0d09` | Same |
| `src/pages/NotFoundPage.tsx:7` | `#0f0d09` | Same |
| `src/components/home/StepsBar.tsx:25` | **`#000000`** | **BANNED** — see below |
| `src/components/home/StepsBar.tsx:26` | **`#1A1A1A`** | **BANNED** — see below |
| `src/components/Nav.tsx:233` | `#E5E5E5` | A live value, one step off `tokens.parchment` (`#EDEDED`), used nowhere else |
| `src/pages/HowItWorksPage.tsx:61` | `#2a3a4a`, `#4a5a6a` | A live gradient, entirely outside the neutral palette |
| `src/pages/VisualizerLabPage.tsx:75-76, 86` | `#B45309`, `#FFF7ED` | The sandbox banner's amber. Deliberate — *"nothing else here is this colour, so it cannot be mistaken for chrome that belongs to the product."* |

`VisualiserPage.tsx:38-40` and `VisualizerLabPage.tsx:122-124` also hardcode `'#1D1D1D'`,
`'#F8F8F8'` and `'rgba(29,29,29,0.2)'` as strings rather than reading `tokens.ink`,
`tokens.warmWhite` and `tokens.lineStrong` — correct values, wrong source.

### 14.6 `#000`, `#000000`, `#1A1A1A` — the banned blacks

**2 occurrences, both in `src/components/home/StepsBar.tsx`, lines 25 and 26.**

Both sit inside a comment that argues *against* using them:

```
// Charcoal rather than black, because Klay has no black in it — #000000 and
// #1A1A1A are both banned outright, and ink is spoken for as the visualiser's
// one deep ground further down the page.
```

**Zero rendered occurrences.** No element on this site is painted `#000000` or `#1A1A1A`. The
two hits are the prohibition itself. That said, `rgba(0,0,0,X)` **is** used as a shadow colour
in the visualiser — `KlayConfigurator.tsx:43-45` builds `RAISED_SHADOW`, `RAISED_SHADOW_HOVER`
and `PRESSED_SHADOW` from `rgba(0,0,0,0.28)` through `rgba(0,0,0,0.5)`. The blind renderer
went the other way and defines `shadowRgba(a) = rgba(20,16,10,${a})`
(`Canvas2DBlindRenderer.tsx:103`) with a comment explaining that pure black shadows
desaturate a warm palette. The configurator did not get that treatment.

### 14.7 Inline style occurrences

**559 `style={{` occurrences across 54 files.** This is the house rule, stated at
`theme.ts:262`: *"Inline styles are the house rule, which means nothing structural stops the
same semantic role being written five different ways across five files — and it had."*

The consequences are visible and acknowledged in the code itself:
- Every hover state is a React `useState` boolean. `NotFoundPage` has `ctaHover`;
  `ProductDetailPage` has `quoteHover`, `cartHover`, `barCartHover`, `barQuoteHover`;
  `primitives.tsx` exports a `useHover` hook to stop this being written twelve times.
- `:hover`, `:active`, `::-webkit-scrollbar`, `@keyframes` and `@media` cannot be expressed,
  so eleven keyframe animations and two scrollbar treatments live in `index.html` instead.
- `RangeConfigurator.tsx:305` needs a shared panel height *"so all fourteen gold buttons land
  on one line"* — a job CSS would do with a grid.

### 14.8 Components defining their own spacing scale

**This is the sharpest single finding in the design system, and it is a clean split by
directory.**

`space.*` is referenced **0 times in all twelve files under `src/pages/`.** Not once. The
same is true of `type.*` / `typeScale.*` — **0 references across all twelve pages.**

Where the scale *is* used, it is used consistently:

| Directory | `space.*` references |
|---|---:|
| `src/components/home/primitives.tsx` | 28 |
| `src/components/home/RangeRow.tsx` | 17 |
| `src/components/home/VisualiserShowcase.tsx` | 17 |
| `src/components/home/RangeConfigurator.tsx` | 12 |
| `src/components/home/RecommendationBanner.tsx` | 11 |
| `src/components/home/SocialProof.tsx` | 9 |
| `src/components/home/StepsBar.tsx` | 8 |
| `src/components/home/AboutPanel.tsx` | 7 |
| `src/components/home/Testimonials.tsx` | 6 |
| `src/components/home/Hero.tsx` | 3 |
| `src/components/home/TrustTicker.tsx` | 2 |
| `src/components/Nav.tsx`, `Footer.tsx`, `src/visualiser/KlayConfigurator.tsx`, `VisualiserControls.tsx` | the remainder |
| **every file in `src/pages/`** | **0** |

So each page invents its own spacing:

| File | Its own scale |
|---|---|
| `src/pages/CartPage.tsx` | `gap: 40`, `padding: '24px 0'`, `marginTop: 40`, `padding: isMobile ? '24px' : '40px 60px'` |
| `src/pages/BookInstallPage.tsx` | `gap: 64`, `marginBottom: 56`, `padding: 32`, `top: 110`, `paddingTop: 140` |
| `src/pages/ContactPage.tsx` | `gap: 80`, `marginBottom: 44`, `padding: '180px 80px 0'`, `'80px 80px 140px'` |
| `src/pages/AboutPage.tsx` | `padding: '120px 80px'`, `'180px 80px 120px'` |
| `src/pages/HowItWorksPage.tsx` | `padding: '120px 80px'`, `'200px 80px 120px'` |
| `src/pages/ProductDetailPage.tsx` | `gap: 32`, `gap: 20`, `gap: 12`, `padding: '60px 60px'` |
| `src/pages/VisualiserPage.tsx` | `padding: 28`, `gap: 28`, `width: 348`, `paddingTop: 80` |

**The design system was built for the homepage and never carried into the rest of the site.**
That single fact explains most of §14: 127 distinct pixel values, 21 distinct font sizes, and
a nine-role type scale with no direct consumers are all the same phenomenon seen from
different angles. `theme.ts` is not a failed design system — it is a successful one that was
applied to eleven files out of fifty-four.

---

## 15. CONFIGURATION AND ENVIRONMENT

### 15.1 Every environment variable the code reads

**Ten variables. One is `VITE_`-prefixed. Nine are not.**

| Variable | `VITE_`? | Compiled into the browser bundle? | Read at |
|---|---|---|---|
| `VITE_TURNSTILE_SITE_KEY` | **YES** | **YES — and that is correct.** A Turnstile *site* key is public by design; the widget cannot work without it being in the page. | `src/components/Turnstile.tsx:35` |
| `SUPABASE_URL` | NO | **NO** | `netlify/lib/env.ts:38` |
| `SUPABASE_SERVICE_ROLE_KEY` | NO | **NO** | `netlify/lib/env.ts:39` |
| `STRIPE_SECRET_KEY` | NO | **NO** | `netlify/lib/env.ts:40` |
| `STRIPE_WEBHOOK_SECRET` | NO | **NO** | `netlify/lib/env.ts:41` |
| `RESEND_API_KEY` | NO | **NO** | `netlify/lib/env.ts:42` |
| `KLAY_NOTIFY_TO` | NO | **NO** | `netlify/lib/env.ts:44` — defaults to `vedant@nogap.net.au` |
| `KLAY_NOTIFY_FROM` | NO | **NO** | `netlify/lib/env.ts:46` — defaults to `Klay Interiors <onboarding@resend.dev>` |
| `SITE_URL` (falling back to Netlify's injected `URL`) | NO | **NO** | `netlify/lib/env.ts:48` — defaults to `http://localhost:8888` |
| `TURNSTILE_SECRET_KEY` | NO | **NO** | `netlify/lib/antispam.ts:31` |

**Stated plainly, per variable:** only `VITE_TURNSTILE_SITE_KEY` reaches the browser. Vite
inlines `import.meta.env.VITE_*` at build time and nothing else, and no `process.env` read
exists anywhere under `src/`. Every server variable is read through `netlify/lib/env.ts` or
`netlify/lib/antispam.ts`, both of which are imported only by server-side modules. The
boundary is stated in the code at `netlify/lib/env.ts:5-7`:

```
// Everything here is secret and lives only in Netlify's env vars — none of it
// is prefixed VITE_, so Vite will not inline any of it into the browser bundle.
// That distinction is the whole security boundary. Do not rename one of these
// to VITE_ANYTHING.
```

**One thing to note:** `netlify.toml:7` declares
`SECRETS_SCAN_OMIT_KEYS = "VITE_SUPABASE_URL"` — a variable that **nothing in this
repository reads**. It is defensive configuration for a browser-side Supabase client that
does not exist.

**`.env.example` — variable names and whether a value is pre-filled** (values not printed
except the one that is an obvious placeholder):

| Line | Variable | Pre-filled? |
|---:|---|---|
| 17 | `SUPABASE_URL` | Yes — `https://your-project.supabase.co`, a placeholder |
| 20 | `SUPABASE_SERVICE_ROLE_KEY` | Empty |
| 25 | `STRIPE_SECRET_KEY` | Empty |
| 28 | `STRIPE_WEBHOOK_SECRET` | Empty |
| 32 | `RESEND_API_KEY` | Empty |
| 34 | `KLAY_NOTIFY_TO` | Yes — an email address |
| 38 | `KLAY_NOTIFY_FROM` | Yes — `Klay Interiors <onboarding@resend.dev>` |
| 45 | `VITE_TURNSTILE_SITE_KEY` | Yes — a value is present |
| 47 | `TURNSTILE_SECRET_KEY` | Yes — a value is present |
| 52 | `SITE_URL` | Yes — a value is present |

**No real secret is pre-filled.** All four secret keys are empty.

### 15.2 `netlify.toml`, in full

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  # VITE_SUPABASE_URL is intentionally public — it's a VITE_ prefixed variable
  # that goes into the browser bundle by design. Tell Netlify's secrets scanner.
  SECRETS_SCAN_OMIT_KEYS = "VITE_SUPABASE_URL"

[functions]
  directory = "netlify/functions"
  # esbuild so the TypeScript functions — and the src/lib/pricing module they
  # share with the browser — get bundled rather than shipped as raw .ts.
  node_bundler = "esbuild"

# The webhook needs Stripe's exact bytes to verify the signature, so it must not
# be parsed or re-encoded on the way in.
[functions."stripe-webhook"]
  included_files = []

# --- security headers --------------------------------------------------------
# Applied to all responses. CSP is deliberately strict: default-src 'self' with
# explicit exceptions only for Cloudflare Turnstile (captcha), Stripe, Supabase,
# and Google Fonts.
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co https://api.stripe.com https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';"

# --- routing -----------------------------------------------------------------
# ORDER MATTERS. Netlify evaluates redirects top-down, and the SPA catch-all
# below would otherwise swallow /api/* and hand back index.html — the classic
# "my function returns HTML" symptom on a single-page app.
#
# Each function also declares its own `config.path` (Functions 2.0), which the
# routing layer matches ahead of redirects. This rule is the belt to that
# braces: whichever mechanism wins, /api/<name> reaches the same handler.
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# SPA fallback — must stay last.
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Two observations. **First: `Permissions-Policy` disables `camera=()`.**
`usePhotoUpload.ts:96` sets `input.capture = 'environment'` to open the rear camera on
mobile — that is a file-picker hint rather than a `getUserMedia` call, so it is not blocked,
but the two are close enough together that anyone adding a live camera preview later will hit
this header and not immediately know why. **Second:** the CSP's `img-src` allows `data:` and
`blob:`, which is what lets the uploaded-photo data URL render. Correct and necessary.

### 15.3 `vite.config.ts`, in full

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

Ten lines. No `build` block, so no `manualChunks`, no `chunkSizeWarningLimit`, no `sourcemap`
setting — Vite's default of `sourcemap: false` applies, which is why none are emitted. The
`optimizeDeps.exclude` is Bolt starter residue: `lucide-react` is a dependency that **nothing
imports** (§17).

### 15.4 `compilerOptions`, in full

**`tsconfig.json`** is a solution file only:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.functions.json" }
  ]
}
```

**`tsconfig.app.json`** — covers `src`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**`tsconfig.functions.json`** — covers `netlify/**/*.ts` **and** `src/lib/pricing.ts`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "skipLibCheck": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "noEmit": true,

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["netlify/**/*.ts", "src/lib/pricing.ts"]
}
```

**`tsconfig.node.json`** — covers `vite.config.ts`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

**Is `strict` on? YES — in all three projects,** together with `noUnusedLocals`,
`noUnusedParameters` and `noFallthroughCasesInSwitch`. `skipLibCheck` is on everywhere, so
third-party type errors are not surfaced. This is a well-configured TypeScript setup and it
passes clean (§16).

### 15.5 `.gitignore`, in full

```
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.env

# tsc -b incremental build cache (the typecheck gate)
*.tsbuildinfo
```

`.env` is ignored; `.env.example` is not, correctly. **`.env.local`, `.env.production` and
`.env.*` are NOT ignored** — only the bare `.env`. Creating `.env.local` (which Vite reads by
default) would commit it. Worth tightening to `.env*` with a `!.env.example` exception.

### 15.6 Files matching `*.env*`, `*.pem`, `*.key`, `*secret*`, `*credential*`

Searched the whole repository excluding `node_modules/`. **One file:**

```
./.env.example
```

No `.env`, no `.env.local`, no `.pem`, no `.key`, no file with `secret` or `credential` in its
name. **I did not open `.env` because it does not exist.**

### 15.7 Credential scan — `service_role`, `sk_live`, `sk_test`, `eyJ`, `re_`, `-----BEGIN`

Searched every text file in the repository **including `dist/`**, excluding only
`node_modules/` and `.git/`.

**One hit, and it is documentation:**

```
./.env.example:18:# Project settings → API keys → service_role. Bypasses row level security;
```

That is a comment in the template telling you where to find the key. **No key follows it —
line 20 is `SUPABASE_SERVICE_ROLE_KEY=` with nothing after the equals sign.**

Under a strict pattern (`sk_live_`/`sk_test_`/`whsec_` followed by ≥10 characters,
`re_` followed by ≥16, a JWT-shaped `eyJ…​.…`, or a PEM header): **zero hits anywhere,
including the built bundle.**

The two loose matches worth naming so nobody re-finds them and panics:
- `.env.example:23-24` — the words `sk_test_…` and `sk_live_…` inside a comment explaining
  which to use.
- `dist/assets/index-*.js` and `curtain-fabric.png` matched a bare `eyJ` substring. The
  JavaScript hit is inside minified three.js shadow-map code; the PNG hit is binary image
  data. Neither is a token — a JWT requires `eyJ` followed by base64 and two dots, and
  neither has that.

**Nothing was deleted. There is nothing here to delete.** This scan came back clean, which is
the correct and unusual outcome.

---

## 16. BUILD AND TYPE HEALTH

### 16.1 `npm run build`

**PASS.** Verbatim:

```
> vite-react-typescript-starter@0.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
Browserslist: caniuse-lite is outdated. Please run:
  npx update-browserslist-db@latest
✓ 105 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                    8.72 kB │ gzip:   3.22 kB
dist/assets/index-Ct8adgkR.js  1,020.06 kB │ gzip: 291.22 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 5.01s
```

**Total time: 5.01 s. Chunks emitted: exactly one.** 105 modules — which for a 28,000-line
codebase means almost nothing is being tree-shaken away.

### 16.2 `npx tsc --noEmit`

```
(no output)
EXIT=0
```

**0 errors — and that result is meaningless.** The root `tsconfig.json` is
`{ "files": [], "references": [...] }`, and plain `tsc --noEmit` does not walk project
references. It exits 0 without reading a single source file. The README warns about this at
lines 13–18 and it is worth repeating here because the work order asked for this exact
command.

**The commands that actually check something:**

```
$ npm run typecheck          # tsc -b
EXIT=0                       # 0 errors

$ npx tsc --noEmit -p tsconfig.app.json
EXIT=0                       # 0 errors, src/

$ npx tsc --noEmit -p tsconfig.functions.json
EXIT=0                       # 0 errors, netlify/ + src/lib/pricing.ts
```

**Real error count: 0, across all three projects, with `strict` on.** There are no first
twenty errors to list. This is genuinely clean.

### 16.3 `npm run lint`

**The script exists and it crashes.** Verbatim:

```
> vite-react-typescript-starter@0.0.0 lint
> eslint .

Oops! Something went wrong! :(

ESLint: 9.39.5

TypeError: Error while loading rule '@typescript-eslint/no-unused-expressions':
Cannot read properties of undefined (reading 'allowShortCircuit')
Occurred while linting C:\Users\lathv\Klay-website-new\netlify\functions\create-checkout-session.ts
    at Object.create (…/eslint/lib/rules/no-unused-expressions.js:85:5)
    at create (…/@typescript-eslint/eslint-plugin/dist/rules/no-unused-expressions.js:28:32)
    …
LINT EXIT: 2
```

It fails on the **first file it touches** and never reaches the rest. `package.json` pins
`"eslint": "^9.9.1"` and `"typescript-eslint": "^8.3.0"`; the caret resolved eslint to
9.39.5, whose `no-unused-expressions` rule signature the installed `typescript-eslint` 8.x
does not match. **No file in this repository has been linted for as long as this has been
broken.** The README documents it at lines 20–23 and calls it *"Pre-existing, unrelated to
booking."*

### 16.4 `npm audit`

**8 vulnerabilities: 0 critical, 6 high, 2 moderate, 0 low, 0 info.**

```
{
  "vulnerabilities": { "info": 0, "low": 0, "moderate": 2, "high": 6, "critical": 0, "total": 8 },
  "dependencies":    { "prod": 44, "dev": 308, "optional": 50, "peer": 0, "peerOptional": 0, "total": 351 }
}
```

Full report:

```
# npm audit report

brace-expansion  <=1.1.17 || 2.0.0 - 2.1.3
Severity: high
brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash - GHSA-mh99-v99m-4gvg
brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation - GHSA-rgw5-rvv9-x895
fix available via `npm audit fix`
node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion
node_modules/brace-expansion
node_modules/glob/node_modules/brace-expansion

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the development server and read the response - GHSA-67mh-4wv8-2f99
fix available via `npm audit fix --force`
Will install vite@8.2.2, which is a breaking change
node_modules/esbuild
  vite  <=6.4.2
  Depends on vulnerable versions of esbuild
  node_modules/vite

js-yaml  4.0.0 - 4.3.0
Severity: high
JS-YAML: Quadratic CPU consumption in !!omap resolution (3.x and 4.x) — CVE-2026-59870 fix not backported - GHSA-5p4m-2wfm-xmqj
fix available via `npm audit fix`
node_modules/js-yaml

nanoid  <3.3.18
Severity: high
nanoid: custom generators can loop indefinitely when size is zero - GHSA-2v37-7h3g-55p8
fix available via `npm audit fix`
node_modules/nanoid

postcss  <=8.5.22
Severity: moderate
PostCSS: incomplete fix of GHSA-6g55-p6wh-862q — attacker-controlled sourceMappingURL reads arbitrary .map files when `from` is unset - GHSA-fxqj-rqcc-2cmp
fix available via `npm audit fix`
node_modules/postcss

react-router  7.12.0 - 7.18.1
Severity: high
React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response - GHSA-qwww-vcr4-c8h2
fix available via `npm audit fix`
node_modules/react-router
  react-router-dom  7.12.0-pre.0 - 7.18.1
  Depends on vulnerable versions of react-router
  node_modules/react-router-dom

8 vulnerabilities (2 moderate, 6 high)
```

**Reading these honestly:** `brace-expansion`, `js-yaml`, `nanoid`, `esbuild` and `postcss`
are all build-time or dev-server dependencies — they do not ship to a visitor. The `esbuild`
advisory is specifically about the *dev server*. **`react-router` is the one that runs in
production**, and its advisory is about RSC mode, which this app does not use (no server
components, no actions, no loaders — just `<Routes>` and `<Link>`). Assessed exposure: low.
`npm audit fix` clears seven of the eight without a breaking change.

### 16.5 Sourcemaps in production

**NO.** `find dist -name '*.map'` returns nothing. `vite.config.ts` sets no `build.sourcemap`,
so Vite's default of `false` applies.

### 16.6 Largest chunk and total bundle

- **Largest JavaScript chunk: 1,020.06 kB** (`dist/assets/index-Ct8adgkR.js`) — 291.22 kB
  gzipped. There is only one chunk, so it is also the smallest.
- **Total production bundle (JS + HTML): 1,028.78 kB.**
- **Total `dist/` on disk: 109.4 MB**, because `public/` is copied verbatim — including the
  21 MB zip, the 21 MB of unreferenced AI renders and the 12.7 MB of curtain reference
  photographs (§2).

For scale: the JavaScript alone is roughly twice the 500 kB threshold Vite warns at, and
`three` accounts for a large share of it while being used by exactly one component that most
visitors never reach.

---

## 17. DEPENDENCIES

### 17.1 Every direct dependency

**10 runtime dependencies:**

| Package | Version | What it is actually used for here |
|---|---|---|
| `react` | ^18.3.1 | The UI framework. Imported by 36 files. |
| `react-dom` | ^18.3.1 | Mounts React into the DOM. Imported by `main.tsx` alone. |
| `react-router-dom` | ^7.18.1 | Routing, `<Link>` and `useSearchParams`. Imported by 24 files. |
| `zustand` | ^5.0.14 | The three global stores, plus its `persist` middleware for the cart. 4 files. |
| `three` | ^0.185.1 | The entire curtain renderer. Imported by exactly 2 files — `Canvas2DCurtainRenderer.tsx` and its sandbox copy. |
| `@supabase/supabase-js` | ^2.57.4 | The database client. Imported by exactly 1 file, `netlify/lib/db.ts`, server-side only. |
| `stripe` | ^22.4.0 | Checkout sessions and webhook signature verification. 2 files, both server-side. |
| `resend` | ^6.18.1 | Outbound email. 1 file, server-side. |
| `@types/three` | ^0.185.4 | Type definitions for three.js. **Declared as a runtime dependency; it is a types package and belongs in devDependencies.** |
| `lucide-react` | ^0.344.0 | **Nothing.** Zero imports. See below. |

**20 devDependencies:** `typescript`, `vite`, `@vitejs/plugin-react`, `eslint`,
`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`,
`globals`, `tailwindcss`, `postcss`, `autoprefixer`, `@netlify/functions`, `@types/node`,
`@types/react`, `@types/react-dom`, `@types/react-router-dom`, `playwright-core`.

### 17.2 Declared dependencies with zero import sites in `src/`

| Package | Status |
|---|---|
| **`lucide-react`** | **Zero imports anywhere.** `RangeRow.tsx:148` records why: *"lucide-react is in package.json and nothing in src imports it; the site draws its own icons."* It is nonetheless still listed as a runtime dependency, and `vite.config.ts:8` still carries an `optimizeDeps.exclude` for it. |
| **`tailwindcss`** | Configured in `postcss.config.js` and `tailwind.config.js`, and there is no stylesheet for it to process. Produces nothing. |
| **`autoprefixer`** | Same PostCSS pipeline, same nothing — every style is an inline React object, which PostCSS never sees. |
| **`postcss`** | Runs the two above over an empty pipeline. |
| **`@types/react-router-dom`** | react-router-dom v7 ships its own types. This is the v5-era stub package (`^5.3.3`) and is redundant. |
| **`playwright-core`** | Used only by `research.mjs`, which is itself dead (§2). |
| **`@types/three`** | Used, but misfiled as a runtime dependency. |

**Six declared packages do nothing**, and one more is in the wrong section.

### 17.3 Total transitive package count

**351 packages** by `npm audit`'s own reckoning: 44 production, 308 development, 50 optional.
On disk, `node_modules/` holds **188 installed packages** (top-level plus scoped
sub-directories) — the difference is optional platform-specific binaries that were not
installed on this machine.

### 17.4 Packages running `preinstall`, `install` or `postinstall` scripts

**One:**

```
esbuild -> postinstall: node install.js
```

That is esbuild fetching its platform binary — expected, and the only lifecycle script in the
entire tree. **No other package in this dependency graph executes code at install time**,
which is a meaningfully good supply-chain position for a 351-package tree.

### 17.5 `npm ci` or `npm install`?

**Neither is specified.** `netlify.toml` declares only:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

There is no `[build] ... npm ci` line and no install command at all. Netlify supplies its own
default install step, which uses `npm ci` when a `package-lock.json` is present — and one is
(164,264 bytes, committed). So the build is lockfile-reproducible **by Netlify's default
behaviour, not by anything this repository states.** If that default ever changes, nothing
here pins it.

---

## 18. LOOSE ENDS AND ABANDONED WORK

### 18.1 Every TODO, FIXME, HACK, XXX comment

**Zero.** Searched `src/`, `netlify/` and `supabase/` for `TODO`, `FIXME`, `HACK` and `XXX` as
whole words. **Not one occurrence.**

This is unusual enough to be worth interpreting rather than just reporting. This codebase does
not mark its unfinished work with tags — it writes paragraphs. The three places that would
carry a TODO in an ordinary repository are:

- `src/lib/pricing.ts:38-51` — a 14-line comment headed **"CONFIRM THIS NUMBER BEFORE TAKING
  REAL PAYMENTS."**
- `src/components/home/SocialProof.tsx:8-11` — **"PLACEHOLDER IMAGERY, as briefed… Five real
  install photos replace these."**
- `src/data/configOptions.ts:28-33` — **"EDITORIAL — READ THIS BEFORE TRUSTING IT."**

A grep for TODO finds none of them. Anyone auditing this repository by tooling alone will
conclude there is no outstanding work, and they will be wrong.

### 18.2 Commented-out blocks longer than 10 lines

**Zero.** I scanned every `.ts`/`.tsx` file in `src/` and `netlify/` for runs of more than ten
consecutive `//` lines containing code-shaped punctuation (a trailing `;`/`{`/`}`, or an
opening `const`/`function`/`return`/`import`/`export`/`if`/`for`/`<Tag`). **No block matched.**

There are many long comment blocks — `HomePage.tsx` opens with 97 lines, `theme.ts` with 62,
`RangeRow.tsx` with 148 — but every one of them is prose. **Nothing in this repository is
commented-out code.** Deleted work is deleted, and the reasoning for deleting it is written
down in its place. `src/App.tsx:58-74`, `src/routes/legacyRedirects.tsx:1-38` and
`src/components/Nav.tsx:1-50` are the clearest examples.

### 18.3 Duplicated blocks of 20+ lines appearing in two or more files

Detected by hashing every 20-line sliding window (whitespace-normalised, blank lines removed):

| File pair | Duplicated windows | Assessment |
|---|---:|---|
| `src/visualiser/Canvas2DBlindRenderer.tsx` ↔ `src/visualiser-lab/Canvas2DBlindRenderer.tsx` | ~3,130 | Byte-identical fork |
| `src/visualiser/Canvas2DCurtainRenderer.tsx` ↔ lab | ~1,743 | Byte-identical fork |
| `src/visualiser/KlayConfigurator.tsx` ↔ lab | ~661 | Byte-identical fork |
| `src/visualiser/VisualiserControls.tsx` ↔ lab | ~612 | Byte-identical fork |
| `src/visualiser/useVisualiserStore.ts` ↔ lab | ~343 | Byte-identical fork |
| `src/visualiser/CornerPinOverlay.tsx` ↔ lab | ~279 | Byte-identical fork |
| `src/visualiser/usePhotoUpload.ts` ↔ lab | ~106 | Byte-identical fork |
| `src/visualiser/homography.ts` ↔ lab | ~56 | Byte-identical fork |
| `src/pages/VisualiserPage.tsx` ↔ `src/pages/VisualizerLabPage.tsx` | ~45 | Near-identical; the lab page adds a banner and a category switcher |
| `src/pages/BookInstallPage.tsx` ↔ `src/pages/ContactPage.tsx` | ~12 | The shared form idiom — honeypot, Turnstile, error handling. Genuine but small. |

**Every significant duplicate is the sandbox fork.** Remove `src/visualiser-lab/` and
`src/pages/VisualizerLabPage.tsx` and this table reduces to one 12-window entry between two
forms — which is about as low as a real codebase gets.

Within a single file, `Canvas2DBlindRenderer.tsx` carries two curtain implementations
totalling ~704 lines, of which the 147-line `drawCurtainArea` is unreachable (§6.5).

### 18.4 Components or functions defined and never used

| Item | Where | Note |
|---|---|---|
| `useKlayStore.blindHeight` / `setBlindHeight` | `src/store.ts:5,7` | Never read, never called. |
| `klay_request_kind` enum | `supabase/migrations/0001_bookings.sql:31` | Created; no column uses it. |
| `orders.handled`, `orders.internal_notes`, `quote_requests.handled`, `handled_at`, `internal_notes` | `0001_bookings.sql` | Columns and a partial index exist for a workflow nothing implements. |
| `drawCurtainArea` | `Canvas2DBlindRenderer.tsx:3047` | Reachable only via blind-type strings no UI can produce. |
| `type.ornament`, `type.numeric`, `type.lead`, `type.body` | `src/theme.ts` | Zero consumers, direct or aliased. |
| `layout.sectionPad`, `layout.sectionPadFocal` | `src/theme.ts:485,488` | Functions taking `isMobile`; nothing calls either. |
| `easeOutCubic` | `src/theme.ts:562` | Exported, never imported. |
| `tokens.band`, `dark`, `textDark`, `textMid`, `fillFaint`, `scrimSoft` | `src/theme.ts` | Zero consumers. |
| `shadow.restOnDark`, `shadow.liftOnDark` | `src/theme.ts:550-551` | Zero consumers. |
| `space.xxxl` | `src/theme.ts:311` | Zero consumers. |
| `baseRailShape` prop | `Canvas2DBlindRenderer.tsx:1959` | `void baseRailShape;` — explicitly discarded. |
| `TracedArea.blindType`/`fabricColor`/`hardwareColor`/`controlType` | `useVisualiserStore.ts:10-13` | Written at trace time, overwritten from live state before use (§7.4). |
| `SECRETS_SCAN_OMIT_KEYS = "VITE_SUPABASE_URL"` | `netlify.toml:7` | Guards a variable nothing reads. |
| CSP `connect-src https://api.stripe.com`, `frame-src https://js.stripe.com` | `netlify.toml:33` | Allowed; unused. |
| `optimizeDeps.exclude: ['lucide-react']` | `vite.config.ts:8` | Excludes a package nothing imports. |

### 18.5 Leftover scaffolding from Bolt or a starter template

| Item | Evidence |
|---|---|
| `.bolt/config.json` and `.bolt/prompt` | The Bolt.new project files. |
| `README.md:3` | `[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-4dduj3fh)` — the first thing in the README is a Bolt badge. |
| `README.md:1` | The project is titled **`Klay-website-viz`**, which is neither the repository name nor the product name. |
| `package.json:2` | `"name": "vite-react-typescript-starter"` |
| `package.json:4` | `"version": "0.0.0"` |
| `index.html:10-12` | `og:image` and `twitter:image` both point at **`https://bolt.new/static/og_default.png`**. Every link to this site shared on social media or in a messaging app previews with Bolt's default image, not Klay's. |
| `tailwind.config.js`, `postcss.config.js` | The starter's CSS pipeline, never used and never removed. |
| `vite.config.ts:8` | The starter's `lucide-react` exclusion. |
| `lucide-react` in `package.json` | The starter's icon library. |

### 18.6 Files that look like an abandoned second attempt

| Item | Assessment |
|---|---|
| `src/visualiser-lab/` + `src/pages/VisualizerLabPage.tsx` | **The clearest case.** A deliberate, documented fork — but a fork with no diff against its original, which means the work has not started yet. |
| `drawNewCurtainArea` vs `drawCurtainArea` | Two curtain implementations in one file, plus a third engine in `Canvas2DCurtainRenderer.tsx`. Three attempts at drawing a curtain; one of them is live. |
| `public/images/types/*.png` vs `public/images/*product image.png` | Two generations of product photography. The older four are unreferenced. |
| `public/images/Textures/curtains/Sheer_curtains_1.png` / `Blockout_curtains_1.png` vs `sheer_produced.png` / `Blockout_produced.png` | Two generations of fabric swatch. The `_1` pair is unreferenced. |
| `public/images/Textures/curtains/sfold_base.png` and `reference/*pleat*.png` | Assets for the four-heading model the store abandoned (`useVisualiserStore.ts:29-31`). |
| 14 × `curtain-*.png` at the repo root | Named `-v2`, `-v3`, `-v4`, `-fixed`, `-restored`, `-final`, `-3d-final` — a versioning scheme in filenames. |
| `public/images/static-imafge.png` | Misspelt, 1.7 MB, unreferenced. |
| `public/images/Textures/Bottom_bar/Botton_bar_side.jpg` | Misspelt, unreferenced. |
| `public/images/Product Ai Renders for website.zip` **and** the identically-named unzipped folder | The same 21 MB of assets stored twice, neither referenced. |
| `public/images/room-1.png`, `room-2.png` | `PRESET_ROOMS` uses 3, 4 and 5. |

**No `*_old`, `*_v2` or `*Copy*` source files exist.** The abandoned work in this repository
is all in `public/` and at the repo root, not in `src/`.

---

## 19. THE STRANGER TEST

### 19.1 Does `README.md` exist?

**Yes, 113 lines. Quoted in full:**

````markdown
# Klay-website-viz

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-4dduj3fh)

Vite + React + TypeScript. Deployed on Netlify.

```bash
npm install
npm run dev        # Vite only, port 5173 — booking endpoints will 404
npm run typecheck  # tsc -b, the pre-commit gate (see note below)
```

> **`npx tsc --noEmit` checks nothing in this repo.** The root `tsconfig.json`
> is `{ files: [], references: [...] }`, and plain `tsc --noEmit` does not walk
> project references — it exits 0 without reading a file. Always use
> `npm run typecheck`, which runs `tsc -b` and covers `src`, `vite.config.ts`
> and the Netlify functions.

`npm run lint` currently crashes on every file: eslint 9.39.5 is installed
against `typescript-eslint` 8.x, and the `no-unused-expressions` rule signature
changed between them. Pre-existing, unrelated to booking; fixing it means
aligning those two versions.

---

## Booking and payments

`/book` turns a visualiser configuration into either a quote request or a paid
order. Both paths share one form; only the endpoint differs.

| Path | What happens |
| --- | --- |
| Request a quote | Row in `quote_requests`, alert to Klay, acknowledgement to the customer. No payment. |
| Pay & book | Stripe Checkout for the full amount, then a row in `orders` settled to `paid` by the webhook. |

The configuration travels in the URL (`/book?type=dual&size=large&op=motorised&qty=2`)
rather than in the zustand store, so a refresh or a shared link still quotes for
the right blind. `src/lib/bookingLink.ts` builds these; every "Book Installation"
CTA on the site uses it.

### Where the price comes from

`src/lib/pricing.ts` is the single source of truth, imported by **both** the
browser and the checkout function. The server never accepts an amount from the
client — it takes the configuration and re-derives the total. That is what stops
a hand-edited request buying a $2,000 job for a dollar.

> **`INSTALL_PER_BLIND` in `src/lib/pricing.ts` is a placeholder** (`$60`, with a
> `$120` call-out minimum). The configurator has always quoted installation
> separately, so no install rate existed in the code; charging in full needs one.
> **Confirm this before taking real payments.** Set it to `0` to drop
> installation from the total and quote it separately again.

Catalogue prices are treated as GST-inclusive AU retail, so the breakdown shows
the GST *contained* in the total (`total / 11`) rather than adding tax on top.

### Setup

**1. Database.** In Supabase → SQL Editor, run
`supabase/migrations/0001_bookings.sql`. It creates `quote_requests` and
`orders`, and enables RLS with no public policies — the tables are reachable
only by the service-role key the functions hold, so a leaked anon key reads
nothing.

**2. Environment.** Copy `.env.example` to `.env` for local work and set the
same keys in Netlify → Site configuration → Environment variables. Only
`VITE_`-prefixed vars reach the browser; nothing in `.env.example` is prefixed,
because all of it is secret.

**3. Stripe webhook.** Add an endpoint at
`https://<your-site>/api/stripe-webhook` subscribed to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Copy its signing secret into `STRIPE_WEBHOOK_SECRET`. **Without the webhook,
payments succeed but orders stay `pending_payment` forever** — the webhook is
the only thing that marks an order paid. Landing on the success URL proves
nothing; it is a URL anyone can visit.

**4. Email.** Verify a sending domain in Resend and set `KLAY_NOTIFY_FROM` to an
address on it. The `onboarding@resend.dev` default only delivers to your own
Resend account address, so customer acknowledgements will not arrive until this
is done. Email is best-effort by design: a send failure is logged and swallowed
so a mail misconfiguration can never lose an enquiry that is already in the
database.

### Running the functions locally

`npm run dev` serves Vite alone, so `/api/*` 404s and the UI reports that
booking is unavailable. To exercise the endpoints:

```bash
npx netlify dev    # serves the SPA and the functions together, port 8888
stripe listen --forward-to localhost:8888/api/stripe-webhook
```

Use Stripe's `4242 4242 4242 4242` test card.

### Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/request-quote` | POST | Store a quote request, notify both sides. |
| `/api/create-checkout-session` | POST | Re-price server-side, open Stripe Checkout. |
| `/api/stripe-webhook` | POST | Verify signature, mark orders paid. Idempotent. |
| `/api/order-status` | GET | Status for the confirmation page. Returns no personal data. |

Shared server code lives in `netlify/lib/` — deliberately *outside*
`netlify/functions/`, because every file in that directory is deployed as its
own endpoint.
````

**Assessed against what a README has to answer:**

| Question | Answered? |
|---|---|
| What is the project? | **Barely.** *"Vite + React + TypeScript. Deployed on Netlify."* Eight words, and none of them says this is a window-furnishings shopfront with a photorealistic visualiser. |
| How do I install? | **Yes.** `npm install`. |
| How do I run it? | **Yes, and honestly** — it says `npm run dev` gives you Vite alone and the booking endpoints will 404, and tells you to use `npx netlify dev` instead. |
| How do I build? | **No.** `npm run build` is never mentioned. It is inferable from `netlify.toml`. |
| How do I deploy? | **No.** "Deployed on Netlify" and nothing further. No site name, no branch policy, no preview-deploy convention. |
| Where do credentials come from? | **Yes, thoroughly.** Setup steps 1–4 name every variable, where in each vendor's dashboard to find it, and what breaks without it. |
| What is the visualiser? | **Not mentioned once.** The 7,819 lines that are 39% of `src/` and the entire commercial differentiator of this product do not appear in the README. |
| Is the cart broken? | **Not mentioned.** A newcomer reading this README would reasonably conclude the site's checkout works, because the README describes a checkout that does. |

The two warnings it *does* carry — that `tsc --noEmit` checks nothing and that `npm run lint`
crashes — are both accurate and both saved me time. This is a good README about payments
attached to a project that is mostly not about payments.

### 19.2 Does `AGENTS.md` or `CLAUDE.md` exist?

**NONE.** Neither file exists at the repository root or anywhere within it. Nor does
`CONTRIBUTING.md`, `.cursorrules`, or any other agent- or contributor-instruction file.

### 19.3 Does a `docs/` folder or architecture note exist?

**Yes — and it is untracked by git**, so it exists on this machine and may not exist on
anyone else's.

| File | Lines | What it is |
|---|---:|---|
| `docs/VISUAL_AUDIT.md` | 876 | A measured visual audit of the homepage at 1440×900, taken against commit `44ec41e` using computed styles from a running dev server. |
| `docs/VISUAL_AUDIT_2.md` | 390 | Continues it: homepage sections 1–6. |
| `docs/VISUAL_AUDIT_3.md` | 308 | Continues it: homepage sections 7–11. |
| `docs/STATE_OF_BUILD_2026-08.md` | — | This document. |

**All three audits are about the homepage's appearance.** There is no architecture note, no
data-flow diagram, no schema documentation outside the SQL file's own comments, and no
decision log. What stands in for an architecture document is the file headers themselves —
`HomePage.tsx` opens with 97 lines on section ordering, `Nav.tsx` with 50 on why the
navigation has four words, `theme.ts` with 62 on why the gold was removed. That material is
genuinely valuable and it is completely undiscoverable: you have to already know which file to
open.

### 19.4 How many files in `src/` carry a header comment?

**30 of 54 — 56%.** (Counting a file as documented if its first non-blank content is `//` or
`/*`.)

**The 24 without one:**

```
src/App.tsx                      src/main.tsx
src/store.ts                     src/store/cartStore.ts
src/hooks/useIsMobile.ts         src/components/FormField.tsx
src/components/Turnstile.tsx     src/pages/AboutPage.tsx
src/pages/BookingConfirmedPage.tsx  src/pages/BookInstallPage.tsx
src/pages/CartPage.tsx           src/pages/ContactPage.tsx
src/pages/HowItWorksPage.tsx     src/pages/NotFoundPage.tsx
src/pages/ProductDetailPage.tsx  src/pages/VisualiserPage.tsx
src/visualiser/Canvas2DBlindRenderer.tsx
src/visualiser/Canvas2DCurtainRenderer.tsx
src/visualiser/CornerPinOverlay.tsx
src/visualiser/homography.ts
src/visualiser/KlayConfigurator.tsx
src/visualiser/usePhotoUpload.ts
src/visualiser/useVisualiserStore.ts
src/visualiser/VisualiserControls.tsx
```

Several of these *are* documented, just not on line 1 — `Canvas2DBlindRenderer.tsx` puts its
imports first and its explanation at line 92; `App.tsx` documents the route table at line 58.
The count is mechanical.

**The pattern that matters: every file in `src/components/home/` has a header, and no file in
`src/visualiser/` does.** The best-explained code in this repository is the marketing layout;
the least-explained is the 7,819-line rendering engine that is the actual product.

### 19.5 Getting it running locally, from what is written down

Steps a competent React developer would take, using only the repository. **⚠ = they would have
to guess, ask, or reverse-engineer.**

1. `git clone` and `cd`. — Fine.
2. `npm install`. — Written down. Fine.
3. `npm run dev`. — Written down, and the README warns the booking endpoints will 404. Fine.
4. **⚠ Open `http://localhost:5173`.** The port is in the README's inline comment, so this is
   fine — *but* `research.mjs`, the only other runnable script, targets **5176**, which will
   send them looking for a second server that does not exist.
5. **⚠ Notice the visualiser works locally and wonder why.** `VisualiserPage.tsx:54` gates the
   page on a hostname allowlist that happens to include `localhost`. Nothing outside that line
   documents the gate. If they deploy a preview to a Netlify branch URL not on the list, the
   visualiser shows *"Authorised access only."* and they will have no idea why.
6. **⚠ Try to exercise booking.** The README says to run `npx netlify dev`. It does not say
   they need the Netlify CLI installed (`@netlify/functions` is a dependency; the CLI is not),
   nor that they need a Netlify account and a linked site.
7. **⚠ Create `.env`.** The README says copy `.env.example`. It does not say that `.env` is
   gitignored but `.env.local` is not (§15.5).
8. **⚠ Get Supabase credentials.** The README says which dashboard pages to visit. It does not
   say which Supabase project, whether one exists, or who has access. `.env.example` has the
   placeholder `https://your-project.supabase.co`. **They must ask a human.**
9. **⚠ Run the migration.** The README says to. It does not say whether it has already been
   run against the shared project, and there is no migration-history mechanism. Re-running is
   safe (`if not exists` / `do $$ … exception when duplicate_object` guards throughout), but
   they cannot tell from the repo whether they need to.
10. **⚠ Get Stripe test keys.** They must ask whether a Klay Stripe account exists and who
    owns it.
11. **⚠ Get a Resend key and know which domain is verified.** Same.
12. **⚠ Get Turnstile keys.** `.env.example` has values pre-filled at lines 45 and 47, so they
    may work — or may be someone's personal test keys tied to a different domain. Nothing says.
13. **⚠ Run the linter and hit a crash.** The README warns about this, so it is a documented
    dead end rather than a mystery. **Half a guess.**
14. **⚠ Discover the codebase.** Nothing tells them the visualiser exists, that `theme.ts` is
    the design system, that inline styles are the house rule, that `src/lib/pricing.ts` runs
    in two runtimes, or that `src/pages/CartPage.tsx` is a stub. All of it is in file headers
    they have no reason to open.
15. **⚠ Discover `src/visualiser-lab/`.** They will clone a `/visualizer` route that is a
    byte-identical copy of `/visualiser`, linked from nowhere, and only the header comment in
    `VisualizerLabPage.tsx` says what it is for or that it is meant to be deleted.

**Steps requiring guesswork, asking, or reverse-engineering: 11 of 15.** Nine of those eleven
are "ask a human for a credential", which is normal and unavoidable. The two that are not —
steps 5 and 14 — are the ones a better README would fix.

### 19.6 The three hardest things for a newcomer to understand

**1. That one pricing module runs in two different runtimes, and why that is load-bearing.**

`src/lib/pricing.ts` lives under `src/`, which every convention says is browser code. It is
imported by `netlify/lib/booking.ts` with a `../../src/` path that looks like an accident, and
made to work by two pieces of configuration in two different files —
`tsconfig.functions.json:27` adding `"src/lib/pricing.ts"` to a Node project's `include`, and
`netlify.toml:13` setting `node_bundler = "esbuild"`. Neither file mentions the other. A
newcomer tidying the import, moving the file to `shared/`, or "simplifying" the tsconfig would
break the guarantee the entire payment security model rests on: that the price on screen and
the price charged come from the same code. **The concept is that this repository has a
deliberate third category of code — neither client nor server, but both — and nothing about
the directory layout says so.**

**2. That the visualiser store is one global object, mirrored in two shapes at once.**

`useVisualiserStore` is created at module scope, so it is a single instance shared by every
mount and every navigation — the homepage embed, the product page and `/visualiser` are all
looking at the same object, and state left behind by one arrives in the next. On top of that,
the nine configuration fields exist **twice simultaneously**: flat at the top level, and
inside `windows[activeWindow]`, kept in step by `writeThrough`. A newcomer reads
`store.blindType` and reasonably assumes it is *the* blind type. It is a mirror of the active
window, and writing it directly rather than through a setter silently desynchronises the job.
Both facts are documented — at `useVisualiserStore.ts:54-89` and `KlayConfigurator.tsx:333-345`
— in comments totalling about 50 lines that you only find by already suspecting there is a
problem. **The concept is shared mutable global state with a mirroring invariant, in a
codebase that otherwise looks like ordinary React.**

**3. That there are two checkouts, one of which is a lie, and that nothing in the UI
distinguishes them.**

`/book` is complete: server-priced, validated, Stripe-backed, webhook-settled. `/cart` is an
`alert()`. Both are reachable from the homepage, four sections apart. Both are labelled with
ordinary commerce language — *Book Installation* and *Get Quote* reach the working one; *Buy
Now* and *Add to Cart* reach the broken one. Nothing in the code marks `CartPage.tsx` as
unfinished: it has no TODO, no `throw new Error('not implemented')`, no comment saying it is a
stub. Its 473 lines are as polished as any other page — the empty state is designed, the
mixed priced/on-measure total logic is carefully thought through and commented, the responsive
layout works. **A newcomer will read it as finished, because every signal except the four
lines of `handleSubmit` says it is.** The concept is that completeness of *appearance* and
completeness of *function* have come apart in this codebase, and the README does not warn you.

---

## 20. SUMMARY BLOCK

```
STATE OF BUILD 2026-08
files_src: 62
loc_src: 28011
files_over_400_lines: 18
orphan_files: 6
dead_files: 9
routes_defined: 16
pages_without_routes: 0
zustand_slices: 3
network_call_sites: 3
supabase_tables: 2
supabase_tables_rls_enabled_in_repo: 2
supabase_tables_anon_can_read: 0
supabase_tables_anon_can_write: 0
netlify_functions: 4
netlify_edge_functions: 0
price_calculated_in_browser: YES
price_validated_server_side: YES
stripe_references: 67
resend_references: 22
fieldinsight_references: 0
theme_tokens_exported: 78
theme_tokens_zero_consumers: 21
hardcoded_px_distinct: 127
hardcoded_font_sizes_distinct: 21
hardcoded_hex_not_in_theme: 56
banned_black_occurrences: 2
inline_style_occurrences: 559
direct_dependencies: 10
unused_dependencies: 6
transitive_packages: 351
npm_audit_high_or_critical: 6
typescript_errors: 0
build_status: PASS
largest_chunk_kb: 1020
total_bundle_kb: 1029
sourcemaps_in_prod: NO
todo_comments: 0
test_files: 0
ci_workflows: 0
readme_exists: YES
agents_md_exists: NO
files_with_header_comment_pct: 56
cold_start_steps_requiring_guesswork: 11
features_done: 20
features_half_built: 4
features_stub_only: 1
features_not_started: 13
```

### Notes on the figures above, so future runs diff honestly

- **`files_src: 62`** counts everything on disk under `src/`. **54** of those are the
  application; **8** are the `visualiser-lab/` fork. Likewise `loc_src: 28011`
  is **20,192** without the fork, and `files_over_400_lines: 18` is **14** without it.
- **`orphan_files: 6`** — `main.tsx`, `vite-env.d.ts` and the four Netlify Functions. All six
  are correct; there are no accidental orphans.
- **`dead_files: 9`** counts source files only: the 8 in `visualiser-lab/` plus
  `VisualizerLabPage.tsx`. Four dead config/script files (`tailwind.config.js`,
  `postcss.config.js`, `research.mjs`, `.bolt/*`) and 41 unreferenced public assets are
  counted in §2 rather than here.
- **`routes_defined: 16`** is the number of `<Route>` elements in `src/App.tsx`. One is a
  `.map` over three legacy slugs, so **18 paths** resolve at runtime.
- **`zustand_slices: 3`** — the sandbox fork's byte-copy of `useVisualiserStore` is a genuine
  fourth global instance at runtime, but it is the same slice definition.
- **`network_call_sites: 3`** counts browser code that transmits data (`api.ts:45` serving two
  endpoints, `BookingConfirmedPage.tsx:53`). Asset loads, the Turnstile script tag and the
  Google Fonts import are excluded.
- **`price_calculated_in_browser: YES` / `price_validated_server_side: YES`** — both are true
  simultaneously and by design, for `/book`. **Neither applies to `/cart`, which sends nothing
  anywhere.** `CartItem.price` is browser-authored and `localStorage`-persisted; it is only
  harmless because it is never transmitted.
- **`banned_black_occurrences: 2`** — both are inside the comment at
  `src/components/home/StepsBar.tsx:25-26` that forbids them. **Zero rendered occurrences.**
  Separately, `rgba(0,0,0,X)` is used for shadows in `KlayConfigurator.tsx:43-45`.
- **`hardcoded_hex_not_in_theme: 56`** — 33 are fabric and hardware colours in
  `data/products.ts` and 13 are renderer lighting constants, both legitimate. **Nine are real
  palette drift** (§14.5).
- **`unused_dependencies: 6`** — `lucide-react`, `tailwindcss`, `postcss`, `autoprefixer`,
  `@types/react-router-dom`, `playwright-core`. `@types/three` is used but misfiled as a
  runtime dependency.
- **`npm_audit_high_or_critical: 6`** — 0 critical, 6 high. Five of the six are build-time
  only; the one production package (`react-router`) has an advisory about RSC mode, which this
  application does not use.
- **`typescript_errors: 0`** is from `tsc -b` across all three projects with `strict` on.
  `npx tsc --noEmit` also reports 0 **but reads no files at all** and should never be quoted
  as evidence in this repository.
- **`total_bundle_kb: 1029`** is JavaScript plus HTML. **`dist/` on disk is 109.4 MB**,
  because `public/` is copied verbatim including 69.2 MB of unreferenced assets.
- **`cold_start_steps_requiring_guesswork: 11`** of 15 (§19.5). Nine are credential requests,
  which is normal; two are codebase discovery, which is not.
- **`todo_comments: 0`** is literally true and practically misleading. The three genuine
  outstanding-work markers in this codebase are prose paragraphs, not tags (§18.1).

---

## 21. HOW THIS DOCUMENT WAS PRODUCED

Read-only throughout. No file in this repository was modified, created or deleted except
`docs/STATE_OF_BUILD_2026-08.md`. No `npm install` was run and `package-lock.json` is
unchanged. `.env` does not exist and was not opened; `.env.example` was read for variable
names and no value was printed except the placeholder `https://your-project.supabase.co`.
The protected IP files — `src/visualiser/homography.ts`, `Canvas2DBlindRenderer.tsx`,
`CornerPinOverlay.tsx` and `usePhotoUpload.ts` — were read and described; none was changed.

Four commands were executed, all of them read-only: `npm run build`, `npm run typecheck`
(`tsc -b`), `npm run lint`, `npm audit`. `npm run build` rewrote `dist/`, which is gitignored
and is a build artefact; the previous bundle's filename and size are recorded in §2 because
the comparison is informative.

**Where I could not determine something I have written UNKNOWN.** The four open questions
are: whether the Supabase migration has ever been run against a live project; whether any
environment variable is set in the live Netlify project; whether the curtain renderer's
current output is signed off; and whether FieldInsight has an HTTP API, since nothing in this
repository describes one. All four need a human, not a deeper read.

A fifth was open while I was writing and is now closed: `src/visualiser-lab/` appeared
mid-audit and I could not tell who wrote it. It was committed as `786e996` by whoever else
was working in this checkout, and this document is written against that commit.

This file is committed on the branch `docs/state-of-build-2026-08`, one commit ahead of
`main`. It has not been merged.
