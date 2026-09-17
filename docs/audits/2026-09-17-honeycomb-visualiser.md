# Honeycomb window preview

Honeycomb lives under **Blinds → Honeycomb** on the homepage and standalone
visualiser. It shares the roller room presets, uploads, four-corner tracing,
loading lifecycle and export. Switching Roller/Honeycomb preserves the photo
and trace. Product choices come from the existing fabric library: Blockout or
Day & Night, the six supplied colours, size band and manual/motorised operation.
Cart/quote selections preserve each window independently; price remains on
measure. Preview lift and day/night balance are not order options.

## Reference and rendering

- [Luxaflex Duette photographs](https://www.luxaflex.com.au/products/softshades/duette-shades)
  show hollow side cells and a compressed stack at the moving bottom rail.
- [Luxaflex's Duo-Lite description](https://www.luxaflex.com.au/stories/roller-blinds-or-duette-shades-which-are-better)
  describes translucent and blockout fabrics combined under one headrail.

`honeycombGeometry.ts` keeps cell count constant through the lift and folds the
lower cells onto their rail. Day & Night has two conserved cloth stacks and a
separate moving middle rail. All rails and cell faces use the same traced
perspective. Size bands and trace aspect estimate visual scale; the nominal
32 mm cell pitch, 0.85 mm packed pitch and rail dimensions are **preview
assumptions**, not measured Klay product specifications or order dimensions.

`drawHoneycomb.ts` uses room-sampled lighting, subdued cloth shading, hollow
side cells and local contact shadows. Blockout is opaque; the day fabric uses
`honeycombTransmission.ts`, a cached, low-resolution software diffusion pass
that also works on Safari without Canvas filters. `honeycombMaterial.ts` extracts cached
neutral cloth grain from the existing owned shop photo; the supplied swatches
provide colour and weave. No supplier photograph is shipped as an asset.
Canvas2D uses the existing colour-protected surface and requires no additional
WebGL context. Failed supplementary textures retain a functional shaded preview.
Movement controls sit below the photo so small-screen previews remain unobstructed.
The renderer retains one decoded photo per mounted preview, including private
uploads, so movement does not repeatedly decode photographs or rebuild diffusion.

## Regression coverage

Domain checks sweep size bands, front/left/right traces, lift positions and
day/night balances to verify conserved cells, rail attachment and clearances.
Browser checks cover supplied colours, uploaded tilted photos, stacking, day
transmission, dark mode, export, same-photo product switching, motor movement,
missing textures and cart data on desktop/Android/iOS profiles, plus forced-dark
and WebGL-disabled Android. These are browser/device emulations, not physical
phone certification. Existing roller previews are checked alongside them.
