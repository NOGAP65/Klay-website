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
import { applyCheckoutEvent, type PaymentOrder } from '../lib/paymentEvents'
import { paymentRepository } from '../lib/paymentRepository'
import { env, missing } from '../lib/env'
import { json, methodNotAllowed, notConfigured, serverError } from '../lib/http'
import { confirmOrderPaid, notifyOrderPaid } from '../lib/notify'
import { blindLabel, sizeLabel, type BlindType, type WindowSize } from '../../shared-core/pricing'

async function notifyPaid(order: PaymentOrder): Promise<void> {
  const summary = `${blindLabel(order.blind_type as BlindType)} — ${sizeLabel(order.window_size as WindowSize)} × ${order.quantity}`;
  await Promise.allSettled([
    notifyOrderPaid({ id: order.id, name: order.name, email: order.email,
      amountCents: order.amount_cents, quantity: order.quantity, summary }),
    confirmOrderPaid({ name: order.name, email: order.email, amountCents: order.amount_cents, summary }),
  ]);
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
    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded',
      'checkout.session.async_payment_failed', 'checkout.session.expired'].includes(event.type)) {
      await applyCheckoutEvent(event.type, event.data.object as Stripe.Checkout.Session, paymentRepository, notifyPaid);
    }
    return json({ received: true })
  } catch (err) {
    // 500 here makes Stripe retry, which is what we want for a transient fault.
    return serverError('stripe-webhook', err)
  }
}

export const config: Config = { path: '/api/stripe-webhook' }
