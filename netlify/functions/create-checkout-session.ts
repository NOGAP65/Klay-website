// ---------------------------------------------------------------------------
// POST /api/create-checkout-session
//
// The pay-now path. Opens a Stripe Checkout session and hands back its URL for
// the browser to redirect to, so no card details ever touch this site.
//
// THE IMPORTANT PART: the amount charged is computed here, on the server, by
// priceOrder() from the submitted *configuration*. The request body's own idea
// of the price — if it even sends one — is ignored completely. Trusting a
// client-sent amount is how a $2,000 job gets bought for a dollar.
//
// The order row is written before the redirect so a customer who pays but
// closes the tab before returning is still recorded; the webhook settles it.
// ---------------------------------------------------------------------------

import type { Config } from '@netlify/functions'
import Stripe from 'stripe'
import { checkHoneypot, verifyTurnstile } from '../lib/antispam'
import { bookingRow, parseBooking } from '../lib/booking'
import { db } from '../lib/db'
import { env, missing } from '../lib/env'
import { badRequest, json, methodNotAllowed, notConfigured, readJson, serverError } from '../lib/http'
import { checkRateLimit, getClientIp } from '../lib/rateLimit'
import { blindLabel, sizeLabel } from '../../src/lib/pricing'

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return methodNotAllowed('POST')

  const rateLimited = checkRateLimit(req)
  if (rateLimited) return rateLimited

  const e = env()
  const gaps = [...missing(e, 'database'), ...missing(e, 'payments')]
  if (gaps.length > 0) return notConfigured(gaps)

  const body = await readJson(req)
  if (!body) return badRequest('Expected a JSON body.')

  const honeypot = checkHoneypot(body)
  if (honeypot) return honeypot

  const turnstileError = await verifyTurnstile(body, getClientIp(req))
  if (turnstileError) return turnstileError

  const parsed = parseBooking(body)
  if (!parsed.ok) return badRequest(parsed.message, parsed.fields)
  const booking = parsed.booking
  const { priced, config } = booking

  // Should be unreachable — priceOrder always yields at least one blind — but
  // a zero-amount session would fail at Stripe with a far worse message.
  if (priced.totalCents <= 0) return serverError('checkout:zero-amount', { priced })

  const summary = `${blindLabel(config.blindType)} — ${sizeLabel(config.windowSize)} × ${config.quantity}`

  try {
    // 1. Record the intent to pay before sending anyone to Stripe.
    const { data: order, error: insertError } = await db()
      .from('orders')
      .insert({
        ...bookingRow(booking),
        status: 'pending_payment',
        amount_cents: priced.totalCents,
        currency: 'aud',
        price_breakdown: priced.lines,
      })
      .select('id')
      .single()

    if (insertError) return serverError('checkout:insert', insertError)

    // 2. Open the session. apiVersion is deliberately omitted so the SDK uses
    //    the version it was built against rather than one pinned by hand here.
    const stripe = new Stripe(e.stripeSecretKey)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Itemised the same way the site's breakdown is, so the Stripe page and
      // the page they just left agree line for line.
      line_items: priced.lines.map((line) => ({
        quantity: 1,
        price_data: {
          currency: 'aud',
          unit_amount: Math.round(line.amount * 100),
          product_data: { name: line.label },
        },
      })),
      customer_email: booking.customer.email,
      client_reference_id: order.id,
      // Echoed back by the webhook to find this row again.
      metadata: {
        order_id: order.id,
        blind_type: config.blindType,
        window_size: config.windowSize,
        operation: config.operation,
        quantity: String(config.quantity),
      },
      payment_intent_data: {
        description: `Klay Interiors — ${summary}`,
        metadata: { order_id: order.id },
      },
      success_url: `${e.siteUrl}/booking/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${e.siteUrl}/book?cancelled=1`,
      // All prices in the catalogue are GST-inclusive AU retail.
      submit_type: 'pay',
    })

    if (!session.url) return serverError('checkout:no-url', { sessionId: session.id })

    // 3. Link the row to the session so the webhook can settle it.
    const { error: linkError } = await db()
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    // Not fatal — the webhook also carries metadata.order_id as a fallback —
    // but worth shouting about, since it means orders may look unsettled.
    if (linkError) console.error('[checkout] could not attach session id', linkError)

    return json({ ok: true, url: session.url, orderId: order.id })
  } catch (err) {
    return serverError('create-checkout-session', err)
  }
}

export const config: Config = { path: '/api/create-checkout-session' }
