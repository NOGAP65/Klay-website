/** Remove photographed lighting from a roller fabric scan while retaining yarn
 * detail. A summed-area box average keeps this linear in the number of pixels;
 * it runs once per cached texture, never during a frame or slider movement. */
export function normaliseRollerWeave(pixels: Uint8ClampedArray, width: number, height: number) {
  const stride = width + 1;
  const sums = new Float64Array(stride * (height + 1));
  const luminance = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      const index = y * width + x, pixel = index * 4;
      const value = pixels[pixel] * .299 + pixels[pixel + 1] * .587 + pixels[pixel + 2] * .114;
      luminance[index] = value;
      row += value;
      sums[(y + 1) * stride + x + 1] = sums[y * stride + x + 1] + row;
    }
  }
  const radius = Math.max(2, Math.round(Math.min(width, height) / 48));
  for (let y = 0; y < height; y++) {
    const top = Math.max(0, y - radius), bottom = Math.min(height, y + radius + 1);
    for (let x = 0; x < width; x++) {
      const left = Math.max(0, x - radius), right = Math.min(width, x + radius + 1);
      const mean = (sums[bottom * stride + right] - sums[top * stride + right]
        - sums[bottom * stride + left] + sums[top * stride + left]) / ((right - left) * (bottom - top));
      const index = y * width + x, pixel = index * 4;
      const value = 128 + Math.max(-48, Math.min(48, luminance[index] - mean));
      pixels[pixel] = pixels[pixel + 1] = pixels[pixel + 2] = value;
    }
  }
}
