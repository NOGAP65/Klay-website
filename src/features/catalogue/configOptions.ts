// ---------------------------------------------------------------------------
// WHAT EACH PRODUCT LETS YOU CHOOSE — the card configurator's data.
//
// Every product in the catalogue gets a panel of choices sitting directly under
// its photograph in the homepage range row, and this file is what that panel is
// built from. One table, so the twelve panels cannot drift into twelve
// different vocabularies.
//
// FIVE SLOTS, AND NO MORE. A configured line has to survive as a cart line, and
// the cart's line carries exactly five configurable fields — see features/cart.
// So the panel offers at most five, and each maps onto one of them:
//
//     variant   → blindType        the choice that changes what the product IS
//     colour    → fabricColour     the colour card, where one exists
//     hardware  → hardwareColour   the visible metalwork
//     size      → windowSize       the pricing band
//     operation → operation        how the thing is worked
//
// Holding to that is what keeps the panel honest: anything a customer picks
// here reaches the cart, the quote and the installer. A sixth control would be
// a choice the site collects and then loses.
//
// VARIANT IS NOT ALWAYS LIGHT CONTROL, which is why it is not called that. It
// is whichever choice is the first real question about a given product: light
// control on a roller, the layout code on the linen shelving, panel layout on a
// shower screen. Each product names its own, and the label is what the customer
// reads. Several have none at all — a venetian is a venetian, and a roller
// shutter comes in one slat — and no question is better than a question whose
// answer changes nothing.
//
// EDITORIAL — READ THIS BEFORE TRUSTING IT. The choice lists below describe how
// these products are ordinarily specified in the trade; they are not read off a
// Klay price list, because there is no price list in the repo for anything but
// the roller range. They are the right shape and they are the wrong place to
// leave unchecked — this table is the ONE place to correct them, and correcting
// them changes the panel, the cart line and the quote together.
//
// THE JOINERY IS THE EXCEPTION and needs no such check. The wardrobe and the
// shelving read their models, widths, boards and handles out of the visualiser,
// which was built off the supplier's own deck — so those two are the only
// entries here that are sourced rather than reasoned, and the way to change them
// is to change the deck they came from, not this file.
// ---------------------------------------------------------------------------

import { HARDWARE_OPTIONS } from '../../data/products'
import {
  HANDLE_FINISHES,
  modelsOfKind,
  SHELVING_WIDTHS,
  WALKIN_WIDTHS,
  WARDROBE_WIDTHS,
  wardrobeModelById,
} from '@/features/visualiser'
import { pricePerBlind, isBlindType, isWindowSize, isOperation } from '../../lib/pricing'


import {
  CASSETTE_COLOURS,
  SCREEN_CHANNEL_FINISHES,
  SCREEN_CLIP_FINISHES,
  SCREEN_DEFAULT_WIDTH_MM,
  SCREEN_HEIGHT_MM,
  SCREEN_WIDTHS,
  SEMI_SCREEN_DEFAULT_WIDTH_MM,
  SEMI_SCREEN_FINISHES,
  SEMI_SCREEN_HEIGHT_MM,
  SEMI_SCREEN_WIDTHS,
  type CatalogueItem,
} from './constants'
import type { CartItem } from '@/features/cart'
import { FRONT_RETURN_SIZES, frontReturnSizeLabel } from './lib/semiScreenPhoto'
import { slidingOpenings, defaultSlidingOpening, SLIDING_METAL_COLOURS, type SlidingDoorStyle } from './lib/slidingDoors'
import { mirrorShapes, mirrorDimensions, MIRROR_FRAME_COLOURS } from './lib/mirrorPhoto'
import { CABINET_MIRROR_SHAPES, cabinetMirrorSpecifications } from './lib/cabinetMirror'

// SEVEN SLOTS NOW, AND THE TWO NEW ONES ARE NOT WINDOW FIELDS.
//
// The header above describes five, each mapping onto one of the cart's fixed
// columns. Joinery needed two more — a wardrobe's width is a real dimension in
// millimetres, not a small/medium/large band, and its handle profile is a
// choice no window product has — and the honest way to add them was to add
// them. The alternative was reusing "size" for width and "operation" for the
// pull, which would have put "operation: bar" on a quote.
//
// They cost nothing downstream because configuredLine already lists EVERY field
// in `options`, which is the free-form part of a cart line built for exactly
// this: 'a wardrobe has no window size and a shower screen has no operation'.
// Only the four ids below have a fixed column; these two ride in options and in
// the line id, so two differently-configured wardrobes stay two lines.
export type FieldId =
  | 'variant' | 'colour' | 'hardware' | 'size' | 'operation'
  | 'width'
  | 'dimension'
  | 'glass'
  // Where the thing is going. Not a property of the product — a property of the
  // job — and 'locationOther' is the free text behind the Other choice, which is
  // a stored answer rather than a field: fieldsFor never emits it, and it rides
  // in options and the line id like the two above.
  | 'location' | 'locationOther'

export interface ConfigChoice {
  /** Stable id. For the roller's variant these ARE the pricing blind types, so
   * the selection can be priced without a second mapping. */
  id: string
  label: string
  /** Swatch fill, for a colour field. */
  hex?: string
  /** Which heading this choice sits under in a dropdown. Optional, and only the
   * location list uses it: seventeen rooms in one flat run is a scroll, and the
   * customer knows which KIND of room they came for before they know its
   * number. Choices stay a flat array — every lookup in this file and every
   * chip renderer walks them unchanged — and the grouping is applied at render
   * by `groupedChoices`, so a field that sets no group behaves as it always
   * did. */
  group?: string
}

export interface ConfigField {
  id: FieldId
  /** What the customer reads above the control. */
  label: string
  /** 'select' is a dropdown. It exists for the same reason the visualiser's
   * width control is one: a run of values on a scale is not a set of things to
   * compare, and six near-identical chips spend the panel's widest rows saying
   * so. Everything else stays chips or swatches. */
  kind: 'chips' | 'swatches' | 'select'
  choices: ConfigChoice[]
  /** The choice this row opens on, where the first is not the right answer.
   *
   * Absent everywhere but the shower panel's width — see defaultWidth. It is on
   * the FIELD rather than read out of the options table by defaultSelection so
   * that the one place a default is decided is the one place the choices are
   * built, and a row whose list narrows cannot end up defaulting to a size it
   * no longer offers. */
  defaultChoice?: string
  /** LAY THE CHOICES OUT, however many there are — the dense card's default is
   * to collapse anything past four into a dropdown.
   *
   * For a field whose options are the information rather than a summary of it,
   * the same argument the colour swatches win on: see the note on `listed` in
   * RangeConfigurator's DenseField. A mirror's shape row is the one that asks
   * for it, and it asks on both mirror cards rather than on the longer one, so
   * the two stop agreeing by coincidence of length. */
  listed?: boolean
}

