import { test, expect, type Locator } from '@playwright/test';
import sharp from 'sharp';

async function pixels(canvas: Locator) {
  const png = await canvas.screenshot();
  const bitmap = sharp(png).resize(180, 160, { fit: 'fill' });
  const stats = await bitmap.stats();
  expect(stats.channels[0].stdev, 'Door geometry must remain visible').toBeGreaterThan(15);
  return bitmap.removeAlpha().raw().toBuffer();
}

async function productPixels(canvas: Locator): Promise<Buffer> {
  // Exclude the wall picker and hoverable orbit buttons from the comparison.
  return sharp(await canvas.screenshot()).resize(180, 160, { fit: 'fill' })
    .extract({ left: 36, top: 40, width: 108, height: 96 }).removeAlpha().raw().toBuffer();
}

test.beforeEach(async ({ page }, info) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  if (info.project.name === 'forced-dark-android') {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setAutoDarkModeOverride', { enabled: true });
  }
});

test('all sliding-door types update in one 3D canvas, rotate and carry the selected configuration to cart', async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/visualiser?category=wardrobe&type=framed');
  const stage = page.locator('[data-sliding-door-preview]');
  const host = stage.getByLabel('Interactive 3D product preview', { exact: true }), canvas = host.locator('canvas');
  const ready = async () => {
    await expect(host).toHaveAttribute('data-preview-loading', 'false');
    await expect(stage.getByRole('button', { name: 'Rotate view left' })).toBeEnabled();
    await expect(page.getByRole('alert')).toHaveCount(0);
  };
  await ready();
  await expect(page.getByRole('button', { name: /in your (own )?room/i })).toHaveCount(0);
  await canvas.evaluate(element => { element.dataset.testIdentity = 'sliding'; });
  for (const style of ['Framed', 'Shaker']) {
    await page.getByRole('button', { name: style, exact: true }).click();
    for (const doors of ['Two doors', 'Three doors']) {
      await page.getByRole('button', { name: doors, exact: true }).click();
      await ready();
      const before = await pixels(canvas);
      await page.getByRole('button', { name: style === 'Framed' ? 'Mirror Silver' : 'Mirror/Polar White', exact: true }).click();
      await ready();
      expect((await pixels(canvas)).equals(before)).toBe(false);
      await canvas.screenshot({ path: info.outputPath(`${style}-${doors}-mirror.png`) });
      await page.getByRole('button', { name: style === 'Framed' ? 'MDF Prime Oak' : 'Notaio Walnut', exact: true }).click();
      await ready();
      await canvas.screenshot({ path: info.outputPath(`${style}-${doors}-wood.png`) });
      for (const metal of ['Polished Silver', 'Pearl White', 'Matt Black']) {
        const beforeMetal = await pixels(canvas);
        await page.getByRole('button', { name: metal, exact: true }).click();
        await ready();
        expect((await pixels(canvas)).equals(beforeMetal)).toBe(false);
      }
      const options = await page.getByRole('combobox').locator('option').evaluateAll(elements => elements.map(option => (option as HTMLOptionElement).value));
      const beforeWidth = await pixels(canvas);
      const currentWidth = await page.getByRole('combobox').inputValue();
      await page.getByRole('combobox').selectOption(currentWidth === options.at(-1) ? options[0] : options.at(-1)!); await ready();
      expect((await pixels(canvas)).equals(beforeWidth)).toBe(false);
    }
  }
  await stage.getByRole('button', { name: 'Rotate view left' }).click();
  await expect.poll(async () => Number(await canvas.getAttribute('data-view-angle'))).toBeCloseTo(20, 2);
  await stage.getByRole('button', { name: 'Reset 3D view to 30 degrees' }).click();
  await expect.poll(async () => Number(await canvas.getAttribute('data-view-angle'))).toBeCloseTo(30, 2);
  await expect(canvas).toHaveAttribute('data-test-identity', 'sliding');
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('Shaker Sliding Wardrobe Doors');
  await expect(page.locator('main')).toContainText('Notaio Walnut');
  await expect(page.locator('main')).toContainText('Three doors');
  expect(errors).toEqual([]);
});

test('homepage and wardrobe type navigation reach the doors without a photo-upload flow', async ({ page }) => {
  await page.goto('/#visualiser');
  const viewer = page.locator('#visualiser');
  await viewer.getByRole('button', { name: 'Wardrobes', exact: true }).click();
  await viewer.getByRole('button', { name: 'Sliding doors', exact: true }).click();
  await expect(viewer.locator('[data-preview-loading="false"]')).toBeVisible();
  await expect(viewer.getByRole('button', { name: /in your (own )?room/i })).toHaveCount(0);
  await viewer.getByRole('button', { name: 'Walk-in', exact: true }).click();
  await expect(viewer.getByRole('button', { name: 'Forma 4', exact: true })).toBeVisible();
  await expect(viewer.locator('[data-sliding-door-preview]')).toHaveCount(0);
  await viewer.getByRole('button', { name: 'Built-in', exact: true }).click();
  await expect(viewer.getByRole('button', { name: 'Forma 2', exact: true })).toBeVisible();
  await viewer.getByRole('button', { name: 'Sliding doors', exact: true }).click();
  await expect(viewer.locator('[data-preview-loading="false"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('slow door textures retain the previous frame and cannot overwrite a newer choice or wall colour', async ({ page }) => {
  await page.goto('/visualiser?category=wardrobe&type=framed');
  const stage = page.locator('[data-sliding-door-preview]');
  const host = stage.getByLabel('Interactive 3D product preview', { exact: true }), canvas = host.locator('canvas');
  await expect(host).toHaveAttribute('data-preview-loading', 'false');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/finishes/prime-oak.webp', async route => { await gate; await route.continue(); });
  try {
    await page.getByRole('button', { name: 'MDF Prime Oak', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Loading 3D preview' })).toBeVisible();
    await expect(host).toHaveCSS('filter', 'blur(4px)');
    await pixels(canvas);
    await page.getByRole('button', { name: 'Vinyl Surf', exact: true }).click();
    await expect(host).toHaveAttribute('data-preview-loading', 'false');
    await stage.getByRole('button', { name: 'Wall colour', exact: true }).click();
    await stage.getByRole('button', { name: 'Domino', exact: true }).click();
    await stage.getByRole('button', { name: 'Wall colour', exact: true }).click();
    const latest = await productPixels(canvas);
    release();
    await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.endsWith('/finishes/prime-oak.webp')))).toBe(true);
    await stage.getByRole('button', { name: 'Reset 3D view to 30 degrees' }).click();
    await expect.poll(async () => {
      const current = await productPixels(canvas);
      return current.reduce((sum, channel, index) => sum + Math.abs(channel - latest[index]), 0) / current.length;
    }).toBeLessThan(1);
    await expect(page.getByRole('button', { name: 'Vinyl Surf', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('alert')).toHaveCount(0);
  } finally { release(); }
});
