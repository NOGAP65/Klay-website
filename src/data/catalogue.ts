// ---------------------------------------------------------------------------
// THE CATALOGUE — every product Klay sells, flat, in one list, for one page.
//
// The shop is a single /products page now. There is no category tier and no
// dropdown: you land on everything and filter it down. This file is what that
// page reads, and it is the first place on the site where "what does Klay
// sell" has a single, complete answer.
//
// It does not invent anything. Every entry is assembled from a file that
// already owned that fact:
//
//   data/products.ts     the four priced, buyable roller SKUs and their colours
//   data/blindTypes.ts   the five blind types, with their own listing pages
//   data/categories.ts   every other product type, with its tagline
//   data/ranges.ts       the six ranges the nav and the homepage speak in
//
// MIXED GRAIN, ON PURPOSE. Rollers appear as four individual products — Dusk,
// Veil, Duo, Haze — because they are genuinely buyable, each has a price, a
// photograph and a configurator. Everything else appears once per TYPE, because
// a type is as fine as the real information goes: there is no SKU list for
// venetians and inventing one would be inventing stock.
//
// Levelling the grain either way was worse. All-types-only hides the only four
// things on the site you can actually buy one level down. All-SKUs would need
// twenty SKUs that do not exist.
//
// WHERE A CARD GOES. A roller opens its configurator. A blind type opens its
// own listing page, which is a real page with filters and an FAQ. Everything
// else opens the enquiry form with the product named in the message — which is
// the honest destination for a product with no price grid, and better than a
// dead tile.
// ---------------------------------------------------------------------------

import { PRODUCTS, RYNAMIC_COLOURS } from './products'
import { BLIND_TYPES } from './blindTypes'
import { getSubcategoryBySlug } from './categories'
import { RANGES } from './ranges'

/** The six ranges, read off data/ranges.ts so the filter bar, the homepage
 * carousel and the nav cannot disagree about what the ranges are. */
export const RANGE_NAMES = RANGES.map(r => r.label)

export type RangeName = (typeof RANGE_NAMES)[number]

// ---------------------------------------------------------------------------
// THE FACETS. Four, and they are not four flat lists.
//
// FAMILY sits ABOVE range, and it is the reason the filters are a left rail
// rather than a row of pills. Six flat pills say Blinds and Wardrobes are the
// same kind of thing; they are not. Klay sells window coverings, outdoor shade
// and storage, and a horizontal bar physically cannot show that nesting.
//
// WHERE is the old Indoor/Outdoor taxonomy, which made a poor primary
// navigation — nobody arrives wanting "Indoor" — but makes a genuinely good
// filter. This is the right place for it.
//
// LIGHT IS MULTI-VALUED, and that is what makes it work at this grain. "Roman
// Blinds" is one card covering blockout, light-filter and textured fabrics, so
// it cannot be filed under a single value; it carries all of them and matches
// if ANY selected value hits. Products that are not about light — wardrobes,
// shelving — carry none and simply drop out when a light filter is on, which is
// correct.
//
// AVAILABILITY is standing in for a price filter, on purpose. Only six of the
// twenty-two have a price; a "under $X" slider would delete two thirds of the
// shop the moment anyone touched it, and imply prices exist that do not. Buy
// online / Price on measure asks the same question — what can I just buy — and
// is true for all of them. It becomes a real price facet, in brackets rather
// than a slider, when the other ranges get price grids.
// ---------------------------------------------------------------------------

export type Family = 'Window Coverings' | 'Shade' | 'Storage'
export type Location = 'Indoor' | 'Outdoor'
export type Availability = 'Buy online' | 'Price on measure'

/** Which family each range belongs to. The rail's top group is generated from
 * this, so a range added to data/ranges.ts has to be filed here too — which is
 * the point: an unfiled range would otherwise silently vanish from the shop's
 * primary filter. */
export const FAMILY_OF: Record<string, Family> = {
  Blinds: 'Window Coverings',
  Curtains: 'Window Coverings',
  Screens: 'Window Coverings',
  Awnings: 'Shade',
  Wardrobes: 'Storage',
  Shelving: 'Storage',
}

export const FAMILIES: Family[] = ['Window Coverings', 'Shade', 'Storage']

/** The light-control vocabulary, in the order it reads on the rail: most light
 * blocked to least. */
export const LIGHT_VALUES = ['Blockout', 'Light filter', 'Sunscreen', 'Sheer'] as const

/** Blind-type filter ids map onto that vocabulary where they describe light
 * rather than material — `aluminium`, `timber`, `faux` and `textured` describe
 * what the thing is made of and say nothing about what it does to daylight. */
