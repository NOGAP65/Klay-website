import React, { useEffect, useRef } from 'react';
import { computeHomography, toColumnMajor, Point } from './homography';
import { HARDWARE_HEX } from '../data/products';
import { tokens } from '../theme';

/** One traced, confirmed window area to render — the shape VisualizerConfigurator
 * maps its (store-owned) TracedArea + linked WindowCard into before passing it
 * down. Named distinctly from the store's own `TracedArea` (which additionally
 * carries `cardId`/`isConfirmed`) to avoid import-name collisions. */
export interface RenderedArea {
  id: string;
  corners: Point[];
  blindType: string;
  fabricColor: string;
  hardwareColor: string;
  /** Named hardware finish — drives the side-bracket render (flat shadow/
   * highlight for white/black, metallic gradient for chrome). Optional so
   * older callers passing only a hex `hardwareColor` still render (plain
   * fill, no special shading). */
  hardwareColourName?: 'white' | 'black' | 'chrome';
  controlType: string;
  showChain: boolean;
}

interface Props {
  photoUrl: string;
  /** All traced areas, confirmed or not. The one whose id matches
   * activeAreaId is drawn as a dashed outline only (no fabric) — every
   * other entry is treated as confirmed and rendered normally. */
  tracedAreas: RenderedArea[];
  activeAreaId?: string;
  /** How far down the blind is drawn: 0 = fully open, 1 = fully closed.
   * Applies globally to every rendered area. */
  rollPosition: number;
  /** Compare mode — splits EVERY confirmed area's quad into two halves via
   * one shared divider, each half with its own blind type/colour. */
  compareMode?: boolean;
  /** 0 = full left, 1 = full right, 0.5 = centre. */
  compareDivider?: number;
  compareBlindType?: string;
  compareFabricColor?: string;
  showChain?: boolean;
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
};

const lighten = (hex: string, pct: number): string => {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 + pct / 100;
  return '#' + [r, g, b]
    .map(v => Math.min(255, Math.round(v * f)).toString(16).padStart(2, '0'))
    .join('');
};

const darken = (hex: string, pct: number): string => {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - pct / 100;
  return '#' + [r, g, b]
    .map(v => Math.max(0, Math.round(v * f)).toString(16).padStart(2, '0'))
    .join('');
};

const rgba = (hex: string, a: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

// ---------------------------------------------------------------------------
// Shadow and light constants
//
// Every shadow in this file used to be pure rgba(0,0,0,X). On a warm palette a
// black shadow desaturates whatever it falls across, which is what made the
// hardware read as pasted onto the photo rather than sitting in it. All
// shadows are now mixed from a warm near-black instead.
// ---------------------------------------------------------------------------

/** Warm shadow. Never pure black — 20,16,10 keeps a shadow reading as an
 * absence of light in a warm room rather than as a grey overlay. */
const shadowRgba = (a: number): string => `rgba(20,16,10,${a})`;

/** Daylight leaking around an opaque fabric — the warm cast of sun through a
 * window rather than neutral white. */
const leakRgba = (a: number): string => `rgba(255,240,200,${a})`;

/** Fills a gradient band in N passes at a fraction of the target opacity
 * instead of one hard fill. Overlapping low-alpha passes accumulate into a
 * curve rather than a linear ramp, so the falloff has no visible terminating
 * edge — the single-pass gradients this replaces all ended on a detectable
 * line where the last stop met the unshaded surface.
 *
 * `build` receives the pass's own reach (shortest first) and its alpha, and is
 * responsible for the actual path + fill. */
const multiPassShadow = (
  passes: number,
  reach: number,
  alpha: number,
  build: (passReach: number, passAlpha: number) => void,
) => {
  // Each pass covers a shorter distance at a lower alpha. Summed, the region
  // nearest the caster is covered by every pass and the far edge by only the
  // longest, which is the falloff a soft light source actually produces.
  for (let i = 0; i < passes; i++) {
    const t = (i + 1) / passes;
    build(reach * t, (alpha / passes) * (1 + (1 - t) * 0.6));
  }
};

/** Hardware detail sizes are quoted against a reference blind ~400px wide and
 * scaled from the traced width, because the canvas is the photo's own natural
 * resolution: the default window is 1254px across but an uploaded phone photo
 * can be 4000px, and a literal 10px plate would be a quarter the apparent size
 * on one versus the other. Clamped at both ends so an extreme trace still gets
 * hardware that reads as hardware. */
const REFERENCE_BLIND_W = 400;
const scaleToBlind = (px: number, avgW: number, min = 0.6, max = 3.2): number =>
  px * Math.max(min, Math.min(max, avgW / REFERENCE_BLIND_W));

// ---------------------------------------------------------------------------
// Textures — real fabric photos in public/textures/, tinted in the shader
// ---------------------------------------------------------------------------

// CASE-SENSITIVE. These paths are served verbatim from public/ by a Linux
// host, where /images/textures/... and /images/Textures/... are different
// URLs. The directory on disk is `Textures` with a capital T, and
// `Light-filter` with a capital L and a hyphen. A lowercase path resolves
// fine on a Windows dev machine and 404s in production, which is the worst
// possible failure shape — it only appears after deploy. Do not "tidy" the
// capitalisation here without renaming the directories to match.
const TEXTURE_ROOT = '/images/Textures';

const getTexturePath = (blindType: string): string => {
  switch (blindType) {
    case 'blockout': return `${TEXTURE_ROOT}/Blockout/Blockout_fabric.png`;
    case 'sunscreen': return `${TEXTURE_ROOT}/Sunscreen/Sunscreen.png`;
    case 'lightfilter': return `${TEXTURE_ROOT}/Light-filter/light_filter.png`;
    // A dual roller is a blockout in front of a sunscreen; both come from the
    // real photos above via DUAL_FRONT_TEXTURE / DUAL_BACK_TEXTURE.
    case 'dual': return `${TEXTURE_ROOT}/Blockout/Blockout_fabric.png`;
    // Curtains have no dedicated photography yet and keep the older weave
    // scans under public/textures/. They are a different product line, not a
    // roller blind, so they are unaffected by the roller texture swap.
    case 'sheer':
    case 'sheer-curtains': return '/textures/sheer_fabric.jpg';
    case 'blockout-curtains-light': return '/textures/blockout_white.jpg';
    case 'blockout-curtains-dark': return '/textures/blockout_charcoal.jpg';
    default: return `${TEXTURE_ROOT}/Blockout/Blockout_fabric.png`;
  }
};

/** Every roller texture, for preloading. Switching blind type must not show a
 * blank frame while a 3MB PNG decodes, and the surest way to guarantee that is
 * for the texture to already be in the cache before the type changes. */
const ALL_ROLLER_TEXTURES = [
  getTexturePath('blockout'),
  getTexturePath('sunscreen'),
  getTexturePath('lightfilter'),
];

const isLightColor = (hex: string): boolean => {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
};

/** Blockout Curtains pick a texture base (light vs dark) from the selected
 * fabric colour rather than a fixed image, so the texture key used for
 * loading/caching can differ from the render-path blindType — every other
 * type's key is just itself. */
const textureKeyFor = (blindType: string, fabricColor: string): string =>
  blindType === 'blockout-curtains'
    ? (isLightColor(fabricColor) ? 'blockout-curtains-light' : 'blockout-curtains-dark')
    : blindType;

// A dual roller is two independent rollers sharing one cassette: a sunscreen
// at the back against the glass, and a blockout in front on the room side.
// The front one hangs shorter so both fabrics read at once — drop the
// blockout past the sunscreen and it would simply hide it.
const DUAL_FRONT_TEXTURE = getTexturePath('blockout');
const DUAL_BACK_TEXTURE = getTexturePath('sunscreen');

/** Every texture path a blind type needs, so the caller can preload them all
 * before drawing. Dual is the only type that needs two. */
const texturePathsFor = (blindType: string, fabricColor: string): string[] =>
  blindType === 'dual'
    ? [DUAL_FRONT_TEXTURE, DUAL_BACK_TEXTURE]
    : [getTexturePath(textureKeyFor(blindType, fabricColor))];

/** Fabric photos already decoded, keyed by texture path. */
type FabricImages = Map<string, HTMLImageElement>;

const imageCache = new Map<string, Promise<HTMLImageElement>>();

const loadImage = (src: string): Promise<HTMLImageElement> => {
  let cached = imageCache.get(src);
  if (!cached) {
    cached = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        imageCache.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
    imageCache.set(src, cached);
  }
  return cached;
};

// ---------------------------------------------------------------------------
// WebGL — perspective-correct fabric rendering
//
// The fabric quad is rendered offscreen with WebGL and composited onto the
// visible 2D canvas. The fragment shader applies the quad→unit-square
// homography per pixel, so the texture mapping is exactly perspective
// correct (no diagonal seam artifact from per-vertex interpolation).
// Hardware (tube / rail) is drawn with Canvas 2D on top — one visible
// canvas keeps toDataURL downloads working. Multiple traced areas share
// this same offscreen GL scratch buffer: each area's fabric pass clears
// it, draws, and is composited onto the 2D canvas before the next area.
// ---------------------------------------------------------------------------

const VERTEX_SHADER = `
attribute vec2 a_position;
uniform vec2 u_resolution;
varying vec2 v_pixel;
void main() {
  v_pixel = a_position;
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D u_texture;
uniform mat3 u_pixelToUv;      // homography: photo pixels -> quad UV (0..1)
uniform vec4 u_tintColor;      // the selected Rynamic colour — the fabric's true base
uniform float u_textureAmount; // how strongly the weave modulates that base (low)
uniform float u_textureMean;   // this texture photo's own mean luminance
uniform float u_opacity;
uniform vec2 u_uvScale;       // texture tiling repeats across the quad
uniform float u_shade;        // 1 = recess shading on, 0 = off
uniform float u_folds;        // >0 draws soft vertical fold ripples (sheers)
uniform float u_blindType;    // 0 blockout, 1 sunscreen, 2 lightfilter, 3 dual/other

varying vec2 v_pixel;

void main() {
  vec3 uvw = u_pixelToUv * vec3(v_pixel, 1.0);
  vec2 uv = uvw.xy / uvw.z;   // perspective divide — exact per-pixel mapping

  vec4 texColor = texture2D(u_texture, uv * u_uvScale);

  // The selected colour IS the fabric — never a tint blended over the photo.
  // A multiply blend (what this used to do) meant White multiplied by the
  // charcoal texture photo and came out grey. Instead the photo contributes
  // only its WEAVE: each texel's deviation from that photo's own mean
  // luminance, scaled down hard. Averaged over the quad the deviation is
  // zero, so the rendered fabric averages to exactly u_tintColor whatever
  // the underlying photo's brightness happens to be.
  float luma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
  float detail = clamp(luma - u_textureMean, -0.5, 0.5);

  // Two terms, and both are needed.
  //
  // The multiplicative term is what makes the colour survive: the weave scales
  // the selected colour rather than being mixed into it, so the fabric always
  // averages to exactly u_tintColor and White stays white instead of turning
  // grey. On its own, though, it scales toward zero as the colour darkens —
  // Black at ±10% is a ±0.017 swing, which is invisible, so dark fabrics
  // rendered as flat colour with no discernible weave at all.
  //
  // The additive term is a fixed absolute swing that does not shrink with the
  // base colour. It is small enough to be imperceptible against a light
  // colour and is what carries the entire weave on a dark one.
  vec3 col = u_tintColor.rgb * (1.0 + detail * u_textureAmount)
           + vec3(detail * u_textureAmount * 0.12);

  // Soft vertical fold ripples for sheer fabric
  if (u_folds > 0.5) {
    col *= 1.0 + 0.06 * sin(uv.x * u_folds * 6.2831853);
  }

  // --- PER-TYPE SURFACE BEHAVIOUR -----------------------------------------
  // Each fabric interacts with light differently, and until now the only
  // thing distinguishing them was a single opacity value. These are surface
  // effects only — anything that happens OUTSIDE the fabric quad (edge light
  // leak, cast shadow) is Canvas2D's job, since the shader cannot draw
  // beyond the quad it is rasterising.

  // BLOCKOUT — directional sheen. An opaque fabric shows its lighting rather
  // than transmitting any, so the top-left corner catches the assumed light
  // source and the far corner falls away. This is the only cue that a
  // blockout blind is a surface and not a flat colour swatch.
  if (u_blindType < 0.5) {
    float diag = 1.0 - clamp((uv.x + uv.y) * 0.5, 0.0, 1.0);
    col *= 1.0 + diag * 0.07 - 0.03;
  }

  // SUNSCREEN — open-weave mesh. Fine horizontal bands catch the light along
  // the weave; the frequency is high enough to read as texture rather than
  // as stripes, and it is what separates a screen from a plain translucent
  // sheet at a glance.
  else if (u_blindType < 1.5) {
    col *= 1.0 + 0.035 * sin(uv.y * 240.0);
    // Transmitted light warms very slightly as it passes the weave.
    col += vec3(0.035, 0.030, 0.018) * (1.0 - abs(uv.x - 0.5) * 1.2);
  }

  // LIGHT FILTER — diffuses rather than transmits. A broad warm bloom centred
  // on the fabric, falling off toward every edge: no ghost of what is behind
  // it, just the glow of light spread through the weave.
  else if (u_blindType < 2.5) {
    vec2 c = uv - vec2(0.5);
    float bloom = 1.0 - clamp(length(c) * 1.5, 0.0, 1.0);
    col += vec3(0.055, 0.050, 0.034) * bloom;
  }

  // Recess shading: dark falloff on left/right edges, subtle at the bottom,
  // faint highlight along the top — sells the blind sitting inside the frame.
  float edgeL = smoothstep(0.0, 0.07, uv.x);
  float edgeR = smoothstep(0.0, 0.07, 1.0 - uv.x);
  float edgeB = smoothstep(0.0, 0.05, 1.0 - uv.y);
  float shade = mix(0.78, 1.0, edgeL) * mix(0.78, 1.0, edgeR) * mix(0.9, 1.0, edgeB);
  col *= mix(1.0, shade, u_shade);
  float highlight = (1.0 - smoothstep(0.0, 0.08, uv.y)) * 0.08 * u_shade;
  col += vec3(highlight);

  // Premultiplied alpha for correct compositing over the photo
  gl_FragColor = vec4(col * u_opacity, u_opacity);
}
`;

interface GLState {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  loc: {
    position: number;
    resolution: WebGLUniformLocation | null;
    texture: WebGLUniformLocation | null;
    pixelToUv: WebGLUniformLocation | null;
    tintColor: WebGLUniformLocation | null;
    textureAmount: WebGLUniformLocation | null;
    textureMean: WebGLUniformLocation | null;
    opacity: WebGLUniformLocation | null;
    uvScale: WebGLUniformLocation | null;
    shade: WebGLUniformLocation | null;
    folds: WebGLUniformLocation | null;
    blindType: WebGLUniformLocation | null;
  };
  textures: Map<string, FabricTexture>;
}

/** Fragment-shader branch selector. Keep in step with the u_blindType
 * comparisons in FRAGMENT_SHADER. Sheer and curtains fall through to 3,
 * which applies no per-type surface pass — they have their own fold and
 * panel treatment and do not want a weave or bloom on top of it. */
const SHADER_TYPE: Record<string, number> = {
  blockout: 0,
  sunscreen: 1,
  lightfilter: 2,
};
const shaderTypeFor = (blindType: string): number => SHADER_TYPE[blindType] ?? 3;

/** How much light each fabric stops. One table, used by both the WebGL path
 * and the flat-colour fallback, so the two can never disagree about how
 * transparent a given blind is. */
const FABRIC_OPACITY: Record<string, number> = {
  blockout: 1,
  lightfilter: 0.82,
  sunscreen: 0.65,
  sheer: 0.38,
};

/** An uploaded fabric photo plus its own mean luminance, measured once at
 * upload. The shader subtracts that mean so the photo contributes weave
 * detail only and never shifts the selected colour lighter or darker. */
interface FabricTexture {
  texture: WebGLTexture;
  meanLuma: number;
}

const compileShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
};

