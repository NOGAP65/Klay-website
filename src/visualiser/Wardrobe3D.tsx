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

import { WARDROBE_HEIGHT_MM, wardrobeModelById, DEFAULT_WIDTH_MM } from './wardrobes';
import { buildWardrobeScene, MM } from './wardrobeScene';
import type { HandleTypeId } from './wardrobeHardware';

export interface Wardrobe3DProps {
  modelId: string;
  colourName: string;
  /** Which width in the layout's range. Defaults to the layout's first. */
  selectedWidthMm?: number;
  /** Filled behind the cabinet, so the unit is not floating on black. */
  background?: string;
  /** The pull's profile and finish. Both optional so a caller that has not
   * been given the choice yet still renders the range's default. */
  handle?: HandleTypeId;
  handleFinish?: string;
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
  handle,
  handleFinish,
}: Wardrobe3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);

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

    buildWardrobeScene({ renderer, modelId: model.id, colourName, widthMm, handle, handleFinish })
      .then(built => {
        if (disposed) {
          built.dispose();
          return;
        }
        built.scene.background = new THREE.Color(background);

        const resize = () => {
          const w = host.clientWidth || 800;
          const h = host.clientHeight || 600;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(host);

        // Backed off far enough that the whole cabinet sits in frame with a
        // little air, whatever width the layout is.
        const span = Math.max(widthMm, WARDROBE_HEIGHT_MM) * MM;
        const dist = (span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * 1.32;
        camera.position.set(built.centre.x, built.centre.y + span * 0.04, built.centre.z + dist);
        camera.lookAt(built.centre);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.copy(built.centre);
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

        let raf = 0;
        const tick = () => {
          raf = requestAnimationFrame(tick);
          controls.update();
          renderer.render(built.scene, camera);
        };
        tick();

        cleanup = () => {
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
    // The handle is BOTH of these and neither is optional: its profile changes
    // the geometry buildCarcass emits and its finish changes the material, so
    // the scene has to be rebuilt for either. Left off, the picker wrote to the
    // store, the store re-rendered this component, and the effect declined to
    // run — which looks exactly like a control that does nothing.
  }, [modelId, colourName, selectedWidthMm, background, handle, handleFinish]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%', minHeight: 420 }} />;
}
