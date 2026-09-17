import { test, expect, type Locator } from '@playwright/test';

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
