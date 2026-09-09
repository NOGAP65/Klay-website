// ---------------------------------------------------------------------------
// THE CATALOGUE — the twelve products Klay sells, as supplied by the business.
//
//   Indoor    Roller Blinds, Honeycomb Blinds, Venetian Blinds,
//             Plantation Shutters, Curtains
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
// ROMAN BLINDS AND VERTICAL BLINDS ARE WITHDRAWN, and this is a range decision
// rather than a tidy-up: the business does not sell them, so the site must not
// offer them. Everything that stood behind those two cards went with them — the
// config panels, the mechanism glyphs, the product photographs and the AI
// renders they were cut from. What is left is twelve products, and Indoor is
// five.
//
// GROUPS ARE THE BUSINESS'S OWN — Indoor, Outdoor, Other. The shop's filter rail
// is built from them directly rather than from an invented family layer.
// ---------------------------------------------------------------------------

import { RYNAMIC_COLOURS, CURTAIN_COLOURS, SLAT_COLOURS } from '../../data/products'
import { WARDROBE_COLOURS } from '@/features/visualiser'

import { PRODUCTS } from './products'
import { FRAMED_DOOR_MATERIALS, SHAKER_DOOR_MATERIALS } from './lib/slidingDoors'
import { WALK_IN_COLOURS } from './lib/walkInWardrobes'

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
   * card covers a whole product type, and a honeycomb blind is made in blockout
   * AND light-filter fabrics — it carries both and matches if either is ticked.
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

/* NO productLink, AND NO PRODUCT PAGE FOR IT TO POINT AT.
 *
 * It read: const productLink = (slug: string) => routes.product(slug)
 *
 * The note here used to explain why the roller range had a page and no listing
 * above it — the four rollers are one product in four fabrics, so a listing page
 * asking "which fabric?" was posing a question its own destination answered. All
 * of that is now true one tier further down: the SHOP CARD asks the fabric,
 * prices it and adds it to the cart, so the page it forwarded to had nothing
 * left to do either. Removed 7 September 2026.
 *
 * AND THE FOUR SKU NAMES GO WITH IT. Dusk, Veil, Duo and Haze do not appear
 * anywhere on the site any more. The shop presents one Roller Blinds card with a
 * Fabric type row — blockout, light filter, sunscreen, dual — which is
 * functionally the same choice and prices identically. It is a commercial
 * change, not a technical one, and it is flagged for V to raise with Bobby. */

/** THE ACRYLIC A FOLDING ARM AWNING IS COVERED IN, and the cassette it folds
 * into. Two cards, because they are two different manufactured things: the cloth
 * is woven and solution-dyed, the cassette is extruded aluminium and powder
 * coated, and no supplier offers them in the same list.
 *
 * THE AWNING IS SOLD IN ONE FABRIC. It carried "Cover: Acrylic canvas / Shade
 * mesh", which was a range Klay does not make — the awning comes in acrylic, and
 * what a customer actually chooses is what colour. So the material row goes and
 * these two arrive in its place, cassette first: the cassette is bolted to the
 * house and the fabric goes inside it, which is also the order they are decided
 * in.
 *
 * BOTH NEED A COMMERCIAL CHECK, in the same class as SLAT_COLOURS. They are the
 * colours an acrylic awning range plainly ought to carry rather than a list read
 * off a supplier's book, and a wrong hex is a customer choosing a colour Klay
 * does not sell. Eight cloths, because a solution-dyed acrylic book runs to
 * dozens and a card is not a book; four cassettes, because a powder-coat line is
 * not a fabric book either — white, off-white, and the two darks every extruder
 * carries. */
export const AWNING_COLOURS = [
  { name: 'Natural', hex: '#E6DFCF' },
  { name: 'Ivory', hex: '#EFE9DC' },
  { name: 'Sand', hex: '#D9CDB4' },
  { name: 'Taupe', hex: '#B5A895' },
  { name: 'Olive', hex: '#7C7E63' },
  { name: 'Slate', hex: '#6C7581' },
  { name: 'Charcoal', hex: '#4A4A48' },
  { name: 'Navy', hex: '#2F3A4B' },
]

