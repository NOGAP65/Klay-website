// ---------------------------------------------------------------------------
// THE TURNTABLE.
//
// The cabinet on its own, orbitable. Everything it is made of — the geometry,
// the projected artwork, the supplier's board, the shadows, the environment —
// is built by wardrobeScene, which the room view uses too. This file is the
// camera and the controls, and nothing else.
//
// That split is the point. The two views were separate renderers and they had
// drifted: the turntable had shadows and reflections and the room did not, so
// every fault reported against the room view was really the gap between them.
// One scene, two cameras, and a change to the cabinet cannot make them
// disagree.
//
// WHAT THE ARTWORK CANNOT DO, stated plainly: the camera that photographed the
// range never saw the side returns, so the pixels wrapped onto them are the
// front face's own, stretched along the depth axis. Within about forty degrees
// that reads as a plausible edge; past that it smears, which is why the orbit
// is clamped rather than free.
// ---------------------------------------------------------------------------

import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { LoadingIndicator } from '@/ds';
import { wardrobeModelById, DEFAULT_WIDTH_MM } from '@/features/joinery';

import JoineryOrbitControl from './JoineryOrbitControl';
import { onWallColour } from './wallColours';
import { buildWardrobeScene, MM, OPENING_HEIGHT_MM, type WardrobeScene } from './wardrobeScene';

export interface Wardrobe3DProps {
  modelId: string;
  colourName: string;
  /** Which width in the layout's range. Defaults to the layout's first. */
  selectedWidthMm?: number;
  /** Filled behind the cabinet, so the unit is not floating on black. */
  background?: string;
  /** The metalwork's finish. Optional so a caller that has not been given the
   * choice yet still renders the range's default. */
  handleFinish?: string;
  /** Built into an opening, or standing against a wall. */
  recessed?: boolean;
  /** The room's wall colour, hex. */
  wallColour?: string;
}

/** How far the view may be turned off dead-ahead. Measured rather than picked:
 * the projected pixels on a side return are the front face stretched, which is
 * convincing to about thirty degrees and gone past forty. */
const MAX_YAW = THREE.MathUtils.degToRad(40);
const INITIAL_YAW = THREE.MathUtils.degToRad(30);

