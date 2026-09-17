import { test, expect } from '@playwright/test';

import { defaultWindowRoom } from '../src/features/visualiser/roomPresets';
import { slattedPlane, venetianSlats, plantationPanels } from '../src/features/visualiser/slattedGeometry';

import { portrait } from './helpers/visualiserPhoto';

import type { Point } from '../src/features/visualiser/homography';

test.beforeEach(async ({ page }, info) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  if (info.project.name === 'forced-dark-android') {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setAutoDarkModeOverride', { enabled: true });
  }
  if (info.project.name === 'basic-android') await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string, ...args: unknown[]) {
      return id.includes('webgl') ? null : Reflect.apply(getContext, this, [id, ...args]);
    } as typeof getContext;
  });
});

test('side views keep their fitted edges and shade uniformly along each slat', async ({ page }, info) => {
  for (const corners of [
    [[.12, .08], [.85, .22], [.86, .7], [.13, .88]],
    [[.13, .24], [.86, .06], [.85, .88], [.12, .72]],
  ]) {
    await page.goto('/visualiser?category=venetian');
    const traced = await portrait(page, false, { corners, background: '#b400b4' }) as Point[];
    const photoSize = await page.locator('canvas[data-blind-product="venetian"]').evaluate((surface: HTMLCanvasElement) => [surface.width, surface.height] as Point);
    const plane = slattedPlane(traced, 'medium', photoSize);
    for (const category of ['venetian', 'plantation']) {
      if (category === 'plantation') await page.getByRole('button', { name: 'Plantation shutters', exact: true }).click();
      const canvas = page.locator(`canvas[data-blind-product="${category}"]`);
      await expect(canvas).toHaveAttribute('data-render-ready', 'true');
      await page.getByRole('slider', { name: 'Slat tilt' }).press('Home');
      await canvas.screenshot({ path: info.outputPath(`${category}-${corners[0][1]}-open-angled.png`) });
      await page.getByRole('slider', { name: 'Slat tilt' }).press('End');
      if (category === 'venetian') await page.getByRole('slider', { name: 'Venetian lift' }).press('End');
      await canvas.screenshot({ path: info.outputPath(`${category}-${corners[0][1]}-angled.png`) });
      const geometry = category === 'venetian' ? venetianSlats(plane, { position: 1, tilt: 1 })
        : plantationPanels(plane, 1).panels[0].sections[0];
      const middle = geometry.slats[Math.floor(geometry.slats.length / 2)];
      const points = [
        ...[.2, .4, .6, .8].flatMap(y => [plane.project(.006, y), plane.project(.994, y)]),
        ...[.2, .4, .6, .8].flatMap(x => [plane.project(x, .006), plane.project(x, .994)]),
        ...[.21, .31, .41, .61, .71, .81].map(x => plane.project(x, middle.centre, 14 + middle.thicknessMm / 2)),
      ];
      const greens = await canvas.evaluate((surface: HTMLCanvasElement, coordinates) => coordinates.map(([x, y]) =>
        surface.getContext('2d')!.getImageData(Math.round(x), Math.round(y), 1, 1).data[1]), points);
      expect(Math.min(...greens.slice(0, 16)), 'No uncovered strip at the perimeter').toBeGreaterThan(45);
      const slat = greens.slice(16);
      expect(Math.max(...slat) - Math.min(...slat), 'No diagonal lighting wedge along the slat').toBeLessThan(24);
      const interior = Array.from({ length: 48 * 60 }, (_, i) =>
        plane.project(.06 + (i % 48) / 47 * .88, .06 + Math.floor(i / 48) / 59 * .88));
      const holes = await canvas.evaluate((surface: HTMLCanvasElement, coordinates) => {
        const ctx = surface.getContext('2d')!;
        return coordinates.filter(([x, y]) => ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data[1] < 45).length;
      }, interior);
      expect(holes, 'Closed rigid blades must not leak the magenta photo through mesh seams').toBe(0);
    }
  }
});

test('front-on slats retain their clean appearance and respond without a GPU', async ({ page }, info) => {
  const session = info.project.name === 'basic-android' ? await page.context().newCDPSession(page) : null;
  if (session) await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/visualiser?category=plantation');
  await portrait(page, false, { corners: [[.15, .15], [.85, .15], [.85, .8], [.15, .8]], background: '#b4b4b4' });
  for (const category of ['plantation', 'venetian']) {
    if (category === 'venetian') await page.getByRole('button', { name: 'Venetian', exact: true }).click();
    const canvas = page.locator(`canvas[data-blind-product="${category}"]`);
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await page.getByRole('slider', { name: 'Slat tilt' }).press('Home');
    await canvas.screenshot({ path: info.outputPath(`${category}-frontal-open.png`) });
    const fingerprint = () => canvas.evaluate((el: HTMLCanvasElement) => {
      const pixels = el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data;
      let hash = 0;
      for (let i = 0; i < pixels.length; i += 64) hash = (Math.imul(hash, 31) + pixels[i]) | 0;
      return hash;
    });
    const before = await fingerprint();
    const start = Date.now();
    await page.getByRole('slider', { name: 'Slat tilt' }).press('End');
    await expect.poll(fingerprint).not.toBe(before);
    expect(Date.now() - start, 'Tilt should respond promptly on the basic-phone profile').toBeLessThan(2500);
    await canvas.screenshot({ path: info.outputPath(`${category}-frontal-closed.png`) });
  }
});

