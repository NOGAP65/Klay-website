import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import { slidingMaterial, slidingMetals, type SlidingDoorConfig } from '@/features/joinery';
import { loadImage } from '@/shared';

export type Disposables = { dispose(): void }[];
export type DoorBox = { x: number; y: number; z: number; w: number; h: number; d: number; horizontal?: boolean; bevelMm?: number };

export async function doorTexture(url: string, disposables: Disposables) {
  const texture = new THREE.Texture(await loadImage(url));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.anisotropy = 4; texture.needsUpdate = true;
  disposables.push(texture); return texture;
}

function mirrorMaterial(disposables: Disposables) {
  // A quiet glass sheen without room imagery or reflection render passes.
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const sheen = context.createLinearGradient(0, 128, 128, 0);
  for (const [stop, colour] of [[0, '#a5b2b5'], [.32, '#ced8d8'], [.48, '#edf2ef'],
    [.58, '#f5f7f4'], [.72, '#cbd6d7'], [1, '#a2b0b4']] as const) sheen.addColorStop(stop, colour);
  context.fillStyle = sheen; context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  disposables.push(texture, material); return material;
}

export async function slidingDoorMaterials(config: SlidingDoorConfig, disposables: Disposables) {
  const finish = slidingMaterial(config.style, config.material);
  const texture = finish.texture ? await doorTexture(finish.texture, disposables) : null;
  const board = new THREE.MeshStandardMaterial({ color: texture ? '#ffffff' : finish.hex, map: texture,
    roughness: finish.grain ? .64 : .78, metalness: 0 });
  const metal = new THREE.MeshStandardMaterial();
  const paintMetal = (name: string) => {
    const colour = slidingMetals(config.style).find(option => option.name === name) ?? slidingMetals(config.style)[0];
    const isSilver = colour.name === 'Polished Silver';
    metal.color.set(colour.hex); metal.metalness = isSilver ? .88 : .18;
    metal.roughness = isSilver ? .21 : .46;
  };
  paintMetal(config.hardware); disposables.push(board, metal);
  return { board, metal, paintMetal, mirror: finish.mirror === 'none' ? null : mirrorMaterial(disposables) };
}

export function addDoorBox(parent: THREE.Object3D, box: DoorBox, material: THREE.Material, disposables: Disposables) {
  const geometry = box.bevelMm === 0 ? new THREE.BoxGeometry(box.w / 1000, box.h / 1000, box.d / 1000)
    : new RoundedBoxGeometry(box.w / 1000, box.h / 1000, box.d / 1000, 1, Math.min(box.bevelMm ?? 1.2, box.d / 4) / 1000);
  const position = geometry.attributes.position, normal = geometry.attributes.normal, uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) {
    const x = Math.abs(normal.getX(i)) > .7 ? position.getZ(i) : position.getX(i);
    const y = Math.abs(normal.getY(i)) > .7 ? position.getZ(i) : position.getY(i);
    uv.setXY(i, box.horizontal ? y / .6 : x / .6, box.horizontal ? x / 2.4 : y / 2.4);
  }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set((box.x + box.w / 2) / 1000, (box.y + box.h / 2) / 1000, (box.z + box.d / 2) / 1000);
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); disposables.push(geometry); return mesh;
}
