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
const { WALK_IN_LAYOUTS, WALK_IN_HARDWARE, WALK_IN_METAL } = await import(moduleUrl('src/features/catalogue/lib/walkInWardrobes.ts'));
const { shopPhoto } = await import(moduleUrl('src/features/catalogue/shopPhotos.ts'));
const item = CATALOGUE.find(p => p.id === 'walk-in-wardrobes');
const initial = defaultSelection(item);
assert.equal(initial.variant, 'LS01');
assert.equal(initial.colour, 'Whiteboard');
assert.equal(initial.hardware, 'White');
assert.deepEqual(WALK_IN_LAYOUTS.map(m => m.name), ['Forma 4', 'Forma 5']);
assert.deepEqual(fieldsFor(item, initial).map(f => f.id), ['location', 'variant', 'colour', 'hardware']);
const ids=new Set();
for (const layout of WALK_IN_LAYOUTS) {
  for(const hardware of WALK_IN_HARDWARE) {
    const selection=withChoice(item, withChoice(item, initial, 'variant', layout.id), 'hardware', hardware.name);
    const line=configuredLine(item, selection);
    assert.equal(line.name, 'Walk in wardrobes');
    assert.equal(line.fabricColour, 'Whiteboard');
    assert.equal(line.hardwareColour, hardware.name);
    for(const [label,value] of [['Model',layout.name],['Layout',layout.shape],['Footprint','2400 × 2400 mm'],['Height','2000 mm'],['Shelf depth','447 mm']]) {
      assert.ok(line.options.some(o=>o.label===label && o.value===value), label+' persists to quote');
    }
    assert.ok(!ids.has(line.blindType)); ids.add(line.blindType);
    const photo=shopPhoto(item.id,layout.id);
    assert.equal(photo.walkIn,layout.id);
    assert.ok(readFileSync('public'+photo.src).length>1000);
    assert.ok(WALK_IN_METAL[layout.id].length>200);
  }
}
assert.equal(ids.size,6);
const migrated=withChoice(item,{...initial,variant:'12.0U',colour:'Woodmatt Black Ply',hardware:'Brass'},'variant','US01');
assert.equal(migrated.colour,'Whiteboard');
assert.equal(migrated.hardware,'White');
console.log('Walk-ins: both PDF layouts, six hardware combinations, fixed dimensions, source photos and complete quote details pass.');