/** THE MESH A ZIP SCREEN IS MADE OF.
 *
 * IT IS SOLD IN ONE MESH, IN A CHOICE OF COLOURS. The card carried "Screen:
 * Sunscreen mesh / Blockout PVC", which is two different products behind one
 * name, and Klay makes the first. What a customer chooses is the colour — and on
 * a screen that choice does more work than anywhere else in the range, because
 * the mesh is the thing you look THROUGH. A dark mesh sees out better than a
 * pale one: it absorbs the daylight falling on it instead of scattering it back
 * at you. That is the opposite of what most people expect, and it is why the
 * range runs dark.
 *
 * NEEDS A COMMERCIAL CHECK, like SLAT_COLOURS and AWNING_COLOURS. These are the
 * colours an outdoor screen mesh plainly ought to carry rather than a list read
 * off a supplier's card, and a wrong hex is a customer choosing a colour Klay
 * does not sell. Six, because a woven outdoor mesh is an extruded-yarn product
 * and does not come in a fabric book's worth of shades. */
export const MESH_COLOURS = [
  { name: 'Bone', hex: '#DCD7CC' },
  { name: 'Dune', hex: '#B9AE9B' },
  { name: 'Gunmetal', hex: '#6E7276' },
  { name: 'Charcoal', hex: '#4A4C4E' },
  { name: 'Bracken', hex: '#4B4A3E' },
  { name: 'Black', hex: '#26282A' },
]

/** THE POWDER COAT ON A ROLLER SHUTTER.
 *
 * IT IS SOLD IN ONE SLAT, IN A CHOICE OF COLOURS. The card carried
 * "Slat: Aluminium / Insulated", which is two products behind one name and only
 * half true — the slat Klay hangs is a foam-filled aluminium extrusion, so
 * "insulated" is what the product IS rather than an upgrade to choose. What a
 * customer actually chooses is the colour, because a shutter is the most visible
 * thing on the outside of the house: it is a painted box above the window
 * whether it is up or down, and it either matches the roof line or it does not.
 *
 * NEEDS A COMMERCIAL CHECK, in the same class as SLAT_COLOURS, AWNING_COLOURS
 * and MESH_COLOURS. These are the powder coats an extruded shutter range plainly
 * ought to carry rather than a list read off a supplier's chart, and a wrong hex
 * is a customer choosing a colour Klay does not sell. Eight, because a
 * powder-coat line runs to a wall of chips and a card is not a wall: the whites
 * and neutrals a roof line is actually built in, plus the two darks and the mill
 * finish every extruder carries. */
export const SHUTTER_COLOURS = [
  { name: 'White', hex: '#F1F0EC' },
  { name: 'Birch', hex: '#E3DDCE' },
  { name: 'Sandbank', hex: '#CFC3AC' },
  { name: 'Paperbark', hex: '#C6B9A4' },
  { name: 'Dune', hex: '#A99C8B' },
  { name: 'Woodland Grey', hex: '#54574F' },
  { name: 'Charcoal', hex: '#44464A' },
  { name: 'Silver', hex: '#B4B7BA' },
]

/** THE METALWORK ON A FRAMELESS SHOWER SCREEN — the clips or the channel that
 * hold the glass, which on a frameless screen is the only hardware there is.
 *
 * SOURCED, NOT REASONED, and that makes this list different in kind from
 * SLAT_COLOURS, AWNING_COLOURS, MESH_COLOURS and SHUTTER_COLOURS above. Those
 * are the colours such a range plainly ought to carry and are flagged for a
 * commercial check. These seven names are Stegbar's own, read off their clip
 * fixed and channel fixed panel pages in September 2026 — the range Klay is
 * matching — so the names and the split below are checked rather than guessed.
 *
 * THE HEXES ARE STILL MINE. Stegbar publishes finish names, not colour values,
 * so the swatch tints are an approximation of a matte powder coat, a satin
 * anodise and a brushed metal. A wrong hex here shows a customer a slightly
 * wrong shade of a finish that does exist, which is a much smaller error than
 * the lists above risk — but it is the thing to correct if the swatches look
 * off beside a real sample.
 *
 * GUNMETAL IS CLIP ONLY. That is the one asymmetry between the two mountings
 * and it is not an oversight: Stegbar lists seven finishes against the clip and
 * six against the channel, gunmetal being the one that does not carry over. See
 * SCREEN_CLIP_FINISHES and SCREEN_CHANNEL_FINISHES. */