export default function Wardrobe3D({
  modelId,
  colourName,
  selectedWidthMm,
  background = '#EFEDE8',
  handleFinish,
  recessed,
  wallColour,
}: Wardrobe3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [angle, setAngle] = useState(30);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retry, setRetry] = useState(0);
  const moveViewRef = useRef<((degrees: number | null) => void) | null>(null);
  const latest = useRef({ wallColour, background, handleFinish });
  useLayoutEffect(() => { latest.current = { wallColour, background, handleFinish }; }, [wallColour, background, handleFinish]);
  const viewRef = useRef({ yaw: INITIAL_YAW, polar: Math.PI / 2 - 0.015, zoom: 1 });
  // The live scene, so the two cheap changes below can reach it without the
  // effect that built it having to re-run. See WardrobeScene.setWallColour.
  const builtRef = useRef<WardrobeScene | null>(null);
  // Asks the loop for one frame. Held in a ref because the loop is created
  // inside the effect that builds the scene, and the repaint below has to reach
  // it without being a dependency of that effect.
  const invalidateRef = useRef<(() => void) | null>(null);

  // One graphics context for this viewer, reused across finish, width and model changes.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let isActive = true;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
    catch { void Promise.resolve().then(() => { if (isActive) setHasError(true); }); return () => { isActive = false; }; }
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // The stickers and the decor sheets are already tone-mapped photographs.
    // Running them through a filmic curve a second time greys them.
    renderer.toneMapping = THREE.NoToneMapping;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    rendererRef.current = renderer;
    const onLost = (event: Event) => { event.preventDefault(); setIsReady(false); setHasError(true); };
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    return () => {
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      rendererRef.current = null;
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [retry]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setIsReady(false);
    setHasError(false);

    const model = wardrobeModelById(modelId);
    const widthMm = selectedWidthMm ?? DEFAULT_WIDTH_MM;

    const renderer = rendererRef.current;
    if (!renderer) { setHasError(true); return; }

    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);

    let disposed = false;
    let cleanup = () => {};

    // Skip work cancelled by a remount or another selection before setup begins.
    Promise.resolve().then(() => disposed ? null : buildWardrobeScene({ renderer, modelId: model.id, colourName, widthMm, handleFinish: latest.current.handleFinish, recessed, wallColour: latest.current.wallColour }))
      .then(async built => {
        if (!built) return;
        if (disposed) {
          built.dispose();
          return;
        }
    // THE PAGE BEHIND THE ROOM TAKES THE WALL COLOUR TOO. The scene's own
    // background is what shows past the ends of the wall and above the ceiling
    // line; left at the panel's off-white it framed a repainted room in a
    // differently coloured void, which is the one thing that would make the
    // comparison useless. `background` stays the fallback for a caller that
    // has not been given a colour.
        builtRef.current = built;
        built.scene.background = new THREE.Color(latest.current.wallColour ?? latest.current.background);
        if (latest.current.wallColour) built.setWallColour(latest.current.wallColour);
        if (latest.current.handleFinish) built.setHandleFinish(latest.current.handleFinish);

        const resize = () => {
          const w = host.clientWidth || 800;
          const h = host.clientHeight || 600;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          invalidateRef.current?.();
        };
        resize();


        // Backed off far enough that the whole cabinet sits in frame with a
        // little air, whatever width the layout is.
        //
        // AND FURTHER NOW THERE IS A WALL AROUND IT. At 1.32 the opening filled
        // the frame edge to edge, which is the one framing that hides the thing
        // the wall was added for: you cannot see a robe is set INTO something if
        // the something is cropped off on all four sides. 1.72 leaves a band of
        // wall around the opening, which is what the supplier's own photographs
        // show and what makes the reveal read as a reveal.
        // THE OPENING IS THE SUBJECT, not the cabinet. The recess runs to a
        // 2700 ceiling with the 2016 unit standing in it, so framing on the
        // cabinet alone cropped the empty reveal above it — which is the part
        // that says the robe is set into a room rather than filling a hole cut
        // to its own size. See OPENING_HEIGHT_MM.
        const span = Math.max(widthMm / Math.max(camera.aspect, 0.45), OPENING_HEIGHT_MM) * MM;
        // 1.28 AGAINST THE OPENING, not 1.72. The multiplier was set when the
        // subject was the 2016 cabinet; measuring it against a 2700 opening
        // instead made the same number a third further back, and what filled
        // the space it opened up was FLOOR — the camera sits at about eye
        // height, so everything below the horizon is floorboards, and half the
        // frame went to them. The product ends up small and high.
        //
        // 2700 x 1.28 lands within a few millimetres of where 2016 x 1.72 did,
        // so the opening is framed the way it was while still being what the
        // framing is measured from.
        const dist = (span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * 1.28;
        // Aimed a little above the cabinet's own middle, so the opening is
        // centred in frame rather than the unit inside it.
        const aim = built.centre.clone();
        aim.y = (OPENING_HEIGHT_MM / 2) * MM;
        const saved = viewRef.current;
        camera.position.copy(aim).add(new THREE.Vector3().setFromSpherical(
          new THREE.Spherical(dist * saved.zoom, saved.polar, saved.yaw),
        ));
        camera.lookAt(aim);

        // Yield while the driver prepares shaders; stop promptly on a new selection.
        renderer.compile(built.scene, camera);
        const gl = renderer.getContext();
        const parallel = gl.getExtension('KHR_parallel_shader_compile');
        if (parallel) await new Promise<void>((resolve, reject) => {
          const started = performance.now();
          const ready = () => {
            if (performance.now() - started > 15_000) { reject(new Error('Graphics did not become ready')); return; }
            if (disposed || gl.isContextLost() || !renderer.info.programs?.some(program => !gl.getProgramParameter(program.program as WebGLProgram, parallel.COMPLETION_STATUS_KHR))) resolve();
            else window.setTimeout(ready, 10);
          };
          ready();
        });
        if (disposed) { if (builtRef.current === built) builtRef.current = null; built.dispose(); return; }
        const ro = new ResizeObserver(resize);
        ro.observe(host);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.copy(aim);
        controls.enableDamping = true;
        controls.dampingFactor = 0.075;
        // No panning. This is a product viewer, not a scene editor: the one
        // useful gesture is turning the cabinet, and a dragged-off-centre
        // wardrobe is just a lost customer.
        controls.enablePan = false;
        controls.minDistance = dist * 0.62;
        controls.maxDistance = dist * 1.5;
        controls.minAzimuthAngle = -MAX_YAW;
        controls.maxAzimuthAngle = MAX_YAW;
        // Kept near eye level. Looking down into the top of a wardrobe shows
        // the one surface the photograph has nothing to say about.
        controls.minPolarAngle = THREE.MathUtils.degToRad(62);
        controls.maxPolarAngle = THREE.MathUtils.degToRad(99);
        controls.rotateSpeed = 0.55;
        controls.update();

        // RENDERED ON DEMAND, NOT SIXTY TIMES A SECOND.
        //
        // The loop used to render every frame for the life of the component,
        // whether anything had moved or not. Measured at 4x CPU throttle a
        // frame costs 96ms — so the turntable was pinning a core to draw the
        // identical picture over and over, on a page where it is usually just
        // sitting there being looked at. That is the whole of "it lags", and it
        // is why it lagged even when nothing was being dragged.
        //
        // Nothing here animates on its own. The picture changes when the
        // customer turns it, when the box is resized, or when a colour is
        // repainted, and every one of those can say so. Idle now costs nothing,
        // which is what makes it run on a laptop.
        let raf = 0;
        let stopped = false;
        const invalidate = () => {
          if (!stopped && !raf && !document.hidden) raf = requestAnimationFrame(tick);
        };
        invalidateRef.current = invalidate;
        const syncView = () => {
          const yaw = controls.getAzimuthalAngle();
          viewRef.current = { yaw, polar: controls.getPolarAngle(), zoom: camera.position.distanceTo(aim) / dist };
          setAngle(Math.round(THREE.MathUtils.radToDeg(yaw)));
          renderer.domElement.dataset.viewAngle = String(THREE.MathUtils.radToDeg(yaw));
        };
        moveViewRef.current = (degrees) => {
          // Stop any remaining drag momentum before a button sets the view.
          controls.enableDamping = false;
          controls.update();
          const yaw = degrees === null ? INITIAL_YAW : THREE.MathUtils.clamp(
            controls.getAzimuthalAngle() + THREE.MathUtils.degToRad(degrees), -MAX_YAW, MAX_YAW,
          );
          const distance = degrees === null ? dist : camera.position.distanceTo(aim);
          const polar = degrees === null ? Math.PI / 2 - 0.015 : controls.getPolarAngle();
          camera.position.copy(aim).add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(
            distance, polar, yaw,
          )));
          controls.update();
          controls.enableDamping = true;
          syncView();
          invalidate();
        };
        controls.addEventListener('change', syncView);
        syncView();
        // The renderer survives scene replacements, but their shadow maps do
        // not. Refresh them BEFORE the first draw; otherwise the new materials
        // are initialized with missing shadows and only the background shows.
        renderer.shadowMap.autoUpdate = false;
        renderer.shadowMap.needsUpdate = true;
        renderer.render(built.scene, camera);
        setIsReady(true);
        renderer.domElement.style.cursor = 'grab';
        // Fires while the pointer drags AND while the damping settles after it
        // is let go, so the easing runs to a stop rather than freezing mid-way.
        controls.addEventListener('change', invalidate);

        function tick() {
          raf = 0;
          if (stopped || document.hidden) return;
          const moving = controls.update();
          renderer!.render(built!.scene, camera);
          if (moving) invalidate();
        }
        const onVisibility = () => {
          if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
          else invalidate();
        };
        document.addEventListener('visibilitychange', onVisibility);
        // Orbiting changes the camera, so subsequent frames reuse these shadows.
        invalidate();

        cleanup = () => {
          stopped = true;
          document.removeEventListener('visibilitychange', onVisibility);
          builtRef.current = null;
          invalidateRef.current = null;
          moveViewRef.current = null;
          controls.removeEventListener('change', invalidate);
          controls.removeEventListener('change', syncView);
          cancelAnimationFrame(raf);
          ro.disconnect();
          controls.dispose();
          built.dispose();
        };
      })
      .catch(() => {
        if (!disposed) {
          builtRef.current?.dispose();
          builtRef.current = null;
          setHasError(true);
        }
      });

    return () => {
      disposed = true;
      cleanup();
    };
    // The finish is a dependency because it is a MATERIAL on a scene built
    // once: left off, the picker wrote to the store, the store re-rendered this
    // component, and the effect declined to run — which looks exactly like a
    // control that does nothing.
    // NOT wallColour OR handleFinish — those repaint in place, below. Leaving
    // them here rebuilt the entire scene on every click of a swatch.
  }, [modelId, colourName, selectedWidthMm, background, recessed, retry]);

  /** Repaint the room. Two materials and a background — no geometry, no
   * textures, no environment. */
  const paint = (hex: string) => {
    const built = builtRef.current;
    if (!built) return;
    built.setWallColour(hex);
    built.scene.background = new THREE.Color(hex);
    invalidateRef.current?.();
  };

  // The committed colour, and the one a freshly-built scene has to catch up to.
  useEffect(() => {
    if (wallColour) paint(wallColour);
  }, [wallColour, modelId, colourName, selectedWidthMm, recessed]);

  // AND THE DRAG, which never reaches React at all — see publishWallColour.
  // Subscribed once for the life of the component, because the callback reads
  // the scene out of a ref rather than closing over it.
  useEffect(() => onWallColour(paint), []);

  useEffect(() => {
    if (!handleFinish) return;
    builtRef.current?.setHandleFinish(handleFinish);
    invalidateRef.current?.();
  }, [handleFinish]);

  return <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0, containerType: 'inline-size', containerName: 'joinery-preview' }}>
    {!isReady && !hasError && <LoadingIndicator overlay label="Loading 3D preview" />}
    {hasError && <div role="alert" style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'grid', placeContent: 'center', background, padding: 24 }}>
      <p>We couldn’t load this preview.</p>
      <button type="button" onClick={() => setRetry(value => value + 1)}>Try again</button>
    </div>}
    <div ref={hostRef} data-preview-loading={!isReady && !hasError} aria-label="Interactive 3D product preview" style={{ width: '100%', height: '100%', minHeight: 0 }} />
    <JoineryOrbitControl angle={angle} isReady={isReady} onRotate={degrees => moveViewRef.current?.(degrees)} onReset={() => moveViewRef.current?.(null)} />
  </div>;
}
