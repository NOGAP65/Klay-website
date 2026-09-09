import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

function moduleUrl(file) {
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const code = outputText.replace(/from ['"]([^'"]+)['"]/g, (_, specifier) =>
    `from '${moduleUrl(resolve(dirname(file), `${specifier}.ts`))}'`);
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}
const loadTypescript = file => import(moduleUrl(file));
const { SHOP_PHOTOS, shopPhoto } = await loadTypescript('src/features/catalogue/shopPhotos.ts');
const { photoColourCurves } = await loadTypescript('src/features/catalogue/lib/photoColour.ts');
const { flyscreenColourCurves } = await loadTypescript('src/features/catalogue/lib/flyscreenPhoto.ts');
const { FLYSCREEN_COLOURS } = await loadTypescript('src/features/catalogue/lib/pleatedFlyscreens.ts');
const photos = Object.values(SHOP_PHOTOS).flatMap(Object.values);
assert.equal(photos.length, 27);
assert.notEqual(shopPhoto('honeycomb-blinds', 'blockout').src, shopPhoto('honeycomb-blinds', 'daynight').src);
assert.equal(shopPhoto('zip-guide-systems').src, '/images/shop/zip-guide-alfresco.webp');
for (const product of ['curtains', 'roller-blinds', 'venetian-blinds', 'plantation-shutters', 'folding-arm-awnings']) {
  assert.equal(shopPhoto(product), undefined, `${product} must keep its existing preview`);
}
const expectedLayouts = { wardrobes: ['SRDH', 'SRSTDH02', 'SRDTDH01'], shelving: ['LIN01', 'LIN02', 'LIN05', 'LINBR02'], 'walk-in-wardrobes': ['LS01', 'US01'] };
for (const [product, layouts] of Object.entries(expectedLayouts)) {
  assert.deepEqual(Object.keys(SHOP_PHOTOS[product]), layouts);
  assert.equal(new Set(layouts.map(layout => shopPhoto(product, layout).src)).size, layouts.length);
}
for (const photo of photos) {
  assert.ok(existsSync(`public${photo.src}`), photo.src);
  assert.ok(photo.regions?.length || photo.boards?.length || photo.shower || photo.semi || photo.mirror || photo.cabinetMirror || photo.slidingDoor || photo.walkIn || photo.flyscreen, `${photo.src} needs material regions`);
}
const assets = photos.flatMap(p => [p.src, ...(p.shower ? [p.shower.background] : []),
  ...(p.semi ? [p.semi.background, p.semi.reflections] : [])]);
assert.deepEqual(new Set(readdirSync('public/images/shop', { withFileTypes: true }).filter(f => f.isFile()).map(f => `/images/shop/${f.name}`)), new Set(assets));
const references = { cellular: '#F2F0EC', day: '#F2F0EC', mesh: '#6E7276', shutter: '#F1F0EC', hardware: '#D3D7DB' };
const swatches = ['#303030', '#F2F0EC', '#2C4A30', '#8C2820', '#1C3048', '#DCD7CC', '#26282A', '#44464A', '#C2A161'];
for (const [material, reference] of Object.entries(references)) {
  for (const curve of photoColourCurves(reference, material)) {
    curve.forEach((value, i) => assert.equal(value, i / 255, `${material} source identity`));
  }
  for (const swatch of swatches) for (const curve of photoColourCurves(swatch, material)) {
    assert.ok(curve.every(v => Number.isFinite(v) && v >= 0 && v <= 1), `${material} valid range`);
    assert.ok(curve.every((v, i) => i === 0 || v >= curve[i - 1]), `${material} keeps shadow order`);
  }
}
const opaque = photoColourCurves('#303030', 'cellular')[0];
const day = photoColourCurves('#303030', 'day')[0];
assert.ok(opaque[230] - opaque[200] > 0.07, 'Dark honeycomb must retain pleat contrast');
assert.ok(day[210] - opaque[210] > 0.3, 'Day fabric must retain transmitted daylight');
assert.ok(shopPhoto('pleated-flyscreens', 'single').flyscreen);
assert.equal(shopPhoto('pleated-flyscreens', 'single').src, shopPhoto('pleated-flyscreens', 'double').src,
  'Single and Double reuse one photograph with dynamic hardware');
const flyscreenFinishes = FLYSCREEN_COLOURS.map(finish => flyscreenColourCurves(finish.hex));
for (const curves of flyscreenFinishes) for (const curve of curves) {
  assert.ok(curve.every(v => Number.isFinite(v) && v >= 0 && v <= 1), 'Flyscreen finish stays in range');
  assert.ok(curve.every((v, i) => i === 0 || v >= curve[i - 1]), 'Flyscreen finish retains shadows');
}
assert.equal(new Set(flyscreenFinishes.map(curves => curves[0][160])).size, 4, 'All four flyscreen finishes are distinct');
assert.ok(flyscreenFinishes[1][0][160] > flyscreenFinishes[2][0][160] + 0.15, 'White remains lighter than clear anodised');
assert.equal(new Set(photos.map(p => p.src)).size, 26, 'Each walk-in layout has one photo');
console.log('Shop photos: 26 product photos across 27 photo mappings and four supporting assets; layouts, exclusions, colours and shadows pass.');
