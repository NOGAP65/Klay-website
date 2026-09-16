import * as THREE from 'three';

import { WALK_IN_FOOTPRINT_MM } from '@/features/joinery';

/** A room entered through a wide cased opening, with continuous walls and
 * ceiling behind the joinery. Both layouts occupy the same finished room. */
export function createWalkInSurround(
  root: THREE.Group, wallMaterial: THREE.Material,
  disposables: { dispose(): void }[],
) {
  const width = WALK_IN_FOOTPRINT_MM / 1000;
  const ceilingHeight = 2.7, openingHeight = 2.4;
  const trim = new THREE.MeshStandardMaterial({ color: 0xf1f0eb, roughness: .85 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcfc5b7, roughness: .96 });
  disposables.push(trim, floorMaterial);
  const add = (name: string, geometry: THREE.BufferGeometry, material: THREE.Material) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.receiveShadow = true;
    root.add(mesh);
    disposables.push(geometry);
    return mesh;
  };
  const wall = (name: string, x: number, z: number, rotation: number) => {
    const geometry = new THREE.PlaneGeometry(width + .012, ceilingHeight);
    const mesh = new THREE.Mesh(geometry, wallMaterial);
    mesh.name = name;
    mesh.position.set(x, ceilingHeight / 2, z);
    mesh.rotation.y = rotation;
    mesh.receiveShadow = true;
    root.add(mesh);
    disposables.push(geometry);
  };
  const box = (name: string, dimensions: [number, number, number], position: [number, number, number], material = wallMaterial) => {
    add(name, new THREE.BoxGeometry(...dimensions), material).position.set(...position);
  };
  wall('Room back wall', width / 2, -width - .006, 0);
  wall('Room right wall', width + .006, -width / 2, -Math.PI / 2);
  wall('Room left wall', -.006, -width / 2, Math.PI / 2);
  const ceiling = new THREE.PlaneGeometry(width + .012, width + .15);
  ceiling.rotateX(Math.PI / 2);
  add('Room ceiling', ceiling, trim).position.set(width / 2, ceilingHeight, -width / 2 + .07);
  // The foreground wall continues outside the viewport, enclosing the opening
  // instead of leaving the room's cut edges silhouetted against a blank field.
  box('Entrance left wall', [8, openingHeight, .12], [-4, openingHeight / 2, .06]);
  box('Entrance right wall', [8, openingHeight, .12], [width + 4, openingHeight / 2, .06]);
  box('Entrance head', [width + 16, 4, .12], [width / 2, openingHeight + 2, .06]);
  box('Left architrave', [.065, openingHeight, .02], [-.0325, openingHeight / 2, .13], trim);
  box('Right architrave', [.065, openingHeight, .02], [width + .0325, openingHeight / 2, .13], trim);
  box('Head architrave', [width + .13, .065, .02], [width / 2, openingHeight + .0325, .13], trim);
  box('Back skirting', [width, .065, .016], [width / 2, .0325, -width + .002], trim);
  box('Left skirting', [.016, .065, width], [-.002, .0325, -width / 2], trim);
  box('Right skirting', [.016, .065, width], [width + .002, .0325, -width / 2], trim);
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  floorGeometry.rotateX(-Math.PI / 2);
  add('Room floor', floorGeometry, floorMaterial).position.x = width / 2;
}
