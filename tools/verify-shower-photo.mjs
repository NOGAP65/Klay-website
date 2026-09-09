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
const { fieldsFor, defaultSelection, withChoice, hardwareHex, configuredLine } = await import(moduleUrl('src/features/catalogue/configOptions.ts'));
const { shopPhoto } = await import(moduleUrl('src/features/catalogue/shopPhotos.ts'));
const { showerPhotoWidth, showerGlassPath, showerFreeEdgePath } = await import(moduleUrl('src/features/catalogue/lib/showerPhotoWidth.ts'));
const item = CATALOGUE.find(p => p.id === 'frameless-shower-screens');
assert.equal(item.name, 'Fixed frameless showerscreen');
assert.equal(SCREEN_HEIGHT_MM, 2053, 'The existing shower height must not change');
const initial = defaultSelection(item);
assert.equal(initial.variant, 'clip');
assert.equal(initial.hardware, 'Matt Black');
assert.equal(initial.width, '1100');
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
  assert.equal(fields.find(f => f.id === 'hardware').label, 'Hardware colour');
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
const radiusItem = CATALOGUE.find(p => p.id === 'radius-corner-fixed-frameless');
assert.equal(radiusItem.name, 'Radius corner fixed frameless showerscreen');
assert.equal(CATALOGUE.indexOf(radiusItem), CATALOGUE.indexOf(item) + 1);
const radiusInitial = defaultSelection(radiusItem);
assert.equal(radiusInitial.glass, 'clear');
assert.deepEqual(fieldsFor(radiusItem).map(f => f.id), ['glass', 'location', 'variant', 'hardware', 'width']);
assert.deepEqual(fieldsFor(radiusItem)[0].choices.map(c => c.id), ['clear', 'reeded']);
const radiusPhotos = new Set();
for (const variant of ['clip', 'channel']) {
  for (const glass of ['clear', 'reeded']) {
    const selection = { ...radiusInitial, variant, glass };
    assert.deepEqual(fieldsFor(radiusItem, selection).slice(1), fieldsFor(item, { ...initial, variant }), 'Radius keeps the same remaining controls');
    const photo = shopPhoto(radiusItem.id, variant, glass);
    radiusPhotos.add(photo.src);
    assert.equal(photo.shower.mounting, variant);
    assert.equal(photo.shower.glass, glass);
    assert.ok(photo.shower.cornerRadius > 0);
    assert.ok(showerFreeEdgePath(photo.shower).includes('A'), 'The photographed free edge includes a curved corner');
    for (const width of expectedWidths) {
      const panel = showerPhotoWidth(photo.shower, Number(width));
      assert.ok(panel.width > photo.shower.cornerRadius, 'The corner fits the narrowest panel');
      assert.equal(panel.height, 787, 'The height and floor position stay fixed');
      assert.ok(showerGlassPath(photo.shower, panel.right).includes(`H${panel.right - photo.shower.cornerRadius}A`));
    }
    const line = configuredLine(radiusItem, selection);
    assert.equal(line.options[0].label, 'Glass type');
    assert.equal(line.options[0].value, glass === 'clear' ? 'Clear' : 'Narrow-reeded');
    assert.ok(line.blindType.includes(`:${glass}:`), 'Glass type must be part of the cart line identity');
    assert.equal(line.priceOnMeasure, true);
  }
}
assert.equal(radiusPhotos.size, 4, 'Every glass/mounting combination has a matching photograph');
assert.notEqual(configuredLine(radiusItem, radiusInitial).blindType, configuredLine(radiusItem, { ...radiusInitial, glass: 'reeded' }).blindType);
const { semiScreenPlan, FRONT_RETURN_SIZES } = await import(moduleUrl('src/features/catalogue/lib/semiScreenPhoto.ts'));
assert.deepEqual(FRONT_RETURN_SIZES, [
  { width: 800, depth: 850 }, { width: 850, depth: 890 }, { width: 900, depth: 910 },
  { width: 1050, depth: 1010 }, { width: 1200, depth: 1010 }, { width: 1350, depth: 1010 },
]);
for (const layout of ['front-only', 'front-return']) {
  const product = CATALOGUE.find(p => p.id === `semi-frameless-${layout}`);
  assert.ok(product.name.endsWith('showerscreen'));
  assert.equal(new URL(product.to, 'https://klay.test').searchParams.get('product'), product.name);
  const selection = defaultSelection(product);
  assert.equal(selection.width, '1050');
  const fields = fieldsFor(product, selection);
  assert.equal(fields.find(f => f.id === 'hardware').label, 'Hardware colour');
  assert.deepEqual(fields.map(f => f.id), ['location', 'hardware', 'width']);
  assert.deepEqual(fields.find(f => f.id === 'hardware').choices.map(c => c.id).sort(), ['Bright Silver', 'Matt Black']);
  assert.deepEqual(fields.find(f => f.id === 'width').choices.map(c => c.id), FRONT_RETURN_SIZES.map(s => String(s.width)));
  const photo = shopPhoto(product.id);
  let previousRight = 0;
  const quoteIds = new Set();
  for (const size of FRONT_RETURN_SIZES) {
    const plan = semiScreenPlan(photo.semi, size.width);
    assert.equal(plan.height, 1950, 'Semi-frameless has its own fixed height');
    assert.equal(plan.depth, layout === 'front-return' ? size.depth : undefined);
    assert.ok(plan.right > previousRight, 'Every size visibly widens the screen');
    previousRight = plan.right;
    assert.equal(plan.front[0].scaleX, 1, 'Door and knob never shrink');
    assert.equal(plan.front[2].scaleX, 1, 'Jamb thickness stays fixed');
    assert.ok(plan.front[1].scaleX > 0, 'Every size has a real fixed infill');
    for (let i = 1; i < plan.front.length; i++) {
      const a = plan.front[i - 1], b = plan.front[i];
      assert.ok(Math.abs(a.end * a.scaleX + a.x - b.start * b.scaleX - b.x) < 0.001, 'No gap between front slices');
    }
    assert.equal(plan.returns.length > 0, layout === 'front-return');
    for (const finish of ['Bright Silver', 'Matt Black']) {
      const chosen = withChoice(product, { ...selection, width: String(size.width) }, 'hardware', finish);
      assert.match(hardwareHex(product, chosen), /^#[0-9a-f]{6}$/i);
      const line = configuredLine(product, chosen);
      const dimension = line.options.find(o => o.label === 'Dimensions').value;
      assert.ok(dimension.includes('1950') && dimension.includes(String(size.width)));
      if (layout === 'front-return') assert.ok(dimension.includes(`D${size.depth}`));
      quoteIds.add(line.blindType);
    }
  }
  assert.equal(quoteIds.size, 12, 'Every size and finish stays distinct in the quote');
}
console.log('Shower previews: four products, fixed/radius controls, 12 semi-frameless sizes, 1950mm height, paired return depths, finishes and quote identity pass.');
