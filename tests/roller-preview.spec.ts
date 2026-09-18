import { test, expect, type Locator } from '@playwright/test';

import { portrait } from './helpers/visualiserPhoto';

async function band(canvas: Locator, row: number) {
  return canvas.evaluate((source: HTMLCanvasElement, y) => {
    const ctx = source.getContext('2d')!;
    const scale = source.width / 900;
    let total = 0;
    for (let x = 250; x < 650; x += 8) {
      const pixel = ctx.getImageData(Math.round(x * scale), Math.round(y * scale), 1, 1).data;
      total += (pixel[0] + pixel[1] + pixel[2]) / 3;
    }
    return total / 50;
  }, row);
}

test('shop front-roll uses fabric on the crown and independent hardware on every roller type', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  if (info.project.name === 'forced-dark-android') {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setAutoDarkModeOverride', { enabled: true });
  }
  await page.goto('/products?q=roller+blinds');
  const canvas = page.locator('canvas[data-fabric-photo="roller-blinds"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  for (const type of ['Blockout', 'Light filter', 'Sunscreen', 'Dual']) {
    await page.getByRole('button', { name: type, exact: true }).click();
    const dark = type === 'Sunscreen' ? 'Panorama 5% Anthracite' : 'Essence Carbon';
    const pale = type === 'Sunscreen' ? 'Panorama 5% Polar' : 'Essence Ice';
    await page.getByRole('button', { name: pale, exact: true }).click();
    await page.getByRole('button', { name: 'White', exact: true }).click();
    await expect.poll(() => band(canvas, 157)).toBeGreaterThan(160);
    const paleRoll = await band(canvas, 157);
    await page.getByRole('button', { name: dark, exact: true }).click();
    await expect.poll(() => band(canvas, 157)).toBeLessThan(paleRoll - 40);
    const darkRoll = await band(canvas, 157);
    // The former white hardware stripe cut across the fabric at y=154.
    expect(await band(canvas, 154)).toBeLessThan(paleRoll - 35);
    await expect.poll(() => band(canvas, 583)).toBeGreaterThan(160);
    if (type === 'Dual') expect(await band(canvas, 301)).toBeGreaterThan(160);
    await canvas.screenshot({ path: info.outputPath(`${type}-front-roll-dark.png`) });
    await page.getByRole('button', { name: 'Black', exact: true }).click();
    await expect.poll(() => band(canvas, 583)).toBeLessThan(90);
    if (type === 'Dual') expect(await band(canvas, 301)).toBeLessThan(90);
    expect(Math.abs(await band(canvas, 157) - darkRoll)).toBeLessThan(2);
    // A pale cloth with black fittings must have a pale roll, not a black tube.
    await page.getByRole('button', { name: pale, exact: true }).click();
    await expect.poll(() => band(canvas, 157)).toBeGreaterThan(darkRoll + 40);
    expect(await band(canvas, 583)).toBeLessThan(90);
    if (type === 'Dual') expect(await band(canvas, 301)).toBeLessThan(90);
    await canvas.screenshot({ path: info.outputPath(`${type}-front-roll-pale.png`) });
  }
  expect(errors).toEqual([]);
});

test('Smoky Quartz samples cloth without repeating its pale scan border', async ({ page }, info) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.goto('/visualiser');
  const corners = await portrait(page);
  await page.getByRole('button', { name: 'Symphony', exact: true }).click();
  const swatch = page.getByRole('button', { name: 'Symphony Smoky Quartz', exact: true });
  await swatch.click();
  await expect(swatch).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('slider').press('End');
  const canvas = page.locator('canvas[data-blind-product="roller"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  const stripeContrast = () => canvas.evaluate((surface: HTMLCanvasElement, quad) => {
    const ctx = surface.getContext('2d')!;
    const columns = Array.from({ length: 201 }, (_, col) => {
      const u = .08 + .84 * col / 200;
      let total = 0;
      for (let row = 0; row < 80; row++) {
        const v = .18 + .64 * row / 79;
        const p = [0, 1].map(axis => (quad[0][axis] * (1 - u) + quad[1][axis] * u) * (1 - v)
          + (quad[3][axis] * (1 - u) + quad[2][axis] * u) * v);
        // Average yarn-scale highlights; detect a sustained band, not one thread.
        const pixels = ctx.getImageData(Math.round(p[0]) - 2, Math.round(p[1]), 5, 1).data;
        total += (pixels[0] + pixels[4] + pixels[8] + pixels[12] + pixels[16]) / 5;
      }
      return total / 80;
    });
    return Math.max(...columns.slice(1).map((value, i) => Math.abs(value - columns[i])));
  }, corners);
  await expect.poll(stripeContrast).toBeLessThan(3);
  await canvas.screenshot({ path: info.outputPath('smoky-quartz-no-stripe.png') });
  await page.goto('/products?q=roller+blinds');
  await page.getByRole('button', { name: 'Symphony', exact: true }).click();
  await page.getByRole('button', { name: 'Symphony Smoky Quartz', exact: true }).click();
  const shop = page.locator('canvas[data-fabric-photo="roller-blinds"]');
  await expect(shop).toHaveAttribute('data-render-ready', 'true');
  await expect(shop).toHaveAttribute('data-fabric-inset', '0.025');
  await shop.screenshot({ path: info.outputPath('smoky-quartz-shop.png') });
});
