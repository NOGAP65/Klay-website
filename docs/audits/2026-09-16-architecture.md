# Klay architecture and performance — 16 September 2026

This continues the 14 September checkpoint. The current implementation decisions are in [ADR-027](../architecture/decisions/027-bounded-resources-and-enforced-dependencies.md).

## Measured changes

The static JavaScript dependencies of the homepage entry decreased from 152,039 bytes gzip early in this pass to approximately 74,819 bytes: a 51% reduction. This measures code loaded initially, not every asset a customer might download while using the entire site. The exact current values and filenames are generated in `artifacts/performance.json`.

| Measurement | Latest measured bytes | Enforced ceiling |
| --- | ---: | ---: |
| Initial JavaScript, gzip | 74,819 | 85,000 |
| All JavaScript, gzip | 325,940 | 360,000 |
| Largest deferred JavaScript chunk, gzip | 131,313 | 145,000 |
| Entire public directory | 50,318,372 | 51,000,000 |

The asset reduction from roughly 201.4 MiB to 48.0 MiB was completed at the previous checkpoint. This pass preserves those optimised photographs and textures; it does not claim a second image reduction or apply another lossy recompression. The current audit classifies 360 assets as referenced and retains 28 conservatively because their paths are constructed; it identifies no further unreferenced assets.

Startup no longer imports the offscreen shop and visualiser through shared product data. Fabric lookup avoids repeated array filtering. Photo replacement releases owned bitmaps and blob URLs, aborts pending loads and rejects stale results. Shared image retention is bounded. Scroll updates are local to navigation and stop changing after its threshold.

## Reliability changes

- Validated visualiser quotes retain all window and joinery configurations through navigation and reload.
- Malformed saved baskets cannot crash the basket or overwrite store actions.
- Invalid uploads show an error; rotated photographs respect EXIF orientation, and oversized decoded photos are downscaled.
- Failed asynchronous 3D scene construction offers a retry instead of an indefinitely empty preview.
- Payment callbacks validate the recorded amount, currency and session, settle once under concurrent delivery and retry database failures.
- Checkout cancellation retains the selected product options.
- The basket exposes its main content as an accessibility landmark.
- Shared dimensions and models no longer import rendering UI into the catalogue.

## Verification

The complete **85-test suite passed** against the production build (2.8 minutes): 36 domain tests, 48 browser scenarios across six desktop/mobile and colour-preference profiles, and one throttled-load test. After the final gallery-loading change, all seven affected performance/public-route checks passed again across the six browser profiles (46 seconds), including loading gallery images on scroll. The latest targeted run is recorded by Playwright in `test-results/results.json` and `playwright-report/`. The complete `npm run verify` gate also passes, including application/server/test type checks, architecture, asset validation, lint regression and production size limits.

Coverage includes public routes, image decoding, overflow, mobile navigation, search/filter/sort, basket persistence, quote validation/submission, mocked payment returns, colours, curtains, 3D orbit/reset, photo upload/tracing/export/reset and resource cleanup. Configuration checks cover all 21 catalogue products using dependent-choice pairs, 183 supplied fabric configurations, 90 sample assets, 28 joinery width configurations and 18 walk-in finish/handle combinations. This is not a Cartesian test of every possible independent option combination.

A cold-load test uses a 1.6 Mbps connection, 150 ms latency and 4× CPU slowdown. It records navigation/resource/LCP data and checks that 3D is absent from startup and that the homepage visualiser opens successfully. The first run exposed competition from eagerly loaded gallery images below the fold. Deferring those image requests reduced the observed hero LCP from 8,756 ms to 3,796 ms under that same throttling profile. These are individual local diagnostic runs, not production field Core Web Vitals or a guarantee for every connection.

Reproduce with:

```sh
npm run verify
npm run test:browser
```

Windows Chromium tests use installed Edge. New Linux CI machines install Chromium and WebKit. Legacy `verify-shop-widths`, `verify-walk-in-wardrobes` and `verify-cw-fabrics` entry points now delegate to the maintained domain suite rather than custom TypeScript loaders or workstation-specific browser paths.

## Limits that remain visible

- iPhone and Android coverage is browser emulation, not testing on physical phones. Camera hardware, actual mobile memory pressure and native sharing still require physical devices.
- External payment, database and email mutations are mocked in tests. No real customer requests, emails or charges were made.
- The 549 legacy complexity/style warnings remain tracked; new errors and warning regressions fail the build.
- Payment notifications have no durable outbox. Checkout request deduplication across separate HTTP requests is not implemented.
- CI/deployment configuration is updated locally; successful remote execution is only established after a future push and run.
- No finite test suite establishes that a website has no bugs or makes its architecture equivalent to a particular company's private system.
