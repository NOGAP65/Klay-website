# GLOSSARY — the words the code uses, and what they mean

> ## INCOMPLETE — partially filled 3 September 2026.
>
> **The job's four stages are now canonical and confirmed** — see the first section. The rest of
> the business column is still pending from V.
>
> **What is here is extracted from the codebase**: every domain term that appears as an
> identifier, with where it is defined and what the code takes it to mean. It is one half of a
> glossary.
>
> **The other half is the business's own vocabulary** — the words Bobby and Adam use for these
> things, and the words they use for things the code has no name for at all. §6:
>
> > *"The code uses the words Bobby and Adam use. If the business calls it a check measure, the
> > function is `scheduleCheckMeasure`. If Rynamic calls a colour Surfmist, the constant is
> > `SURFMIST`, not `GREY_2`. **When business and code disagree on a word, the business wins.**"*
>
> **So the column that matters most is the empty one.** Where a row's business term differs from
> the identifier, the identifier is what changes. Rows marked **?** are where I could not tell
> from the code whether the code's word is the business's word.

**Why this file exists at all:** §6 has said *"vocabulary lives in `docs/architecture/glossary.md`"*
since the specification was written, and the file did not exist. A section of the constitution
depended on a document nobody had written — found on 1 September 2026 while giving every unbuilt
entry in §3 a trigger, and this one had never had a chance to fire because §6 had already
required it.

---

## The job, and its four stages — CANONICAL BUSINESS VOCABULARY

**Confirmed by the business, 3 September 2026. These are the words to use.**

Klay runs a **job**, not a purchase. It has four stages, and **payment is the first of them
rather than the conclusion**:

> **payment → measure → manufacture → install**

| Stage | What it is | Identifier | Where it is modelled |
|---|---|---|---|
| **Payment** | The customer pays. `/book`, Stripe, the webhook, the `orders` row | `createBooking`, `orders` | The only stage the site models |
| **Measure** | A technician attends and measures the actual windows | **NONE** | **Nowhere** |
| **Manufacture** | The blinds are made to those measurements | **NONE** | **Nowhere** |
| **Install** | The same technician returns and fits them | **NONE** | **Nowhere** |

**Three of the four stages have no representation in this codebase.** No type, no table, no
column, no function. Not partially modelled — absent.

**And nothing represents assignment.** No stage has a person attached to it, and the business's
own promise — from the About page, in Klay's words — is *"the technicians who measure your
windows are the same people who come back to install them."* **That continuity is the product**,
and the codebase cannot express it, because it has neither a technician nor a stage to attach one
to.

**This is recorded, not modelled.** ADR-026. The site is not wrong to model only payment — it is
a website, and the rest of the job may well belong in FieldInsight. What is wrong is that the
order it creates is shaped as if payment were the end.

---

## Products and the range

| Term | Identifier | Where | What the code means by it | Business term |
|---|---|---|---|---|
| **Blind type** | `BlindType` | `lib/pricing.ts:19` | `blockout` · `sunscreen` · `lightfilter` · `dual`. **A pricing input** — `BASE_PRICE` is keyed by it | ? |
| **Product** | `Product`, `PRODUCTS` | `features/catalogue/products.ts` | One of the four roller products a customer can buy outright, with a slug, a from-price and imagery | ? |
| **Slug** | `ProductSlug` | same | The product's URL segment — `dusk`, `veil`, `duo`, `haze`. Named after the fabric, not the blind type | ? |
| **SKU** | `SKU_CATALOGUE` | same | A product **and** a hardware finish — `Dusk White`, `Dusk Noir`, `Dusk Chrome`. Where a price actually attaches | ? |
| **Range** | `RANGES` | same | A product presented for the homepage row. Derived from `PRODUCTS`, never written twice | ? |
| **Catalogue item** | `CatalogueItem`, `CATALOGUE` | `features/catalogue/constants.ts` | One of the **fourteen** things Klay sells, most of which are made to measure and have no online price. A superset of `Product` | ? |
| **Group** | `Group` | same:36 | `Indoor` · `Outdoor` · `Other`. The shop's top-level division | ? |
| **Availability** | `Availability` | same:40 | `Buy online` · `Price on measure`. **The commercial distinction the whole catalogue turns on** | ? |
| **Light control** | `LIGHT_VALUES` | same:43 | `Blockout` · `Light filter` · `Sunscreen` · `Sheer`. How much light the fabric admits | ? |

**A note on `blindType`, because it carries two meanings and that is a known problem.** In
`lib/pricing.ts` it is a pricing input (`'blockout'`). On a cart line built by `configuredLine`
it is a **composite identity string** — `roller-blinds:blockout:surfmist:white:medium:manual` —
built so two configurations of one product do not collapse into one row. **One field, two jobs**,
and the money path understands only the first. PHASE_6_SCOPE decision B.

## Configuring and pricing

| Term | Identifier | Where | What the code means by it | Business term |
|---|---|---|---|---|
| **Window size** | `WindowSize` | `lib/pricing.ts:20` | `small` · `medium` · `large`. A **pricing band**, not a measurement | ? |
| **Operation** | `Operation` | same:21 | `manual` · `motorised` | ? |
| **Motorisation** | `MOTORISED_ADDON` | same:36 | A flat 150 added per blind. D-07 — there used to be a second copy | ? |
| **Field** | `FieldId` | `features/catalogue/configOptions.ts:43` | `variant` · `colour` · `hardware` · `size` · `operation`. The five questions a product may ask, and **no more** — a cart line carries exactly five | ? |
| **Variant** | `'variant'` | same | The first real question about a product: light control on a roller, slat material on a venetian, panel layout on a shower screen. **Deliberately not called "light control"** | ? |
| **Hardware** | `HARDWARE_HEX`, `HARDWARE_OPTIONS` | `data/products.ts` | The visible metalwork: `white` · `black` · `chrome` | ? |
| **Fabric colour** | `RYNAMIC_COLOURS`, `CURTAIN_COLOURS` | same | Two independent colour cards. **A name is not unique across them** — Dune is a warm tan on a blind and a deep brown on a curtain | Rynamic is a supplier's name |
| **Price on measure** | `priceOnMeasure` | `features/cart/store/cartStore.ts:20` | A line with no price yet. Prints PRICE ON MEASURE, contributes nothing to the total, and is **not** zero | ? |
| **From price** | `priceFrom` | `features/catalogue/products.ts` | The cheapest configuration of a product, for a card | ? |