export const SCREEN_FINISHES = [
  { name: 'Matt Black', hex: '#2B2B2D' },
  { name: 'Satin Silver', hex: '#C6C9CB' },
  { name: 'Brushed Nickel', hex: '#B5B2AC' },
  { name: 'Brushed Gold', hex: '#C1A164' },
  { name: 'Matt White', hex: '#F2F1EE' },
  { name: 'Gunmetal', hex: '#5A5E63' },
  { name: 'Polished Silver', hex: '#D9DDE0' },
]

/** All seven. A clip is a small bracket at the corners of the glass and the
 * range's full finish list is offered against it. */
export const SCREEN_CLIP_FINISHES = SCREEN_FINISHES

/** The same six, less gunmetal — derived from the list above rather than typed
 * out again, so a finish added to the range reaches both mountings and only the
 * one genuine exception is written down. */
export const SCREEN_CHANNEL_FINISHES = SCREEN_FINISHES.filter(f => f.name !== 'Gunmetal')

/** EVERY WIDTH A FIXED PANEL IS MADE IN, and the one height it comes in.
 *
 * Stegbar's own ten sizes, identical across clip and channel: H2053 with widths
 * from 700 to 1400. The height never varies, which is why it is a constant here
 * and not a row on the card — a question with one answer is not a question. It
 * is printed alongside the width so the line on the quote reads the way the
 * order does.
 *
 * NOT A BAND. These are real millimetres off a stock list, so a customer picks
 * a size that exists rather than a small/medium/large the measure has to
 * resolve — the same reason the joinery reads widths instead of `size`. */
export const SCREEN_HEIGHT_MM = 2053
export const SCREEN_WIDTHS = [700, 800, 900, 1000, 1050, 1100, 1150, 1200, 1300, 1400]

/** THE SIZE THE CARD OPENS ON, and it is not the narrowest.
 *
 * Every other row on every card defaults to its first choice, which is right
 * where the list is a scale of equals — a fabric, a finish, a room. It is wrong
 * here, because 700 is the narrowest panel in the range and a shower opening
 * that narrow is the exception. Opening on it makes the common case a
 * correction: nearly every customer has to change the row before the card
 * describes their bathroom, and a default nobody wants is worse than no default
 * because it looks like an answer.
 *
 * 1100 is the middle of the ten and the ordinary single-shower opening, so the
 * card opens on something most people can leave alone. The exact panel is
 * settled at the measure either way. */
export const SCREEN_DEFAULT_WIDTH_MM = 1100

/** THE SEMI-FRAMED FRONT-ONLY SCREEN — a different product, not a variant.
 *
 * It shares the frameless card's SHAPE — a bathroom, a colour, a size — and
 * none of its numbers, which is why it gets its own constants rather than
 * reusing the three above. Read off Stegbar's front-only screen page, September
 * 2026:
 *
 *   height   1950, against the frameless panel's 2053
 *   widths   800, 850, 900, 1050, 1200, 1350 — six, against the frameless ten,
 *            and only 900, 1050 and 1200 appear in both lists
 *   glass    6mm Grade A, clear, and clear ONLY
 *   finishes Matt Black and Bright Silver
 *
 * WHY IT IS FRAMED AT ALL: the frame is what makes it cheap and what makes it
 * telescopic. Stegbar describe the front-only screen as adjusting to the
 * opening, which is a thing a framed edge can do and a fixed pane of frameless
 * glass cannot — so the two products are not the same screen at two prices.
 *
 * NO GLASS ROW. It is made in clear and nothing else, so there is no question to
 * ask; the fact rides in the tagline where a customer will actually read it
 * rather than as a control with one option. */
export const SEMI_SCREEN_HEIGHT_MM = 1950
export const SEMI_SCREEN_WIDTHS = [800, 850, 900, 1050, 1200, 1350]

