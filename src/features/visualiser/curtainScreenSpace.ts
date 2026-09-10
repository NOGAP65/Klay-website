/** Photo coordinates place the geometry; framebuffer coordinates sample the
 * transparency pass. They differ on phones, high-DPI displays and large photos. */
export const CURTAIN_SCREEN_SPACE_GLSL = `
uniform vec2 uFrame;
uniform vec2 uViewport;
uniform float uFocal;
vec2 curtainScreenUv() {
  return gl_FragCoord.xy / uViewport;
}
vec3 curtainViewDirection() {
  vec2 photoPixel = curtainScreenUv() * uFrame;
  return normalize(vec3((0.5 * uFrame - photoPixel) / uFocal, 1.0));
}
`;

/** Supersample the visible preview without allocating a full phone photograph
 * for every lighting pass. Keep all registered layers at this exact size. */
export function curtainDrawingSize(photoWidth: number, photoHeight: number, cssWidth: number, pixelRatio: number) {
  const samples = Math.max(1.6, Math.min(2, pixelRatio));
  const scale = Math.min(1, Math.min(1400, Math.max(1, cssWidth) * samples) / photoWidth,
    Math.sqrt(1_960_000 / (photoWidth * photoHeight)));
  return { width: Math.max(1, Math.round(photoWidth * scale)), height: Math.max(1, Math.round(photoHeight * scale)) };
}
