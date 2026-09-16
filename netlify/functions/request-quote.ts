// ---------------------------------------------------------------------------
// POST /api/request-quote
//
// The no-money path: store the enquiry, alert Klay, acknowledge the customer.
// The database write is what "success" means — if either email fails the
// request still returns 200, because the lead is safely recorded and losing it
// over a misconfigured mail key would be the worse outcome by far.
// ---------------------------------------------------------------------------

import { checkHoneypot, verifyTurnstile } from '../lib/antispam'
import { bookingRow, parseQuoteBooking } from '../lib/booking'
import { db } from '../lib/db'
import { env, missing } from '../lib/env'
import { badRequest, checkSameOrigin, json, methodNotAllowed, notConfigured, readJson, serverError } from '../lib/http'
import { acknowledgeQuoteRequest, notifyQuoteRequest } from '../lib/notify'
import { checkRateLimit, getClientIp } from '../lib/rateLimit'

import type { Config, Context } from '@netlify/functions'

export default async (req: Request, context?: Pick<Context, 'ip'>): Promise<Response> => {
  if (req.method !== 'POST') return methodNotAllowed('POST')
  const originError = checkSameOrigin(req)
  if (originError) return originError
  const clientIp = getClientIp(req, context?.ip)
  const rateLimited = checkRateLimit(req, clientIp)
  if (rateLimited) return rateLimited

  const body = await readJson(req)
  if (body instanceof Response) return body

  const honeypot = checkHoneypot(body)
  if (honeypot) return honeypot

  const parsed = parseQuoteBooking(body)
  if (!parsed.ok) return badRequest(parsed.message, parsed.fields)
  const booking = parsed.booking

  const turnstileError = await verifyTurnstile(body, clientIp, req)
  if (turnstileError) return turnstileError
  const gaps = missing(env(), 'database')
  if (gaps.length > 0) return notConfigured(gaps)

  try {
    const { data, error } = await db()
      .from('quote_requests')
      .insert({
        ...bookingRow(booking),
        estimate_cents: booking.priced.totalCents,
      })
      .select('id')
      .single()

    if (error) return serverError('request-quote:insert', error)

    // Both sends are best-effort by design — see netlify/lib/notify.ts.
    await Promise.allSettled([
      notifyQuoteRequest(booking, data.id),
      acknowledgeQuoteRequest(booking),
    ])

    return json({ ok: true, id: data.id })
  } catch (err) {
    return serverError('request-quote', err)
  }
}

export const config: Config = {
  path: '/api/request-quote',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}