/** The three window-size bands the pricing works in — see lib/pricing. Shown
 * with the wording a customer can answer without a tape measure; the exact
 * drop is taken at the measure appointment either way. */
const SIZE_CHOICES: ConfigChoice[] = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
]

/** WHERE IT IS GOING. One list for the whole range, because the question is
 * about the room and not the product: a roller, a shutter and a wardrobe are all
 * going into somebody's bedroom or somebody's garage.
 *
 * NUMBERED, BECAUSE A HOUSE HAS MORE THAN ONE BEDROOM. This used to be seven
 * rooms and an Other, one entry per kind of room, and it broke on the ordinary
 * case: a customer doing the whole house adds five lines that all read
 * "Location: Bedroom", and by the time the list reaches the workshop nobody can
 * say which blind belongs to which window. The cart is worse than unhelpful
 * there — two identical bedrooms configured identically collapse into one line
 * of quantity two, because the line id is built from the selection and their
 * selections match. Numbering them makes each room its own answer, so five
 * bedrooms stay five lines and each one is addressed.
 *
 * The counts are the ones a project home actually comes in: a master plus five,
 * two living areas, three bathrooms. Past that it is a big house, and a big
 * house has an Other.
 *
 * Kitchen, dining, study and outdoor stay singular — a house has one of each,
 * and "Kitchen 1" would be a form asking a question nobody has.
 *
 * OTHER STAYS, and matters more now, not less. A list this specific is more
 * tempting to force an answer out of, and a customer with a garage, a caravan or
 * a shopfront would pick the nearest wrong room — worse than no answer, because
 * it reads as one. Other opens a text box; see the note in RangeConfigurator's
 * Field. */
const LOCATION_CHOICES: ConfigChoice[] = [
  { id: 'master-bedroom', label: 'Master bedroom', group: 'Bedrooms' },
  { id: 'bedroom-1', label: 'Bedroom 1', group: 'Bedrooms' },
  { id: 'bedroom-2', label: 'Bedroom 2', group: 'Bedrooms' },
  { id: 'bedroom-3', label: 'Bedroom 3', group: 'Bedrooms' },
  { id: 'bedroom-4', label: 'Bedroom 4', group: 'Bedrooms' },
  { id: 'bedroom-5', label: 'Bedroom 5', group: 'Bedrooms' },
  { id: 'living-1', label: 'Living room 1', group: 'Living areas' },
  { id: 'living-2', label: 'Living room 2', group: 'Living areas' },
  { id: 'rumpus', label: 'Rumpus', group: 'Living areas' },
  { id: 'kitchen', label: 'Kitchen', group: 'Living areas' },
  { id: 'dining', label: 'Dining', group: 'Living areas' },
  { id: 'study', label: 'Study', group: 'Living areas' },
  { id: 'bathroom-1', label: 'Bathroom 1', group: 'Bathrooms' },
  { id: 'bathroom-2', label: 'Bathroom 2', group: 'Bathrooms' },
  { id: 'bathroom-3', label: 'Bathroom 3', group: 'Bathrooms' },
  { id: 'outdoor', label: 'Outdoor', group: 'Elsewhere' },
  { id: 'other', label: 'Other', group: 'Elsewhere' },
]

/** WHERE A SHOWER SCREEN GOES, and the answer is a bathroom.
 *
 * The list above is right for anything that hangs in a window, and wrong for
 * this: a fixed glass panel goes in a wet area, so offering it a kitchen, a
 * rumpus or an outdoor is offering seventeen rooms to answer a question with
 * five possible answers. Narrowing it is the difference between a row the
 * customer scrolls and a row they answer.
 *
 * FIVE, WHERE THE SHARED LIST STOPS AT THREE. That is a deliberate difference
 * and not a drift: the general list is the one Bobby specified and it runs to
 * three bathrooms, and a screen is quoted per wet area in a house that may have
 * more of them than it has blinds. Worth reconciling if the two ever need to
 * agree — flagged rather than silently unified, because raising the shared list
 * to five would change every other card too.
 *
 * NO OTHER, AND NO GROUP HEADINGS. Five entries of one kind are a list, not
 * four runs of one, and a heading reading Bathrooms over five bathrooms is a
 * label for the whole control. Other is left off because it is not a screen's
 * escape hatch — there is nowhere else a shower screen goes. */
const SCREEN_LOCATION_CHOICES: ConfigChoice[] = [
  { id: 'bathroom-1', label: 'Bathroom 1' },
  { id: 'bathroom-2', label: 'Bathroom 2' },
  { id: 'bathroom-3', label: 'Bathroom 3' },
  { id: 'bathroom-4', label: 'Bathroom 4' },
  { id: 'bathroom-5', label: 'Bathroom 5' },
]

/** WHERE A ZIP SCREEN GOES — the two outdoor rooms it is bought for.
 *
 * Same reasoning as the screens above, in the other direction: a zip system is
 * the thing you close in an alfresco or an entertaining area, and the shared
 * list's one "Outdoor" cannot tell two of them apart. A house with an alfresco
 * off the kitchen and a separate entertaining area is two jobs, and on one
 * "Outdoor" they collapse into a single cart line — the same failure the
 * numbered bedrooms fixed indoors.
 *
 * Grouped, because these ARE two kinds of place rather than one run of eight. */
const ZIP_LOCATION_CHOICES: ConfigChoice[] = [
  { id: 'alfresco-1', label: 'Alfresco 1', group: 'Alfresco' },
  { id: 'alfresco-2', label: 'Alfresco 2', group: 'Alfresco' },
  { id: 'alfresco-3', label: 'Alfresco 3', group: 'Alfresco' },
  { id: 'alfresco-4', label: 'Alfresco 4', group: 'Alfresco' },
  { id: 'entertainment-1', label: 'Entertainment area 1', group: 'Entertainment areas' },
  { id: 'entertainment-2', label: 'Entertainment area 2', group: 'Entertainment areas' },
  { id: 'entertainment-3', label: 'Entertainment area 3', group: 'Entertainment areas' },
  { id: 'entertainment-4', label: 'Entertainment area 4', group: 'Entertainment areas' },
]

