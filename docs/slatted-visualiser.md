# Venetian and plantation previews

The photo visualiser and homepage use the same Canvas 2D renderer, traced
perspective, supplier palettes and image-loading lifecycle. No additional 3D
runtime or product photography is downloaded for these two renderers. Timber
grain uses the existing neutralised supplier samples. Venetians offer only the
five UltraSlat colours. Colours remain canvas pixels in forced dark mode.

Venetians keep a fixed slat count during lift. Fully spaced upper slats remain
on their ladder pitch while lower slats gather onto the bottom rail and flatten
into the stack. Lift and tilt are separate preview controls. Motor operation
drives lift, leaving tilt independently adjustable. The manual tilt wand stays
attached to the headrail.

Plantation shutters have fixed outer frames and panel stiles, concealed tilt
links and rigid elliptical louvres. Tilt rotates each blade around its fixed
centre. There is no blind-style fabric roll or lifting stack. Motor operation
drives louvre tilt. Hinged panel opening is not simulated.

## Geometry assumptions

A customer supplies a photo and a size band, not surveyed dimensions or camera
calibration. Nominal widths are 900/1800/2700 mm; traced aspect ratio estimates
drop (bounded to 600–3600 mm). UltraSlat preview slats are nominally 50 mm.
Plantation blades use approximately 78 mm pitch,
48 mm stiles and 70 mm rails, with a divider rail above 1750 mm drop. These are
rendering assumptions, not added purchasable specifications. Actual dimensions,
panel divisions and product compatibility remain subject to measure.

The traced perimeter anchors the front installation plane. Frames no longer
move away from it when depth is added; blades tuck behind the frame. The default
slatted preview has a front-recess trace separate from the roller-fabric trace.
Surface gradients follow each slat's perpendicular and perspective taper, rather
than screen axes. Short overlapping strips prevent diagonal shading wedges and
anti-alias seams without adding a GPU dependency.

Reference mechanisms: [Luxaflex aluminium Venetians](https://www.luxaflex.com.au/products/venetians/aluminium-venetians),
[Luxaflex plantation shutters](https://www.luxaflex.com.au/products/shutters/plantation-shutters),
[timber shutters](https://luxaflex.co.nz/timber-shutters), and
[timber Venetians](https://luxaflex.co.nz/timber-venetian-blinds).
These inform the mechanisms; Klay's existing catalogue remains the source of
available colours, materials, operation options and price-on-measure behavior.

## Verification

`slatted-geometry.spec.ts` checks fixed counts, monotonically moving rails,
stack clearances, stable shutter pivots, closed blade overlap, all supplied
colours, independently configured windows and cart prices. Browser checks cover
room photos, tilted customer traces, lift, tilt, material and colour changes,
motor controls, downloads, cart persistence and theme changes. Profiles include
desktop, Android and WebKit iPhone emulation in light/dark modes, forced dark,
and a 320px basic-phone profile with WebGL disabled. Emulation does not replace
physical device verification or a measured installation.

Navigation is shared between homepage and visualiser. Available room previews
are grouped as Indoor window coverings and Wardrobes & shelving. Outdoor and
Mirrors & shower screens link explicitly to their filtered shop ranges.
