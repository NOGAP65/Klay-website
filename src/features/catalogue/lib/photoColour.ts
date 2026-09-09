import type { PhotoMaterial } from '@/features/catalogue/shopPhotos';

const linear = (v: number) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const srgb = (v: number) => v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
const rgb = (hex: string) => [0, 1, 2].map(i => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255);

const MATERIALS = {
  cellular: { reference: '#F2F0EC', pivot: [214, 210, 200], reflection: 0.009, contrast: 0.82, strength: 1 },
  day: { reference: '#F2F0EC', pivot: [230, 230, 223], reflection: 0.05, contrast: 0.85, strength: 0.43 },
  mesh: { reference: '#6E7276', pivot: [112, 109, 105], reflection: 0.025, contrast: 0.85, strength: 0.66 },
  shutter: { reference: '#F1F0EC', pivot: [205, 205, 198], reflection: 0.009, contrast: 0.62, strength: 1 },
  hardware: { reference: '#D3D7DB', pivot: [160, 155, 144], reflection: 0.014, contrast: 0.65, strength: 1 },
} as const;

/** Retain photographed pleat/slat contrast and soften the darkest shadows.
 * A translucent material retains a share of the original transmitted light. */
export function photoColourCurves(hex: string, material: PhotoMaterial): number[][] {
  const spec = MATERIALS[material];
  const reference = rgb(spec.reference);
  return rgb(hex).map((selected, channel) => {
    const ratio = linear(selected) / linear(reference[channel]);
    const darkness = 1 - Math.min(1, ratio);
    const pivot = spec.pivot[channel] / 255;
    const target = srgb(linear(pivot) * ratio + darkness * spec.reflection);
    const contrast = 1 - darkness * (1 - spec.contrast);
    return Array.from({ length: 256 }, (_, value) => {
      if (selected === reference[channel]) return value / 255;
      const mapped = target + (value / 255 - pivot) * contrast;
      const softened = mapped < 0.025 ? 0.025 * Math.exp((mapped - 0.025) / 0.025)
        : mapped > 0.97 ? 1 - 0.03 * Math.exp(-(mapped - 0.97) / 0.03) : mapped;
      return (value / 255) * (1 - spec.strength) + softened * spec.strength;
    });
  });
}
