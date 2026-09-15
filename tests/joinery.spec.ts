import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { test } from '@playwright/test';

import { fieldsFor, defaultSelection, withChoice, configuredLine } from '../src/features/catalogue/configOptions';
import { CATALOGUE } from '../src/features/catalogue/constants';
import { joineryWidthSlices, JOINERY_HEIGHT_MM, grainTransform } from '../src/features/catalogue/lib/joineryPhotoWidth';
import { WALK_IN_LAYOUTS, WALK_IN_HARDWARE, WALK_IN_COLOURS } from '../src/features/catalogue/lib/walkInWardrobes';
import { SHOP_PHOTOS, shopPhoto } from '../src/features/catalogue/shopPhotos';
import { columnsFor, facePostsFor, MODULE_WIDTH_MM, BOARD_MM } from '../src/features/joinery/layout';
import { wardrobeModelById, WARDROBE_COLOURS } from '../src/features/joinery/wardrobes';

test('joinery width geometry preserves fixed heights and photo proportions', () => {
const close = (a: number, b: number, message: string) => assert.ok(Math.abs(a - b) < 1e-7, `${message}: ${a} vs ${b}`);
let configurations = 0;
for (const photo of [...Object.values(SHOP_PHOTOS.wardrobes), ...Object.values(SHOP_PHOTOS.shelving)]) {
  assert.ok(photo.joinery);
  const model = wardrobeModelById(photo.joinery.modelId);
  let previousWidth = 0;
  for (const width of model.widths) {
    const plan = joineryWidthSlices(photo.joinery, width);
    const ppm = plan.cabinetHeight / JOINERY_HEIGHT_MM;
    assert.equal(JOINERY_HEIGHT_MM, 2000);
    assert.deepEqual([plan.width, plan.height, plan.cabinetHeight], [1280, 1024, 640]);
    assert.deepEqual([plan.rows[1].y, plan.rows[1].height], [180, 640], 'Floor and top must never move');
    close(plan.cabinetWidth / plan.cabinetHeight, width / 2000, 'Physical aspect ratio');
    assert.ok(plan.cabinetWidth > previousWidth, 'A larger selection must visibly widen the product');
    previousWidth = plan.cabinetWidth;
    let source = 0, destination = 0;
    for (const slice of plan.slices) {
      assert.ok(slice.sourceWidth > 0 && slice.width > 0, `${model.id} ${width}: positive crop`);
      close(slice.sourceX, source, 'Source coverage');
      close(slice.x, destination, 'Destination coverage');
      source += slice.sourceWidth;
      destination += slice.width;
      for (const grain of ['vertical', 'horizontal', 'surface']) {
        const matrix = grainTransform(grain, slice.scaleX / plan.scaleY, slice.translateX / plan.scaleY)
          .slice(7, -1).split(' ').map(Number);
        close(Math.abs((grain === 'vertical' ? matrix[0] : matrix[2]) * slice.scaleX), plan.scaleY, 'Grain scale');
      }
    }
    close(source, 1024, 'Whole photo covered');
    close(destination, plan.width, 'Whole frame covered');
    assert.equal(plan.roomSlices.length, 3, 'The room must not inherit drawer or support slices');
    close(plan.roomSlices[1].width, plan.cabinetWidth, 'Continuous room opening');
    if (model.id === 'SRSTDH02' || model.id === 'SRDTDH01') {
      close(plan.slices[1].width / ppm, MODULE_WIDTH_MM, 'Tower stays exactly 507mm');
    }
    const posts: {start:number;end:number}[] = photo.joinery.columns[0].posts ?? [];
    assert.equal(posts.length, facePostsFor(model.id));
    posts.forEach((post, index) => {
      const slice = plan.slices.find(s => s.sourceX === post.start);
      assert.ok(slice);
      close(slice.width / ppm, BOARD_MM, 'Support stays exactly 18mm');
      const centre = (slice.x + slice.width / 2 - plan.slices[0].width) / ppm;
      close(centre, columnsFor(model.id, width)[0].widthMm * (index + 1) / (posts.length + 1), 'Visualizer support position');
    });
    configurations++;
  }
}
console.log(`Shop widths: ${configurations} configurations match visualizer bays/supports; fixed 2m height, 507mm towers, stable framing and grain pass.`);

});

test('walk-in wardrobe finishes, layout and quote details remain consistent', () => {
const item = CATALOGUE.find(p => p.id === 'walk-in-wardrobes');
assert.ok(item);
const initial = defaultSelection(item);
assert.equal(initial.variant, 'LS01');
assert.equal(initial.colour, 'Matt Polar White');
assert.equal(initial.hardware, 'T24 Brushed Matt Black');
assert.deepEqual(WALK_IN_LAYOUTS.map(m => m.name), ['Forma 4', 'Forma 5']);
assert.deepEqual(fieldsFor(item, initial).map(f => f.id), ['location', 'variant', 'colour', 'hardware']);
assert.deepEqual(WALK_IN_COLOURS.map(f => f.name), [
  'Matt Polar White', 'Woodmatt Black Ply', 'Matt Natural Oak',
]);
assert.deepEqual(WALK_IN_HARDWARE.map(f => f.name), [
  'Inox', 'Brushed Matt Black', 'Brushed Brass',
]);
assert.deepEqual(WALK_IN_HARDWARE.map(f => f.id), ['T23 Inox', 'T24 Brushed Matt Black', 'T25 Brushed Brass']);

assert.deepEqual(WALK_IN_COLOURS.map(({ name, hex }) => ({ name, hex })),
  WARDROBE_COLOURS.map(({ name, hex }) => ({ name, hex })));
const ids=new Set();
for (const layout of WALK_IN_LAYOUTS) {
  for(const colour of WALK_IN_COLOURS) for(const hardware of WALK_IN_HARDWARE) {
    const selection=withChoice(item, withChoice(item, {...initial,colour:colour.name}, 'variant', layout.id), 'hardware', hardware.id);
    const line=configuredLine(item, selection);
    assert.equal(line.name, 'Walk in wardrobes');
    assert.equal(line.fabricColour, colour.name);
    assert.equal(line.hardwareColour, hardware.name);
    assert.ok(line.options);
    for(const [label,value] of [['Model',layout.name],['Layout',layout.shape],['Footprint','2400 × 2400 mm'],['Height','2000 mm'],['Shelf depth','447 mm']]) {
      assert.ok(line.options.some(o=>o.label===label && o.value===value), label+' persists to quote');
    }
    assert.ok(!ids.has(line.blindType)); ids.add(line.blindType);
    const photo=shopPhoto(item.id,layout.id);
    assert.ok(photo);
    assert.equal(photo.walkIn,layout.id);
    assert.ok(readFileSync('public'+photo.src).length>1000);
    if (colour.texture) assert.ok(readFileSync('public'+colour.texture).length>100);
    assert.equal(fieldsFor(item, selection).find(f=>f.id==='colour')?.kind,'swatches');
    assert.equal(fieldsFor(item, selection).find(f=>f.id==='hardware')?.kind,'swatches');
  }
}
assert.equal(ids.size,18);
const migrated=withChoice(item,{...initial,variant:'12.0U',colour:'Woodmatt Notaio Walnut',hardware:'Brass'},'variant','US01');
assert.equal(migrated.colour,'Matt Polar White');
assert.equal(migrated.hardware,'T24 Brushed Matt Black');
console.log('Walk-ins: both PDF layouts, 18 finish/handle combinations, fixed dimensions, source photos and complete quote details pass.');

});
