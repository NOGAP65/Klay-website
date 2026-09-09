import { photoColourCurves } from './photoColour';

/** Traced on the 1024px base photo. Mesh and the dark handle inset are excluded. */
export const FLYSCREEN_PHOTO = {
  metal: 'M82 150H936V183H82Z M82 183H121V803H82Z M910 183H936V803H910Z M82 803H936V816H82Z',
  handle: { x: 915, y: 469, w: 13, h: 64 },
  closingBar: { x: 910, y: 183, w: 25, h: 620 },
  cassette: { x: 82, y: 183, w: 40, h: 620 },
  rightCassetteX: 896,
  meetingX: 509,
};

/** White is powder coated; blend continuously into its softer photographed sheen. */
export function flyscreenColourCurves(hex: string): number[][] {
  const curves = photoColourCurves(hex, 'hardware');
  const lightestCoat = Math.min(...[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
  const whiteWeight = Math.max(0, Math.min(1, (lightestCoat - 210) / 29));
  return curves.map(curve => curve.map((value, i) => {
    const v = i / 255;
    const white = v < 0.15 ? v * 1.5 : 0.225 + 0.755 * ((v - 0.15) / 0.85) ** 0.4;
    return value * (1 - whiteWeight) + white * whiteWeight;
  }));
}