const LIGHT_FROM_FILTER: Record<string, string[]> = {
  blockout: ['Blockout'],
  sunscreen: ['Sunscreen'],
  lightfilter: ['Light filter'],
  dual: ['Blockout', 'Sunscreen'],
}

/** EDITORIAL, AND EASY TO CORRECT. Where the taxonomy carries no light
 * information at all — venetians and shutters are filed by material, curtains
 * by construction — these are a judgment about what the product does to
 * daylight, not a fact read out of a data file. A venetian with its slats
 * closed is close to blockout and open is a light filter; a lined curtain is
 * effectively blockout. If any of these are wrong commercially, this map is the
 * one place to fix them. */
const LIGHT_OVERRIDES: Record<string, string[]> = {
  'venetian-blinds': ['Blockout', 'Light filter'],
  'plantation-shutters': ['Blockout', 'Light filter'],
  'sheer-curtains': ['Sheer'],
  'blockout-curtains': ['Blockout'],
  'lined-curtains': ['Blockout'],
  // Outdoor shade is light control too, and a customer filtering for sunscreen
  // on a deck should find these.
  'zip-screens': ['Sunscreen'],
  'cafe-blinds': ['Sunscreen'],
  'straight-drop-awnings': ['Sunscreen'],
  'outdoor-roller-blinds': ['Blockout', 'Sunscreen'],
}

export interface CatalogueItem {
  id: string
  name: string
  /** Which filter pill shows this. Also the card's eyebrow: on a grid holding
   * blinds, curtains and wardrobes at once, the range is the single most useful
   * thing to print above the name. */
  range: RangeName
  tagline: string
  /** Where the whole tile goes. */
  to: string
  /** Present only where the item is genuinely priced. Everything else says
   * PRICE ON MEASURE — see the note in data/blindTypes.ts about why no price
   * grid is invented for a made-to-measure product. */
  priceFrom?: number
  image?: string
  imagePosition?: string
  /** ProductGlyph key, used where no photograph exists — which is most of the
   * range. See components/ProductGlyph. */
  glyph?: string
  colours?: { name: string; hex: string }[]
  /** Facets — see the block above. `light` is an array because a single card
   * can legitimately span several light behaviours. */
  location: Location
  light?: string[]
}

/** Tagline for a product type, read out of the taxonomy rather than retyped
 * here. These sentences are already written down once. */
const tagline = (slug: string, fallback = ''): string =>
  getSubcategoryBySlug('indoor', slug)?.tagline ??
  getSubcategoryBySlug('outdoor', slug)?.tagline ??
  getSubcategoryBySlug('wardrobes', slug)?.tagline ??
  fallback

const priceOf = (slug: string): number | undefined =>
  getSubcategoryBySlug('indoor', slug)?.priceFrom

const imageOf = (slug: string): string | undefined =>
  getSubcategoryBySlug('indoor', slug)?.image ??
  getSubcategoryBySlug('outdoor', slug)?.image ??
  getSubcategoryBySlug('wardrobes', slug)?.image

/** The enquiry destination, carrying the product name so the contact form opens
 * with it already in the message. Somebody who has just clicked a specific
 * product should not have to retype which one. */
const enquire = (name: string) => `/contact?product=${encodeURIComponent(name)}`

/** Indoor or Outdoor, read off which top-level category the taxonomy files this
 * slug under rather than restated here. Outdoor is the smaller set, so it is
 * the one that gets asked about. */
const locationOf = (slug: string): Location =>
  getSubcategoryBySlug('outdoor', slug) ? 'Outdoor' : 'Indoor'

/** An item built from a subcategory slug in the taxonomy. */
const fromTaxonomy = (
  slug: string,
  range: RangeName,
  glyph: string,
  overrides: Partial<CatalogueItem> = {},
): CatalogueItem => {
  const sub =
    getSubcategoryBySlug('indoor', slug) ??
    getSubcategoryBySlug('outdoor', slug) ??
    getSubcategoryBySlug('wardrobes', slug)
  if (!sub) throw new Error(`catalogue: no subcategory "${slug}" in the taxonomy`)
  return {
    id: slug,
    name: sub.name,
    range,
    tagline: tagline(slug),
    to: enquire(sub.name),
    priceFrom: priceOf(slug),
    image: imageOf(slug),
    glyph,
    location: locationOf(slug),
    light: LIGHT_OVERRIDES[slug],
    ...overrides,
  }
}