/** 1050, for the same reason the frameless opens on 1100 — the middle of the
 * list and an ordinary opening, rather than the narrowest size it makes. It is
 * also the nearest size this range has to its sibling's default, so the two
 * cards open on the same shower rather than on two different ones. */
export const SEMI_SCREEN_DEFAULT_WIDTH_MM = 1050

/** ITS TWO FINISHES. Matt Black is the same powder coat the frameless range
 * carries and is taken from that list rather than retyped, so the two cannot
 * describe the same finish with two hexes.
 *
 * Bright Silver is Stegbar's name for this range's polished aluminium, and it is
 * the finish the frameless list calls Polished Silver. Same tint, different
 * name, and the NAME is what goes on the quote — so it is written out here under
 * the name this product is actually ordered in. Both hexes carry the same caveat
 * as the rest of SCREEN_FINISHES: the names are sourced, the values are an
 * approximation of a matte coat and a bright anodise. */
export const SEMI_SCREEN_FINISHES = [
  SCREEN_FINISHES.find(f => f.name === 'Matt Black')!,
  { name: 'Bright Silver', hex: '#D9DDE0' },
]

/** See AWNING_COLOURS. The housing, not the cloth. */
export const CASSETTE_COLOURS = [
  { name: 'White', hex: '#F2F1EE' },
  { name: 'Ivory', hex: '#E6E1D6' },
  { name: 'Charcoal', hex: '#45474A' },
  { name: 'Black', hex: '#232527' },
]

