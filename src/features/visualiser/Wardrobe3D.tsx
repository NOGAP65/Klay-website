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

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { wardrobeModelById, DEFAULT_WIDTH_MM } from './wardrobes';
import { buildWardrobeScene, MM, OPENING_HEIGHT_MM, type WardrobeScene } from './wardrobeScene';
import { onWallColour } from './wallColours';

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
  // The live scene, so the two cheap changes below can reach it without the
  // effect that built it having to re-run. See WardrobeScene.setWallColour.
  const builtRef = useRef<WardrobeScene | null>(null);
  // Asks the loop for one frame. Held in a ref because the loop is created
  // inside the effect that builds the scene, and the repaint below has to reach
  // it without being a dependency of that effect.
  const invalidateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const model = wardrobeModelById(modelId);
    const widthMm = selectedWidthMm ?? DEFAULT_WIDTH_MM;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // The stickers and the decor sheets are already tone-mapped photographs.
    // Running them through a filmic curve a second time greys them.
    renderer.toneMapping = THREE.NoToneMapping;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);

    let disposed = false;
    let cleanup = () => {};

    buildWardrobeScene({ renderer, modelId: model.id, colourName, widthMm, handleFinish, recessed, wallColour })
      .then(built => {
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
        built.scene.background = new THREE.Color(wallColour ?? background);

        const resize = () => {
          const w = host.clientWidth || 800;
          const h = host.clientHeight || 600;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          invalidateRef.current?.();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(host);

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
        const span = Math.max(widthMm, OPENING_HEIGHT_MM) * MM;
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
        camera.position.set(aim.x, aim.y + span * 0.03, aim.z + dist);
        camera.lookAt(aim);

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
        let dirty = true;
        const invalidate = () => { dirty = true; };
        invalidateRef.current = invalidate;
        // Fires while the pointer drags AND while the damping settles after it
        // is let go, so the easing runs to a stop rather than freezing mid-way.
        controls.addEventListener('change', invalidate);

        let raf = 0;
        const tick = () => {
          raf = requestAnimationFrame(tick);
          // update() drives the damping and emits 'change' while it has work,
          // so it has to run every frame even when nothing is drawn.
          controls.update();
          if (!dirty) return;
          dirty = false;
          renderer.render(built.scene, camera);
        };
        tick();

        cleanup = () => {
          builtRef.current = null;
          invalidateRef.current = null;
          controls.removeEventListener('change', invalidate);
          cancelAnimationFrame(raf);
          ro.disconnect();
          controls.dispose();
          built.dispose();
        };
      })
      .catch(() => {
        /* a texture failed — leave the panel empty rather than half a cabinet */
      });

    return () => {
      disposed = true;
      cleanup();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
    // The finish is a dependency because it is a MATERIAL on a scene built
    // once: left off, the picker wrote to the store, the store re-rendered this
    // component, and the effect declined to run — which looks exactly like a
    // control that does nothing.
    // NOT wallColour OR handleFinish — those repaint in place, below. Leaving
    // them here rebuilt the entire scene on every click of a swatch.
  }, [modelId, colourName, selectedWidthMm, background, recessed]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return <div ref={hostRef} style={{ width: '100%', height: '100%', minHeight: 420 }} />;
}
