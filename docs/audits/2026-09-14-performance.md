# Klay performance audit — checkpoint

The owner requested a full audit, then asked to push the completed work and continue tomorrow. This is a checkpoint, not a claim that every possible bug has been eliminated.

## Completed

- Published assets reduced from approximately **201.4 MiB to 48.0 MiB** (76% smaller). This measures the entire public directory, not a single page download.
- Deleted 38 confirmed unused images (63.6 MiB), recorded in `removed-images-2026-09-14.json`.
- Moved 90 supplier originals into the existing, ignored `assets-source/fabrics/cw` directory. They remain available locally for regeneration but are no longer deployed. Runtime swatches and textures remain unchanged.
- Converted large room/process photographs to quality-92 WebP without changing dimensions. Converted suitable masks, cut-outs and textures losslessly, checking alpha and every visible RGB pixel before removing each PNG.
- Removed the unused Canvas2D wardrobe component and its painter. Retained the live geometry in `wardrobeCarcass.ts` and walk-in placement in `walkInArtwork.ts`.
- Replaced the wardrobe asset tool's custom PNG codec with sharp. Corrected its obsolete source/output directories and updated it for WebP.
- Moved booking pages, API transport and booking links into `features/booking`; moved pricing into dependency-free `shared-core/pricing`, consumed by browser and server.
- Fixed the cart-to-booking handoff: basket requests now retain each product, quantity and option. Basket requests are quote-only; the server rejects them at the payment endpoint and stores their full description in the existing notes column. Existing single-blind payment pricing is unchanged.
- Added bounded cart quantities, descriptive quantity-button labels, readable quote text, malformed API response handling, a request timeout and real calendar-date validation.
- Added a page error boundary and reserved loading space. Hash navigation waits for a lazy section to arrive; navigation to another page resets scroll.
- Added wardrobe/shelving tabs to the standalone visualiser and loopback-host support. Existing rendering geometry, colours and configuration choices are preserved.
- Kept the designed palette consistent under light/dark OS preferences and increased form text to 16px to avoid iPhone focus zoom. No new theme switch was introduced.

## Verification

The production build and TypeScript checks pass, including server functions. Runtime import-cycle check reports zero cycles; all three custom lint-rule suites pass. Static asset paths, fabric-shot paths and wardrobe manifests pass. ESLint reports zero errors and 771 warnings; the warning backlog remains follow-up work.

All **34 Playwright browser/domain tests passed** against the production build on 14 September 2026 (1.9 minutes).

The repeatable Playwright suite covers desktop Chromium, Android Chromium emulation and iPhone WebKit emulation, each in light and dark preferences. It exercises public routes, image decoding, horizontal overflow, mobile menus, search/filter/sort, product configuration, persisted baskets, quote submission, contact validation/errors, payment-status responses, fabric changes, curtains and 3D orbit/reset. Domain tests cover all 72 roller price/quantity combinations, quote validation and storage, malformed JSON and invalid customer data.

All API writes in browser tests are intercepted. No emails, payments or real bookings were made. WebKit on Windows is browser-engine emulation, not testing on physical iOS hardware; Android is also emulated.

Run after building:

```sh
npm run build
npm run test:browser
```

The test runner starts its own production preview on port 4173. Install test browsers with `npx playwright install chromium webkit` on a new machine. Windows uses installed Edge for Chromium projects.

## Resume tomorrow

1. Extend coverage to photo upload/camera input, rotated-photo EXIF handling, invalid/oversized files, tracing/corner dragging, compare/export and rapid configuration changes. Check bitmap cleanup on unmount/error.
2. Finish the full catalogue configuration matrix, including every dependent size/material/finish and generated asset URL, rather than relying only on literal-path scanning.
3. Preserve configurations in direct visualiser enquiry links and mixed-window quote links; those legacy links still need the same full-job handoff now provided for baskets.
4. Review server payment/webhook idempotency and retry cases with mocked services and test-mode fixtures. Confirm the existing installation-price policy separately before changing prices.
5. Add performance budgets and responsive image variants where measurements justify them. Measure cold/throttled network and CPU, not just local startup.
6. Review the remaining lint/architecture warnings, error recovery, keyboard/focus behaviour, dark-mode contrast and real-device Safari/Chrome behaviour. Add the expanded browser suite to CI once the audit is complete.
7. Supplier sources are intentionally excluded from Git. Keep a durable source archive outside the deploy before replacing this workstation; they can also be recovered from the earlier Git revision.

## Guidance used

- [React: choosing state structure](https://react.dev/learn/choosing-the-state-structure): minimise duplicated state and derive values where possible.
- [Vite: build optimisations](https://vite.dev/guide/features#build-optimizations): keep heavyweight rendering behind asynchronous module boundaries.
- [Google: WebP](https://developers.google.com/speed/webp): use separate lossless and photographic compression policies.
- [web.dev: responsive images](https://web.dev/learn/design/responsive-images): match delivered images to their display needs; responsive variants remain a follow-up.
- [Playwright: emulation](https://playwright.dev/docs/emulation): test viewport, touch and colour preferences while distinguishing emulation from physical devices.

The existing feature-based architecture remains the foundation. No universal folder structure or wholesale framework replacement was needed.
