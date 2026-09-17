import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { test } from '@playwright/test';

import { fieldsFor, withChoice, defaultSelection, configuredLine, priceFor, type Selection } from '../src/features/catalogue/configOptions';
import { CATALOGUE } from '../src/features/catalogue/constants';
import { fabricByName, fabricCollections, type FabricSample } from '../src/features/fabrics';
import { rollerGeometry } from '../src/features/visualiser/rollerGeometry';
import { normaliseRollerWeave } from '../src/features/visualiser/rollerWeave';
import { useVisualiserStore as store } from '../src/features/visualiser/useVisualiserStore';

import type { Point } from '../src/features/visualiser/homography';


test('front-feed cloth stays on the barrel circumference and the weight never retracts through it', () => {
  const openings: Point[][] = [
    [[100, 100], [700, 100], [700, 900], [100, 900]],
    [[150, 80], [670, 170], [650, 780], [120, 920]],
    [[100, 180], [640, 90], [670, 900], [120, 780]],
  ];
  const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  for (const opening of openings) {
    let previous = rollerGeometry(opening, 0);
    const railHeight = distance(previous.hemL, previous.railL);
    for (let step = 0; step <= 100; step++) {
      const g = rollerGeometry(opening, step / 100);
      assert.ok(distance(g.tangentL, opening[0]) > 2, 'Fabric must leave the circumference, not the axle');
      assert.deepEqual(g.cloth[0], g.circle(0, 0), 'Front cloth is physically attached to the end-cap rim');
      assert.deepEqual(g.crown[3], g.cloth[0], 'Crown and drop cannot separate during unwinding');
      assert.ok(distance(g.hemL, g.tangentL) > 2 * g.radius * g.leftH, 'Hem remains outside the barrel');
      assert.ok(Math.abs(distance(g.hemL, g.railL) - railHeight) < .15, 'Weight retains its thickness at initial opening');
      assert.ok(g.radius <= previous.radius, 'Roll shrinks as cloth is paid out');
      assert.ok(Math.abs(g.radius * g.hubScale - previous.radius * previous.hubScale) < 1e-10,
        'Only wound cloth changes diameter; the hardware hub cannot inflate');
      assert.ok(distance(g.hemL, opening[3]) <= distance(previous.hemL, opening[3]), 'Hem lowers continuously');
      previous = g;
    }
    assert.deepEqual(previous.hemL, opening[3], 'Closed blind still reaches the traced bottom');
    assert.deepEqual(previous.hemR, opening[2]);
  }
});

test('roller weave keeps yarn detail without baking scan lighting into the fabric', () => {
  const width = 240, height = 160;
  const scan = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4;
    const value = 65 + x * .55 + (x % 2 ? 9 : -9);
    scan.set([value, value, value, 255], offset);
  }
  normaliseRollerWeave(scan, width, height);
  for (const x of [30, 100, 200]) {
    const offset = (80 * width + x) * 4;
    const mean = (scan[offset] + scan[offset + 4]) / 2;
    assert.ok(Math.abs(mean - 128) <= 2, 'Lighting gradient must not change the dye');
    assert.ok(scan[offset + 4] - scan[offset] >= 14, 'Fine yarn texture must remain');
    assert.equal(scan[offset + 3], 255);
  }
});


test('supplied fabric assets have unique identities and exact deployed paths', async () => {
const samples: FabricSample[] = JSON.parse(await fs.readFile('src/features/fabrics/samples.json', 'utf8'));
const files = new Set((await fs.readdir('public', { recursive: true })).map(f => '/' + f.replace(/\\/g, '/')));
assert.equal(samples.length, 90);
assert.equal(new Set(samples.map(s => s.id)).size, samples.length);
let bytes = 0;
for (const sample of samples) {
  assert.match(sample.hex, /^#[a-f0-9]{6}$/);
  for (const key of ['texture', 'renderTexture', 'weaveTexture'] as const) {
    assert(files.has(sample[key]), `Exact asset path missing: ${sample[key]}`);
    bytes += (await fs.stat(path.join('public', sample[key]))).size;
  }
}


console.log('90 supplied samples; ' + bytes + ' asset bytes verified.');
});

function checkColours(item: typeof CATALOGUE[number], initial: Selection, variant: string) {
  const fields = fieldsFor(item, initial);
  const colourField = fields.find(f => f.id === 'colour')!;
  assert.ok(fields.indexOf(colourField) > fields.findIndex(f => f.id === 'variant'), 'Type must precede colour');
  for (const colour of colourField.choices) {
    const selection = withChoice(item, initial, 'colour', colour.id);
    assert.ok(fieldsFor(item, selection).every(f => f.choices.some(c => c.id === selection[f.id])), 'Dependent selection invalid');
    assert.equal(configuredLine(item, selection).fabricColour, colour.label, 'Cart loses real fabric name');
    assert.equal(fabricByName(colour.id)?.hex, colour.hex, 'Palette/preview colour mismatch');
    if (item.id === 'roller-blinds') {
      assert.equal(priceFor(item, selection), variant === 'dual' ? 320 : 220, 'Existing small manual price changed');
      store.getState().setBlindType(variant as 'blockout' | 'lightfilter' | 'sunscreen' | 'dual');
      store.getState().setFabricColour(colour.id);
      assert.equal(store.getState().fabricColour, colour.id, 'Visualiser loses selected range');
      assert.equal(store.getState().getFabricColor(), colour.hex, 'Visualiser colour mismatch');
    }
  }
  return colourField.choices.length;
}

test('supplied fabric colours remain valid through catalogue and visualiser selections', () => {
  let configurations = 0;
  for (const id of ['roller-blinds', 'venetian-blinds', 'honeycomb-blinds']) {
    const item = CATALOGUE.find(p => p.id === id)!;
    const initial = defaultSelection(item);
    const variants = fieldsFor(item, initial).find(f => f.id === 'variant')?.choices ?? [{id:''}];
    for (const variant of variants) {
      const ranges = fabricCollections(id, variant.id);
      for (const range of ranges.length ? ranges : ['']) {
        const selection = withChoice(item, withChoice(item, initial, 'variant', variant.id), 'collection', range);
        configurations += checkColours(item, selection, variant.id);
      }
    }
  }
  assert.equal(configurations, 183);
});

test('fabric and hardware propagation respect independent windows and product families', () => {
  const check: typeof assert.ok = assert.ok;
    const s = () => store.getState();
    s().setBlindType('sunscreen');
    check(s().fabricColour.startsWith('Panorama 5%'), 'Sunscreen must select Panorama');
    s().setWindowCount(3);
    s().setActiveWindow(1); s().setBlindType('blockout'); s().setFabricColour('Verve Steel Gray');
    s().setActiveWindow(0); s().setFabricColour('Panorama 5% Graphite');
    check(s().windows[1].fabricColour === 'Verve Steel Gray', 'Custom second window overwritten');
    check(s().windows[2].fabricColour === 'Panorama 5% Graphite', 'Following window not updated');
    s().setHardwareColour('cream');
    check(s().getHardwareColor() !== '#EDEDED', 'Cream hardware not rendered');
    s().setProductCategory('curtain');
    check(!s().fabricColour.startsWith('Panorama'), 'Blind fabric leaked into curtains');
    check(s().hardwareColour === 'white', 'Unsupported curtain hardware carried across');
    s().setHardwareColour('chrome'); s().setProductCategory('blind');
    check(s().hardwareColour === 'platinum', 'Curtain chrome must reconcile to roller platinum');
    s().setWindowCount(1); s().setBlindType('blockout'); s().setFabricColour('Essence Ice');


});
