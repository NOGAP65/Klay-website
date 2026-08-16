// ---------------------------------------------------------------------------
// THE RANGE — the six things Klay actually sells, at the grain a customer shops
// in: Blinds, Curtains, Awnings, Wardrobes, Screens, Shelving.
//
// This is a SECOND taxonomy sitting beside data/categories.ts, and the two do
// different jobs on purpose:
//
//   categories.ts is Indoor / Outdoor / Wardrobes — where the product lives.
//     It still backs the /indoor, /outdoor and /wardrobes category pages and
//     owns every product type's tagline, price and availability flag.
//
//   ranges.ts is this file — WHAT the product is. Nobody shops for "Indoor";
//     they shop for curtains, or for an awning. This is the grain the homepage
//     carousel, the hero rail and the nav's OUR RANGE dropdown all speak in.
//
// Nothing here is written down twice: taglines and prices are read back out of
// categories.ts, so a change there moves this too.
//
// The array lived inside RangeCarousel.tsx until the nav needed the same six
// names. Two copies of the range is exactly the drift this file exists to stop.
// ---------------------------------------------------------------------------

import { PRODUCTS } from './products'
import { getSubcategoryBySlug } from './categories'

/** Cheapest roller, from the catalogue rather than typed out — the tile's
 * from-price has to move when the catalogue does. */
const ROLLER_FROM = Math.min(...PRODUCTS.map(p => p.priceFrom))

/** Tagline for a subcategory, read out of the taxonomy. These sentences are
 * already written down in data/categories.ts and a second copy here is a copy
 * that goes stale. */
const taglineFor = (slug: string): string | undefined =>
  getSubcategoryBySlug('indoor', slug)?.tagline ??
  getSubcategoryBySlug('outdoor', slug)?.tagline ??
  getSubcategoryBySlug('wardrobes', slug)?.tagline

const priceFor = (slug: string): number | undefined =>
  getSubcategoryBySlug('indoor', slug)?.priceFrom

export interface Range {
  label: string
  to: string
  blurb?: string
  note?: string
  /** Omitted where Klay has no photograph of the range. See the note on
   * Screens below. */
  image?: string
  objectPosition?: string
  /** "Shop Now" only where the click genuinely reaches a shop. */
  cta: string
  /** False where the destination is still the enquiry form rather than a real
   * product page. The nav marks these so the dropdown does not promise six
   * shops when only one exists yet. Flips to true as each range gets its page —
   * blinds first, then the same layout copied across. */
  available: boolean
}

// SIX RANGES, at the grain the business actually sells in: curtains collapse to
// one tile, and Outdoor and Wardrobes each split into the two things people search
// for separately. Sheer and Blockout were two tiles out of six spent on one
// product with two fabrics, while awnings, screens and shelving — three distinct
// purchases — had no tile at all between them.
//
// EVERY TILE SAYS SHOP NOW. Note that only Blinds currently reaches a shop: the
// other five resolve through ProductsPage to the enquiry form. That is a promise
// the routing does not yet keep, and the fix is pages, not a softer label.
//
// ORDERED so the two tiles with no photograph (Awnings, Screens) do not sit
// together. Alternating them against photographed ranges is the difference between
// a row with two gaps in it and a row that reads as half-built.
export const RANGES: Range[] = [
  {
    label: 'Blinds',
    to: '/blinds',
    blurb: 'Blockout, sunscreen and dual.',
    note: `$${ROLLER_FROM}`,
    image: '/images/lifestyle/room-kitchen.png',
    objectPosition: 'center 34%',
    cta: 'Shop Now',
    available: true,
  },
  {
    label: 'Curtains',
    to: '/products?category=curtains',
    blurb: 'Sheer, blockout and lined.',
    // The cheaper of the two curtain types, so the from-price is the honest
    // entry point to the range rather than to one fabric within it.
    note: `$${Math.min(priceFor('sheer-curtains') ?? 360, priceFor('blockout-curtains') ?? 320)}`,
    // The bedroom frame the old Indoor category tile used. It carries sheers AND
    // heavy drapes in the one shot, which is the right picture for a tile that
    // now stands for the whole curtain range rather than one fabric.
    image: '/images/categories/indoor.jpg',
    objectPosition: '62% center',
    cta: 'Shop Now',
    available: false,
  },
  {
    // NO PHOTOGRAPH EXISTS — see the note on Screens below.
    label: 'Awnings',
    to: '/products?category=folding-arm-awnings',
    blurb: taglineFor('folding-arm-awnings'),
    cta: 'Shop Now',
    available: false,
  },
  {
    label: 'Wardrobes',
    to: '/wardrobes',
    blurb: 'Built-in, walk-in and sliding.',
    // THE TWO STORAGE TILES ARE CROPS OF ONE PHOTOGRAPH, and that is deliberate
    // rather than lazy. range/wardrobes.jpg and categories/wardrobes.jpg turn out
    // to be the same frame at two zoom levels, so using one on each tile printed
    // the same picture twice with two different words under it.
    //
    // What saves it is that the frame is composed left to right exactly along the
    // line the two tiles divide on: hanging garments on a rail down the left,
    // open shelves and drawers across the right. Cropped to its left third this
    // is a wardrobe; cropped to its right third it is shelving. Two honest
    // pictures of two different products that happen to share a room — which is
    // what a fitted walk-in actually is.
    image: '/images/categories/wardrobes.jpg',
    objectPosition: '13% center',
    cta: 'Shop Now',
    available: false,
  },
  {
    // NO PHOTOGRAPH EXISTS, and this is now the biggest asset gap on the page.
    // There is not one awning, screen, café blind or louvre roof anywhere in
    // public/images — the only outdoor frame in the repository shows a doorway
    // onto a deck with the room's INDOOR sheers hanging in it, which is why it is
    // not being used here. An indoor sheer captioned "Awnings" is the same
    // mistake as the kitchen that was once captioned "Home Office".
    //
    // PhotoTile renders these two as charcoal with a hairline frame and their
    // tagline. One outdoor shoot turns both into photographs and nothing else in
    // this file changes.
    label: 'Screens',
    to: '/products?category=zip-screens',
    blurb: taglineFor('zip-screens'),
    cta: 'Shop Now',
    available: false,
  },
  {
    label: 'Shelving',
    to: '/products?category=shelving-storage',
    blurb: taglineFor('shelving-storage'),
    // The right third of the same walk-in — shelves, folded stacks and drawer
    // fronts, no hanging rail in shot. See the note on the Wardrobes tile. The
    // tighter of the two files, so the two crops differ in scale as well as in
    // subject.
    image: '/images/range/wardrobes.jpg',
    objectPosition: '78% center',
    cta: 'Shop Now',
    available: false,
  },
]
