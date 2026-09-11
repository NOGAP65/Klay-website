import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync('src/features/visualiser/blindLighting.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { sampleBlindLighting, blindTextureCoordinates } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const size = 100;
const opening = [[0.2, 0.2], [0.8, 0.25], [0.8, 0.8], [0.2, 0.85]];
function field(colourAt) {
  const pixels = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) pixels.set([...colourAt(x, y), 255], (y * size + x) * 4);
  }
  return pixels;
}
function finite(light) {
  assert.ok([...light.tint, light.exposure, ...light.daylight].every(Number.isFinite));
  assert.ok(light.daylight.every(value => value >= 0 && value <= 1));
}
const neutral = sampleBlindLighting(field(() => [215, 215, 215]), size, size, opening);
finite(neutral);
assert.deepEqual(neutral.tint, [1, 1, 1], 'Neutral walls cannot introduce a colour cast');
assert.ok(neutral.exposure > 0.95 && neutral.exposure < 1.03);

const warm = sampleBlindLighting(field(() => [225, 209, 188]), size, size, opening);
finite(warm);
assert.ok(warm.tint[0] > warm.tint[1] && warm.tint[1] > warm.tint[2], 'Warm walls gently warm white cloth');
assert.ok(warm.tint[2] > 0.9, 'Room adaptation must preserve the chosen fabric colour');

const green = sampleBlindLighting(field(() => [35, 180, 45]), size, size, opening);
assert.deepEqual(green.tint, [1, 1, 1], 'Foliage must not dye white blinds green');

const dim = sampleBlindLighting(field(() => [80, 80, 80]), size, size, opening);
assert.ok(dim.exposure < neutral.exposure && dim.exposure >= 0.82, 'Cloth follows room exposure within usable bounds');

// The privacy material receives only a smooth light field, never the scene.
const ramp = field(x => [60 + x * 1.8, 60 + x * 1.8, 60 + x * 1.8]);
const daylight = sampleBlindLighting(ramp, size, size, opening).daylight;
assert.ok(daylight[1] > daylight[0] && daylight[2] > daylight[3], 'Window illumination preserves its broad direction');
const noise = field((x, y) => (x + y) % 2 ? [220, 220, 220] : [50, 50, 50]);
const diffuse = sampleBlindLighting(noise, size, size, opening);
assert.ok(diffuse.daylight.every(value => value > 0.28 && value < 0.78), 'Spatial averaging removes high contrast scene detail');
finite(sampleBlindLighting(ramp, size, size, [[0, 0], [1, 0], [1, 1], [0, 1]]));

// Independently measure the texture coordinate travelled by a 10px strip of
// cloth and its bottom hem. Neither may stretch or slide as the blind opens.
for (const width of [180, 640, 1200]) {
  for (const drop of [300, 900, 1400]) {
    const full = blindTextureCoordinates(1.7, width, drop, 1);
    for (const position of [0.001, 0.01, 0.1, 0.5, 0.9, 1]) {
      const coords = blindTextureCoordinates(1.7, width, drop, position);
      assert.ok(Math.abs(coords.uvScale[1] + coords.uvOffset - full.uvScale[1]) < 1e-10, 'Bottom hem stays on the same cloth');
      const texelsPer10px = coords.uvScale[1] * 10 / (drop * position);
      assert.ok(Math.abs(texelsPer10px - full.uvScale[1] * 10 / drop) < 1e-10, 'Weave scale stays constant through movement');
    }
  }
}
assert.deepEqual(blindTextureCoordinates(2, 500, 800, -1), blindTextureCoordinates(2, 500, 800, 0));
assert.deepEqual(blindTextureCoordinates(2, 500, 800, 2), blindTextureCoordinates(2, 500, 800, 1));
console.log('Blind lighting: room adaptation, foliage rejection, diffuse daylight and unstretched fabric travel pass.');
