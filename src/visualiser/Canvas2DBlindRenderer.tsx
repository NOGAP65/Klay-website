import React, { useEffect, useRef } from 'react';
import { computeHomography, toColumnMajor, Point } from './homography';

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
    case 'dual': return '/textures/blockout_charcoal.jpg';
    case 'sheer':
    case 'sheer-curtains': return '/textures/sheer_fabric.jpg';
    case 'blockout-curtains-light': return '/textures/blockout_white.jpg';
    case 'blockout-curtains-dark': return '/textures/blockout_charcoal.jpg';
    default: return '/textures/blockout_charcoal.jpg';
  }
};

const DUAL_OVERLAY_PATH = '/textures/sunscreen_white.jpg';

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
uniform mat3 u_pixelToUv;     // homography: photo pixels -> quad UV (0..1)
uniform vec4 u_tintColor;
uniform float u_tintStrength; // 0 = raw texture, 1 = fully tinted
uniform float u_opacity;
uniform vec2 u_uvScale;       // texture tiling repeats across the quad
uniform float u_shade;        // 1 = recess shading on, 0 = off
uniform float u_folds;        // >0 draws soft vertical fold ripples (sheers)

varying vec2 v_pixel;

void main() {
  vec3 uvw = u_pixelToUv * vec3(v_pixel, 1.0);
  vec2 uv = uvw.xy / uvw.z;   // perspective divide — exact per-pixel mapping

  vec4 texColor = texture2D(u_texture, uv * u_uvScale);

  // Multiply blend for colour tinting, preserving texture detail
  vec3 tinted = texColor.rgb * u_tintColor.rgb;
  vec3 col = mix(texColor.rgb, tinted, u_tintStrength);

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
    tintStrength: WebGLUniformLocation | null;
    opacity: WebGLUniformLocation | null;
    uvScale: WebGLUniformLocation | null;
    shade: WebGLUniformLocation | null;
    folds: WebGLUniformLocation | null;
  };
  textures: Map<string, WebGLTexture>;
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
      tintStrength: gl.getUniformLocation(program, 'u_tintStrength'),
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

const getOrUploadTexture = (state: GLState, key: string, img: HTMLImageElement): WebGLTexture => {
  const existing = state.textures.get(key);
  if (existing) return existing;

  const { gl } = state;
  const potCanvas = document.createElement('canvas');
  potCanvas.width = POT_SIZE;
  potCanvas.height = POT_SIZE;
  const potCtx = potCanvas.getContext('2d');
  if (!potCtx) throw new Error('Failed to create texture resampling context');
  potCtx.drawImage(img, 0, 0, POT_SIZE, POT_SIZE);

  const texture = gl.createTexture();
  if (!texture) throw new Error('Failed to create WebGL texture');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, potCanvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);

  state.textures.set(key, texture);
  return texture;
};

const UNIT_SQUARE: Point[] = [[0, 0], [1, 0], [1, 1], [0, 1]];

interface QuadOptions {
  tint: { r: number; g: number; b: number };
  tintStrength: number;
  opacity: number;
  uvScale: [number, number];
  shade: boolean;
  folds: number;
}

