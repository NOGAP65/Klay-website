# SECURITY

**Reviewed 7–8 September 2026** against [OWASP Top 10:2025](https://owasp.org/Top10/2025/).

This is a working document, not a certificate. It records what has been checked and what
that check actually proved, what is deliberately accepted, and what must happen at launch.
**Nobody can certify a site as "safe"** — what follows is the honest state of a specific
codebase on a specific date.

---

## The state at a glance

| | |
|---|---|
| Dependency vulnerabilities | **0** — whole tree, dev included |
| Secrets in the browser bundle | **none** — scanned for 7 patterns |
| Payment amount | computed server-side; the client's figure is ignored |
| Stripe webhook | signature-verified against the raw body, idempotent |
| Database | RLS enabled, no policies, grants revoked from `anon` |
| Security headers | CSP, HSTS preload, `X-Frame-Options`, `nosniff`, Permissions-Policy |
| **Edge protection (WAF, bot, rate limit)** | **NONE — see Outstanding** |

---

## What was verified, and how

Claims here were checked rather than read. Where a check was run, it is named.

### Payments cannot be manipulated from the client

`create-checkout-session.ts` computes the amount with `priceOrder()` from the submitted
*configuration*. A price in the request body is never read. The classic
`{"amount": 1}` attack has nothing to attach to.

### The webhook is the only thing that marks an order paid

Landing on `success_url` proves nothing — it is a URL anyone can visit. `stripe-webhook.ts`
takes `req.text()` **before** anything parses the body, verifies with `constructEventAsync`,
and updates with `.neq('status','paid')` so Stripe's retries are no-ops rather than duplicate
emails.

### The service-role key cannot reach the browser

It is read from a non-`VITE_` variable inside `netlify/`. Vite only inlines `VITE_*`, so the
boundary is structural rather than a matter of care. `supabase/migrations/0001` enables RLS
with **no policies** and revokes grants from `anon` and `authenticated` — two independent
reasons a leaked anon key reads nothing.

### No secrets ship to the browser

`dist/` scanned for `sk_live`, `sk_test`, `rk_live`, `SUPABASE_SERVICE`, `service_role`,
`whsec_`, and Resend key shapes. **Zero real matches.** The 18 apparent `re_` hits are
three.js WebGL extension names (`re_compression_bptc`).

### `order-status` leaks nothing

Returns `status`, `amount_cents`, `quantity`. No name, email or address, though the row holds
them. The `session_id` is shape-checked before it reaches the database.

---

## Fixed in this review

### 1. Supply chain — OWASP A03:2025 · `ac85af7`, `5abc208`

10 vulnerabilities, 7 high. The one that mattered was **`react-router` — CSRF bypass allowing
action execution before a 400 response** ([GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2)).

**Nothing in CI was watching.** The workflow gated typecheck, build and lint while that
advisory sat in the lockfile waiting for somebody to run `npm audit` by hand. A dependency is
code you ship without reading it.

Now at **zero**, with a two-tier gate:

- **Blocking:** `npm audit --omit=dev --audit-level=high` — what actually ships
- **Advisory:** the full audit, printed, never failing the build

The split is deliberate. A dev-server vulnerability is the developer's machine; the deployed
artifact is static files on a CDN with no dev server in them. Gating on `critical` instead
would have let the HIGH advisory that prompted all this straight through.

### 2. The captcha failed open — OWASP A10:2025, CWE-636 · `53325e3`

`verifyTurnstile` ended in `catch { return null }`, and `null` means pass. **A network blip
between the function and Cloudflare turned the captcha off for its duration, silently.**

The fix was not "fail closed everywhere" — it was to stop the catch block deciding.
`onUnavailable` is a required argument, so each call site answers for itself:

| Endpoint | Mode | Why |
|---|---|---|
| `create-checkout-session` | `closed` | spends money; a retry is an annoyance, an unverified session is not |
| `request-quote` | `open` | nothing is charged; a lost enquiry costs more than some spam |

**`'open'` does not mean "captcha off".** A token Cloudflare *rejects* is refused under both
modes; only being unable to *ask* differs. Proven with six cases against the bundled module
with `fetch` made to throw.

### 3. The staging site was open to Google · `0adb0dc`

No `robots.txt`, and the SPA catch-all answered `/robots.txt` with `index.html` at HTTP 200.
A crawler that cannot parse a robots file concludes nothing is disallowed.

`scripts/emit-robots.mjs` now derives it from the deploy URL — `*.netlify.app` disallows, a
real domain allows, unparseable fails closed. **Nobody has to remember anything at launch;
pointing the domain at the site flips it.**

---

## Outstanding

### 🔴 No edge protection — blocked on the domain move

There is **no WAF, no bot filtering, no DDoS mitigation, and no working rate limit.**

`netlify/lib/rateLimit.ts` is an in-memory `Map` scoped to one function instance. Netlify
scales horizontally and instances cold-start, so "5 requests per minute per IP" is per
*instance* — in aggregate, close to unbounded. Its own header admits this.

**The fix is Cloudflare's free tier, not better code**: 5 custom WAF rules, 1 rate-limiting
rule, Bot Fight Mode, always-on DDoS. `rateLimit.ts` should be **deleted** once that rule
exists, rather than kept as something that reads like protection.

Cloudflare cannot front `*.netlify.app` — it works by being the domain's authoritative DNS.
So this waits for the cutover, and should happen *in the same move*: one nameserver change
gets the custom domain and the edge protection together.

### 🔴 The current live site has no HTTPS

```
https://klayinteriors.com.au  →  connection fails
http://klayinteriors.com.au   →  200
```

Browsers show "Not secure"; anyone on shared wifi can read or alter it. The migration to
Netlify fixes this — it is a reason to do the cutover, not a reason to delay it.

### 🟡 Email can be spoofed more easily than it should be

SPF is present and strict (`-all`). **DKIM and DMARC are both absent.** For a business that
emails customers, that is a real gap. Worth fixing while the DNS is being touched anyway.

### 🟡 `style-src 'unsafe-inline'` — accepted, registered as E-05

Inline styles are the house rule (ADR-003), and runtime-computed styles cannot be nonced.
Documented rather than quietly tolerated.

---

## Rules that must not be broken

### Both Turnstile keys, or neither

`TURNSTILE_SECRET_KEY` (server) and `VITE_TURNSTILE_SITE_KEY` (client) must both be set or
both absent. **One alone is a trap in either direction:**

| State | Result |
|---|---|
| Both set | ✅ correct — verified in production, 7 Sep 2026 |
| Neither | captcha off everywhere, honeypot and rate limit still apply |
| **Secret only** | **every form returns 400** telling customers to complete a challenge that never renders |
| Site key only | widget renders, server never checks it — decorative |

### The browser never talks to a third-party API directly

Browser → Netlify function → third party. Any key in a `VITE_` variable **is in the bundle
and is public.** This applies to the Field Insight integration: its client secret is
server-side only.

### Never fail open on a security control

The pattern in §2 above is now a whole OWASP category. If a service that guards something is
unreachable, refuse or queue — never silently succeed. That includes the Field Insight
handoff: a lead that cannot be delivered must be queued or the submission must fail loudly.

### A guard scoped by a path prefix must match at least one file

`asset-audit.mjs` tested a directory a refactor had moved and reported "0 unsafe" — a false
zero that would have deleted 5.3 MB of live build inputs. See
`docs/runbooks/verifying-source-transforms.md`; the same shape appeared twice in two days.

---

## Launch checklist

Ordered. Email is the only step that can break something people notice immediately.

1. **Cloudflare** — add `klayinteriors.com.au`, Free plan, let it scan DNS
2. **Verify these five survived the scan** before changing anything:

   | Type | Name | Value |
   |---|---|---|
   | MX | `@` | `klayinteriors-com-au.mail.protection.outlook.com` |
   | TXT | `@` | `v=spf1 include:spf.protection.outlook.com -all` |
   | TXT | `@` | `MS=ms23749046` |
   | CNAME | `autodiscover` | `autodiscover.outlook.com` |
   | CNAME | `enterpriseregistration` | `enterpriseregistration.windows.net` |

3. **Change nameservers** at the registrar → Cloudflare. Quiet time, not Friday afternoon
4. **Test email** to `hello@klayinteriors.com.au` before going further
5. **Netlify** — add the custom domain; **Cloudflare** — point at Netlify
6. **SSL/TLS → Full (strict)** ← anything else gives a redirect loop or an unencrypted origin hop
7. **Always Use HTTPS** → on
8. **Bot Fight Mode** → on
9. **Rate-limiting rule** on `/api/*`, then **delete `rateLimit.ts`**
10. Confirm `robots.txt` now says `Allow: /` — it should flip on its own
11. Add **DKIM** and **DMARC**

---

## How to re-run this review

```bash
npm audit --omit=dev --audit-level=high   # blocking gate: must exit 0
npm audit                                  # everything, dev included
npm run check:asset-paths                  # every literal asset path resolves
npm run baseline                           # 10 render cases
```

Scan the built bundle for secrets before any deploy that changes environment handling:

```bash
npm run build
grep -rEo "sk_live|sk_test|whsec_|service_role" dist/ | sort -u   # expect nothing
```