/** A choice list broken into its dropdown headings, in the order the choices
 * were declared.
 *
 * Returns one run per heading rather than a map, so the declaration order is the
 * display order and a group cannot be split in two by a stray entry — if the
 * list ever interleaves, the render shows it rather than silently reordering.
 * A list with no groups comes back as a single unlabelled run, which is the
 * ungrouped select exactly as it was. */
export const groupedChoices = (
  choices: ConfigChoice[],
): { group?: string; choices: ConfigChoice[] }[] => {
  const runs: { group?: string; choices: ConfigChoice[] }[] = []
  for (const c of choices) {
    const last = runs[runs.length - 1]
    if (last && last.group === c.group) last.choices.push(c)
    else runs.push({ group: c.group, choices: [c] })
  }
  return runs
}

const OPERATION_CHOICES: ConfigChoice[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'motorised', label: 'Motorised' },
]

/** HOW A ROLLER SHUTTER IS WOUND, which is not manual-or-motorised.
 *
 * Every other product in the range either has a chain or has a motor, and
 * "Manual / Motorised" says that exactly. A shutter is asked differently on the
 * quote, because both of its answers are things you can see and one of them is
 * hung off the wall: a crank is a removable winder through the architrave, and a
 * battery tube motor is a charged unit with no cable to run and no sparky to
 * book. That last part is why the question is worth asking on the card at all —
 * the answer changes who has to come to the house.
 *
 * These ride the same `operation` field, so the two ids are mapped onto the
 * cart's fixed manual/motorised column rather than stored raw. See
 * configuredLine. */
const SHUTTER_OPERATION_CHOICES: ConfigChoice[] = [
  { id: 'crank', label: 'Crank' },
  { id: 'battery', label: 'Battery' },
]

/** THE FIXED COLUMN'S ANSWER FOR A CHOICE THAT IS NOT ITS OWN.
 *
 * The cart line carries `operation: 'manual' | 'motorised'` — pricing's own
 * type, and the roller range's price depends on it. A shutter answers crank or
 * battery, so something has to say which of the two columns those land in, and
 * the honest reading is the mechanical one: a crank is turned by hand, a battery
 * tube motor is a motor. Left unmapped they both failed `isOperation` and fell
 * through to 'manual', which quietly filed every battery shutter as hand-wound.
 *
 * The label the customer picked is printed from `options` regardless — this is
 * only the fixed column, which exists so the quote can be scoped by something. */
const OPERATION_COLUMN: Record<string, 'manual' | 'motorised'> = {
  crank: 'manual',
  battery: 'motorised',
}

const HARDWARE_CHOICES: ConfigChoice[] = HARDWARE_OPTIONS.map(o => ({ id: o.id, label: o.label }))

interface ProductOptions {
  /** Fixed specifications shown on the quote without asking for another choice. */
  specificationsOfVariant?: (variantId?: string) => { label: string; value: string }[]
  /** Paired dimensions vary with mirror shape and travel together into the quote. */
  dimensionsOfVariant?: (variantId: string | undefined) => ConfigChoice[]
  dimensionsLabel?: string
  defaultDimensionOfVariant?: (variantId: string | undefined) => string
  /** A glass choice precedes the existing fields only on products offering it. */
  glassChoices?: ConfigChoice[]
  /** WHERE THIS PRODUCT GOES, where the whole-house list is the wrong list.
   *
   * Nearly everything Klay makes hangs in a window and can hang in any room, so
   * nearly everything uses LOCATION_CHOICES. Two products do not: a shower
   * screen goes in a bathroom and a zip system goes in an outdoor room, and
   * offering either of them seventeen rooms is offering sixteen wrong answers.
   *
   * Absent means the shared list, which is the case for ten of the twelve. */
  locationChoices?: ConfigChoice[]
  /** The first real question about this product, and what to call it.
   *
   * BOTH OPTIONAL, because some products do not have one. A venetian is a
   * venetian: the slat material was a question the photography could not answer
   * and the product does not actually pose. A question whose answer changes
   * nothing is worse than no question — it asks the customer to decide and then
   * ignores them. */
  variantLabel?: string
  variants?: ConfigChoice[]
  /** Show every variant on the dense card rather than collapsing past four into
   * a dropdown. Set where the variant is a THING the customer is comparing
   * rather than a word summarising itself — a mirror's shape. See `listed` on
   * ConfigField. */
  variantsListed?: boolean
  /** Offered only where there is visible metalwork to choose — a track, a
   * headrail, a frame. A wardrobe's hinges are not a decision made on a card. */
  hardware?: boolean
  /** Priced products need it; everything else uses it to scope the quote. Left
   * off where the product is not sold by window band at all. */
  size?: boolean
  operation?: boolean
  /** Overrides Manual / Motorised where a product is not wound either way. A
   * roller shutter is cranked or battery-driven; see
   * SHUTTER_OPERATION_CHOICES. */
  operationChoices?: ConfigChoice[]
  /** What the colour card is called for this product, where the catalogue item
   * carries one. */
  colourLabel?: string
  colourKind?: 'swatches' | 'select'
  /** Overrides the blind hardware list. A wardrobe's visible metalwork is a
   * handle in one of the supplier's six finishes, not a blind's white / black /
   * chrome headrail. */
  hardwareLabel?: string
  hardwareChoices?: ConfigChoice[]
  /** THE CHOSEN VARIANT'S OWN FINISHES, where the range does not offer one list
   * across all of them. A shower screen's clip fixing carries gunmetal and its
   * channel fixing does not, so the swatch row has to narrow with the mounting
   * — otherwise the card offers a finish that cannot be ordered in the thing
   * just chosen. Falls back to `hardwareChoices`; see widthsOfVariant, which is
   * the same shape for the same reason. */
  hardwareChoicesOfVariant?: (variantId: string | undefined) => ConfigChoice[] | undefined
  /** Asks for the metalwork BEFORE the cloth, which is the order an awning is
   * decided in: the cassette is bolted to the house and the fabric goes inside
   * it. Everywhere else the cloth is the product and its frame is a trim on it,
   * so the cloth leads. */
  hardwareFirst?: boolean
  /** Real widths in millimetres, for a product built to an opening rather than
   * sold in bands. Mutually exclusive with `size` in practice: a thing has one
   * or the other, never both. */
  widths?: number[]
  /** THE CHOSEN MODEL'S OWN WIDTHS, where the range is not made in one set.
   *
   * The linen shelving is the case that forces this: its four codes have
   * deliberately non-overlapping widths — LIN01 is the narrow pair, LIN05 the
   * four wide ones — so the union of them offers Linen 1 at 3600mm, which is
   * not a product. It is a different code. Narrowing to the answer that has
   * already been given is the only way the width row can only offer real SKUs.
   *
   * Falls back to `widths` when no model is chosen yet, which is what
   * defaultSelection's first pass sees. */
  widthsOfVariant?: (variantId: string | undefined) => number[] | undefined
  /** What the width row is called, where "Width" undersells it. A shower panel
   * is ordered as a pair of dimensions, so its row says Dimensions. */
  widthLabel?: string
  /** How one width reads on the row and on the quote. Defaults to "1200mm". */
  widthFormat?: (mm: number) => string
  /** THE WIDTH THE CARD OPENS ON, where the narrowest is the wrong answer.
   *
   * Absent means the first in the list, which is what every other row does and
   * is right for a scale of equals. A shower panel is not one: its narrowest
   * size is the exception rather than the middle, so it names its own. See
   * SCREEN_DEFAULT_WIDTH_MM.
   *
   * Ignored where the chosen model is not made in it — reconcile has the last
   * word, so this cannot put an unorderable size on a card. */
  defaultWidth?: number
}

