import * as THREE from 'three';

import { WALK_IN_FOOTPRINT_MM } from '@/features/joinery';

/** Open-front room with inward-facing walls. Outside faces are culled during
 * rotation so an exterior wall can never conceal the customer's wardrobe. */
export function createWalkInSurround(
  root: THREE.Group, modelId: string, wallMaterial: THREE.Material,
  disposables: { dispose(): void }[],
) {
  const width = WALK_IN_FOOTPRINT_MM / 1000;
  const wall = (x: number, z: number, rotation: number) => {
    const geometry = new THREE.PlaneGeometry(width + .012, 2.7);
    const mesh = new THREE.Mesh(geometry, wallMaterial);
    mesh.position.set(x, 1.35, z);
    mesh.rotation.y = rotation;
    mesh.receiveShadow = true;
    root.add(mesh);
    disposables.push(geometry);
  };
  wall(width / 2, -width - .006, 0);
  wall(width + .006, -width / 2, -Math.PI / 2);
  if (modelId === 'US01') wall(-.006, -width / 2, Math.PI / 2);
  const floorGeometry = new THREE.PlaneGeometry(30, 30);
  floorGeometry.rotateX(-Math.PI / 2);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d4cd, roughness: .96 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  root.add(floor);
  disposables.push(floorGeometry, floorMaterial);
}
