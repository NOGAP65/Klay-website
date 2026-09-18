import { test, expect, type Page, type Locator } from '@playwright/test';
import sharp from 'sharp';

test.beforeEach(async ({ page }, info) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  if (info.project.name === 'basic-android') await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string, ...args: unknown[]) {
      return id.startsWith('webgl') || id === 'experimental-webgl' ? null : Reflect.apply(getContext, this, [id, ...args]);
    } as typeof getContext;
  });
  if (info.project.name === 'forced-dark-android') {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setAutoDarkModeOverride', { enabled: true });
  }
});

async function upload(page: Page) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Upload room photo', exact: true }).click();
  await (await chooser).setFiles({ name: 'my-recess.jpg', mimeType: 'image/jpeg',
    buffer: await sharp('public/images/visualiser/openings/opening-1800.jpeg').jpeg().toBuffer() });
  await traceOpening(page);
}

async function traceOpening(page: Page) {
  const photo = page.getByAltText('Your wardrobe room');
  await expect(photo).toBeVisible();
  const targets = [[.348,.336],[.645,.336],[.645,.835],[.348,.835]];
  for (let i = 0; i < 4; i++) {
    const pin = page.getByRole('button', { name: new RegExp(`^Trace corner ${i + 1}`) });
    await pin.scrollIntoViewIfNeeded();
    const box = (await pin.boundingBox())!;
    const frame = (await photo.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(frame.x + frame.width * targets[i][0], frame.y + frame.height * targets[i][1], { steps: 3 });
    await page.mouse.up();
  }
}

async function measurements(page: Page, width: string, height: string, depth: string) {
  await page.getByLabel('Width (mm)*', { exact: true }).fill(width);
  await page.getByLabel('Height (mm)*', { exact: true }).fill(height);
  await page.getByLabel('Depth (mm)*', { exact: true }).fill(depth);
  await page.getByRole('button', { name: 'Confirm measurements & preview', exact: true }).click();
}

async function sample(canvas: Locator) {
  return canvas.evaluate((el: HTMLCanvasElement) => {
    const { data } = el.getContext('2d')!.getImageData(0, 0, el.width, el.height);
    let sum = 0;
    // Sample the continuous top board, not the customer's wall visible through
    // this open-backed product. Empty compartments must keep the photo intact.
    for (let y = Math.ceil(el.height * .337); y < el.height * .339; y++)
      for (let x = Math.floor(el.width * .36); x < el.width * .62; x++) sum += data[(y * el.width + x) * 4];
    return sum;
  });
}

test('wardrobe room rejects oversize dimensions and preserves material and width changes at measured scale', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/visualiser?category=wardrobe');
  await page.getByRole('button', { name: 'Visualise in your own room', exact: true }).click();
  await upload(page);
  await measurements(page, '1500', '2000', '450');
  const fit = page.locator('[data-room-fit]');
  await expect(fit).toHaveAttribute('data-room-fit', 'too-small');
  await expect(fit).toContainText('300 mm too wide');
  await expect(fit).toContainText('16 mm too tall');
  await expect(fit).toContainText('50 mm too deep');
  const canvas = page.locator('canvas[data-render-surface="wardrobe-room"]');
  await expect(canvas).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit outline or measurements' }).click();
  await measurements(page, '1800', '2016', '600');
  await expect(fit).toHaveAttribute('data-room-fit', 'fits');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  if (info.project.name === 'basic-android') await expect(canvas).toHaveAttribute('data-render-mode', 'canvas2d');
  const before = await sample(canvas);
  await page.getByRole('button', { name: 'Woodmatt Black Ply', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await expect.poll(() => sample(canvas)).toBeLessThan(before * .9);
  await canvas.screenshot({ path: info.outputPath('measured-wardrobe-black.png') });
  await page.getByRole('button', { name: 'Matt Natural Oak', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await canvas.screenshot({ path: info.outputPath('measured-wardrobe-oak.png') });
  await page.getByRole('combobox').selectOption('2100');
  await expect(fit).toHaveAttribute('data-room-fit', 'too-small');
  await expect(canvas).toHaveCount(0);
  await page.getByRole('combobox').selectOption('1500');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await expect(fit).toContainText('1500 W × 2016 H × 500 D');
  await canvas.screenshot({ path: info.outputPath('smaller-wardrobe-keeps-height.png') });
  await page.getByRole('button', { name: 'Against a wall', exact: true }).click();
  await expect(canvas).toHaveCount(0);
  await expect(page.getByLabel('Width (mm)*', { exact: true })).toHaveValue('');
  await traceOpening(page);
  await measurements(page, '1800', '2400', '600');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await canvas.screenshot({ path: info.outputPath('against-wall-depth.png') });
  await page.getByRole('button', { name: 'Back to 3D preview', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Visualise in your own room', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('both walk-in layouts check the full room depth and render in a customer photo', async ({ page }, info) => {
  await page.goto('/visualiser?category=wardrobe');
  await page.getByRole('button', { name: 'Walk-in', exact: true }).click();
  await page.getByRole('button', { name: 'Visualise in your own room', exact: true }).click();
  await upload(page);
  await measurements(page, '2400', '2400', '2000');
  await expect(page.locator('[data-room-fit]')).toContainText('400 mm too deep');
  await page.getByRole('button', { name: 'Edit outline or measurements' }).click();
  await measurements(page, '2400', '2400', '2400');
  const canvas = page.locator('canvas[data-render-surface="wardrobe-room"]');
  for (const model of ['Forma 4', 'Forma 5']) {
    await page.getByRole('button', { name: model, exact: true }).click();
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await expect(page.locator('[data-room-fit]')).toHaveAttribute('data-room-fit', 'fits');
    await canvas.screenshot({ path: info.outputPath(`${model}-in-room.png`) });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a slow room finish keeps the photo and cannot overwrite a newer selection', async ({ page }, info) => {
  test.skip(info.project.name === 'basic-android', 'Canvas fallback has no finish asset to delay');
  await page.goto('/visualiser?category=wardrobe');
  await page.getByRole('button', { name: 'Visualise in your own room', exact: true }).click();
  await upload(page);
  await measurements(page, '1800', '2200', '600');
  const canvas = page.locator('canvas[data-render-surface="wardrobe-room"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  const previous = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/finishes/natural-oak.jpg', async route => { await gate; await route.continue(); });
  try {
    await page.getByRole('button', { name: 'Matt Natural Oak', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Loading wardrobe' })).toBeVisible();
    expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(previous);
    await page.getByRole('button', { name: 'Woodmatt Black Ply', exact: true }).click();
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    const black = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
    expect(black).not.toBe(previous);
    release();
    await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.endsWith('/finishes/natural-oak.jpg')))).toBe(true);
    await page.getByRole('button', { name: 'Silver (F16)', exact: true }).click();
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    // A further redraw after the delayed asset has loaded still uses black.
    await page.getByRole('button', { name: 'Black (F11)', exact: true }).click();
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(black);
    await expect(page.getByRole('alert')).toHaveCount(0);
  } finally { release(); }
});