test('shop offers five UltraSlat colours without a material choice', async ({ page }) => {
  await page.goto('/products?q=venetian');
  const product = page.locator('.shop-result-card').first();
  await expect(product).toContainText('UltraSlat');
  await expect(product.getByRole('button', { name: /^(Aluminium|Basswood|UltraSlat)$/ })).toHaveCount(0);
  await expect(product.getByRole('button', { name: /^UltraSlat / })).toHaveCount(5);
  await product.getByRole('button', { name: 'UltraSlat Manuscript', exact: true }).click();
  await expect(product.locator('canvas[data-fabric-photo="venetian-blinds"]')).toHaveAttribute('data-render-ready', 'true');
  await product.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('UltraSlat Manuscript');
  await expect(page.locator('main')).not.toContainText('Material');
});

test('UltraSlat colours, tilt and stacking work on a tilted uploaded opening', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/visualiser?category=venetian');
  const corners = await portrait(page, true);
  const canvas = page.locator('canvas[data-blind-product="venetian"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  const centre = () => canvas.evaluate((surface: HTMLCanvasElement, quad) => {
    const point = [0, 1].map(c => quad.reduce((sum, p) => sum + p[c], 0) / 4);
    return surface.getContext('2d')!.getImageData(Math.round(point[0]), Math.round(point[1]), 1, 1).data[0];
  }, corners);
  await page.getByRole('slider', { name: 'Venetian lift' }).press('End');
  await page.getByRole('slider', { name: 'Slat tilt' }).press('End');
  await expect(page.getByRole('button', { name: /^(UltraSlat|Aluminium|Basswood)$/ })).toHaveCount(0);
  const white = await centre();
  for (const colour of ['UltraSlat Breeze White', 'UltraSlat Beachshell', 'UltraSlat Manuscript']) {
    await page.getByRole('button', { name: colour, exact: true }).click();
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    await canvas.screenshot({ path: info.outputPath(`${colour}-closed.png`) });
  }
  await expect.poll(centre).toBeLessThan(white - 5);
  await page.getByRole('slider', { name: 'Venetian lift' }).press('Home');
  await expect.poll(centre).toBeGreaterThan(150);
  await canvas.screenshot({ path: info.outputPath('venetian-stacked.png') });
  await page.getByRole('slider', { name: 'Venetian lift' }).press('End');
  await page.getByRole('slider', { name: 'Slat tilt' }).press('Home');
  await canvas.screenshot({ path: info.outputPath('venetian-open.png') });
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('Venetian Blinds');
  await expect(page.locator('main')).toContainText('UltraSlat Manuscript');
  await expect(page.locator('main')).toContainText('Price on measure');
  expect(errors).toEqual([]);
});

test('plantation stays inside the photographed recess on default and retraced presets', async ({ page }, info) => {
  await page.goto('/visualiser?category=plantation');
  const canvas = page.locator('canvas[data-blind-product="plantation"]');
  const preset = defaultWindowRoom('plantation');
  await page.getByRole('button', { name: 'Walnut', exact: true }).click();
  const checkTrim = async () => {
    await expect(canvas).toHaveAttribute('data-render-ready', 'true');
    const difference = await canvas.evaluate(async (surface: HTMLCanvasElement, url) => {
      const photo = new Image(); photo.src = url; await photo.decode();
      const reference = document.createElement('canvas'); reference.width = surface.width; reference.height = surface.height;
      const original = reference.getContext('2d')!, rendered = surface.getContext('2d')!;
      original.drawImage(photo, 0, 0, reference.width, reference.height);
      // Photographed trim and reveal around all four edges. A dark shutter
      // painted over these points must fail, even if it fits a guessed quad.
      const trim = [[.185, .35], [.185, .55], [.184, .648], [.215, .207], [.4, .230], [.55, .251],
        [.574, .36], [.572, .53], [.575, .62], [.23, .663], [.4, .65], [.54, .639]];
      return Math.max(...trim.flatMap(([u, v]) => {
        const x = Math.round(u * surface.width), y = Math.round(v * surface.height);
        const a = original.getImageData(x, y, 1, 1).data, b = rendered.getImageData(x, y, 1, 1).data;
        return [0, 1, 2].map(i => Math.abs(a[i] - b[i]));
      }));
    }, preset.url);
    expect(difference, 'The photographed recess stays visible; only the existing 8% room dimming is allowed').toBeLessThan(26);
  };
  await checkTrim();
  await canvas.screenshot({ path: info.outputPath('plantation-inset-walnut.png') });
  await page.getByRole('button', { name: 'Visualise in your own room', exact: true }).click();
  await page.getByRole('button', { name: 'Use Original bedroom', exact: true }).click();
  for (let attempt = 0; attempt < 2; attempt++) {
    const pins = page.locator('svg circle[fill="transparent"]');
    await expect(pins.first()).toBeVisible();
    const corners = await pins.evaluateAll(elements => elements.slice(0, 4).map(element => {
      const box = (element as SVGCircleElement).ownerSVGElement!.viewBox.baseVal;
      return [Number(element.getAttribute('cx')) / box.width, Number(element.getAttribute('cy')) / box.height];
    }));
    corners.forEach((point, i) => point.forEach((value, axis) => expect(value).toBeCloseTo(preset.corners[i][axis], 5)));
    await page.getByRole('button', { name: 'Confirm outline', exact: true }).click();
    await checkTrim();
    if (attempt === 0) await page.getByRole('button', { name: 'Retrace', exact: true }).click();
  }
});

