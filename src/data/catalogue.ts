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

export type Group = 'Indoor' | 'Outdoor' | 'Other'

export const GROUPS: Group[] = ['Indoor', 'Outdoor', 'Other']

export type Availability = 'Buy online' | 'Price on measure'

/** The light-control vocabulary, ordered most light blocked to least. */
export const LIGHT_VALUES = ['Blockout', 'Light filter', 'Sunscreen', 'Sheer'] as const

export interface CatalogueItem {
  id: string
  name: string
  group: Group
  /** One line under the name on the tile. PRODUCT-CENTRIC — describes the
   * thing. Used by the shop's cards, where the visitor has already chosen to
   * browse products and a description is what they came for. */
  tagline: string
  /** SITUATION-CENTRIC — describes the READER, not the product. "For wide
   * sliding doors and glass walls", not "Louvres that draw aside".
   *
   * The homepage range row uses this and nothing else. Same information, and
   * the difference is who has to do the translating: a visitor scanning for
   * their own problem finds it in the first three words and feels recognised,
   * where a product description asks them to work out whether it applies. It
   * is the single highest-leverage line in the section.
   *
   * Kept as a separate field rather than replacing the tagline because the two
   * surfaces genuinely want different sentences — see tagline above. */
  situation?: string
  /** One true, specific number the card can stand on. Specific beats round:
   * "17 fabric colours" is checkable, "a huge range of colours" is marketing,
   * and a number that can be checked reads as real even when it is not the
   * strongest claim available.
   *
   * EVERY VALUE HERE IS TRUE OF THE REPO AS IT STANDS — colour counts are
   * counted off the colour cards below, and the warranty is what the product
   * pages already publish. Nothing is invented. Review counts would be
   * stronger than either; supply real ones and this is where they go. */
  proof?: string
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
    situation: 'For afternoon glare in the living room, and dark in the bedroom.',
    to: blindLink('roller-blinds', 'Roller Blinds'),
    priceFrom: ROLLER_FROM,
    // The living room, not the kitchen it was. Klay sells light control, so
    // the product demonstration IS a room full of daylight being managed —
    // sunscreen rollers half drawn against a city view, the light landing on
    // the floor. The kitchen shot is dimmer and tighter and argues, quietly,
    // against the thing the business does. Landscape, which is what the wide
    // hero card wants; the portrait satellites take portrait crops.
    image: '/images/lifestyle/room-living.png',
    imagePosition: 'center 42%',
    glyph: 'roller-blinds',
    colours: RYNAMIC_COLOURS,
    light: ['Blockout', 'Light filter', 'Sunscreen'],
  },
  {
    id: 'roman-blinds',
    name: 'Roman Blinds',
    group: 'Indoor',
    tagline: 'Soft folds that stack flat at the head of the window.',
    situation: 'For rooms where a blind should read as soft furnishing.',
    to: blindLink('roman-blinds', 'Roman Blinds'),
    glyph: 'roman-blinds',
    light: ['Blockout', 'Light filter'],
  },
  {
    id: 'honeycomb-blinds',
    name: 'Honeycomb Blinds',
    group: 'Indoor',
    tagline: 'Cellular pleats that trap air. The insulating blind.',
    situation: 'For west-facing rooms that cook in summer and leak heat in winter.',
    to: enquire('Honeycomb Blinds'),
    glyph: 'honeycomb-blinds',
    light: ['Blockout', 'Light filter'],
  },
  {
    id: 'venetian-blinds',
    name: 'Venetian Blinds',
    group: 'Indoor',
    tagline: 'Horizontal slats that tilt. Aluminium, timber or faux.',
    situation: 'For studies and kitchens where you want light angled, not gone.',
    to: blindLink('venetian-blinds', 'Venetian Blinds'),
    glyph: 'venetian-blinds',
    light: ['Blockout', 'Light filter'],
  },
  {
    id: 'plantation-shutters',
    name: 'Plantation Shutters',
    group: 'Indoor',
    tagline: 'Louvred joinery, fitted to the opening and built to last.',
    situation: 'For street-facing windows that want privacy without curtains.',
    to: enquire('Plantation Shutters'),
    glyph: 'shutters',
    light: ['Blockout', 'Light filter'],
  },
  {
    id: 'vertical-blinds',
    name: 'Vertical Blinds',
    group: 'Indoor',
    tagline: 'Louvres that draw aside. Made for sliding doors.',
    situation: 'For wide sliding doors and glass walls.',
    to: blindLink('vertical-blinds', 'Vertical Blinds'),
    glyph: 'vertical-blinds',
    light: ['Blockout', 'Light filter', 'Sunscreen'],
  },
  {
    id: 'curtains',
    name: 'Curtains',
    group: 'Indoor',
    tagline: 'Sheer, blockout and lined. S-fold, pinch pleat or wave.',
    situation: 'For bedrooms, and for full-height glass that needs softening.',
    to: enquire('Curtains'),
    // Sheers across a full-height glass wall, sunlight coming through the cloth
    // and landing on the floorboards. Filed under categories/outdoor.jpg, which
    // is a misnomer in the asset library rather than in this file — the
    // photograph is curtains, and it is the brightest and most persuasive one
    // Klay has. The bedroom frame it replaced (categories/indoor.jpg) is darker
    // and reads as a room at dusk.
    image: '/images/categories/outdoor.jpg',
    imagePosition: '42% center',
    glyph: 'curtains',
    colours: CURTAIN_COLOURS,
    light: ['Blockout', 'Light filter', 'Sheer'],
  },

  // --- OUTDOOR -------------------------------------------------------------
  {
    id: 'folding-arm-awnings',
    name: 'Folding Arm Awnings',
    group: 'Outdoor',
    tagline: 'Shade on demand, with no posts in the way.',
    situation: 'For a deck that is unusable between noon and four.',
    to: enquire('Folding Arm Awnings'),
    glyph: 'awning-folding',
    light: ['Sunscreen'],
  },
  {
    id: 'zip-guide-systems',
    name: 'Zip Guide Systems',
    group: 'Outdoor',
    tagline: 'Tracked edges. No gaps, no flap, no wind noise.',
    situation: 'For an alfresco that both the wind and the western sun find.',
    to: enquire('Zip Guide Systems'),
    glyph: 'screens',
    light: ['Sunscreen', 'Blockout'],
  },
  {
    id: 'roller-shutters',
    name: 'Roller Shutters',
    group: 'Outdoor',
    tagline: 'Insulation, security and total darkness in one slat.',
    situation: 'For street-facing bedrooms — heat, noise and light in one.',
    to: enquire('Roller Shutters'),
    glyph: 'roller-shutters',
    light: ['Blockout'],
  },
  {
    id: 'pleated-flyscreens',
    name: 'Pleated Flyscreens',
    group: 'Outdoor',
    tagline: 'Mesh that folds away to nothing when you are not using it.',
    situation: 'For doors you want open all summer without the insects.',
    to: enquire('Pleated Flyscreens'),
    glyph: 'pleated-flyscreens',
  },

  // --- OTHER ---------------------------------------------------------------
  {
    id: 'wardrobes',
    name: 'Wardrobes',
    group: 'Other',
    tagline: 'Built-in, walk-in and sliding. Fitted wall to wall.',
    situation: 'For a bedroom with one shallow robe and nowhere to put anything.',
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
    situation: 'For a walk-in, a pantry or a garage that has outgrown itself.',
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
    situation: 'For a small bathroom that needs to feel bigger.',
    to: enquire('Frameless Shower Screens'),
    glyph: 'shower-screens',
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

/** The card's proof line. Derived where a true number exists, so it cannot
 * drift out of step with the colour cards it counts: add a colour and the
 * homepage says 15 without anyone editing copy. Falls back to the warranty the
 * product pages already publish. */
export const proofOf = (item: CatalogueItem): string =>
  item.proof ?? (item.colours ? `${item.colours.length} fabric colours` : '5 year warranty')

/** ---------------------------------------------------------------------
 *  PHOTOGRAPHED — the products the homepage range row is allowed to show.
 *
 *  A LINE ICON IS NOT A SUBSTITUTE FOR A PHOTOGRAPH. A drawn glyph sitting
 *  beside a photographed room does not read as "a different treatment", it
 *  reads as an inferior product or an unfinished website, and asymmetric
 *  visual quality across a row is taken as asymmetric PRODUCT quality. So the
 *  row is gated on real imagery rather than filled with drawings.
 *
 *  This is a CONTENT BLOCKER, not a design decision. Ten of the fourteen
 *  products have no photograph in public/images: roman blinds, honeycomb,
 *  venetians, plantation shutters, verticals, folding arm awnings, zip guides,
 *  roller shutters, pleated flyscreens and frameless shower screens. Every one
 *  of them is written and configurable and reachable from the shop — they are
 *  waiting on a photograph and nothing else.
 *
 *  Add `image` to a catalogue entry and its card joins the row. No component
 *  changes, no list to update here.
 *  --------------------------------------------------------------------- */
export const PHOTOGRAPHED: CatalogueItem[] = CATALOGUE.filter(i => i.image)

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
