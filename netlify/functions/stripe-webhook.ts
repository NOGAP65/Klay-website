// ---------------------------------------------------------------------------
// POST /api/stripe-webhook
//
// Stripe's word on whether money actually moved. The success_url the customer
// lands on is NOT proof of payment — it is just a URL, and anyone can visit it.
// This endpoint is the only thing that flips an order to `paid`.
//
// Two rules it has to get right:
//
//   1. Verify the signature against STRIPE_WEBHOOK_SECRET before trusting a
//      single byte, using the RAW body. Parsing the JSON first would break the
//      signature check, so req.text() comes first and nothing else touches it.
//
//   2. Be idempotent. Stripe retries, and will happily deliver the same event
//      twice. The update is therefore conditional on the row not already being
//      paid, and the confirmation emails only fire when that update actually
//      changed something.
// ---------------------------------------------------------------------------

import type { Config } from '@netlify/functions'
import Stripe from 'stripe'
import { db } from '../lib/db'
import { env, missing } from '../lib/env'
import { json, methodNotAllowed, notConfigured, serverError } from '../lib/http'
import { confirmOrderPaid, notifyOrderPaid } from '../lib/notify'
import { blindLabel, sizeLabel, type BlindType, type WindowSize } from '../../src/lib/pricing'

/** Find the order for a session: by session id, falling back to the metadata
 *  order_id in case attaching the session id failed at checkout time. */
async function findOrderId(session: Stripe.Checkout.Session): Promise<string | null> {
  const metadataId = session.metadata?.order_id ?? session.client_reference_id
  if (metadataId) return metadataId

  const { data } = await db().from('orders').select('id').eq('stripe_session_id', session.id).maybeSingle()
  return data?.id ?? null
}

async function handlePaid(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = await findOrderId(session)
  if (!orderId) {
    console.error('[webhook] paid session with no matching order', session.id)
    return
  }

  const paymentIntent =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null

  // `.neq('status','paid')` is the idempotency guard: a duplicate delivery
  // matches no rows, so `updated` comes back empty and no second email is sent.
  const { data: updated, error } = await db()
    .from('orders')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_session_id: session.id,
      stripe_payment_intent: paymentIntent,
    })
    .eq('id', orderId)
    .neq('status', 'paid')
    .select('id, name, email, amount_cents, quantity, blind_type, window_size')

  if (error) {
    console.error('[webhook] could not mark order paid', error)
    return
  }
  if (!updated || updated.length === 0) {
    console.log(`[webhook] order ${orderId} already settled — ignoring duplicate`)
    return
  }

  const order = updated[0]
  const summary = `${blindLabel(order.blind_type as BlindType)} — ${sizeLabel(
    order.window_size as WindowSize,
  )} × ${order.quantity}`

  await Promise.allSettled([
    notifyOrderPaid({
      id: order.id,
      name: order.name,
      email: order.email,
      amountCents: order.amount_cents,
      quantity: order.quantity,
      summary,
    }),
    confirmOrderPaid({
      name: order.name,
      email: order.email,
      amountCents: order.amount_cents,
      summary,
    }),
  ])
}

/** Abandoned or failed sessions, so the orders table does not fill up with
 *  pending rows that will never settle. */
async function handleClosed(session: Stripe.Checkout.Session, status: 'expired' | 'failed'): Promise<void> {
  const orderId = await findOrderId(session)
  if (!orderId) return
  // Only ever downgrade something still pending — never touch a paid order.
  await db().from('orders').update({ status }).eq('id', orderId).eq('status', 'pending_payment')
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return methodNotAllowed('POST')

  const e = env()
  const gaps = [...missing(e, 'database'), ...missing(e, 'payments'), ...missing(e, 'webhook')]
  if (gaps.length > 0) return notConfigured(gaps)

  const signature = req.headers.get('stripe-signature')
  if (!signature) return json({ error: 'Missing stripe-signature header.' }, 400)

  // RAW body — must be read before, and instead of, any JSON parsing.
  const raw = await req.text()

  const stripe = new Stripe(e.stripeSecretKey)
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, e.stripeWebhookSecret)
  } catch (err) {
    // A bad signature is either a misconfigured secret or someone poking at
    // the endpoint. Either way: 400, and never process the payload.
    console.error('[webhook] signature verification failed', err)
    return json({ error: 'Signature verification failed.' }, 400)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        // With card payments this is already settled; async methods may not be.
        if (session.payment_status === 'paid') await handlePaid(session)
        break
      }
      case 'checkout.session.async_payment_succeeded':
        await handlePaid(event.data.object)
        break
      case 'checkout.session.async_payment_failed':
        await handleClosed(event.data.object, 'failed')
        break
      case 'checkout.session.expired':
        await handleClosed(event.data.object, 'expired')
        break
      default:
        // Everything else is subscribed-to noise; acknowledge so Stripe stops
        // retrying rather than 400-ing on events we simply do not need.
        break
    }
    return json({ received: true })
  } catch (err) {
    // 500 here makes Stripe retry, which is what we want for a transient fault.
    return serverError('stripe-webhook', err)
  }
}

export const config: Config = { path: '/api/stripe-webhook' }
