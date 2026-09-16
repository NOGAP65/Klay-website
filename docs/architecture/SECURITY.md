# Klay security state — 16 September 2026

This replaces the September 7–8 snapshot. It describes controls in the repository;
account settings and production database state must be verified separately.

## Implemented

- Exact customer routes; obsolete and unknown URLs return HTTP 404.
- Browser forms require same-origin JSON requests. Actual body bytes are bounded
  at 256 KiB, with an input timeout and rejection of unsupported encodings.
- Server validation checks field types/lengths, control characters, dates, phone
  numbers, product enums and quantities. Basket descriptions have a combined
  32,000-character budget. Database writes project only approved fields.
- Cloudflare Turnstile must succeed on hosted deployments. Missing/test secrets,
  wrong hostname/action, replayed/expired tokens and provider outages do not
  authorize submissions. There is an eight-second verification timeout.
- The widget clears expired tokens, refreshes after submissions, and offers a
  retry after script failure without losing customer-entered details.
- Netlify edge limit configuration: 10 requests/minute/IP/domain for each write
  API; 120 for order status. A bounded local limiter is a secondary backstop.
  Webhooks are signature authenticated and body limited, without a customer
  captcha or a low per-IP limit that could reject legitimate Stripe batches.
- Prices remain server computed. Checkout redirects accept only Stripe's
  checkout origin. Webhooks verify raw signed bytes and existing payment tests
  cover amount/currency checks and conditional state transitions.
- API errors and operational logs omit raw provider errors, submitted personal
  data and secrets. Order status never returns name, email or address.
- CSP restricts scripts, inline event handlers, frames and network destinations;
  clickjacking, MIME sniffing and checkout referrer protection are configured.
- Uploaded photos remain local to the browser. File size, raster signatures and
  decoded dimensions are checked; image dimensions are reduced for rendering.
  Preset photo requests stay on the site's image paths. PNG dimensions are
  checked before decoding; other raster dimensions are checked after decoding.
- CI gates high-severity runtime AND development dependency advisories, scans
  tracked/build output for selected high-confidence secret patterns, checks
  exposed source files, and runs regression tests. GitHub Actions are pinned;
  Dependabot and a weekly dependency audit are configured.

## Account actions still required

Follow [the security setup guide](../runbooks/security-setup.md). It includes
Turnstile keys/hostnames, the database migration, GitHub scanning and account
protection, Cloudflare's future custom-domain setup, and monitoring.

The additional SQL migration is prepared, **not applied to production**.
Cloudflare WAF, DNS, MFA, backup recovery and private account settings have not
been verified or changed in this session. A Netlify hostname in Turnstile's
hostname list does not establish Cloudflare reverse-proxy protection.

## Limits and accepted tradeoffs

This is not a penetration-test certificate or a claim that all vulnerabilities
are eliminated. The secret-pattern check does not prove the entire Git history
is clean. Enable provider secret scanning and rotate any exposed credentials.

Inline CSS remains allowed because the UI uses React inline styles; inline
JavaScript and eval are not allowed. Netlify rate limits have a short enforcement
delay and per-IP limits do not stop a distributed botnet. Server validation,
captcha and provider limits remain necessary behind a WAF.

Review production configuration and security alerts after every integration
change. Payment launch still requires Stripe configuration, confirmed pricing
and live-account acceptance tests; this work does not enable live payments.