const v = (id: string, label: string): ConfigChoice => ({ id, label })

// Both fixed-panel shapes share these existing controls and dimensions.
const FIXED_SCREEN_OPTIONS: ProductOptions = {
  locationChoices: SCREEN_LOCATION_CHOICES,
  variantLabel: 'Fixed',
  variants: [v('clip', 'Clip fixed'), v('channel', 'Channel fixed')],
  hardwareLabel: 'Hardware colour',
  hardwareFirst: true,
  hardwareChoicesOfVariant: id =>
    (id === 'channel' ? SCREEN_CHANNEL_FINISHES : SCREEN_CLIP_FINISHES).map(f => ({
      id: f.name, label: f.name, hex: f.hex,
    })),
  widths: SCREEN_WIDTHS,
  widthLabel: 'Dimensions',
  widthFormat: w => `${SCREEN_HEIGHT_MM} × ${w}`,
  // 1100, not the 700 off the front of the list — see SCREEN_DEFAULT_WIDTH_MM.
  // Set here rather than on either product, so both fixed-panel shapes open on
  // the same size and cannot drift apart.
  defaultWidth: SCREEN_DEFAULT_WIDTH_MM,
}

/** THE SEMI-FRAMED FRONT-ONLY SCREEN. Same card as the fixed frameless above —
 * a bathroom, a colour, a size — off its own numbers. See SEMI_SCREEN_HEIGHT_MM
 * in constants for where those come from.
 *
 * TWO ROWS OF THE FRAMELESS CARD ARE NOT HERE, and both absences are the point.
 *
 * NO GLASS ROW: it is made in 6mm clear and nothing else, so there is nothing to
 * ask. The radius-corner screen has that row because it genuinely offers clear
 * or narrow-reeded; a row with one option is a question whose answer changes
 * nothing, which the header of this file argues is worse than no question.
 *
 * AND NO CLIP-OR-CHANNEL ROW, which is the one judgement call in this entry. A
 * clip and a channel are the two ways to hold a FRAMELESS pane — the whole
 * choice is about what does the holding when there is no frame. This screen has
 * a frame; that is what the word semi-framed means, and Stegbar's front-only
 * page offers no mounting choice at all, only a finish and a size. Carrying the
 * row over would have been duplicating the shape of the sibling card past the
 * point where it describes the product.
 *
 * So the finish is a plain `hardwareChoices` rather than the frameless card's
 * `hardwareChoicesOfVariant`: with no variant to vary by, the two finishes are
 * simply the two finishes. */
const SEMI_SCREEN_OPTIONS: ProductOptions = {
  locationChoices: SCREEN_LOCATION_CHOICES,
  hardwareLabel: 'Hardware colour',
  hardwareFirst: true,
  hardwareChoices: SEMI_SCREEN_FINISHES.map(f => ({ id: f.name, label: f.name, hex: f.hex })),
  widths: SEMI_SCREEN_WIDTHS,
  widthLabel: 'Dimensions',
  widthFormat: w => `${SEMI_SCREEN_HEIGHT_MM} × ${w}`,
  defaultWidth: SEMI_SCREEN_DEFAULT_WIDTH_MM,
}

// Mirror combinations are materials; names distinguish them from the solid panels.
const slidingOptions = (style: SlidingDoorStyle): ProductOptions => ({
  variantLabel: 'Doors',
  variants: [v('two', 'Two doors'), v('three', 'Three doors')],
  colourLabel: 'Door material & colour',
  colourKind: 'select',
  hardwareLabel: 'Hardware colour',
  hardwareChoices: style === 'shaker'
    ? SLIDING_METAL_COLOURS.map(c => ({ id: c.name, label: c.name, hex: c.hex }))
    : [{ id: 'White', label: 'White', hex: '#FDFDFD' }],
  dimensionsLabel: style === 'framed' ? 'Dimensions (H × W)' : 'Opening size range (H × W)',
  dimensionsOfVariant: panels => slidingOpenings(style, panels),
  defaultDimensionOfVariant: panels => defaultSlidingOpening(style, panels),
})

