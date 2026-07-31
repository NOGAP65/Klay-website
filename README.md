# Klay-website-viz

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-4dduj3fh)

Vite + React + TypeScript. Deployed on Netlify.

```bash
npm install
npm run dev        # Vite only, port 5173 — booking endpoints will 404
npm run typecheck  # tsc -b, the pre-commit gate (see note below)
```

> **`npx tsc --noEmit` checks nothing in this repo.** The root `tsconfig.json`
> is `{ files: [], references: [...] }`, and plain `tsc --noEmit` does not walk
> project references — it exits 0 without reading a file. Always use
> `npm run typecheck`, which runs `tsc -b` and covers `src`, `vite.config.ts`
> and the Netlify functions.

`npm run lint` currently crashes on every file: eslint 9.39.5 is installed
against `typescript-eslint` 8.x, and the `no-unused-expressions` rule signature
changed between them. Pre-existing, unrelated to booking; fixing it means
aligning those two versions.

---

## Booking and payments

`/book` turns a visualiser configuration into either a quote request or a paid
order. Both paths share one form; only the endpoint differs.

| Path | What happens |
| --- | --- |
| Request a quote | Row in `quote_requests`, alert to Klay, acknowledgement to the customer. No payment. |
| Pay & book | Stripe Checkout for the full amount, then a row in `orders` settled to `paid` by the webhook. |

The configuration travels in the URL (`/book?type=dual&size=large&op=motorised&qty=2`)
rather than in the zustand store, so a refresh or a shared link still quotes for
the right blind. `src/lib/bookingLink.ts` builds these; every "Book Installation"
CTA on the site uses it.

### Where the price comes from

`src/lib/pricing.ts` is the single source of truth, imported by **both** the
browser and the checkout function. The server never accepts an amount from the
client — it takes the configuration and re-derives the total. That is what stops
a hand-edited request buying a $2,000 job for a dollar.

> **`INSTALL_PER_BLIND` in `src/lib/pricing.ts` is a placeholder** (`$60`, with a
> `$120` call-out minimum). The configurator has always quoted installation
> separately, so no install rate existed in the code; charging in full needs one.
> **Confirm this before taking real payments.** Set it to `0` to drop
> installation from the total and quote it separately again.

Catalogue prices are treated as GST-inclusive AU retail, so the breakdown shows
the GST *contained* in the total (`total / 11`) rather than adding tax on top.

### Setup

**1. Database.** In Supabase → SQL Editor, run
`supabase/migrations/0001_bookings.sql`. It creates `quote_requests` and
`orders`, and enables RLS with no public policies — the tables are reachable
only by the service-role key the functions hold, so a leaked anon key reads
nothing.

**2. Environment.** Copy `.env.example` to `.env` for local work and set the
same keys in Netlify → Site configuration → Environment variables. Only
`VITE_`-prefixed vars reach the browser; nothing in `.env.example` is prefixed,
because all of it is secret.

**3. Stripe webhook.** Add an endpoint at
`https://<your-site>/api/stripe-webhook` subscribed to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Copy its signing secret into `STRIPE_WEBHOOK_SECRET`. **Without the webhook,
payments succeed but orders stay `pending_payment` forever** — the webhook is
the only thing that marks an order paid. Landing on the success URL proves
nothing; it is a URL anyone can visit.

**4. Email.** Verify a sending domain in Resend and set `KLAY_NOTIFY_FROM` to an
address on it. The `onboarding@resend.dev` default only delivers to your own
Resend account address, so customer acknowledgements will not arrive until this
is done. Email is best-effort by design: a send failure is logged and swallowed
so a mail misconfiguration can never lose an enquiry that is already in the
database.

### Running the functions locally

`npm run dev` serves Vite alone, so `/api/*` 404s and the UI reports that
booking is unavailable. To exercise the endpoints:

```bash
npx netlify dev    # serves the SPA and the functions together, port 8888
stripe listen --forward-to localhost:8888/api/stripe-webhook
```

Use Stripe's `4242 4242 4242 4242` test card.

### Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/request-quote` | POST | Store a quote request, notify both sides. |
| `/api/create-checkout-session` | POST | Re-price server-side, open Stripe Checkout. |
| `/api/stripe-webhook` | POST | Verify signature, mark orders paid. Idempotent. |
| `/api/order-status` | GET | Status for the confirmation page. Returns no personal data. |

Shared server code lives in `netlify/lib/` — deliberately *outside*
`netlify/functions/`, because every file in that directory is deployed as its
own endpoint.
