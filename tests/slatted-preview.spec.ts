import { test, expect } from '@playwright/test';

import { slattedPlane, venetianSlats, plantationPanels } from '../src/features/visualiser/slattedGeometry';

import { portrait } from './helpers/visualiserPhoto';

import type { Point } from '../src/features/visualiser/homography';

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

test('side views keep their fitted edges and shade uniformly along each slat', async ({ page }, info) => {
  for (const corners of [
    [[.12, .08], [.85, .22], [.86, .7], [.13, .88]],
    [[.13, .24], [.86, .06], [.85, .88], [.12, .72]],
  ]) {
    await page.goto('/visualiser?category=venetian');
    const traced = await portrait(page, false, { corners, background: '#b400b4' }) as Point[];
    const plane = slattedPlane(traced);
    for (const category of ['venetian', 'plantation']) {
      if (category === 'plantation') await page.getByRole('button', { name: 'Plantation shutters', exact: true }).click();
      const canvas = page.locator(`canvas[data-blind-product="${category}"]`);
      await expect(canvas).toHaveAttribute('data-render-ready', 'true');
      await page.getByRole('slider', { name: 'Slat tilt' }).press('End');
      if (category === 'venetian') await page.getByRole('slider', { name: 'Venetian lift' }).press('End');
      await canvas.screenshot({ path: info.outputPath(`${category}-${corners[0][1]}-angled.png`) });
      const geometry = category === 'venetian' ? venetianSlats(plane, { position: 1, tilt: 1 })
        : plantationPanels(plane, 1).panels[0].sections[0];
      const middle = geometry.slats[Math.floor(geometry.slats.length / 2)];
      const points = [
        ...[.2, .4, .6, .8].flatMap(y => [plane.project(.006, y), plane.project(.994, y)]),
        ...[.2, .4, .6, .8].flatMap(x => [plane.project(x, .006), plane.project(x, .994)]),
        ...[.21, .31, .41, .61, .71, .81].map(x => plane.project(x, middle.centre, 14)),
      ];
      const greens = await canvas.evaluate((surface: HTMLCanvasElement, coordinates) => coordinates.map(([x, y]) =>
        surface.getContext('2d')!.getImageData(Math.round(x), Math.round(y), 1, 1).data[1]), points);
      expect(Math.min(...greens.slice(0, 16)), 'No uncovered strip at the perimeter').toBeGreaterThan(45);
      const slat = greens.slice(16);
      expect(Math.max(...slat) - Math.min(...slat), 'No diagonal lighting wedge along the slat').toBeLessThan(24);
    }
  }
});

test('shop offers five UltraSlat colours without a material choice', async ({ page }) => {
  await page.goto('/products?q=venetian');
  const product = page.locator('.shop-result-card').first();
  await expect(product).toContainText('UltraSlat');
  await expect(product.getByRole('button', { name: /^(Aluminium|Basswood|UltraSlat)$/ })).toHaveCount(0);
  await expect(product.getByRole('button', { name: /^UltraSlat / })).toHaveCount(5);
  await product.getByRole('button', { name: 'UltraSlat Manuscript', exact: true }).click();
  await expect(product.locator('canvas[data-fabric-photo="venetian-blinds"]')).toHaveAttribute('data-render-ready', 'true');
  await product.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('UltraSlat Manuscript');
  await expect(page.locator('main')).not.toContainText('Material');
});

test('UltraSlat colours, tilt and stacking work on a tilted uploaded opening', async ({ page }, info) => {
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
  await expect(page.getByRole('button', { name: /^(UltraSlat|Aluminium|Basswood)$/ })).toHaveCount(0);
  const white = await centre();
  for (const colour of ['UltraSlat Breeze White', 'UltraSlat Beachshell', 'UltraSlat Manuscript']) {
    await page.getByRole('button', { name: colour, exact: true }).click();
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await canvas.screenshot({ path: info.outputPath(`${colour}-closed.png`) });
  }
  await expect.poll(centre).toBeLessThan(white - 5);
  await page.getByRole('slider', { name: 'Venetian lift' }).press('Home');
  await expect.poll(centre).toBeGreaterThan(150);
  await canvas.screenshot({ path: info.outputPath('venetian-stacked.png') });
  await page.getByRole('slider', { name: 'Venetian lift' }).press('End');
  await page.getByRole('slider', { name: 'Slat tilt' }).press('Home');
  await canvas.screenshot({ path: info.outputPath('venetian-open.png') });
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('Venetian Blinds');
  await expect(page.locator('main')).toContainText('UltraSlat Manuscript');
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
  await page.getByRole('button', { name: 'UltraSlat Manuscript', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await canvas.screenshot({ path: info.outputPath('venetian-manuscript-room.png') });
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
