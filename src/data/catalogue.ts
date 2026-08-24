// ---------------------------------------------------------------------------
// THE CATALOGUE — the fourteen products Klay sells, as supplied by the business.
//
//   Indoor    Roller Blinds, Roman Blinds, Honeycomb Blinds, Venetian Blinds,
//             Plantation Shutters, Vertical Blinds, Curtains
//   Outdoor   Folding Arm Awnings, Zip Guide Systems, Roller Shutters,
//             Pleated Flyscreens
//   Other     Wardrobes, Shelving, Frameless Shower Screens
//
// THIS LIST IS AUTHORITATIVE and it replaced a twenty-two entry catalogue that
// had been assembled from the site's own older taxonomies. Those had guessed at
// the range and guessed wrong in both directions: they invented Panel Blinds,
// Straight Drop Awnings, Louvre Roofs, Café Blinds and Outdoor Roller Blinds,
// split Curtains into three products and Wardrobes into three, and were missing
// Honeycomb Blinds, Roller Shutters, Pleated Flyscreens and Frameless Shower
// Screens entirely — four real products the site could not reach at all.
//
// ONE CARD PER PRODUCT, at the grain the business names them. The previous
// version listed the four roller SKUs (Dusk, Veil, Duo, Haze) individually
// alongside product types, which mixed two grains in one grid. Roller Blinds is
// one card now; its four fabrics live on /blinds/roller-blinds, one level down,
// which is where a SKU belongs.
//
// GROUPS ARE THE BUSINESS'S OWN — Indoor, Outdoor, Other. The shop's filter rail
// is built from them directly rather than from an invented family layer.
// ---------------------------------------------------------------------------

import { PRODUCTS, RYNAMIC_COLOURS, CURTAIN_COLOURS } from './products'
import { blindTypeBySlug } from './blindTypes'
import type { BlindType } from '../lib/pricing'

export type Group = 'Indoor' | 'Outdoor' | 'Other'

export const GROUPS: Group[] = ['Indoor', 'Outdoor', 'Other']

export type Availability = 'Buy online' | 'Price on measure'

/** The light-control vocabulary, ordered most light blocked to least. */
export const LIGHT_VALUES = ['Blockout', 'Light filter', 'Sunscreen', 'Sheer'] as const

export interface CatalogueItem {
  id: string
  name: string
  group: Group
  /** One line under the name on the tile. */
  tagline: string
  /** Where the whole tile goes. */
  to: string
  /** Present only where the product is genuinely priced. Everything else says
   * PRICE ON MEASURE — no price grid is invented for a made-to-measure product,
   * because a made-up figure is one the business then has to honour. */
  priceFrom?: number
  image?: string
  imagePosition?: string
  /** ProductGlyph key, used where no photograph exists — which is most of the
   * range. See components/ProductGlyph. */
  glyph?: string
  colours?: { name: string; hex: string }[]
  /** MULTI-VALUED, and that is what makes the filter work at this grain. One
   * card covers a whole product type, and a roman blind is made in blockout AND
   * light-filter fabrics — it carries both and matches if either is ticked.
   * Products that are not about light carry none and drop out when a light
   * filter is on, which is correct.
   *
   * EDITORIAL. These describe what each product does to daylight; they are a
   * judgment rather than a fact read out of a spec sheet, and this is the one
   * place to correct them. */
  light?: string[]
  /** What this product's "Visualise" badge should select in the visualiser — set
   * ONLY on the products the visualiser can actually draw.
   *
   * That is roller blinds and curtains, and it is a limit of the renderer rather
   * than an editorial choice: Canvas2DBlindRenderer draws a roller and
   * Canvas2DCurtainRenderer draws a wave-fold curtain, and there is no wardrobe
   * and no awning in either of them. Absent means no badge, because a badge that
   * opened the visualiser on a roller blind from a wardrobe card would be a
   * promise the next screen breaks.
   *
   * A SELECTION, NOT A URL. It used to be a `/visualiser?...` link, and the badge
   * left the homepage to use a tool the homepage already has further down it.
   * Describing the selection instead lets the badge scroll to the embedded
   * visualiser and set it, and would still be what a link needed if one ever
   * wanted building from it. */
  visualise?: {
    category: 'blind' | 'curtain'
    /** Blinds only — which of the four the panel should open on. */
    blindType?: BlindType
  }
}

