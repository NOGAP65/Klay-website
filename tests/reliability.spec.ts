import { test, expect } from '@playwright/test';

import { defaultSelection, fieldsFor, withChoice } from '../src/features/catalogue/configOptions';
import { CATALOGUE } from '../src/features/catalogue/constants';

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/[^/]+\/api\//, route => route.fulfill({ status: 503, json: { error: 'Test service unavailable' } }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
});

test('room loading is visible, respects reduced motion and recovers from network failure', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/images/visualiser/preview.webp', async route => { await gate; await route.abort(); });
  try {
    await page.goto('/visualiser', { waitUntil: 'domcontentloaded' });
    const loading = page.getByRole('status', { name: 'Loading blinds', exact: true });
    await expect(loading).toBeVisible();
    await expect(loading).toHaveCSS('background-color', 'rgb(48, 48, 48)');
    await expect(loading.locator('.loading-indicator-icon').first()).toHaveCSS('animation-name', 'none');
    await expect(loading.locator('.loading-indicator-icon').first()).toHaveCSS('opacity', '1');
    await expect(loading.locator('.loading-indicator-icon').nth(1)).toHaveCSS('opacity', '0');
    await page.screenshot({ path: info.outputPath('gold-loader.png') });
    release();
    await expect(page.getByRole('alert')).toContainText('load');
    await page.unroute('**/images/visualiser/preview.webp');
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(page.locator('canvas[data-render-surface="blind"]')).toHaveAttribute('data-render-ready', 'true');
    await expect(page.locator('.loading-indicator')).toHaveCount(0);
  } finally { release(); }
});

test('render loading cycles through four product icons and stops as soon as the room is ready', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/images/visualiser/preview.webp', async route => { await gate; await route.continue(); });
  try {
    await page.goto('/visualiser', { waitUntil: 'domcontentloaded' });
    const loading = page.getByRole('status', { name: 'Loading blinds', exact: true });
    await expect(loading).toBeVisible();
    const icons = loading.locator('.loading-indicator-icon');
    await expect(icons).toHaveCount(4);
    const observed = new Set<string>();
    await expect.poll(async () => {
      for (const name of await icons.evaluateAll(elements => elements
        .filter(element => Number(getComputedStyle(element).opacity) > .9)
        .map(element => element.getAttribute('data-loading-icon')!))) observed.add(name);
      return [...observed].sort();
    }, { timeout: 9_000, intervals: [100] }).toEqual(['Blinds', 'Curtains', 'Shelving', 'Wardrobes']);
    await page.screenshot({ path: info.outputPath('cycling-product-loader.png') });
    release();
    await expect(page.locator('canvas[data-render-surface="blind"]')).toHaveAttribute('data-render-ready', 'true');
    await expect(loading).toHaveCount(0);
  } finally { release(); }
});

