import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';

import { rollerGeometry } from '../src/features/visualiser/rollerGeometry';

import { portrait } from './helpers/visualiserPhoto';

import type { Point } from '../src/features/visualiser/homography';

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

test('four tracing corners magnify the exact photo position and keep precise coordinates', async ({ page }, info) => {
  await page.goto('/visualiser');
  await page.getByRole('button', { name: 'Visualise in your own room', exact: true }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Upload photo', exact: true }).click();
  const buffer = await sharp({ create: { width: 800, height: 1200, channels: 3, background: '#bcad96' } }).jpeg().toBuffer();
  await (await chooser).setFiles({ name: 'precision-room.jpg', mimeType: 'image/jpeg', buffer });
  const pins = page.getByRole('button', { name: /^Trace corner/ });
  await expect(pins).toHaveCount(4);
  const point = (i: number) => pins.nth(i).evaluate(el => ['cx', 'cy'].map(a => Number(el.getAttribute(a))));
  for (let i = 0; i < 4; i++) {
    const pin = pins.nth(i);
    await pin.scrollIntoViewIfNeeded();
    await pin.focus();
    const start = await point(i);
    const loupe = page.locator(`[data-trace-magnifier="${i}"]`);
    await expect(loupe).toBeVisible();
    await pin.press('ArrowRight');
    await pin.press('Shift+ArrowDown');
    expect(await point(i)).toEqual([start[0] + 1, start[1] + 10]);
    const box = (await pin.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 8, box.y + box.height / 2 - 7, { steps: 3 });
    const now = await point(i);
    const crop = (await loupe.locator('svg').first().getAttribute('viewBox'))!.split(' ').map(Number);
    expect(crop[0] + crop[2] / 2).toBeCloseTo(now[0], 4);
    expect(crop[1] + crop[3] / 2).toBeCloseTo(now[1], 4);
    const image = loupe.locator('image');
    expect(await image.getAttribute('href')).toBe(await page.getByAltText('Your room', { exact: true }).getAttribute('src'));
    const bounds = (await loupe.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    if (i === 0) await page.screenshot({ path: info.outputPath('corner-magnifier.png') });
    await page.mouse.up();
    await expect(loupe).toHaveCount(0);
    expect(await point(i)).toEqual(now);
  }
  await pins.first().focus();
  for (let i = 0; i < 20; i++) await pins.first().press('Shift+ArrowLeft');
  expect((await point(0))[0]).toBe(0);
  await pins.first().press('Shift+ArrowRight');
  await page.getByRole('button', { name: 'Confirm outline', exact: true }).click();
  await expect(page.locator('[data-trace-magnifier]')).toHaveCount(0);
  await expect(page.locator('canvas[data-render-surface="blind"]')).toHaveAttribute('data-render-ready', 'true');
});

test('roller weights retain fabric while chain and side fittings follow every hardware colour', async ({ page }, info) => {
  await page.goto('/visualiser');
  const corners = await portrait(page, true) as Point[];
  const canvas = page.locator('canvas[data-render-surface="blind"]');
  const slider = page.getByRole('slider', { name: 'Blind position — drag the chain', exact: true });
  const chain = page.locator('svg[data-chain-colour]');
  const rail = (position: number) => canvas.evaluate((source: HTMLCanvasElement, g) => {
    const ctx = source.getContext('2d')!;
    const left = g.railL.map((v, i) => (v + g.hemL[i]) / 2);
    const right = g.railR.map((v, i) => (v + g.hemR[i]) / 2);
    let total = 0;
    for (let i = 0; i < 30; i++) {
      const u = .2 + .6 * i / 29;
      const pixel = ctx.getImageData(Math.round(left[0] + (right[0] - left[0]) * u), Math.round(left[1] + (right[1] - left[1]) * u), 1, 1).data;
      total += (pixel[0] + pixel[1] + pixel[2]) / 3;
    }
    return total / 30;
  }, (() => { const g = rollerGeometry(corners, position); return { railL: g.railL, railR: g.railR, hemL: g.hemL, hemR: g.hemR }; })());
  for (const type of ['Blockout', 'Dual']) {
    await page.getByRole('button', { name: type, exact: true }).click();
    for (const [key, position] of [['Home', 0], ['End', type === 'Dual' ? .7 : 1]] as const) {
      await slider.press(key);
      await selectedColour(page, 'Essence Carbon');
      await expect.poll(() => rail(position)).toBeLessThan(90);
      const colours = new Set<string>();
      for (const finish of ['White', 'Black', 'Cream', 'Platinum']) {
        await selectedColour(page, finish);
        await expect(chain).toBeVisible();
        await expect.poll(() => rail(position)).toBeLessThan(90);
        colours.add((await chain.getAttribute('data-chain-colour'))!);
        const base = await chain.locator('linearGradient').first().locator('stop').nth(2).getAttribute('stop-color');
        expect(base).toBe(await chain.getAttribute('data-chain-colour'));
      }
      expect(colours.size).toBe(4);
      await selectedColour(page, 'Essence Ice');
      await expect.poll(() => rail(position)).toBeGreaterThan(150);
    }
  }
  await canvas.screenshot({ path: info.outputPath('fabric-wrapped-rail.png') });
});

async function selectedColour(page: Page, name: string) {
  const button = page.getByRole('button', { name, exact: true }).first();
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
}
