import sharp from 'sharp';

import type { Locator, TestInfo } from '@playwright/test';

export async function saveSlattedCloseup(canvas: Locator, info: TestInfo, name: string) {
  const source = await canvas.evaluate((surface: HTMLCanvasElement) => surface.toDataURL().split(',')[1]);
  const bitmap = sharp(Buffer.from(source, 'base64'));
  const { width = 1254, height = 1254 } = await bitmap.metadata();
  await bitmap.extract({ left: Math.round(145 / 1254 * width), top: Math.round(115 / 1254 * height),
    width: Math.round(970 / 1254 * width), height: Math.round(735 / 1254 * height) })
    .png().toFile(info.outputPath(`${name}.png`));
}

export async function measureSlattedBands(canvas: Locator, coordinates: { scan: number[][]; cornersToCheck: number[][] }) {
  return canvas.evaluate((surface: HTMLCanvasElement, { scan, cornersToCheck }) => {
    const ctx = surface.getContext('2d')!;
    const green = ([x, y]: number[]) => ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data[1];
    let bands = 0, wasSolid = false;
    for (const point of scan) {
      const isSolid = green(point) > 45;
      if (isSolid && !wasSolid) bands++;
      wasSolid = isSolid;
    }
    return { bands, corners: cornersToCheck.map(green) };
  }, coordinates);
}