test('curtain code download and rapid category changes finish with the chosen preview', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/visualiser');
  await expect(page.locator('canvas[data-render-surface="blind"]')).toHaveAttribute('data-render-ready', 'true');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/assets\/Canvas2DCurtainRenderer-[^/]+\.js/, async route => { await gate; await route.continue(); });
  try {
    await page.getByRole('button', { name: 'Curtains', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Loading curtains', exact: true })).toBeVisible();
    release();
    await expect(page.locator('canvas[data-render-surface="curtain"]')).toBeVisible();
    await expect(page.locator('.loading-indicator')).toHaveCount(0);
    for (const name of ['Blinds', 'Curtains', 'Blinds', 'Curtains']) await page.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('canvas[data-render-surface="curtain"]')).toBeVisible();
    await expect(page.locator('.loading-indicator')).toHaveCount(0);
    await expect(page.getByText('Preparing your preview…', { exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally { release(); }
});

test('failed shop photography can be retried without losing the configuration', async ({ page }) => {
  await page.route(/\/images\/shop\//, route => route.abort());
  await page.goto('/products?q=shelving');
  const card = page.locator('.shop-result-card');
  await expect(card.getByRole('button', { name: 'Retry photo' })).toBeVisible();
  await page.unroute(/\/images\/shop\//);
  await card.getByRole('button', { name: 'Retry photo' }).click();
  await expect(card.getByRole('alert')).toHaveCount(0);
  await expect(card.locator('.loading-indicator')).toHaveCount(0);
  await card.getByRole('button', { name: 'Add for quote', exact: true }).click();
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('Shelving');
});

test('enquiries work without the newer AbortSignal.timeout browser feature', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(AbortSignal, 'timeout', { value: undefined }));
  await page.route('**/api/request-quote', route => route.fulfill({ json: { id: 'test-enquiry' } }));
  await page.goto('/contact');
  await page.getByRole('textbox', { name: /^Name/ }).fill('Test Customer');
  await page.getByRole('textbox', { name: /^Email/ }).fill('test@example.com');
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.getByText(/Thanks — we'll be in touch/i).first()).toBeVisible();
});

test('a missing fabric mask offers retry instead of a blank or incorrectly coloured photo', async ({ page }) => {
  await page.route('**/images/fabrics/roller-blinds.mask.png', route => route.abort());
  await page.goto('/products?q=roller+blinds');
  await expect(page.getByRole('alert')).toContainText('photo');
  await page.getByRole('button', { name: 'Essence Cyclone', exact: true }).click();
  await page.unroute('**/images/fabrics/roller-blinds.mask.png');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('[data-fabric-photo]')).toHaveAttribute('data-render-ready', 'true');
  await expect(page.getByRole('button', { name: 'Essence Cyclone', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('download cannot export an old frame while the selected fabric is still loading', async ({ page }) => {
  await page.goto('/visualiser');
  await page.getByRole('button', { name: 'Visualise in your own room', exact: true }).click();
  await page.getByRole('button', { name: 'Use Coastal bedroom', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm outline', exact: true }).click();
  const canvas = page.locator('canvas[data-render-surface="blind"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/essence-cyclone-texture.webp', async route => { await gate; await route.continue(); });
  let downloads = 0;
  page.on('download', () => { downloads++; });
  try {
    await page.getByRole('button', { name: 'Essence Cyclone', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Loading blinds', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    await expect(page.getByText('Wait for your preview to finish loading, then download.')).toBeVisible();
    expect(downloads).toBe(0);
    release();
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    expect((await downloaded).suggestedFilename()).toContain('cyclone');
    await expect(page.getByText('Wait for your preview to finish loading, then download.')).toHaveCount(0);
  } finally { release(); }
});

test('3D graphics failure leaves navigation and configuration usable', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      return type === 'webgl2' ? null : Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/visualiser');
  await page.getByRole('button', { name: 'Wardrobes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('preview');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('preview');
  await page.getByRole('button', { name: 'Blinds', exact: true }).click();
  await expect(page.locator('canvas[data-render-surface="blind"]')).toHaveAttribute('data-render-ready', 'true');
  expect(errors).toEqual([]);
});

test('older photo decoders still support upload, tracing and invalid-outline recovery', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'createImageBitmap', { value: undefined }));
  await page.goto('/visualiser');
  await expect(page.locator('canvas[data-render-surface="blind"]')).toHaveAttribute('data-render-ready', 'true');
  await page.getByRole('button', { name: 'Visualise in your own room', exact: true }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Upload photo', exact: true }).click();
  await (await chooser).setFiles('public/images/rooms/room-living.webp');
  const photo = page.getByAltText('Your room', { exact: true });
  await expect(photo).toBeVisible();
  const handles = page.locator('svg circle[fill="transparent"]');
  const first = await handles.first().boundingBox();
  const third = await handles.nth(2).boundingBox();
  expect(first && third).toBeTruthy();
  if (first && third) {
    await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
    await page.mouse.down();
    await page.mouse.move(third.x + third.width / 2 + 8, third.y + third.height / 2 + 8);
    await page.mouse.up();
    await page.getByRole('button', { name: 'Confirm outline', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('uncrossed');
    await expect(photo).toBeVisible();
  }
  await page.getByRole('button', { name: 'Change photo', exact: true }).click();
  await page.getByRole('button', { name: 'Use Coastal bedroom', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm outline', exact: true }).click();
  await expect(page.locator('canvas[data-render-surface="blind"]')).toHaveAttribute('data-render-ready', 'true');
});

test('Essence Cyclone uses cloth only, without the white scan header in either preview', async ({ page }, info) => {
  await page.goto('/visualiser');
  await page.getByRole('button', { name: 'Essence Cyclone', exact: true }).click();
  await expect(page.locator('.loading-indicator')).toHaveCount(0);
  const canvas = page.locator('canvas[data-render-surface="blind"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  const rows = await canvas.evaluate((el: HTMLCanvasElement) => {
    const { width: w, height: h } = el;
    const ctx = el.getContext('2d')!;
    const data = ctx.getImageData(0, 0, w, h).data;
    const q = [[.1918, .1989], [.5841, .2492], [.5830, .6382], [.1864, .6699]];
    return Array.from({ length: 120 }, (_, row) => {
      // The default blind is half lowered; sample only the covered fabric.
      const v = .08 + row / 119 * .32;
      let sum = 0;
      for (let col = 0; col < 40; col++) {
        const u = .2 + col / 39 * .6;
        const x = Math.floor(((1-v)*((1-u)*q[0][0]+u*q[1][0])+v*((1-u)*q[3][0]+u*q[2][0]))*w);
        const y = Math.floor(((1-v)*((1-u)*q[0][1]+u*q[1][1])+v*((1-u)*q[3][1]+u*q[2][1]))*h);
        const i = (y*w+x)*4;
        sum += (data[i]+data[i+1]+data[i+2])/3;
      }
      return sum/40;
    });
  });
  expect(Math.max(...rows)).toBeLessThan(130);
  expect(Math.max(...rows.slice(1).map((value, i) => Math.abs(value-rows[i])))).toBeLessThan(20);
  await page.screenshot({ path: info.outputPath('cyclone-visualiser.png') });
  await page.goto('/products?q=roller+blinds');
  await page.getByRole('button', { name: 'Essence Cyclone', exact: true }).click();
  await expect(page.locator('[data-fabric-inset="0.04"]')).toBeVisible();
  await page.screenshot({ path: info.outputPath('cyclone-shop.png') });
});

test('every catalogue product supports its visible choices, images and add-to-cart action', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const item of CATALOGUE) {
    await page.goto(`/products?q=${encodeURIComponent(item.name)}`);
    const card = page.locator('.shop-result-card').filter({ has: page.getByRole('heading', { name: item.name, exact: true }) });
    await expect(card).toHaveCount(1);
    let selection = defaultSelection(item);
    for (const fieldId of fieldsFor(item, selection).map(field => field.id)) {
      const field = fieldsFor(item, selection).find(candidate => candidate.id === fieldId);
      if (!field) continue;
      const choice = field.choices.filter(c => c.id !== 'other').at(-1);
      if (!choice) continue;
      const select = card.getByRole('combobox', { name: field.label, exact: true });
      const button = card.getByRole('button', { name: choice.label, exact: true });
      if (await select.count()) {
        await select.selectOption(choice.id);
        await expect(select).toHaveValue(choice.id);
      } else if (await button.count()) {
        await button.first().click();
        await expect(button.first()).toHaveAttribute('aria-pressed', 'true');
      } else continue;
      selection = withChoice(item, selection, field.id, choice.id);
    }
    await expect(card.locator('.loading-indicator')).toHaveCount(0);
    await expect(card.getByRole('alert')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), item.name).toBe(true);
    await card.getByRole('button', { name: /^Add (to cart|for quote)$/ }).click();
    await expect(page.getByRole('region', { name: 'Cart confirmation' })).toContainText(item.name);
  }
  await page.goto('/cart');
  await page.reload();
  for (const item of CATALOGUE) await expect(page.getByRole('heading', { name: item.name, exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('small phones, landscape phones and tablets keep configuration and navigation reachable', async ({ page }, info) => {
  for (const viewport of [{ width: 320, height: 640 }, { width: 844, height: 390 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/products?q=roller+blinds');
    const canvas = page.locator('[data-fabric-photo="roller-blinds"]');
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await page.getByRole('button', { name: 'Essence Cyclone', exact: true }).click();
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Cart confirmation' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.goto('/visualiser');
    await expect(page.locator('canvas[data-render-surface="blind"]')).toHaveAttribute('data-render-ready', 'true');
    await page.getByRole('button', { name: 'Curtains', exact: true }).click();
    await expect(page.locator('canvas[data-render-surface="curtain"]')).toHaveAttribute('data-render-ready', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath(`responsive-${viewport.width}x${viewport.height}.png`) });
  }
});