/** Renders one fabric quad. Corner order: [tl, tr, br, bl] in photo pixels. */
const drawQuad = (
  state: GLState,
  quad: Point[],
  texture: WebGLTexture,
  opts: QuadOptions
) => {
  const { gl, loc, positionBuffer } = state;

  const h = computeHomography(quad, UNIT_SQUARE);
  gl.uniformMatrix3fv(loc.pixelToUv, false, toColumnMajor(h));
  gl.uniform4f(loc.tintColor, opts.tint.r / 255, opts.tint.g / 255, opts.tint.b / 255, 1);
  gl.uniform1f(loc.tintStrength, opts.tintStrength);
  gl.uniform1f(loc.opacity, opts.opacity);
  gl.uniform2f(loc.uvScale, opts.uvScale[0], opts.uvScale[1]);
  gl.uniform1f(loc.shade, opts.shade ? 1 : 0);
  gl.uniform1f(loc.folds, opts.folds);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
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
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
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

/** Ambient occlusion where the blind/curtain meets the frame — a shadow
 * band on all four sides, darkest at the edge and fading toward the centre
 * over 18% of that edge's own axis. Makes the fabric read as recessed into
 * the window opening rather than overlaid on top of the photo. Shared by
 * the roller and curtain render paths. */
const drawAmbientOcclusion = (ctx: CanvasRenderingContext2D, corners: Point[]) => {
  const [tl, tr, br, bl] = corners;
  const depth = 0.18; // fraction of the edge's own axis the shadow reaches

  const lerp = (a: Point, b: Point, t: number): Point => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];

  const fillBand = (outerA: Point, outerB: Point, innerB: Point, innerA: Point) => {
    const grad = ctx.createLinearGradient(outerA[0], outerA[1], innerA[0], innerA[1]);
    grad.addColorStop(0, 'rgba(0,0,0,0.28)');
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
  ctx.lineTo(br[0], br[1]);
  ctx.lineTo(bl[0], bl[1]);
  ctx.closePath();
  ctx.clip();

  fillBand(tl, tr, lerp(tr, br, depth), lerp(tl, bl, depth)); // top
  fillBand(bl, br, lerp(br, tr, depth), lerp(bl, tl, depth)); // bottom
  fillBand(tl, bl, lerp(bl, br, depth), lerp(tl, tr, depth)); // left
  fillBand(tr, br, lerp(br, bl, depth), lerp(tr, tl, depth)); // right

  ctx.restore();
};

/** Perimeter stroke around the quad, grounding the fabric in the frame. */
const drawVignette = (ctx: CanvasRenderingContext2D, corners: Point[]) => {
  const [tl, tr, br, bl] = corners;
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
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

/** Soft shadow the blind casts downward onto the wall/sill below the
 * bottom rail, grounding it physically in the scene. Only meaningful once
 * there's fabric hanging to cast it. */
const drawContactShadow = (
  ctx: CanvasRenderingContext2D,
  bl: Point,
  br: Point,
  fabBL: Point,
  fabBR: Point,
  leftH: number
) => {
  const shadowHeight = leftH * 0.04;
  const shadowTL = fabBL;
  const shadowTR = fabBR;
  const shadowBL: Point = [bl[0], bl[1] + shadowHeight];
  const shadowBR: Point = [br[0], br[1] + shadowHeight];

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(shadowTL[0], shadowTL[1]);
  ctx.lineTo(shadowTR[0], shadowTR[1]);
  ctx.lineTo(shadowBR[0], shadowBR[1]);
  ctx.lineTo(shadowBL[0], shadowBL[1]);
  ctx.closePath();

  const shadowGrad = ctx.createLinearGradient(shadowTL[0], shadowTL[1], shadowBL[0], shadowBL[1]);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadowGrad;
  ctx.fill();
  ctx.restore();
};

/** Real roller-blind fabric shows faint vertical fold lines where it was
 * rolled up. Drawn as soft-edged strokes (a horizontal gradient across each
 * line's own width) over the fabric quad. */
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

  const foldCount = 5;
  for (let i = 1; i < foldCount; i++) {
    const t = i / foldCount;

    const topX = tl[0] + (tr[0] - tl[0]) * t;
    const topY = tl[1] + (tr[1] - tl[1]) * t;
    const botX = fabBL[0] + (fabBR[0] - fabBL[0]) * t;
    const botY = fabBL[1] + (fabBR[1] - fabBL[1]) * t;

    const foldGrad = ctx.createLinearGradient(
      topX - avgW * 0.015, topY,
      topX + avgW * 0.015, topY
    );
    foldGrad.addColorStop(0, 'rgba(0,0,0,0)');
    foldGrad.addColorStop(0.5, 'rgba(0,0,0,0.07)');
    foldGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.save();
    ctx.strokeStyle = foldGrad;
    ctx.lineWidth = avgW * 0.012;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(botX, botY);
    ctx.stroke();
    ctx.restore();
  }
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

/** The bottom rail hangs in space — it casts a soft shadow up onto the
 * fabric behind it, and a contact shadow down past its bottom edge. */
const drawRailDropShadow = (
  ctx: CanvasRenderingContext2D,
  railTL: Point,
  railTR: Point,
  fabBL: Point,
  fabBR: Point,
  leftH: number,
  avgW: number
) => {
  const railShadowH = leftH * 0.025;
  ctx.save();
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

  const contactH = leftH * 0.03;
  ctx.save();
  const lowerShadow = ctx.createLinearGradient(
    fabBL[0], fabBL[1],
    fabBL[0], fabBL[1] + contactH
  );
  lowerShadow.addColorStop(0, 'rgba(0,0,0,0.20)');
  lowerShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lowerShadow;
  ctx.beginPath();
  ctx.moveTo(fabBL[0], fabBL[1]);
  ctx.lineTo(fabBR[0], fabBR[1]);
  ctx.lineTo(fabBR[0] + avgW * 0.02, fabBR[1] + contactH);
  ctx.lineTo(fabBL[0] - avgW * 0.02, fabBL[1] + contactH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const drawBlindArea = (
  ctx: CanvasRenderingContext2D,
  glStateRef: React.MutableRefObject<GLState | null>,
  glUnavailableRef: React.MutableRefObject<boolean>,
  W: number,
  H: number,
  params: AreaParams,
  fabricImg: HTMLImageElement,
  dualOverlayImg: HTMLImageElement | null
) => {
  const { blindType } = params;
  if (blindType === 'sheer-curtains' || blindType === 'blockout-curtains') {
    drawCurtainArea(ctx, glStateRef, glUnavailableRef, W, H, params, fabricImg);
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
  const safeHardwareColor = params.hardwareColor ?? '#EFEFEF';
  const type = blindType;

  const [tl, tr, br, bl] = corners;
  const topW = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
  const bottomW = Math.hypot(br[0] - bl[0], br[1] - bl[1]);
  const avgW = (topW + bottomW) / 2;
  const leftH = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);

  // Hardware dimensions are ratios of the traced window's own size,
  // recomputed every render from the current corner positions — not fixed
  // pixel constants — so the tube/rail scale correctly whether the window
  // is near or far away in the photo.
  const tubeHeight = leftH * 0.008;
  const railHeight = leftH * 0.012;

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

  // Roller position: fraction of the drop covered by fabric. Below 5%
  // the fabric/rail are hidden but the (fat) fabric roll remains.
  const p = Math.max(0, Math.min(1, rollPosition));
  const showBlind = p >= 0.05;
  const fabBL = leftEdge(p);
  const fabBR = rightEdge(p);

  if (showBlind) {
    // --- DEPTH (pre-fabric) ---
    drawPreFabricDepth(ctx, corners);

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

      const fabricTexture = getOrUploadTexture(state, getTexturePath(type), fabricImg);
      const tint = hexToRgb(fabricColor);

      // ~2 texture repeats across the width, square texels down the drop
      const uvScale: [number, number] = [2, 2 * ((leftH * p) / avgW)];

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
          tintStrength: 0.7,
          opacity: 0.38,
          uvScale: [1, (leftH * p) / (avgW / 2)],
          shade: true,
          folds: 8,
        };
        drawQuad(state, [tl, midT, midBp, fabBL], fabricTexture, panelOpts);
        drawQuad(state, [midT2, tr, fabBR, midB2p], fabricTexture, panelOpts);
      } else if (type === 'sunscreen') {
        // Semi-transparent so the view survives behind the mesh
        drawQuad(state, [tl, tr, fabBR, fabBL], fabricTexture, {
          tint,
          tintStrength: 0.7,
          opacity: 0.55,
          uvScale,
          shade: true,
          folds: 0,
        });
      } else {
        // Blockout / dual — solid fabric
        drawQuad(state, [tl, tr, fabBR, fabBL], fabricTexture, {
          tint,
          tintStrength: 0.7,
          opacity: 1,
          uvScale,
          shade: true,
          folds: 0,
        });

        // Dual: translucent sunscreen layer over the top 38% of the fabric
        if (type === 'dual' && dualOverlayImg) {
          const overlayTexture = getOrUploadTexture(state, DUAL_OVERLAY_PATH, dualOverlayImg);
          const lightTint = hexToRgb(lighten(fabricColor, 25));
          drawQuad(
            state,
            [tl, tr, rightEdge(0.38 * p), leftEdge(0.38 * p)],
            overlayTexture,
            {
              tint: lightTint,
              tintStrength: 0.5,
              opacity: 0.45,
              uvScale: [2, 2 * ((leftH * 0.38 * p) / avgW)],
              shade: false,
              folds: 0,
            }
          );
        }
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
      ctx.fillStyle = rgba(fabricColor, type === 'sunscreen' ? 0.55 : type === 'sheer' ? 0.4 : 0.92);
      ctx.fill();
      ctx.restore();
    }

    // --- FABRIC REALISM — centre light, then fold lines on top ---
    drawFabricCentreLight(ctx, tl, tr, fabBL, fabBR);
    drawFabricFoldLines(ctx, tl, tr, fabBL, fabBR, avgW);

    // --- LIGHTING (post-fabric) ---
    drawLightSheen(ctx, corners);
    drawAmbientOcclusion(ctx, corners);
  } // end showBlind (depth + fabric)

  // --- HEADER TUBE — accumulates rolled-up fabric like a paper roll ---
  // Fully closed: thin cassette in hardware colour. Any amount rolled up:
  // radius grows toward a capped tubeRadiusMax so the rolled-up tube never
  // becomes a big visible cylinder.
  const fullyClosed = p >= 0.999;
  const tubeRadiusClosed = tubeHeight;
  const tubeRadiusMax = leftH * 0.018;
  const tubeRadius = fullyClosed
    ? tubeRadiusClosed
    : Math.min(tubeRadiusMax, tubeRadiusClosed + (1 - p) * tubeRadiusMax);
  ctx.save();
  const tg = ctx.createLinearGradient(tl[0], tl[1] - tubeRadius, tl[0], tl[1] + tubeRadius);
  if (fullyClosed) {
    tg.addColorStop(0, lighten(safeHardwareColor, 35));
    tg.addColorStop(0.35, lighten(safeHardwareColor, 12));
    tg.addColorStop(0.7, safeHardwareColor);
    tg.addColorStop(1, darken(safeHardwareColor, 22));
  } else {
    tg.addColorStop(0, lighten(fabricColor, 20));
    tg.addColorStop(0.5, fabricColor);
    tg.addColorStop(1, darken(fabricColor, 30));
  }
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1] - tubeRadius);
  ctx.lineTo(tr[0], tr[1] - tubeRadius);
  ctx.lineTo(tr[0], tr[1] + tubeRadius);
  ctx.lineTo(tl[0], tl[1] + tubeRadius);
  ctx.closePath();
  ctx.fill();
  // Specular line along the top of the roll
  ctx.strokeStyle = rgba(lighten(fullyClosed ? safeHardwareColor : fabricColor, 45), 0.55);
  ctx.lineWidth = Math.max(1, tubeRadius * 0.15);
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1] - tubeRadius * 0.55);
  ctx.lineTo(tr[0], tr[1] - tubeRadius * 0.55);
  ctx.stroke();
  ctx.restore();

  // --- CASSETTE MOUNT SHADOW — the headrail casts a shadow onto the
  // fabric below it, like a physical bracket blocking light. ---
  if (showBlind) {
    drawCassetteMountShadow(ctx, tl, tr, fabBL, fabBR, tubeHeight, leftH, avgW);
  }

  // --- BOTTOM RAIL (Canvas 2D overlay) — rides the fabric bottom ---
  if (showBlind && type !== 'sheer') {
    const railT = Math.max(0, p - railHeight / leftH);
    const railTL = leftEdge(railT);
    const railTR = rightEdge(railT);
    ctx.save();
    const rg = ctx.createLinearGradient(railTL[0], railTL[1], railTL[0], fabBR[1]);
    rg.addColorStop(0, lighten(safeHardwareColor, 18));
    rg.addColorStop(0.4, safeHardwareColor);
    rg.addColorStop(1, darken(safeHardwareColor, 28));
    ctx.fillStyle = rg;
    ctx.beginPath();
    if (baseRailShape === 'oval') {
      // Rounded profile: bow the top edge of the rail slightly
      const mid = [
        (railTL[0] + railTR[0]) / 2,
        (railTL[1] + railTR[1]) / 2 - railHeight * 0.35,
      ];
      ctx.moveTo(railTL[0], railTL[1]);
      ctx.quadraticCurveTo(mid[0], mid[1], railTR[0], railTR[1]);
    } else {
      ctx.moveTo(railTL[0], railTL[1]);
      ctx.lineTo(railTR[0], railTR[1]);
    }
    ctx.lineTo(fabBR[0], fabBR[1]);
    ctx.lineTo(fabBL[0], fabBL[1]);
    ctx.closePath();
    ctx.fill();
    if (baseRailShape === 'oval') {
      // Specular strip along the curved face
      ctx.strokeStyle = rgba(lighten(safeHardwareColor, 40), 0.5);
      ctx.lineWidth = railHeight * 0.2;
      ctx.beginPath();
      ctx.moveTo(railTL[0], railTL[1] + railHeight * 0.3);
      ctx.lineTo(railTR[0], railTR[1] + railHeight * 0.3);
      ctx.stroke();
    }
    ctx.restore();

    // --- BOTTOM RAIL DROP SHADOW — the rail hangs in space; it casts a
    // shadow up onto the fabric behind it and a contact shadow below. ---
    if (p > 0.1) {
      drawRailDropShadow(ctx, railTL, railTR, fabBL, fabBR, leftH, avgW);
    }
  }

  // --- CONTACT SHADOW — cast onto the wall/sill below the rail. Skipped
  // once the blind is nearly fully open (p <= 0.1): with almost nothing
  // hanging down, there's nothing to cast one. ---
  if (showBlind && p > 0.1) {
    drawContactShadow(ctx, bl, br, fabBL, fabBR, leftH);
  }

  // --- CHAIN — rendering removed. showChain/chainSide/controlType are
  // kept as valid params for API compatibility, but nothing is drawn.
  void chainSide;
  if (showChain && controlType === 'manual' && type !== 'sheer') {
    // Intentionally empty — chain drawing removed.
  }

  // --- VIGNETTE (perimeter stroke) — always last, grounds the frame ---
  if (showBlind) {
    drawVignette(ctx, corners);
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
  fabricImg: HTMLImageElement
) => {
  const { corners, blindType, fabricColor, rollPosition = 1 } = params;
  const safeHardwareColor = params.hardwareColor ?? '#EFEFEF';
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
    const fabricTexture = getOrUploadTexture(state, getTexturePath(texKey), fabricImg);
    const tint = hexToRgb(fabricColor);
    const panelOpts: QuadOptions = {
      tint,
      tintStrength: isSheer ? 0.7 : 0.75,
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
    ctx.fillStyle = rgba(fabricColor, isSheer ? 0.4 : 0.92);
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
  drawAmbientOcclusion(ctx, corners);

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

      const uniqueTypes = Array.from(new Set([
        ...confirmedAreas.map(a => textureKeyFor(a.blindType, a.fabricColor)),
        ...(compareMode && compareBlindType ? [compareBlindType] : []),
      ]));
      const needsDualOverlay = uniqueTypes.includes('dual');

      const [photo, fabricEntries, dualOverlayImg] = await Promise.all([
        loadImage(photoUrl),
        Promise.all(uniqueTypes.map(async t => [t, await loadImage(getTexturePath(t))] as const)),
        needsDualOverlay ? loadImage(DUAL_OVERLAY_PATH) : Promise.resolve(null),
      ]);
      if (cancelled) return;

      const fabricImgByType = new Map(fabricEntries);

      const W = photo.naturalWidth;
      const H = photo.naturalHeight;
      canvas.width = W;
      canvas.height = H;
      ctx.drawImage(photo, 0, 0);

      if (!compareMode) {
        for (const area of confirmedAreas) {
          const texKey = textureKeyFor(area.blindType, area.fabricColor);
          const fabricImg = fabricImgByType.get(texKey);
          if (!fabricImg) continue;
          drawBlindArea(ctx, glStateRef, glUnavailableRef, W, H, buildAreaParams(area, rollPosition), fabricImg, dualOverlayImg);
        }
      } else {
        // Every confirmed area splits across the same shared divider.
        const divider = Math.max(0, Math.min(1, compareDivider));

        for (const area of confirmedAreas) {
          const primaryType = area.blindType === 'sheer-curtains' ? 'sheer' : area.blindType;
          const primaryFabricImg = fabricImgByType.get(primaryType);
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, W * divider, H);
          ctx.clip();
          if (primaryFabricImg) {
            drawBlindArea(ctx, glStateRef, glUnavailableRef, W, H, buildAreaParams(area, rollPosition), primaryFabricImg, dualOverlayImg);
          }
          ctx.restore();

          const compareBlindTypeValue = compareBlindType ?? area.blindType;
          const compareType = compareBlindTypeValue === 'sheer-curtains' ? 'sheer' : compareBlindTypeValue;
          const compareFabricImg = fabricImgByType.get(compareType);
          ctx.save();
          ctx.beginPath();
          ctx.rect(W * divider, 0, W, H);
          ctx.clip();
          if (compareFabricImg) {
            const compareParams: AreaParams = {
              ...buildAreaParams(area, rollPosition),
              blindType: compareBlindTypeValue,
              fabricColor: compareFabricColor ?? area.fabricColor,
            };
            drawBlindArea(ctx, glStateRef, glUnavailableRef, W, H, compareParams, compareFabricImg, dualOverlayImg);
          }
          ctx.restore();
        }

        // One shared divider line + labels spanning the whole canvas.
        const divX = W * divider;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 6;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(divX, 0);
        ctx.lineTo(divX, H);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = 'rgba(28,28,28,0.85)';
        ctx.fillRect(divX - 60, 12, 54, 22);
        ctx.fillRect(divX + 6, 12, 54, 22);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px "DM Sans"';
        ctx.fillText('Primary', divX - 56, 27);
        ctx.fillText('Compare', divX + 10, 27);
      }

      // Active area (being traced) — subtle dashed teal outline, no fabric.
      if (activeArea && activeArea.corners.length >= 4) {
        const [tl, tr, br, bl] = activeArea.corners;
        ctx.save();
        ctx.setLineDash([10, 6]);
        ctx.strokeStyle = 'rgba(74,191,181,0.9)';
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
        ctx.fillStyle = '#4ABFB5';
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