const createGLState = (): GLState | null => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
  });
  if (!gl) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program link error: ${gl.getProgramInfoLog(program)}`);
  }
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  if (!positionBuffer) return null;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied alpha

  return {
    canvas,
    gl,
    program,
    positionBuffer,
    loc: {
      position: gl.getAttribLocation(program, 'a_position'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      texture: gl.getUniformLocation(program, 'u_texture'),
      pixelToUv: gl.getUniformLocation(program, 'u_pixelToUv'),
      tintColor: gl.getUniformLocation(program, 'u_tintColor'),
      textureAmount: gl.getUniformLocation(program, 'u_textureAmount'),
      textureMean: gl.getUniformLocation(program, 'u_textureMean'),
      opacity: gl.getUniformLocation(program, 'u_opacity'),
      uvScale: gl.getUniformLocation(program, 'u_uvScale'),
      shade: gl.getUniformLocation(program, 'u_shade'),
      folds: gl.getUniformLocation(program, 'u_folds'),
      blindType: gl.getUniformLocation(program, 'u_blindType'),
    },
    textures: new Map(),
  };
};

// WebGL1 requires power-of-two dimensions for REPEAT wrapping and mipmaps,
// so fabric photos are resampled onto a 512x512 canvas before upload.
const POT_SIZE = 512;

/** Mean luminance of the resampled texture, 0..1. Sampled every 4th pixel —
 * plenty for an average over 512x512, and keeps this cheap enough to run
 * inline on the one upload per texture. Falls back to mid-grey if the pixel
 * data can't be read, which leaves the weave slightly off-centre but never
 * breaks the render. */
const measureMeanLuma = (ctx: CanvasRenderingContext2D): number => {
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, POT_SIZE, POT_SIZE).data;
  } catch {
    return 0.5;
  }
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 16) { // every 4th pixel (4 bytes each)
    sum += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    n++;
  }
  return n > 0 ? sum / n : 0.5;
};

/** Uploads one fabric photo as a GL texture, keyed by its own path.
 *
 * Keying on the path is what makes a blind-type change a genuine texture swap
 * rather than a re-tint. Each path gets its own GL texture AND its own
 * meanLuma, measured from that photo at upload — so when the type changes the
 * shader is handed a different weave and a different mean to subtract, and
 * reconstructs the fabric from the selected colour against the new texture.
 * Nothing carries over from the previous fabric: there is no accumulated
 * surface to tint, because the colour is rebuilt per pixel every frame from
 * u_tintColor and this texture's deviation. */
const getOrUploadTexture = (state: GLState, key: string, img: HTMLImageElement): FabricTexture => {
  const existing = state.textures.get(key);
  if (existing) return existing;

  const { gl } = state;
  const potCanvas = document.createElement('canvas');
  potCanvas.width = POT_SIZE;
  potCanvas.height = POT_SIZE;
  const potCtx = potCanvas.getContext('2d', { willReadFrequently: true });
  if (!potCtx) throw new Error('Failed to create texture resampling context');
  potCtx.drawImage(img, 0, 0, POT_SIZE, POT_SIZE);
  const meanLuma = measureMeanLuma(potCtx);

  const texture = gl.createTexture();
  if (!texture) throw new Error('Failed to create WebGL texture');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, potCanvas);
  // Vertical (T) wrap is CLAMP_TO_EDGE, not REPEAT — these fabric photos
  // aren't seamlessly tileable, so repeating them vertically produced a
  // visible horizontal seam wherever the texture's own edge repeated
  // partway down the drop. Clamping means the last row of pixels smears
  // instead of hard-cutting back to row zero — one continuous fabric piece.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);

  const entry: FabricTexture = { texture, meanLuma };
  state.textures.set(key, entry);
  return entry;
};

/** Uploads (or reuses) the GL texture for one already-decoded fabric photo.
 * Returns null when that path wasn't preloaded, so a caller can skip drawing
 * rather than throw mid-frame. */
const uploadTexture = (
  state: GLState,
  images: FabricImages,
  path: string
): FabricTexture | null => {
  const img = images.get(path);
  return img ? getOrUploadTexture(state, path, img) : null;
};

const UNIT_SQUARE: Point[] = [[0, 0], [1, 0], [1, 1], [0, 1]];

/** How strongly the texture photo's weave modulates the base colour. Low by
 * design — the selected Rynamic colour has to survive intact, so the weave
 * reads as surface, never as a wash over the top of it. */
const FABRIC_TEXTURE_AMOUNT = 0.5;

/** Vertical texture repeats, bounded at both ends. The upper bound stops a
 * tall trace visibly tiling; the lower bound stops a nearly rolled-up blind
 * collapsing to a single smeared texture row. */
const clampUvScale = (scale: number): number => Math.max(0.25, Math.min(2, scale));

interface QuadOptions {
  tint: { r: number; g: number; b: number };
  textureAmount: number;
  opacity: number;
  uvScale: [number, number];
  shade: boolean;
  folds: number;
  /** Selects the shader's per-type surface pass. See shaderTypeFor. Defaults
   * to 3 (no per-type pass) so existing callers are unaffected. */
  shaderType?: number;
}

/** Renders one fabric quad. Corner order: [tl, tr, br, bl] in photo pixels. */
const drawQuad = (
  state: GLState,
  quad: Point[],
  fabric: FabricTexture,
  opts: QuadOptions
) => {
  const { gl, loc, positionBuffer } = state;

  const h = computeHomography(quad, UNIT_SQUARE);
  gl.uniformMatrix3fv(loc.pixelToUv, false, toColumnMajor(h));
  gl.uniform4f(loc.tintColor, opts.tint.r / 255, opts.tint.g / 255, opts.tint.b / 255, 1);
  gl.uniform1f(loc.textureAmount, opts.textureAmount);
  gl.uniform1f(loc.textureMean, fabric.meanLuma);
  gl.uniform1f(loc.opacity, opts.opacity);
  gl.uniform2f(loc.uvScale, opts.uvScale[0], opts.uvScale[1]);
  gl.uniform1f(loc.shade, opts.shade ? 1 : 0);
  gl.uniform1f(loc.folds, opts.folds);
  gl.uniform1f(loc.blindType, opts.shaderType ?? 3);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, fabric.texture);
  gl.uniform1i(loc.texture, 0);

  const [tl, tr, br, bl] = quad;
  const vertices = new Float32Array([
    tl[0], tl[1], tr[0], tr[1], bl[0], bl[1],
    bl[0], bl[1], tr[0], tr[1], br[0], br[1],
  ]);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(loc.position);
  gl.vertexAttribPointer(loc.position, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

// ---------------------------------------------------------------------------
// Per-area draw — everything below is computed fresh from that area's own
// corner pins every render, so it scales correctly regardless of the
// window's size/position in the photo.
// ---------------------------------------------------------------------------

interface AreaParams {
  corners: Point[];
  blindType: string;
  fabricColor: string;
  hardwareColor?: string | null;
  hardwareColourName?: 'white' | 'black' | 'chrome';
  controlType: string;
  showChain?: boolean;
  rollPosition?: number;
  baseRailShape?: string;
  chainSide?: string;
}

/** Darkens the window opening before fabric is drawn, so the blind/curtain
 * reads as sitting deeper in the frame than the surrounding wall. Shared by
 * the roller and curtain render paths. */
const drawPreFabricDepth = (ctx: CanvasRenderingContext2D, corners: Point[]) => {
  const [tl, tr, br, bl] = corners;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(br[0], br[1]);
  ctx.lineTo(bl[0], bl[1]);
  ctx.closePath();
  ctx.fillStyle = shadowRgba(0.16);
  ctx.fill();
  ctx.restore();
};

/** Diffuses whatever is behind a translucent blind, before the fabric is
 * drawn over it. A sunscreen mesh scatters transmitted light, so the view
 * through it is a soft ghost, not a sharp image — without this the window
 * behind stayed perfectly crisp and the fabric read as a coloured sheet of
 * glass rather than a weave.
 *
 * Re-draws the already-composited photo clipped to the fabric quad. Prefers
 * ctx.filter, which is a real gaussian in one pass; where that is unsupported
 * it falls back to stacked offset draws, which approximates the same blur as
 * a box average at a few times the cost. */
const drawBackgroundDiffusion = (
  ctx: CanvasRenderingContext2D,
  photo: CanvasImageSource,
  quad: Point[],
  radius: number,
) => {
  const [a, b, c, d] = quad;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(c[0], c[1]);
  ctx.lineTo(d[0], d[1]);
  ctx.closePath();
  ctx.clip();

  const supportsFilter = typeof ctx.filter === 'string';
  if (supportsFilter) {
    ctx.filter = `blur(${radius.toFixed(1)}px)`;
    ctx.drawImage(photo, 0, 0);
    ctx.filter = 'none';
  } else {
    // Eight offsets on a ring plus the centre, each at a low alpha — the
    // accumulated average reads as a blur of roughly the same radius.
    ctx.globalAlpha = 0.14;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      ctx.drawImage(photo, Math.cos(ang) * radius, Math.sin(ang) * radius);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};

/** Subtle directional light sheen over the fabric — light assumed to come
 * from the top-left, the most common orientation for window rooms. Kept
 * very low-opacity: felt as dimension, not seen as a visible gradient.
 * Shared by the roller and curtain render paths. */
const drawLightSheen = (ctx: CanvasRenderingContext2D, corners: Point[]) => {
  const [tl, tr, br, bl] = corners;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(br[0], br[1]);
  ctx.lineTo(bl[0], bl[1]);
  ctx.closePath();
  ctx.clip();

  const lightGrad = ctx.createLinearGradient(tl[0], tl[1], br[0], br[1]);
  lightGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
  lightGrad.addColorStop(0.4, 'rgba(255,255,255,0)');
  lightGrad.addColorStop(1, shadowRgba(0.04));
  ctx.fillStyle = lightGrad;
  ctx.fill();
  ctx.restore();
};

/** Ambient occlusion on the fabric's own left/right edges only — a shadow
 * band 24px deep (as a fraction of the top edge's own length, so it holds
 * at 24px for a typical trace), black at 20% fading to 0% inward. Takes the
 * CURRENT fabric sub-quad (tl/tr down to whatever the roll position's
 * bottom edge is), never the cassette or rail — those get their own
 * dedicated shadow treatment instead. Fabric-only, roller path only. */
const drawAmbientOcclusion = (
  ctx: CanvasRenderingContext2D,
  tl: Point,
  tr: Point,
  fabBR: Point,
  fabBL: Point
) => {
  const topW = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
  // 20px at the reference blind, capped so it can't eat a very narrow trace.
  const depthFrac = Math.min(0.45, scaleToBlind(20, topW) / Math.max(1, topW));

  const lerp = (a: Point, b: Point, t: number): Point => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];

  const fillBand = (outerA: Point, outerB: Point, innerB: Point, innerA: Point) => {
    const grad = ctx.createLinearGradient(outerA[0], outerA[1], innerA[0], innerA[1]);
    // 22%, warm. This is the band that makes the fabric read as hanging in a
    // recess rather than lying flat against the photo.
    grad.addColorStop(0, shadowRgba(0.22));
    grad.addColorStop(0.45, shadowRgba(0.07));
    grad.addColorStop(1, shadowRgba(0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(outerA[0], outerA[1]);
    ctx.lineTo(outerB[0], outerB[1]);
    ctx.lineTo(innerB[0], innerB[1]);
    ctx.lineTo(innerA[0], innerA[1]);
    ctx.closePath();
    ctx.fill();
  };

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(fabBR[0], fabBR[1]);
  ctx.lineTo(fabBL[0], fabBL[1]);
  ctx.closePath();
  ctx.clip();

  fillBand(tl, fabBL, lerp(fabBL, fabBR, depthFrac), lerp(tl, tr, depthFrac)); // left
  fillBand(tr, fabBR, lerp(fabBR, fabBL, depthFrac), lerp(tr, tl, depthFrac)); // right

  ctx.restore();
};

// ---------------------------------------------------------------------------
// Light leak — daylight escaping around the fabric's edges.
//
// This is the single strongest cue for how opaque a blind is. A blockout stops
// the light dead, so all of it escapes around the sides and under the rail as
// a bright warm rim; a sunscreen passes most of it through the weave, so
// almost nothing spills at the edge. Rendering the leak differently per type
// is what makes the three fabrics distinguishable at a glance even when the
// selected colour is identical.
//
// Necessarily Canvas2D: the leak falls OUTSIDE the fabric quad, on the frame
// and wall, and the shader can only write pixels inside the quad it rasterises.
// ---------------------------------------------------------------------------

interface LeakSpec {
  /** Side glow: outward reach in reference px, and peak alpha. */
  side: { reach: number; alpha: number };
  /** Under the bottom rail. */
  bottom: { reach: number; alpha: number };
  /** Between the cassette and the wall above it. */
  top: { reach: number; alpha: number };
}

const LEAK_BY_TYPE: Record<string, LeakSpec> = {
  // Opaque: everything escapes at the perimeter.
  blockout: {
    side: { reach: 8, alpha: 0.12 },
    bottom: { reach: 4, alpha: 0.15 },
    top: { reach: 3, alpha: 0.1 },
  },
  // Transmits most light through the weave, and seals better at the edge.
  sunscreen: {
    side: { reach: 4, alpha: 0.06 },
    bottom: { reach: 3, alpha: 0.05 },
    top: { reach: 2, alpha: 0.04 },
  },
  // Between the two.
  lightfilter: {
    side: { reach: 6, alpha: 0.14 },
    bottom: { reach: 5, alpha: 0.12 },
    top: { reach: 3, alpha: 0.08 },
  },
};

/** Warm daylight spilling around the fabric. `tl`/`tr` are the blind's top
 * corners; `fabBL`/`fabBR` its current bottom edge, so the side glow shortens
 * with the fabric as the blind rolls up instead of glowing over open glass. */
const drawLightLeak = (
  ctx: CanvasRenderingContext2D,
  blindType: string,
  tl: Point,
  tr: Point,
  fabBL: Point,
  fabBR: Point,
  avgW: number,
) => {
  const spec = LEAK_BY_TYPE[blindType];
  if (!spec) return;

  const { u, pv } = axesFor(tl, tr);
  const [ux, uy] = u;
  const [px, py] = pv;

  ctx.save();
  // 'lighter' so overlapping glows accumulate as light does, rather than the
  // later one painting over the earlier at partial alpha.
  ctx.globalCompositeOperation = 'lighter';

  /** One glow band running from `a` to `b`, fading outward along `dx,dy`. */
  const band = (a: Point, b: Point, dx: number, dy: number, reach: number, alpha: number) => {
    if (reach < 0.5 || alpha <= 0) return;
    const a2: Point = [a[0] + dx * reach, a[1] + dy * reach];
    const b2: Point = [b[0] + dx * reach, b[1] + dy * reach];
    const g = ctx.createLinearGradient(a[0], a[1], a2[0], a2[1]);
    g.addColorStop(0, leakRgba(alpha));
    g.addColorStop(0.5, leakRgba(alpha * 0.35));
    g.addColorStop(1, leakRgba(0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(b2[0], b2[1]);
    ctx.lineTo(a2[0], a2[1]);
    ctx.closePath();
    ctx.fill();
  };

  const sideReach = scaleToBlind(spec.side.reach, avgW);
  band(tl, fabBL, -ux, -uy, sideReach, spec.side.alpha);   // left, spilling outward
  band(tr, fabBR, ux, uy, sideReach, spec.side.alpha);     // right, mirrored
  band(fabBL, fabBR, -px, -py, scaleToBlind(spec.bottom.reach, avgW), spec.bottom.alpha);
  band(tl, tr, px, py, scaleToBlind(spec.top.reach, avgW), spec.top.alpha);

  ctx.restore();
};

/** Perimeter stroke around the quad, grounding the fabric in the frame. */
const drawVignette = (ctx: CanvasRenderingContext2D, corners: Point[]) => {
  const [tl, tr, br, bl] = corners;
  ctx.save();
  ctx.strokeStyle = shadowRgba(0.36);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(br[0], br[1]);
  ctx.lineTo(bl[0], bl[1]);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

/** Soft shadow the blind casts downward onto whatever sits below the bottom
 * rail, grounding it physically in the scene. Anchored to the RAIL's own
 * position rather than the window's bottom edge — otherwise a half-raised
 * blind stretches one shadow gradient all the way down over the open glass
 * instead of casting a short one just beneath itself. */
const drawContactShadow = (
  ctx: CanvasRenderingContext2D,
  fabBL: Point,
  fabBR: Point
) => {
  const shadowHeight = 10;
  ctx.save();
  multiPassShadow(3, shadowHeight, 0.15, (reach, alpha) => {
    const bl: Point = [fabBL[0], fabBL[1] + reach];
    const br: Point = [fabBR[0], fabBR[1] + reach];
    const g = ctx.createLinearGradient(fabBL[0], fabBL[1], bl[0], bl[1]);
    g.addColorStop(0, shadowRgba(alpha));
    g.addColorStop(1, shadowRgba(0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(fabBL[0], fabBL[1]);
    ctx.lineTo(fabBR[0], fabBR[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
};

/** Deterministic pseudo-random 0..1, stable across re-renders (no
 * Math.random() — this repaints on every roll-position drag, and a true
 * random value would make the weave visibly jitter frame to frame). */
const pseudoRandom01 = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Real woven fabric's only visible "texture" here — soft vertical lines,
 * evenly spaced (consistent weave spacing) but each with its own subtle
 * opacity between 0.03 and 0.08 so it reads as breathing cloth rather than
 * a uniform printed grid. This is the fabric's whole texture cue: the
 * underlying photo no longer tiles (see CLAMP_TO_EDGE above), so there's
 * no risk of these competing with a seam. */
const drawFabricFoldLines = (
  ctx: CanvasRenderingContext2D,
  tl: Point,
  tr: Point,
  fabBL: Point,
  fabBR: Point,
  avgW: number
) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(fabBR[0], fabBR[1]);
  ctx.lineTo(fabBL[0], fabBL[1]);
  ctx.closePath();
  ctx.clip();

  const lineCount = 14;
  for (let i = 1; i < lineCount; i++) {
    const t = i / lineCount;

    const topX = tl[0] + (tr[0] - tl[0]) * t;
    const topY = tl[1] + (tr[1] - tl[1]) * t;
    const botX = fabBL[0] + (fabBR[0] - fabBL[0]) * t;
    const botY = fabBL[1] + (fabBR[1] - fabBL[1]) * t;

    const lineAlpha = 0.03 + pseudoRandom01(i) * 0.05; // breathes between 0.03 and 0.08

    const foldGrad = ctx.createLinearGradient(
      topX - avgW * 0.01, topY,
      topX + avgW * 0.01, topY
    );
    foldGrad.addColorStop(0, shadowRgba(0));
    foldGrad.addColorStop(0.5, shadowRgba(lineAlpha));
    foldGrad.addColorStop(1, shadowRgba(0));

    ctx.save();
    ctx.strokeStyle = foldGrad;
    ctx.lineWidth = avgW * 0.01;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(botX, botY);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
};

/** Sunscreen / Light Filter read as semi-translucent — light bleeds through
 * from behind, brightest at the fabric's centre and fading toward all four
 * edges (a soft radial wash, not the linear left-right centre-light above). */
const drawTranslucentLightBleed = (
  ctx: CanvasRenderingContext2D,
  tl: Point,
  tr: Point,
  fabBR: Point,
  fabBL: Point
) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(fabBR[0], fabBR[1]);
  ctx.lineTo(fabBL[0], fabBL[1]);
  ctx.closePath();
  ctx.clip();

  const cx = (tl[0] + tr[0] + fabBL[0] + fabBR[0]) / 4;
  const cy = (tl[1] + tr[1] + fabBL[1] + fabBR[1]) / 4;
  const radius = Math.max(
    Math.hypot(tr[0] - tl[0], tr[1] - tl[1]),
    Math.hypot(fabBL[0] - tl[0], fabBL[1] - tl[1])
  ) * 0.65;

  const bleed = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  bleed.addColorStop(0, 'rgba(255,255,255,0.1)');
  bleed.addColorStop(0.6, 'rgba(255,255,255,0.03)');
  bleed.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bleed;
  ctx.fill();
  ctx.restore();
};

/** Very subtle centre-bright gradient across the fabric's width — real
 * fabric catches light more directly near the centre than at the edges. */
const drawFabricCentreLight = (
  ctx: CanvasRenderingContext2D,
  tl: Point,
  tr: Point,
  fabBL: Point,
  fabBR: Point
) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(fabBR[0], fabBR[1]);
  ctx.lineTo(fabBL[0], fabBL[1]);
  ctx.closePath();
  ctx.clip();

  const centreY = (tl[1] + tr[1]) / 2;
  const fabricLightGrad = ctx.createLinearGradient(tl[0], centreY, tr[0], centreY);
  fabricLightGrad.addColorStop(0, shadowRgba(0.06));
  fabricLightGrad.addColorStop(0.2, shadowRgba(0));
  fabricLightGrad.addColorStop(0.5, 'rgba(255,255,255,0.04)');
  fabricLightGrad.addColorStop(0.8, shadowRgba(0));
  fabricLightGrad.addColorStop(1, shadowRgba(0.06));
  ctx.fillStyle = fabricLightGrad;
  ctx.fill();
  ctx.restore();
};

/** Shadow the cassette/headrail casts downward onto the fabric below it —
 * it's a physical bracket mounted against the wall, blocking light. */
const drawCassetteMountShadow = (
  ctx: CanvasRenderingContext2D,
  tl: Point,
  tr: Point,
  fabBL: Point,
  fabBR: Point,
  tubeHeight: number,
  leftH: number,
  avgW: number
) => {
  // 18px at the reference blind, floored against leftH so a short blind's
  // cassette doesn't cast a shadow longer than the fabric it falls on.
  const mountShadowH = Math.min(scaleToBlind(18, avgW), leftH * 0.09);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(fabBR[0], fabBR[1]);
  ctx.lineTo(fabBL[0], fabBL[1]);
  ctx.closePath();
  ctx.clip();

  // Four overlapping passes from 25% rather than one three-stop gradient —
  // the cassette is a thick object close to the fabric, so its shadow should
  // be dense right under the tube and dissolve without a terminating edge.
  multiPassShadow(4, mountShadowH, 0.25, (reach, alpha) => {
    const g = ctx.createLinearGradient(
      tl[0], tl[1] + tubeHeight,
      tl[0], tl[1] + tubeHeight + reach,
    );
    g.addColorStop(0, shadowRgba(alpha));
    g.addColorStop(1, shadowRgba(0));
    ctx.fillStyle = g;
    ctx.fillRect(tl[0] - avgW * 0.02, tl[1] + tubeHeight, avgW * 1.04, reach);
  });
  ctx.restore();
};

/** The rail hangs in space — it casts a soft shadow up onto the fabric
 * directly behind/above it. (The wall-facing cast shadow below the rail is
 * `drawContactShadow`'s job — kept separate so there's exactly one clean
 * 8px wall shadow instead of two overlapping gradients.) */
const drawRailDropShadow = (
  ctx: CanvasRenderingContext2D,
  tl: Point,
  tr: Point,
  railTL: Point,
  railTR: Point,
  leftH: number
) => {
  const railShadowH = leftH * 0.03;
  ctx.save();
  // Clipped to the fabric between the blind's top and the rail. Without
  // this the gradient reaches a fixed distance above the rail regardless of
  // where the rail is, so a nearly rolled-up blind smudged a dark band
  // across its own cassette and the wall above it.
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(railTR[0], railTR[1]);
  ctx.lineTo(railTL[0], railTL[1]);
  ctx.closePath();
  ctx.clip();

  multiPassShadow(3, railShadowH, 0.18, (reach, alpha) => {
    const g = ctx.createLinearGradient(
      railTL[0], railTL[1],
      railTL[0], railTL[1] - reach,
    );
    g.addColorStop(0, shadowRgba(alpha));
    g.addColorStop(1, shadowRgba(0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(railTL[0], railTL[1]);
    ctx.lineTo(railTR[0], railTR[1]);
    ctx.lineTo(railTR[0], railTR[1] - reach);
    ctx.lineTo(railTL[0], railTL[1] - reach);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
};

// ---------------------------------------------------------------------------
// Hardware finish — one shared fill so the cassette, rail, and brackets
// always match exactly. Flat colour for white/black, a metallic 3-stop
// gradient for chrome.
// ---------------------------------------------------------------------------

// Shares the one hardware palette with the swatch UI and the store, so a
// finish can never render as a different colour than the swatch that picked
// it. Chrome is the exception — it is a gradient, not a flat fill.
const HARDWARE_FLAT_HEX: Record<'white' | 'black', string> = {
  white: HARDWARE_HEX.white,
  black: HARDWARE_HEX.black,
};

/** Used when a caller supplies no hardware colour at all. */
const HARDWARE_FALLBACK = HARDWARE_HEX.white;
const CHROME_GRADIENT_STOPS: [number, string][] = [
  [0, '#C0BEBB'],
  [0.5, '#E0DEDA'],
  [1, '#A8A6A2'],
];

/** Shifts a hex toward white (f > 0) or black (f < 0) by a fraction. Used to
 * derive the cylinder gradient and the bracket's shaded plate from whatever
 * the base finish is, so a new finish needs no new constants. */
const shadeHex = (hex: string, f: number): string => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c =>
    Math.max(0, Math.min(255, Math.round(f >= 0 ? c + (255 - c) * f : c * (1 + f)))),
  );
  return `#${ch.map(c => c.toString(16).padStart(2, '0')).join('')}`;
};

