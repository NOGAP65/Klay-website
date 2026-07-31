// ---------------------------------------------------------------------------
// GET /api/order-status?session_id=cs_...
//
// Lets the confirmation page say what actually happened instead of assuming.
// Landing on success_url is NOT proof of payment — it is just a URL anyone can
// visit — so the page asks here, and this reports the status the webhook wrote.
//
// Returns the bare minimum: status and amount. No name, email or address, even
// though the row holds them. A Stripe session id is unguessable, but it can end
// up in a browser history or a shared link, and that should not be enough to
// read someone's home address back out.
// ---------------------------------------------------------------------------

import type { Config } from '@netlify/functions'
import { db } from '../lib/db'
import { env, missing } from '../lib/env'
import { badRequest, json, methodNotAllowed, notConfigured, serverError } from '../lib/http'

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') return methodNotAllowed('GET')

  const gaps = missing(env(), 'database')
  if (gaps.length > 0) return notConfigured(gaps)

  const sessionId = new URL(req.url).searchParams.get('session_id')
  // Shape-check before hitting the database — Stripe session ids are prefixed,
  // so anything else is not worth a query.
  if (!sessionId || !sessionId.startsWith('cs_') || sessionId.length > 200) {
    return badRequest('A valid session_id is required.')
  }

  try {
    const { data, error } = await db()
      .from('orders')
      .select('status, amount_cents, quantity')
      .eq('stripe_session_id', sessionId)
      .maybeSingle()

    if (error) return serverError('order-status', error)
    if (!data) return json({ found: false }, 404)

    return json({
      found: true,
      status: data.status,
      amountCents: data.amount_cents,
      quantity: data.quantity,
    })
  } catch (err) {
    return serverError('order-status', err)
  }
}

export const config: Config = { path: '/api/order-status' }
