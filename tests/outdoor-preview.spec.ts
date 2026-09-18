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
    await expect(page.locator('[data-mechanism="crank"]')).toHaveCount(0);
    const remoteBox = (await page.locator('.preview-mechanisms').boundingBox())!, imageBox = (await canvas.boundingBox())!;
    expect(remoteBox.y).toBeGreaterThanOrEqual(imageBox.y);
    expect(remoteBox.y + remoteBox.height).toBeLessThanOrEqual(imageBox.y + imageBox.height);
    await page.getByRole('button', { name: 'Close the blind', exact: true }).click();
    await expect.poll(() => sample(canvas)).toBe(dark);
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

test('product hardware sits inside the left of the photo and supports touch and keyboard', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const products = [
    ['roller-shutter', 'crank', 'Outdoor covering position'], ['zip-screen', 'crank', 'Outdoor covering position'],
    ['honeycomb', 'cord', 'Honeycomb position'], ['venetian', 'wand', 'Slat tilt'], ['plantation', 'louvre', 'Slat tilt'],
  ];
  for (const [category, kind, label] of products) {
    await page.goto(`/visualiser?category=${category}`);
    const canvas = page.locator(`canvas[data-blind-product="${category}"]`);
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    const slider = page.getByRole('slider', { name: label, exact: true });
    await expect(page.locator(`[data-mechanism="${kind}"]`)).toBeVisible();
    await slider.press('Home');
    const open = await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
    await slider.press('End');
    await expect(slider).toHaveAttribute('aria-valuenow', '100');
    await expect.poll(() => canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL())).not.toBe(open);
    const group = page.locator('.preview-mechanisms');
    const box = (await group.boundingBox())!, photo = (await canvas.boundingBox())!;
    expect(box.x - photo.x).toBeGreaterThanOrEqual(0);
    expect(box.x - photo.x).toBeLessThan(20);
    expect(box.y).toBeGreaterThanOrEqual(photo.y);
    expect(box.y + box.height).toBeLessThanOrEqual(photo.y + photo.height);
    // Real pointer capture, followed by cancellation as when a phone interrupts.
    const grip = (await slider.boundingBox())!;
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2); await page.mouse.down();
    await slider.dispatchEvent('pointercancel', { pointerId: 1, isPrimary: true });
    await page.mouse.move(grip.x, grip.y); await page.mouse.up();
    await expect(slider).toHaveAttribute('aria-valuenow', '100');
    await group.screenshot({ path: info.outputPath(`${category}-hardware.png`) });
  }
  await page.goto('/visualiser');
  await expect(page.getByRole('slider', { name: 'Blind position — drag the chain', exact: true })).toBeVisible();
  await expect(page.locator('.preview-mechanisms')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a straight drag moves the crank and one tap opens the covering', async ({ page }, info) => {
  await page.goto('/visualiser?category=roller-shutter');
  const slider = page.getByRole('slider', { name: 'Outdoor covering position' });
  await slider.press('Home');
  const box = (await slider.boundingBox())!, cx = box.x + box.width / 2, cy = box.y + 5;
  await page.mouse.move(cx, cy); await page.mouse.down();
  await page.mouse.move(cx, cy + box.height / 2, { steps: 6 });
  await page.mouse.up();
  const value = Number(await slider.getAttribute('aria-valuenow'));
  expect(value).toBeGreaterThan(45); expect(value).toBeLessThan(55);
  await page.mouse.move(cx, cy + 80);
  await expect(slider).toHaveAttribute('aria-valuenow', String(value));
  const open = page.getByRole('button', { name: 'Open — Outdoor covering position', exact: true });
  if (info.project.use.hasTouch) await open.tap(); else await open.click();
  await expect(slider).toHaveAttribute('aria-valuenow', '0');
});

test('cord controls use the same simple up-open down-close gesture', async ({ page }) => {
  for (const [category, label] of [['honeycomb', 'Honeycomb position'], ['venetian', 'Venetian lift']]) {
    await page.goto(`/visualiser?category=${category}`);
    const slider = page.getByRole('slider', { name: label, exact: true });
    await slider.press('Home');
    const box = (await slider.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 10); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + 40, { steps: 6 }); await page.mouse.up();
    const value = Number(await slider.getAttribute('aria-valuenow'));
    expect(value).toBeGreaterThan(15); expect(value).toBeLessThan(100);
  }
});

test('tap movement can reverse, stop on keyboard input and respect reduced motion', async ({ page }) => {
  await page.goto('/visualiser?category=roller-shutter');
  const slider = page.getByRole('slider', { name: 'Outdoor covering position' });
  const close = page.getByRole('button', { name: 'Close — Outdoor covering position', exact: true });
  const open = page.getByRole('button', { name: 'Open — Outdoor covering position', exact: true });
  await slider.press('Home');
  await close.click();
  await expect.poll(async () => Number(await slider.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  await open.click();
  await expect(slider).toHaveAttribute('aria-valuenow', '0');
  await close.click();
  await slider.press('Home');
  await page.waitForTimeout(400); // A cancelled 350ms movement must never resume.
  await expect(slider).toHaveAttribute('aria-valuenow', '0');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await close.click();
  expect(await slider.getAttribute('aria-valuenow')).toBe('100');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await open.click();
  await page.getByRole('button', { name: 'Zip screens', exact: true }).click();
  await expect(page.locator('canvas[data-blind-product="zip-screen"]')).toHaveAttribute('data-render-ready', 'true');
  const switched = await slider.getAttribute('aria-valuenow');
  await page.waitForTimeout(400);
  expect(await slider.getAttribute('aria-valuenow')).toBe(switched);
});