## Buying

| Term | Identifier | Where | What the code means by it | Business term |
|---|---|---|---|---|
| **Basket / cart** | `useCartStore`, `CartItem` | `features/cart/` | What has been chosen. **It does not check out** — §3, D-01 | ? |
| **Line** | `CartItem`, `ConfiguredLine` | `features/cart/`, `configOptions.ts` | One configured product plus a quantity | ? |
| **Booking** | `createBooking`, `/book` | `netlify/lib/booking.ts` | The paid path. Server-priced, Stripe-backed, webhook-confirmed | ? |
| **Quote request** | `quote_requests`, `sendEnquiry` | `netlify/`, `features/marketing/api/` | An enquiry with no payment. The contact form posts one | ? |
| **Measure** | **NONE — a stated gap** | — | **Stage two of four.** A technician attends and measures the actual windows. The business's second stage; the codebase's blind spot. See the stages table above and ADR-026 | **measure** — confirmed |
| **Manufacture** | **NONE — a stated gap** | — | Stage three. The blinds are made to the measurements taken | **manufacture** — confirmed |
| **Install** | **NONE — a stated gap** | — | Stage four. The same technician returns and fits them | **install** — confirmed |
| **Check measure** | *(no identifier)* | — | §6's own worked example of business vocabulary — *"if the business calls it a check measure, the function is `scheduleCheckMeasure`"* — and no such function exists. **Now understood as part of the measure stage** rather than a separate missing term, but whether the business distinguishes a check measure from a measure is still open | **?** |

## Visualising

| Term | Identifier | Where | What the code means by it | Business term |
|---|---|---|---|---|
| **Visualiser** | `src/visualiser/` | E-08 | The photo-and-render tool. **Spelled `visualiser` in code, `/visualizer` on the sandbox route** — ADR-013, E-07 | ? |
| **Drop** | `dropMetres`, `dropPx` | visualiser | The **vertical dimension** of a window covering. Domain vocabulary, not the verb — Phase 0 nearly renamed it as a synonym for `remove` | Trade term |
| **Trace** | `tracedWindows`, `CornerPinOverlay` | visualiser | The four corners a customer marks on their own photograph | ? |
| **Wardrobe** | `wardrobes.ts`, `WardrobeModel` | `visualiser-lab/` | A product category under active development, not yet shipped | ? |

## Terms the code uses that may not be the business's

Listed separately because these are the likeliest disagreements, and §6 says the business wins.

| Code says | Meaning | Suspect because |
|---|---|---|
| `variant` | The first configurable choice | An abstraction the code invented so fourteen products could share one panel. Almost certainly not what anyone says out loud |
| `Group` = `Other` | The catch-all shop division | `Other` is a programmer's word. Wardrobes and shower screens are in it |
| `lightfilter` | A blind type | One word in code, two in the shop (`Light filter`). Both exist |
| `dual` | A blind type | Sold as "Eclipse Dual Roller"; whether "dual" alone is the trade term is unclear |
| `sunscreen` | A blind type | Also a consumer product for skin. Fine in context, ambiguous in a search |

---

# CONTENT GAPS — for Bobby, not for the codebase

**Recorded and deliberately not fixed.** These are decisions about what the site should *show*,
which is not the migration's to make. No code change follows from this section.

## Two catalogue items are the odd ones out on photography

Found while auditing `public/` — the asset phase asked why one product image was unreferenced,
and the answer turned out to be about content rather than files.

| Item | What it shows today | Why it stands out |
|---|---|---|
| **Roller Blinds** | A **lifestyle room photograph** — `lifestyle/room-kitchen.png` | Its nine siblings use product cut-outs on a plain ground. Its own cut-out, `products/roller-blinds.webp`, exists and is unused — now in `assets-source/product-images/` |
| **Venetian Blinds** | **No photograph at all** — a drawn product glyph in a framed rectangle | The only one of fourteen with no image. `CatalogueItem.image` is optional and `PhotoTile` has a designed no-photo state, so it renders deliberately rather than breaking |

**Neither is a defect.** Nothing is broken, no image 404s, and the venetian card is a designed
state rather than an accident — the glyph is drawn, framed, and brightens on hover so the tile
still answers the pointer. Verified in a browser rather than inferred from the types.

**Both are choices somebody made and nobody has revisited**, and they are visible side by side on
`/products`: one card is a room, twelve are cut-outs, one is a line drawing.

### The questions, which are Bobby's

1. **Should Roller Blinds use its cut-out like the others?** It is the flagship — the only
   buy-online product — and it is the one card that does not match the grid. The file is kept and
   named, so this is a one-line change whenever it is answered.
2. **Should Venetian Blinds have a photograph?** There is no venetian product shot anywhere in
   the repository, so this is a photography question, not a wiring one.

**Left exactly as they are.** Changing what a product looks like on the shop page is a content
decision, and the migration has no standing to make one.
