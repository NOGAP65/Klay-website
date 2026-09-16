# Retired route cleanup — 16 September 2026

Only the active customer pages load the application: `/`, `/products`,
`/visualiser`, `/about`, `/contact`, `/how-it-works`, `/cart`, `/book`, and
`/booking/confirmed`. Query parameters still configure these existing pages.

## Changes

- Replaced the hosting-wide SPA rewrite with exact active-page rewrites and a
  final HTTP 404 response. Old product URLs, retired categories, misspellings,
  and unknown page URLs do not redirect to the shop or homepage.
- Added a small, script-free 404 document with recovery links and `noindex`.
  Client-side unknown navigation also displays a not-found page with `noindex`.
- Removed the legacy category/blind redirect component and unused product-slug
  and SKU tables. Retained product metadata still used by the visualiser basket.
- Removed footer policy links that all pointed to Contact rather than policies.
- Restricted API rewrites to the four implemented handlers and blocked access to
  the build manifest. Existing static assets remain accessible.
- Kept cart, enquiry, booking, and the payment confirmation return URL because
  they are part of active customer flows, even when absent from primary navigation.

## Verification

- TypeScript, architecture boundaries, lint rules/fixtures, asset checks,
  production build, and bundle budgets passed. Lint: 253 files, zero errors or
  warning regressions (461 existing recorded warnings).
- 33 targeted automated checks passed: hosting/router agreement, API mappings,
  standalone 404, all active page links, 12 retired/unknown URLs, shop choices,
  persisted cart/quote flows, and payment-return navigation.
- Browser coverage: desktop and Android Chromium, plus iPhone WebKit profiles,
  each in light and dark mode. These are browser emulations, not physical-device
  certification. Network submissions in browser checks were mocked.
- Before deployment, the live host returned HTTP 200 for `/products/dusk` and
  `/blinds`. Local preview tests do not reproduce Netlify's HTTP routing engine;
  deployed HTTP status checks are needed after publishing.

This reduces exposed unused routes. It is not a complete security audit.

## References

- [Netlify redirect options, custom 404 responses, and file shadowing](https://docs.netlify.com/manage/routing/redirects/redirect-options/)
- [Netlify request handling order](https://docs.netlify.com/resources/troubleshooting/request-chain/)
- [OWASP attack surface analysis](https://cheatsheetseries.owasp.org/cheatsheets/Attack_Surface_Analysis_Cheat_Sheet.html)
