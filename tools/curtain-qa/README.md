# Curtain visual checks

This development-only harness renders the production curtain component over twelve traced room images. It is not linked from the website and is not included in the production build.

## Changes under review

- Sheers use a dedicated voile material with photographic fibre and fold detail. Blockout keeps its existing lighting treatment.
- Local wall light controls sheer warmth and brightness; the trees through the glass do not tint the cloth itself.
- Density remains additive where folds overlap, with a bounded grazing-angle response to avoid bright wire-like stripes.
- The measured track-to-hem height and rectified opening aspect set fold count. The default is 2400 mm, editable independently of pricing and remembered per trace.
- Softer lateral drift gives sheers some variation down the drop while preserving hanging strip length. Tracks use the traced plane for sheers.
- The existing shared screen coordinates and resized lighting buffers keep fabric, transparency and shadows aligned on phones.

## Coverage, 11 September 2026

The visual matrix contains garden room, bedroom, open-plan living room, oblique bedroom window, sliding doors, sash window, upward-tilted picture window, distant evening casement, short wide awning window, French doors, bay centre pane and steep upward tall window.

Captured and reviewed: twelve closed white sheer views, twelve partly open sand sheer views at a 390 px mobile viewport with DPR 2, twelve gathered charcoal sheer views, and six blockout comparison views. Browser captures report page errors. The phone interaction check covers the height input, invalid values, separate trace measurements and horizontal overflow.

Additional checks cover 216 combinations of physical width, drop, distance, focal length and yaw; 27 combinations of roll, yaw and tilt exercising both cloth types' hanging strips; conservation of fabric length while gathering; neutral/daylight/warm/dark room sampling; and the existing blind perspective checks. These numerical tests check geometry, not photorealism.

### Limits

The renderer estimates camera focal length when the photo provides insufficient perspective information. The height must be measured or reasonably estimated: an uncalibrated photograph cannot establish true dimensions. Extreme wide-angle lens distortion, furniture occlusion and a curtain wrapping around multiple bay planes are not reconstructed. The bay fixture tests its flat centre pane. Generated room fixtures are controlled visual examples, not evidence of testing every Australian home or every phone camera. Actual physical iOS/Android devices were not tested.

## Reproduce

Start the Vite development server on port 5173. Then run:

```sh
node tools/curtain-qa/prepare-reference.mjs
node tools/curtain-qa/capture.mjs final
node tools/curtain-qa/capture.mjs mobile "" "width=390&colour=sand&open=0.45"
node tools/curtain-qa/capture.mjs charcoal "" "colour=charcoal&open=1"
node tools/curtain-qa/capture.mjs blockout "garden,sliding,picture,casement,tall,awning" "type=blockout"
node tools/curtain-qa/check-phone.mjs
node tools/verify-curtain-scale.mjs
node tools/verify-curtain-drape.mjs
node tools/verify-curtain-cloth.mjs
node tools/verify-window-perspective.mjs
```

The comparison renderer is prepared from commit `b6579ce`; generated reference source and screenshots are ignored by Git. `contact-sheet.mjs` uses the bundled Sharp runtime, overridable with `CODEX_DEPENDENCIES_NODE`.

## Image generation provenance and briefs

Method: built-in image generation tool, three generations. The following are the generation briefs, condensed rather than verbatim transcripts. Full originals remain in the Codex generated-images directory for this task.

1. **Australian room set:** a 2×2 photographic contact sheet of unobstructed windows, no existing curtains. An oblique living-room sliding door, overcast sash window, wide picture window photographed with upward tilt, and a distant evening casement. Mix near/far framing, daylight and warm interior light. Saved as `rooms.webp`; original `exec-afe86fc6-3f34-43b1-8564-afdb1bdf1629.png`.
2. **Additional room set:** a 2×2 photographic contact sheet with a short wide bedroom awning window, angled timber French doors, a bay window and a tall fixed window photographed from a steep upward angle. Unobstructed openings, realistic Australian residential settings. Saved as `rooms-extra.webp`; original `exec-504ae4d4-df63-4bd3-8625-46ec2b3f8316.png`.
3. **Sheer material:** front-on white linen voile, eight natural hanging waves, fine fibres and restrained microcreases, full drop on a plain neutral grey background, soft light and no room or scenery baked into the cloth. Saved as `public/images/visualiser/textures/curtains/sheer-drape.webp`; original `exec-f7f8fbee-f25b-4c9e-b855-5d766a2d2cca.png`.

The room sheets are cropped only inside the test harness. The sheer material's interior six waves are registered individually to the cloth mesh. Source texture conversion uses WebP quality 95.

Fold-spacing reference: [Silent Gliss Wave workroom guidance](https://www.silentgliss.co.uk/fileadmin/redaktion/contentserv/Images/Web_Partner_Downloads/SGGB/Various_Documents/Wave_-_Curtain_Workroom_Guide.pdf), 80 mm carriers and roughly 2.1–2.3 fullness. One complete front/return wave spans two carriers; the preview uses 2.25 fullness.
