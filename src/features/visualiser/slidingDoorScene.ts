import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

import { joineryEnvironment } from './joineryEnvironment';
import { slidingDoorGeometry } from './slidingDoorGeometry';
import { addDoorBox, slidingDoorMaterials, type Disposables } from './slidingDoorMaterials';
import { slidingDoorRoom } from './slidingDoorRoom';
import { DEFAULT_WALL_COLOUR } from './wallColours';

import type { WardrobeScene } from './wardrobeScene';
import type { SlidingDoorConfig } from '@/features/joinery';

function illumination(scene: THREE.Scene, width: number, disposables: Disposables) {
  scene.add(new THREE.HemisphereLight('#ffffff', '#c4b8a3', .6));
  const key = new THREE.DirectionalLight('#fffaf4', 1.8);
  key.position.set(width / 2 - 3, 4, 4); key.target.position.set(width / 2, 1, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 3;
  key.shadow.normalBias = .003; key.shadow.bias = -.0001;
  const shadowSpan = Math.max(1.8, width / 2 + .4);
  Object.assign(key.shadow.camera, { left: -shadowSpan, right: shadowSpan, top: 1.8, bottom: -1.8, near: .1, far: 15 });
  key.shadow.camera.updateProjectionMatrix(); scene.add(key, key.target);
  const fill = new THREE.DirectionalLight('#f3f7ff', .3); fill.position.set(width, 2, 3); scene.add(fill);
  disposables.push(key.shadow);
}

function mirrorPanel(box: { x: number; y: number; z: number; w: number; h: number }, mirrors: Reflector[], disposables: Disposables) {
  const geometry = new THREE.PlaneGeometry(box.w / 1000, box.h / 1000);
  const mirror = new Reflector(geometry, { color: 0xbababa, textureWidth: 512, textureHeight: 512, multisample: 0, clipBias: .003 });
  // Unsigned-byte buffers also work on older mobile GPUs without renderable
  // half-float textures. No mutually recursive mirror passes.
  mirror.getRenderTarget().texture.type = THREE.UnsignedByteType;
  mirror.position.set((box.x + box.w / 2) / 1000, (box.y + box.h / 2) / 1000, box.z / 1000);
  const reflect = mirror.onBeforeRender;
  mirror.onBeforeRender = (...args) => {
    const visibility = mirrors.map(other => other.visible);
    mirrors.forEach(other => { other.visible = false; });
    try { reflect.apply(mirror, args); }
    finally { mirrors.forEach((other, index) => { other.visible = visibility[index]; }); }
  };
  mirrors.push(mirror); disposables.push(geometry, mirror); return mirror;
}

function panels(root: THREE.Group, config: SlidingDoorConfig, materials: Awaited<ReturnType<typeof slidingDoorMaterials>>, disposables: Disposables) {
  const geometry = slidingDoorGeometry(config), mirrors: Reflector[] = [];
  const isShaker = config.style === 'shaker';
  const frameMaterial = isShaker ? materials.board : materials.metal;
  for (const panel of geometry.panels) {
    const { x, y, z, width: w, height: h, thickness: d, stile, rail } = panel;
    const inset = { x: x + stile, y: y + rail, z: z + d - (isShaker ? 11 : 3), w: w - 2 * stile, h: h - 2 * rail };
    addDoorBox(root, { x, y, z, w, h, d: 6 }, materials.board, disposables);
    if (panel.isMirror) root.add(mirrorPanel(inset, mirrors, disposables));
    else addDoorBox(root, { ...inset, z: z + 5, d: inset.z - z - 5 }, materials.board, disposables);
    for (const [sx, sy, sw, sh, isHorizontal] of [[x, y, stile, h, false], [x + w - stile, y, stile, h, false],
      [x + stile, y, w - 2 * stile, rail, true], [x + stile, y + h - rail, w - 2 * stile, rail, true]] as const) {
      addDoorBox(root, { x: sx, y: sy, z, w: sw, h: sh, d, horizontal: isHorizontal }, frameMaterial, disposables);
    }
    if (isShaker) addDoorBox(root, { x: x + w - stile * .58, y: y + h * .48, z: z + d, w: 10, h: 128, d: 12 }, materials.metal, disposables);
  }
  for (const z of [-118, -70]) {
    addDoorBox(root, { x: 0, y: 0, z, w: geometry.widthMm, h: 12, d: 45, horizontal: true }, materials.metal, disposables);
    addDoorBox(root, { x: 0, y: geometry.heightMm - 34, z, w: geometry.widthMm, h: 34, d: 45, horizontal: true }, materials.metal, disposables);
  }
  return geometry;
}

export async function createSlidingDoorScene(options: { renderer: THREE.WebGLRenderer; config: SlidingDoorConfig; wallColour?: string }): Promise<WardrobeScene> {
  const { renderer, config } = options, disposables: Disposables = [];
  const scene = new THREE.Scene(), root = new THREE.Group(); scene.add(root);
  try {
    const materials = await slidingDoorMaterials(config, disposables);
    const geometry = panels(root, config, materials, disposables);
    const setWallColour = await slidingDoorRoom(root, { ...geometry, wallColour: options.wallColour ?? DEFAULT_WALL_COLOUR }, disposables);
    illumination(scene, geometry.widthMm / 1000, disposables);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.environment = joineryEnvironment(renderer).texture;
    scene.environmentIntensity = .35;
    return { scene, root, centre: new THREE.Vector3(geometry.widthMm / 2000, 1, 0),
      setWallColour, setHandleFinish: materials.paintMetal, dispose: () => disposables.forEach(item => item.dispose()) };
  } catch (error) { disposables.forEach(item => item.dispose()); throw error; }
}
