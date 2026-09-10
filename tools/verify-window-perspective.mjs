import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync('src/features/visualiser/homography.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { computeHomography, applyHomography, windowPlane, windowDepthProjection, isValidWindowQuad } =
  await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const near = (a, b, message) => assert.ok(Math.abs(a - b) < 1e-7, `${message}: ${a} vs ${b}`);

// Independently project a real rectangular opening with a pinhole camera.
// Tilt, yaw and roll are combined; this includes phones held off-level.
const width = 1600, height = 1200, focal = 1920, distance = 2500;
for (const yaw of [-1, -0.65, 0, 0.65, 1]) for (const tilt of [-0.35, 0, 0.35]) for (const roll of [-0.2, 0, 0.2]) {
  const rotate = ([x, y, z]) => {
    const a = x * Math.cos(yaw) + z * Math.sin(yaw);
    const b = -x * Math.sin(yaw) + z * Math.cos(yaw);
    const c = y * Math.cos(tilt) - b * Math.sin(tilt);
    const d = y * Math.sin(tilt) + b * Math.cos(tilt);
    return [a * Math.cos(roll) - c * Math.sin(roll), a * Math.sin(roll) + c * Math.cos(roll), d];
  };
  const physical = (x, y, z = 0) => {
    const p = rotate([x, y, -z]);
    return [width / 2 + focal * p[0] / (distance + p[2]), height / 2 + focal * p[1] / (distance + p[2])];
  };
  const source = [[-600, 400], [600, 400], [600, -400], [-600, -400]];
  const corners = source.map(([x, y]) => physical(x, y));
  const h = computeHomography(source, corners);
  const plane = windowPlane(corners);
  for (const drop of [0, 0.01, 0.25, 0.5, 0.7, 1]) for (const across of [0, 0.33, 0.5, 1]) {
    const expected = physical(-600 + across * 1200, 400 - drop * 800);
    plane(across, drop).forEach((v, i) => near(v, expected[i], 'Raised rail and fabric share the physical plane'));
  }
  const depth = windowDepthProjection(h, width, height);
  for (const z of [-40, 0, 40, 80]) for (const [x, y] of [[-400, 200], [300, -300]]) {
    const w = h[6] * x + h[7] * y + h[8] + depth.depth[2] * z;
    const actual = [(h[0] * x + h[1] * y + h[2] + depth.depth[0] * z) / w,
      (h[3] * x + h[4] * y + h[5] + depth.depth[1] * z) / w];
    actual.forEach((v, i) => near(v, physical(x, y, z)[i], 'Fold depth agrees with independent 3D camera'));
  }
  const photoQuad = corners.map(([x, y]) => [x, height - y]);
  assert.ok(isValidWindowQuad(photoQuad), 'Valid oblique opening accepted');
  assert.ok(!isValidWindowQuad([photoQuad[0], photoQuad[2], photoQuad[1], photoQuad[3]]), 'Crossed outline rejected');
  const inverse = computeHomography(corners, source);
  const centre = applyHomography(inverse, physical(50, 30));
  near(centre[0], 50, 'Round trip x'); near(centre[1], 30, 'Round trip y');
}
assert.ok(!isValidWindowQuad([[0, 0], [1, 0], [1, 0], [0, 1]]));
assert.ok(!isValidWindowQuad([[0, 0], [100, 0], [20, 20], [100, 100]]));
assert.ok(!isValidWindowQuad([[NaN, 0], [100, 0], [100, 100], [0, 100]]));
console.log('Window perspective: 45 camera angles, partial drops, 3D fold projection, inverse mapping and invalid outlines pass.');
