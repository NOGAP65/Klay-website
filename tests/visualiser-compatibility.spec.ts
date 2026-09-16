import { test, expect, type Page, type Locator } from '@playwright/test';
import sharp from 'sharp';

test.beforeEach(async ({ page }, info) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  if (info.project.name === 'basic-android') {
    // A usable browser with no GPU renderer, like a low-memory phone or a lost driver.
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string, ...args: unknown[]) {
        return id.startsWith('webgl') || id === 'experimental-webgl' ? null : Reflect.apply(getContext, this, [id, ...args]);
      } as typeof getContext;
    });
  }
  if (info.project.name === 'forced-dark-android') {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setAutoDarkModeOverride', { enabled: true });
  }
});

async function portrait(page: Page, tilted = false) {
  await page.getByRole('button', { name: 'Visualise in your own room', exact: true }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Upload photo', exact: true }).click();
  const buffer = await sharp({ create: { width: 800, height: 1200, channels: 3, background: '#b4b4b4' } }).jpeg().toBuffer();
  await (await chooser).setFiles({ name: 'portrait-room.jpg', mimeType: 'image/jpeg', buffer });
  await expect(page.locator('svg circle[fill="transparent"]').first()).toBeVisible();
  if (tilted) {
    const pin = page.locator('svg circle[fill="transparent"]').nth(1);
    await pin.scrollIntoViewIfNeeded();
    const bounds = await pin.boundingBox();
    expect(bounds).not.toBeNull();
    const x = bounds!.x + bounds!.width / 2, y = bounds!.y + bounds!.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 12, y + 24, { steps: 4 });
    await page.mouse.up();
  }
  const corners = await page.locator('svg circle[fill="transparent"]').evaluateAll(elements =>
    elements.slice(0, 4).map(element => [Number(element.getAttribute('cx')), Number(element.getAttribute('cy'))]));
  await page.getByRole('button', { name: 'Confirm outline', exact: true }).click();
  return corners;
}

async function rollBand(canvas: Locator, corners: number[][], offset = -.006) {
  return canvas.evaluate((source: HTMLCanvasElement, { corners, offset }) => {
    const [left, right, , bottom] = corners;
    const width = Math.hypot(right[0]-left[0], right[1]-left[1]);
    const height = Math.hypot(bottom[0]-left[0], bottom[1]-left[1]);
    const context = source.getContext('2d')!;
    let total = 0;
    for (let i = 0; i < 60; i++) {
      const u = .15 + .7 * i / 59;
      const x = Math.round(left[0] + (right[0]-left[0])*u - (right[1]-left[1])/width*height*offset);
      const y = Math.round(left[1] + (right[1]-left[1])*u + (right[0]-left[0])/width*height*offset);
      const data = context.getImageData(x, y, 1, 1).data;
      total += (data[0] + data[1] + data[2]) / 3;
    }
    return total / 60;
  }, { corners, offset });
}

test('front-roll blinds show the selected face on the roll at every opening position', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/visualiser');
  const corners = await portrait(page);
  const canvas = page.locator('canvas[data-render-surface="blind"]');
  const slider = page.getByRole('slider');
  for (const type of ['Blockout', 'Light Filter', 'Sunscreen', 'Dual']) {
    await page.getByRole('button', { name: type, exact: true }).click();
    const dark = type === 'Sunscreen' ? 'Panorama 5% Anthracite' : 'Essence Carbon';
    const pale = type === 'Sunscreen' ? 'Panorama 5% Polar' : 'Essence Ice';
    await selectedColour(page, dark);
    await slider.press('End');
    await expect.poll(() => rollBand(canvas, corners)).toBeLessThan(90);
    if (type === 'Blockout') await expect.poll(() => rollBand(canvas, corners, .009)).toBeLessThan(100);
    for (let i = 0; i < 5; i++) await slider.press('Shift+ArrowUp');
    await expect(slider).toHaveAttribute('aria-valuenow', '50');
    await expect.poll(() => rollBand(canvas, corners)).toBeLessThan(90);
    await canvas.screenshot({ path: info.outputPath(`${type}-front-roll.png`) });
    await slider.press('Home');
    await expect.poll(() => rollBand(canvas, corners)).toBeLessThan(90);
    await selectedColour(page, pale);
    await expect.poll(() => rollBand(canvas, corners)).toBeGreaterThan(160);
    await slider.press('End');
    await expect.poll(() => rollBand(canvas, corners)).toBeGreaterThan(160);
  }
  expect(errors).toEqual([]);
});

