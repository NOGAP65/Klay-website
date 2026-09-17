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
calibration. Nominal widths are 900/1800/2700 mm; the traced homography and
estimated camera axes determine drop (bounded to 600–3600 mm), accounting for
side-view foreshortening. UltraSlat preview slats are nominally 50 mm.
Plantation profiles use the specified 89 mm blade width, 40 mm side stiles and
80 mm top/bottom rails for every size and trace. Each hinged panel has its own
40 mm stile on both sides, so two meeting stiles occupy 80 mm together.
The 14 mm elliptical thickness, maximum 82 mm pivot pitch and 80 mm divider rail
above 1750 mm drop remain rendering assumptions, not added purchasable options.
Actual dimensions, panel divisions and product compatibility remain subject to measure.

The available height after the rails determines each bank's row count, rounded
up so closed blades overlap. Wider openings add panels (maximum nominal 900 mm
per panel); taller openings add rows. Changing tilt or moving the camera closer
does not resize the physical blade profile. Without measured dimensions the
photo and chosen size band determine an illustrative layout, not an order plan.

The plantation frame is one flush face with apertures for the louvre banks.
Deep returns belong only to the inside of those apertures; the corners and
divider-rail intersections no longer contain overlapping cuboid end faces.
Fine butt joints and the meeting line between hinged panels remain visible.
Soft contact shade fades over the outer 12 mm of the shutter face, behind the
photographed reveal. It does not paint a raised border or shadow over the wall.

The traced perimeter anchors the front installation plane. Frames no longer
move away from it when depth is added; blades tuck behind the frame. Venetians
and plantations share `slatted-living-room-front.webp`, a front-on living-room opening
with all four corners unobstructed. Its trace follows the back of the reveal,
covering the existing sash while leaving the photographed jambs and sill visible.
The room picker and default preview resolve the same corners; uploaded photos
keep the customer's own trace. Roller and honeycomb previews keep their rooms.
The photo centre and a focal estimate of 0.9 times its longest side extend the
exact traced plane into depth. The front boundary still matches all four pins.
This is an uncalibrated camera estimate, not recovery of a photo's real lens or
surveyed dimensions. Cropped photos and irregular traces remain approximations.

Each blade is an extruded elliptical cross-section with visible curved faces,
surface normals and end caps. The view direction determines the visible faces
and blade overlap order. Solid frame returns show their side or underside at
oblique angles, with a small eased edge instead of a symmetric bevel gradient.
Matte shading uses those surface normals and the sampled room colour/exposure.
Opaque silhouette underpainting prevents the photo bleeding through joins
between subpixel curved patches. This remains Canvas 2D, with no GPU dependency.

Plantations use 48 cross-section facets, a restrained satin highlight, and five
samples across a broad room light. Rays intersect the neighbouring elliptical
blades, giving overlaps a soft shadow that moves with tilt. Ambient illumination
remains in shadow. Short contact shading at the blade ends seats them behind the
stiles; it is clipped to each blade, never painted over the room. This finish is
plantation-only; Venetian geometry, lighting and texture rendering are unchanged.
The 14 mm thickness is a visualisation assumption, not a new sale specification.

Reference mechanisms: [Luxaflex aluminium Venetians](https://www.luxaflex.com.au/products/venetians/aluminium-venetians),
[Luxaflex plantation shutters](https://www.luxaflex.com.au/products/shutters/plantation-shutters),
[timber shutters](https://luxaflex.co.nz/timber-shutters), and
[timber Venetians](https://luxaflex.co.nz/timber-venetian-blinds), and
[Norman's elliptical louvre specifications](https://orders.normanaustralia.com.au/documents/Specifications/Normandy%20Shutter%20Specifications%202024.pdf).
These inform the mechanisms; Klay's existing catalogue remains the source of
available colours, materials, operation options and price-on-measure behavior.

## Verification

`slatted-geometry.spec.ts` checks fixed counts, monotonically moving rails,
stack clearances, camera-correct depth at opposite yaw/pitch angles, stable
shutter pivots, closed blade overlap, all supplied
colours, independently configured windows and cart prices. Browser checks cover
room photos, tilted customer traces, lift, tilt, material and colour changes,
motor controls, downloads, cart persistence and theme changes. Profiles include
desktop, Android and WebKit iPhone emulation in light/dark modes, forced dark,
and a 320px basic-phone profile with WebGL disabled. Emulation does not replace
physical device verification or a measured installation.

The recess regression compares independent photo landmarks at all four edges:
the original sash must be covered and the surrounding reveal must remain visible.
Native-resolution open/closed/wood-finish crops make edge alignment inspectable
without relying on downscaled whole-room screenshots. Homepage category switches
also verify the rendered room matches the selected product's preset.

Navigation is shared between homepage and visualiser. Available room previews
are grouped as Indoor window coverings and Wardrobes & shelving. Outdoor and
Mirrors & shower screens link explicitly to their filtered shop ranges.

## Room image provenance

The room was edited with the built-in image-generation tool to give both products
a straight-on view, then encoded as sRGB WebP (1254 × 1254, 185,932 bytes) at
`public/images/visualiser/rooms/slatted-living-room-front.webp`. The generated image
contains only the room; all coverings remain interactive Canvas 2D geometry.
The superseded angled image was removed. Other products retain their room photos.

Final edit prompt:

> Use case: photorealistic-natural. Edit target: this bare living-room photo used underneath interactive window coverings. Change the CAMERA VIEW to precisely straight-on, square to the window wall, absolutely no side angle or camera roll. The sensor plane is parallel to the window wall; optical axis passes through the exact centre of the window. Window top and bottom are perfectly horizontal, both side jambs vertical, left and right edges the same height, no trapezoid or converging lines. Keep the warm neutral Australian living-room style, oak floor, linen seating only at the bottom corners, soft natural daylight and garden outside. Photograph the entire bare rectangular window and full 100mm-deep white reveal with all FOUR corners clearly visible and unobstructed. Keep a generous clear wall margin all the way around it. Centre the WINDOW in the square image, horizontally and vertically, filling approximately 70 percent of image width and 65 percent of height. Thin white window frame at the back of the reveal, two equal panes divided by one thin vertical centre mullion, no horizontal mullions. From this centred frontal camera, the white reveal is visible equally on the left and right, with top and bottom depth naturally visible. Real architectural photography, natural painted surface texture, subtle contact shadows, accurate exposure. No blinds, shutters, curtains, pelmets, fabric or objects overlapping the window. No text, logos or graphics. The precise front-facing viewpoint is the most important change.
