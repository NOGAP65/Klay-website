import { test, expect } from '@playwright/test';

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

test('honeycomb renders both fabrics, folds onto its rail and preserves a tilted customer trace', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/visualiser');
  const corners = await portrait(page, true);
  await page.getByRole('button', { name: 'Honeycomb', exact: true }).click();
  const canvas = page.locator('canvas[data-blind-product="honeycomb"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  const sample = () => canvas.evaluate((surface: HTMLCanvasElement, quad) => {
    const ctx = surface.getContext('2d')!;
    const centre = [0, 1].map(c => quad.reduce((sum, p) => sum + p[c], 0) / 4);
    return Array.from(ctx.getImageData(Math.round(centre[0]), Math.round(centre[1]), 1, 1).data).slice(0, 3);
  }, corners);
  await page.getByRole('slider', { name: 'Honeycomb position' }).press('End');
  await page.getByRole('button', { name: 'Honeycomb Frostal', exact: true }).click();
  await expect.poll(async () => (await sample())[0]).toBeGreaterThan(210);
  await canvas.screenshot({ path: info.outputPath('blockout-full.png') });
  await page.getByRole('button', { name: 'Honeycomb Regal Slate', exact: true }).click();
  await expect.poll(async () => (await sample())[0]).toBeLessThan(140);
  await page.getByRole('slider', { name: 'Honeycomb position' }).press('Home');
  await expect.poll(async () => (await sample())[0]).toBeGreaterThan(170);
  await canvas.screenshot({ path: info.outputPath('stacked-open.png') });
  await page.getByRole('button', { name: 'Day & Night', exact: true }).click();
  await page.getByRole('slider', { name: 'Honeycomb position' }).press('End');
  const balance = page.getByRole('slider', { name: 'Day & Night balance' });
  await balance.press('Home');
  await expect.poll(async () => (await sample())[0]).toBeLessThan(140);
  const night = (await sample())[0];
  await balance.press('End');
  await expect.poll(async () => (await sample())[0]).toBeGreaterThan(night + 10);
  await canvas.screenshot({ path: info.outputPath('day-fabric.png') });
  const before = await sample();
  await page.emulateMedia({ colorScheme: info.project.use.colorScheme === 'dark' ? 'light' : 'dark' });
  expect(await sample()).toEqual(before);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect((await download).suggestedFilename()).toContain('honeycomb-daynight');
  await page.getByRole('button', { name: 'Roller', exact: true }).click();
  await expect(page.locator('canvas[data-blind-product="roller"]')).toHaveAttribute('data-render-ready', 'true');
  await expect(page.getByRole('button', { name: 'Confirm outline', exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('homepage honeycomb uses the same room and adds its actual configuration to cart', async ({ page }, info) => {
  await page.goto('/#visualiser');
  const panel = page.locator('#visualiser');
  await panel.getByRole('button', { name: 'Honeycomb', exact: true }).click();
  await panel.getByRole('button', { name: 'Day & Night', exact: true }).click();
  await panel.getByRole('button', { name: 'Honeycomb Dunora', exact: true }).click();
  await expect(panel.locator('canvas[data-blind-product="honeycomb"]')).toHaveAttribute('data-render-ready', 'true');
  const photoBounds = await panel.locator('canvas[data-blind-product="honeycomb"]').boundingBox();
  const controlBounds = await panel.locator('.preview-mechanisms').boundingBox();
  expect(controlBounds!.x - photoBounds!.x).toBeLessThan(20);
  expect(controlBounds!.y).toBeGreaterThanOrEqual(photoBounds!.y);
  expect(controlBounds!.y + controlBounds!.height).toBeLessThanOrEqual(photoBounds!.y + photoBounds!.height);
  await panel.locator('canvas[data-blind-product="honeycomb"]').screenshot({ path: info.outputPath('room-daynight.png') });
  await panel.getByRole('button', { name: 'Motorised', exact: true }).click();
  await panel.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('Honeycomb Blinds');
  await expect(page.locator('main')).toContainText('Day & Night');
  await expect(page.locator('main')).toContainText('Honeycomb Dunora');
  await expect(page.locator('main')).toContainText('Price on measure');
});

test('honeycomb deep link, motor controls and missing texture recover without a blank preview', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/images/shop/honeycomb-blockout.webp', route => route.abort());
  await page.goto('/visualiser?category=honeycomb&type=daynight');
  const canvas = page.locator('canvas[data-blind-product="honeycomb"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await page.getByRole('button', { name: 'Blinds', exact: true }).click();
  await expect(canvas).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Day & Night balance' })).toBeVisible();
  await page.getByRole('button', { name: 'Motorised', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Honeycomb position' })).toHaveCount(0);
  const snapshot = () => canvas.evaluate((surface: HTMLCanvasElement) => surface.toDataURL());
  const closed = await snapshot();
  await page.getByRole('button', { name: 'Open the blind', exact: true }).click();
  await expect.poll(snapshot).not.toBe(closed);
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await page.getByRole('button', { name: 'Close the blind', exact: true }).click();
  await expect.poll(snapshot).toBe(closed);
  await page.getByRole('button', { name: 'Manual', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Honeycomb position' })).toHaveAttribute('aria-valuenow', '100');
  expect(errors).toEqual([]);
});
