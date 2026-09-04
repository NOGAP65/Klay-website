// ---------------------------------------------------------------------------
// PRODUCTS is the catalogue the /products section reads. One entry per
// product the customer can actually buy — four, matching the four blind types
// the visualiser renders.
//
// `slug` is the product URL (/products/dusk). `blindType` is the visualiser's
// own identifier for the same thing, which is a separate vocabulary because
// the renderer, the store and Canvas2DBlindRenderer all key off it. The two
// are mapped here, once, so nothing downstream has to hardcode the pairing.
//
// NOTE ON IMAGE PATHS: the files in public/images have spaces in their names,
// so every path here is %20-encoded. Renaming the assets would be the better
// fix; until then these are the paths that actually resolve.
// ---------------------------------------------------------------------------

export type ProductSlug = 'dusk' | 'veil' | 'duo' | 'haze'
export type ProductBlindType = 'blockout' | 'sunscreen' | 'dual' | 'lightfilter'

export interface Product {
  slug: ProductSlug
  /** Visualiser blind type — what KlayConfigurator and the store call it. */
  blindType: ProductBlindType
  name: string
  /** Display type label, e.g. 'Blockout Roller'. */
  type: string
  tagline: string
  description: string
  priceFrom: number
  image: string
}

const BLOCKOUT_IMAGE = '/images/Phoenix%20Blockout%20product%20image.png'
const SUNSCREEN_IMAGE = '/images/Soleil%20Sunscreen%20product%20image.png'
const DUAL_IMAGE = '/images/Eclipse%20Dual%20Roller%20product%20image.png'

export const PRODUCTS: Product[] = [
  {
    slug: 'dusk',
    blindType: 'blockout',
    name: 'Dusk',
    type: 'Blockout Roller',
    tagline: 'Complete darkness. Total privacy.',
    description: 'Fully opaque fabric that stops light penetration completely — the standard choice for bedrooms, nurseries and home theatres.',
    priceFrom: 220,
    image: BLOCKOUT_IMAGE,
  },
  {
    slug: 'veil',
    blindType: 'sunscreen',
    name: 'Veil',
    type: 'Sunscreen Roller',
    tagline: 'Soften the light. Keep the view.',
    description: 'An open-weave mesh that cuts glare and UV while keeping your view to the outside intact.',
    priceFrom: 220,
    image: SUNSCREEN_IMAGE,
  },
  {
    slug: 'duo',
    blindType: 'dual',
    name: 'Duo',
    type: 'Dual Roller',
    tagline: 'Day and night in one blind.',
    description: 'A sunscreen layer and a blockout layer on the same roller system, so one window can do both jobs.',
    priceFrom: 320,
    image: DUAL_IMAGE,
  },
  {
    // PLACEHOLDER IMAGERY — there is no light-filter photograph in
    // public/images yet, so this reuses the Sunscreen shot. That is also the
    // stand-in the canvas renderer uses for its light-filter texture.
    slug: 'haze',
    blindType: 'lightfilter',
    name: 'Haze',
    type: 'Light Filter Roller',
    tagline: 'Daylight, quietly diffused.',
    description: 'Softens harsh sun to an even glow while keeping the room bright and the privacy intact.',
    priceFrom: 220,
    image: SUNSCREEN_IMAGE,
  },
]

/** Product lookup by URL slug. Returns undefined for an unknown slug. */
export const productBySlug = (slug: string | undefined): Product | undefined =>
  PRODUCTS.find(p => p.slug === slug)

/** Reverse map, so the old /products/blockout style URLs can be redirected
 * to the product they became rather than dead-ending. */
export const productByBlindType = (blindType: string | undefined): Product | undefined =>
  PRODUCTS.find(p => p.blindType === blindType)