/** The base hex for a finish, before any shading. */
const hardwareBaseHex = (
  hardwareColourName: 'white' | 'black' | 'chrome' | undefined,
  safeHardwareColor: string,
): string =>
  hardwareColourName === 'white' || hardwareColourName === 'black'
    ? HARDWARE_FLAT_HEX[hardwareColourName]
    : hardwareColourName === 'chrome'
      ? CHROME_GRADIENT_STOPS[1][1]
      : safeHardwareColor;

/** Flat fill — for faces that must not read as curved (bracket plates, end
 * caps). Chrome still gets its metallic gradient. */
const setHardwareFill = (
  ctx: CanvasRenderingContext2D,
  hardwareColourName: 'white' | 'black' | 'chrome' | undefined,
  safeHardwareColor: string,
  gradFrom: Point,
  gradTo: Point
) => {
  if (hardwareColourName === 'chrome') {
    const grad = ctx.createLinearGradient(gradFrom[0], gradFrom[1], gradTo[0], gradTo[1]);
    CHROME_GRADIENT_STOPS.forEach(([stop, colour]) => grad.addColorStop(stop, colour));
    ctx.fillStyle = grad;
  } else if (hardwareColourName === 'white' || hardwareColourName === 'black') {
    ctx.fillStyle = HARDWARE_FLAT_HEX[hardwareColourName];
  } else {
    ctx.fillStyle = safeHardwareColor;
  }
};