const PRODUCT_OPTIONS: Record<string, ProductOptions> = {
  'shaker-framed-sliding-doors': slidingOptions('framed'),
  'shaker-sliding-doors': slidingOptions('shaker'),
  // BOTH MIRRORS SHOW EVERY SHAPE. They ask the same question and they used to
  // answer it with two different controls: framed comes in three shapes so it
  // drew chips, frameless comes in six so it fell past the dense card's
  // four-choice cap and collapsed into a dropdown. The two agreed only while
  // both lists happened to be short, which is not agreement.
  //
  // Chips is the right side of that to land on, for the reason the colour card
  // is always shown: a shape is a thing being compared, not a word summarising
  // itself. `variantsListed` is set on BOTH so the pair is explicit rather than
  // coincidental — the framed card renders identically either way today, and
  // stops depending on staying under four shapes tomorrow.
  'mirrors-without-frames': {
    variantLabel: 'Shape',
    variants: mirrorShapes(false).map(s => v(s.id, s.label)),
    variantsListed: true,
    dimensionsOfVariant: shape => mirrorDimensions(false, shape),
  },
  'mirror-with-frame': {
    variantLabel: 'Shape',
    variants: mirrorShapes(true).map(s => v(s.id, s.label)),
    variantsListed: true,
    dimensionsOfVariant: shape => mirrorDimensions(true, shape),
    hardwareLabel: 'Frame colour',
    hardwareChoices: MIRROR_FRAME_COLOURS,
  },
  'mirrors-with-cabinets': {
    variantLabel: 'Shape',
    variants: CABINET_MIRROR_SHAPES.map(s => v(s.id, s.label)),
    variantsListed: true,
    specificationsOfVariant: cabinetMirrorSpecifications,
  },
  // --- INDOOR --------------------------------------------------------------
  // The one priced product. Its variant ids are the four pricing blind types
  // verbatim, which is what lets the panel show a live price — see priceFor.
  'roller-blinds': {
    variantLabel: 'Fabric type',
    variants: [
      v('blockout', 'Blockout'),
      v('lightfilter', 'Light filter'),
      v('sunscreen', 'Sunscreen'),
      v('dual', 'Dual'),
    ],
    hardware: true,
    size: true,
    operation: true,
    colourLabel: 'Fabric colour',
  },
  // TWO FABRICS, AND THE SECOND IS A DIFFERENT KIND OF THING FROM THE FIRST. It
  // carried "Blockout / Light filter", which is one cell in two densities. What
  // Klay sells is a blockout, and a DAY & NIGHT — one headrail carrying both a
  // light-filtering cell and a blockout cell, so the same window can be softened
  // in the afternoon and closed at night without a second blind. That is the
  // product a customer is choosing between, not a shade of translucency.
  'honeycomb-blinds': {
    variantLabel: 'Fabric type',
    variants: [v('blockout', 'Blockout'), v('daynight', 'Day & Night')],
    size: true,
    operation: true,
  },
  // NO MATERIAL ROW: A VENETIAN IS SOLD BY COLOUR. It carried
  // Aluminium / Timber / Faux, which is a substrate rather than a choice a
  // customer browses — and it was standing in for the colour card the product
  // should always have had. It has one now; see SLAT_COLOURS.
  'venetian-blinds': {
    size: true,
    operation: true,
    colourLabel: 'Slat colour',
  },
  // OPERATION IS BACK ON THE SHUTTER. It came off with the material row, on the
  // reasoning that a shutter is joinery and joinery has no operation. But a
  // louvre either tilts by hand or it tilts on a motor, and that is a real
  // question with a real price behind it. The card now asks the same three
  // things a venetian does, less the material a shutter never posed.
  'plantation-shutters': {
    size: true,
    operation: true,
    colourLabel: 'Louvre colour',
  },
  curtains: {
    variantLabel: 'Fabric',
    // Two, not three. There is a photograph of a sheer and a photograph of a
    // blockout; there is no light filter, so it is not offered.
    variants: [v('sheer', 'Sheer'), v('blockout', 'Blockout')],
    hardware: true,
    size: true,
    operation: true,
    colourLabel: 'Fabric colour',
  },

  // --- OUTDOOR -------------------------------------------------------------
  // TWO QUESTIONS, AND BOTH ARE COLOURS. It carried "Cover: Acrylic canvas /
  // Shade mesh" over a window size and an operation, and only the first of those
  // was wrong in an interesting way: the awning comes in acrylic, full stop, so
  // the row was offering a range Klay does not make. The size and the operation
  // went with it because an awning is measured to the opening on the visit and
  // every one of them is motorised — neither is a decision taken on a card.
  //
  // Cassette before cloth: the cassette is bolted to the house and the fabric
  // goes inside it. See AWNING_COLOURS.
  'folding-arm-awnings': {
    hardwareLabel: 'Cassette colour',
    hardwareChoices: CASSETTE_COLOURS.map(c => ({ id: c.name, label: c.name, hex: c.hex })),
    hardwareFirst: true,
    colourLabel: 'Fabric colour',
  },
  // NO SCREEN ROW: A ZIP SYSTEM IS SOLD IN ONE MESH. It carried "Sunscreen mesh
  // / Blockout PVC", which is two products behind one name, and Klay makes the
  // first. The colour is the choice — see MESH_COLOURS.
  // AN ALFRESCO OR AN ENTERTAINMENT AREA, and never a bedroom. A zip system is
  // the thing you close in an outdoor room, and the shared list's single
  // "Outdoor" could not tell two of them apart — see ZIP_LOCATION_CHOICES.
  'zip-guide-systems': {
    locationChoices: ZIP_LOCATION_CHOICES,
    size: true,
    operation: true,
    colourLabel: 'Mesh colour',
  },
  // THREE QUESTIONS: COLOUR, SIZE, AND HOW IT IS WOUND.
  //
  // The slat row is gone. It offered "Aluminium / Insulated", which reads as a
  // choice between a plain shutter and an upgraded one, and it is not: the slat
  // Klay hangs is a foam-filled aluminium extrusion, so both words describe the
  // same product and one of them was implying a cheaper version that does not
  // exist. What a customer chooses on a shutter is the colour — see
  // SHUTTER_COLOURS on why that choice does more work here than anywhere else in
  // the range.
  //
  // And the operation is asked in the shutter's own words rather than the
  // range's: crank or battery, not manual or motorised. See
  // SHUTTER_OPERATION_CHOICES.
  'roller-shutters': {
    size: true,
    operation: true,
    operationChoices: SHUTTER_OPERATION_CHOICES,
    colourLabel: 'Colour',
  },
  'pleated-flyscreens': {
    variantLabel: 'Mesh',
    variants: [v('standard', 'Standard'), v('pet', 'Pet resistant')],
    size: true,
  },

  // --- OTHER ---------------------------------------------------------------
  // No size band on any of these: they are built to an opening rather than
  // sold in small/medium/large, so offering a band would be a question with no
  // right answer.
  // THE FORMA RANGE, and every list here is imported rather than retyped —
  // the models, the board finishes, the widths and the handles all come from
  // the visualiser's own modules, so the card and the 3D view cannot drift into
  // offering different products. Sliding is gone from the variants because
  // nothing in the range is a sliding unit; it was describing the category
  // rather than anything orderable.
  wardrobes: {
    variantLabel: 'Model',
    variants: modelsOfKind('built-in').map(m => v(m.id, m.name)),
    colourLabel: 'Colour',
    widths: WARDROBE_WIDTHS,
    // The chosen SKU's own list, the way the visualiser asks it. See
    // widthsOfVariant.
    widthsOfVariant: id => (id ? wardrobeModelById(id).widths : undefined),
    hardwareLabel: 'Handle finish',
    hardwareChoices: HANDLE_FINISHES.map(f => ({ id: f.name, label: f.name, hex: f.hex })),
  },
  // THE WALK-INS, WHICH THE SHOP COULD NOT REACH UNTIL NOW. The visualiser has
  // been drawing Forma 4, 5 and 6 the whole time — modelsOfKind('walk-in') —
  // and no card offered them, so three products Klay makes were unorderable.
  //
  // THE SAME FOUR QUESTIONS AS THE BUILT-INS, off the walk-in lists: which
  // model, what board, how wide, which handle. It asks them identically because
  // it is the same cabinetry in a different shape, and the one thing that must
  // not be shared is the width list — Forma 4 is made in 2400 and 3000 while 5
  // and 6 are 2400 only, so the union offers each of the latter two a size it
  // does not come in. Hence the same widthsOfVariant narrowing as above.
  'walk-in-wardrobes': {
    variantLabel: 'Model',
    variants: modelsOfKind('walk-in').map(m => v(m.id, m.name)),
    colourLabel: 'Colour',
    widths: WALKIN_WIDTHS,
    widthsOfVariant: id => (id ? wardrobeModelById(id).widths : undefined),
    hardwareLabel: 'Handle finish',
    hardwareChoices: HANDLE_FINISHES.map(f => ({ id: f.name, label: f.name, hex: f.hex })),
  },
  // THE VISUALISER IS THE SPEC, exactly as it is for the wardrobe above.
  //
  // This card used to offer "Open shelving / Drawers / Racks", which is a
  // description of the category and not a thing anyone can order: the range has
  // no drawers and no racks in it. What Klay makes is the Forma linen shelving —
  // four codes, four 447mm shelves apiece, 1650 high, three of them carrying a
  // face post so the wide ones span without dipping — and the visualiser has
  // been drawing exactly that all along.
  //
  // So the card asks what the visualiser asks, in the same order and off the
  // same lists: which code, what colour board, how wide. Nothing is retyped
  // here, so the card and the render cannot end up offering different shelving.
  //
  // NO HARDWARE ROW, and that is the visualiser's call too — it hides the
  // handle group for shelving because there is no metalwork on it at all. No
  // rail, no drawer, no pull. Four shelves and a post.
  shelving: {
    variantLabel: 'Layout',
    variants: modelsOfKind('shelving').map(m => v(m.id, m.name)),
    colourLabel: 'Colour',
    widths: SHELVING_WIDTHS,
    // THE ONE THAT MAKES THIS NECESSARY. The four linen codes are made in four
    // separate width sets that do not overlap, so the union is a list of sizes
    // no single code is available in. See widthsOfVariant.
    widthsOfVariant: id => (id ? wardrobeModelById(id).widths : undefined),
  },
  // ONE SKU, AND IT IS THE FIXED PANEL.
  //
  // This card used to offer "Fixed panel / Hinged door / Sliding", which is the
  // shape of a shower screen category rather than a thing Klay has priced. The
  // range starts at the fixed panel, so that is the one SKU the card sells, and
  // the row is named for it: FIXED, answered by how the glass is held.
  //
  // CLIP OR CHANNEL, which is the first real question about a frameless panel
  // and not a cosmetic one. A clip is a bracket at the corners of the glass and
  // leaves it looking unheld; a channel is a U-track the panel sits in, which is
  // what you use when the walls are out or the glass is big enough to want the
  // support. It decides both of the rows underneath it.
  //
  // SOURCED FROM STEGBAR — the finishes, the split between them and the ten
  // sizes are read off their clip fixed and channel fixed pages rather than
  // reasoned about here. See SCREEN_FINISHES.
  'frameless-shower-screens': FIXED_SCREEN_OPTIONS,
  'radius-corner-fixed-frameless': {
    ...FIXED_SCREEN_OPTIONS,
    glassChoices: [v('clear', 'Clear'), v('reeded', 'Narrow-reeded')],
  },
  // THE FRAMED ONE, and it is not a spread of the two above. Its own object,
  // because it shares their shape and none of their numbers — a different
  // height, a different six widths, two finishes and no mounting. Spreading
  // FIXED_SCREEN_OPTIONS and overriding five keys would have looked like a
  // variant of a frameless screen, and it is a different product. See
  // SEMI_SCREEN_OPTIONS.
  'semi-frameless-front-only': SEMI_SCREEN_OPTIONS,
  'semi-frameless-front-return': {
    ...SEMI_SCREEN_OPTIONS,
    widths: FRONT_RETURN_SIZES.map(s => s.width),
    widthFormat: frontReturnSizeLabel,
  },
}

