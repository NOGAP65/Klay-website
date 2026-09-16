# Klay security setup

Start with the current `klay-website.netlify.app` deployment. Do not move the
official domain or change business email records just to complete these steps.
Never paste secret keys into chat, browser code or Git.

## 1. Confirm Turnstile now

In Cloudflare, open **Turnstile** and edit the Klay widget (or create a Managed
widget). Its allowed hostnames must include `klay-website.netlify.app`. This works
without moving the domain's DNS. Copy the public site key and the secret key into
the Klay project's **Netlify → Project configuration → Environment variables**:

| Variable | Value | Scope |
|---|---|---|
| `VITE_TURNSTILE_SITE_KEY` | Public site key | Builds |
| `TURNSTILE_SECRET_KEY` | Matching secret key | Functions; mark secret |
| `TURNSTILE_ALLOWED_HOSTNAMES` | `klay-website.netlify.app` | Functions |
| `SITE_URL` | `https://klay-website.netlify.app` | Functions |

Use actual widget keys, not Cloudflare's documented test keys. Remove a production
`TURNSTILE_LOCAL_BYPASS` variable if present; the code ignores it on hosted builds.
Redeploy after changing the public key because it is compiled into the browser.
Additional preview hosts need explicit allowance in the Cloudflare widget too.

Hosted form submissions deliberately refuse to proceed when verification is
unconfigured or unavailable. After setup, test Contact and Request a quote once
with your own details. Confirm one record and the expected email, then test a
retry and a challenge expiry. Payment testing stays in Stripe test mode.

[Cloudflare widget setup](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/)
and [server validation requirements](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## 2. Confirm Netlify protection

The three customer APIs declare edge rate limits in their function configuration.
In the published deployment, inspect **Rate limiting** rules and confirm these:

| Path | Limit per IP and domain |
|---|---|
| `/api/request-quote` | 10 per 60 seconds |
| `/api/create-checkout-session` | 10 per 60 seconds |
| `/api/order-status` | 120 per 60 seconds |

These limits protect the Netlify origin even before Cloudflare fronts the custom
domain. Netlify enforcement can lag by up to 10 seconds; the application also
has a small local backstop. Do not stress-test a live site or add a tight customer
limit to Stripe's webhook.

Keep database, Stripe and Resend keys in the **Functions** scope. Do not expose
production credentials to untrusted deploy previews. Configure usage/billing
alerts and review unexpected function invocations or persistent 403/429/5xx.

[Netlify rate limits and verification](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/).

## 3. Apply database protections

In the intended Supabase project, confirm the existing tables belong to Klay and
take/verify a backup. In SQL Editor, run the repository's
`supabase/migrations/0002_security_constraints.sql` after migration `0001`.
The new migration does not delete data. It revokes browser-role access, fixes the
trigger's search path and adds bounds for new customer data. Existing rows are
not retroactively validated by the new constraints.

Check the Table Editor shows RLS on for `quote_requests` and `orders`. Neither
table should have public browser-access policies. The frontend should never have
the service-role key. Verify backup retention and perform a restoration rehearsal
in a separate project before treating backups as proven recovery.

This session prepared the migration; it did not connect to or modify Supabase.

## 4. Protect the accounts and repository

Enable passkeys or MFA for GitHub, Netlify, Cloudflare, Supabase, the domain
registrar, email administration and Stripe. Keep recovery codes offline and
remove old collaborators/tokens. Use scoped tokens instead of account-wide keys.

GitHub repository → **Settings → Code security**:

- Enable Dependabot alerts and security updates. The repository already contains
  update configuration and a weekly dependency-audit workflow.
- Enable secret scanning and push protection where the repository plan supports
  them. Investigate historical findings; deleting a leaked key from a file does
  not revoke it. Rotate any exposed key with its provider.
- Enable CodeQL default setup for JavaScript/TypeScript where available.
- Protect `main` from force pushes/deletion. Configure required checks in a way
  compatible with your authorised direct-push workflow; requiring pull requests
  would change that workflow.

The build's custom secret-pattern scanner is an extra guard, not a replacement
for GitHub scanning. It intentionally reports file paths without printing keys.

[GitHub CodeQL setup](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configure-code-scanning).

## 5. Add the Cloudflare firewall at domain cutover

A Netlify hostname registered in **Turnstile** protects challenges. It does not
put `netlify.app` DNS or its traffic under your Cloudflare account's WAF. For a
proxied website, use a hostname under a domain you control.

When the business is ready to move `klayinteriors.com.au`:

1. Export and verify current DNS records, especially MX, SPF, DKIM, DMARC and
   Microsoft/other email records. Use the current provider's values, not an old
   copied checklist. Keep mail-related records DNS-only.
2. Add the custom hostname in Netlify and follow its displayed DNS and certificate
   verification steps. Confirm the origin has a valid certificate first.
3. Add the domain to Cloudflare, verify the imported records, change nameservers
   through the registrar, and proxy only the website records once validated.
4. Set SSL/TLS to **Full (strict)**, then enable HTTPS redirect. Do not use Flexible.
   Confirm both the apex and `www` work and canonical redirects do not loop.
5. Enable the managed WAF ruleset included in the account's plan. Review Security
   Events for false positives before adding stronger bot/challenge rules.
6. For a Free-plan starter rate rule, match the two write API paths, count
   by IP, and start with 10 requests per 10 seconds and a 10-second block. This
   catches short bursts; Netlify separately enforces the one-minute limits.
   Free rules match paths, not HTTP methods. If the plan offers longer windows,
   use those after reviewing normal traffic.
7. Never challenge Stripe's webhook with a browser captcha. Exclude its exact
   path from your custom interactive-challenge rules while keeping signature
   checks and applicable managed protections. Broad Bot Fight Mode may not offer
   the exemptions you need; test integrations before switching it on.
8. Keep API and booking responses out of cache-everything rules. Leave Rocket
   Loader off so it does not reorder React/Turnstile scripts.
9. Add the actual website hostnames to Turnstile and server configuration, update
   `SITE_URL`, redeploy, then recheck forms, cart, visualiser and payment return.
10. Review direct-origin access. Cloudflare rules alone can be bypassed via an
    exposed Netlify alias; retain the origin's verification and rate limits. Any
    additional origin restriction must include a tested webhook path.

[Cloudflare domain setup](https://developers.cloudflare.com/fundamentals/manage-domains/add-site/),
[Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/),
and [rate-rule setup](https://developers.cloudflare.com/waf/rate-limiting-rules/create-zone-dashboard/).

## 6. Routine checks

Review security notifications, denied/failed API requests and dependency updates.
Never log customer form bodies, captcha tokens, secret keys or full payment URLs.
If adding error monitoring, enable personal-data scrubbing before capturing events.
Confirm backups, collaborator access and domain/certificate renewal periodically.
For an incident, revoke affected credentials, preserve access/audit logs, roll
back the deployment if appropriate, and verify recovery before reopening writes.
