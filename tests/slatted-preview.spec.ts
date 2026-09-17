import { test, expect } from '@playwright/test';

import { portrait } from './helpers/visualiserPhoto';

test.beforeEach(async ({ page }, info) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  if (info.project.name === 'forced-dark-android') {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setAutoDarkModeOverride', { enabled: true });
  }
  if (info.project.name === 'basic-android') await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string, ...args: unknown[]) {
      return id.includes('webgl') ? null : Reflect.apply(getContext, this, [id, ...args]);
    } as typeof getContext;
  });
});

test('Venetian materials, tilt and stacking work on a tilted uploaded opening', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/visualiser?category=venetian');
  const corners = await portrait(page, true);
  const canvas = page.locator('canvas[data-blind-product="venetian"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  const centre = () => canvas.evaluate((surface: HTMLCanvasElement, quad) => {
    const point = [0, 1].map(c => quad.reduce((sum, p) => sum + p[c], 0) / 4);
    return surface.getContext('2d')!.getImageData(Math.round(point[0]), Math.round(point[1]), 1, 1).data[0];
  }, corners);
  await page.getByRole('slider', { name: 'Venetian lift' }).press('End');
  await page.getByRole('slider', { name: 'Slat tilt' }).press('End');
  for (const material of ['UltraSlat', 'Basswood', 'Aluminium']) {
    await page.getByRole('button', { name: material, exact: true }).click();
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await canvas.screenshot({ path: info.outputPath(`${material}-closed.png`) });
  }
  await page.getByRole('button', { name: 'Aluminium Jet Black', exact: true }).click();
  await expect.poll(centre).toBeLessThan(80);
  await page.getByRole('slider', { name: 'Venetian lift' }).press('Home');
  await expect.poll(centre).toBeGreaterThan(150);
  await canvas.screenshot({ path: info.outputPath('venetian-stacked.png') });
  await page.getByRole('slider', { name: 'Venetian lift' }).press('End');
  await page.getByRole('slider', { name: 'Slat tilt' }).press('Home');
  await canvas.screenshot({ path: info.outputPath('venetian-open.png') });
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('Venetian Blinds');
  await expect(page.locator('main')).toContainText('Aluminium Jet Black');
  await expect(page.locator('main')).toContainText('Price on measure');
  expect(errors).toEqual([]);
});

test('plantation louvers tilt inside their frame and selections survive cart and theme changes', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/visualiser?category=plantation');
  const canvas = page.locator('canvas[data-blind-product="plantation"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await canvas.screenshot({ path: info.outputPath('plantation-room.png') });
  const image = () => canvas.evaluate((surface: HTMLCanvasElement) => surface.toDataURL());
  await page.getByRole('slider', { name: 'Slat tilt' }).press('Home');
  const opened = await image();
  await page.getByRole('slider', { name: 'Slat tilt' }).press('End');
  await expect.poll(image).not.toBe(opened);
  await canvas.screenshot({ path: info.outputPath('plantation-closed.png') });
  await page.getByRole('button', { name: 'Walnut', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await canvas.screenshot({ path: info.outputPath('plantation-walnut.png') });
  const walnut = await image();
  await page.emulateMedia({ colorScheme: info.project.use.colorScheme === 'dark' ? 'light' : 'dark' });
  expect(await image()).toBe(walnut);
  await portrait(page, true);
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect((await download).suggestedFilename()).toContain('plantation');
  const beforeMotor = await image();
  await page.getByRole('button', { name: 'Motorised', exact: true }).click();
  await page.getByRole('button', { name: 'Open the blind', exact: true }).click();
  await expect.poll(image).not.toBe(beforeMotor);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('Plantation Shutters');
  await expect(page.locator('main')).toContainText('Walnut');
  expect(errors).toEqual([]);
});

test('Venetian room preview uses photographed materials without a roller underneath', async ({ page }, info) => {
  await page.goto('/visualiser?category=venetian');
  const canvas = page.locator('canvas[data-blind-product="venetian"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await canvas.screenshot({ path: info.outputPath('venetian-room.png') });
  await page.getByRole('button', { name: 'Basswood', exact: true }).click();
  await page.getByRole('button', { name: 'Basswood Walnut', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await canvas.screenshot({ path: info.outputPath('venetian-walnut-room.png') });
});

test('homepage grouped navigation switches window products and opens the correct shop families', async ({ page }, info) => {
  await page.goto('/#visualiser');
  const panel = page.locator('#visualiser');
  const navigation = panel.getByRole('navigation', { name: 'Visualiser products' });
  await expect(navigation.getByRole('group', { name: 'Indoor window coverings' })).toBeVisible();
  for (const [name, category] of [['Venetian', 'venetian'], ['Plantation shutters', 'plantation'], ['Honeycomb', 'honeycomb']]) {
    await panel.getByRole('button', { name, exact: true }).click();
    await expect(panel.locator(`canvas[data-blind-product="${category}"]`)).toHaveAttribute('data-render-ready', 'true');
  }
  await navigation.getByRole('button', { name: 'Curtains', exact: true }).click();
  await expect(panel.locator('canvas[data-render-surface="curtain"]')).toHaveAttribute('data-render-ready', 'true');
  await navigation.screenshot({ path: info.outputPath('visualiser-groups.png') });
  await navigation.getByRole('link', { name: 'Outdoor coverings Shop →', exact: true }).click();
  await expect(page).toHaveURL(/area=Outdoor/);
  await expect(page.locator('.shop-result-card').filter({ hasText: 'Folding Arm Awnings' })).toBeVisible();
  await page.goBack();
  await navigation.getByRole('link', { name: 'Mirrors & shower screens Shop →', exact: true }).click();
  await expect(page).toHaveURL(/type=mirrors&type=shower-screens/);
  await expect(page.locator('.shop-result-card').filter({ hasText: 'Mirrors Frameless' })).toBeVisible();
  expect(await page.locator('.shop-result-card').filter({ hasText: 'Roller Blinds' }).count()).toBe(0);
});