test('front-roll follows a tilted traced opening without a white backing band', async ({ page }, info) => {
  await page.goto('/visualiser');
  const corners = await portrait(page, true);
  expect(Math.abs(corners[0][1] - corners[1][1])).toBeGreaterThan(20);
  const canvas = page.locator('canvas[data-render-surface="blind"]');
  await selectedColour(page, 'Essence Carbon');
  await page.getByRole('slider').press('End');
  await expect.poll(() => rollBand(canvas, corners)).toBeLessThan(90);
  await expect.poll(() => rollBand(canvas, corners, .009)).toBeLessThan(100);
  await canvas.screenshot({ path: info.outputPath('tilted-front-roll.png') });
  await selectedColour(page, 'Essence Ice');
  await expect.poll(() => rollBand(canvas, corners)).toBeGreaterThan(160);
});

async function pixels(canvas: Locator) {
  return canvas.evaluate((source: HTMLCanvasElement) => {
    source.dispatchEvent(new Event('klay:capture-preview'));
    const copy = document.createElement('canvas');
    copy.width = 80; copy.height = 120;
    const ctx = copy.getContext('2d', { colorSpace: 'srgb' })!;
    ctx.drawImage(source, 0, 0, 80, 120);
    const data = ctx.getImageData(12, 24, 15, 48).data;
    let black = 0, count = 0;
    const mean = [0, 0, 0];
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 200) continue;
      count++;
      for (let c = 0; c < 3; c++) mean[c] += data[i + c];
      if (Math.max(data[i], data[i + 1], data[i + 2]) < 20) black++;
    }
    return { mean: mean.map(v => v / Math.max(1, count)), black: black / Math.max(1, count), count };
  });
}

async function selectedColour(page: Page, name: string) {
  const button = page.getByRole('button', { name, exact: true }).first();
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
}

async function checkControlBounds(page: Page) {
  for (const name of ['Back to preview', 'Retrace', 'Download']) {
    const button = page.getByRole('button', { name, exact: true });
    await button.scrollIntoViewIfNeeded();
    const result = await button.evaluate(el => {
      const r = el.getBoundingClientRect(), parent = el.closest('.visualiser-actions')!.getBoundingClientRect();
      return { fits: r.left >= parent.left - 1 && r.right <= parent.right + 1, height: r.height, scroll: el.scrollWidth, width: el.clientWidth };
    });
    expect(result.fits).toBe(true);
    expect(result.height).toBeGreaterThanOrEqual(44);
    expect(result.scroll).toBeLessThanOrEqual(result.width + 1);
  }
}

