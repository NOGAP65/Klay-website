import * as THREE from 'three';

import { addDoorBox, doorTexture, type Disposables } from './slidingDoorMaterials';

export async function slidingDoorRoom(root: THREE.Group, dimensions: { widthMm: number; heightMm: number; wallColour: string }, disposables: Disposables) {
  const { widthMm: w, heightMm: h, wallColour } = dimensions;
  const wall = new THREE.MeshStandardMaterial({ color: wallColour, roughness: .96 });
  const trim = new THREE.MeshStandardMaterial({ color: '#eeeae2', roughness: .75 });
  const shadow = new THREE.MeshStandardMaterial({ color: '#292722', roughness: 1 });
  disposables.push(wall, trim, shadow);
  const box = (x: number, y: number, width: number, height: number) =>
    addDoorBox(root, { x, y, z: -160, w: width, h: height, d: 180, bevelMm: 0 }, wall, disposables);
  box(-6500, 0, 6500, 4400); box(w, 0, 6500, 4400); box(0, h, w, 4400 - h);
  addDoorBox(root, { x: 0, y: 0, z: -550, w, h, d: 12 }, shadow, disposables);
  for (const [x, width] of [[-6500, 6500], [w, 6500]]) {
    addDoorBox(root, { x, y: 0, z: 20, w: width, h: 90, d: 12 }, trim, disposables);
  }
  const floorTexture = await doorTexture('/images/shop/finishes/natural-oak.webp', disposables);
  floorTexture.repeat.set(10, 4);
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture, color: '#d3c8b5', roughness: .83 });
  const floorGeo = new THREE.PlaneGeometry(18, 18);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(w / 2000, -.003, 4);
  floor.receiveShadow = true; root.add(floor); disposables.push(floorGeo, floorMat);
  return (hex: string) => wall.color.set(hex);
}
