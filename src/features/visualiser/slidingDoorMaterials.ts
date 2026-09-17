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
  return { board, metal, paintMetal };
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