/** The enquiry destination, carrying the product name so the contact form opens
 * with it already in the message. Somebody who has just clicked a specific
 * product should not have to retype which one. */
const enquire = (name: string) => `/contact?product=${encodeURIComponent(name)}`

/** Cheapest roller in the catalogue, so the tile's from-price moves when the
 * catalogue does rather than being typed here. */
const ROLLER_FROM = Math.min(...PRODUCTS.map(p => p.priceFrom))

/** A blind type that has its own listing page links to it; everything else
 * resolves to the enquiry form. Reading the page's existence off blindTypes.ts
 * rather than hardcoding it means a type that gains a page starts linking to it
 * without this file changing. */
const blindLink = (slug: string, name: string) =>
  blindTypeBySlug(slug) ? `/blinds/${slug}` : enquire(name)

export const CATALOGUE: CatalogueItem[] = [
  // --- INDOOR --------------------------------------------------------------
  {
    id: 'roller-blinds',
    name: 'Roller Blinds',
    group: 'Indoor',
    tagline: 'Clean lines. Blockout, sunscreen, light filter and dual.',
    to: blindLink('roller-blinds', 'Roller Blinds'),
    priceFrom: ROLLER_FROM,
    image: '/images/lifestyle/room-kitchen.png',
    imagePosition: 'center 34%',
    glyph: 'roller-blinds',
    colours: RYNAMIC_COLOURS,
    light: ['Blockout', 'Light filter', 'Sunscreen'],
    // Blockout of the four, because it is the one a roller blind is bought for.
    visualise: { category: 'blind', blindType: 'blockout' },
  },
  {
    id: 'roman-blinds',
    name: 'Roman Blinds',
    group: 'Indoor',
    tagline: 'Soft folds that stack flat at the head of the window.',
    to: blindLink('roman-blinds', 'Roman Blinds'),
    glyph: 'roman-blinds',
    image: '/images/products/roman-blinds.webp',
    // THE FABRIC BLINDS SHARE THE RYNAMIC CARD, and this is an editorial claim
    // in the same class as LIGHT_OVERRIDES above — worth a commercial check.
    //
    // The reasoning: Rynamic is the fabric range Klay already sells rollers in,
    // and a roman, a honeycomb and a vertical are all fabric products cut from
    // the same kind of cloth. Saying they come in nothing was the less accurate
    // of the two available claims.
    //
    // It also makes the range row work. The card's lead control is a colour
    // swatch where a colour card exists, and repainting the tile's ground with
    // the chosen colour is the one way a photoless product can SHOW a selection
    // rather than just record it — see the note on the glyph fallback in RangeGrid.
    // With colours on rollers and curtains alone, both of which have
    // photographs, that never fired once.
    colours: RYNAMIC_COLOURS,
    light: ['Blockout', 'Light filter'],
  },
  {
    id: 'honeycomb-blinds',
    name: 'Honeycomb Blinds',
    group: 'Indoor',
    tagline: 'Cellular pleats that trap air. The insulating blind.',
    to: enquire('Honeycomb Blinds'),
    glyph: 'honeycomb-blinds',
    image: '/images/products/honeycomb-blinds.webp',
    // See the note on Roman Blinds — the fabric blinds share the Rynamic card.
    colours: RYNAMIC_COLOURS,
    light: ['Blockout', 'Light filter'],
  },
  {
    id: 'venetian-blinds',
    name: 'Venetian Blinds',
    group: 'Indoor',
    tagline: 'Horizontal slats that tilt. Aluminium, timber or faux.',
    to: blindLink('venetian-blinds', 'Venetian Blinds'),
    glyph: 'venetian-blinds',
    light: ['Blockout', 'Light filter'],
  },
  {
    id: 'plantation-shutters',
    name: 'Plantation Shutters',
    group: 'Indoor',
    tagline: 'Louvred joinery, fitted to the opening and built to last.',
    to: enquire('Plantation Shutters'),
    glyph: 'shutters',
    image: '/images/products/plantation-shutters.webp',
    light: ['Blockout', 'Light filter'],
  },
  {
    id: 'vertical-blinds',
    name: 'Vertical Blinds',
    group: 'Indoor',
    tagline: 'Louvres that draw aside. Made for sliding doors.',
    to: blindLink('vertical-blinds', 'Vertical Blinds'),
    glyph: 'vertical-blinds',
    image: '/images/products/vertical-blinds.webp',
    // See the note on Roman Blinds — the fabric blinds share the Rynamic card.
    colours: RYNAMIC_COLOURS,
    light: ['Blockout', 'Light filter', 'Sunscreen'],
  },
  {
    id: 'curtains',
    name: 'Curtains',
    group: 'Indoor',
    tagline: 'Sheer, blockout and lined. S-fold, pinch pleat or wave.',
    to: enquire('Curtains'),
    // The bedroom frame carrying sheers AND heavy drapes in one shot, which is
    // the right picture for a tile standing for the whole curtain range rather
    // than one fabric.
    image: '/images/categories/indoor.jpg',
    imagePosition: '62% center',
    glyph: 'curtains',
    colours: CURTAIN_COLOURS,
    light: ['Blockout', 'Light filter', 'Sheer'],
    // No blindType — the category is the whole selection for a curtain, and the
    // panel's curtain branch has its own type field (sheer/blockout).
    visualise: { category: 'curtain' },
  },

  // --- OUTDOOR -------------------------------------------------------------
  {
    id: 'folding-arm-awnings',
    name: 'Folding Arm Awnings',
    group: 'Outdoor',
    tagline: 'Shade on demand, with no posts in the way.',
    to: enquire('Folding Arm Awnings'),
    glyph: 'awning-folding',
    image: '/images/products/folding-arm-awnings.webp',
    light: ['Sunscreen'],
  },
  {
    id: 'zip-guide-systems',
    name: 'Zip Guide Systems',
    group: 'Outdoor',
    tagline: 'Tracked edges. No gaps, no flap, no wind noise.',
    to: enquire('Zip Guide Systems'),
    glyph: 'screens',
    image: '/images/products/zip-guide-systems.webp',
    light: ['Sunscreen', 'Blockout'],
  },
  {
    id: 'roller-shutters',
    name: 'Roller Shutters',
    group: 'Outdoor',
    tagline: 'Insulation, security and total darkness in one slat.',
    to: enquire('Roller Shutters'),
    glyph: 'roller-shutters',
    image: '/images/products/roller-shutters.webp',
    light: ['Blockout'],
  },
  {
    id: 'pleated-flyscreens',
    name: 'Pleated Flyscreens',
    group: 'Outdoor',
    tagline: 'Mesh that folds away to nothing when you are not using it.',
    to: enquire('Pleated Flyscreens'),
    glyph: 'pleated-flyscreens',
    image: '/images/products/pleated-flyscreens.webp',
  },

  // --- OTHER ---------------------------------------------------------------
  {
    id: 'wardrobes',
    name: 'Wardrobes',
    group: 'Other',
    tagline: 'Built-in, walk-in and sliding. Fitted wall to wall.',
    to: enquire('Wardrobes'),
    image: '/images/categories/wardrobes.jpg',
    imagePosition: '13% center',
    glyph: 'wardrobes',
  },
  {
    id: 'shelving',
    name: 'Shelving',
    group: 'Other',
    tagline: 'Open shelving, drawers and racks, made to the room.',
    to: enquire('Shelving'),
    // The right-hand crop of the same walk-in the wardrobe tile uses — one
    // photograph composed left to right along the line the two products divide
    // on: hanging garments down the left, open shelves across the right.
    image: '/images/range/wardrobes.jpg',
    imagePosition: '78% center',
    glyph: 'shelving',
  },
  {
    id: 'frameless-shower-screens',
    name: 'Frameless Shower Screens',
    group: 'Other',
    tagline: 'Toughened glass, no frame. The bathroom disappears.',
    to: enquire('Frameless Shower Screens'),
    glyph: 'shower-screens',
    image: '/images/products/frameless-shower-screens.webp',
  },
]

