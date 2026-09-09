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
const { slidingDoorPhotoPlan } = await import(moduleUrl('src/features/catalogue/lib/slidingDoorPhoto.ts'));
const { slidingMaterials } = await import(moduleUrl('src/features/catalogue/lib/slidingDoors.ts'));
const quoteIds = new Set();
for (const [id, style, name, counts] of [
  ['shaker-framed-sliding-doors', 'framed', 'Framed Sliding Wardrobe Doors', [5, 4]],
  ['shaker-sliding-doors', 'shaker', 'Shaker Sliding Wardrobe Doors', [3, 2]],
]) {
  const item = CATALOGUE.find(p => p.id === id);
  assert.equal(item.name, name);
  assert.ok(item.to.endsWith(encodeURIComponent(name)), 'Enquiry links use the new name');
  const initial = defaultSelection(item);
  const fields = fieldsFor(item, initial);
  const materials = fields.find(f => f.id === 'colour').choices;
  assert.equal(materials.length, style === 'framed' ? 3 : 8);
  assert.deepEqual(fields.find(f => f.id === 'hardware').choices.map(c => c.id),
    style === 'framed' ? ['White'] : ['Matt Black', 'Polished Silver', 'Pearl White']);
  for (const [pi, panels] of ['two', 'three'].entries()) {
    let sel = withChoice(item, initial, 'variant', panels);
    const options = fieldsFor(item, sel);
    const sizes = options.find(f => f.id === 'dimension').choices;
    assert.equal(sizes.length, counts[pi]);
    if (style === 'framed') assert.deepEqual(sizes.map(s => s.id),
      (pi === 0 ? [1200, 1500, 1800, 2100, 2400] : [2700, 3000, 3300, 3600]).map(w => `2160x${w}`));
    assert.ok(sizes.some(s => s.id === sel.dimension), 'Door-count change reconciles the dimension');
    let previousWidth = 0;
    for (const size of sizes) {
      sel = withChoice(item, sel, 'dimension', size.id);
      const layout = slidingDoorPhotoPlan(style, panels, size.id);
      assert.equal(layout.height, style === 'framed' ? 2160 : 2000);
      assert.ok(layout.width > previousWidth, 'Each size changes the represented width');
      previousWidth = layout.width;
      assert.ok(Math.abs(layout.frame.w / layout.frame.h - layout.width / layout.height) < 1e-10,
        'Door proportions preserve the selected physical aspect ratio');
      assert.equal(layout.doors.length, pi + 2);
      const slices = [...layout.room, ...layout.doors.flatMap(d => d.slices)];
      for (const { source, target } of slices) for (const rect of [source, target]) {
        assert.ok([rect.x, rect.y, rect.w, rect.h].every(Number.isFinite));
        assert.ok(rect.w > 0 && rect.h > 0 && rect.x >= 0 && rect.y >= 0);
        assert.ok(rect.x + rect.w <= 1024.001 && rect.y + rect.h <= 1024.001, 'Every slice remains inside the photograph');
      }
      for (const material of materials) for (const hardware of options.find(f => f.id === 'hardware').choices) {
        const selection = { ...sel, colour: material.id, hardware: hardware.id };
        const line = configuredLine(item, selection);
        assert.equal(line.name, name);
        assert.equal(line.fabricColour, material.label);
        assert.equal(line.hardwareColour, hardware.label);
        assert.ok(line.options.some(o => o.value === size.label));
        assert.ok(!line.options.some(o => o.value === 'Chosen at measure'));
        assert.ok(!quoteIds.has(line.blindType), 'Every configuration stays distinct in the quote');
        quoteIds.add(line.blindType);
        const plan = slidingDoorPhotoPlan(style, panels, size.id, material.id);
        const definition = slidingMaterials(style).find(m => m.name === material.id);
        assert.equal(plan.doors.filter(d => d.mirror).length, definition.mirror === 'all' ? pi + 2 : definition.mirror === 'mixed' ? 1 : 0);
        if (pi === 1 && definition.mirror === 'mixed') assert.ok(plan.doors[1].mirror, 'PDF mixed layout puts the mirror in the centre');
      }
    }
  }
}
const finishSources = JSON.parse(readFileSync('docs/sliding-door-finishes.json', 'utf8'));
for (const finish of finishSources) {
  assert.match(finish.hex, /^#[a-f\d]{6}$/i);
  assert.ok(readFileSync(finish.asset).length > 0, 'Official finish image exists');
}
assert.equal(quoteIds.size, 147);
console.log('Sliding doors: 27 PDF framed configurations and 120 Shaker configurations, dimensions, mirror layout, sourced finishes and quote details pass.');
