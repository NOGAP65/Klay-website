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
// Textures — real fabric photos in public/textures/, tinted in the shader
// ---------------------------------------------------------------------------

const getTexturePath = (blindType: string): string => {
  switch (blindType) {
    case 'blockout': return '/textures/blockout_charcoal.jpg';
    case 'sunscreen': return '/textures/sunscreen_white.jpg';
    // No dedicated Light Filter photo yet — reuses the sunscreen weave at a
    // higher opacity (see drawBlindArea) to sit visually between sunscreen and blockout.
    case 'lightfilter': return '/textures/sunscreen_white.jpg';
    case 'dual': return '/textures/blockout_charcoal.jpg';
    case 'sheer':
    case 'sheer-curtains': return '/textures/sheer_fabric.jpg';
    case 'blockout-curtains-light': return '/textures/blockout_white.jpg';
    case 'blockout-curtains-dark': return '/textures/blockout_charcoal.jpg';
    default: return '/textures/blockout_charcoal.jpg';
  }
};

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
  vec3 col = u_tintColor.rgb * (1.0 + detail * u_textureAmount);

  // Soft vertical fold ripples for sheer fabric
  if (u_folds > 0.5) {
    col *= 1.0 + 0.06 * sin(uv.x * u_folds * 6.2831853);
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
  };
  textures: Map<string, FabricTexture>;
}

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
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fill();
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
  lightGrad.addColorStop(1, 'rgba(0,0,0,0.04)');
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
  const depthFrac = Math.min(0.45, 24 / Math.max(1, topW)); // 24px, capped so it can't eat a very narrow trace

  const lerp = (a: Point, b: Point, t: number): Point => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];

  const fillBand = (outerA: Point, outerB: Point, innerB: Point, innerA: Point) => {
    const grad = ctx.createLinearGradient(outerA[0], outerA[1], innerA[0], innerA[1]);
    grad.addColorStop(0, 'rgba(0,0,0,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
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

/** Perimeter stroke around the quad, grounding the fabric in the frame. */
const drawVignette = (ctx: CanvasRenderingContext2D, corners: Point[]) => {
  const [tl, tr, br, bl] = corners;
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.36)';
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
  const shadowHeight = 8; // px, fixed — a soft downward fade below the rail
  const shadowTL = fabBL;
  const shadowTR = fabBR;
  const shadowBL: Point = [fabBL[0], fabBL[1] + shadowHeight];
  const shadowBR: Point = [fabBR[0], fabBR[1] + shadowHeight];

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(shadowTL[0], shadowTL[1]);
  ctx.lineTo(shadowTR[0], shadowTR[1]);
  ctx.lineTo(shadowBR[0], shadowBR[1]);
  ctx.lineTo(shadowBL[0], shadowBL[1]);
  ctx.closePath();

  const shadowGrad = ctx.createLinearGradient(shadowTL[0], shadowTL[1], shadowBL[0], shadowBL[1]);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.15)');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadowGrad;
  ctx.fill();
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
    foldGrad.addColorStop(0, 'rgba(0,0,0,0)');
    foldGrad.addColorStop(0.5, `rgba(0,0,0,${lineAlpha})`);
    foldGrad.addColorStop(1, 'rgba(0,0,0,0)');

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
  fabricLightGrad.addColorStop(0, 'rgba(0,0,0,0.06)');
  fabricLightGrad.addColorStop(0.2, 'rgba(0,0,0,0)');
  fabricLightGrad.addColorStop(0.5, 'rgba(255,255,255,0.04)');
  fabricLightGrad.addColorStop(0.8, 'rgba(0,0,0,0)');
  fabricLightGrad.addColorStop(1, 'rgba(0,0,0,0.06)');
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
  const mountShadowH = leftH * 0.045;
  ctx.save();
  const mountShadow = ctx.createLinearGradient(
    tl[0], tl[1] + tubeHeight,
    tl[0], tl[1] + tubeHeight + mountShadowH
  );
  mountShadow.addColorStop(0, 'rgba(0,0,0,0.22)');
  mountShadow.addColorStop(0.4, 'rgba(0,0,0,0.08)');
  mountShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = mountShadow;

  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(fabBR[0], fabBR[1]);
  ctx.lineTo(fabBL[0], fabBL[1]);
  ctx.closePath();
  ctx.clip();

  ctx.fillRect(
    tl[0] - avgW * 0.02,
    tl[1] + tubeHeight,
    avgW * 1.04,
    mountShadowH
  );
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
  const railShadowH = leftH * 0.025;
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

  const upperShadow = ctx.createLinearGradient(
    railTL[0], railTL[1],
    railTL[0], railTL[1] - railShadowH
  );
  upperShadow.addColorStop(0, 'rgba(0,0,0,0.18)');
  upperShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = upperShadow;
  ctx.beginPath();
  ctx.moveTo(railTL[0], railTL[1]);
  ctx.lineTo(railTR[0], railTR[1]);
  ctx.lineTo(railTR[0], railTR[1] - railShadowH);
  ctx.lineTo(railTL[0], railTL[1] - railShadowH);
  ctx.closePath();
  ctx.fill();
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

/** Cylinder fill: 15% lighter at the top, 15% darker at the bottom, so a
 * tube reads as round rather than as a flat bar. Previously only chrome got
 * any gradient at all, which is why white and black cassettes looked like
 * boxes. Chrome keeps its own 3-stop metallic ramp — it already implies a
 * curved surface and doubling up on it turns it muddy. */
const setCylinderFill = (
  ctx: CanvasRenderingContext2D,
  hardwareColourName: 'white' | 'black' | 'chrome' | undefined,
  safeHardwareColor: string,
  gradFrom: Point,
  gradTo: Point
) => {
  if (hardwareColourName === 'chrome') {
    setHardwareFill(ctx, hardwareColourName, safeHardwareColor, gradFrom, gradTo);
    return;
  }
  const base = hardwareBaseHex(hardwareColourName, safeHardwareColor);
  const grad = ctx.createLinearGradient(gradFrom[0], gradFrom[1], gradTo[0], gradTo[1]);
  grad.addColorStop(0, shadeHex(base, 0.15));
  grad.addColorStop(0.45, base);
  grad.addColorStop(1, shadeHex(base, -0.15));
  ctx.fillStyle = grad;
};

const CASSETTE_HEIGHT_RATIO = 0.04; // ~4% of blind height — slim, not a thick bar
const RAIL_HEIGHT_RATIO = 0.02; // ~2% of blind height — half the cassette

/** Builds the outline of a horizontal tube between two points: a straight
 * body with a semicircular cap at each end, in the quad's own coordinate
 * frame so it stays correct when the traced window is slightly rotated.
 *
 * `u` runs along the tube, `pv` is its perpendicular. The caps are drawn with
 * arc-to-arc quadratics rather than ctx.arc, since the tube is not necessarily
 * axis-aligned and ctx.arc cannot be rotated without a transform. */
const tracePill = (
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  halfH: number,
  u: Point,
  pv: Point,
) => {
  const [ux, uy] = u;
  const [px, py] = pv;
  // Cap control-point reach — 4/3 · tan(π/8) approximates a semicircle with
  // two quadratics closely enough at this scale.
  const k = halfH * 1.3333;

  const aTop: Point = [a[0] + px * halfH, a[1] + py * halfH];
  const aBot: Point = [a[0] - px * halfH, a[1] - py * halfH];
  const bTop: Point = [b[0] + px * halfH, b[1] + py * halfH];
  const bBot: Point = [b[0] - px * halfH, b[1] - py * halfH];

  ctx.beginPath();
  ctx.moveTo(aTop[0], aTop[1]);
  ctx.lineTo(bTop[0], bTop[1]);
  // Right cap, top -> bottom, bulging outward along +u
  ctx.bezierCurveTo(
    bTop[0] + ux * k, bTop[1] + uy * k,
    bBot[0] + ux * k, bBot[1] + uy * k,
    bBot[0], bBot[1],
  );
  ctx.lineTo(aBot[0], aBot[1]);
  // Left cap, bottom -> top, bulging outward along -u
  ctx.bezierCurveTo(
    aBot[0] - ux * k, aBot[1] - uy * k,
    aTop[0] - ux * k, aTop[1] - uy * k,
    aTop[0], aTop[1],
  );
  ctx.closePath();
};

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
const drawCassette = (
  ctx: CanvasRenderingContext2D,
  tl: Point,
  tr: Point,
  leftH: number,
  hardwareColourName: 'white' | 'black' | 'chrome' | undefined,
  safeHardwareColor: string
): number => {
  const halfH = (leftH * CASSETTE_HEIGHT_RATIO) / 2;
  const { u, pv } = axesFor(tl, tr);
  const top: Point = [tl[0] + pv[0] * halfH, tl[1] + pv[1] * halfH];
  const bot: Point = [tl[0] - pv[0] * halfH, tl[1] - pv[1] * halfH];

  ctx.save();

  // --- Body: pill outline, cylinder gradient ---
  tracePill(ctx, tl, tr, halfH, u, pv);
  setCylinderFill(ctx, hardwareColourName, safeHardwareColor, top, bot);
  ctx.fill();

  // Clip subsequent strokes to the tube so the caps stay clean.
  tracePill(ctx, tl, tr, halfH, u, pv);
  ctx.clip();

  // --- Top highlight: 2px arc at 25% white, just inside the crown ---
  const hi = halfH * 0.62;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tl[0] + pv[0] * hi, tl[1] + pv[1] * hi);
  ctx.lineTo(tr[0] + pv[0] * hi, tr[1] + pv[1] * hi);
  ctx.stroke();

  // --- Bottom shadow: 2px at 35% black, separating tube from fabric ---
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tl[0] - pv[0] * hi, tl[1] - pv[1] * hi);
  ctx.lineTo(tr[0] - pv[0] * hi, tr[1] - pv[1] * hi);
  ctx.stroke();

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
  safeHardwareColor: string
) => {
  const { u, pv } = axesFor(railTL, railTR);
  // Centreline between the rail's top and the fabric's bottom edge, so the
  // tube sits exactly in the band the caller allocated for it.
  const midL: Point = [(railTL[0] + fabBL[0]) / 2, (railTL[1] + fabBL[1]) / 2];
  const midR: Point = [(railTR[0] + fabBR[0]) / 2, (railTR[1] + fabBR[1]) / 2];
  const halfH = Math.max(1, Math.hypot(fabBL[0] - railTL[0], fabBL[1] - railTL[1]) / 2);
  const base = hardwareBaseHex(hardwareColourName, safeHardwareColor);

  ctx.save();

  // --- UNDERSIDE SHADOW — 10px, black 18% -> transparent, below the rail.
  // Drawn before the rail so the rail's own edge stays crisp on top of it.
  const underH = 10;
  const uTL: Point = [fabBL[0], fabBL[1]];
  const uTR: Point = [fabBR[0], fabBR[1]];
  const uBL: Point = [fabBL[0] - pv[0] * underH, fabBL[1] - pv[1] * underH];
  const uBR: Point = [fabBR[0] - pv[0] * underH, fabBR[1] - pv[1] * underH];
  ctx.beginPath();
  ctx.moveTo(uTL[0], uTL[1]);
  ctx.lineTo(uTR[0], uTR[1]);
  ctx.lineTo(uBR[0], uBR[1]);
  ctx.lineTo(uBL[0], uBL[1]);
  ctx.closePath();
  const underGrad = ctx.createLinearGradient(uTL[0], uTL[1], uBL[0], uBL[1]);
  underGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
  underGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = underGrad;
  ctx.fill();

  // --- BODY: pill outline, same top-light / bottom-dark ramp as the cassette
  const top: Point = [midL[0] + pv[0] * halfH, midL[1] + pv[1] * halfH];
  const bot: Point = [midL[0] - pv[0] * halfH, midL[1] - pv[1] * halfH];
  tracePill(ctx, midL, midR, halfH, u, pv);
  setCylinderFill(ctx, hardwareColourName, safeHardwareColor, top, bot);
  ctx.fill();

  // --- END CAPS: 3px each side, slightly darker than the face
  ctx.save();
  tracePill(ctx, midL, midR, halfH, u, pv);
  ctx.clip();
  ctx.fillStyle = shadeHex(base, -0.18);
  const capW = 3;
  [
    [midL, 1] as const,  // left cap extends inward along +u
    [midR, -1] as const, // right cap extends inward along -u
  ].forEach(([end, dir]) => {
    const e0: Point = [end[0] + pv[0] * halfH, end[1] + pv[1] * halfH];
    const e1: Point = [end[0] - pv[0] * halfH, end[1] - pv[1] * halfH];
    const e2: Point = [e1[0] + u[0] * capW * dir, e1[1] + u[1] * capW * dir];
    const e3: Point = [e0[0] + u[0] * capW * dir, e0[1] + u[1] * capW * dir];
    ctx.beginPath();
    ctx.moveTo(e0[0], e0[1]);
    ctx.lineTo(e1[0], e1[1]);
    ctx.lineTo(e2[0], e2[1]);
    ctx.lineTo(e3[0], e3[1]);
    ctx.closePath();
    ctx.fill();
  });

  // Top highlight, inside the clip so it stops at the caps
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
  // Proportional to the blind, and clamped so a very wide or very narrow
  // window still gets a bracket that reads as hardware rather than as a slab
  // or a speck.
  const plateW = Math.max(4, Math.min(14, avgW * 0.022));
  const plateH = plateW * 2.1; // vertical wall plate — taller than deep
  const armH = plateH * 0.44;  // horizontal arm — the part under the cassette

  const { u, pv } = axesFor(tl, tr);
  const [ux, uy] = u;
  const [px, py] = pv;
  const base = hardwareBaseHex(hardwareColourName, safeHardwareColor);

  /** One L-bracket. `dir` is +1 for the right end (arm projects inward, i.e.
   * along -u) and -1 for the left. The vertical plate sits against the wall
   * just outside the blind; the arm runs inward beneath the cassette. */
  const drawOne = (anchor: Point, dir: 1 | -1) => {
    // Plate spans the full height, sitting outboard of the cassette end.
    const pOuter: Point = [anchor[0] + ux * plateW * dir, anchor[1] + uy * plateW * dir];
    const plate: [Point, Point, Point, Point] = [
      [anchor[0] + px * (plateH / 2), anchor[1] + py * (plateH / 2)],
      [pOuter[0] + px * (plateH / 2), pOuter[1] + py * (plateH / 2)],
      [pOuter[0] - px * (plateH / 2), pOuter[1] - py * (plateH / 2)],
      [anchor[0] - px * (plateH / 2), anchor[1] - py * (plateH / 2)],
    ];

    ctx.save();

    // --- CAST SHADOW — offset outboard and down, so the bracket sits off the
    // wall rather than being painted onto it.
    ctx.save();
    ctx.translate(ux * 2 * dir - px * 2, uy * 2 * dir - py * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.moveTo(plate[0][0], plate[0][1]);
    ctx.lineTo(plate[1][0], plate[1][1]);
    ctx.lineTo(plate[2][0], plate[2][1]);
    ctx.lineTo(plate[3][0], plate[3][1]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // --- VERTICAL PLATE against the wall — multiply 0.7, so the recessed
    // face reads as shaded rather than lit.
    ctx.fillStyle = shadeHex(base, -0.3);
    ctx.beginPath();
    ctx.moveTo(plate[0][0], plate[0][1]);
    ctx.lineTo(plate[1][0], plate[1][1]);
    ctx.lineTo(plate[2][0], plate[2][1]);
    ctx.lineTo(plate[3][0], plate[3][1]);
    ctx.closePath();
    ctx.fill();

    // --- HORIZONTAL ARM projecting forward, under the cassette — base colour
    const armInner: Point = [anchor[0] - ux * plateW * 1.5 * dir, anchor[1] - uy * plateW * 1.5 * dir];
    const arm: [Point, Point, Point, Point] = [
      [anchor[0] + px * (armH / 2), anchor[1] + py * (armH / 2)],
      [armInner[0] + px * (armH / 2), armInner[1] + py * (armH / 2)],
      [armInner[0] - px * (armH / 2), armInner[1] - py * (armH / 2)],
      [anchor[0] - px * (armH / 2), anchor[1] - py * (armH / 2)],
    ];
    setHardwareFill(ctx, hardwareColourName, safeHardwareColor, arm[0], arm[3]);
    ctx.beginPath();
    ctx.moveTo(arm[0][0], arm[0][1]);
    ctx.lineTo(arm[1][0], arm[1][1]);
    ctx.lineTo(arm[2][0], arm[2][1]);
    ctx.lineTo(arm[3][0], arm[3][1]);
    ctx.closePath();
    ctx.fill();

    // Top highlight along the arm — the lit upper surface
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(arm[0][0], arm[0][1]);
    ctx.lineTo(arm[1][0], arm[1][1]);
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
  fabricImgs: FabricImages
) => {
  const { blindType } = params;
  if (blindType === 'sheer-curtains' || blindType === 'blockout-curtains') {
    drawCurtainArea(ctx, glStateRef, glUnavailableRef, W, H, params, fabricImgs);
    return;
  }
  if (blindType === 'dual') {
    drawDualBlindArea(ctx, glStateRef, glUnavailableRef, W, H, params, fabricImgs);
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
      } else if (type === 'sunscreen') {
        // Semi-transparent so the view survives behind the mesh
        drawQuad(state, [tl, tr, fabBR, fabBL], fabricTexture, {
          tint,
          textureAmount: FABRIC_TEXTURE_AMOUNT,
          opacity: 0.55,
          uvScale,
          shade: true,
          folds: 0,
        });
      } else if (type === 'lightfilter') {
        // Light Filter sits between sunscreen and blockout — softens light
        // without fully blocking it, so it's more opaque than sunscreen.
        drawQuad(state, [tl, tr, fabBR, fabBL], fabricTexture, {
          tint,
          textureAmount: FABRIC_TEXTURE_AMOUNT,
          opacity: 0.78,
          uvScale,
          shade: true,
          folds: 0,
        });
      } else {
        // Blockout — solid fabric, one continuous piece top to bottom
        drawQuad(state, [tl, tr, fabBR, fabBL], fabricTexture, {
          tint,
          textureAmount: FABRIC_TEXTURE_AMOUNT,
          opacity: 1,
          uvScale,
          shade: true,
          folds: 0,
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
      // Opacities mirror the WebGL path's exactly — blockout is fully opaque
      // so the selected colour renders as itself, not blended with the
      // darkened window opening underneath.
      ctx.fillStyle = rgba(fabricColor, type === 'sunscreen' ? 0.55 : type === 'sheer' ? 0.4 : type === 'lightfilter' ? 0.78 : 1);
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
  } // end showBlind (depth + fabric)

  // --- CASSETTE + BRACKETS — always drawn (not gated on showBlind) since
  // the hardware itself is always present regardless of roll position. ---
  const cassetteHalfH = drawCassette(ctx, tl, tr, leftH, hardwareColourName, safeHardwareColor);
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
    drawBottomRail(ctx, railTL, railTR, fabBL, fabBR, hardwareColourName, safeHardwareColor);

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
  fabricImgs: FabricImages
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

  if (showBlind) drawPreFabricDepth(ctx, fabricQuad);

  /** Draws one roller's fabric quad plus its fold-line texture. The two
   * layers share the selected colour but not the fabric: `texturePath` and
   * `opacity` are what make the back read as sunscreen mesh and the front as
   * solid blockout. */
  const drawFabricLayer = (dropP: number, texturePath: string, opacity: number) => {
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
          tint, textureAmount: FABRIC_TEXTURE_AMOUNT, opacity, uvScale, shade: true, folds: 0,
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
    // and hanging lower, so its exposed portion sits below the blockout. ---
    drawFabricLayer(backP, DUAL_BACK_TEXTURE, DUAL_BACK_OPACITY);
    drawFabricCentreLight(ctx, tl, tr, backBL, backBR);
    // Light bleeding through the mesh, same treatment the standalone
    // sunscreen gets — this is what sells it as a screen rather than cloth.
    drawTranslucentLightBleed(ctx, tl, tr, backBR, backBL);

    // --- FRONT LAYER — blockout on the room side, opaque, drawn on top and
    // stopping short so the sunscreen stays visible beneath it. ---
    drawFabricLayer(frontP, DUAL_FRONT_TEXTURE, 1);
    drawFabricCentreLight(ctx, tl, tr, frontBL, frontBR);
  }

  // --- GAP SHADOW — the front rail (drawn below) sits above the exposed
  // back-layer fabric; cast a small soft shadow onto it. ---
  const gapDepth = backP - frontP;
  if (showBlind && gapDepth > 0.02) {
    const gapShadowH = Math.min(10, leftH * gapDepth * 0.25);
    ctx.save();
    const gapGrad = ctx.createLinearGradient(frontBL[0], frontBL[1], frontBL[0], frontBL[1] + gapShadowH);
    gapGrad.addColorStop(0, 'rgba(0,0,0,0.22)');
    gapGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gapGrad;
    ctx.beginPath();
    ctx.moveTo(frontBL[0], frontBL[1]);
    ctx.lineTo(frontBR[0], frontBR[1]);
    ctx.lineTo(frontBR[0], frontBR[1] + gapShadowH);
    ctx.lineTo(frontBL[0], frontBL[1] + gapShadowH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // --- LIGHTING — over the back layer, which is the lower of the two, so
  // the fabric-only AO band spans exactly the fabric that is showing ---
  if (showBlind) {
    drawLightSheen(ctx, fabricQuad);
    drawAmbientOcclusion(ctx, tl, tr, backBR, backBL);
  }

  // --- SHARED CASSETTE + BRACKETS — one housing for both rollers. Always
  // drawn: the hardware stays put however far the fabric is wound up. ---
  const cassetteHalfH = drawCassette(ctx, tl, tr, leftH, hardwareColourName, safeHardwareColor);
  drawSideBrackets(ctx, tl, tr, avgW, hardwareColourName, safeHardwareColor);

  if (showBlind) {
    drawCassetteMountShadow(ctx, tl, tr, frontBL, frontBR, cassetteHalfH, leftH, avgW);

    // --- RAILS — the front layer's rail sits higher; the back layer's rail
    // rides its own bottom edge. Both wind up with their layer. ---
    const railHeight = leftH * RAIL_HEIGHT_RATIO;
    const frontRailT = Math.max(0, frontP - railHeight / leftH);
    drawBottomRail(ctx, leftEdge(frontRailT), rightEdge(frontRailT), frontBL, frontBR, hardwareColourName, safeHardwareColor);
    drawRailDropShadow(ctx, tl, tr, leftEdge(frontRailT), rightEdge(frontRailT), leftH);

    const backRailT = Math.max(0, backP - railHeight / leftH);
    drawBottomRail(ctx, leftEdge(backRailT), rightEdge(backRailT), backBL, backBR, hardwareColourName, safeHardwareColor);
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
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
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
          drawBlindArea(ctx, glStateRef, glUnavailableRef, W, H, buildAreaParams(area, rollPosition), fabricImgs);
        }
      } else {
        // Every confirmed area splits across the same shared divider.
        const divider = Math.max(0, Math.min(1, compareDivider));

        for (const area of confirmedAreas) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, W * divider, H);
          ctx.clip();
          drawBlindArea(ctx, glStateRef, glUnavailableRef, W, H, buildAreaParams(area, rollPosition), fabricImgs);
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
          drawBlindArea(ctx, glStateRef, glUnavailableRef, W, H, compareParams, fabricImgs);
          ctx.restore();
        }

        // One shared divider line + labels spanning the whole canvas.
        const divX = W * divider;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
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
