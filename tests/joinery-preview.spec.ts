import { test, expect, type Locator } from '@playwright/test';
import sharp from 'sharp';

async function frame(canvas: Locator) {
  // A mobile sticky filter bar can otherwise cover a different part of the
  // photograph after tapping controls. Compare unobstructed product pixels.
  await canvas.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
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

async function checkWallColour(viewer: Locator, canvas: Locator) {
  const before = await frame(canvas);
  const wall = viewer.getByRole('button', { name: 'Wall colour', exact: true });
  await wall.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await wall.click();
  await expect(wall).toHaveAttribute('aria-expanded', 'true');
  await viewer.getByRole('button', { name: 'Domino', exact: true }).click();
  await expect.poll(async () => (await frame(canvas)).brightness).toBeLessThan(before.brightness - 20);
  await viewer.getByRole('button', { name: 'Natural White', exact: true }).click();
  await wall.click();
}

for (const surface of [{ name: 'visualiser', url: '/visualiser' }, { name: 'homepage', url: '/#visualiser' }]) {
for (const product of ['Wardrobes', 'Shelving']) {
  test(`${surface.name}: ${product} keep visible geometry and correct finishes after scene replacements`, async ({ page }, info) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(surface.url);
    const viewer = page.locator(surface.name === 'homepage' ? '#visualiser' : 'body');
    await viewer.getByRole('button', { name: product, exact: true }).click();
    const host = viewer.getByLabel('Interactive 3D product preview', { exact: true });
    const canvas = host.locator('canvas');
    const ready = async () => {
      await expect(host).toHaveAttribute('data-preview-loading', 'false');
      await expect(viewer.getByRole('button', { name: 'Reset 3D view to 30 degrees' })).toBeEnabled();
      await expect.poll(async () => (await frame(canvas)).deviation).toBeGreaterThan(20);
    };
    await ready();
    await viewer.getByRole('button', { name: 'Rotate view left' }).click();
    await viewer.getByRole('button', { name: 'Rotate view left' }).click();
    await expect.poll(async () => Number(await canvas.getAttribute('data-view-angle'))).toBeCloseTo(10, 3);
    const initial = await frame(canvas);
    await canvas.evaluate(element => { element.dataset.testIdentity = 'original'; });
    await viewer.getByRole('button', { name: 'Woodmatt Black Ply', exact: true }).click();
    await ready();
    const black = await frame(canvas);
    const darkening = await finishChange(initial.png, black.png);
    expect(darkening.proportion).toBeGreaterThan(.02);
    expect(darkening.delta).toBeLessThan(-30);
    await canvas.screenshot({ path: info.outputPath('black-product.png') });

    await viewer.getByRole('button', { name: 'Matt Natural Oak', exact: true }).click();
    await ready();
    await expect.poll(async () => Number(await canvas.getAttribute('data-view-angle'))).toBeCloseTo(10, 3);
    const oak = await frame(canvas);
    const lightening = await finishChange(black.png, oak.png);
    expect(lightening.proportion).toBeGreaterThan(.02);
    expect(lightening.delta).toBeGreaterThan(30);
    await viewer.getByRole('button', { name: product === 'Wardrobes' ? 'Forma 3' : 'Forma 8', exact: true }).click();
    await ready();
    expect((await frame(canvas)).png.equals(oak.png)).toBe(false);
    const previousWidth = await frame(canvas);
    await viewer.getByRole('combobox').selectOption(product === 'Wardrobes' ? '2100' : '3000');
    await ready();
    expect((await frame(canvas)).png.equals(previousWidth.png)).toBe(false);
    await viewer.getByRole('button', { name: 'Against a wall', exact: true }).click();
    await ready();
    await viewer.getByRole('button', { name: 'In a recess', exact: true }).click();
    await ready();
    if (product === 'Wardrobes') {
      const beforeHardware = await frame(canvas);
      await viewer.getByRole('button', { name: 'Brass (F12)', exact: true }).click();
      await expect.poll(async () => (await frame(canvas)).png.equals(beforeHardware.png)).toBe(false);
    }
    await checkWallColour(viewer, canvas);
    await viewer.getByRole('button', { name: 'Rotate view left' }).click();
    await ready();
    await viewer.getByRole('button', { name: 'Reset 3D view to 30 degrees' }).click();
    await expect.poll(async () => Number(await canvas.getAttribute('data-view-angle'))).toBeCloseTo(30, 3);
    await expect(canvas).toHaveAttribute('data-test-identity', 'original');
    await expect(viewer.getByRole('alert')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
}

for (const product of ['Wardrobes', 'Shelving']) {
  test(`shop: ${product} retain their photo across repeated finish, model and width changes`, async ({ page }, info) => {
    // This covers every model at both width extremes with real pixel captures;
    // WebKit software rendering takes longer than a single interaction test.
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/products?q=${product.toLowerCase()}`);
    const card = page.locator('.shop-result-card').filter({ has: page.getByRole('heading', { name: product === 'Wardrobes' ? 'Built in wardrobes' : product, exact: true }) });
    const photo = card.locator('svg[data-preview-width]');
    const ready = async () => {
      await expect(card.locator('[aria-busy="true"]')).toHaveCount(0);
      await expect(photo).toBeVisible();
      await expect.poll(async () => (await frame(photo)).deviation).toBeGreaterThan(20);
    };
    await ready();
    const original = await frame(photo);
    await card.getByRole('button', { name: 'Woodmatt Black Ply', exact: true }).click();
    await ready();
    const black = await frame(photo);
    const darkening = await finishChange(original.png, black.png);
    expect(darkening.proportion).toBeGreaterThan(.01);
    expect(darkening.delta).toBeLessThan(-25);
    await photo.screenshot({ path: info.outputPath('shop-black.png') });
    await card.getByRole('button', { name: 'Matt Natural Oak', exact: true }).click();
    await ready();
    expect((await finishChange(black.png, (await frame(photo)).png)).delta).toBeGreaterThan(25);
    const models = product === 'Wardrobes' ? ['Forma 1', 'Forma 2', 'Forma 3'] : ['Forma 6', 'Forma 7', 'Forma 8', 'Forma 9'];
    for (const model of models) {
      await card.getByRole('button', { name: model, exact: true }).click();
      await ready();
      const width = card.getByRole('combobox', { name: /Width/ });
      const options = await width.locator('option').evaluateAll(elements => elements.map(element => (element as HTMLOptionElement).value));
      for (const value of [options[0], options[options.length - 1]]) {
        await width.selectOption(value);
        await ready();
        await expect(photo).toHaveAttribute('data-preview-width', value);
      }
    }
    for (const name of ['Matt Polar White', 'Woodmatt Black Ply', 'Matt Natural Oak', 'Matt Polar White']) {
      await card.getByRole('button', { name, exact: true }).click();
    }
    await ready();
    await expect(photo).toHaveAttribute('aria-label', /Matt Polar White/);
    await expect(card.getByRole('alert')).toHaveCount(0);
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
