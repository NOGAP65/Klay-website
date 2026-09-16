# Walk-in wardrobes in the visualiser

The visualiser now offers the same two walk-in products as the shop: LS01 / Forma 4 (L-shaped) and US01 / Forma 5 (U-shaped). The older three artwork entries no longer appear as walk-in choices.

Product specifications and hardware finishes live in the joinery domain, shared by the shop, controls and enquiry configuration. Both layouts retain a 2400 × 2400 mm footprint, 2000 mm height and 447 mm shelf depth. The default is Forma 4, Matt Polar White and T24 Brushed Matt Black.

The existing on-demand 3D renderer draws perpendicular cabinet runs, four/eight drawers, rails and full-depth shelves. A walk-in starts facing the entrance with a wider interior camera; built-ins and shelving retain their 30-degree starting view. Finishes and layout changes preserve the customer's orbit within the same product family. Wall and hardware finishes repaint in place. The loading overlay, shared WebGL context, shadow-map refresh and stale-request protection remain in place.

## Regression coverage

- Product tests compare both layouts with the shop's definitions and enquiry details, including every hardware finish, fixed dimensions, drawer counts, finite geometry and non-overlapping corner shelves.
- Browser tests exercise both layouts on the standalone visualiser and homepage. They compare actual rendered pixels when changing white/black/oak, hardware, walls and layouts; check rotation/reset and the transition back to built-in wardrobes; and verify that the canvas is reused without page errors.
- Desktop Chromium, Android Chromium and iOS WebKit profiles cover light and dark colour schemes. Screenshots are inspected in addition to assertions. These profiles are browser emulations, not physical-device certification.
- Existing built-in, shelving, shop and delayed-loading regressions remain in the same test suite.
- Type, architecture, lint, asset, bundle-budget and security checks remain enabled; no new runtime library or image download is required.

Customer-photo placement remains unavailable for joinery, as before; these are interactive 3D product previews.
