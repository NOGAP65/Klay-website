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
Plantation blades use approximately 78 mm pitch,
48 mm stiles and 70 mm rails, with a divider rail above 1750 mm drop. These are
rendering assumptions, not added purchasable specifications. Actual dimensions,
panel divisions and product compatibility remain subject to measure.

The traced perimeter anchors the front installation plane. Frames no longer
move away from it when depth is added; blades tuck behind the frame. Venetians
and plantations share `slatted-living-room.webp`, a clear living-room opening
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

Reference mechanisms: [Luxaflex aluminium Venetians](https://www.luxaflex.com.au/products/venetians/aluminium-venetians),
[Luxaflex plantation shutters](https://www.luxaflex.com.au/products/shutters/plantation-shutters),
[timber shutters](https://luxaflex.co.nz/timber-shutters), and
[timber Venetians](https://luxaflex.co.nz/timber-venetian-blinds).
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

The new room was generated with the built-in image-generation tool, then encoded
as sRGB WebP (1254 × 1254, 150,906 bytes) at
`public/images/visualiser/rooms/slatted-living-room.webp`. The generated image
contains only the room; all coverings remain interactive Canvas 2D geometry.
The original bedroom image remains in use by other products.

Final generation prompt:

> Use case: photorealistic-natural. Asset type: bare room photograph for Klay's interactive Venetian blinds and plantation shutters visualiser. Create one square architectural interior photograph, 1536 x 1536. A restrained contemporary Australian living room in soft daylight: warm off-white plaster walls, light oak floor, just the edge of a low linen sofa below the window and a small side table off to the far right. The main subject is a large simple rectangular white-painted window opening with a clear 100mm-deep plaster recess. The ENTIRE window, its complete frame, all four inner recess corners, and the bottom sill must be fully visible with a generous clear wall margin around every edge. Window fills about 68% of image width and 68% height, centered; bottom sill well above the sofa. Nothing overlaps the window or its corners. Camera at window mid-height with a mild 15-degree oblique view, straight verticals and realistic coherent perspective, enough to clearly see one recess jamb and the sill. Simple thin white window frame at the BACK of the recess, two tall panes separated by one narrow central vertical mullion, no horizontal mullions, no handles sticking forward. Through the glass: a quiet, slightly soft Australian garden with lawn, a fence and distant small shrubs. Restrained natural exposure, visible indoor painted trim detail, soft directional daylight and real contact shadows. No curtains, no blinds, no shutters, no fabric, no pelmets, no people, no text or logos, no interior plant or furniture obscuring any of the four corners. This is a genuine-looking real-estate architectural photo, not a 3D illustration, not a close crop of the window. Make the four corners at the back of the reveal visually unambiguous so a shutter frame can later be overlaid snugly inside it.