export const CATALOGUE: CatalogueItem[] = [
  // --- INDOOR --------------------------------------------------------------
  {
    id: 'roller-blinds',
    name: 'Roller Blinds',
    group: 'Indoor',
    tagline: 'Clean lines. Blockout, sunscreen, light filter and dual.',
    // THE ENQUIRY FORM, like every other card. It went to /products/dusk, the
    // one product page in the range — and that page is gone, because this card
    // now carries the configurator, the live price and Add to cart itself.
    //
    // Nothing is lost by pointing the picture at the enquiry form instead: the
    // buying path is the panel beside it, not this link, and the other eleven
    // cards have always worked exactly this way.
    to: enquire('Roller Blinds'),
    priceFrom: ROLLER_FROM,
    image: '/images/rooms/room-kitchen.png',
    imagePosition: 'center 34%',
    glyph: 'roller-blinds',
    colours: RYNAMIC_COLOURS,
    light: ['Blockout', 'Light filter', 'Sunscreen'],
    // Blockout of the four, because it is the one a roller blind is bought for.
    visualise: { category: 'blind', blindType: 'blockout' },
  },
  {
    id: 'honeycomb-blinds',
    name: 'Honeycomb Blinds',
    group: 'Indoor',
    tagline: 'Cellular pleats that trap air. The insulating blind.',
    to: enquire('Honeycomb Blinds'),
    glyph: 'honeycomb-blinds',
    image: '/images/shop/honeycomb-blockout.webp',
    // THE FABRIC BLINDS SHARE THE RYNAMIC CARD, and this is an editorial claim
    // in the same class as the light values above — worth a commercial check.
    //
    // The reasoning: Rynamic is the fabric range Klay already sells rollers in,
    // and a honeycomb is a fabric product cut from the same kind of cloth.
    // Saying it comes in nothing was the less accurate of the two available
    // claims.
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
    id: 'venetian-blinds',
    name: 'Venetian Blinds',
    group: 'Indoor',
    tagline: 'Horizontal slats that tilt. Aluminium, timber or faux.',
    to: enquire('Venetian Blinds'),
    glyph: 'venetian-blinds',
    // SOLD BY COLOUR. The slat material is a specification, not something a
    // customer browses — see SLAT_COLOURS.
    colours: SLAT_COLOURS,
    light: ['Blockout', 'Light filter'],
  },
  {
    id: 'plantation-shutters',
    name: 'Plantation Shutters',
    group: 'Indoor',
    tagline: 'Louvred joinery, fitted to the opening and built to last.',
    to: enquire('Plantation Shutters'),
    glyph: 'shutters',
    colours: SLAT_COLOURS,
    image: '/images/products/plantation-shutters.webp',
    light: ['Blockout', 'Light filter'],
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
    // SOLD IN ONE FABRIC, IN A CHOICE OF COLOURS — see AWNING_COLOURS.
    colours: AWNING_COLOURS,
    light: ['Sunscreen'],
  },
  {
    id: 'zip-guide-systems',
    name: 'Zip Guide Systems',
    group: 'Outdoor',
    tagline: 'Tracked edges. No gaps, no flap, no wind noise.',
    to: enquire('Zip Guide Systems'),
    glyph: 'screens',
    image: '/images/shop/zip-guide-alfresco.webp',
    // ONE MESH, IN A CHOICE OF COLOURS — see MESH_COLOURS.
    colours: MESH_COLOURS,
    light: ['Sunscreen'],
  },
  {
    id: 'roller-shutters',
    name: 'Roller Shutters',
    group: 'Outdoor',
    tagline: 'Insulation, security and total darkness in one slat.',
    to: enquire('Roller Shutters'),
    glyph: 'roller-shutters',
    image: '/images/shop/roller-shutters.webp',
    // ONE SLAT, IN A CHOICE OF COLOURS — see SHUTTER_COLOURS.
    colours: SHUTTER_COLOURS,
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
  // TWO WARDROBE CARDS, BECAUSE THERE ARE TWO RANGES. This card offers Forma 1,
  // 2 and 3, which are all `kind: 'built-in'` — and its name said "Wardrobes"
  // over a tagline promising "Built-in, walk-in and sliding". None of that was
  // true: there is no sliding unit in the range at all, and the three walk-in
  // models the visualiser has been drawing all along could not be ordered from
  // anywhere on the site. So the name says which range it is, the tagline says
  // what it actually does, and the walk-ins get the card below.
  {
    id: 'wardrobes',
    name: 'Built in wardrobes',
    group: 'Other',
    tagline: 'Fitted wall to wall, in the opening you already have.',
    to: enquire('Built in wardrobes'),
    image: '/images/shop/wardrobes-srdh.webp',
    imagePosition: 'center',
    glyph: 'wardrobes',
    // The four board finishes, from the visualiser's own list — see
    // WARDROBE_COLOURS. Restating them here is how the card and the render
    // start offering different boards.
    colours: WARDROBE_COLOURS.map(c => ({ name: c.name, hex: c.hex })),
    // The Forma range is modelled now, so this card carries the badge the two
    // window products have carried all along.
    visualise: { category: 'wardrobe' },
  },
  {
    id: 'shaker-framed-sliding-doors',
    name: 'Framed Sliding Wardrobe Doors',
    group: 'Other',
    tagline: 'White aluminium frames with Surf vinyl, mirror or a mix of both.',
    to: enquire('Framed Sliding Wardrobe Doors'),
    glyph: 'wardrobes',
    colours: FRAMED_DOOR_MATERIALS,
  },
  {
    id: 'shaker-sliding-doors',
    name: 'Shaker Sliding Wardrobe Doors',
    group: 'Other',
    tagline: 'Classic recessed timber panels, with the option of a mirror.',
    to: enquire('Shaker Sliding Wardrobe Doors'),
    glyph: 'wardrobes',
    colours: SHAKER_DOOR_MATERIALS,
  },
  {
    id: 'walk-in-wardrobes',
    name: 'Walk in wardrobes',
    group: 'Other',
    // A ROOM, NOT A CUPBOARD, and that is the whole difference from the card
    // above. A built-in is fitted into an opening in a bedroom wall; a walk-in
    // is the run of joinery around the inside of its own small room, in an L or
    // a U. Signature LS01 is Forma 4; US01 is Forma 5.
    tagline: 'An L or a U of joinery, around a room of its own.',
    to: enquire('Walk in wardrobes'),
    glyph: 'wardrobes',
    colours: WALK_IN_COLOURS,
  },
  {
    id: 'shelving',
    name: 'Shelving',
    group: 'Other',
    // WHAT THE RANGE ACTUALLY IS. This read "Open shelving, drawers and racks,
    // made to the room", which described the three invented options the card
    // used to offer rather than anything Klay makes. The range is the Forma
    // linen shelving — four codes, four 447mm shelves apiece, 1650 high, some
    // with a face post to span the wide ones. No drawers and no racks.
    tagline: 'Linen shelving in four fixed shelves, made to the opening.',
    to: enquire('Shelving'),
    // The default linen layout; each model has its own photograph on the shop.
    image: '/images/shop/shelving-lin01.webp',
    imagePosition: 'center',
    glyph: 'shelving',
    // The same four board finishes the robes are made in and the same list the
    // renderer paints them with — the linen shelving is the same cabinetry in a
    // different box, so offering it a different set of boards would be a
    // colour a customer picks here and cannot have.
    colours: WARDROBE_COLOURS.map(c => ({ name: c.name, hex: c.hex })),
  },
  {
    id: 'frameless-shower-screens',
    name: 'Fixed frameless showerscreen',
    group: 'Other',
    tagline: 'Toughened glass, no frame. The bathroom disappears.',
    to: enquire('Fixed frameless showerscreen'),
    glyph: 'shower-screens',
    image: '/images/shop/shower-screen-clip.webp',
  },
  {
    id: 'radius-corner-fixed-frameless',
    name: 'Radius corner fixed frameless showerscreen',
    group: 'Other',
    tagline: 'A softly rounded corner, in clear or reeded glass.',
    to: enquire('Radius corner fixed frameless showerscreen'),
    glyph: 'shower-screens',
    image: '/images/shop/shower-radius-clip-clear.webp',
  },
  {
    id: 'semi-frameless-front-only',
    name: 'Semi-frameless (Front only) showerscreen',
    group: 'Other',
    // The tagline carries the two facts that are NOT choices on this card: the
    // glass, which comes in clear and nothing else, and the telescopic frame,
    // which is the reason the product exists. See SEMI_SCREEN_HEIGHT_MM.
    tagline: 'A framed, telescopic front panel. 6mm clear toughened glass.',
    to: enquire('Semi-frameless (Front only) showerscreen'),
    image: '/images/shop/shower-semi-front-only.webp',
    glyph: 'shower-screens',
  },
  {
    id: 'semi-frameless-front-return',
    name: 'Semi frameless (Front and Return) showerscreen',
    group: 'Other',
    tagline: 'A clear glass corner enclosure with a slim perimeter frame.',
    to: enquire('Semi frameless (Front and Return) showerscreen'),
    image: '/images/shop/shower-semi-frameless.webp',
    glyph: 'shower-screens',
  },
  // THE TWO MIRRORS, NAMED AS A PAIR. They were "Mirrors without frames" and
  // "Mirror with Frame" — one plural and one singular, one describing itself in
  // three words and the other in three different ones, so the shop listed them
  // as if they were unrelated products. They are the same product with and
  // without a frame, and the names now say that: the noun first, the one thing
  // that differs second, which is also what sorts them together in a list.
  //
  // THE IDS DELIBERATELY DO NOT FOLLOW. `mirrors-without-frames` and
  // `mirror-with-frame` are keys, not copy — they address SHOP_PHOTOS,
  // PRODUCT_OPTIONS and tools/verify-mirror-photo, and they are baked into the
  // line ids of any cart already in a customer's browser. Renaming them buys a
  // tidier grep and costs a silent cart migration, so the display name is what
  // changed.
  {
    id: 'mirrors-without-frames',
    name: 'Mirrors Frameless',
    group: 'Other',
    tagline: 'Polished edges and sculptural shapes, with a size for your space.',
    to: enquire('Mirrors Frameless'),
    image: '/images/shop/mirrors-quiet.webp',
  },
  {
    id: 'mirror-with-frame',
    name: 'Mirrors Framed',
    group: 'Other',
    tagline: 'A refined frame in white, golden or black.',
    to: enquire('Mirrors Framed'),
    image: '/images/shop/mirrors-quiet.webp',
  },
  {
    id: 'mirrors-with-cabinets',
    name: 'Mirrors with Cabinets',
    group: 'Other',
    tagline: 'Hidden storage behind a shaped mirror, with a white cabinet.',
    to: enquire('Mirrors with Cabinets'),
    image: '/images/shop/mirrors-cabinets-open.webp',
  },
]
