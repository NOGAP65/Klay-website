// ---------------------------------------------------------------------------
// POST /api/request-quote
//
// The no-money path: store the enquiry, alert Klay, acknowledge the customer.
// The database write is what "success" means — if either email fails the
// request still returns 200, because the lead is safely recorded and losing it
// over a misconfigured mail key would be the worse outcome by far.
// ---------------------------------------------------------------------------

import type { Config } from '@netlify/functions'
import { bookingRow, parseBooking } from '../lib/booking'
import { db } from '../lib/db'
import { env, missing } from '../lib/env'
import { badRequest, json, methodNotAllowed, notConfigured, readJson, serverError } from '../lib/http'
import { acknowledgeQuoteRequest, notifyQuoteRequest } from '../lib/notify'

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return methodNotAllowed('POST')

  const gaps = missing(env(), 'database')
  if (gaps.length > 0) return notConfigured(gaps)

  const body = await readJson(req)
  if (!body) return badRequest('Expected a JSON body.')

  const parsed = parseBooking(body)
  if (!parsed.ok) return badRequest(parsed.message, parsed.fields)
  const booking = parsed.booking

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

export const config: Config = { path: '/api/request-quote' }