/** Fallback for a product added to the catalogue before it is added here. One
 * choice, so the panel still renders and still checks out as a measure request
 * rather than throwing — a new product should reach the customer as "we make
 * this, ask us" rather than as a blank card. */
const FALLBACK: ProductOptions = {
  variantLabel: 'Specification',
  variants: [v('standard', 'Standard')],
}

/** The panel's fields, in the order they are asked. Variant first because it is
 * the question that changes what everything below it means. */
export const fieldsFor = (item: CatalogueItem, sel?: Selection): ConfigField[] => {
  const options = PRODUCT_OPTIONS[item.id] ?? FALLBACK
  // WHERE IT IS GOING, FIRST. It used to come last, on the reasoning that
  // everything above it specifies the product and this specifies the job — so
  // it should not interrupt the specifying. In a panel of six rows that reads
  // as an afterthought, and it is the opposite: the room is the one thing a
  // customer already knows when they arrive. They came to do bedroom 2; the
  // fabric and the size are what they work out once they are here.
  //
  // It also changes what the rows below it mean. "Window size: small" reads
  // differently under "Location: bathroom" than under nothing at all.
  //
  // A DROPDOWN, NOT CHIPS, and it was chips while the list was eight long. The
  // dense card already sent it to a select on the length rule; the accordion
  // took its lead from `kind` and laid out one rectangle per room, which at
  // seventeen is a wall of near-identical labels differing by one digit — the
  // worst thing to ask anyone to scan. Rooms are a list to find yourself in,
  // not a set to compare, which is what 'select' is for.
  //
  // AND NOT ALWAYS THE WHOLE HOUSE. Ten products take any room; a shower screen
  // takes a bathroom and a zip system takes an outdoor room. See
  // locationChoices.
  const fields: ConfigField[] = [
    {
      id: 'location',
      label: 'Location',
      kind: 'select',
      choices: options.locationChoices ?? LOCATION_CHOICES,
    },
  ]
  if (options.glassChoices) {
    fields.unshift({ id: 'glass', label: 'Glass type', kind: 'chips', choices: options.glassChoices })
  }
  if (options.variants?.length) {
    fields.push({
      id: 'variant',
      label: options.variantLabel ?? 'Type',
      kind: 'chips',
      choices: options.variants,
      listed: options.variantsListed,
    })
  }
  // THE CLOTH AND ITS METALWORK, in whichever order the product is decided in.
  // The cloth leads almost everywhere, because the cloth IS the product and its
  // frame is a trim on it. An awning is the exception and says so — see
  // hardwareFirst.
  const colourField = () => {
    if (!item.colours) return
    fields.push({
      id: 'colour',
      label: options.colourLabel ?? 'Colour',
      kind: options.colourKind ?? 'swatches',
      choices: item.colours.map(c => ({ id: c.name, label: c.name, hex: c.hex })),
    })
  }
  // A product supplies its own metalwork list where its metalwork is not a
  // blind's. `hardware: true` still means the blind headrail colours.
  const hardwareField = () => {
    // THE CHOSEN MOUNTING'S FINISHES WHERE IT HAS ITS OWN. A shower screen's
    // clip carries gunmetal and its channel does not, so the swatch row has to
    // follow the row above it — the same shape as widthsOfVariant below, and for
    // the same reason: a swatch on offer has to be a finish you can actually
    // order in the thing you just chose.
    const hardwareChoices =
      options.hardwareChoicesOfVariant?.(sel?.variant) ?? options.hardwareChoices
    if (hardwareChoices) {
      fields.push({
        id: 'hardware',
        label: options.hardwareLabel ?? 'Hardware',
        kind: 'swatches',
        choices: hardwareChoices,
      })
    } else if (options.hardware) {
      fields.push({ id: 'hardware', label: 'Hardware', kind: 'chips', choices: HARDWARE_CHOICES })
    }
  }
  if (options.hardwareFirst) hardwareField()
  colourField()
  // THE CHOSEN MODEL'S WIDTHS WHERE IT HAS ITS OWN, the range's otherwise. The
  // narrowing is what stops the linen card offering Linen 1 at 3600mm — see
  // widthsOfVariant.
  const widths = options.widthsOfVariant?.(sel?.variant) ?? options.widths
  if (widths?.length) {
    fields.push({
      id: 'width',
      label: options.widthLabel ?? 'Width',
      kind: 'select',
      // A PRODUCT MAY PRINT ITS SIZE DIFFERENTLY FROM "1200mm". A shower panel
      // is a stock size in both directions and is ordered as one — the height
      // never varies, so it belongs in the label rather than in a row of its
      // own, and the line then reads the way the order does. Everything else
      // has one dimension worth naming and keeps the plain form.
      choices: widths.map(w => v(String(w), options.widthFormat?.(w) ?? `${w}mm`)),
      // Only where the product asks for one AND is made in it. A model whose
      // own width list does not include it falls back to that list's first,
      // which is what firstChoice below does.
      defaultChoice:
        options.defaultWidth !== undefined ? String(options.defaultWidth) : undefined,
    })
  }
  if (!options.hardwareFirst) hardwareField()
  if (options.dimensionsOfVariant) {
    fields.push({ id: 'dimension', label: options.dimensionsLabel ?? 'Dimensions (H × W)', kind: 'select',
      choices: options.dimensionsOfVariant(sel?.variant),
      defaultChoice: options.defaultDimensionOfVariant?.(sel?.variant) })
  }
  if (options.size) {
    fields.push({ id: 'size', label: 'Window size', kind: 'chips', choices: SIZE_CHOICES })
  }
  if (options.operation) {
    fields.push({
      id: 'operation',
      label: 'Operation',
      kind: 'chips',
      choices: options.operationChoices ?? OPERATION_CHOICES,
    })
  }
  return fields
}

