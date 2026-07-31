// ---------------------------------------------------------------------------
// Outbound email via Resend.
//
// IMPORTANT: sending is best-effort and never fails the request. The database
// row is the record of the enquiry; email is only the nudge to go and read it.
// A wrong RESEND_API_KEY or an unverified sending domain must not lose Klay a
// lead, so every failure here is logged and swallowed.
// ---------------------------------------------------------------------------

import { Resend } from 'resend'
import { env, missing } from './env'
import { formatAUD, blindLabel, sizeLabel } from '../../src/lib/pricing'
import type { ParsedBooking } from './booking'

type SendResult = { sent: boolean; reason?: string }

async function send(to: string, subject: string, html: string, replyTo?: string): Promise<SendResult> {
  const e = env()
  const gaps = missing(e, 'email')
  if (gaps.length > 0) {
    console.warn(`[notify] skipped "${subject}" — ${gaps.join(', ')} not set`)
    return { sent: false, reason: 'not configured' }
  }
  try {
    const resend = new Resend(e.resendApiKey)
    const { error } = await resend.emails.send({
      from: e.notifyFrom,
      to: [to],
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    })
    if (error) {
      console.error('[notify] resend rejected the send', error)
      return { sent: false, reason: error.message }
    }
    return { sent: true }
  } catch (err) {
    console.error('[notify] send threw', err)
    return { sent: false, reason: 'threw' }
  }
}

/** Escape anything customer-supplied before it goes into an HTML email. */
const esc = (s: string | null | undefined): string =>
  (s ?? '—').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const row = (label: string, value: string | null | undefined) =>
  `<tr>
     <td style="padding:6px 16px 6px 0;color:#8A8580;font-size:13px;white-space:nowrap;vertical-align:top">${esc(label)}</td>
     <td style="padding:6px 0;color:#1C1810;font-size:14px">${esc(value)}</td>
   </tr>`

function detailsTable(b: ParsedBooking): string {
  const c = b.customer
  return `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    ${row('Name', c.name)}
    ${row('Email', c.email)}
    ${row('Phone', c.phone)}
    ${row('Address', [c.address, c.suburb, c.postcode].filter(Boolean).join(', ') || null)}
    ${row('Preferred date', c.preferredDate)}
    ${row('Blind', `${blindLabel(b.config.blindType)} — ${sizeLabel(b.config.windowSize)}`)}
    ${row('Operation', b.config.operation)}
    ${row('Quantity', String(b.config.quantity))}
    ${row('Fabric', b.fabricColour)}
    ${row('Hardware', b.hardwareColour)}
    ${row('Notes', c.notes)}
  </table>`
}

const shell = (heading: string, kicker: string, inner: string) => `
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#F5F2ED;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:32px;border-top:3px solid #C8973A">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#C8973A">${esc(kicker)}</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;color:#1C1810">${esc(heading)}</h1>
    ${inner}
  </div>
</div>`

/** Internal alert: someone asked for a quote. */
export function notifyQuoteRequest(b: ParsedBooking, id: string): Promise<SendResult> {
  const e = env()
  return send(
    e.notifyTo,
    `New quote request — ${b.customer.name}`,
    shell(
      'New quote request',
      'Klay Interiors',
      `${detailsTable(b)}
       <p style="margin:24px 0 0;font-size:14px;color:#1C1810">
         Estimate shown to the customer: <strong>${formatAUD(b.priced.total)}</strong>
       </p>
       <p style="margin:8px 0 0;font-size:12px;color:#8A8580">Reference ${esc(id)}</p>`,
    ),
    // Replying to the alert replies to the customer.
    b.customer.email,
  )
}

/** Customer acknowledgement for a quote request. */
export function acknowledgeQuoteRequest(b: ParsedBooking): Promise<SendResult> {
  return send(
    b.customer.email,
    'We have your request — Klay Interiors',
    shell(
      `Thanks, ${b.customer.name.split(' ')[0]}`,
      'Klay Interiors',
      `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#1C1810">
         We've got your request and we'll be in touch within one business day to
         arrange a measure-up. Here's what you sent through:
       </p>
       ${detailsTable(b)}
       <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8A8580">
         The estimate of ${formatAUD(b.priced.total)} is indicative only — your final
         quote is confirmed once we've measured.
       </p>`,
    ),
  )
}

/** Internal alert: money actually landed. */
export function notifyOrderPaid(args: {
  id: string
  name: string
  email: string
  amountCents: number
  quantity: number
  summary: string
}): Promise<SendResult> {
  const e = env()
  return send(
    e.notifyTo,
    `PAID — ${formatAUD(args.amountCents / 100)} — ${args.name}`,
    shell(
      'Payment received',
      'Klay Interiors',
      `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
         ${row('Name', args.name)}
         ${row('Email', args.email)}
         ${row('Order', args.summary)}
         ${row('Quantity', String(args.quantity))}
         ${row('Paid', formatAUD(args.amountCents / 100))}
       </table>
       <p style="margin:24px 0 0;font-size:13px;color:#8A8580">
         Order ${esc(args.id)} — book the measure-up and confirm with the customer.
       </p>`,
    ),
    args.email,
  )
}

/** Customer receipt. Stripe sends its own card receipt; this is the Klay one
 *  that says what happens next. */
export function confirmOrderPaid(args: {
  name: string
  email: string
  amountCents: number
  summary: string
}): Promise<SendResult> {
  return send(
    args.email,
    'Order confirmed — Klay Interiors',
    shell(
      `Thanks, ${args.name.split(' ')[0]}`,
      'Klay Interiors',
      `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#1C1810">
         Your order is confirmed and paid. We'll call within one business day to
         book your measure and install.
       </p>
       <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
         ${row('Order', args.summary)}
         ${row('Total paid', formatAUD(args.amountCents / 100))}
       </table>
       <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8A8580">
         Made to measure in Australia, installed by hand across Victoria.
       </p>`,
    ),
  )
}
