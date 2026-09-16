// ---------------------------------------------------------------------------
// The browser's side of the booking endpoints.
//
// Note what is NOT sent: a price. The server re-derives the amount from the
// configuration via lib/pricing, so the figure on screen is a display of the
// same calculation rather than an input to it. Sending one would be harmless
// (it is ignored) but implying the client decides the price would be a trap for
// whoever reads this next.
// ---------------------------------------------------------------------------

import type { BlindType, Operation, WindowSize } from '@/core/pricing'
import type { QuoteItem } from '@/core/quoteItems'

export interface BookingPayload {
  items?: QuoteItem[]
  name: string
  email: string
  phone?: string
  address?: string
  suburb?: string
  postcode?: string
  preferredDate?: string
  notes?: string
  blindType: BlindType
  windowSize: WindowSize
  operation: Operation
  quantity: number
  fabricColour?: string
  hardwareColour?: string
  /** Honeypot field — should be empty for real submissions. */
  website?: string
  /** Cloudflare Turnstile verification token. */
  turnstileToken?: string
}

/** Field-level messages keyed by field name, as returned by the server's
 *  validator, so the form can mark the offending inputs. */
export type FieldErrors = Record<string, string>

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fields?: FieldErrors }

async function post<T>(path: string, payload: BookingPayload, valid: (body: Record<string, unknown>) => boolean): Promise<ApiResult<T>> {
  let response: Response
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch {
    clearTimeout(timeout)
    // Offline, DNS, or the request never left the machine.
    return { ok: false, message: 'Could not reach the server. Check your connection and try again.' }
  }

  // A 404 here almost always means the functions are not deployed (e.g. running
  // `vite` alone rather than `netlify dev`), which is worth saying plainly
  // instead of surfacing a JSON parse error.
  if (response.status === 404) {
    clearTimeout(timeout)
    return { ok: false, message: 'Booking is not available on this environment yet.' }
  }

  let body: { error?: string; fields?: FieldErrors } & Record<string, unknown>
  try {
    body = await response.json()
  } catch {
    return { ok: false, message: 'The server sent back something unexpected. Please try again.' }
  } finally {
    clearTimeout(timeout)
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, message: 'The server sent back something unexpected. Please try again.' }
  }
  if (!response.ok) {
    return {
      ok: false,
      message: typeof body.error === 'string' ? body.error : 'Something went wrong. Please try again.',
      fields: body.fields,
    }
  }

  if (!valid(body)) return { ok: false, message: 'The server sent back something unexpected. Please try again.' }
  return { ok: true, data: body as T }
}

/** No-money path: records the enquiry and emails Klay. */
export const requestQuote = (payload: BookingPayload) =>
  post<{ id: string }>('/api/request-quote', payload, body => typeof body.id === 'string' && body.id.length > 0)

/** Pay-now path: returns the Stripe Checkout URL to redirect to. */
export const createCheckoutSession = (payload: BookingPayload) =>
  post<{ url: string; orderId: string }>('/api/create-checkout-session', payload, body => {
    if (typeof body.url !== 'string' || typeof body.orderId !== 'string') return false
    try { return new URL(body.url).protocol === 'https:' } catch { return false }
  })