// ---------------------------------------------------------------------------
// CONFIGURING A PRODUCT — see data/configOptions.ts.
//
// What each product lets a customer choose, what a chosen configuration costs
// and what it becomes as a cart line all live there rather than here. This file
// stays a description of the range; that one is a description of the choices.
//
// The rule that spans both: no price is invented for a made-to-measure product.
// Only the roller range has published pricing, so only it quotes a figure.
// Everything else reaches the cart as PRICE ON MEASURE carrying no number at
// all — the cart checks out as "Request Quote & Measure" rather than as a card
// payment, so it can hold such a line honestly.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// FACETS
// ---------------------------------------------------------------------------

/** What the shop is currently filtered to. Empty sets mean "no constraint on
 * this facet" rather than "nothing" — an empty rail shows everything. */
export interface Facets {
  groups: Set<string>
  lights: Set<string>
  availability: Set<string>
}

export const EMPTY_FACETS: Facets = {
  groups: new Set(),
  lights: new Set(),
  availability: new Set(),
}

export const availabilityOf = (item: CatalogueItem): Availability =>
  item.priceFrom === undefined ? 'Price on measure' : 'Buy online'

/** AND between facets, OR within one. Ticking Indoor and Outdoor widens the
 * result; ticking Indoor and then Blockout narrows it. That is what every
 * faceted shop does and what people expect from checkboxes stacked in groups.
 *
 * `light` is the only facet matched against an array: an item passes if ANY of
 * its light behaviours is selected. An item with no light information — a
 * wardrobe — never passes a light filter, which is correct. */
