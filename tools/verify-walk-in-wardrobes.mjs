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
const { WALK_IN_LAYOUTS, WALK_IN_HARDWARE, WALK_IN_COLOURS } = await import(moduleUrl('src/features/catalogue/lib/walkInWardrobes.ts'));
const { shopPhoto } = await import(moduleUrl('src/features/catalogue/shopPhotos.ts'));
const item = CATALOGUE.find(p => p.id === 'walk-in-wardrobes');
const initial = defaultSelection(item);
assert.equal(initial.variant, 'LS01');
assert.equal(initial.colour, 'Matt Wardrobe White');
assert.equal(initial.hardware, 'T23 Inox');
assert.deepEqual(WALK_IN_LAYOUTS.map(m => m.name), ['Forma 4', 'Forma 5']);
assert.deepEqual(fieldsFor(item, initial).map(f => f.id), ['location', 'variant', 'colour', 'hardware']);
assert.deepEqual(WALK_IN_COLOURS.map(f => f.name), [
  'Matt Wardrobe White', 'Woodmatt Notaio Walnut', 'Matt Natural Oak', 'Woodmatt Antico Oak',
]);
assert.deepEqual(WALK_IN_HARDWARE.map(f => f.name), [
  'T23 Inox', 'T24 Brushed Matt Black', 'T25 Brushed Brass',
  'T26 Brushed Brass', 'T27 Inox', 'T28 Brushed Matt Black',
]);
const finishSources = JSON.parse(readFileSync('docs/walk-in-finishes.json', 'utf8'));
for (const finish of WALK_IN_COLOURS) {
  const source = finishSources.find(f => f.name === finish.name);
  assert.equal(source.hex.toUpperCase(), finish.hex);
  assert.equal(source.asset, 'public'+finish.texture);
}
const ids=new Set();
for (const layout of WALK_IN_LAYOUTS) {
  for(const colour of WALK_IN_COLOURS) for(const hardware of WALK_IN_HARDWARE) {
    const selection=withChoice(item, withChoice(item, {...initial,colour:colour.name}, 'variant', layout.id), 'hardware', hardware.name);
    const line=configuredLine(item, selection);
    assert.equal(line.name, 'Walk in wardrobes');
    assert.equal(line.fabricColour, colour.name);
    assert.equal(line.hardwareColour, hardware.name);
    for(const [label,value] of [['Model',layout.name],['Layout',layout.shape],['Footprint','2400 × 2400 mm'],['Height','2000 mm'],['Shelf depth','447 mm']]) {
      assert.ok(line.options.some(o=>o.label===label && o.value===value), label+' persists to quote');
    }
    assert.ok(!ids.has(line.blindType)); ids.add(line.blindType);
    const photo=shopPhoto(item.id,layout.id);
    assert.equal(photo.walkIn,layout.id);
    assert.ok(readFileSync('public'+photo.src).length>1000);
    assert.ok(readFileSync('public'+colour.texture).length>100);
    assert.equal(fieldsFor(item, selection).find(f=>f.id==='colour').kind,'swatches');
    assert.equal(fieldsFor(item, selection).find(f=>f.id==='hardware').kind,'swatches');
  }
}
assert.equal(ids.size,48);
const migrated=withChoice(item,{...initial,variant:'12.0U',colour:'Woodmatt Black Ply',hardware:'Brass'},'variant','US01');
assert.equal(migrated.colour,'Matt Wardrobe White');
assert.equal(migrated.hardware,'T23 Inox');
console.log('Walk-ins: both PDF layouts, 48 finish/handle combinations, fixed dimensions, source photos and complete quote details pass.');