test('curtain colours stay stable in dark mode and portrait controls and downloads work', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/visualiser');
  await page.getByRole('button', { name: 'Curtains', exact: true }).click();
  await portrait(page);
  await page.getByRole('slider').press('End');
  const canvas = page.locator('canvas[data-render-surface="curtain"]');
  await expect(canvas).toBeVisible();
  if (info.project.name === 'basic-android') await expect(canvas).toHaveAttribute('data-render-mode', 'canvas2d');
  else await expect(canvas).toHaveAttribute('data-render-mode', 'webgl');
  for (const fabric of ['Sheer', 'Blockout']) {
    await page.getByRole('button', { name: fabric, exact: true }).click();
    await selectedColour(page, 'White');
    await expect.poll(async () => (await pixels(canvas)).mean[0]).toBeGreaterThan(120);
    const white = await pixels(canvas);
    await info.attach(`${fabric}-white-pixels`, { body: JSON.stringify(white), contentType: 'application/json' });
    expect(white.count).toBeGreaterThan(600);
    expect(white.black).toBeLessThan(.005); // catches the black fold bands in the report
    await selectedColour(page, 'Charcoal');
    await expect.poll(async () => (await pixels(canvas)).mean[0]).toBeLessThan(white.mean[0] - 50);
    // Finish on a warm dye after several quick selections; stale async loads must not win.
    for (const colour of ['White', 'Charcoal', 'Sand']) await selectedColour(page, colour);
    await expect.poll(async () => { const s = await pixels(canvas); return s.mean[0] - s.mean[2]; }).toBeGreaterThan(8);
    const before = await pixels(canvas);
    await page.emulateMedia({ colorScheme: info.project.use.colorScheme === 'dark' ? 'light' : 'dark' });
    const after = await pixels(canvas);
    for (let c = 0; c < 3; c++) expect(Math.abs(before.mean[c] - after.mean[c])).toBeLessThan(2);
    const swatch = await page.getByRole('button', { name: 'Sand', exact: true }).screenshot();
    const swatchStats = await sharp(await sharp(swatch).resize(20, 20).extract({ left: 7, top: 7, width: 6, height: 6 }).toBuffer()).stats();
    [211, 203, 187].forEach((value, channel) => expect(Math.abs(swatchStats.channels[channel].mean - value)).toBeLessThan(2));
    const displayed = await sharp(await sharp(await canvas.screenshot({ scale: 'css' })).resize(80, 120).extract({ left: 12, top: 24, width: 15, height: 48 }).toBuffer()).stats();
    after.mean.forEach((value, channel) => expect(Math.abs(displayed.channels[channel].mean - value)).toBeLessThan(7));
  }
  await checkControlBounds(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^klay-curtain-blockout-sand/);
  const stats = await sharp(await sharp((await file.path())!).extract({ left: 120, top: 240, width: 120, height: 240 }).toBuffer()).stats();
  expect(stats.channels[0].mean - stats.channels[2].mean).toBeGreaterThan(8); // actual cloth, not just the grey photo
  await canvas.screenshot({ path: info.outputPath('portrait-curtain.png'), scale: 'css' });
  await page.getByRole('button', { name: 'Retrace', exact: true }).click();
  const handle = page.locator('svg circle[fill="transparent"]').first();
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 16, box.y + box.height / 2 + 25, { steps: 3 }); await page.mouse.up();
  await page.getByRole('button', { name: 'Confirm outline', exact: true }).click();
  await expect.poll(async () => (await pixels(canvas)).mean[0]).toBeGreaterThan(100);
  await page.getByRole('button', { name: 'Back to preview', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Visualise in your own room', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('roller colour changes survive rapid selection, theme changes and a narrow screen', async ({ page }, info) => {
  await page.goto('/visualiser');
  await portrait(page);
  await page.getByRole('slider').press('End');
  const canvas = page.locator('canvas[data-render-surface="blind"]');
  await selectedColour(page, 'Essence China');
  await expect.poll(async () => (await pixels(canvas)).mean[0]).toBeGreaterThan(140);
  const before = await pixels(canvas);
  await selectedColour(page, 'Essence Carbon');
  await expect.poll(async () => (await pixels(canvas)).mean[0]).toBeLessThan(before.mean[0] - 50);
  for (const colour of ['Essence China', 'Essence Carbon', 'Essence China']) await selectedColour(page, colour);
  await expect.poll(async () => (await pixels(canvas)).mean[0]).toBeGreaterThan(140);
  const light = await pixels(canvas);
  await page.emulateMedia({ colorScheme: info.project.use.colorScheme === 'dark' ? 'light' : 'dark' });
  const dark = await pixels(canvas);
  expect(Math.abs(light.mean[0] - dark.mean[0])).toBeLessThan(2);
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light only');
  await expect(page.getByRole('button', { name: 'Essence China', exact: true })).toHaveCSS('background-size', 'cover');
});

test('a lost curtain graphics context recovers into an interactive preview', async ({ page }, info) => {
  test.skip(info.project.name === 'basic-android', 'No GPU context exists in this profile.');
  await page.goto('/visualiser');
  await page.getByRole('button', { name: 'Curtains', exact: true }).click();
  const canvas = page.locator('canvas[data-render-surface="curtain"]');
  await expect.poll(async () => (await pixels(canvas)).mean[0]).toBeGreaterThan(100);
  await canvas.evaluate((el: HTMLCanvasElement) => el.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
  await expect(canvas).toHaveAttribute('data-render-mode', 'canvas2d');
  await page.getByRole('button', { name: 'Blockout', exact: true }).click();
  await selectedColour(page, 'Charcoal');
  await expect.poll(async () => (await pixels(canvas)).mean[0]).toBeLessThan(80);
  await selectedColour(page, 'White');
  await expect.poll(async () => (await pixels(canvas)).mean[0]).toBeGreaterThan(120);
});

test('silent black GPU output is detected and recovers without losing the chosen colour', async ({ page }, info) => {
  test.skip(info.project.name === 'basic-android', 'No GPU context exists in this profile.');
  await page.addInitScript(() => {
    const shaderSource = WebGL2RenderingContext.prototype.shaderSource;
    WebGL2RenderingContext.prototype.shaderSource = function (shader, source) {
      if (source.includes('uniform sampler2D uFoldPhoto;')) source = source.replace('vec4(clamp(surface,0.0,1.0),1.0)', 'vec4(0.0,0.0,0.0,1.0)');
      shaderSource.call(this, shader, source);
    };
  });
  await page.goto('/visualiser');
  await page.getByRole('button', { name: 'Curtains', exact: true }).click();
  const canvas = page.locator('canvas[data-render-surface="curtain"]');
  await expect(canvas).toHaveAttribute('data-render-mode', 'canvas2d');
  await expect.poll(async () => (await pixels(canvas)).mean[0]).toBeGreaterThan(100);
  await selectedColour(page, 'Sand');
  await expect.poll(async () => { const s = await pixels(canvas); return s.mean[0] - s.mean[2]; }).toBeGreaterThan(8);
});
