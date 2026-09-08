import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/features/catalogue/lib/awningColour.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { awningColourCurves } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const catalogue = readFileSync(new URL('../src/features/catalogue/constants.ts', import.meta.url), 'utf8');
const palette = name => {
  const block = catalogue.split(`export const ${name} = [`)[1]?.split(']')[0];
  assert.ok(block, `Missing ${name}`);
  return [...block.matchAll(/hex: '(#[A-Fa-f0-9]{6})'/g)].map(match => match[1]);
};

for (const hardware of [false, true]) {
  for (const hex of palette(hardware ? 'CASSETTE_COLOURS' : 'AWNING_COLOURS')) {
    for (const curve of awningColourCurves(hex, hardware)) {
      assert.equal(curve.length, 256);
      curve.forEach((value, index) => {
        assert.ok(Number.isFinite(value) && value >= 0 && value <= 1, `${hex}: invalid tone`);
        if (index) assert.ok(value >= curve[index - 1], `${hex}: reversed shadow`);
      });
    }
  }
}

// Natural cloth and White hardware must leave the original photograph intact.
for (const [hex, hardware] of [['#E6DFCF', false], ['#F2F1EE', true]]) {
  for (const curve of awningColourCurves(hex, hardware)) {
    curve.forEach((value, index) => assert.equal(value, index / 255));
  }
}

const recolour = (hex, hardware, pixel) => awningColourCurves(hex, hardware)
  .map((curve, channel) => curve[pixel[channel]] * 255);
const luminance = pixel => pixel[0] * 0.2126 + pixel[1] * 0.7152 + pixel[2] * 0.0722;

// Measured source-photo samples: the hanging valance is shaded, and must remain
// visibly darker than the canopy in both pale and dark fabrics.
for (const hex of palette('AWNING_COLOURS')) {
  const canopy = recolour(hex, false, [226, 216, 204]);
  const valance = recolour(hex, false, [201, 186, 168]);
  assert.ok(luminance(canopy) - luminance(valance) > 18, `${hex}: flattened cloth shading`);
}

// Black metal must retain a visible arm profile and joint shadows instead of
// clipping them to black or lifting the whole frame to pale grey.
const dark = recolour('#232527', true, [165, 155, 147]);
const lit = recolour('#232527', true, [210, 200, 190]);
assert.ok(luminance(lit) - luminance(dark) > 22, 'Black hardware lost its shading');
assert.ok(luminance(dark) > 2 && luminance(lit) < 90, 'Black hardware lost its finish');
console.log('Awning: all 12 finishes preserve tone order, source colours and shadow contrast.');
