/** Check a few scanlines after a static repaint, never during animation.
 * A light fabric cannot legitimately contain opaque near-black fold bands.
 * This catches silent driver NaNs that don't raise a shader compilation error. */
export function hasCorruptCurtainFrame(gl: WebGLRenderingContext | WebGL2RenderingContext, colour: string, photoHeight: number, traceY: number[]): boolean {
  const channels = [1, 3, 5].map(start => parseInt(colour.slice(start, start + 2), 16));
  if (Math.max(...channels) < 110 || gl.isContextLost()) return false;
  const top = Math.min(...traceY), drop = Math.max(...traceY) - top;
  const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
  const row = new Uint8Array(width * 4);
  let covered = 0, black = 0;
  for (const fraction of [.25, .5, .75]) {
    const y = Math.max(0, Math.min(height - 1, Math.floor(height * (1 - (top + drop * fraction) / photoHeight))));
    gl.readPixels(0, y, width, 1, gl.RGBA, gl.UNSIGNED_BYTE, row);
    for (let i = 0; i < row.length; i += 4) {
      if (row[i + 3] < 250) continue;
      covered++;
      if (Math.max(row[i], row[i + 1], row[i + 2]) < 8) black++;
    }
  }
  return covered > 20 && black / covered > .12;
}
