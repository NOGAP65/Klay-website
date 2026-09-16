# Joinery scene replacement regression

Reproduced on the pre-fix viewer: the initial white wardrobe displayed correctly,
but selecting Black Ply left a flat wall-coloured canvas. Controls remained
enabled and no JavaScript error was raised, so the previous orbit/button tests
did not detect it.

The viewer retains one WebGL renderer and disables automatic shadow updates to
avoid redrawing static shadows while orbiting. Scene replacements create new
lights and shadow maps. The loading change added an immediate first render before
marking those maps dirty; this initialized the replacement frame without its
shadows. Moving the shadow refresh ahead of that first draw restores geometry
and finish colours. Ready is still set only after that draw. Subsequent orbit
frames reuse the shadow maps, preserving the on-demand rendering design.

The fix is in the shared wardrobe/shelving viewer, with no changes to product
configuration, materials, dimensions, pricing or security settings.

`tests/joinery-preview.spec.ts` examines captured product pixels for real geometry
and directional finish changes (white to black to oak), then exercises models,
widths, fitting, hardware, wall paint and orbit controls. It also holds a finish
download to check that the previous product remains behind the blurred loader,
and releases a superseded selection to check that it cannot replace the latest
choice. All changes must retain the same canvas/graphics context.

These are browser-engine/device-profile tests, not certification on every
physical Android or iPhone GPU. Reports and screenshots are generated under
`artifacts/validation-joinery-final/`.

Validation completed: 66 browser tests passed across desktop Chromium, Android
Chromium and iOS WebKit profiles in light and dark schemes (joinery, loading and
form validation); all 61 domain tests passed. Production build, type checks,
architecture, lint-regression, assets, performance budgets and security scanning
passed. Android shelving and iOS wardrobe screenshots were also inspected.

Follow-up coverage adds the embedded homepage viewer and shop photographs.
The tests rotate before changing finishes, preserve the chosen angle, and check
every built-in wardrobe/shelving model at its minimum and maximum shop width.
All 24 added homepage/shop cases passed across the same six browser profiles.
Mobile captures centre the photograph so sticky navigation cannot contaminate
the compared product pixels. WebKit's full model/width sweep has a larger test
time budget; individual loading expectations remain bounded.

The production site still served the earlier build because Netlify rejected
deployments at the security gate: its team account injects the unused shared
`VITE_HUBSPOT_ACCESS_TOKEN`. Both a retry and a clean-cache deploy reproduced
that failure. Klay has no HubSpot integration. Its Netlify build command now
unsets that single inherited credential before running the complete `verify`
pipeline. The security scanner and all its rules are unchanged, and no shared
team setting or credential was edited.

Commit `6479520` was published successfully by Netlify (deploy
`6aaa307f11ba490008ccd7a7`). Both the repository security scan and Netlify's
secrets scan passed. A process-isolation probe confirmed the inherited token
is removed while a different public secret still fails the unchanged scanner.
All 12 live-site homepage/shop preview cases passed on desktop Chromium,
Android Chromium and iOS WebKit profiles; the six additional standalone and
delayed-selection cases also passed locally.

The preceding full CI run identified two stale checks: upload validation still
expected the former generic error wording, and the iOS gallery test scrolled
to the heading rather than the lazy image. The tests now verify the current
explicit supported-format error and scroll the image itself into view. The
application's upload validation and lazy-loading behaviour are unchanged.
