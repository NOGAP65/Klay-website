# Klay reliability and forced-dark follow-up

## Reported problems

The customer reported wrong swatches and dark hardware in Chrome on an Android phone with forced dark enabled. The earlier `color-scheme: only light` opt-out alone did not cover the reported setting. They also reported a horizontal line in Essence Cyclone and requested a broader customer-journey audit with explicit loading feedback rather than blank previews.

## Changes

- Shop and visualiser colour samples are painted as sRGB canvas pixels; accessible names, keyboard buttons and selection rings remain normal controls. This includes fabric, hardware, joinery and wall swatches. No global forced-colours accessibility override is applied.
- Roller, curtain, venetian and plantation shop previews composite their existing photograph, masks, dye, weave, sheen and hardware into a single canvas. Automatic UI darkening cannot invert those layers individually. The original product photographs remain. Hover changes scale only, removing the previous desktop-only saturation/brightness change. Work buffers are bounded by displayed size and capped at 900 pixels; colour transitions stop when settled, and reduced motion is respected.
- Essence Cyclone's supplied swatch, texture and weave scan contain a white header. The shared scan inset excludes the top 4% when sampling these assets, so that header does not repeat as a horizontal stripe. Source supplier files are retained unchanged.
- Product-aware gold/charcoal loading indicators now follow actual photo, lazy-code and rendering completion. Fast updates keep the previous frame and defer the overlay briefly. Failures offer retry rather than silently leaving a blank or stale image. Reduced-motion users see a static mark.
- Follow-up requested by the customer: the loading mark now cycles through four gold line icons (blinds, curtains, wardrobes, shelving), changing about every 1.6 seconds. CSS animates only opacity and position; there is no React interval or artificial render delay. The status label continues to identify what is actually loading. Reduced motion shows one static icon. Six targeted desktop/Android/WebKit tests passed for the cycle, immediate removal on readiness, reduced motion and retry; type checks, changed-file lint, build and size budgets also passed. After this follow-up, startup JavaScript is 78,054 bytes gzip and all JavaScript is 333,961 bytes gzip, with image bytes unchanged.
- Async preview completion is associated with the active configuration. A late response cannot mark a newer selection ready. Shared image requests have a 25-second bound and failed cache entries can be retried.
- Room uploads use cancellation, visible errors and retry. Browsers without `createImageBitmap` use the standard image decoder. Valid image files with omitted MIME metadata are decoded rather than rejected; invalid bytes and oversized uploads remain rejected. Intermediate decoded image memory is released.
- Invalid, crossed, collapsed or out-of-photo outlines are rejected before rendering. Pointer cancellation clears the active drag. Downloads refuse a loading/failed preview instead of exporting an older selection, and explain unsuccessful exports.
- WebGL construction/context failures in wardrobes show a recoverable error while navigation and configuration remain available. Shader readiness is bounded, and the loading indicator clears only after the first frame. Existing curtain GPU-to-Canvas2D recovery remains in use.
- Form requests no longer require the newer `AbortSignal.timeout` API. Existing timeout semantics use `AbortController` and a cleared timer. Query changes also re-run anchor navigation. Motorised playback stops on product/operation changes.

## Validation

`tests/forced-dark.spec.ts` deliberately removes page colour-scheme opt-outs and enables Chromium automatic darkening. A CSS sentinel must visibly darken before comparisons are accepted. The test compares displayed screenshots, not only computed CSS or raw canvas values. Swatches and the four photographic product families must remain stable; changed fabric/hardware must still update. Both window visualisers are also checked. Fixed navigation and hover zoom are excluded from pixel comparisons; rounded-corner antialiasing against the deliberately changed page is cropped out.

`tests/reliability.spec.ts` adds failed/held image and code requests, retry, rapid product switches, missing masks, delayed-fabric download protection, absent browser capabilities, invalid traces, the Cyclone seam regression, every catalogue product's visible configuration fields and cart action, persisted cart contents, plus narrow/landscape/tablet layouts. Existing tests cover all option validation/price combinations, cart undo/recovery, quote links, navigation, focus management, forms, photo orientation/downscaling/export, GPU context loss and deliberately corrupted shader output.