// The cassette and rail used to share a setCylinderFill helper — a 3-stop
// vertical ramp applied to a pill outline. Both now use traceCassetteBody
// with their own 4-stop ramp plus a separately filled underside, which a
// single fillStyle helper cannot express, so the helper is gone.

const CASSETTE_HEIGHT_RATIO = 0.04; // ~4% of blind height — slim, not a thick bar
const RAIL_HEIGHT_RATIO = 0.02; // ~2% of blind height — half the cassette

/** Unit direction along tl->tr plus its perpendicular. */
const axesFor = (tl: Point, tr: Point): { u: Point; pv: Point } => {
  const dx = tr[0] - tl[0];
  const dy = tr[1] - tl[1];
  const len = Math.hypot(dx, dy) || 1;
  const u: Point = [dx / len, dy / len];
  // Perpendicular pointing UP the image (negative y) for a left-to-right tube.
  const pv: Point = [u[1], -u[0]];
  return { u, pv };
};

/** Cassette (top roller housing) — a rounded cylindrical tube: straight body,
 * semicircular ends, and a vertical light-to-dark face gradient that makes it
 * read as round. Fixed height regardless of roll position (real cassettes
 * don't visibly swell as fabric rolls up). Returns the half-height so callers
 * can position the cassette-mount shadow right below it. One shared cassette
 * also covers both layers of a dual blind — real twin-roller blinds mount both
 * rolls in a single housing. */
/** Traces a cassette body: a rectangle whose top edge bulges up as a shallow
 * elliptical arc, in the quad's own rotated frame. `domeH` is how far the arc
 * rises above the rectangle's shoulders.
 *
 * The arc is a single cubic — for an arc this shallow (30% of the cassette
 * height across its full width) control points at the quarter positions,
 * raised by 4/3 of the rise, sit within a pixel of a true ellipse. */
const traceCassetteBody = (
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  halfH: number,
  domeH: number,
  pv: Point,
) => {
  const [px, py] = pv;
  const shoulder = halfH - domeH;
  const k = domeH * 1.3333;

  const aBot: Point = [a[0] - px * halfH, a[1] - py * halfH];
  const bBot: Point = [b[0] - px * halfH, b[1] - py * halfH];
  const aSh: Point = [a[0] + px * shoulder, a[1] + py * shoulder];
  const bSh: Point = [b[0] + px * shoulder, b[1] + py * shoulder];

  ctx.beginPath();
  ctx.moveTo(aBot[0], aBot[1]);
  ctx.lineTo(bBot[0], bBot[1]);
  ctx.lineTo(bSh[0], bSh[1]);
  ctx.bezierCurveTo(
    bSh[0] + px * k, bSh[1] + py * k,
    aSh[0] + px * k, aSh[1] + py * k,
    aSh[0], aSh[1],
  );
  ctx.closePath();
};

/** An end-cap oval at one end of a tube, in the rotated frame. Suggests the
 * cassette's depth — a tube seen slightly off-axis shows its circular end. */
const traceEndCapOval = (
  ctx: CanvasRenderingContext2D,
  centre: Point,
  halfH: number,
  capW: number,
  u: Point,
  pv: Point,
) => {
  const [ux, uy] = u;
  const [px, py] = pv;
  const kx = capW * 0.5523;
  const ky = halfH * 0.5523;

  const top: Point = [centre[0] + px * halfH, centre[1] + py * halfH];
  const bot: Point = [centre[0] - px * halfH, centre[1] - py * halfH];
  const out: Point = [centre[0] + ux * capW, centre[1] + uy * capW];
  const inn: Point = [centre[0] - ux * capW, centre[1] - uy * capW];

  ctx.beginPath();
  ctx.moveTo(top[0], top[1]);
  ctx.bezierCurveTo(
    top[0] + ux * kx, top[1] + uy * kx,
    out[0] + px * ky, out[1] + py * ky,
    out[0], out[1],
  );
  ctx.bezierCurveTo(
    out[0] - px * ky, out[1] - py * ky,
    bot[0] + ux * kx, bot[1] + uy * kx,
    bot[0], bot[1],
  );
  ctx.bezierCurveTo(
    bot[0] - ux * kx, bot[1] - uy * kx,
    inn[0] - px * ky, inn[1] - py * ky,
    inn[0], inn[1],
  );
  ctx.bezierCurveTo(
    inn[0] + px * ky, inn[1] + py * ky,
    top[0] - ux * kx, top[1] - uy * kx,
    top[0], top[1],
  );
  ctx.closePath();
};