// --- BLINDS ---------------------------------------------------------------
// The four buyable rollers, then the four blind types that have listing pages,
// then shutters, which has neither a page nor a price.

const ROLLERS: CatalogueItem[] = PRODUCTS.map(p => ({
  id: p.slug,
  name: p.name,
  range: 'Blinds',
  tagline: p.tagline,
  to: `/products/${p.slug}`,
  priceFrom: p.priceFrom,
  image: p.image,
  colours: RYNAMIC_COLOURS,
  location: 'Indoor',
  // Straight off the product's own blindType, which is the one place the
  // catalogue records what each fabric does to daylight.
  light: LIGHT_FROM_FILTER[p.blindType] ?? [],
}))

/** The four non-roller blind types, straight off BLIND_TYPES so a type added
 * there appears in the shop without being written down twice. Rollers are
 * excluded because their four products are already listed individually above —
 * a "Roller Blinds" card beside Dusk, Veil, Duo and Haze is the same range
 * offered at two grains in one grid. */
const BLIND_TYPE_ITEMS: CatalogueItem[] = BLIND_TYPES.filter(
  t => t.slug !== 'roller-blinds',
).map(t => ({
  id: t.slug,
  name: t.name,
  range: 'Blinds',
  // The type's own intro, trimmed to its first sentence — the full paragraph is
  // hero copy and runs three lines in a card.
  tagline: `${t.intro.split('. ')[0]}.`,
  to: `/blinds/${t.slug}`,
  image: t.heroImage,
  glyph: t.slug,
  location: 'Indoor' as Location,
  // Derived from the type's OWN filter pills where those describe light, so a
  // roman blind offering blockout and light-filter fabrics matches either — see
  // the note on multi-valued light above. Venetians file by material and carry
  // no light information at all, so they fall through to the editorial map.
  light:
    LIGHT_OVERRIDES[t.slug] ??
    [...new Set(t.filters.flatMap(f => LIGHT_FROM_FILTER[f.id] ?? []))],
}))

// --- EVERYTHING ELSE ------------------------------------------------------

const CURTAINS: CatalogueItem[] = [
  fromTaxonomy('sheer-curtains', 'Curtains', 'curtains'),
  fromTaxonomy('blockout-curtains', 'Curtains', 'curtains'),
  fromTaxonomy('lined-curtains', 'Curtains', 'curtains'),
]

// A GLYPH PER MECHANISM, NOT PER RANGE. These four shipped sharing one drawing
// and rendered as four identical icons in a row, which reads as a bug rather
// than as a range — see the note in ProductGlyph.
const AWNINGS: CatalogueItem[] = [
  fromTaxonomy('folding-arm-awnings', 'Awnings', 'awning-folding'),
  fromTaxonomy('straight-drop-awnings', 'Awnings', 'awning-straight-drop'),
  fromTaxonomy('outdoor-roller-blinds', 'Awnings', 'outdoor-roller'),
  fromTaxonomy('louvre-roofs', 'Awnings', 'louvre-roof'),
]

const SCREENS: CatalogueItem[] = [
  fromTaxonomy('zip-screens', 'Screens', 'screens'),
  // A café blind is a clear or mesh drop with weighted edges rather than a
  // tracked mesh, so it borrows the straight-drop drawing rather than the zip
  // screen's — the two sit side by side and must not print the same picture.
  fromTaxonomy('cafe-blinds', 'Screens', 'awning-straight-drop'),
]

const WARDROBES: CatalogueItem[] = [
  fromTaxonomy('built-in-wardrobes', 'Wardrobes', 'wardrobes'),
  fromTaxonomy('walk-in-robes', 'Wardrobes', 'wardrobes', {
    // The right-hand crop of the same walk-in the built-in tile uses. See the
    // note in data/ranges.ts — one photograph, composed left to right along the
    // line the two products divide on.
    imagePosition: '13% center',
  }),
  fromTaxonomy('sliding-doors', 'Wardrobes', 'wardrobes'),
]

const SHELVING: CatalogueItem[] = [
  fromTaxonomy('shelving-storage', 'Shelving', 'shelving', {
    imagePosition: '78% center',
  }),
]

/** Shutters have no listing page and no price, so they resolve to the enquiry
 * form like the rest. Filed under Blinds because the six ranges have no
 * "Shutters" and a hard louvred window covering belongs with the blinds far
 * more than with the curtains. */
const SHUTTERS: CatalogueItem[] = [
  fromTaxonomy('plantation-shutters', 'Blinds', 'shutters'),
]