test('plantation louvers tilt inside their frame and selections survive cart and theme changes', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/visualiser?category=plantation');
  const canvas = page.locator('canvas[data-blind-product="plantation"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await canvas.screenshot({ path: info.outputPath('plantation-room.png') });
  const image = () => canvas.evaluate((surface: HTMLCanvasElement) => surface.toDataURL());
  await page.getByRole('slider', { name: 'Slat tilt' }).press('Home');
  const opened = await image();
  await page.getByRole('slider', { name: 'Slat tilt' }).press('End');
  await expect.poll(image).not.toBe(opened);
  await canvas.screenshot({ path: info.outputPath('plantation-closed.png') });
  await page.getByRole('button', { name: 'Walnut', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await canvas.screenshot({ path: info.outputPath('plantation-walnut.png') });
  const walnut = await image();
  await page.emulateMedia({ colorScheme: info.project.use.colorScheme === 'dark' ? 'light' : 'dark' });
  expect(await image()).toBe(walnut);
  await portrait(page, true);
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  expect((await download).suggestedFilename()).toContain('plantation');
  const beforeMotor = await image();
  await page.getByRole('button', { name: 'Motorised', exact: true }).click();
  await page.getByRole('button', { name: 'Open the blind', exact: true }).click();
  await expect.poll(image).not.toBe(beforeMotor);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('Plantation Shutters');
  await expect(page.locator('main')).toContainText('Walnut');
  expect(errors).toEqual([]);
});

test('Venetian room preview uses photographed materials without a roller underneath', async ({ page }, info) => {
  await page.goto('/visualiser?category=venetian');
  const canvas = page.locator('canvas[data-blind-product="venetian"]');
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await canvas.screenshot({ path: info.outputPath('venetian-room.png') });
  await page.getByRole('slider', { name: 'Slat tilt' }).press('End');
  await canvas.screenshot({ path: info.outputPath('venetian-room-closed.png') });
  await page.getByRole('button', { name: 'UltraSlat Manuscript', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-render-ready', 'true');
  await canvas.screenshot({ path: info.outputPath('venetian-manuscript-room.png') });
});

test('homepage grouped navigation switches window products and opens the correct shop families', async ({ page }, info) => {
  await page.goto('/#visualiser');
  const panel = page.locator('#visualiser');
  const navigation = panel.getByRole('navigation', { name: 'Visualiser products' });
  await expect(navigation.getByRole('group', { name: 'Indoor window coverings' })).toBeVisible();
  for (const [name, category] of [['Venetian', 'venetian'], ['Plantation shutters', 'plantation'], ['Honeycomb', 'honeycomb']]) {
    await panel.getByRole('button', { name, exact: true }).click();
    await expect(panel.locator(`canvas[data-blind-product="${category}"]`)).toHaveAttribute('data-render-ready', 'true');
  }
  await navigation.getByRole('button', { name: 'Curtains', exact: true }).click();
  await expect(panel.locator('canvas[data-render-surface="curtain"]')).toHaveAttribute('data-render-ready', 'true');
  await navigation.screenshot({ path: info.outputPath('visualiser-groups.png') });
  await navigation.getByRole('link', { name: 'Outdoor coverings Shop →', exact: true }).click();
  await expect(page).toHaveURL(/area=Outdoor/);
  await expect(page.locator('.shop-result-card').filter({ hasText: 'Folding Arm Awnings' })).toBeVisible();
  await page.goBack();
  await navigation.getByRole('link', { name: 'Mirrors & shower screens Shop →', exact: true }).click();
  await expect(page).toHaveURL(/type=mirrors&type=shower-screens/);
  await expect(page.locator('.shop-result-card').filter({ hasText: 'Mirrors Frameless' })).toBeVisible();
  expect(await page.locator('.shop-result-card').filter({ hasText: 'Roller Blinds' }).count()).toBe(0);
});
