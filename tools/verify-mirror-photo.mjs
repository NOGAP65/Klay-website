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
      assert.equal(photo.src, '/images/shop/mirrors-quiet.webp');
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
const { cabinetMirrorPlan, cabinetMirrorSize } = await import(moduleUrl('src/features/catalogue/lib/cabinetMirror.ts'));
const cabinet = CATALOGUE.find(p => p.id === 'mirrors-with-cabinets');
assert.equal(cabinet.name, 'Mirrors with Cabinets');
assert.deepEqual(fieldsFor(cabinet).map(f => f.id), ['location', 'variant'], 'Shape is the only product choice');
assert.deepEqual(fieldsFor(cabinet).find(f => f.id === 'variant').choices.map(c => c.label), ['Gothic', 'Round', 'Pill']);
const cabinetIds = new Set();
const cabinetTransforms = new Set();
function rightEdgeAt(points, y) {
  const crossings = points.flatMap(([x1, y1], index) => {
    const [x2, y2] = points[(index + 1) % points.length];
    if (y1 === y2 || y < Math.min(y1, y2) || y > Math.max(y1, y2)) return [];
    return [x1 + (x2 - x1) * (y - y1) / (y2 - y1)];
  });
  assert.ok(crossings.length >= 2, 'Both hinges fall within the mirror height');
  return Math.max(...crossings);
}
for (const [shape, height, width] of [['gothic', 800, 500], ['round', 600, 600], ['pill', 1000, 500]]) {
  const sel = withChoice(cabinet, defaultSelection(cabinet), 'variant', shape);
  const plan = cabinetMirrorPlan(shape);
  assert.deepEqual([plan.height, plan.width, plan.depth], [height, width, 150]);
  assert.ok(plan.points.every(([x, y]) => x > 0 && x < 1024 && y > 0 && y < 1024), 'Angled door stays inside the photo');
  for (const hinge of plan.hinges) {
    assert.ok(Math.abs(rightEdgeAt(plan.points, hinge.y) + plan.backingDepth - hinge.x) < 1,
      `${shape}: mirror backing meets each photographed hinge without a gap`);
  }
  cabinetTransforms.add(plan.cabinetTransform);
  if (shape === 'round') {
    const ys = plan.points.map(([, y]) => y);
    const displayedHeight = Math.max(...ys) - Math.min(...ys);
    assert.ok(Math.abs(displayedHeight / plan.cabinetHeight - 600 / 530) < 0.005,
      'Round mirror and cabinet use the same physical height scale');
    assert.ok(plan.projectedWidth > plan.cabinetProjectedWidth,
      'The open Round face remains wider than the photographed cabinet');
    assert.ok(plan.projectedWidth < displayedHeight, 'Round face is foreshortened by the open-door angle');
  }
  const line = configuredLine(cabinet, sel);
  assert.ok(line.options.some(o => o.label === 'Dimensions (H × W × D)' && o.value === cabinetMirrorSize(shape)));
  assert.ok(line.options.some(o => o.label === 'Cabinet finish' && o.value === 'White'));
  cabinetIds.add(line.blindType);
  assert.equal(shopPhoto(cabinet.id, shape).src, '/images/shop/mirrors-cabinets-open.webp');
}
assert.equal(cabinetIds.size, 3, 'Each cabinet shape makes a separate quote line');
assert.equal(cabinetTransforms.size, 1, 'Changing the mirror shape keeps the cabinet fixed in place');
console.log('Mirrors: 22 wall-mirror sizes and 3 cabinet shapes, fixed specifications, perspective, colours and quote details pass.');
