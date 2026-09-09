import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

// Exercise real option lists without loading the visualiser's React page.
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
    const dependency = resolve(dirname(file), `${specifier}.ts`);
    return `from '${moduleUrl(dependency)}'`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  modules.set(file, url);
  return url;
}
const { CATALOGUE, SCREEN_HEIGHT_MM } = await import(moduleUrl('src/features/catalogue/constants.ts'));
const { fieldsFor, defaultSelection, withChoice, hardwareHex } = await import(moduleUrl('src/features/catalogue/configOptions.ts'));
const { shopPhoto } = await import(moduleUrl('src/features/catalogue/shopPhotos.ts'));
const { showerPhotoWidth } = await import(moduleUrl('src/features/catalogue/lib/showerPhotoWidth.ts'));
const item = CATALOGUE.find(p => p.id === 'frameless-shower-screens');
assert.equal(item.name, 'Fixed Panel Shower Screen');
assert.equal(SCREEN_HEIGHT_MM, 2053, 'The existing shower height must not change');
const initial = defaultSelection(item);
assert.equal(initial.variant, 'clip');
assert.equal(initial.hardware, 'Matt Black');
assert.equal(initial.width, '700');
const expectedWidths = ['700', '800', '900', '1000', '1050', '1100', '1150', '1200', '1300', '1400'];
const finishes = ['Matt Black', 'Satin Silver', 'Brushed Nickel', 'Brushed Gold', 'Matt White', 'Gunmetal', 'Polished Silver'];
for (const variant of ['clip', 'channel']) {
  const selection = withChoice(item, initial, 'variant', variant);
  const fields = fieldsFor(item, selection);
  assert.deepEqual(fields.map(f => f.id), ['location', 'variant', 'hardware', 'width']);
  assert.deepEqual(fields.find(f => f.id === 'variant').choices.map(c => c.id), ['clip', 'channel']);
  const widths = fields.find(f => f.id === 'width').choices;
  assert.deepEqual(widths.map(c => c.id), expectedWidths, 'Preserve all ten configured dimensions');
  const hardware = fields.find(f => f.id === 'hardware').choices;
  assert.deepEqual(hardware.map(c => c.id), finishes.filter(f => variant === 'clip' || f !== 'Gunmetal'));
  for (const finish of hardware) {
    const selected = withChoice(item, selection, 'hardware', finish.id);
    assert.equal(hardwareHex(item, selected), finish.hex, `${variant}: ${finish.id} must reach the photo`);
  }
  const photo = shopPhoto(item.id, variant);
  assert.equal(photo.shower.mounting, variant);
  let previous = 0;
  for (const width of widths) {
    const panel = showerPhotoWidth(photo.shower, Number(width.id));
    assert.equal(panel.left, photo.shower.left, 'Wall anchoring stays fixed');
    assert.equal(panel.top, photo.shower.top);
    assert.equal(panel.bottom, photo.shower.bottom, 'Glass height stays fixed');
    assert.ok(panel.width > previous, 'Every wider selection must visibly widen the glass');
    previous = panel.width;
    assert.ok(panel.right <= photo.shower.right, 'Glass must stay within the photographed opening');
    assert.equal(panel.right - photo.shower.right, panel.edgeOffset);
  }
  assert.equal(showerPhotoWidth(photo.shower, 1400).width, showerPhotoWidth(photo.shower, 700).width * 2);
}
const gunmetal = withChoice(item, initial, 'hardware', 'Gunmetal');
assert.equal(withChoice(item, gunmetal, 'variant', 'channel').hardware, 'Matt Black', 'Keep existing dependent-finish behaviour');
assert.notEqual(shopPhoto(item.id, 'clip').src, shopPhoto(item.id, 'channel').src);
assert.equal(shopPhoto(item.id, 'clip').shower.background, shopPhoto(item.id, 'channel').shower.background);
console.log('Shower preview: both mountings, 20 sizes, 13 finishes, fixed height and unchanged configuration choices pass.');