export const SKU_CATALOGUE = [
  { sku: 'BR-01', name: 'Dusk White', type: 'BLOCKOUT ROLLER', hardware: 'White', price: { small: 220, medium: 260, large: 330 }, slug: 'dusk-white', image: BLOCKOUT_IMAGE },
  { sku: 'BR-02', name: 'Dusk Noir', type: 'BLOCKOUT ROLLER', hardware: 'Black', price: { small: 220, medium: 260, large: 330 }, slug: 'dusk-noir', image: BLOCKOUT_IMAGE },
  { sku: 'BR-03', name: 'Dusk Chrome', type: 'BLOCKOUT ROLLER', hardware: 'Chrome', price: { small: 220, medium: 260, large: 330 }, slug: 'dusk-chrome', image: BLOCKOUT_IMAGE },
  { sku: 'SR-01', name: 'Veil White', type: 'SUNSCREEN ROLLER', hardware: 'White', price: { small: 220, medium: 260, large: 330 }, slug: 'veil-white', image: SUNSCREEN_IMAGE },
  { sku: 'SR-02', name: 'Veil Noir', type: 'SUNSCREEN ROLLER', hardware: 'Black', price: { small: 220, medium: 260, large: 330 }, slug: 'veil-noir', image: SUNSCREEN_IMAGE },
  { sku: 'SR-03', name: 'Veil Chrome', type: 'SUNSCREEN ROLLER', hardware: 'Chrome', price: { small: 220, medium: 260, large: 330 }, slug: 'veil-chrome', image: SUNSCREEN_IMAGE },
  { sku: 'DR-01', name: 'Duo White', type: 'DUAL ROLLER', hardware: 'White', price: { small: 320, medium: 380, large: 480 }, slug: 'duo-white', image: DUAL_IMAGE },
  { sku: 'DR-02', name: 'Duo Black', type: 'DUAL ROLLER', hardware: 'Black', price: { small: 320, medium: 380, large: 480 }, slug: 'duo-black', image: DUAL_IMAGE },
  { sku: 'DR-03', name: 'Duo Chrome', type: 'DUAL ROLLER', hardware: 'Chrome', price: { small: 320, medium: 380, large: 480 }, slug: 'duo-chrome', image: DUAL_IMAGE },
  // PLACEHOLDER DATA — Light Filter is the fourth blind type the visualiser
  // already renders, but it has no confirmed pricing or imagery yet: pricing
  // mirrors Sunscreen (as BASE_PRICE in useVisualiserStore already does) and
  // the imagery reuses the Sunscreen shot.
  { sku: 'LF-01', name: 'Haze White', type: 'LIGHT FILTER ROLLER', hardware: 'White', price: { small: 220, medium: 260, large: 330 }, slug: 'haze-white', image: SUNSCREEN_IMAGE },
  { sku: 'LF-02', name: 'Haze Noir', type: 'LIGHT FILTER ROLLER', hardware: 'Black', price: { small: 220, medium: 260, large: 330 }, slug: 'haze-noir', image: SUNSCREEN_IMAGE },
  { sku: 'LF-03', name: 'Haze Chrome', type: 'LIGHT FILTER ROLLER', hardware: 'Chrome', price: { small: 220, medium: 260, large: 330 }, slug: 'haze-chrome', image: SUNSCREEN_IMAGE },
]

/** Derived from PRODUCTS rather than written out again, so the name, tagline,
 * price and imagery of a range can never disagree with the product page it
 * links to. `slug` stays the blind type here — that is what the visualiser's
 * ?range= param and the legacy category URLs expect — and `productSlug` is
 * the /products/:slug the card actually navigates to. */
export const RANGES = PRODUCTS.map(p => ({
  name: p.name,
  range: p.type,
  tagline: p.tagline,
  description: p.description,
  price: `from $${p.priceFrom}`,
  slug: p.blindType,
  productSlug: p.slug,
  image: p.image,
  skus: SKU_CATALOGUE.filter(s => s.type === p.type.toUpperCase()),
}))

/** Total configurable products, so copy like "view all N" can't drift out of
 * step with the catalogue the way a hardcoded count did. */
export const SKU_COUNT = SKU_CATALOGUE.length

/** Products in the collection — four. Used by the /products header copy. */
export const PRODUCT_COUNT = PRODUCTS.length

// ---------------------------------------------------------------------------
// FABRIC COLOURS — a separate range per product category
//
// Blinds and curtains are different cloth from different mills, so they do not
// share a colour card, and the two lists below are deliberately independent.
// Resolution is always by (category, name): see the visualiser store's
// coloursFor / getFabricColor.
//
// One consequence to keep in mind. A few names appear in BOTH lists at
// different hexes — Dune is a warm tan on a blind and a deep brown on a
// curtain, Sand and White differ slightly too. A colour name is therefore no
// longer unique on its own, so anything that persists or transmits a colour has
// to carry the category with it to be unambiguous. Cart lines and booking links
// both already record the product, so they resolve correctly; just do not add a
// lookup that takes a bare name and assumes it can find the hex.
// ---------------------------------------------------------------------------

// The authoritative Rynamic colour map, for ROLLER BLINDS. These hexes are the
// literal base colour the visualiser renders the fabric as (see
// Canvas2DBlindRenderer's fragment shader) as well as the swatch shown in the
// configurator controls — the two must never drift apart, so there is exactly
// one list.
export const RYNAMIC_COLOURS = [
  { name: 'White', hex: '#F2F0EC' },
  { name: 'Surfmist', hex: '#E8E4DC' },
  { name: 'Light Grey', hex: '#C8C4BC' },
  { name: 'Dune', hex: '#C4A882' },
  { name: 'Cream', hex: '#EDE0C8' },
  { name: 'Sand', hex: '#D4BC98' },
  { name: 'Beige', hex: '#C8B090' },
  { name: 'Forest Green', hex: '#2C4A30' },
  { name: 'Red', hex: '#8C2820' },
  { name: 'Brown', hex: '#6C4830' },
  { name: 'Black', hex: '#303030' },
  { name: 'Deep Ocean Blue', hex: '#1C3048' },
  { name: 'Woodland Grey', hex: '#686460' },
  { name: 'Monument', hex: '#4C4844' },
]

