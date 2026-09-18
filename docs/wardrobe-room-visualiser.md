# Wardrobes in a customer room

The built-in and walk-in wardrobe visualisers retain their default 3D preview.
“Visualise in your own room” opens a separate photo-and-measurement flow. Sliding
doors and shelving retain their existing 3D experience.

## Measurements and placement

- Customers trace four corners and enter clear width, height and depth in whole
  millimetres. The 2,000 mm height is a labelled starting estimate requiring
  confirmation, not an assumption about Australian houses.
- Catalogue dimensions remain authoritative: built-ins are 2,016 mm high and
  500 mm deep; both walk-in layouts occupy 2,400 × 2,400 mm and are 2,000 mm high.
- An oversized product is not rendered or squeezed into the photo. The result
  lists the excess on each axis. A fitting model stays at its catalogue height
  when the selected width changes.
- A recessed built-in uses the traced front plane, with its depth extending into
  the recess. An against-wall built-in uses its back plane. Walk-ins use the back
  wall and extend towards the camera. Changing fitting requires a new trace.
- Fit means dimensions within the entered space, not guaranteed installation
  clearance, access, wall squareness or absence of obstacles. Professional check
  measure remains necessary. Photos should show the empty space; furniture and
  doors in an uploaded photo are not removed automatically.

## Rendering and ownership

`wardrobeRoomFit` owns input validation and physical fit. `wardrobeRoomProjection`
maps the measured plane to the trace independently of product selection.
Depth perspective is an estimate from the photo. A single image without known
camera calibration cannot establish exact depth or physical measurements: see
[OpenCV's planar homography discussion](https://docs.opencv.org/4.5.1/d9/dab/tutorial_homography.html).

`WardrobeRoomStage` owns the photo resource and `WardrobeRoomPhoto` owns confirmed
measurements and trace. Existing upload safeguards validate raster bytes, bound
file size and pixel count, normalise orientation and resize to at most 1,600 px.
Photos stay in the browser. Their temporary URLs are released on replacement or
exit; no photo or measurements are submitted to a server by this feature.

`WardrobeRoomRenderer` owns one `wardrobeRoomEngine` instance per mounted preview.
It reuses the shared wardrobe geometry, materials and hardware. GPU output is
limited to 1,200 px on the longest side and composited over the retained photo.
Selection revisions reject stale asynchronous work. The previous completed frame
stays visible beneath the loading overlay. Removed scenes and renderers are
[explicitly disposed](https://threejs.org/docs/pages/WebGLRenderer.html).

If WebGL is unavailable or its context has been lost, the same millimetre carcass
is projected using Canvas 2D. Fit and finishes remain functional; lighting and
material detail are simplified. This does not claim equal graphics fidelity on
all hardware. Leaving the room flow returns to 3D and releases the uploaded photo.

## Verification

- `tests/wardrobe-room.spec.ts`: dimension boundaries, malformed measurements,
  both walk-in footprints and metric projection under near, distant and angled traces.
- `tests/wardrobe-room-preview.spec.ts`: actual uploads and tracing, oversize
  rejection, both walk-in layouts, visible finish/width changes, retained frames
  during delayed asset loads, and stale-selection protection.
- Browser coverage: desktop Chromium, narrow Android without WebGL, forced-dark
  Chromium and iPhone WebKit emulation. Emulation is not a physical-device lab.

Run the tests with the corresponding Playwright projects and run `npm run verify`
before publishing. The old `ROOM_VIEW_READY` flag and its unmeasured room renderer
have been removed; this path is now exercised through its visible entry point.
