import { expect, type Page, type Locator } from '@playwright/test';
import sharp from 'sharp';

export async function portrait(page: Page, tilted = false) {
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

export async function rollBand(canvas: Locator, corners: number[][], offset = -.006) {
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

export async function bracketPixels(canvas: Locator, corners: number[][]) {
  return canvas.evaluate((source: HTMLCanvasElement, quad) => {
    const ctx = source.getContext('2d')!;
    // Fixed photo-space patches above both axle ends, away from the cloth and
    // weight. A disappearing, moving or fabric-coloured support fails here.
    return [0, 1].map(side => {
      const [x, y] = quad[side], bottom = quad[side === 0 ? 3 : 2];
      const height = Math.hypot(bottom[0] - x, bottom[1] - y);
      const radius = height * 65 / 3600;
      const data = ctx.getImageData(Math.floor(x - radius * 1.5), Math.floor(y - radius * 2),
        Math.ceil(radius * 3), Math.ceil(radius * .9)).data;
      return Array.from(data).filter((_, index) => index % 4 === 0);
    });
  }, corners);
}
