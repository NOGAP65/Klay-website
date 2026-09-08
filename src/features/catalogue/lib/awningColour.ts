const toLinear = (value: number) => value <= 0.04045
  ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const toSrgb = (value: number) => value <= 0.0031308
  ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;

/** Change the material's midtone while retaining the photographed contrast.
 * Multiplying every pixel by a dark swatch erases the weave and arm profiles.
 * These curves retain a useful shadow range, with a soft toe instead of
 * clipping the shaded brackets to solid black. Values are in display sRGB. */
export function awningColourCurves(hex: string, hardware: boolean): number[][] {
  const reference = hardware ? [242, 241, 238] : [230, 223, 207];
  const midtone = hardware ? [195, 185, 175] : [224, 214, 199];
  return reference.map((channel, index) => {
    const selected = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
    const ratio = toLinear(selected) / toLinear(channel / 255);
    const darkness = 1 - Math.min(1, ratio);
    const pivot = midtone[index] / 255;
    const target = toSrgb(toLinear(pivot) * ratio + darkness * (hardware ? 0.009 : 0.015));
    const contrast = 1 - darkness * (hardware ? 0.4 : 0.12);
    return Array.from({ length: 256 }, (_, value) => {
      const mapped = target + (value / 255 - pivot) * contrast;
      const toe = 0.025;
      const shoulder = 0.97;
      const softened = mapped < toe ? toe * Math.exp((mapped - toe) / toe)
        : mapped > shoulder ? 1 - (1 - shoulder) * Math.exp(-(mapped - shoulder) / (1 - shoulder))
        : mapped;
      // Preserve the source exactly for its photographed material colour.
      return darkness === 0 && ratio === 1 ? value / 255 : softened;
    });
  });
}
