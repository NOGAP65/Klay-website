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
