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

/** Filter pills, built from what is actually in the catalogue rather than typed
 * out — a range with nothing in it would otherwise show a pill that filters to
 * an empty grid. Counts ride along so the bar can say how many are behind each. */
export const RANGE_FILTERS = RANGE_NAMES.map(name => ({
  id: name,
  label: name,
  count: CATALOGUE.filter(i => i.range === name).length,
})).filter(f => f.count > 0)

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