Production verification has passed type checking, architecture boundaries/cycles, lint regression gates, asset manifests, build and performance budgets. Entry JavaScript: 77,650 bytes gzip; all JavaScript: 333,569 bytes gzip; published assets unchanged at 50,318,372 bytes. There are 462 pre-existing lint warnings and no new lint errors/regressions.

Final production-build run: **215 passed, 2 intentionally skipped, 0 failed**, across 217 scenarios in 10.5 minutes. The two skipped cases require losing/corrupting an existing WebGL context and do not apply to the profile where WebGL is disabled entirely. That profile's actual Canvas2D colour and download checks passed. Both forced-dark screenshot checks passed with page opt-outs bypassed. All 21 products completed the visible-field/configuration/cart flow in each of the six desktop/Android/WebKit light/dark profiles. Type checking was rerun after the last added responsive test; the changed/new modules and test files pass their lint checks, and `git diff --check` is clean.

Screenshots inspected include the gold loading state, Cyclone shop fabric, forced-dark roller fabric/hardware, 320px Android layout and landscape WebKit layout. The report, traces and screenshots remain in the ignored `test-results/` and `playwright-report/` directories; the source regression tests are versionable. No production push was performed during this audit.

## Photo-preserving loading follow-up

Loading now uses a lightly dimmed, blurred photograph with a compact charcoal and gold icon panel. Existing shop and visualiser canvases retain their previous frame while new assets arrive; a decoded room backdrop remains visible during category changes and lazy renderer downloads. The blur is applied directly to the image surfaces because the mobile WebKit screenshot did not consistently show backdrop filtering. Completed product surfaces have no blur, and loading has no minimum display duration. The icons remain static for reduced-motion users.

A slow preset-room change also exposed an outline-confirmation race: confirmation is now disabled while a replacement photo is pending or not yet synchronised with the trace state.

Final targeted production-build checks: **18 passed** across desktop Chromium, Android dark-mode emulation and iPhone/WebKit dark-mode emulation. These cover held room, code and fabric requests; picture retention; clearing blur and loaders when ready; four cycling icons; reduced motion; network retry; rapid category changes; and blocking downloads/outline confirmation for pending selections. Desktop and mobile screenshots were inspected. Type checking, the lint regression gate, production build and performance budgets pass.

## Limits

This is a local production-build audit using Chromium/Edge and Playwright WebKit, desktop/Android/iPhone metrics, light/dark preferences, automatic darkening, narrow/landscape/tablet viewports and simulated missing graphics/browser APIs. It is not physical-device certification for every Android GPU or iOS version. Retest the reported phone with the deployed build. OS-wide colour inversion, display filters and screen calibration are outside website control. WebKit emulation is not the installed Safari application on an iPhone. No live payment, order or email was sent; API requests are intercepted in browser tests. Stripe integration and the cybersecurity audit remain separate work.

## Primary references used

- [React Suspense](https://react.dev/reference/react/Suspense): effects and ordinary async image work do not automatically activate Suspense; explicit readiness/error state is necessary.
- [Chrome automatic dark theme](https://developer.chrome.com/blog/auto-dark-theme?hl=en): distinguish automatic recolouring from authored dark styling and test rendered output.
- [Android web-content dark themes](https://developer.android.com/develop/ui/views/layout/webapps/dark-theme): some user-agent darkening strategies override page theme choices; CSS declarations alone are not a universal guarantee.
- [WCAG status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): announce progress without moving focus.
- [Reduced motion](https://web.dev/articles/prefers-reduced-motion): provide a non-moving progress alternative.
- [Playwright emulation](https://playwright.dev/docs/emulation) and [network interception](https://playwright.dev/docs/network): test capability/viewport variations and injected failures while stating hardware limits.
- [AbortSignal.timeout compatibility](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static): avoid requiring this newer API for customer enquiries.
- [WebGL context loss](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event): graphics failure must be an explicit recoverable state.
