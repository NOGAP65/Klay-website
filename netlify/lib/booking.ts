// ---------------------------------------------------------------------------
// Validation and shaping of an incoming booking, shared by the quote endpoint
// and the checkout endpoint so both enforce identical rules.
//
// Everything arriving here is untrusted. In particular the *price* is never
// read from the request — only the configuration is, and lib/pricing derives
// the money from that. See the security note at the top of src/lib/pricing.ts.
// ---------------------------------------------------------------------------

import { hasControlCharacters } from '../../shared-core/plainText'
import { isBlindType, isOperation, isWindowSize, MAX_QUANTITY, parseOrderConfig, priceOrder, type OrderConfig, type PricedOrder } from '../../shared-core/pricing'
import { isQuoteItems, quoteItemsSummary, type QuoteItem } from '../../shared-core/quoteItems'

export interface CustomerDetails {
  name: string
  email: string
  phone: string | null
  address: string | null
  suburb: string | null
  postcode: string | null
  preferredDate: string | null
  notes: string | null
}

export interface ParsedBooking {
  items?: QuoteItem[]
  customer: CustomerDetails
  config: OrderConfig
  fabricColour: string | null
  hardwareColour: string | null
  priced: PricedOrder
}

/** Store plain text; escape at HTML sinks. Regex tag stripping is not an XSS defence. */
const text = (value: unknown): string | null =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() || null : null

/** Deliberately permissive: one @, no spaces, a dot in the domain. Anything
 *  stricter starts rejecting addresses that genuinely deliver. */
const EMAIL_RE = /^[^\s@<>"\\,;:()[\]]+@[^\s@<>"\\,;:()[\]]+\.[^\s@<>"\\,;:()[\]]+$/

/** AU postcodes are exactly four digits. */
const POSTCODE_RE = /^\d{4}$/

/** ISO yyyy-mm-dd, which is what <input type="date"> submits. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Phone: digits, spaces, plus, parentheses, hyphens only. Anything else is
 *  suspicious and rejected outright. */
const PHONE_RE = /^[\d\s+().-]+$/

export type ValidationResult =
  | { ok: true; booking: ParsedBooking }
  | { ok: false; message: string; fields: Record<string, string> }

function validateInputShape(body: Record<string, unknown>): Record<string, string> {
  const fields: Record<string, string> = {}
  const limits: Record<string, number> = { name: 120, email: 200, phone: 40, address: 240,
    suburb: 120, postcode: 8, preferredDate: 20, notes: 2000, fabricColour: 60, hardwareColour: 40,
    website: 240, turnstileToken: 2048 }
  for (const [key, max] of Object.entries(limits)) {
    const value = body[key]
    if (value === undefined || value === null) continue
    if (typeof value !== 'string' || value.length > max || hasControlCharacters(value, key === 'notes')) {
      fields[key] = `Please use text of ${max} characters or fewer.`
    }
  }
  return { ...fields, ...validateConfiguration(body) }
}

function validateConfiguration(body: Record<string, unknown>): Record<string, string> {
  const fields: Record<string, string> = {}
  if (body.blindType !== undefined && !isBlindType(body.blindType)) fields.blindType = 'Please choose a valid blind type.'
  if (body.windowSize !== undefined && !isWindowSize(body.windowSize)) fields.windowSize = 'Please choose a valid size.'
  if (body.operation !== undefined && !isOperation(body.operation)) fields.operation = 'Please choose a valid operation.'
  if (body.quantity !== undefined && (typeof body.quantity !== 'number' || !Number.isInteger(body.quantity)
    || body.quantity < 1 || body.quantity > MAX_QUANTITY)) fields.quantity = `Please choose a quantity from 1 to ${MAX_QUANTITY}.`
  return fields
}

export function parseBooking(body: Record<string, unknown>): ValidationResult {
  const fields = validateInputShape(body)
  if (body.items !== undefined && !isQuoteItems(body.items)) fields.items = 'Please check your basket quantities and options.'
  const items = isQuoteItems(body.items) ? body.items.map(item => ({ name: item.name.trim(), quantity: item.quantity,
    options: item.options.map(option => ({ label: option.label.trim(), value: option.value.trim() })) })) : undefined

  const name = text(body.name)
  if (!name) fields.name = 'Please tell us your name.'

  const email = text(body.email)?.toLowerCase() ?? null
  if (!email) fields.email = 'We need an email to reply to.'
  else if (!EMAIL_RE.test(email)) fields.email = "That email doesn't look right."

  const phone = text(body.phone)
  if (phone && (!PHONE_RE.test(phone) || !/^\d{7,15}$/.test(phone.replace(/\D/g, '')))) fields.phone = 'Please enter a valid phone number.'

  const postcode = text(body.postcode)
  if (postcode && !POSTCODE_RE.test(postcode)) fields.postcode = 'Australian postcodes are four digits.'

  const preferredDate = text(body.preferredDate)
  if (preferredDate && (!DATE_RE.test(preferredDate) || Number.isNaN(Date.parse(preferredDate))
    || new Date(preferredDate).toISOString().slice(0, 10) !== preferredDate)) {
    fields.preferredDate = 'Please pick a date from the calendar.'
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false, message: 'Please check the highlighted fields.', fields }
  }

  const config = parseOrderConfig({
    blindType: body.blindType,
    windowSize: body.windowSize,
    operation: body.operation,
    quantity: body.quantity,
  })

  return {
    ok: true,
    booking: {
      items,
      customer: {
        // Non-null assertions are safe: the guards above returned early if
        // either was missing.
        name: name!,
        email: email!,
        phone,
        address: text(body.address),
        suburb: text(body.suburb),
        postcode,
        preferredDate,
        notes: [text(body.notes), items ? `BASKET QUOTE REQUEST\n${quoteItemsSummary(items)}` : null].filter(Boolean).join('\n\n') || null,
      },
      config,
      fabricColour: text(body.fabricColour),
      hardwareColour: text(body.hardwareColour),
      priced: priceOrder(config),
    },
  }
}

/** Column shape shared by quote_requests and orders. */
export function bookingRow(b: ParsedBooking) {
  return {
    name: b.customer.name,
    email: b.customer.email,
    phone: b.customer.phone,
    address: b.customer.address,
    suburb: b.customer.suburb,
    postcode: b.customer.postcode,
    preferred_date: b.customer.preferredDate,
    notes: b.customer.notes,
    blind_type: b.config.blindType,
    window_size: b.config.windowSize,
    operation: b.config.operation,
    quantity: b.config.quantity,
    fabric_colour: b.fabricColour,
    hardware_colour: b.hardwareColour,
  }
}
