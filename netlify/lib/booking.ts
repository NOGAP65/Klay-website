// ---------------------------------------------------------------------------
// Validation and shaping of an incoming booking, shared by the quote endpoint
// and the checkout endpoint so both enforce identical rules.
//
// Everything arriving here is untrusted. In particular the *price* is never
// read from the request — only the configuration is, and lib/pricing derives
// the money from that. See the security note at the top of src/lib/pricing.ts.
// ---------------------------------------------------------------------------

import { parseOrderConfig, priceOrder, type OrderConfig, type PricedOrder } from '../../src/lib/pricing'

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
  customer: CustomerDetails
  config: OrderConfig
  fabricColour: string | null
  hardwareColour: string | null
  priced: PricedOrder
}

/** Strip HTML tags to prevent stored XSS in downstream systems (admin panels,
 *  CRM imports, etc). This is defence in depth — email templates already escape,
 *  but data that lands in the database should be clean too. */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '')
}

/** Trim, collapse whitespace, strip HTML, and cap length so a hostile payload
 *  cannot store a megabyte of text or inject scripts. */
function text(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const cleaned = stripHtml(value).replace(/\s+/g, ' ').trim().slice(0, maxLength)
  return cleaned.length > 0 ? cleaned : null
}

/** Deliberately permissive: one @, no spaces, a dot in the domain. Anything
 *  stricter starts rejecting addresses that genuinely deliver. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

export function parseBooking(body: Record<string, unknown>): ValidationResult {
  const fields: Record<string, string> = {}

  const name = text(body.name, 120)
  if (!name) fields.name = 'Please tell us your name.'

  const email = text(body.email, 200)?.toLowerCase() ?? null
  if (!email) fields.email = 'We need an email to reply to.'
  else if (!EMAIL_RE.test(email)) fields.email = "That email doesn't look right."

  const phone = text(body.phone, 40)
  if (phone && !PHONE_RE.test(phone)) fields.phone = 'Please enter a valid phone number.'

  const postcode = text(body.postcode, 8)
  if (postcode && !POSTCODE_RE.test(postcode)) fields.postcode = 'Australian postcodes are four digits.'

  const preferredDate = text(body.preferredDate, 20)
  if (preferredDate && !DATE_RE.test(preferredDate)) {
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
      customer: {
        // Non-null assertions are safe: the guards above returned early if
        // either was missing.
        name: name!,
        email: email!,
        phone,
        address: text(body.address, 240),
        suburb: text(body.suburb, 120),
        postcode,
        preferredDate,
        notes: text(body.notes, 2000),
      },
      config,
      fabricColour: text(body.fabricColour, 60),
      hardwareColour: text(body.hardwareColour, 40),
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
