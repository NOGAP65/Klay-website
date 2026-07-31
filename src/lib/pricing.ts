// ---------------------------------------------------------------------------
// The one place an order's money is worked out.
//
// This module is imported by BOTH the browser (to show the estimate) and the
// Netlify function that opens a Stripe Checkout session (to decide what the
// card is actually charged). That is the entire point of it existing: if the
// two ever disagreed, the price on screen would stop matching the price paid.
//
// It follows that this file must stay pure — no React, no `window`, no imports
// that reach for either. It runs in a Node function as readily as in the SPA.
//
// SECURITY: the server never accepts a price from the client. It takes the
// *configuration* (type, size, operation, quantity), re-derives the total here,
// and charges that. Otherwise a hand-edited request could buy a $2,000 job for
// a dollar. `priceOrder` is the only function that should ever produce an
// amount to charge.
// ---------------------------------------------------------------------------

export type BlindType = 'blockout' | 'sunscreen' | 'lightfilter' | 'dual'
export type WindowSize = 'small' | 'medium' | 'large'
export type Operation = 'manual' | 'motorised'

/** Base price per blind by type and size band.
 *
 * Light Filter has no catalogue pricing of its own yet, so it tracks Sunscreen
 * until a real number is supplied. Mirrors the per-SKU `price` tables in
 * data/products.ts — those drive the catalogue copy, these drive the money. */
export const BASE_PRICE: Record<BlindType, Record<WindowSize, number>> = {
  blockout: { small: 220, medium: 260, large: 330 },
  sunscreen: { small: 220, medium: 260, large: 330 },
  lightfilter: { small: 220, medium: 260, large: 330 },
  dual: { small: 320, medium: 380, large: 480 },
}

/** Motor, remote and charger, added per blind when operation is motorised. */
export const MOTORISED_ADDON = 150

/** ---------------------------------------------------------------------
 *  CONFIRM THIS NUMBER BEFORE TAKING REAL PAYMENTS.
 *
 *  The configurator has always shown its estimate as "+ professional
 *  installation across Victoria" — i.e. install was quoted separately and
 *  never priced in the code. Charging the full amount up front means the
 *  checkout has to include it, so it needs a value, and this is a placeholder
 *  rather than a rate anyone at Klay has signed off.
 *
 *  Per blind, on top of the blind itself. Set to 0 to go back to quoting
 *  installation separately — the line item disappears from the breakdown by
 *  itself, no other edit needed.
 *  --------------------------------------------------------------------- */
export const INSTALL_PER_BLIND = 60

/** Minimum install charge for a job, so a single-blind visit still covers the
 *  call-out. Applies to the install component only, never to the blinds. */
export const INSTALL_CALLOUT_MINIMUM = 120

/** Australian consumer pricing is quoted GST-inclusive, so every number above
 *  already contains GST and this is only used to *show* the tax component on
 *  the breakdown. It is not added to the total. */
export const GST_RATE = 0.1

export interface OrderConfig {
  blindType: BlindType
  windowSize: WindowSize
  operation: Operation
  /** Number of blinds in the job. Clamped to 1..MAX_QUANTITY when priced. */
  quantity: number
}

export const MAX_QUANTITY = 40

export interface PricedLine {
  label: string
  /** Total for the line in whole dollars, GST inclusive. */
  amount: number
}

export interface PricedOrder {
  lines: PricedLine[]
  /** Blinds + motors + installation, GST inclusive, whole dollars. */
  total: number
  /** Total in cents — what Stripe is actually handed. */
  totalCents: number
  /** GST already contained in `total`, for display on the breakdown. */
  gstIncluded: number
  quantity: number
}

/** Clamp a possibly-hostile quantity to something sane. Anything unparseable
 *  becomes 1 rather than NaN, which would poison the whole total. */
export function normaliseQuantity(raw: unknown): number {
  const n = Math.floor(Number(raw))
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, MAX_QUANTITY)
}

export const isBlindType = (v: unknown): v is BlindType =>
  v === 'blockout' || v === 'sunscreen' || v === 'lightfilter' || v === 'dual'

export const isWindowSize = (v: unknown): v is WindowSize =>
  v === 'small' || v === 'medium' || v === 'large'

export const isOperation = (v: unknown): v is Operation =>
  v === 'manual' || v === 'motorised'

/** Build a valid OrderConfig from untrusted input (URL params, request body),
 *  falling back to the configurator's own defaults for anything missing or
 *  malformed. Never throws — a bad param yields a priceable default order, so
 *  a mangled link still shows a working page instead of a crash. */
export function parseOrderConfig(input: {
  blindType?: unknown
  windowSize?: unknown
  operation?: unknown
  quantity?: unknown
}): OrderConfig {
  return {
    blindType: isBlindType(input.blindType) ? input.blindType : 'blockout',
    windowSize: isWindowSize(input.windowSize) ? input.windowSize : 'medium',
    operation: isOperation(input.operation) ? input.operation : 'manual',
    quantity: normaliseQuantity(input.quantity),
  }
}

const BLIND_LABEL: Record<BlindType, string> = {
  blockout: 'Blockout Roller',
  sunscreen: 'Sunscreen Roller',
  lightfilter: 'Light Filter Roller',
  dual: 'Dual Roller',
}

const SIZE_LABEL: Record<WindowSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
}

export const blindLabel = (t: BlindType) => BLIND_LABEL[t]
export const sizeLabel = (s: WindowSize) => SIZE_LABEL[s]

/** Price for a single blind, excluding installation. Kept separate because
 *  the visualiser's sidebar shows exactly this figure. */
export function pricePerBlind(config: Pick<OrderConfig, 'blindType' | 'windowSize' | 'operation'>): number {
  const base = BASE_PRICE[config.blindType][config.windowSize]
  return base + (config.operation === 'motorised' ? MOTORISED_ADDON : 0)
}

/** The authoritative total. Everything that needs an amount — the on-screen
 *  breakdown, the Stripe session, the emailed confirmation — comes through
 *  here so they cannot drift apart. */
export function priceOrder(input: OrderConfig): PricedOrder {
  const quantity = normaliseQuantity(input.quantity)
  const config = { ...input, quantity }

  const base = BASE_PRICE[config.blindType][config.windowSize]
  const lines: PricedLine[] = [
    {
      label: `${BLIND_LABEL[config.blindType]} — ${SIZE_LABEL[config.windowSize]} × ${quantity}`,
      amount: base * quantity,
    },
  ]

  if (config.operation === 'motorised') {
    lines.push({ label: `Motorisation × ${quantity}`, amount: MOTORISED_ADDON * quantity })
  }

  // The call-out minimum floors the install component only — a two-blind job
  // at $60 each clears it, a single blind is topped up to $120.
  const install = INSTALL_PER_BLIND > 0
    ? Math.max(INSTALL_PER_BLIND * quantity, INSTALL_CALLOUT_MINIMUM)
    : 0
  if (install > 0) {
    lines.push({ label: `Professional installation × ${quantity}`, amount: install })
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0)

  return {
    lines,
    total,
    totalCents: Math.round(total * 100),
    // total is GST-inclusive, so the contained GST is total/11, not total*0.1.
    gstIncluded: Math.round(total - total / (1 + GST_RATE)),
    quantity,
  }
}

/** Money for humans. Whole dollars — every price in the catalogue is round, so
 *  trailing `.00` would be noise. */
export function formatAUD(amount: number): string {
  return `$${amount.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`
}
