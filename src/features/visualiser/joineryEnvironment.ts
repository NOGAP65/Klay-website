import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const environments = new WeakMap<THREE.WebGLRenderer, THREE.WebGLRenderTarget>();
export function joineryEnvironment(renderer: THREE.WebGLRenderer) {
  const cached = environments.get(renderer);
  if (cached) return cached;
  const generator = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  const target = generator.fromScene(room, .04);
  room.dispose(); generator.dispose(); environments.set(renderer, target);
  renderer.domElement.addEventListener('webglcontextlost', () => {
    target.dispose(); environments.delete(renderer);
  }, { once: true });
  return target;
}
