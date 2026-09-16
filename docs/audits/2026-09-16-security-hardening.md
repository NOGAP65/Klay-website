# Security hardening — 16 September 2026

Scope: Klay's React application, four Netlify APIs, shared validation, photo
handling, deployment headers, dependency/build guards and deployment guidance.
No production email, payment, database mutation, DNS change or live load test was
performed by the automated tests.

## Findings addressed

| Finding | Change |
|---|---|
| Missing Turnstile secret silently disabled verification | Hosted submissions require a real secret; local bypass is explicit and loopback-only |
| Enquiries succeeded when the verification service failed | Both write APIs fail closed with bounded verification time |
| Successful verification was not bound to this site/form | Exact hostname and `customer_form` action are checked |
| Expired/spent tokens persisted in form state | Expiry clears them; each submission resets the widget; failed script loads can retry |
| JSON reads had no body limit | Streamed-byte budget, encoding/content-type checks and read timeout |
| Inputs were silently truncated or invalid configurations defaulted | Supplied malformed types/enums/quantities and excessive fields are rejected; checkout requires its configuration |
| In-memory rate limit reset per server instance | Native Netlify edge configuration plus a bounded local backstop using platform IP |
| Error paths could expose configuration details/provider data | Generic customer responses and redacted logs |
| Checkout accepted any HTTPS redirect | Only the Stripe checkout origin is allowed |
| Dynamic environment access could bundle unintended public variables | Explicit site-key access and guards against public secret-variable names |
| Photo inputs relied on supplied MIME type | Supported raster byte signatures, dimension checks and same-origin preset paths |
| Public database-role hardening needed another layer | Prepared migration revoking inherited PUBLIC grants and adding input bounds |
| Dependency/build regressions needed continuing checks | Full dependency audit gate, pinned Actions, Dependabot, weekly audit and secret/exposed-source checks |

Existing server-derived prices, escaped email output, signature verification,
payment-state checks and private-table design remain in place. No customer data
is added to browser storage by these changes.

## Verification

- Production verification: typecheck, architecture boundaries, lint regression,
  asset manifests, build, bundle budgets and security scan.
- 146 automated domain/browser checks passed: desktop/Android Chromium and iPhone
  WebKit, in light and dark modes. Includes all catalogue choices, cart/quote,
  navigation, photo loading/upload/recovery and visualiser controls.
- Six dedicated captcha checks passed on desktop, Android and iPhone profiles.
  The Cloudflare script/API, database and email calls are mocked in tests; they
  prove application behavior rather than production account configuration.
- The final 14-case server security suite passed, including the additional
  production checkout return-URL test (153 distinct checks across these runs).
- Synthetic secret and public-variable probes confirmed the build guards reject
  those mistakes; temporary probe files were removed and the clean scan passed.
- Security cases include malformed/oversized bodies, origin rejection, control
  characters, token configuration/hostname/action failures, provider outage,
  header spoofing, signed/tampered webhook bodies, redirect abuse, image formats,
  field projection and HTML-escaped emails.
- Dependency audit reported zero known vulnerabilities, including development
  dependencies. This is a point-in-time advisory check, not a safety guarantee.
- Browsers are emulated, not a certification across every physical device.

## Remaining account work

The [setup guide](../runbooks/security-setup.md) covers exact Turnstile variables,
Netlify rate-rule confirmation, Supabase migration, GitHub scanning/MFA, backups,
monitoring and the future Cloudflare custom-domain firewall. Those private
account settings and live database permissions were not inspected or changed.

The SQL migration is prepared, not applied. The static secret scan covers current
tracked files and deployment output, not every historical commit. A full
penetration test, verified backup restoration and payment-launch acceptance test
remain separate work.

## Primary guidance

- [OWASP input validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Cloudflare server-side Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Netlify native rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/)
- [Netlify function routing](https://docs.netlify.com/build/functions/configuration/)
