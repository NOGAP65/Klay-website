// ---------------------------------------------------------------------------
// WHAT EACH PRODUCT LETS YOU CHOOSE — the card configurator's data.
//
// Every product in the catalogue gets a panel of choices sitting directly under
// its photograph in the homepage range row, and this file is what that panel is
// built from. One table, so the fourteen panels cannot drift into fourteen
// different vocabularies.
//
// FIVE SLOTS, AND NO MORE. A configured line has to survive as a cart line, and
// the cart's line carries exactly five configurable fields — see store/cartStore.
// So the panel offers at most five, and each maps onto one of them:
//
//     variant   → blindType        the choice that changes what the product IS
//     colour    → fabricColour     the colour card, where one exists
//     hardware  → hardwareColour   the visible metalwork
//     size      → windowSize       the pricing band
//     operation → operation        manual or motorised
//
// Holding to that is what keeps the panel honest: anything a customer picks
// here reaches the cart, the quote and the installer. A sixth control would be
// a choice the site collects and then loses.
//
// VARIANT IS NOT ALWAYS LIGHT CONTROL, which is why it is not called that. It
// is whichever choice is the first real question about a given product: light
// control on a roller, slat material on a venetian, panel layout on a shower
// screen. Each product names its own, and the label is what the customer reads.
//
// EDITORIAL — READ THIS BEFORE TRUSTING IT. The choice lists below describe how
// these products are ordinarily specified in the trade; they are not read off a
// Klay price list, because there is no price list in the repo for anything but
// the roller range. They are the right shape and they are the wrong place to
// leave unchecked — this table is the ONE place to correct them, and correcting
// them changes the panel, the cart line and the quote together.
// ---------------------------------------------------------------------------

import { HARDWARE_OPTIONS } from '../../data/products'
import { pricePerBlind, isBlindType, isWindowSize, isOperation } from '../../lib/pricing'


import type { CatalogueItem } from './constants'

export type FieldId = 'variant' | 'colour' | 'hardware' | 'size' | 'operation'

export interface ConfigChoice {
  /** Stable id. For the roller's variant these ARE the pricing blind types, so
   * the selection can be priced without a second mapping. */
  id: string
  label: string
  /** Swatch fill, for a colour field. */
  hex?: string
}

export interface ConfigField {
  id: FieldId
  /** What the customer reads above the control. */
  label: string
  kind: 'chips' | 'swatches'
  choices: ConfigChoice[]
}

/** The three window-size bands the pricing works in — see lib/pricing. Shown
 * with the wording a customer can answer without a tape measure; the exact
 * drop is taken at the measure appointment either way. */
const SIZE_CHOICES: ConfigChoice[] = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
]

const OPERATION_CHOICES: ConfigChoice[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'motorised', label: 'Motorised' },
]

const HARDWARE_CHOICES: ConfigChoice[] = HARDWARE_OPTIONS.map(o => ({ id: o.id, label: o.label }))

interface ProductOptions {
  /** The first real question about this product, and what to call it. */
  variantLabel: string
  variants: ConfigChoice[]
  /** Offered only where there is visible metalwork to choose — a track, a
   * headrail, a frame. A wardrobe's hinges are not a decision made on a card. */
  hardware?: boolean
  /** Priced products need it; everything else uses it to scope the quote. Left
   * off where the product is not sold by window band at all. */
  size?: boolean
  operation?: boolean
  /** What the colour card is called for this product, where the catalogue item
   * carries one. */
  colourLabel?: string
}

const v = (id: string, label: string): ConfigChoice => ({ id, label })