// The CURTAIN colour card. Every hex here was SAMPLED, not chosen: each is the
// mean colour of the centre of a real fabric swatch photograph, measured off the
// swatch imagery of four ranges on the Australian market. Two things that came
// out of doing it by measurement rather than by eye, both worth recording
// because intuition gets them wrong:
//
//   1. THE RANGE IS NEUTRALS. Whites, greiges, greys, charcoals, blacks, and
//      essentially nothing else — not one range carried a green, a red or a
//      blue. Curtains are a large soft furnishing and are specified to disappear
//      into the wall, which is not how a blind is chosen.
//
//   2. FABRIC IS NEVER PAPER-WHITE. The lightest swatch found anywhere measured
//      0.905 luminance. Curtain cloth is woven and lined, and it always reads
//      slightly down from white.
//
// Ordered by luminance, brightest first, and alternating warm against cool
// wherever two sit close together — the real ranges do the same, because a
// customer choosing between two near-identical lightnesses is choosing on
// undertone. The ordering also matters to the renderer: sheer density is driven
// off this value, so an evenly spaced ramp is what exercises it evenly.
//
// The names are the trade's generic colour vocabulary — Ivory, Concrete, Pewter,
// Flint, Charcoal and so on. Deliberately none of the distinctive product names
// a particular range uses for its own patterns, which are its branding rather
// than descriptions of a colour.
/** SLAT AND LOUVRE COLOURS — venetians and plantation shutters.
 *
 * A different range from the fabrics, because these are painted or stained
 * boards rather than woven cloth: the neutrals run cooler and the timbers are
 * real timber rather than a print of one. Seven, which is what a slat range
 * usually is — a fabric book runs to dozens because cloth is cheap to dye and a
 * powder-coat line is not.
 *
 * NEEDS A COMMERCIAL CHECK. These are the colours the range plainly ought to
 * carry, not a list read off a supplier's card, and the two timbers in
 * particular are named rather than matched. A wrong hex here is a customer
 * choosing a colour Klay does not sell.
 */
export const SLAT_COLOURS = [
  { name: 'White', hex: '#F4F3F0' },
  { name: 'Ivory', hex: '#E9E4D9' },
  { name: 'Stone', hex: '#CFCCC6' },
  { name: 'Silver', hex: '#AFAFAD' },
  { name: 'Charcoal', hex: '#4A4A48' },
  { name: 'Light Oak', hex: '#C0A075' },
  { name: 'Walnut', hex: '#7A5638' },
]

export const CURTAIN_COLOURS = [
  { name: 'White', hex: '#E7E7E6' },     // 0.905
  { name: 'Whisper', hex: '#DEDFDD' },   // 0.872 · cool
  { name: 'Ivory', hex: '#D9D5CD' },     // 0.836 · warm
  { name: 'Sand', hex: '#D3CBBB' },      // 0.798 · warm
  { name: 'Mineral', hex: '#C8C8C6' },   // 0.783 · neutral
  { name: 'Concrete', hex: '#B8B8B8' },  // 0.722 · neutral
  { name: 'Barley', hex: '#BEB5A1' },    // 0.711 · warm
  { name: 'Truffle', hex: '#B2AD9E' },   // 0.678 · greige
  { name: 'Silver', hex: '#A7AAA5' },    // 0.661 · cool
  { name: 'Baltic', hex: '#9D9C9B' },    // 0.612 · neutral
  { name: 'Pewter', hex: '#908E8C' },    // 0.558 · warm
  { name: 'Dune', hex: '#8A7C73' },      // 0.499 · warm brown
  { name: 'Flint', hex: '#6F6F6E' },     // 0.435 · neutral
  { name: 'Wallaby', hex: '#554B44' },   // 0.303 · deep brown
  { name: 'Ebony', hex: '#3B3B3C' },     // 0.232
  { name: 'Charcoal', hex: '#2E2E2F' },  // 0.181
  { name: 'Black', hex: '#131415' },     // 0.078
]

/** Fabric colours offered — cited in marketing copy on the homepage and the
 * collection page. Derived rather than written down twice: a literal would go
 * stale the first time a colour is added or retired, and a marketing figure
 * that contradicts the swatch grid below it is worse than no figure.
 *
 * Blinds only, because the figure is labelled as the Rynamic range where it is
 * quoted. Summing the two cards would inflate it and imply one card of 31. */
export const COLOUR_COUNT = RYNAMIC_COLOURS.length

// The three hardware finishes. Single source for the swatch UI, the store's
// hex lookup and the canvas renderer's flat fill — these were previously
// written out separately in all three places. Black is the brand charcoal.
export const HARDWARE_HEX = {
  white: '#EDEDED',
  black: '#303030',
  chrome: '#B0AEA8',
} as const

export const HARDWARE_OPTIONS = [
  { id: 'white', label: 'White' },
  { id: 'black', label: 'Black' },
  { id: 'chrome', label: 'Chrome' },
] as const

export const MOTORISED_ADDON = 150

export const PRICING_NOTE = 'All prices include professional installation across Victoria. Motorised upgrade available on all products.'
