import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const modules = new Map();
function moduleUrl(file) {
  file = resolve(file);
  if (modules.has(file)) return modules.get(file);
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, removeComments: true },
  });
  const code = outputText.replace(/from ['"]([^'"]+)['"]/g, (_, specifier) => {
    if (specifier === '@/features/visualiser') {
      const exports = ['wardrobes', 'wardrobeHardware'].map(name =>
        `export * from '${moduleUrl(`src/features/visualiser/${name}.ts`)}';`).join('\n');
      return `from 'data:text/javascript;base64,${Buffer.from(exports).toString('base64')}'`;
    }
    return `from '${moduleUrl(resolve(dirname(file), `${specifier}.ts`))}'`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  modules.set(file, url);
  return url;
}
const { CATALOGUE } = await import(moduleUrl('src/features/catalogue/constants.ts'));
const { fieldsFor, defaultSelection, withChoice, configuredLine } = await import(moduleUrl('src/features/catalogue/configOptions.ts'));
const { mirrorPlan } = await import(moduleUrl('src/features/catalogue/lib/mirrorPhoto.ts'));
const { shopPhoto } = await import(moduleUrl('src/features/catalogue/shopPhotos.ts'));
const expected = [
  { id: 'mirrors-without-frames', name: 'Mirrors Frameless', framed: false, shapes: {
    gothic: ['800x700', '900x700', '1000x700'], round: ['600x600', '800x800', '1000x1000'],
    rectangular: ['600x600', '900x600', '900x1200'], oval: ['800x700', '900x700', '1000x700'],
    radius: ['800x700', '900x700', '1000x700'], 'd-shaped': ['750x900', '900x1200', '1100x1500'],
  } },
  { id: 'mirror-with-frame', name: 'Mirrors Framed', framed: true, shapes: {
    gothic: ['800x500'], round: ['600x600', '900x900'], pill: ['1000x500'],
  } },
];
const quoteIds = new Set();
for (const product of expected) {
  const item = CATALOGUE.find(p => p.id === product.id);
  assert.equal(item.name, product.name);
  const initial = defaultSelection(item);
  assert.equal(initial.variant, 'gothic');
  assert.deepEqual(fieldsFor(item).find(f => f.id === 'variant').choices.map(c => c.id), Object.keys(product.shapes));
  const hardware = fieldsFor(item).find(f => f.id === 'hardware');
  if (product.framed) {
    assert.equal(hardware.label, 'Frame colour');
    assert.deepEqual(hardware.choices.map(c => c.id), ['White', 'Golden', 'Black']);
  } else assert.equal(hardware, undefined);
  for (const [shape, sizes] of Object.entries(product.shapes)) {
    let sel = withChoice(item, { ...initial, dimension: 'invalid' }, 'variant', shape);
    const dimensions = fieldsFor(item, sel).find(f => f.id === 'dimension');
    assert.deepEqual(dimensions.choices.map(c => c.id), sizes);
    assert.equal(sel.dimension, sizes[0], 'Shape changes reconcile an invalid previous size');
    for (const size of sizes) {
      sel = withChoice(item, sel, 'dimension', size);
      const plan = mirrorPlan(product.framed, shape, size);
      const [height, width] = size.split('x').map(Number);
      assert.equal(plan.height, height);
      assert.equal(plan.width, width);
      assert.ok(Math.abs(plan.w / plan.h - width / height) < 1e-10, 'True physical aspect ratio');
      assert.equal(plan.y + plan.h, 669, 'Constant mounting baseline');
      assert.ok(plan.x > 0 && plan.y > 0 && plan.x + plan.w < 1024, 'Entire mirror fits photograph');
      const photo = shopPhoto(product.id, shape);
      assert.equal(photo.src, '/images/shop/mirrors-clean.webp');
      assert.equal(photo.mirror.framed, product.framed);
      const line = configuredLine(item, sel);
      assert.ok(line.options.some(o => o.label === 'Dimensions (H × W)' && o.value === `H${height} × W${width} mm`));
      assert.ok(!quoteIds.has(line.blindType), 'Every shape and size creates a distinct cart line');
      quoteIds.add(line.blindType);
    }
  }
  if (product.framed) {
    const ids = hardware.choices.map(c => configuredLine(item, withChoice(item, initial, 'hardware', c.id)).blindType);
    assert.equal(new Set(ids).size, 3, 'Frame colours remain separate cart configurations');
  }
}
console.log('Mirrors: 22 shape/size configurations, valid dependent dimensions, true proportions, frame colours and quote details pass.');