const drawCassette = (
  ctx: CanvasRenderingContext2D,
  tl: Point,
  tr: Point,
  leftH: number,
  hardwareColourName: 'white' | 'black' | 'chrome' | undefined,
  safeHardwareColor: string,
  avgW: number
): number => {
  const fullH = leftH * CASSETTE_HEIGHT_RATIO;
  const halfH = fullH / 2;
  const domeH = fullH * 0.3;      // elliptical top edge, 30% of the height
  const undersideH = fullH * 0.18; // the bottom face, turned away from the light
  const { u, pv } = axesFor(tl, tr);
  const base = hardwareBaseHex(hardwareColourName, safeHardwareColor);
  const top: Point = [tl[0] + pv[0] * halfH, tl[1] + pv[1] * halfH];
  const bot: Point = [tl[0] - pv[0] * halfH, tl[1] - pv[1] * halfH];

  ctx.save();

  // --- FACE: 3-stop ramp. Lighter across the top fifth where the curve faces
  // the light, base through the middle, darker at the bottom as it turns away.
  traceCassetteBody(ctx, tl, tr, halfH, domeH, pv);
  if (hardwareColourName === 'chrome') {
    setHardwareFill(ctx, hardwareColourName, safeHardwareColor, top, bot);
  } else {
    const grad = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
    grad.addColorStop(0, shadeHex(base, 0.2));
    grad.addColorStop(0.2, shadeHex(base, 0.2));
    grad.addColorStop(0.55, base);
    grad.addColorStop(1, shadeHex(base, -0.15));
    ctx.fillStyle = grad;
  }
  ctx.fill();

  // Everything below is clipped to the body so no detail escapes the outline.
  ctx.save();
  traceCassetteBody(ctx, tl, tr, halfH, domeH, pv);
  ctx.clip();

  // --- UNDERSIDE: the bottom face at 60% brightness. A separate fill rather
  // than the tail of the gradient, because a face turned fully away from the
  // light has a hard edge where it begins, not a fade.
  const uTop = halfH - fullH + undersideH;
  ctx.fillStyle = shadeHex(base, -0.4);
  ctx.beginPath();
  ctx.moveTo(tl[0] + pv[0] * uTop, tl[1] + pv[1] * uTop);
  ctx.lineTo(tr[0] + pv[0] * uTop, tr[1] + pv[1] * uTop);
  ctx.lineTo(tr[0] - pv[0] * halfH, tr[1] - pv[1] * halfH);
  ctx.lineTo(tl[0] - pv[0] * halfH, tl[1] - pv[1] * halfH);
  ctx.closePath();
  ctx.fill();

  // --- END CAPS: a darker oval at each end, reading as the tube's own depth.
  const capW = Math.max(2, scaleToBlind(5, avgW));
  ctx.fillStyle = shadeHex(base, -0.28);
  traceEndCapOval(ctx, tl, halfH * 0.94, capW, u, pv);
  ctx.fill();
  traceEndCapOval(ctx, tr, halfH * 0.94, capW, u, pv);
  ctx.fill();

  // --- TOP HIGHLIGHT: 2px at 25% white, riding just under the crown.
  const hi = halfH * 0.62;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tl[0] + pv[0] * hi, tl[1] + pv[1] * hi);
  ctx.lineTo(tr[0] + pv[0] * hi, tr[1] + pv[1] * hi);
  ctx.stroke();

  // --- BOTTOM SHADOW: 2px warm dark, separating the tube from the fabric.
  ctx.strokeStyle = shadowRgba(0.35);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tl[0] - pv[0] * hi, tl[1] - pv[1] * hi);
  ctx.lineTo(tr[0] - pv[0] * hi, tr[1] - pv[1] * hi);
  ctx.stroke();

  ctx.restore();
  ctx.restore();

  return halfH;
};

/** Bottom rail — the cassette's cylindrical treatment at half the height,
 * plus end caps and a soft underside shadow. `railTL`/`railTR` is where the
 * rail begins; `fabBL`/`fabBR` is the fabric's true bottom edge, which the
 * rail's underside follows, so the rail always rides the fabric no matter
 * where the roll sits. */
