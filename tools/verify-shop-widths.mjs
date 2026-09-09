import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const modules = new Map();
function moduleUrl(file) {
  file = resolve(file);
  if (modules.has(file)) return modules.get(file);
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const code = outputText.replace(/from ['"]([^'"]+)['"]/g, (_, specifier) => {
    const dependency = specifier === '@/features/visualiser'
      ? resolve('src/features/visualiser/wardrobeGeometry.ts') : resolve(dirname(file), `${specifier}.ts`);
    return `from '${moduleUrl(dependency)}'`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  modules.set(file, url);
  return url;
}
const { SHOP_PHOTOS } = await import(moduleUrl('src/features/catalogue/shopPhotos.ts'));
const { wardrobeModelById } = await import(moduleUrl('src/features/visualiser/wardrobes.ts'));
const { joineryWidthSlices, JOINERY_HEIGHT_MM, grainTransform } = await import(moduleUrl('src/features/catalogue/lib/joineryPhotoWidth.ts'));
const { columnsFor, facePostsFor, MODULE_WIDTH_MM, BOARD_MM } = await import(moduleUrl('src/features/visualiser/wardrobeGeometry.ts'));
const close = (a, b, message) => assert.ok(Math.abs(a - b) < 1e-7, `${message}: ${a} vs ${b}`);
let configurations = 0;
for (const photo of [...Object.values(SHOP_PHOTOS.wardrobes), ...Object.values(SHOP_PHOTOS.shelving)]) {
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
    if (model.id === 'SRSTDH02' || model.id === 'SRDTDH01') {
      close(plan.slices[1].width / ppm, MODULE_WIDTH_MM, 'Tower stays exactly 507mm');
    }
    const posts = photo.joinery.columns[0].posts ?? [];
    assert.equal(posts.length, facePostsFor(model.id));
    posts.forEach((post, index) => {
      const slice = plan.slices.find(s => s.sourceX === post.start);
      close(slice.width / ppm, BOARD_MM, 'Support stays exactly 18mm');
      const centre = (slice.x + slice.width / 2 - plan.slices[0].width) / ppm;
      close(centre, columnsFor(model.id, width)[0].widthMm * (index + 1) / (posts.length + 1), 'Visualizer support position');
    });
    configurations++;
  }
}
console.log(`Shop widths: ${configurations} configurations match visualizer bays/supports; fixed 2m height, 507mm towers, stable framing and grain pass.`);
