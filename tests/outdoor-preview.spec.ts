import { test, expect, type Locator } from '@playwright/test';

import { portrait } from './helpers/visualiserPhoto';

test.beforeEach(async ({ page }, info) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  if (info.project.name === 'basic-android') await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string, ...args: unknown[]) {
      return id.includes('webgl') ? null : Reflect.apply(original, this, [id, ...args]);
    } as typeof original;
  });
  if (info.project.name === 'forced-dark-android') {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setAutoDarkModeOverride', { enabled: true });
  }
});

const sample = (canvas: Locator, point = [.5, .34]) => canvas.evaluate((surface: HTMLCanvasElement, point) => {
  const data = surface.getContext('2d')!.getImageData(Math.round(surface.width * point[0]), Math.round(surface.height * point[1]), 1, 1).data;
  return (data[0] + data[1] + data[2]) / 3;
}, point);

for (const category of ['roller-shutter', 'zip-screen'] as const) {
  test(`${category} room, colours, opening, basket and product switching work`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/visualiser?category=${category}`);
    const canvas = page.locator(`canvas[data-blind-product="${category}"]`);
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    const position = page.getByRole('slider', { name: 'Outdoor covering position' });
    await position.press('End');
    await page.getByRole('button', { name: category === 'roller-shutter' ? 'White' : 'Bone', exact: true }).click();
    const light = await sample(canvas), outside = await sample(canvas, [.03, .9]);
    await page.getByRole('button', { name: category === 'roller-shutter' ? 'Charcoal' : 'Black', exact: true }).click();
    await expect.poll(() => sample(canvas)).toBeLessThan(light - 40);
    const dark = await sample(canvas);
    await page.emulateMedia({ colorScheme: info.project.use.colorScheme === 'dark' ? 'light' : 'dark' });
    expect(await sample(canvas)).toBe(dark);
    await canvas.screenshot({ path: info.outputPath(`${category}-closed.png`) });
    await position.press('Home');
    await expect.poll(() => sample(canvas)).not.toBe(dark);
    // Chromium's accelerated photo readback can differ by one colour level.
    expect(Math.abs(await sample(canvas, [.03, .9]) - outside)).toBeLessThanOrEqual(1);
    await canvas.screenshot({ path: info.outputPath(`${category}-open.png`) });
    await page.getByRole('button', { name: category === 'roller-shutter' ? 'Battery' : 'Motorised', exact: true }).click();
    await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
    await page.goto('/cart');
    await expect(page.locator('main')).toContainText(category === 'roller-shutter' ? 'Roller Shutters' : 'Zip Guide Systems');
    await expect(page.locator('main')).toContainText(category === 'roller-shutter' ? 'Charcoal' : 'Black');
    await expect(page.locator('main')).toContainText('Price on measure');
    await page.goto(`/visualiser?category=${category}`);
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    const next = category === 'roller-shutter' ? 'zip-screen' : 'roller-shutter';
    await page.getByRole('button', { name: category === 'roller-shutter' ? 'Zip screens' : 'Roller shutters', exact: true }).click();
    await expect(page.locator(`canvas[data-blind-product="${next}"]`)).toHaveAttribute('data-render-ready', 'true');
    await expect(page.locator('img[data-preview-backdrop]')).toHaveAttribute('src', new RegExp(next === 'zip-screen' ? 'zip-screen-alfresco' : 'roller-shutter-exterior'));
    await expect(page.getByRole('button', { name: 'Confirm outline', exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('outdoor renderers retain an angled customer trace and export the selected product', async ({ page }, info) => {
  await page.goto('/visualiser?category=roller-shutter');
  const corners = await portrait(page, true);
  for (const category of ['roller-shutter', 'zip-screen']) {
    await page.getByRole('button', { name: category === 'roller-shutter' ? 'Roller shutters' : 'Zip screens', exact: true }).click();
    const canvas = page.locator(`canvas[data-blind-product="${category}"]`);
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await page.getByRole('slider', { name: 'Outdoor covering position' }).press('End');
    await page.getByRole('button', { name: 'Charcoal', exact: true }).click();
    const centre = corners.reduce((acc, p) => [acc[0] + p[0] / 3200, acc[1] + p[1] / 4800], [0, 0]);
    await expect.poll(() => sample(canvas, centre)).toBeLessThan(135);
    await canvas.screenshot({ path: info.outputPath(`${category}-angled.png`) });
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    expect((await download).suggestedFilename()).toContain(category);
    await expect(page.getByRole('button', { name: 'Confirm outline', exact: true })).toHaveCount(0);
  }
});
