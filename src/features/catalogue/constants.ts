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
// one card now, and its four fabrics are a choice on the product page itself —
// which is where a fabric belongs, next to the price it changes.
//
// GROUPS ARE THE BUSINESS'S OWN — Indoor, Outdoor, Other. The shop's filter rail
// is built from them directly rather than from an invented family layer.
// ---------------------------------------------------------------------------

import * as routes from '@/config/routes';

import { RYNAMIC_COLOURS, CURTAIN_COLOURS } from '../../data/products'

import { PRODUCTS } from './products'

import type { BlindType } from '../../lib/pricing'

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
   * That is roller blinds, curtains and now wardrobes, and it is a limit of the
   * renderers rather than an editorial choice: Canvas2DBlindRenderer draws a
   * roller, Canvas2DCurtainRenderer a wave-fold curtain, and wardrobeScene the
   * Forma range in three.js. There is still no awning in any of them. Absent
   * means no badge, because a badge that opened the visualiser on a roller
   * blind from an awning card would be a promise the next screen breaks.
   *
   * WHAT THE BADGE PROMISES IS THE VISUALISER, NOT THE ROOM COMPOSITE. A
   * wardrobe opens on its preview and turns in 3D; putting it in a photograph
   * of your own room is not offered yet (see the footer in KlayConfigurator).
   * The badge is honest either way — it says "see this drawn", which is what
   * happens — and the label is set per category where it needs to differ.
   *
   * A SELECTION, NOT A URL. It used to be a `/visualiser?...` link, and the badge
   * left the homepage to use a tool the homepage already has further down it.
   * Describing the selection instead lets the badge scroll to the embedded
   * visualiser and set it, and would still be what a link needed if one ever
   * wanted building from it. */
  visualise?: {
    category: 'blind' | 'curtain' | 'wardrobe'
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

/** Straight to a product's own page — the one screen that carries the visualiser,
 * the configuration and Add to Cart together.
 *
 * WHY ROLLERS HAVE NO LISTING PAGE. Clicking Roller Blinds used to land on
 * /blinds/roller-blinds, which asked which of four fabrics and then forwarded to
 * exactly this page. But the four rollers are one product in four fabrics — Dusk
 * is the blockout, Veil the sunscreen, Duo the dual, Haze the light filter — and
 * the product page offers that choice itself, becoming whichever one is picked.
 * So the listing page was asking a question its own destination could answer,
 * one click earlier and with nothing to show for it. It is gone; the URL
 * redirects here. See routes/legacyRedirects.
 *
 * Dusk because it is the blockout: the cheapest of the four, the one ROLLER_FROM
 * already quotes above, and the visualiser's own default type — so the page opens
 * on the fabric the from-price refers to. */
const productLink = (slug: string) => routes.product(slug)

export const CATALOGUE: CatalogueItem[] = [
  // --- INDOOR --------------------------------------------------------------
  {
    id: 'roller-blinds',
    name: 'Roller Blinds',
    group: 'Indoor',
    tagline: 'Clean lines. Blockout, sunscreen, light filter and dual.',
    // Straight to the product page, which configures and adds to cart — see
    // productLink.
    to: productLink('dusk'),
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
    to: enquire('Roman Blinds'),
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
    to: enquire('Venetian Blinds'),
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
    to: enquire('Vertical Blinds'),
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
    // The enquiry form, unchanged. Curtains get no product page and no Add to
    // Cart anywhere on the site — they are not in PRODUCTS, every curtain
    // subcategory is available:false, and CartItem could not describe one anyway
    // (no mount, no wave-fold heading, and a windowSize that stops at large where
    // curtains go to XL). There is no configure-and-buy screen to send them to,
    // so this stays the enquiry it has always been.
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
    // The Forma range is modelled now, so this card carries the badge the two
    // window products have carried all along.
    visualise: { category: 'wardrobe' },
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
