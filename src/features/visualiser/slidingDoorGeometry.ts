import { slidingPanelMirrors, slidingPreviewDimensions, type SlidingDoorConfig } from '@/features/joinery';

/** Millimetres throughout; adjacent doors overlap while travelling on
 * separate tracks. Heights match the shop's fixed-height presentation. */
export function slidingDoorGeometry(config: SlidingDoorConfig) {
  const { widthMm, heightMm, count } = slidingPreviewDimensions(config);
  const isShaker = config.style === 'shaker';
  const overlap = isShaker ? 70 : 32, stile = isShaker ? 90 : 25;
  const rail = isShaker ? 100 : 22, thickness = isShaker ? 35 : 24;
  const width = (widthMm + overlap * (count - 1)) / count;
  const mirrors = slidingPanelMirrors(config.style, config.panels, config.material);
  const panels = mirrors.map((isMirror, index) => ({
    x: index * (width - overlap), y: 14, z: -48 - (index % 2) * 48,
    width, height: heightMm - 48, thickness, stile, rail, isMirror,
  }));
  return { widthMm, heightMm, panels };
}
