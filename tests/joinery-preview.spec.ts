import { test, expect, type Locator } from '@playwright/test';
import sharp from 'sharp';

async function frame(canvas: Locator) {
  const png = await canvas.screenshot();
  // Inspect the product, excluding the wall-colour chip and orbit controls.
  const image = sharp(png).resize(200, 160, { fit: 'fill' });
  const stats = await image.extract({ left: 60, top: 35, width: 90, height: 105 }).stats();
  return { png, deviation: stats.channels[0].stdev, brightness: stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.mean, 0) / 3 };
}

async function finishChange(before: Buffer, after: Buffer) {
  const pixels = (png: Buffer) => sharp(png).resize(200, 160, { fit: 'fill' })
    .extract({ left: 60, top: 35, width: 90, height: 105 }).removeAlpha().raw().toBuffer();
  const [a, b] = await Promise.all([pixels(before), pixels(after)]);
  let changed = 0, delta = 0;
  for (let i = 0; i < a.length; i += 3) {
    const difference = (b[i] + b[i + 1] + b[i + 2] - a[i] - a[i + 1] - a[i + 2]) / 3;
    if (Math.abs(difference) > 20) { changed++; delta += difference; }
  }
  return { proportion: changed / (a.length / 3), delta: delta / Math.max(1, changed) };
}

for (const product of ['Wardrobes', 'Shelving']) {
  test(`${product} keep visible geometry and correct finishes after scene replacements`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/visualiser');
    await page.getByRole('button', { name: product, exact: true }).click();
    const host = page.getByLabel('Interactive 3D product preview', { exact: true });
    const canvas = host.locator('canvas');
    const ready = async () => {
      await expect(host).toHaveAttribute('data-preview-loading', 'false');
      await expect(page.getByRole('button', { name: 'Reset 3D view to 30 degrees' })).toBeEnabled();
      await expect.poll(async () => (await frame(canvas)).deviation).toBeGreaterThan(20);
    };
    await ready();
    const initial = await frame(canvas);
    await canvas.evaluate(element => { element.dataset.testIdentity = 'original'; });
    await page.getByRole('button', { name: 'Woodmatt Black Ply', exact: true }).click();
    await ready();
    const black = await frame(canvas);
    const darkening = await finishChange(initial.png, black.png);
    expect(darkening.proportion).toBeGreaterThan(.02);
    expect(darkening.delta).toBeLessThan(-30);
    await canvas.screenshot({ path: info.outputPath('black-product.png') });

    await page.getByRole('button', { name: 'Matt Natural Oak', exact: true }).click();
    await ready();
    const oak = await frame(canvas);
    const lightening = await finishChange(black.png, oak.png);
    expect(lightening.proportion).toBeGreaterThan(.02);
    expect(lightening.delta).toBeGreaterThan(30);
    await page.getByRole('button', { name: product === 'Wardrobes' ? 'Forma 3' : 'Forma 8', exact: true }).click();
    await ready();
    expect((await frame(canvas)).png.equals(oak.png)).toBe(false);
    const previousWidth = await frame(canvas);
    await page.getByRole('combobox').selectOption(product === 'Wardrobes' ? '2100' : '3000');
    await ready();
    expect((await frame(canvas)).png.equals(previousWidth.png)).toBe(false);
    await page.getByRole('button', { name: 'Against a wall', exact: true }).click();
    await ready();
    await page.getByRole('button', { name: 'In a recess', exact: true }).click();
    await ready();
    if (product === 'Wardrobes') {
      const beforeHardware = await frame(canvas);
      await page.getByRole('button', { name: 'Brass (F12)', exact: true }).click();
      await expect.poll(async () => (await frame(canvas)).png.equals(beforeHardware.png)).toBe(false);
    }
    const beforeWall = await frame(canvas);
    await page.getByRole('button', { name: 'Wall colour', exact: true }).click();
    await page.getByRole('button', { name: 'Domino', exact: true }).click();
    await expect.poll(async () => (await frame(canvas)).brightness).toBeLessThan(beforeWall.brightness - 20);
    await page.getByRole('button', { name: 'Natural White', exact: true }).click();
    await page.getByRole('button', { name: 'Wall colour', exact: true }).click();
    await ready();
    await page.getByRole('button', { name: 'Rotate view left' }).click();
    await ready();
    await page.getByRole('button', { name: 'Reset 3D view to 30 degrees' }).click();
    await expect.poll(async () => Number(await canvas.getAttribute('data-view-angle'))).toBeCloseTo(30, 3);
    await expect(canvas).toHaveAttribute('data-test-identity', 'original');
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('a delayed joinery finish keeps the previous frame and a superseded selection cannot replace the latest one', async ({ page }) => {
  await page.goto('/visualiser');
  await page.getByRole('button', { name: 'Wardrobes', exact: true }).click();
  const host = page.getByLabel('Interactive 3D product preview', { exact: true });
  const canvas = host.locator('canvas');
  await expect(host).toHaveAttribute('data-preview-loading', 'false');
  const white = await frame(canvas);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/finishes/natural-oak.jpg', async route => { await gate; await route.continue(); });
  try {
    await page.getByRole('button', { name: 'Matt Natural Oak', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Loading 3D preview' })).toBeVisible();
    await expect(host).toHaveCSS('filter', 'blur(4px)');
    expect((await frame(canvas)).deviation).toBeGreaterThan(15);
    await page.getByRole('button', { name: 'Woodmatt Black Ply', exact: true }).click();
    await expect(host).toHaveAttribute('data-preview-loading', 'false');
    await expect.poll(async () => (await frame(canvas)).brightness).toBeLessThan(white.brightness - 10);
    release();
    await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.endsWith('/finishes/natural-oak.jpg')))).toBe(true);
    await page.getByRole('button', { name: 'Rotate view left' }).click();
    await expect.poll(async () => (await frame(canvas)).deviation).toBeGreaterThan(20);
    expect((await frame(canvas)).brightness).toBeLessThan(white.brightness - 10);
    await expect(page.getByRole('alert')).toHaveCount(0);
  } finally { release(); }
});
