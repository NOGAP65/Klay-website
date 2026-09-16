import { test, expect, type Locator, type Page } from '@playwright/test';
import sharp from 'sharp';

async function pixels(locator: Locator) {
  await locator.evaluate(el => el.scrollIntoView({ block: 'center' }));
  const image = sharp(await locator.screenshot({ scale: 'css' }));
  const { width = 0, height = 0 } = await image.metadata();
  // Exclude rounded-corner antialiasing against the intentionally changed UI.
  return image.extract({ left: 4, top: 4, width: width - 8, height: height - 8 }).removeAlpha().raw().toBuffer();
}
async function hideStickyChrome(page: Page) {
  await page.addStyleTag({ content: 'canvas[data-fabric-photo] { transform: none !important; }' });
  await page.evaluate(() => {
    for (const element of document.querySelectorAll<HTMLElement>('body *')) {
      if (['fixed', 'sticky'].includes(getComputedStyle(element).position)) element.style.visibility = 'hidden';
    }
  });
}
function difference(a: Buffer, b: Buffer) {
  expect(b.length).toBe(a.length);
  return a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / a.length;
}
async function forceDarkIgnoringOptOut(page: Page) {
  // Exercise the reported override, not just prefers-color-scheme. Deliberately
  // remove the usual opt-out in the test so image pixels must stand on their own.
  await page.locator('meta[name="color-scheme"]').evaluate(el => el.remove());
  await page.addStyleTag({ content: '* { color-scheme: normal !important; }' });
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setAutoDarkModeOverride', { enabled: true });
  return session;
}

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('forced dark changes UI backgrounds but preserves actual swatch and product pixels', async ({ page, browserName }, info) => {
  test.skip(browserName !== 'chromium', 'Chrome auto-darkening is a Chromium setting.');
  for (const [product, name] of [['roller-blinds', 'Roller Blinds'], ['curtains', 'Curtains'],
    ['venetian-blinds', 'Venetian Blinds'], ['plantation-shutters', 'Plantation Shutters']]) {
    await page.goto(`/products?q=${encodeURIComponent(name)}`);
    const canvas = page.locator(`canvas[data-fabric-photo="${product}"]`);
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await hideStickyChrome(page);
    // A CSS control proves that forced recolouring is genuinely active.
    await page.evaluate(() => {
      const sentinel = document.createElement('div');
      sentinel.id = 'dark-test-sentinel';
      sentinel.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;width:40px;height:40px;background:white';
      document.body.append(sentinel);
    });
    const sentinel = page.locator('#dark-test-sentinel');
    const beforeUI = await pixels(sentinel);
    const samples = page.locator('[data-colour-sample]');
    const before = await pixels(canvas);
    const colours: Buffer[] = [];
    for (const sample of await samples.all()) colours.push(await pixels(sample));
    const session = await forceDarkIgnoringOptOut(page);
    expect(difference(beforeUI, await pixels(sentinel))).toBeGreaterThan(100);
    expect(difference(before, await pixels(canvas)), name).toBeLessThan(.25);
    for (const [index, sample] of (await samples.all()).entries()) {
      expect(difference(colours[index], await pixels(sample)), `${name} swatch ${index}`).toBeLessThan(.25);
    }
    if (product === 'roller-blinds') {
      await page.getByRole('button', { name: 'Essence Carbon', exact: true }).click();
      await expect(canvas).toHaveAttribute('data-render-ready', 'true');
      await expect.poll(async () => difference(before, await pixels(canvas))).toBeGreaterThan(10);
      const black = page.getByRole('button', { name: 'Black', exact: true });
      await black.click();
      await expect(black).toHaveAttribute('aria-pressed', 'true');
      const dark = await pixels(canvas);
      await session.send('Emulation.setAutoDarkModeOverride', { enabled: false });
      expect(difference(dark, await pixels(canvas))).toBeLessThan(.25);
    }
    await canvas.screenshot({ path: info.outputPath(`${product}-forced-dark.png`) });
    await session.send('Emulation.setAutoDarkModeOverride', { enabled: false });
    await session.detach();
  }
});

test('forced dark preserves visualiser colours even when page opt-outs are ignored', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chrome auto-darkening is a Chromium setting.');
  for (const category of ['Blinds', 'Curtains']) {
    await page.goto('/visualiser');
    await page.getByRole('button', { name: category, exact: true }).click();
    const canvas = page.locator(`canvas[data-render-surface="${category === 'Blinds' ? 'blind' : 'curtain'}"]`);
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await hideStickyChrome(page);
    const swatch = page.getByRole('button', { name: category === 'Blinds' ? 'Essence Carbon' : 'Charcoal', exact: true });
    const before = await pixels(canvas);
    const sample = await pixels(swatch.locator('canvas'));
    const session = await forceDarkIgnoringOptOut(page);
    expect(difference(before, await pixels(canvas))).toBeLessThan(1);
    expect(difference(sample, await pixels(swatch.locator('canvas')))).toBeLessThan(.25);
    await swatch.click();
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await expect.poll(async () => difference(before, await pixels(canvas))).toBeGreaterThan(3);
    const changed = await pixels(canvas);
    await session.send('Emulation.setAutoDarkModeOverride', { enabled: false });
    expect(difference(changed, await pixels(canvas))).toBeLessThan(1);
    await session.detach();
  }
});