export const matches = (item: CatalogueItem, f: Facets): boolean => {
  if (f.groups.size && !f.groups.has(item.group)) return false
  if (f.lights.size && !(item.light ?? []).some(l => f.lights.has(l))) return false
  if (f.availability.size && !f.availability.has(availabilityOf(item))) return false
  return true
}

export const applyFacets = (f: Facets): CatalogueItem[] => CATALOGUE.filter(i => matches(i, f))

/** How many products an option WOULD show, counted with every other facet still
 * applied but this facet's own selections ignored.
 *
 * Counting against the unfiltered catalogue instead is the version that lies:
 * with Outdoor ticked it would still offer "Sheer 1", and clicking it gives an
 * empty grid. Ignoring the option's own facet is what keeps a group usable —
 * inside a group the options OR together, so the other choices in that group
 * must not suppress each other's counts. */
export const countFor = (f: Facets, facet: keyof Facets, value: string): number => {
  const probe: Facets = { ...f, [facet]: new Set([value]) }
  return CATALOGUE.filter(i => matches(i, probe)).length
}

export const facetCount = (f: Facets): number =>
  f.groups.size + f.lights.size + f.availability.size

/** Group options with their totals, built from the catalogue so a group with
 * nothing in it never gets a control. */
export const GROUP_FILTERS = GROUPS.map(g => ({
  id: g,
  label: g,
  count: CATALOGUE.filter(i => i.group === g).length,
})).filter(f => f.count > 0)

/** Legacy links. The homepage tiles, the category pages and the hero rail all
 * point at /products?category=<slug>. This maps the ones that still resolve
 * onto a group so an old link lands on the shop already narrowed rather than on
 * the whole catalogue or a 404. Anything unrecognised shows everything, which
 * is the safe answer. */
export const groupForCategoryParam = (param: string | null): Group | 'All' => {
  if (!param) return 'All'
  const direct = GROUPS.find(g => g.toLowerCase() === param.toLowerCase())
  if (direct) return direct
  const item = CATALOGUE.find(i => i.id === param)
  if (item) return item.group
  if (param === 'wardrobes' || param === 'shelving-storage') return 'Other'
  if (param === 'outdoor') return 'Outdoor'
  if (param === 'indoor') return 'Indoor'
  return 'All'
}
