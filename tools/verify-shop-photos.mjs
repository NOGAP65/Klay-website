import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';

async function loadTypescript(file) {
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { SHOP_PHOTOS, shopPhoto } = await loadTypescript('src/features/catalogue/shopPhotos.ts');
const { photoColourCurves } = await loadTypescript('src/features/catalogue/lib/photoColour.ts');
const photos = Object.values(SHOP_PHOTOS).flatMap(Object.values);
assert.equal(photos.length, 13);
assert.notEqual(shopPhoto('honeycomb-blinds', 'blockout').src, shopPhoto('honeycomb-blinds', 'daynight').src);
assert.equal(shopPhoto('zip-guide-systems').src, '/images/shop/zip-guide-alfresco.webp');
for (const product of ['curtains', 'roller-blinds', 'venetian-blinds', 'plantation-shutters', 'folding-arm-awnings', 'pleated-flyscreens']) {
  assert.equal(shopPhoto(product), undefined, `${product} must keep its existing preview`);
}
const expectedLayouts = { wardrobes: ['SRDH', 'SRSTDH02', 'SRDTDH01'], shelving: ['LIN01', 'LIN02', 'LIN05', 'LINBR02'] };
for (const [product, layouts] of Object.entries(expectedLayouts)) {
  assert.deepEqual(Object.keys(SHOP_PHOTOS[product]), layouts);
  assert.equal(new Set(layouts.map(layout => shopPhoto(product, layout).src)).size, layouts.length);
}
for (const photo of photos) {
  assert.ok(existsSync(`public${photo.src}`), photo.src);
  assert.ok(photo.regions?.length || photo.boards?.length || photo.shower, `${photo.src} needs material regions`);
}
const assets = photos.flatMap(p => [p.src, ...(p.shower ? [p.shower.background] : [])]);
assert.deepEqual(new Set(readdirSync('public/images/shop').map(f => `/images/shop/${f}`)), new Set(assets));
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
console.log('Shop photos: 13 product photos and a shower background, all layouts, excluded products, colour range, shadows and day/night separation pass.');