export type Selection = Partial<Record<FieldId, string>>

/** THE HEX THE METALWORK IS PAINTED, for a product that supplies its own list.
 *
 * The blind hardware row answers 'white' | 'black' | 'chrome' and the card looks
 * those three up in HARDWARE_HEX. A product with `hardwareChoices` answers with
 * a colour NAME instead — 'Charcoal', 'Brushed brass' — which is not in that
 * table, so the lookup missed and every awning painted its cassette chrome
 * whatever the customer picked. The swatches already carry their own hex; this
 * reads it back off the same list the row was built from, so the two cannot
 * disagree.
 *
 * Null where the product has no list of its own, which leaves the blind
 * behaviour exactly where it was. */
export const hardwareHex = (item: CatalogueItem, sel: Selection): string | null => {
  const options = PRODUCT_OPTIONS[item.id] ?? FALLBACK
  const choices = options.hardwareChoicesOfVariant?.(sel.variant) ?? options.hardwareChoices
  if (!choices) return null
  return choices.find(c => c.id === sel.hardware)?.hex ?? choices[0]?.hex ?? null
}

/** THE ANSWER A ROW OPENS ON: the one it names, where it names one and is made
 * in it, and otherwise the first on offer.
 *
 * The guard is the point. A `defaultChoice` is written against the product's
 * full width list, and the row a customer sees may be a single model's narrower
 * one — so it is checked against the choices actually present rather than
 * trusted, which keeps an unorderable size off the card without either caller
 * having to know that is a risk. */
const firstChoice = (f: ConfigField): string | undefined =>
  (f.defaultChoice !== undefined && f.choices.some(c => c.id === f.defaultChoice)
    ? f.defaultChoice
    : f.choices[0]?.id)

/** Every field's opening choice. The panel opens on a complete, orderable
 * configuration rather than on five empty controls — nobody should have to
 * answer five questions to find out what something costs. */
