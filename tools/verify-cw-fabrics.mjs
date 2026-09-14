import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const samples = JSON.parse(await fs.readFile('src/features/fabrics/samples.json', 'utf8'));
const files = new Set((await fs.readdir('public', { recursive: true })).map(f => '/' + f.replace(/\\/g, '/')));
assert.equal(samples.length, 90);
assert.equal(new Set(samples.map(s => s.id)).size, samples.length);
let bytes = 0;
for (const sample of samples) {
  assert.match(sample.hex, /^#[a-f0-9]{6}$/);
  for (const key of ['texture', 'renderTexture', 'weaveTexture', 'source']) {
    assert(files.has(sample[key]), `Exact asset path missing: ${sample[key]}`);
    if (key !== 'source') bytes += (await fs.stat(path.join('public', sample[key]))).size;
  }
}
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const origin = process.env.CW_URL ?? 'http://127.0.0.1:5173';
  await page.goto(`${origin}/products`);
  const checks = await page.evaluate(async () => {
    const { CATALOGUE } = await import('/src/features/catalogue/constants.ts');
    const { fieldsFor, withChoice, defaultSelection, configuredLine, priceFor } = await import('/src/features/catalogue/configOptions.ts');
    const { useVisualiserStore: store } = await import('/src/features/visualiser/useVisualiserStore.ts');
    const { fabricByName, fabricCollections } = await import('/src/features/fabrics/index.ts');
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    let configurations = 0;
    for (const id of ['roller-blinds', 'venetian-blinds', 'honeycomb-blinds']) {
      const item = CATALOGUE.find(p => p.id === id);
      let selection = defaultSelection(item);
      const variants = fieldsFor(item, selection).find(f => f.id === 'variant')?.choices ?? [{ id: '' }];
      for (const variant of variants) {
        selection = withChoice(item, selection, 'variant', variant.id);
        for (const range of fabricCollections(id, variant.id).length ? fabricCollections(id, variant.id) : ['']) {
          selection = withChoice(item, selection, 'collection', range);
          const fields = fieldsFor(item, selection);
          const colourField = fields.find(f => f.id === 'colour');
          check(fields.indexOf(colourField) > fields.findIndex(f => f.id === 'variant'), 'Type must precede colour');
          for (const colour of colourField.choices) {
            selection = withChoice(item, selection, 'colour', colour.id);
            check(fieldsFor(item, selection).every(f => f.choices.some(c => c.id === selection[f.id])), `Invalid selection: ${id}/${range}/${colour.id}`);
            const line = configuredLine(item, selection);
            check(line.fabricColour === colour.label, 'Cart loses real fabric name');
            check(fabricByName(colour.id)?.hex === colour.hex, 'Palette/preview colour mismatch');
            if (id === 'roller-blinds') {
              check(priceFor(item, selection) === (variant.id === 'dual' ? 320 : 220), 'Existing small manual price changed');
              store.getState().setBlindType(variant.id);
              store.getState().setFabricColour(colour.id);
              check(store.getState().fabricColour === colour.id, 'Visualiser loses selected range');
              check(store.getState().getFabricColor() === colour.hex, 'Visualiser colour mismatch');
            }
            configurations++;
          }
        }
      }
    }
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
    return configurations;
  });
  const roller = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Roller Blinds', exact: true }) });
  await roller.getByRole('button', { name: 'Montecarlo', exact: true }).click();
  await roller.getByRole('button', { name: 'Montecarlo Oak', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-fabric-texture*="montecarlo-oak"]'));
  await roller.getByRole('button', { name: 'Cream', exact: true }).click();
  await roller.getByRole('button', { name: 'Add to cart', exact: true }).click();
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('klay-cart')).state.items);
  assert(cart.some(item => item.fabricColour === 'Montecarlo Oak' && item.hardwareColour === 'Cream'));
  await roller.getByRole('button', { name: 'Sunscreen', exact: true }).click();
  assert.equal(await roller.getByRole('button', { name: /^Panorama 5%/ }).count(), 8);
  await roller.screenshot({ path: 'C:/Users/lathv/AppData/Local/Temp/klay-cw-roller.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  await roller.screenshot({ path: 'C:/Users/lathv/AppData/Local/Temp/klay-cw-mobile.png' });
  await page.goto(`${origin}/`);
  const homeRoller = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Roller Blinds', exact: true }) });
  await homeRoller.waitFor();
  assert(await homeRoller.getByRole('button', { name: 'Essence Ice', exact: true }).count(), 'Homepage lacks supplied colours');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin.replace('127.0.0.1', 'localhost')}/visualiser`);
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Essence Ice', exact: true }).waitFor();
  const canvas = page.locator('canvas').first();
  await canvas.waitFor();
  const before = await canvas.evaluate(c => c.toDataURL());
  await page.route('**/essence-carbon-texture.webp', route => route.abort());
  await page.getByRole('button', { name: 'Essence Carbon', exact: true }).click();
  await page.waitForFunction(previous => document.querySelector('canvas').toDataURL() !== previous, before);
  await page.unroute('**/essence-carbon-texture.webp');
  await page.getByRole('button', { name: 'Montecarlo', exact: true }).click();
  await page.getByRole('button', { name: 'Montecarlo Oak', exact: true }).click();
  await page.waitForFunction(() => performance.getEntriesByType('resource').some(r => r.name.endsWith('/montecarlo-oak-texture.webp')));
  await page.waitForFunction(previous => document.querySelector('canvas').toDataURL() !== previous, before);
  await page.getByRole('button', { name: 'Sunscreen', exact: true }).click();
  await page.getByRole('button', { name: 'Panorama 5% Graphite', exact: true }).click();
  await page.waitForFunction(() => performance.getEntriesByType('resource').some(r => r.name.endsWith('/panorama-5percent-graphite-texture.webp')));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  await page.screenshot({ path: 'C:/Users/lathv/AppData/Local/Temp/klay-cw-visualiser-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'C:/Users/lathv/AppData/Local/Temp/klay-cw-visualiser.png' });
  assert.deepEqual(errors, []);
  console.log(`PASS: ${checks} configurations; cart, multi-window state, homepage, mobile width; 90 samples / ${(bytes / 1048576).toFixed(2)} MB.`);
} finally { await browser.close(); }
