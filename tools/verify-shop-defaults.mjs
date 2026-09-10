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
const find = id => CATALOGUE.find(item => item.id === id);
const wardrobe = find('wardrobes');
assert.deepEqual(defaultSelection(wardrobe), {
  location: 'master-bedroom', variant: 'SRDTDH01', colour: 'Woodmatt Black Ply', width: '1800', hardware: 'Black',
});
const shelf = find('shelving');
const shelfDefault = defaultSelection(shelf);
assert.equal(shelfDefault.variant, 'LIN05');
assert.equal(shelfDefault.width, '2700');
assert.deepEqual(fieldsFor(shelf, shelfDefault).find(f => f.id === 'variant').choices.map(c => c.label),
  ['Forma 6', 'Forma 7', 'Forma 8', 'Forma 9']);
const shelfLocations = fieldsFor(shelf, shelfDefault).find(f => f.id === 'location').choices;
assert.deepEqual(shelfLocations.map(c => c.id), [
  'garage-1', 'garage-2', 'garage-3', 'linen-1', 'linen-2', 'linen-3', 'linen-4', 'linen-5',
  'pantry-1', 'pantry-2', 'pantry-3', 'pantry-4', 'pantry-5', 'other',
]);
const narrow = withChoice(shelf, shelfDefault, 'variant', 'LIN01');
assert.equal(narrow.width, '900');
const restored = withChoice(shelf, narrow, 'variant', 'LIN05');
assert.equal(restored.width, '2700');
assert.ok(configuredLine(shelf, restored).options.some(o => o.label === 'Layout' && o.value === 'Forma 8'));
const custom = configuredLine(shelf, {...shelfDefault, location:'other', locationOther:'Workshop'});
assert.ok(custom.options.some(o => o.label === 'Location' && o.value === 'Workshop'));
for (const id of ['mirrors-without-frames', 'mirror-with-frame', 'mirrors-with-cabinets']) {
  const item = find(id), initial = defaultSelection(item);
  const locations = fieldsFor(item, initial).find(f => f.id === 'location').choices;
  assert.deepEqual(locations.map(c => c.id), [
    'bathroom-1', 'bathroom-2', 'bathroom-3', 'bathroom-4', 'bathroom-5',
    'ensuite-1', 'ensuite-2', 'ensuite-3', 'ensuite-4', 'ensuite-5',
  ]);
  assert.deepEqual([...new Set(locations.map(c => c.group))], ['Bathrooms', 'Ensuites']);
  const quotes = locations.map(c => configuredLine(item, withChoice(item, initial, 'location', c.id)));
  assert.equal(new Set(quotes.map(line => line.blindType)).size, 10);
  quotes.forEach((line, index) => assert.ok(line.options.some(o => o.label === 'Location' && o.value === locations[index].label)));
}
for (const item of CATALOGUE) {
  const initial = defaultSelection(item);
  for (const field of fieldsFor(item, initial)) assert.ok(field.choices.some(c => c.id === initial[field.id]), `${item.id}: valid default for ${field.id}`);
}
console.log('Shop defaults: Forma 3/1800/black, Forma 8/2700, all numbered locations, distinct quote lines and valid dependent widths pass.');