/** The shop, in the order it is shown under "All". Rollers first because they
 * are the only thing on the site anybody can actually buy today; after that the
 * ranges run in the same order as the nav and the homepage carousel. */
export const CATALOGUE: CatalogueItem[] = [
  ...ROLLERS,
  ...BLIND_TYPE_ITEMS,
  ...SHUTTERS,
  ...CURTAINS,
  ...AWNINGS,
  ...WARDROBES,
  ...SCREENS,
  ...SHELVING,
]

/** Filter options, built from what is actually in the catalogue rather than
 * typed out — a range with nothing in it would otherwise show a control that
 * filters to an empty grid. */
export const RANGE_FILTERS = RANGE_NAMES.map(name => ({
  id: name,
  label: name,
  count: CATALOGUE.filter(i => i.range === name).length,
})).filter(f => f.count > 0)

/** The rail's top group: families, each with the ranges filed under it. Built
 * by grouping rather than declared, so it cannot disagree with FAMILY_OF. */
export const FAMILY_GROUPS = FAMILIES.map(family => ({
  family,
  ranges: RANGE_FILTERS.filter(r => FAMILY_OF[r.id] === family),
})).filter(g => g.ranges.length > 0)

/** What the shop is currently filtered to. Empty sets mean "no constraint on
 * this facet" rather than "nothing" — an empty rail shows everything. */
export interface Facets {
  ranges: Set<string>
  locations: Set<string>
  lights: Set<string>
  availability: Set<string>
}

export const EMPTY_FACETS: Facets = {
  ranges: new Set(),
  locations: new Set(),
  lights: new Set(),
  availability: new Set(),
}

export const availabilityOf = (item: CatalogueItem): Availability =>
  item.priceFrom === undefined ? 'Price on measure' : 'Buy online'

/** AND between facets, OR within one. Selecting Blinds and Curtains widens the
 * result; selecting Blinds and then Outdoor narrows it. That is what every
 * faceted shop does and what people expect from checkboxes stacked in groups.
 *
 * `light` is the only facet matched against an array: an item passes if ANY of
 * its light behaviours is selected. An item with no light information — a
 * wardrobe — never passes a light filter, which is correct. */
export const matches = (item: CatalogueItem, f: Facets): boolean => {
  if (f.ranges.size && !f.ranges.has(item.range)) return false
  if (f.locations.size && !f.locations.has(item.location)) return false
  if (f.lights.size && !(item.light ?? []).some(l => f.lights.has(l))) return false
  if (f.availability.size && !f.availability.has(availabilityOf(item))) return false
  return true
}

export const applyFacets = (f: Facets): CatalogueItem[] => CATALOGUE.filter(i => matches(i, f))

/** How many products an option WOULD show, counted with every other facet still
 * applied but this facet's own selections ignored.
 *
 * Counting against the unfiltered catalogue instead is the version that lies:
 * with Outdoor selected it would still offer "Wardrobes 3", and clicking it
 * gives an empty grid. Ignoring the option's own facet is what keeps the group
 * usable — inside a group the options OR together, so the other choices in that
 * group must not suppress each other's counts. */
export const countFor = (f: Facets, facet: keyof Facets, value: string): number => {
  const withoutOwnFacet: Facets = { ...f, [facet]: new Set<string>() }
  const probe: Facets = { ...withoutOwnFacet, [facet]: new Set([value]) }
  return CATALOGUE.filter(i => matches(i, probe)).length
}

export const facetCount = (f: Facets): number =>
  f.ranges.size + f.locations.size + f.lights.size + f.availability.size

/** Legacy links. The homepage tiles, the category pages and the hero rail all
 * point at /products?category=<slug>, and those slugs are subcategory slugs
 * rather than range names. This maps them onto the range filter so an old link
 * lands on the shop already narrowed, instead of on the whole catalogue or a
 * 404. Unknown slugs simply show everything. */
export const rangeForCategoryParam = (param: string | null): RangeName | 'All' => {
  if (!param) return 'All'
  const direct = RANGE_NAMES.find(n => n.toLowerCase() === param.toLowerCase())
  if (direct) return direct
  const item = CATALOGUE.find(i => i.id === param)
  if (item) return item.range
  // The old top-level categories, which were where a product lived rather than
  // what it was. Indoor covered blinds and curtains both, so it cannot resolve
  // to one range — it opens the shop unfiltered, which is the truthful answer.
  if (param === 'wardrobes') return 'Wardrobes'
  if (param === 'curtains') return 'Curtains'
  return 'All'
}