export const defaultSelection = (item: CatalogueItem): Selection => {
  const sel: Selection = {}
  // EVERY FIELD ARRIVES ANSWERED, LOCATION INCLUDED — and that reverses an
  // earlier call worth recording. Location was left blank on the reasoning that
  // defaulting it makes the card claim the customer said "Master bedroom" when
  // they said nothing, which is true. What it missed is the setting: twelve cards
  // each showing one unanswered row reads as twelve incomplete forms, and the
  // customer cannot tell which of them is waiting on them.
  //
  // Every other field makes the same bargain — a sensible default, changed by
  // anyone who cares — and the measure appointment confirms the room anyway.
  for (const f of fieldsFor(item)) sel[f.id] = firstChoice(f)
  // AND THEN CHECKED, BECAUSE A FIELD CAN DEPEND ON THE ANSWER ABOVE IT. The
  // loop above ran with nothing chosen yet, so the linen card's width row saw
  // the union of all four codes' widths and took 900 off the front of it — a
  // width three of the four codes are not made in. Reconcile re-asks with the
  // model now known and moves it to that code's own first width.
  return reconcile(item, sel)
}

/** The selection with every answer checked against the choices actually on
 * offer, and any answer that is no longer among them replaced by the first that
 * is.
 *
 * ONE ANSWER CAN INVALIDATE ANOTHER. Pick Linen 1 at 1200, then switch to Linen
 * 5 — which is made in 2700 and up — and 1200 is not a width that code comes in.
 * Left alone the select renders with a value not in its own list, which browsers
 * resolve by silently showing the first option while the state still says 1200:
 * the card then displays one width and carries another into the cart.
 *
 * Central rather than per-field, so the next dependency added to the table is
 * handled by the table alone. */
export const reconcile = (item: CatalogueItem, sel: Selection): Selection => {
  const next = { ...sel }
  for (const f of fieldsFor(item, next)) {
    if (next[f.id] !== undefined && !f.choices.some(c => c.id === next[f.id])) {
      next[f.id] = firstChoice(f)
    }
  }
  return next
}

/** The selection after one row is answered — the only way a card should change
 * it, because an answer can invalidate a row below it. See reconcile. */
export const withChoice = (
  item: CatalogueItem,
  sel: Selection,
  fieldId: string,
  choiceId: string,
): Selection => reconcile(item, { ...sel, [fieldId]: choiceId })

/** What this configuration costs, or null where the product has no pricing.
 *
 * Only the roller range has published prices, and the price it returns is the
 * one lib/pricing charges — the same function the checkout uses, so the figure
 * on the card is the figure on the invoice. Everything else is null and reaches
 * the cart as a measure request; see catalogue.ts on why no number is invented
 * for a made-to-measure product. */
export const priceFor = (item: CatalogueItem, sel: Selection): number | null => {
  if (item.id !== 'roller-blinds') return null
  const blindType = sel.variant
  if (!isBlindType(blindType)) return null
  return pricePerBlind({
    blindType,
    windowSize: isWindowSize(sel.size) ? sel.size : 'medium',
    operation: isOperation(sel.operation) ? sel.operation : 'manual',
  })
}

/** A choice's label, for printing on the cart line. */
const labelOf = (fields: ConfigField[], id: FieldId, sel: Selection): string | undefined =>
  fields.find(f => f.id === id)?.choices.find(c => c.id === sel[id])?.label

/** Printed on a line where a choice genuinely has not been made — the product
 * has no such control and it is settled at the appointment. */
const AT_MEASURE = 'Chosen at measure'

/** The cart line for a configured product — the cart's own item, less the two
 * fields the cart assigns itself. It goes to `addItem` directly.
 *
 * DERIVED, NOT RESTATED — ADR-021. This used to declare all twelve fields by
 * hand, which made it a second copy of a shape the cart already owned: correct
 * on the day it was written, and one field away from the silent divergence §13
 * names. `addItem` takes exactly `Omit<CartItem, 'id' | 'quantity'>`, so that
 * is what this is, and a field added to the cart line reaches this file as a
 * type error rather than as a value that quietly stops being carried.
 *
 * The cost is that `priceOnMeasure` and `options` are optional here where they
 * used to be required. `configuredLine` sets both on every line it builds, and
 * its one consumer passes the result straight to `addItem`, so nothing reads
 * them expecting a guarantee the cart itself does not make. */
export type ConfiguredLine = Omit<CartItem, 'id' | 'quantity'>

export const configuredLine = (item: CatalogueItem, sel: Selection): ConfiguredLine => {
  // WITH the selection — the width row's choices depend on the chosen model, and
  // a line built off the unnarrowed list would look its width up in a list the
  // customer was never shown.
  const fields = fieldsFor(item, sel)
  const price = priceFor(item, sel)
  return {
    name: item.name,
    type: `Made to measure · ${item.group}`,
    // The whole selection, not just the product — it is what the cart builds
    // its line id from, so two different configurations of one product have to
    // produce two different strings or they collapse into one line.
    // locationOther rides along: two lines that differ only by "garage" and
    // "shed" behind the same Other choice are two different jobs, and without
    // it they would collapse into one line in the cart.
    blindType: [item.id, ...fields.map(f => sel[f.id] ?? ''), sel.locationOther ?? ''].join(':'),
    fabricColour: labelOf(fields, 'colour', sel) ?? AT_MEASURE,
    hardwareColour: labelOf(fields, 'hardware', sel) ?? AT_MEASURE,
    windowSize: isWindowSize(sel.size) ? sel.size : 'medium',
    // Pricing's own two words where the product answers in them, and the mapped
    // answer where it does not — a battery shutter is motorised, not manual.
    // See OPERATION_COLUMN.
    operation: isOperation(sel.operation)
      ? sel.operation
      : OPERATION_COLUMN[sel.operation ?? ''] ?? 'manual',
    price: price ?? 0,
    priceOnMeasure: price === null,
    options: [...fields.map(f => ({
      label: f.label,
      // What the customer typed beats the word Other, which tells the workshop
      // nothing. Falls back to Other where they chose it and typed nothing.
      value: f.id === 'location' && sel.location === 'other' && sel.locationOther?.trim()
        ? sel.locationOther.trim()
        : f.choices.find(c => c.id === sel[f.id])?.label ?? AT_MEASURE,
    })), ...(PRODUCT_OPTIONS[item.id]?.specificationsOfVariant?.(sel.variant) ?? [])],
  }
}
