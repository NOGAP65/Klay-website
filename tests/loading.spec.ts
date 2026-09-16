import { test, expect } from '@playwright/test';

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
    await expect(loading).toHaveCSS('background-color', 'rgba(48, 48, 48, 0.16)');
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

test('curtain code download keeps the room behind the loader and rapid category changes finish correctly', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/visualiser');
  await expect(page.locator('canvas[data-render-surface="blind"]')).toHaveAttribute('data-render-ready', 'true');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/assets\/Canvas2DCurtainRenderer-[^/]+\.js/, async route => { await gate; await route.continue(); });
  try {
    await page.getByRole('button', { name: 'Curtains', exact: true }).click();
    const loading = page.getByRole('status', { name: 'Loading curtains', exact: true });
    await expect(loading).toBeVisible();
    const backdrop = page.locator('[data-preview-backdrop]');
    await expect.poll(() => backdrop.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    await expect(loading).toHaveCSS('background-color', 'rgba(48, 48, 48, 0.16)');
    await expect(backdrop).toHaveCSS('filter', 'blur(4px)');
    await page.screenshot({ path: info.outputPath('curtain-photo-loading.png') });
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

test('shop fabric loading keeps the previous photo visible until the selected fabric is ready', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/essence-cyclone-weave.webp', async route => { await gate; await route.continue(); });
  try {
    await page.goto('/products?q=roller+blinds', { waitUntil: 'domcontentloaded' });
    const canvas = page.locator('[data-fabric-photo]');
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    const previousFrame = await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
    await page.getByRole('button', { name: 'Essence Cyclone', exact: true }).click();
    const loading = page.getByRole('status', { name: 'Loading product photo', exact: true });
    await expect(loading).toBeVisible();
    await expect(loading).toHaveCSS('background-color', 'rgba(48, 48, 48, 0.16)');
    await expect(canvas).toHaveCSS('filter', 'blur(4px)');
    expect(await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()) === previousFrame).toBe(true);
    await canvas.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath('shop-photo-loading.png') });
    release();
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await expect(loading).toHaveCount(0);
    await expect(canvas).toHaveCSS('filter', 'none');
    expect(await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()) === previousFrame).toBe(false);
  } finally { release(); }
});

test('a slow room replacement preserves the photo and cannot confirm the previous outline', async ({ page }) => {
  await page.goto('/visualiser');
  await expect(page.locator('canvas[data-render-surface="blind"]')).toHaveAttribute('data-render-ready', 'true');
  const backdrop = page.locator('[data-preview-backdrop]');
  const previousPhoto = await backdrop.getAttribute('src');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/images/visualiser/rooms/blind-bedroom.webp', async route => { await gate; await route.continue(); });
  try {
    await page.getByRole('button', { name: 'Visualise in your own room', exact: true }).click();
    await page.getByRole('button', { name: 'Use Coastal bedroom', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Loading room', exact: true })).toBeVisible();
    await expect(backdrop).toHaveAttribute('src', previousPhoto!);
    const confirm = page.getByRole('button', { name: 'Confirm outline', exact: true });
    await expect(confirm).toBeDisabled();
    release();
    await expect(page.getByAltText('Your room', { exact: true })).toHaveAttribute('src', /blind-bedroom\.webp$/);
    await confirm.click();
    await expect(page.locator('canvas[data-render-surface="blind"]')).toHaveAttribute('data-render-ready', 'true');
    await expect(page.locator('.loading-indicator')).toHaveCount(0);
  } finally { release(); }
});