const drawBottomRail = (
  ctx: CanvasRenderingContext2D,
  railTL: Point,
  railTR: Point,
  fabBL: Point,
  fabBR: Point,
  hardwareColourName: 'white' | 'black' | 'chrome' | undefined,
  safeHardwareColor: string,
  avgW: number
) => {
  const { u, pv } = axesFor(railTL, railTR);
  // Centreline between the rail's top and the fabric's bottom edge, so the
  // tube sits exactly in the band the caller allocated for it.
  const midL: Point = [(railTL[0] + fabBL[0]) / 2, (railTL[1] + fabBL[1]) / 2];
  const midR: Point = [(railTR[0] + fabBR[0]) / 2, (railTR[1] + fabBR[1]) / 2];
  const halfH = Math.max(1, Math.hypot(fabBL[0] - railTL[0], fabBL[1] - railTL[1]) / 2);
  const fullH = halfH * 2;
  const domeH = fullH * 0.3;
  const undersideH = fullH * 0.18;
  const base = hardwareBaseHex(hardwareColourName, safeHardwareColor);

  ctx.save();

  // --- CAST SHADOW ON THE WALL BELOW — 12px, warm 20% -> transparent, in
  // four overlapping passes so the falloff curves instead of ramping to a
  // detectable terminating line. Drawn before the rail so the rail's own
  // edge stays crisp on top of it.
  const underH = scaleToBlind(12, avgW);
  multiPassShadow(4, underH, 0.2, (reach, alpha) => {
    const bl: Point = [fabBL[0] - pv[0] * reach, fabBL[1] - pv[1] * reach];
    const br: Point = [fabBR[0] - pv[0] * reach, fabBR[1] - pv[1] * reach];
    const g = ctx.createLinearGradient(fabBL[0], fabBL[1], bl[0], bl[1]);
    g.addColorStop(0, shadowRgba(alpha));
    g.addColorStop(1, shadowRgba(0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(fabBL[0], fabBL[1]);
    ctx.lineTo(fabBR[0], fabBR[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.closePath();
    ctx.fill();
  });

  // --- BODY: same domed profile as the cassette, at half its height.
  const top: Point = [midL[0] + pv[0] * halfH, midL[1] + pv[1] * halfH];
  const bot: Point = [midL[0] - pv[0] * halfH, midL[1] - pv[1] * halfH];
  traceCassetteBody(ctx, midL, midR, halfH, domeH, pv);
  if (hardwareColourName === 'chrome') {
    setHardwareFill(ctx, hardwareColourName, safeHardwareColor, top, bot);
  } else {
    const g = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
    g.addColorStop(0, shadeHex(base, 0.2));
    g.addColorStop(0.2, shadeHex(base, 0.2));
    g.addColorStop(0.55, base);
    g.addColorStop(1, shadeHex(base, -0.15));
    ctx.fillStyle = g;
  }
  ctx.fill();

  ctx.save();
  traceCassetteBody(ctx, midL, midR, halfH, domeH, pv);
  ctx.clip();

  // --- UNDERSIDE: bottom face at 60% brightness, same as the cassette.
  const uTop = halfH - fullH + undersideH;
  ctx.fillStyle = shadeHex(base, -0.4);
  ctx.beginPath();
  ctx.moveTo(midL[0] + pv[0] * uTop, midL[1] + pv[1] * uTop);
  ctx.lineTo(midR[0] + pv[0] * uTop, midR[1] + pv[1] * uTop);
  ctx.lineTo(midR[0] - pv[0] * halfH, midR[1] - pv[1] * halfH);
  ctx.lineTo(midL[0] - pv[0] * halfH, midL[1] - pv[1] * halfH);
  ctx.closePath();
  ctx.fill();

  // --- END CAPS with depth, matching the cassette's treatment.
  const capW = Math.max(1.5, scaleToBlind(3.5, avgW));
  ctx.fillStyle = shadeHex(base, -0.28);
  traceEndCapOval(ctx, midL, halfH * 0.94, capW, u, pv);
  ctx.fill();
  traceEndCapOval(ctx, midR, halfH * 0.94, capW, u, pv);
  ctx.fill();

  // --- TOP FACE HIGHLIGHT, inside the clip so it stops at the caps.
  const hi = halfH * 0.55;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(midL[0] + pv[0] * hi, midL[1] + pv[1] * hi);
  ctx.lineTo(midR[0] + pv[0] * hi, midR[1] + pv[1] * hi);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
};

/** Wall-mount side brackets — small, discrete blocks that hold the cassette
 * flush against the wall, one at each end. Sized as a ratio of the traced
 * window's own width (10x16 at a ~400px-wide reference blind) so they scale
 * correctly at any distance/zoom. Built along the cassette's own direction
 * vector (not assumed horizontal) so they stay correct even when the traced
 * window is slightly rotated in the photo. Hardware colour always matches
 * the cassette; a single 1px shadow sits on the outer edge only (the edge
 * facing away from the window, toward the wall). */
const drawSideBrackets = (
  ctx: CanvasRenderingContext2D,
  tl: Point,
  tr: Point,
  avgW: number,
  hardwareColourName: 'white' | 'black' | 'chrome' | undefined,
  safeHardwareColor: string
) => {
  // Sizes are the spec's pixel values at a ~400px reference blind, scaled to
  // the trace — see scaleToBlind. A literal 10px plate reads correctly on the
  // 1254px default window and is invisible on a 4000px phone upload.
  const plateW = scaleToBlind(10, avgW);  // back plate, flat against the wall
  const projection = scaleToBlind(14, avgW); // how far the bracket stands off it
  const plateH = scaleToBlind(21, avgW);  // full bracket height
  const topFaceH = plateH * 0.3;          // the lit upper surface

  const { u, pv } = axesFor(tl, tr);
  const [ux, uy] = u;
  const [px, py] = pv;
  const base = hardwareBaseHex(hardwareColourName, safeHardwareColor);
  const halfP = plateH / 2;

  const quad = (a: Point, b: Point, c: Point, d: Point) => {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c[0], c[1]);
    ctx.lineTo(d[0], d[1]);
    ctx.closePath();
    ctx.fill();
  };

  /** One L-bracket, built as three distinct faces rather than one flat block.
   * `dir` is -1 at the left end and +1 at the right, so "outboard" is always
   * away from the window and the arm always projects inward beneath the
   * cassette. A single filled rectangle cannot read as an L; three faces at
   * three brightnesses can, because the eye reads the brightness steps as
   * planes meeting at an angle. */
  const drawOne = (anchor: Point, dir: 1 | -1) => {
    const outboard = (d: number): Point => [anchor[0] + ux * d * dir, anchor[1] + uy * d * dir];
    const rise = (from: Point, d: number): Point => [from[0] + px * d, from[1] + py * d];

    ctx.save();

    // --- CAST SHADOW ON THE WALL, outboard side — 8px, soft, multi-pass.
    multiPassShadow(3, scaleToBlind(8, avgW), 0.24, (reach, alpha) => {
      const o0 = outboard(plateW * 0.4);
      const o1 = outboard(plateW * 0.4 + reach);
      ctx.fillStyle = shadowRgba(alpha);
      quad(
        rise(o0, halfP),
        rise(o1, halfP - reach * 0.3),
        rise(o1, -halfP - reach * 0.5),
        rise(o0, -halfP),
      );
    });

    // --- BACK PLATE against the wall — 60% brightness. Furthest from the
    // light and partly occluded by the arm in front of it.
    const bp0 = outboard(0);
    const bp1 = outboard(plateW);
    ctx.fillStyle = shadeHex(base, -0.4);
    quad(rise(bp0, halfP), rise(bp1, halfP), rise(bp1, -halfP), rise(bp0, -halfP));

    // --- FRONT FACE — base colour, full height, projecting inward under the
    // cassette. This is the face pointing into the room.
    const f0 = outboard(0);
    const f1 = outboard(-projection);
    setHardwareFill(ctx, hardwareColourName, safeHardwareColor, rise(f0, halfP), rise(f0, -halfP));
    quad(rise(f0, halfP), rise(f1, halfP), rise(f1, -halfP), rise(f0, -halfP));

    // --- TOP FACE — 110% brightness. The only surface facing the light
    // source directly, and the step that makes the L read as an L.
    ctx.fillStyle = shadeHex(base, 0.1);
    quad(
      rise(f0, halfP),
      rise(f1, halfP),
      rise(f1, halfP - topFaceH),
      rise(f0, halfP - topFaceH),
    );

    // --- BOTTOM SHADOW LINE — 2px, where the underside turns away entirely.
    ctx.strokeStyle = shadowRgba(0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    const b0 = rise(f0, -halfP);
    const b1 = rise(f1, -halfP);
    ctx.moveTo(b0[0], b0[1]);
    ctx.lineTo(b1[0], b1[1]);
    ctx.stroke();

    ctx.restore();
  };

  drawOne([tl[0], tl[1]], -1);
  drawOne([tr[0], tr[1]], 1);
};

const drawBlindArea = (
  ctx: CanvasRenderingContext2D,
  glStateRef: React.MutableRefObject<GLState | null>,
  glUnavailableRef: React.MutableRefObject<boolean>,
  W: number,
  H: number,
  params: AreaParams,
  fabricImgs: FabricImages,
  photo: CanvasImageSource
) => {
  const { blindType } = params;
  if (blindType === 'sheer-curtains' || blindType === 'blockout-curtains') {
    drawCurtainArea(ctx, glStateRef, glUnavailableRef, W, H, params, fabricImgs);
    return;
  }
  if (blindType === 'dual') {
    drawDualBlindArea(ctx, glStateRef, glUnavailableRef, W, H, params, fabricImgs, photo);
    return;
  }

  const {
    corners,
    fabricColor,
    controlType,
    showChain = true,
    rollPosition = 1,
    baseRailShape,
    chainSide,
  } = params;
  void baseRailShape; // kept for API compatibility — every real rail is now the same slim, flat-top shape
  const safeHardwareColor = params.hardwareColor ?? HARDWARE_FALLBACK;
  const hardwareColourName = params.hardwareColourName;
  const type = blindType;

  const [tl, tr, br, bl] = corners;
  const topW = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
  const bottomW = Math.hypot(br[0] - bl[0], br[1] - bl[1]);
  const avgW = (topW + bottomW) / 2;
  const leftH = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);

  // Interpolate a point along the left or right edge at fraction t
  const leftEdge = (t: number): Point => [
    tl[0] + (bl[0] - tl[0]) * t,
    tl[1] + (bl[1] - tl[1]) * t,
  ];
  const rightEdge = (t: number): Point => [
    tr[0] + (br[0] - tr[0]) * t,
    tr[1] + (br[1] - tr[1]) * t,
  ];
  const topEdge = (t: number): Point => [
    tl[0] + (tr[0] - tl[0]) * t,
    tl[1] + (tr[1] - tl[1]) * t,
  ];
  const bottomEdge = (t: number): Point => [
    bl[0] + (br[0] - bl[0]) * t,
    bl[1] + (br[1] - bl[1]) * t,
  ];

  // Roller position: fraction of the drop covered by fabric. The fabric
  // shrinks continuously into the cassette as this approaches zero — there
  // is no threshold below which the blind pops out of existence. The only
  // thing skipped is a sub-pixel drop, where the quad has no height left to
  // build a homography from.
  const p = Math.max(0, Math.min(1, rollPosition));
  const fabricDrop = leftH * p;
  const showBlind = fabricDrop >= 1;
  const fabBL = leftEdge(p);
  const fabBR = rightEdge(p);

  // Everything that shades, lights or outlines the fabric works off THIS
  // quad, never the full window quad. Using `corners` meant a half-raised
  // blind still washed the whole opening in shadow and stroked a border
  // around the empty glass below it.
  const fabricQuad: Point[] = [tl, tr, fabBR, fabBL];

  if (showBlind) {
    // --- DIFFUSION (pre-fabric) — only the fabrics that actually transmit an
    // image. Blockout passes no light at all, so there is nothing behind it
    // to soften; sunscreen scatters the view into a ghost, and light filter
    // diffuses it away almost entirely.
    //
    // Strictly before drawPreFabricDepth: this re-draws the untouched photo
    // clipped to the quad, so anything already painted inside that quad is
    // erased. Run after the depth pass it silently undid it.
    if (type === 'sunscreen') {
      drawBackgroundDiffusion(ctx, photo, fabricQuad, scaleToBlind(6, avgW));
    } else if (type === 'lightfilter') {
      drawBackgroundDiffusion(ctx, photo, fabricQuad, scaleToBlind(14, avgW));
    }

    // --- DEPTH (pre-fabric) ---
    drawPreFabricDepth(ctx, fabricQuad);

    // --- FABRIC via WebGL (perspective-correct texture mapping) ---
    if (!glStateRef.current && !glUnavailableRef.current) {
      try {
        glStateRef.current = createGLState();
      } catch {
        glStateRef.current = null;
      }
      if (!glStateRef.current) glUnavailableRef.current = true;
    }
    const state = glStateRef.current;

    if (state) {
      const { gl } = state;
      if (state.canvas.width !== W || state.canvas.height !== H) {
        state.canvas.width = W;
        state.canvas.height = H;
      }
      gl.viewport(0, 0, W, H);
      gl.useProgram(state.program);
      gl.uniform2f(state.loc.resolution, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const fabricTexture = uploadTexture(state, fabricImgs, getTexturePath(type));
      const tint = hexToRgb(fabricColor);
      if (!fabricTexture) return;

      // ~2 texture repeats across the width. Vertical scale is capped at 2x
      // — with CLAMP_TO_EDGE wrapping (see getOrUploadTexture) anything
      // beyond that just smears the edge pixel rather than hard-repeating,
      // so this keeps the fabric reading as one continuous piece even on a
      // very tall trace instead of visibly tiling. The lower clamp matters
      // just as much while rolling up: as the drop approaches zero so does
      // this scale, and at zero every pixel samples the same texture row,
      // streaking the fabric as it disappears.
      const uvScale: [number, number] = [2, clampUvScale(fabricDrop / avgW)];

      if (type === 'sheer') {
        // Two panels with a centre gap, like a pair of sheer curtains
        const gap = (avgW * 0.04) / avgW / 2; // as fraction of top edge
        const midT = topEdge(0.5 - gap);
        const midT2 = topEdge(0.5 + gap);
        const midB = bottomEdge(0.5 - gap);
        const midB2 = bottomEdge(0.5 + gap);
        // Panel bottoms follow the roll position down the drop
        const lerpP = (a: Point, b: Point): Point => [
          a[0] + (b[0] - a[0]) * p,
          a[1] + (b[1] - a[1]) * p,
        ];
        const midBp = lerpP(midT, midB);
        const midB2p = lerpP(midT2, midB2);
        const panelOpts: QuadOptions = {
          tint,
          textureAmount: FABRIC_TEXTURE_AMOUNT,
          opacity: 0.38,
          uvScale: [1, clampUvScale(fabricDrop / (avgW / 2))],
          shade: true,
          folds: 8,
        };
        drawQuad(state, [tl, midT, midBp, fabBL], fabricTexture, panelOpts);
        drawQuad(state, [midT2, tr, fabBR, midB2p], fabricTexture, panelOpts);
      } else {
        // Blockout, sunscreen and light filter share one quad and differ only
        // in transmission: 1.0 stops all light, 0.65 lets the diffused view
        // read through the mesh, 0.82 sits between them. The shader's own
        // per-type pass (u_blindType) adds the surface behaviour on top —
        // directional sheen, weave bands, or a warm centre bloom.
        drawQuad(state, [tl, tr, fabBR, fabBL], fabricTexture, {
          tint,
          textureAmount: FABRIC_TEXTURE_AMOUNT,
          opacity: FABRIC_OPACITY[type] ?? 1,
          uvScale,
          shade: true,
          folds: 0,
          shaderType: shaderTypeFor(type),
        });
      }

      ctx.drawImage(state.canvas, 0, 0);
    } else {
      // WebGL unavailable — flat-colour fallback so the preview still works
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tl[0], tl[1]);
      ctx.lineTo(tr[0], tr[1]);
      ctx.lineTo(fabBR[0], fabBR[1]);
      ctx.lineTo(fabBL[0], fabBL[1]);
      ctx.closePath();
      // Opacities come from the same table the WebGL path uses — blockout is
      // fully opaque so the selected colour renders as itself, not blended
      // with the darkened window opening underneath.
      ctx.fillStyle = rgba(fabricColor, FABRIC_OPACITY[type] ?? 1);
      ctx.fill();
      ctx.restore();
    }

    // --- FABRIC REALISM — centre light, then vertical weave lines on top ---
    drawFabricCentreLight(ctx, tl, tr, fabBL, fabBR);
    drawFabricFoldLines(ctx, tl, tr, fabBL, fabBR, avgW);
    if (type === 'sunscreen' || type === 'lightfilter') {
      drawTranslucentLightBleed(ctx, tl, tr, fabBR, fabBL);
    }

    // --- LIGHTING (post-fabric) ---
    drawLightSheen(ctx, fabricQuad);
    drawAmbientOcclusion(ctx, tl, tr, fabBR, fabBL);

    // --- LIGHT LEAK — warm daylight escaping the fabric's perimeter, at the
    // intensity this fabric's opacity implies. Drawn after the AO so the
    // glow sits over the shadow band at the edge, which is the real
    // relationship: the leak is in front of the recess, not behind it.
    drawLightLeak(ctx, type, tl, tr, fabBL, fabBR, avgW);
  } // end showBlind (depth + fabric)

  // --- CASSETTE + BRACKETS — always drawn (not gated on showBlind) since
  // the hardware itself is always present regardless of roll position. ---
  const cassetteHalfH = drawCassette(ctx, tl, tr, leftH, hardwareColourName, safeHardwareColor, avgW);
  drawSideBrackets(ctx, tl, tr, avgW, hardwareColourName, safeHardwareColor);

  // --- CASSETTE MOUNT SHADOW — the headrail casts a shadow onto the
  // fabric below it, like a physical bracket blocking light. ---
  if (showBlind) {
    drawCassetteMountShadow(ctx, tl, tr, fabBL, fabBR, cassetteHalfH, leftH, avgW);
  }

  // --- BOTTOM RAIL (Canvas 2D overlay) — rides the fabric bottom ---
  if (showBlind && type !== 'sheer') {
    const railHeight = leftH * RAIL_HEIGHT_RATIO;
    const railT = Math.max(0, p - railHeight / leftH);
    const railTL = leftEdge(railT);
    const railTR = rightEdge(railT);
    drawBottomRail(ctx, railTL, railTR, fabBL, fabBR, hardwareColourName, safeHardwareColor, avgW);

    // --- BOTTOM RAIL DROP SHADOW — the rail hangs in space; it casts a
    // shadow up onto the fabric directly behind it. ---
    drawRailDropShadow(ctx, tl, tr, railTL, railTR, leftH);
  }

  // --- CONTACT SHADOW — cast just below the rail, wherever the rail
  // currently sits. No roll-position threshold: now that it is anchored to
  // the rail rather than the sill it stays correct at every position, and
  // gating it caused a visible pop partway through the roll. ---
  if (showBlind) {
    drawContactShadow(ctx, fabBL, fabBR);
  }

  // --- CHAIN — not rendered. showChain/chainSide/controlType are kept as
  // valid params for API compatibility, but nothing is drawn.
  void chainSide;
  void showChain;
  void controlType;

  // --- VIGNETTE (perimeter stroke) — always last, grounds the frame ---
  if (showBlind) {
    drawVignette(ctx, fabricQuad);
  }
};

// ---------------------------------------------------------------------------
// Dual roller — two independent rollers sharing one cassette, which is how a
// real twin-roller is built. Back layer is the SUNSCREEN, sitting against the
// glass: translucent, so the view still reads through it. Front layer, on the
// room side, is the BLOCKOUT: opaque, in the selected fabric colour. Both
// were previously drawn with the same blockout texture at full opacity, so a
// dual looked like one thick sheet rather than two distinct fabrics.
//
// The blockout hangs proportionally shorter than the sunscreen so both are
// visible at once — being in front, at equal drop it would hide the
// sunscreen entirely.
// ---------------------------------------------------------------------------

const FRONT_LAYER_MAX_DROP = 0.7; // blockout stops short of the sunscreen, keeping both readable

/** Sunscreen back layer — translucent enough to read as a mesh with the view
 * behind it, matching the standalone sunscreen render path's opacity. */
const DUAL_BACK_OPACITY = 0.55;

const drawDualBlindArea = (
  ctx: CanvasRenderingContext2D,
  glStateRef: React.MutableRefObject<GLState | null>,
  glUnavailableRef: React.MutableRefObject<boolean>,
  W: number,
  H: number,
  params: AreaParams,
  fabricImgs: FabricImages,
  photo: CanvasImageSource
) => {
  const { corners, fabricColor, rollPosition = 1 } = params;
  const safeHardwareColor = params.hardwareColor ?? HARDWARE_FALLBACK;
  const hardwareColourName = params.hardwareColourName;

  const [tl, tr, br, bl] = corners;
  const topW = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
  const bottomW = Math.hypot(br[0] - bl[0], br[1] - bl[1]);
  const avgW = (topW + bottomW) / 2;
  const leftH = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);

  const leftEdge = (t: number): Point => [tl[0] + (bl[0] - tl[0]) * t, tl[1] + (bl[1] - tl[1]) * t];
  const rightEdge = (t: number): Point => [tr[0] + (br[0] - tr[0]) * t, tr[1] + (br[1] - tr[1]) * t];

  const p = Math.max(0, Math.min(1, rollPosition));
  // Both rollers ride the slider. The sunscreen follows it directly; the
  // blockout stays proportionally short of it so the pair reads at every
  // position and closes only when fully raised. (The back layer used to be
  // pinned at 1, which meant a dual could never be rolled up at all.)
  const backP = p;
  const frontP = p * FRONT_LAYER_MAX_DROP;
  const fabricDrop = leftH * backP;
  const showBlind = fabricDrop >= 1;

  const backBLEdge = leftEdge(backP);
  const backBREdge = rightEdge(backP);
  // Scoped to the back layer (the lower of the two), never the full window
  // quad — otherwise a raised dual blind shades and outlines empty glass.
  const fabricQuad: Point[] = [tl, tr, backBREdge, backBLEdge];

  // Diffusion before depth — it re-draws the untouched photo inside the quad,
  // so it has to run before anything else paints there. See drawBlindArea.
  if (showBlind) {
    drawBackgroundDiffusion(ctx, photo, fabricQuad, scaleToBlind(6, avgW));
    drawPreFabricDepth(ctx, fabricQuad);
  }

  /** Draws one roller's fabric quad plus its fold-line texture. The two
   * layers share the selected colour but not the fabric: `texturePath` and
   * `opacity` are what make the back read as sunscreen mesh and the front as
   * solid blockout. */
  const drawFabricLayer = (dropP: number, texturePath: string, opacity: number, shaderType: number) => {
    const layerBL = leftEdge(dropP);
    const layerBR = rightEdge(dropP);

    if (!glStateRef.current && !glUnavailableRef.current) {
      try {
        glStateRef.current = createGLState();
      } catch {
        glStateRef.current = null;
      }
      if (!glStateRef.current) glUnavailableRef.current = true;
    }
    const state = glStateRef.current;

    if (state) {
      const { gl } = state;
      if (state.canvas.width !== W || state.canvas.height !== H) {
        state.canvas.width = W;
        state.canvas.height = H;
      }
      gl.viewport(0, 0, W, H);
      gl.useProgram(state.program);
      gl.uniform2f(state.loc.resolution, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const fabricTexture = uploadTexture(state, fabricImgs, texturePath);
      const tint = hexToRgb(fabricColor);
      const uvScale: [number, number] = [2, clampUvScale((leftH * dropP) / avgW)];
      if (fabricTexture) {
        drawQuad(state, [tl, tr, layerBR, layerBL], fabricTexture, {
          tint, textureAmount: FABRIC_TEXTURE_AMOUNT, opacity, uvScale, shade: true, folds: 0, shaderType,
        });
        ctx.drawImage(state.canvas, 0, 0);
      }
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tl[0], tl[1]);
      ctx.lineTo(tr[0], tr[1]);
      ctx.lineTo(layerBR[0], layerBR[1]);
      ctx.lineTo(layerBL[0], layerBL[1]);
      ctx.closePath();
      ctx.fillStyle = rgba(fabricColor, opacity);
      ctx.fill();
      ctx.restore();
    }

    drawFabricFoldLines(ctx, tl, tr, layerBL, layerBR, avgW);
  };

  const backBL = backBLEdge;
  const backBR = backBREdge;
  const frontBL = leftEdge(frontP);
  const frontBR = rightEdge(frontP);

  if (showBlind) {
    // --- BACK LAYER — sunscreen against the glass, translucent. Drawn first
    // and hanging lower, so its exposed portion sits below the blockout. The
    // view behind it was diffused above, for the same reason a standalone
    // sunscreen's is: through a mesh it is a ghost, not a sharp image. ---
    drawFabricLayer(backP, DUAL_BACK_TEXTURE, DUAL_BACK_OPACITY, shaderTypeFor('sunscreen'));
    drawFabricCentreLight(ctx, tl, tr, backBL, backBR);
    // Light bleeding through the mesh, same treatment the standalone
    // sunscreen gets — this is what sells it as a screen rather than cloth.
    drawTranslucentLightBleed(ctx, tl, tr, backBR, backBL);

    // --- FRONT LAYER — blockout on the room side, opaque, drawn on top and
    // stopping short so the sunscreen stays visible beneath it. ---
    drawFabricLayer(frontP, DUAL_FRONT_TEXTURE, 1, shaderTypeFor('blockout'));
    drawFabricCentreLight(ctx, tl, tr, frontBL, frontBR);
  }

  const gapDepth = backP - frontP;

  // --- GAP LIGHT STRIP — where the blockout has ended and only the sunscreen
  // is covering the glass, more light reaches the room than anywhere else on
  // the blind. A warm strip immediately below the front rail is what makes
  // the two layers read as being at different depths rather than as one
  // printed sheet with a line across it. Drawn before the gap shadow so the
  // rail's own shadow falls across the near end of it.
  if (showBlind && gapDepth > 0.02) {
    const stripH = Math.min(scaleToBlind(14, avgW), leftH * gapDepth * 0.5);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(frontBL[0], frontBL[1], frontBL[0], frontBL[1] + stripH);
    g.addColorStop(0, 'rgba(255,245,200,0.35)');
    g.addColorStop(0.45, 'rgba(255,245,200,0.14)');
    g.addColorStop(1, 'rgba(255,245,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(frontBL[0], frontBL[1]);
    ctx.lineTo(frontBR[0], frontBR[1]);
    ctx.lineTo(frontBR[0], frontBR[1] + stripH);
    ctx.lineTo(frontBL[0], frontBL[1] + stripH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // --- FRONT LAYER CASTS ONTO BACK LAYER — the blockout hangs in front of
  // the sunscreen with real air between them, so its bottom edge throws a
  // shadow down onto the fabric behind. 20px, multi-pass, over the light
  // strip above so the strip is brightest a little below the rail rather
  // than hard against it. ---
  if (showBlind && gapDepth > 0.02) {
    const gapShadowH = Math.min(scaleToBlind(20, avgW), leftH * gapDepth * 0.6);
    ctx.save();
    multiPassShadow(3, gapShadowH, 0.15, (reach, alpha) => {
      const g = ctx.createLinearGradient(frontBL[0], frontBL[1], frontBL[0], frontBL[1] + reach);
      g.addColorStop(0, shadowRgba(alpha));
      g.addColorStop(1, shadowRgba(0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(frontBL[0], frontBL[1]);
      ctx.lineTo(frontBR[0], frontBR[1]);
      ctx.lineTo(frontBR[0], frontBR[1] + reach);
      ctx.lineTo(frontBL[0], frontBL[1] + reach);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  // --- LIGHTING — over the back layer, which is the lower of the two, so
  // the fabric-only AO band spans exactly the fabric that is showing ---
  if (showBlind) {
    drawLightSheen(ctx, fabricQuad);
    drawAmbientOcclusion(ctx, tl, tr, backBR, backBL);
  }

  // --- TWIN CASSETTES + BRACKETS — a dual roller carries two tubes, and
  // drawing one housing for both was the last thing making it read as a
  // single blind. The back tube is drawn first, slightly higher and behind;
  // the front sits 4px toward the room and overlaps it, so the pair reads as
  // two rollers on one bracket. Always drawn: the hardware stays put however
  // far the fabric is wound up. ---
  const { pv: cassettePv } = axesFor(tl, tr);
  const cassetteOffset = scaleToBlind(4, avgW);
  const backCassetteTL: Point = [tl[0] + cassettePv[0] * cassetteOffset, tl[1] + cassettePv[1] * cassetteOffset];
  const backCassetteTR: Point = [tr[0] + cassettePv[0] * cassetteOffset, tr[1] + cassettePv[1] * cassetteOffset];
  drawCassette(ctx, backCassetteTL, backCassetteTR, leftH * 0.85, hardwareColourName, safeHardwareColor, avgW);
  const cassetteHalfH = drawCassette(ctx, tl, tr, leftH, hardwareColourName, safeHardwareColor, avgW);
  drawSideBrackets(ctx, tl, tr, avgW, hardwareColourName, safeHardwareColor);

  if (showBlind) {
    drawCassetteMountShadow(ctx, tl, tr, frontBL, frontBR, cassetteHalfH, leftH, avgW);

    // --- RAILS — the front layer's rail sits higher; the back layer's rail
    // rides its own bottom edge. Both wind up with their layer. ---
    const railHeight = leftH * RAIL_HEIGHT_RATIO;
    const frontRailT = Math.max(0, frontP - railHeight / leftH);
    drawBottomRail(ctx, leftEdge(frontRailT), rightEdge(frontRailT), frontBL, frontBR, hardwareColourName, safeHardwareColor, avgW);
    drawRailDropShadow(ctx, tl, tr, leftEdge(frontRailT), rightEdge(frontRailT), leftH);

    const backRailT = Math.max(0, backP - railHeight / leftH);
    drawBottomRail(ctx, leftEdge(backRailT), rightEdge(backRailT), backBL, backBR, hardwareColourName, safeHardwareColor, avgW);
    drawContactShadow(ctx, backBL, backBR);

    drawVignette(ctx, fabricQuad);
  }
};

// ---------------------------------------------------------------------------
// Curtains — a track at the top instead of a roller tube, two full-height
// panels that slide apart from the centre, and S-fold pleat lines. No
// chain, no bottom rail. Reuses the same depth-shadow helpers as the roller
// path so curtains sit recessed in the frame just like a blind does.
// ---------------------------------------------------------------------------

const drawCurtainArea = (
  ctx: CanvasRenderingContext2D,
  glStateRef: React.MutableRefObject<GLState | null>,
  glUnavailableRef: React.MutableRefObject<boolean>,
  W: number,
  H: number,
  params: AreaParams,
  fabricImgs: FabricImages
) => {
  const { corners, blindType, fabricColor, rollPosition = 1 } = params;
  const safeHardwareColor = params.hardwareColor ?? HARDWARE_FALLBACK;
  const isSheer = blindType === 'sheer-curtains';

  const [tl, tr, br, bl] = corners;
  const topW = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
  const bottomW = Math.hypot(br[0] - bl[0], br[1] - bl[1]);
  const avgW = (topW + bottomW) / 2;
  const leftH = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);

  const topEdge = (t: number): Point => [
    tl[0] + (tr[0] - tl[0]) * t,
    tl[1] + (tr[1] - tl[1]) * t,
  ];
  const bottomEdge = (t: number): Point => [
    bl[0] + (br[0] - bl[0]) * t,
    bl[1] + (br[1] - bl[1]) * t,
  ];

  // Same slider convention as the roller: 0 = fully open, 1 = fully closed.
  // Curtains read it as how far apart the panels are, not how far down.
  const p = Math.max(0, Math.min(1, rollPosition));
  const openAmount = 1 - p;

  // --- DEPTH (pre-fabric) ---
  drawPreFabricDepth(ctx, corners);

  // Each panel's width as a fraction of the top/bottom edge — half the
  // window when closed (panels meet at the centre), shrinking to a thin
  // strip at the side edges as openAmount grows.
  const panelFrac = 0.5 * (1 - openAmount * 0.85);
  const leftPanelQuad: Point[] = [tl, topEdge(panelFrac), bottomEdge(panelFrac), bl];
  const rightPanelQuad: Point[] = [topEdge(1 - panelFrac), tr, br, bottomEdge(1 - panelFrac)];
  const panelW = avgW * panelFrac;

  // --- PANELS via WebGL (perspective-correct texture mapping) ---
  if (!glStateRef.current && !glUnavailableRef.current) {
    try {
      glStateRef.current = createGLState();
    } catch {
      glStateRef.current = null;
    }
    if (!glStateRef.current) glUnavailableRef.current = true;
  }
  const state = glStateRef.current;

  if (state) {
    const { gl } = state;
    if (state.canvas.width !== W || state.canvas.height !== H) {
      state.canvas.width = W;
      state.canvas.height = H;
    }
    gl.viewport(0, 0, W, H);
    gl.useProgram(state.program);
    gl.uniform2f(state.loc.resolution, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const texKey = textureKeyFor(blindType, fabricColor);
    const fabricTexture = uploadTexture(state, fabricImgs, getTexturePath(texKey));
    const tint = hexToRgb(fabricColor);
    if (!fabricTexture) return;
    const panelOpts: QuadOptions = {
      tint,
      textureAmount: FABRIC_TEXTURE_AMOUNT,
      opacity: isSheer ? 0.4 : 1,
      uvScale: [1, leftH / Math.max(1, panelW)],
      shade: true,
      folds: 0, // fold lines are drawn separately below, over the composited fabric
    };
    drawQuad(state, leftPanelQuad, fabricTexture, panelOpts);
    drawQuad(state, rightPanelQuad, fabricTexture, panelOpts);

    ctx.drawImage(state.canvas, 0, 0);
  } else {
    // WebGL unavailable — flat-colour fallback so the preview still works
    ctx.save();
    ctx.fillStyle = rgba(fabricColor, isSheer ? 0.4 : 1);
    for (const quad of [leftPanelQuad, rightPanelQuad]) {
      const [a, b, c, d] = quad;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(d[0], d[1]);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // --- FOLDS (S-Fold visual) — soft vertical wave lines down each panel ---
  ctx.save();
  ctx.strokeStyle = shadowRgba(0.08);
  ctx.lineWidth = 1.5;
  for (const quad of [leftPanelQuad, rightPanelQuad]) {
    const [qtl, qtr, qbr, qbl] = quad;
    const foldCount = 5;
    for (let i = 1; i < foldCount; i++) {
      const t = i / foldCount;
      const top: Point = [qtl[0] + (qtr[0] - qtl[0]) * t, qtl[1] + (qtr[1] - qtl[1]) * t];
      const bottom: Point = [qbl[0] + (qbr[0] - qbl[0]) * t, qbl[1] + (qbr[1] - qbl[1]) * t];
      const midX = (top[0] + bottom[0]) / 2 + (i % 2 === 0 ? 1 : -1) * avgW * 0.01;
      const midY = (top[1] + bottom[1]) / 2;
      ctx.beginPath();
      ctx.moveTo(top[0], top[1]);
      ctx.quadraticCurveTo(midX, midY, bottom[0], bottom[1]);
      ctx.stroke();
    }
  }
  ctx.restore();

  // --- LIGHTING (post-fabric) ---
  drawLightSheen(ctx, corners);
  drawAmbientOcclusion(ctx, tl, tr, br, bl);

  // --- TRACK — thin solid bar at the very top, hardware colour. Unlike the
  // roller tube it never grows: tracks don't accumulate fabric. ---
  const trackHeight = leftH * 0.015;
  ctx.save();
  const tg = ctx.createLinearGradient(tl[0], tl[1] - trackHeight, tl[0], tl[1] + trackHeight);
  tg.addColorStop(0, lighten(safeHardwareColor, 30));
  tg.addColorStop(0.5, safeHardwareColor);
  tg.addColorStop(1, darken(safeHardwareColor, 25));
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1] - trackHeight);
  ctx.lineTo(tr[0], tr[1] - trackHeight);
  ctx.lineTo(tr[0], tr[1] + trackHeight);
  ctx.lineTo(tl[0], tl[1] + trackHeight);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // No chain, no bottom rail (and so no contact shadow) for curtains.
  drawVignette(ctx, corners);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const buildAreaParams = (area: RenderedArea, rollPosition: number): AreaParams => ({
  corners: area.corners,
  blindType: area.blindType,
  fabricColor: area.fabricColor,
  hardwareColor: area.hardwareColor,
  hardwareColourName: area.hardwareColourName,
  controlType: area.controlType,
  showChain: area.showChain,
  rollPosition,
  baseRailShape: 'd-shape',
  chainSide: 'right',
});

const Canvas2DBlindRenderer: React.FC<Props> = ({
  photoUrl,
  tracedAreas,
  activeAreaId,
  rollPosition = 1,
  compareMode = false,
  compareDivider = 0.5,
  compareBlindType,
  compareFabricColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glStateRef = useRef<GLState | null>(null);
  const glUnavailableRef = useRef(false);

  useEffect(() => {
    const state = glStateRef.current;
    return () => {
      if (state) {
        state.gl.getExtension('WEBGL_lose_context')?.loseContext();
        glStateRef.current = null;
      }
    };
  }, []);

  // Warm the roller textures so changing blind type never waits on a decode.
  // The render effect already awaits what it needs before touching the canvas
  // — so a cold swap holds the previous frame rather than flashing blank — but
  // these are multi-megabyte PNGs and a frozen frame for a second reads as the
  // control being broken. Pulling them through the same imageCache the
  // renderer uses makes the swap a cache hit.
  //
  // Deferred to idle rather than fired on mount. The three textures total
  // ~9MB, and starting all of them immediately would contend with the window
  // photo and the page's own assets for bandwidth — making the FIRST render
  // slower in order to make a LATER swap faster, which is the wrong trade on
  // a mobile connection. By the time the visitor reaches for the type control
  // the browser has long been idle.
  //
  // Failures are ignored on purpose: this is a warm-up, and the render path
  // does its own loading and error handling.
  useEffect(() => {
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      for (const path of ALL_ROLLER_TEXTURES) {
        loadImage(path).catch(() => {});
      }
    };

    // requestIdleCallback is unavailable in Safari; a timeout is the standard
    // stand-in and is late enough to be past first paint either way.
    const ric = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    });
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;
    if (typeof ric.requestIdleCallback === 'function') {
      idleHandle = ric.requestIdleCallback(warm, { timeout: 4000 });
    } else {
      timeoutHandle = window.setTimeout(warm, 1500);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== undefined) ric.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    };
  }, []);

  // Serialized so the effect only re-runs when the actual area data changes,
  // not on every parent re-render (tracedAreas is typically a fresh array
  // reference from the caller on most renders).
  const tracedAreasKey = JSON.stringify(tracedAreas);

  useEffect(() => {
    if (!photoUrl) return;

    // Guards against a slower earlier render finishing after a newer prop
    // change and overwriting the canvas with stale content.
    let cancelled = false;

    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // At most one area is ever unconfirmed at a time — the one currently
      // being traced (activeAreaId). Everything else is confirmed and gets
      // its blind rendered; the active one gets a dashed outline instead.
      const confirmedAreas = tracedAreas.filter(a => a.id !== activeAreaId && a.corners.length >= 4);
      const activeArea = activeAreaId ? tracedAreas.find(a => a.id === activeAreaId) : undefined;

      // Collected as texture PATHS rather than blind types, because a single
      // blind type can need more than one texture — a dual roller draws a
      // blockout over a sunscreen.
      const uniquePaths = Array.from(new Set([
        ...confirmedAreas.flatMap(a => texturePathsFor(a.blindType, a.fabricColor)),
        ...(compareMode && compareBlindType
          // The colour only matters for curtains, where it picks a light vs
          // dark texture base; warm white keeps that on the light variant.
          ? texturePathsFor(compareBlindType, compareFabricColor ?? tokens.warmWhite)
          : []),
      ]));

      const [photo, fabricEntries] = await Promise.all([
        loadImage(photoUrl),
        Promise.all(uniquePaths.map(async path => [path, await loadImage(path)] as const)),
      ]);
      if (cancelled) return;

      const fabricImgs: FabricImages = new Map(fabricEntries);

      const W = photo.naturalWidth;
      const H = photo.naturalHeight;
      canvas.width = W;
      canvas.height = H;
      ctx.drawImage(photo, 0, 0);

      if (!compareMode) {
        for (const area of confirmedAreas) {
          drawBlindArea(ctx, glStateRef, glUnavailableRef, W, H, buildAreaParams(area, rollPosition), fabricImgs, photo);
        }
      } else {
        // Every confirmed area splits across the same shared divider.
        const divider = Math.max(0, Math.min(1, compareDivider));

        for (const area of confirmedAreas) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, W * divider, H);
          ctx.clip();
          drawBlindArea(ctx, glStateRef, glUnavailableRef, W, H, buildAreaParams(area, rollPosition), fabricImgs, photo);
          ctx.restore();

          const compareParams: AreaParams = {
            ...buildAreaParams(area, rollPosition),
            blindType: compareBlindType ?? area.blindType,
            fabricColor: compareFabricColor ?? area.fabricColor,
          };
          ctx.save();
          ctx.beginPath();
          ctx.rect(W * divider, 0, W, H);
          ctx.clip();
          drawBlindArea(ctx, glStateRef, glUnavailableRef, W, H, compareParams, fabricImgs, photo);
          ctx.restore();
        }

        // One shared divider line + labels spanning the whole canvas.
        const divX = W * divider;
        ctx.save();
        ctx.shadowColor = shadowRgba(0.3);
        ctx.shadowBlur = 6;
        ctx.strokeStyle = tokens.onDark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(divX, 0);
        ctx.lineTo(divX, H);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = tokens.scrim;
        ctx.fillRect(divX - 60, 12, 54, 22);
        ctx.fillRect(divX + 6, 12, 54, 22);
        ctx.fillStyle = tokens.onDark;
        // Inter, matching the rest of the UI — this label was set in DM Sans,
        // which isn't one of the two brand faces and isn't loaded, so it was
        // silently falling back to the system sans.
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('Primary', divX - 56, 27);
        ctx.fillText('Compare', divX + 10, 27);
      }

      // Active area (being traced) — subtle dashed teal outline, no fabric.
      if (activeArea && activeArea.corners.length >= 4) {
        const [tl, tr, br, bl] = activeArea.corners;
        ctx.save();
        ctx.setLineDash([10, 6]);
        ctx.strokeStyle = rgba(tokens.traceTeal, 0.9);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tl[0], tl[1]);
        ctx.lineTo(tr[0], tr[1]);
        ctx.lineTo(br[0], br[1]);
        ctx.lineTo(bl[0], bl[1]);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Confirmed-but-not-active areas — small static reference dots, only
      // while some other area is actively being traced.
      if (activeAreaId) {
        ctx.save();
        ctx.fillStyle = tokens.traceTeal;
        for (const area of confirmedAreas) {
          for (const [x, y] of area.corners) {
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }
    };

    render().catch(() => {
      /* image failed to load — leave the previous frame in place */
    });

    return () => {
      cancelled = true;
    };
    // Intentionally limited deps: only these inputs change what's worth
    // repainting. tracedAreasKey stands in for tracedAreas (see comment above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl, tracedAreasKey, activeAreaId, rollPosition, compareMode, compareDivider, compareBlindType, compareFabricColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
      }}
    />
  );
};

export default Canvas2DBlindRenderer;
