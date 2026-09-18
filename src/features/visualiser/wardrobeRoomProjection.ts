import * as THREE from 'three';

import { computeHomography, type Point } from './homography';
import { cameraFromQuad, projectorFromQuad } from './wardrobeGeometry';

import type { RoomDimensions } from './wardrobeRoomFit';

/** The measured wall supplies the scale. Changing product dimensions must not
 * change this projection. Depth uses the trace's estimated pose; fit uses only
 * the supplied measurements, so a tilted photo cannot create a false fit. */
export function wardrobeRoomCamera(corners: Point[], room: RoomDimensions, photo: { width: number; height: number }) {
  const { width, height } = photo;
  const pose = cameraFromQuad(corners, room.width, room.height, width, height);
  const plane = projectorFromQuad(corners, room.width, room.height, width, height);
  if (!pose || !plane) throw new Error('Please trace all four corners of the opening.');
  const h = computeHomography([[0, room.height], [room.width, room.height], [room.width, 0], [0, 0]], corners);
  const z = plane.depth(0, 0, 1) - plane.depth(0, 0, 0);
  const point = plane.project(0, 0, 1);
  const dx = point[0] * (1 + z) - h[2], dy = point[1] * (1 + z) - h[5];
  // World coordinates are metres; the calibrated plane is in millimetres.
  const m = 1000, near = .01, far = 100;
  const a = (far + near) / (far - near), b = -2 * far * near / (far - near);
  const projection = new THREE.Matrix4().set(
    (2 * h[0] / width - h[6]) * m, (2 * h[1] / width - h[7]) * m, (2 * dx / width - z) * m, 2 * h[2] / width - 1,
    (h[6] - 2 * h[3] / height) * m, (h[7] - 2 * h[4] / height) * m, (z - 2 * dy / height) * m, 1 - 2 * h[5] / height,
    a * h[6] * m, a * h[7] * m, a * z * m, a + b,
    h[6] * m, h[7] * m, z * m, 1,
  );
  const camera = new THREE.PerspectiveCamera();
  camera.position.fromArray(pose.position).multiplyScalar(.001);
  // Estimated photo axes are imperfect. A unit quaternion keeps Three's camera
  // inverse exact, so pose estimation cannot distort the measured front plane.
  camera.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(
    new THREE.Vector3(...pose.right), new THREE.Vector3(...pose.up), new THREE.Vector3(...pose.back))).normalize();
  camera.updateMatrixWorld(true);
  camera.projectionMatrix.multiplyMatrices(projection, camera.matrixWorld);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  return camera;
}
