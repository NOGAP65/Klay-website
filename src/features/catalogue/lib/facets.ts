// ---------------------------------------------------------------------------
// THE FACET ENGINE — pure functions over the catalogue.
//
// Split out of constants.ts in Phase 4.3.3. §4: "lib/ is pure and testable
// with no React and no network." What was left behind in constants.ts is the
// twelve-product table and its types; this is everything that reasons about
// them.
//
// The file did two jobs and was 395 lines. Neither half changed — this is a
// cut, not a rewrite.
// ---------------------------------------------------------------------------

import {
  CATALOGUE,
  GROUPS,
  type Availability,
  type CatalogueItem,
  type Group,
} from '../constants';

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
  types: Set<string>
  lights: Set<string>
  availability: Set<string>
}

export const EMPTY_FACETS: Facets = {
  groups: new Set(),
  types: new Set(),
  lights: new Set(),
  availability: new Set(),
}

export const availabilityOf = (item: CatalogueItem): Availability =>
  item.priceFrom === undefined ? 'Price on measure' : 'Buy online'

/** Browsing families, without changing the business's catalogue groups or SKUs. */
export const TYPE_FILTERS = [
  { id: 'blinds', label: 'Blinds', products: ['roller-blinds', 'honeycomb-blinds', 'venetian-blinds'] },
  { id: 'curtains', label: 'Curtains', products: ['curtains'] },
  { id: 'shutters', label: 'Shutters', products: ['plantation-shutters', 'roller-shutters'] },
  { id: 'awnings', label: 'Awnings', products: ['folding-arm-awnings'] },
  { id: 'outdoor-screens', label: 'Outdoor screens', products: ['zip-guide-systems', 'pleated-flyscreens'] },
  { id: 'wardrobes', label: 'Wardrobes & doors', products: ['wardrobes', 'walk-in-wardrobes', 'shaker-framed-sliding-doors', 'shaker-sliding-doors'] },
  { id: 'shelving', label: 'Shelving', products: ['shelving'] },
  { id: 'shower-screens', label: 'Shower screens', products: ['frameless-shower-screens', 'radius-corner-fixed-frameless', 'semi-frameless-front-only', 'semi-frameless-front-return'] },
  { id: 'mirrors', label: 'Mirrors', products: ['mirrors-without-frames', 'mirror-with-frame', 'mirrors-with-cabinets'] },
];

export const typeOf = (item: CatalogueItem) => TYPE_FILTERS.find(type => type.products.includes(item.id));
export const facetLabel = (facet: keyof Facets, value: string) =>
  facet === 'types' ? TYPE_FILTERS.find(type => type.id === value)?.label ?? value : value;

function searchWords(value: string) {
  return value.toLowerCase().replace(/flyscreens?/g, 'fly screen').replace(/showerscreens?/g, 'shower screen')
    .replace(/\bwalk[\s-]?in\b/g, 'walk in').replace(/\bbuilt[\s-]?in\b/g, 'built in')
    .replace(/block\s+out/g, 'blockout').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
    .filter(Boolean).map(word => word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word);
}

export function matchesSearch(item: CatalogueItem, query: string) {
  const words = searchWords(`${item.name} ${item.id} ${item.tagline} ${typeOf(item)?.id ?? ''} ${(item.light ?? []).join(' ')}`);
  return searchWords(query).every(term => words.some(word => word.startsWith(term)));
}

/** AND between facets, OR within one. Ticking Indoor and Outdoor widens the
 * result; ticking Indoor and then Blockout narrows it. That is what every
 * faceted shop does and what people expect from checkboxes stacked in groups.
 *
 * `light` is the only facet matched against an array: an item passes if ANY of
 * its light behaviours is selected. An item with no light information — a
 * wardrobe — never passes a light filter, which is correct. */
export const matches = (item: CatalogueItem, f: Facets): boolean => {
  if (f.types.size && !f.types.has(typeOf(item)?.id ?? '')) return false
  if (f.groups.size && !f.groups.has(item.group)) return false
  if (f.lights.size && !(item.light ?? []).some(l => f.lights.has(l))) return false
  if (f.availability.size && !f.availability.has(availabilityOf(item))) return false
  return true
}

export const applyFacets = (f: Facets, query = ''): CatalogueItem[] => CATALOGUE.filter(i => matches(i, f) && matchesSearch(i, query))

/** How many products an option WOULD show, counted with every other facet still
 * applied but this facet's own selections ignored.
 *
 * Counting against the unfiltered catalogue instead is the version that lies:
 * with Outdoor ticked it would still offer "Sheer 1", and clicking it gives an
 * empty grid. Ignoring the option's own facet is what keeps a group usable —
 * inside a group the options OR together, so the other choices in that group
 * must not suppress each other's counts. */
export const countFor = (f: Facets, facet: keyof Facets, value: string, query = ''): number => {
  const probe: Facets = { ...f, [facet]: new Set([value]) }
  return applyFacets(probe, query).length
}

export const facetCount = (f: Facets): number =>
  f.types.size + f.groups.size + f.lights.size + f.availability.size

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