const PRODUCT_OPTIONS: Record<string, ProductOptions> = {
  // --- INDOOR --------------------------------------------------------------
  // The one priced product. Its variant ids are the four pricing blind types
  // verbatim, which is what lets the panel show a live price — see priceFor.
  'roller-blinds': {
    variantLabel: 'Light control',
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
  'roman-blinds': {
    variantLabel: 'Light control',
    variants: [v('blockout', 'Blockout'), v('lightfilter', 'Light filter')],
    size: true,
    operation: true,
  },
  'honeycomb-blinds': {
    variantLabel: 'Light control',
    variants: [v('blockout', 'Blockout'), v('lightfilter', 'Light filter')],
    size: true,
    operation: true,
  },
  'venetian-blinds': {
    variantLabel: 'Slat',
    variants: [v('aluminium', 'Aluminium'), v('timber', 'Timber'), v('faux', 'Faux timber')],
    size: true,
    operation: true,
  },
  'plantation-shutters': {
    variantLabel: 'Material',
    variants: [v('pvc', 'PVC'), v('timber', 'Timber'), v('aluminium', 'Aluminium')],
    size: true,
  },
  'vertical-blinds': {
    variantLabel: 'Light control',
    variants: [
      v('blockout', 'Blockout'),
      v('lightfilter', 'Light filter'),
      v('sunscreen', 'Sunscreen'),
    ],
    size: true,
    operation: true,
  },
  curtains: {
    variantLabel: 'Fabric',
    variants: [v('sheer', 'Sheer'), v('lightfilter', 'Light filter'), v('blockout', 'Blockout')],
    hardware: true,
    size: true,
    operation: true,
    colourLabel: 'Fabric colour',
  },

  // --- OUTDOOR -------------------------------------------------------------
  'folding-arm-awnings': {
    variantLabel: 'Cover',
    variants: [v('acrylic', 'Acrylic canvas'), v('mesh', 'Shade mesh')],
    size: true,
    operation: true,
  },
  'zip-guide-systems': {
    variantLabel: 'Screen',
    variants: [v('mesh', 'Sunscreen mesh'), v('blockout', 'Blockout PVC')],
    size: true,
    operation: true,
  },
  'roller-shutters': {
    variantLabel: 'Slat',
    variants: [v('aluminium', 'Aluminium'), v('insulated', 'Insulated')],
    size: true,
    operation: true,
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
  wardrobes: {
    variantLabel: 'Type',
    variants: [v('built-in', 'Built-in'), v('walk-in', 'Walk-in'), v('sliding', 'Sliding')],
  },
  shelving: {
    variantLabel: 'Type',
    variants: [v('open', 'Open shelving'), v('drawers', 'Drawers'), v('racks', 'Racks')],
  },
  'frameless-shower-screens': {
    variantLabel: 'Panel',
    variants: [v('fixed', 'Fixed panel'), v('hinged', 'Hinged door'), v('sliding', 'Sliding')],
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
export const fieldsFor = (item: CatalogueItem): ConfigField[] => {
  const opts = PRODUCT_OPTIONS[item.id] ?? FALLBACK
  const fields: ConfigField[] = [
    { id: 'variant', label: opts.variantLabel, kind: 'chips', choices: opts.variants },
  ]
  if (item.colours) {
    fields.push({
      id: 'colour',
      label: opts.colourLabel ?? 'Colour',
      kind: 'swatches',
      choices: item.colours.map(c => ({ id: c.name, label: c.name, hex: c.hex })),
    })
  }
  if (opts.hardware) {
    fields.push({ id: 'hardware', label: 'Hardware', kind: 'chips', choices: HARDWARE_CHOICES })
  }
  if (opts.size) {
    fields.push({ id: 'size', label: 'Window size', kind: 'chips', choices: SIZE_CHOICES })
  }
  if (opts.operation) {
    fields.push({ id: 'operation', label: 'Operation', kind: 'chips', choices: OPERATION_CHOICES })
  }
  return fields
}

export type Selection = Partial<Record<FieldId, string>>

/** Every field's first choice. The panel opens on a complete, orderable
 * configuration rather than on five empty controls — nobody should have to
 * answer five questions to find out what something costs. */
export const defaultSelection = (item: CatalogueItem): Selection => {
  const sel: Selection = {}
  for (const f of fieldsFor(item)) sel[f.id] = f.choices[0]?.id
  return sel
}

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

/** The cart line for a configured product. Shaped to the cart's own item so it
 * can go to addItem directly. */
export interface ConfiguredLine {
  name: string
  type: string
  blindType: string
  fabricColour: string
  hardwareColour: string
  windowSize: 'small' | 'medium' | 'large'
  operation: 'manual' | 'motorised'
  price: number
  priceOnMeasure: boolean
  /** The configuration as the customer chose it, ready to print. Only the
   * fields this product actually offered, so a wardrobe line never claims a
   * window size and a shower screen never claims an operation. */
  options: { label: string; value: string }[]
}

export const configuredLine = (item: CatalogueItem, sel: Selection): ConfiguredLine => {
  const fields = fieldsFor(item)
  const price = priceFor(item, sel)
  return {
    name: item.name,
    type: `Made to measure · ${item.group}`,
    // The whole selection, not just the product — it is what the cart builds
    // its line id from, so two different configurations of one product have to
    // produce two different strings or they collapse into one line.
    blindType: [item.id, ...fields.map(f => sel[f.id] ?? '')].join(':'),
    fabricColour: labelOf(fields, 'colour', sel) ?? AT_MEASURE,
    hardwareColour: labelOf(fields, 'hardware', sel) ?? AT_MEASURE,
    windowSize: isWindowSize(sel.size) ? sel.size : 'medium',
    operation: isOperation(sel.operation) ? sel.operation : 'manual',
    price: price ?? 0,
    priceOnMeasure: price === null,
    options: fields.map(f => ({
      label: f.label,
      value: f.choices.find(c => c.id === sel[f.id])?.label ?? AT_MEASURE,
    })),
  }
}
