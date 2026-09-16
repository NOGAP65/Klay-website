# Mobile visualiser compatibility

The reported S21 Ultra screenshots show opaque black curtain bands, inconsistent colours in dark mode and clipped portrait-photo actions. The same user reports the S26 Ultra working. The specific S21 GPU/browser combination was not available locally; its exact failure cannot be certified from desktop emulation.

## Findings and changes

- The curtain shader used `pow` with potentially negative bases, including an explicitly negative track-highlight input. GLSL defines these results as undefined even when the exponent is 2. Replaced squares with multiplication, guarded normalisation and clamped facing. The approved geometry and cloth motion remain in the main renderer.
- The site declared `color-scheme: light`, which does not exclude automatic browser darkening. Both early metadata and root CSS now use `only light`, retaining the authored light and charcoal surfaces and protecting fabric colours. This does not override OS-level accessibility filters or screen calibration.
- Swatches mixed `background` shorthand with `backgroundImage`/`backgroundSize`, triggering React warnings and potentially clearing texture styles during updates. Changed to `backgroundColor` in both the visualiser and shop.
- The inner photo-actions row did not wrap even though its parent did. Actions now wrap within the photo width, retain their full text and have 44px height.
- Curtain downloads selected the first canvas, which was only the background photograph. Export now synchronously redraws the WebGL layer and composites the photo, cloth and foreground in order. No permanent `preserveDrawingBuffer` allocation is needed.
- Fine-detail extraction no longer depends on Canvas2D `filter`, which is unavailable in some older Safari versions. Bounded resampling provides the same processing path across browsers.
- A WebGL failure used to leave a blank or stale curtain. Missing GPU support, shader compilation failures, context loss or detected opaque black corruption now select a Canvas2D renderer. It uses the same photographed fold source, dye colours, traced perspective, hardware options and controls. Its longest side is capped at 960 pixels and decoded photographs are reused. Cloth motion and lighting are simpler when GPU rendering is unavailable; this is not a claim of pixel-identical physics on unsupported graphics hardware.
- Corruption detection reads three small scanlines after a static repaint, not on animation frames. It is internal and adds no interface or user steps. Dark fabrics are excluded from black-band detection.
- The full mobile suite also exposed a search/filter race: rapid input after Clear all could merge with an earlier React Router snapshot and restore the removed facet. Browse updates now merge into the latest browser URL, which is updated before the concurrent render commits.

## Evidence and verification

`tests/visualiser-compatibility.spec.ts` exercises light/dark desktop Chromium, Android-sized Chromium and iPhone-sized WebKit, a 320px no-WebGL profile and Chromium automatic darkening. It checks actual screenshot swatch pixels, canvas colour changes, white-fabric black-band limits, rapid selections, uploads, tracing, complete JPEG output, action bounds, GPU context loss and deliberately corrupted shader output. Existing visualiser and commerce regressions run alongside it.

These are browser and capability simulations, not physical S21/A02/Safari-on-iPhone certification. Phone names/user-agent strings alone cannot emulate their GPU drivers. Recheck the reported S21 with the deployed build, including its browser's darken-websites setting. Keep that distinction when reporting test coverage.

Final checks: all 30 applicable new rendering scenarios passed. Two context-specific scenarios are intentionally skipped when WebGL is disabled. The broader run passed 137 tests and exposed the two filter-race failures described above; two other route tests crossed a local build replacement. After the fix and a stable rebuild, all 24 targeted route/filter checks passed across the six desktop/mobile light/dark profiles, including a new same-task input race regression. No failures remain unverified. Type checks, architecture, lint, asset validation, build and performance budgets pass.

On the neutral portrait reference, GPU white-fabric means differed by less than 0.1 of 255 per channel between desktop, Android-sized Chromium and iPhone-sized WebKit; the Canvas2D fallback differed by less than 4. All sampled white cloth regions had zero near-black pixels. These are reference-scene measurements, not display-calibration or physical-device guarantees. Entry JavaScript is 77,026 bytes gzip (20 bytes over the previous release); the new renderer support stays deferred. Published image bytes are unchanged.

## Primary references

- [Khronos GLSL ES specification: undefined inputs to exponential functions](https://registry.khronos.org/OpenGL/specs/es/3.2/GLSL_ES_Specification_3.20.html).
- [Chrome automatic dark theme and `only light` opt-out](https://developer.chrome.com/blog/auto-dark-theme?hl=en).
- [Three.js WebGLRenderer: WebGL1 no longer supported](https://threejs.org/docs/pages/WebGLRenderer.html).
