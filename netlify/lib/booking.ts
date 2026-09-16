// ---------------------------------------------------------------------------
// Validation and shaping of an incoming booking, shared by the quote endpoint
// and the checkout endpoint so both enforce identical rules.
//
// Everything arriving here is untrusted. In particular the *price* is never
// read from the request — only the configuration is, and lib/pricing derives
// the money from that. See the security note at the top of src/lib/pricing.ts.
// ---------------------------------------------------------------------------

import { customerText, validateCustomer, validateLocality, type CustomerMode } from '../../shared-core/customerValidation'
import localities from '../../shared-core/data/au-localities.json' with { type: 'json' }
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
const text = (value: unknown): string | null => customerText(value) || null

export type ValidationResult =
  | { ok: true; booking: ParsedBooking }
  | { ok: false; message: string; fields: Record<string, string> }

function validateInputShape(body: Record<string, unknown>): Record<string, string> {
  const fields: Record<string, string> = {}
  const limits: Record<string, number> = { fabricColour: 60, hardwareColour: 40,
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

export function parseBooking(body: Record<string, unknown>, mode: CustomerMode = 'installation'): ValidationResult {
  const fields = { ...validateInputShape(body), ...validateCustomer(body, mode),
    ...(mode === 'installation' ? validateLocality(body, localities) : {}) }
  if (body.items !== undefined && !isQuoteItems(body.items)) fields.items = 'Please check your basket quantities and options.'
  const items = isQuoteItems(body.items) ? body.items.map(item => ({ name: item.name.trim(), quantity: item.quantity,
    options: item.options.map(option => ({ label: option.label.trim(), value: option.value.trim() })) })) : undefined

  const name = text(body.name)
  const email = text(body.email)
  const phone = text(body.phone)
  const postcode = text(body.postcode)
  const preferredDate = text(body.preferredDate)

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

export function parseQuoteBooking(body: Record<string, unknown>): ValidationResult {
  const invalid = (message: string): ValidationResult => ({ ok: false, message, fields: {} })
  if (body.enquiryType !== undefined && body.enquiryType !== 'contact' && body.enquiryType !== 'installation') {
    return invalid('Please choose a valid enquiry type.')
  }
  const isContact = body.enquiryType === 'contact'
  if (isContact && (body.items !== undefined || ['address', 'suburb', 'postcode', 'preferredDate'].some(key => body[key]))) {
    return invalid('Installation details must be submitted as an installation enquiry.')
  }
  return parseBooking(body, isContact ? 'contact' : 'installation')
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
