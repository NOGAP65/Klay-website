import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { test } from '@playwright/test';

import { fieldsFor, withChoice, defaultSelection, configuredLine, priceFor, type Selection } from '../src/features/catalogue/configOptions';
import { CATALOGUE } from '../src/features/catalogue/constants';
import { fabricByName, fabricCollections, type FabricSample } from '../src/features/fabrics';
import { normaliseRollerWeave } from '../src/features/visualiser/rollerWeave';
import { useVisualiserStore as store } from '../src/features/visualiser/useVisualiserStore';

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
