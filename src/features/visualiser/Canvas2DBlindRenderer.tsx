import React, { useEffect, useRef } from 'react';
import { computeHomography, toColumnMajor, windowPlane, Point } from './homography';
import { HARDWARE_HEX } from '../../data/products';
import { tokens } from '@/ds';
import { sampleBlindLighting, blindTextureCoordinates, NEUTRAL_BLIND_LIGHT, type BlindLighting } from './blindLighting';

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
  // Curtain-specific
  productCategory?: 'blind' | 'curtain' | 'wardrobe' | 'shelving';
  curtainType?: 'blockout' | 'sheer';
  curtainOperation?: 'manual' | 'motorised';
  curtainMount?: 'ceiling' | 'window';
  curtainFold?: 'boxpleat' | 'pencilpleat' | 'pinchpleat' | 'sfold';
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

/** Perceived brightness of a hex, 0 (black) to 1 (white). Same Rec.601 weights
 * the fragment shader uses for the weave, so a colour's luminance means the
 * same thing on both sides of the GL boundary. */
const luma01 = (hex: string): number => {
  const { r, g, b } = hexToRgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
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
const leakRgba = (a: number): string => `rgba(255,242,210,${a})`;

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
// Textures — real fabric photos in public/images/visualiser/textures/,
// tinted in the shader
// ---------------------------------------------------------------------------

// CASE-SENSITIVE. These paths are served verbatim from public/ by a Linux
// host, where /images/textures/... and /images/Textures/... are different
// URLs. The root directory on disk is now `textures`, lower case, under
// `images/visualiser/` — but `Blockout`, `Sunscreen`, `Light-filter` and
// `Bottom_bar` keep their capitals, so the segments below still have to match
// exactly. A wrong case resolves fine on a Windows dev machine and 404s in
// production, which is the worst possible failure shape: it only appears after
// deploy. Do not "tidy" the capitalisation without renaming to match.
//
// npm run check:asset-paths now catches this. It builds the set of real paths
// from readdir rather than calling fs.existsSync, which is case-insensitive on
// this machine and would have said yes to either spelling.
const TEXTURE_ROOT = '/images/visualiser/textures';

const getTexturePath = (blindType: string): string => {
  switch (blindType) {
    case 'blockout': return `${TEXTURE_ROOT}/Blockout/Blockout_fabric.png`;
    case 'sunscreen': return `${TEXTURE_ROOT}/Sunscreen/Sunscreen.png`;
    case 'lightfilter': return `${TEXTURE_ROOT}/Light-filter/light_filter.png`;
    // A dual roller is a blockout in front of a sunscreen; both come from the
    // real photos above via DUAL_FRONT_TEXTURE / DUAL_BACK_TEXTURE.
    case 'dual': return `${TEXTURE_ROOT}/Blockout/Blockout_fabric.png`;
    // Curtains DO have dedicated photography now, and it lives with the rest of
    // the sample library. These cases pointed at public/textures/, a directory
    // that no longer exists — the generic weave scans in it were replaced by the
    // real curtain samples. None of these blind types is reachable (the picker
    // offers blockout, sunscreen, lightfilter and dual, and curtains render
    // through Canvas2DCurtainRenderer, not this file) so nothing was visibly
    // broken, but code pointing at deleted assets is a trap set for whoever
    // wires one of them up next.
    case 'sheer':
    case 'sheer-curtains': return `${TEXTURE_ROOT}/curtains/sheer_produced.png`;
    case 'blockout-curtains-light':
    case 'blockout-curtains-dark': return `${TEXTURE_ROOT}/curtains/Blockout_produced.png`;
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
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_texture;
uniform mat3 u_pixelToUv;
uniform vec4 u_tintColor;
uniform float u_textureAmount;
uniform float u_textureMean;
uniform float u_opacity;
uniform vec2 u_uvScale;
uniform float u_uvOffset;
uniform float u_dropFraction;
uniform vec3 u_roomTint;
uniform float u_roomExposure;
uniform vec4 u_daylight;
uniform float u_shade;
uniform float u_folds;
uniform float u_blindType;
varying vec2 v_pixel;
void main() {
  vec3 uvw = u_pixelToUv * vec3(v_pixel,1.0);
  vec2 uv = uvw.xy / uvw.z;
  vec2 fabricUv = uv*u_uvScale + vec2(0.0,u_uvOffset);
  float texel = dot(texture2D(u_texture,fabricUv).rgb,vec3(0.299,0.587,0.114));
  float detail = clamp(texel-u_textureMean,-0.30,0.30);
  vec3 col = u_tintColor.rgb * (1.0 + detail*u_textureAmount) + vec3(detail*u_textureAmount*0.035);
  float dyeLuma = dot(u_tintColor.rgb,vec3(0.299,0.587,0.114));
  float roomV = uv.y*u_dropFraction;
  float daylight = mix(mix(u_daylight.x,u_daylight.y,uv.x),mix(u_daylight.w,u_daylight.z,uv.x),roomV);
  col *= u_roomTint*u_roomExposure;
  // Taut cloth has a broad, very shallow bow between the roller and weight.
  // This is a matte surface variation, without a plastic centre highlight.
  float bow = sin(uv.x*3.141593)*sin(uv.y*3.141593);
  col *= 0.985 + 0.018*bow - 0.010*uv.y;
  if (u_blindType > 0.5 && u_blindType < 1.5) {
    col += vec3(0.015*daylight*dyeLuma);
  } else if (u_blindType > 1.5 && u_blindType < 2.5) {
    // Woven light-filter fabric glows in daylight while retaining its yarn
    // texture. A softly diffused background is composited through it below.
    vec3 transmitted = u_tintColor.rgb*mix(vec3(1.0),u_roomTint,0.35)*(0.79+0.30*daylight);
    transmitted *= 1.0+detail*u_textureAmount;
    col = mix(col,transmitted,0.55);
  }
  if (u_folds > 0.5) col *= 1.0+0.06*sin(uv.x*u_folds*6.2831853);
  float edgeL = 1.0-smoothstep(0.0,0.025,uv.x);
  float edgeR = 1.0-smoothstep(0.0,0.020,1.0-uv.x);
  float hem = 1.0-smoothstep(0.0,0.012,1.0-uv.y);
  col *= 1.0-u_shade*(edgeL*0.035+edgeR*0.025+hem*0.035);
  float opacity = u_opacity;
  if (u_blindType > 0.5 && u_blindType < 1.5) opacity = clamp(opacity+detail*0.06,0.0,1.0);
  if (u_blindType > 1.5 && u_blindType < 2.5) opacity = clamp(opacity+detail*0.10,0.0,1.0);
  gl_FragColor = vec4(clamp(col,0.0,1.0)*opacity,opacity);
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
    uvOffset: WebGLUniformLocation | null;
    dropFraction: WebGLUniformLocation | null;
    roomTint: WebGLUniformLocation | null;
    roomExposure: WebGLUniformLocation | null;
    daylight: WebGLUniformLocation | null;
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

// ---------------------------------------------------------------------------
// Sunscreen — view-through is a function of the YARN COLOUR, not just openness
//
// This is the one fabric in the range whose transparency the customer changes
// by picking a colour, and it runs opposite to the intuition. A white sunscreen
// scatters the daylight passing through it forward into the room: the screen
// itself lights up, hazes over, and you see the screen instead of the view. A
// charcoal or black sunscreen absorbs that forward scatter, so nothing lights
// up and you look straight through the weave to what is outside — which is
// exactly why dark sunscreen is what gets specified when the view matters.
//
// Rendered as three things moving together with luminance, because changing
// opacity alone left a dark screen transparent but still glowing:
//   - opacity            — how much of the fabric colour covers the view
//   - background blur    — how sharp what you see through it is
//   - weave strength     — how much of the photo's grid reads on the surface
// ---------------------------------------------------------------------------

/** Near-black sunscreen: almost clear, you read it by its edges and the rail. */
const SUNSCREEN_OPACITY_DARK = 0.24;
/** White sunscreen: still unmistakably a screen, milky and bright. */
const SUNSCREEN_OPACITY_LIGHT = 0.7;

/** Squared, not linear. View-through falls away quickly once the yarn is off
 * black, and the useful part of the range sits in the darker half — a linear
 * ramp made every mid-tone look like a half-drawn sheer. */
const sunscreenOpenness = (fabricColor: string): number => {
  const l = luma01(fabricColor);
  return l * l;
};

/** Opacity for one fabric, given the colour it is being rendered in. Every
 * type except sunscreen ignores the colour and comes straight from the table
 * above. Used by the WebGL path and the flat-colour fallback alike, so the two
 * can never disagree about how transparent a given blind is. */
const fabricOpacityFor = (blindType: string, fabricColor: string): number => {
  if (blindType === 'sunscreen') {
    const t = sunscreenOpenness(fabricColor);
    return SUNSCREEN_OPACITY_DARK + (SUNSCREEN_OPACITY_LIGHT - SUNSCREEN_OPACITY_DARK) * t;
  }
  return FABRIC_OPACITY[blindType] ?? 1;
};

/** Diffusion radius, in reference pixels, for the view behind a translucent
 * fabric. A dark sunscreen is nearly a window — 1.5px is barely a softening —
 * while a white one scatters the view into a ghost. Light filter does not
 * transmit an image at any colour and keeps its fixed, much larger radius. */
const sunscreenDiffusionPx = (fabricColor: string): number =>
  1.5 + 6.5 * sunscreenOpenness(fabricColor);

/** How hard the weave photo reads on a sunscreen. On a dark, see-through
 * screen the grid has to almost vanish: at full strength the texture's own
 * tight crosshatch was the most prominent thing on the fabric, which is the
 * hash pattern this is tuned to kill. */
const sunscreenTextureAmount = (base: number, fabricColor: string): number =>
  base * (0.35 + 0.65 * sunscreenOpenness(fabricColor));

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
      uvOffset: gl.getUniformLocation(program, 'u_uvOffset'),
      dropFraction: gl.getUniformLocation(program, 'u_dropFraction'),
      roomTint: gl.getUniformLocation(program, 'u_roomTint'),
      roomExposure: gl.getUniformLocation(program, 'u_roomExposure'),
      daylight: gl.getUniformLocation(program, 'u_daylight'),
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
const getOrUploadTexture = (
  state: GLState,
  key: string,
  img: HTMLImageElement,
  tileable: boolean,
): FabricTexture => {
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
  // MIRRORED_REPEAT, not REPEAT — this is what actually removes the tile
  // seams, and plain REPEAT is what caused them.
  //
  // These textures are photographs, not seamless tiles: the pixels down the
  // left edge have no relationship to the pixels down the right. Under REPEAT
  // every tile boundary butts those two unrelated edges together and the
  // discontinuity reads as a hard line, laying a visible grid over the fabric.
  // Mipmapping does not help — it averages the discontinuity into the lower
  // levels, turning a hard line into a soft band that is still a line.
  //
  // MIRRORED_REPEAT flips the sampling direction at each boundary, so the
  // texture always meets itself edge-pixel to edge-pixel. The join is
  // continuous by construction whatever the source image looks like, so the
  // seam cannot exist rather than being masked. The mirroring itself is
  // invisible here: a woven fabric at this scale has no directional content
  // for the eye to catch a reflection in.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  // Vertical still depends on the photo. The purpose-shot roller textures
  // mirror cleanly; the legacy curtain scans stay clamped so the last row
  // smears down the drop and a curtain reads as one continuous piece.
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_T,
    tileable ? gl.MIRRORED_REPEAT : gl.CLAMP_TO_EDGE,
  );
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
  // Only the purpose-shot roller textures are seamless. Derived from the path
  // rather than passed in, so a caller cannot accidentally declare a legacy
  // scan tileable and reintroduce the seam.
  const tileable = ALL_ROLLER_TEXTURES.includes(path);
  return img ? getOrUploadTexture(state, path, img, tileable) : null;
};

const roomLightCache = new WeakMap<object, Map<string,BlindLighting>>();
const roomPixelsCache = new WeakMap<object, Uint8ClampedArray>();
const lightingFor = (photo: CanvasImageSource, W: number, H: number, corners: Point[]): BlindLighting => {
  let byQuad=roomLightCache.get(photo);
  if (!byQuad) { byQuad=new Map(); roomLightCache.set(photo,byQuad); }
  const key=JSON.stringify(corners);
  const known=byQuad.get(key);
  if (known) return known;
  try {
    let pixels=roomPixelsCache.get(photo);
    if (!pixels) {
      const sample=document.createElement('canvas'); sample.width=sample.height=96;
      const ctx=sample.getContext('2d',{willReadFrequently:true})!;
      ctx.drawImage(photo,0,0,96,96);
      pixels=ctx.getImageData(0,0,96,96).data;
      roomPixelsCache.set(photo,pixels);
    }
    const light=sampleBlindLighting(pixels,96,96,corners.map(([x,y])=>[x/W,y/H]));
    byQuad.set(key,light);
    return light;
  } catch {
    byQuad.set(key, NEUTRAL_BLIND_LIGHT);
    return NEUTRAL_BLIND_LIGHT;
  }
};

const UNIT_SQUARE: Point[] = [[0, 0], [1, 0], [1, 1], [0, 1]];

/** How strongly the texture photo's weave modulates the base colour. Low by
 * design — the selected Rynamic colour has to survive intact, so the weave
 * reads as surface, never as a wash over the top of it. */
const FABRIC_TEXTURE_AMOUNT = 0.5;

/** Per-fabric surface tuning. Both numbers are properties of the specific
 * photograph, not of the fabric in the abstract, so they move if a texture is
 * re-shot.
 *
 * `textureAmount` — how hard the weave modulates the selected colour.
 * Blockout's photo is a mid-grey with a subtle weave, so its deviation from
 * its own mean is small and needs amplifying before the surface reads at all;
 * at 0.5 it rendered as near-flat colour. Sunscreen and light filter are much
 * lighter photos with pronounced structure, and pushing them to 0.85 blows the
 * weave into hard black-and-white banding.
 *
 * `tileX` — horizontal repeats across the blind's width. Set from how fine
 * each weave is: too few and a weave disappears into a flat wash, too many and
 * it turns to noise.
 *
 * Sunscreen sits at 2, down from 3. Its photo is a 512px image of a very tight
 * woven grid, and every extra repeat minifies that grid further: at 3 the
 * mipmap chain handled the GL sample but the canvas is then CSS-downscaled from
 * the photo's own resolution a second time, which it cannot cover. Two grid
 * patterns beating against each other at that density is the crosshatch hash
 * a sunscreen was showing. Fewer, larger repeats resolve cleanly. */
interface FabricSurface {
  textureAmount: number;
  tileX: number;
}

const FABRIC_SURFACE: Record<string, FabricSurface> = {
  blockout: { textureAmount: 0.65, tileX: 1.7 },
  sunscreen: { textureAmount: 0.5, tileX: 2 },
  lightfilter: { textureAmount: 0.85, tileX: 2 },
};

const DEFAULT_SURFACE: FabricSurface = { textureAmount: FABRIC_TEXTURE_AMOUNT, tileX: 1 };

const surfaceFor = (blindType: string): FabricSurface =>
  FABRIC_SURFACE[blindType] ?? DEFAULT_SURFACE;

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
  lighting?: BlindLighting;
  uvOffset?: number;
  dropFraction?: number;
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
  gl.uniform1f(loc.uvOffset, opts.uvOffset ?? 0);
  gl.uniform1f(loc.dropFraction, opts.dropFraction ?? 1);
  const light = opts.lighting ?? NEUTRAL_BLIND_LIGHT;
  gl.uniform3f(loc.roomTint,...light.tint);
  gl.uniform1f(loc.roomExposure,light.exposure);
  gl.uniform4f(loc.daylight,...light.daylight);
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
// The blurred photo, cached across frames.
//
// A full-canvas gaussian at the photo's own resolution is the single most
// expensive operation in this renderer, and it was running inside every frame of
// the roll animation — sixty times a second, on an image that can be 4000px
// wide. Nothing about it depends on roll position: the blur is a function of the
// photo and the radius only. So it is computed once per (photo, radius) and the
// per-frame cost drops to one clipped drawImage.
//
// Keyed by radius to the nearest half pixel, and more than one entry, because a
// scene with a sunscreen and a light filter needs two different radii in the
// same frame and a single slot would thrash between them.
const diffusionCache = new Map<number, HTMLCanvasElement>();
let diffusionSource: CanvasImageSource | null = null;

const diffusedPhoto = (
  photo: CanvasImageSource,
  W: number,
  H: number,
  radius: number,
): HTMLCanvasElement | null => {
  if (diffusionSource !== photo) {
    diffusionCache.clear();
    diffusionSource = photo;
  }
  const key = Math.round(radius * 2) / 2;
  const cached = diffusionCache.get(key);
  if (cached && cached.width === W && cached.height === H) return cached;

  const canvas = cached ?? document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const bctx = canvas.getContext('2d');
  if (!bctx) return null;

  if (typeof bctx.filter === 'string') {
    bctx.filter = `blur(${key.toFixed(1)}px)`;
    bctx.drawImage(photo, 0, 0);
    bctx.filter = 'none';
  } else {
    // Eight offsets on a ring, each at a low alpha — the accumulated average
    // reads as a blur of roughly the same radius.
    bctx.globalAlpha = 0.14;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      bctx.drawImage(photo, Math.cos(ang) * key, Math.sin(ang) * key);
    }
    bctx.globalAlpha = 1;
  }

  diffusionCache.set(key, canvas);
  return canvas;
};

const drawBackgroundDiffusion = (
  ctx: CanvasRenderingContext2D,
  photo: CanvasImageSource,
  W: number,
  H: number,
  quad: Point[],
  radius: number,
) => {
  const blurred = diffusedPhoto(photo, W, H, radius);
  if (!blurred) return;

  const [a, b, c, d] = quad;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(c[0], c[1]);
  ctx.lineTo(d[0], d[1]);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(blurred, 0, 0);
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

  // Asymmetric, because the light source is assumed top-left everywhere in
  // this renderer — the shader's directional sheen, the cassette highlight and
  // the bracket top face all agree on it. A matched pair of edge shadows
  // quietly contradicted all three and flattened the fabric back out. The
  // left edge is deeper and reaches further; the right is shallower.
  const reachFrac = (px: number) =>
    Math.min(0.45, scaleToBlind(px, topW) / Math.max(1, topW));
  const leftFrac = reachFrac(7);
  const rightFrac = reachFrac(5);

  const lerp = (a: Point, b: Point, t: number): Point => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];

  const fillBand = (
    outerA: Point,
    outerB: Point,
    innerB: Point,
    innerA: Point,
    alpha: number,
  ) => {
    const grad = ctx.createLinearGradient(outerA[0], outerA[1], innerA[0], innerA[1]);
    grad.addColorStop(0, shadowRgba(alpha));
    grad.addColorStop(0.45, shadowRgba(alpha * 0.32));
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

  fillBand(tl, fabBL, lerp(fabBL, fabBR, leftFrac), lerp(tl, tr, leftFrac), 0.08);
  fillBand(tr, fabBR, lerp(fabBR, fabBL, rightFrac), lerp(tr, tl, rightFrac), 0.06);

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

interface LeakEdge {
  /** Outward reach in reference px, and peak alpha. */
  reach: number;
  alpha: number;
}

/** Left and right are specified separately, not mirrored. The light source is
 * top-left throughout this renderer, so more spills down the near side than
 * the far one; a symmetric pair reads as a glowing outline rather than as a
 * lit room. */
interface LeakSpec {
  left: LeakEdge;
  right: LeakEdge;
  bottom: LeakEdge;
  top: LeakEdge;
}

const LEAK_BY_TYPE: Record<string, LeakSpec> = {
  // Opaque, so every photon that reaches the window escapes at the perimeter.
  // This is the strongest leak of the three and the main cue that the fabric
  // is stopping light rather than passing it.
  blockout: {
    left: { reach: 10, alpha: 0.18 },
    right: { reach: 8, alpha: 0.14 },
    top: { reach: 4, alpha: 0.12 },
    bottom: { reach: 6, alpha: 0.1 },
  },
  // Transmits most light through the weave and seals better at the edge, so
  // there is very little left over to spill.
  sunscreen: {
    left: { reach: 4, alpha: 0.06 },
    right: { reach: 3, alpha: 0.05 },
    top: { reach: 2, alpha: 0.04 },
    bottom: { reach: 3, alpha: 0.05 },
  },
  // Between the two.
  lightfilter: {
    left: { reach: 6, alpha: 0.14 },
    right: { reach: 5, alpha: 0.11 },
    top: { reach: 3, alpha: 0.08 },
    bottom: { reach: 5, alpha: 0.12 },
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

  band(tl, fabBL, -ux, -uy, scaleToBlind(spec.left.reach, avgW), spec.left.alpha);
  band(tr, fabBR, ux, uy, scaleToBlind(spec.right.reach, avgW), spec.right.alpha);
  band(fabBL, fabBR, -px, -py, scaleToBlind(spec.bottom.reach, avgW), spec.bottom.alpha);
  band(tl, tr, px, py, scaleToBlind(spec.top.reach, avgW), spec.top.alpha);

  ctx.restore();
};

/** Perimeter stroke around the quad, grounding the fabric in the frame.
 *
 * `skipTopEdge` omits the tl->tr run. On a roller the fabric quad's top edge is
 * the tube's own centreline, so stroking it draws a hard dark line straight
 * across the middle of the roll. The stroke is meant to be the shadow where
 * fabric meets frame, and along that edge there is no such join — the fabric
 * disappears behind a tube sitting in front of it. It only became visible once
 * the tube grew with the roll; at the old fixed diameter the line fell close
 * enough to the tube's lower edge to pass for the shadow beneath it. */
const drawVignette = (
  ctx: CanvasRenderingContext2D,
  corners: Point[],
  skipTopEdge = false,
) => {
  const [tl, tr, br, bl] = corners;
  ctx.save();
  ctx.strokeStyle = shadowRgba(0.36);
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (skipTopEdge) {
    // Open path: right, bottom, left. No closePath — that would re-add the top.
    ctx.moveTo(tr[0], tr[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.lineTo(tl[0], tl[1]);
  } else {
    ctx.moveTo(tl[0], tl[1]);
    ctx.lineTo(tr[0], tr[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.closePath();
  }
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
  fabBR: Point,
  below?: (reach: number) => [Point, Point],
) => {
  const width = Math.hypot(fabBR[0]-fabBL[0],fabBR[1]-fabBL[1]);
  const shadowHeight = scaleToBlind(7,width);
  const {pv} = axesFor(fabBL,fabBR);
  ctx.save();
  multiPassShadow(3, shadowHeight, 0.10, (reach, alpha) => {
    const [bl, br] = below?.(reach) ?? [
      [fabBL[0]-pv[0]*reach, fabBL[1]-pv[1]*reach],
      [fabBR[0]-pv[0]*reach, fabBR[1]-pv[1]*reach],
    ];
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

/** Soft contact shadow following the roller's angle inside the opening. */
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
  const reachMax = Math.min(scaleToBlind(9,avgW),leftH*0.06);
  const {pv}=axesFor(tl,tr);
  const a: Point=[tl[0]-pv[0]*tubeHeight,tl[1]-pv[1]*tubeHeight];
  const b: Point=[tr[0]-pv[0]*tubeHeight,tr[1]-pv[1]*tubeHeight];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...tl);ctx.lineTo(...tr);ctx.lineTo(...fabBR);ctx.lineTo(...fabBL);ctx.closePath();ctx.clip();
  multiPassShadow(3,reachMax,0.12,(reach,alpha)=>{
    const c: Point=[b[0]-pv[0]*reach,b[1]-pv[1]*reach];
    const d: Point=[a[0]-pv[0]*reach,a[1]-pv[1]*reach];
    const gradient=ctx.createLinearGradient(...a,...d);
    gradient.addColorStop(0,shadowRgba(alpha));gradient.addColorStop(1,shadowRgba(0));
    ctx.fillStyle=gradient;
    ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.lineTo(...c);ctx.lineTo(...d);ctx.closePath();ctx.fill();
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
  leftH: number,
  above?: (reach: number) => [Point, Point],
) => {
  const railShadowH = leftH * 0.012;
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

  multiPassShadow(3, railShadowH, 0.09, (reach, alpha) => {
    const [a, b] = above?.(reach) ?? [[railTL[0], railTL[1]-reach], [railTR[0], railTR[1]-reach]];
    const g = ctx.createLinearGradient(
      railTL[0], railTL[1],
      a[0], a[1],
    );
    g.addColorStop(0, shadowRgba(alpha));
    g.addColorStop(1, shadowRgba(0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(railTL[0], railTL[1]);
    ctx.lineTo(railTR[0], railTR[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(a[0], a[1]);
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
  // Tolerates a leading '#' or not — hardware finishes carry one, fabric
  // colours come from the catalogue and are not guaranteed to.
  const n = parseInt(hex.replace('#', ''), 16);
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

const litHardwareHex = (hex: string, light: BlindLighting): string => {
  const rgb=hexToRgb(hex);
  return '#'+[rgb.r,rgb.g,rgb.b].map((c,i)=>Math.round(Math.max(0,Math.min(255,c*light.tint[i]*light.exposure))).toString(16).padStart(2,'0')).join('');
};

/** Flat fill — for faces that must not read as curved (bracket plates, end
 * caps). Chrome still gets its metallic gradient. */
const setHardwareFill = (
  ctx: CanvasRenderingContext2D,
  hardwareColourName: 'white' | 'black' | 'chrome' | undefined,
  safeHardwareColor: string,
  gradFrom: Point,
  gradTo: Point,
  lighting: BlindLighting = NEUTRAL_BLIND_LIGHT,
) => {
  if (hardwareColourName === 'chrome') {
    const grad = ctx.createLinearGradient(gradFrom[0], gradFrom[1], gradTo[0], gradTo[1]);
    CHROME_GRADIENT_STOPS.forEach(([stop, colour]) => grad.addColorStop(stop, litHardwareHex(colour,lighting)));
    ctx.fillStyle = grad;
  } else if (hardwareColourName === 'white' || hardwareColourName === 'black') {
    ctx.fillStyle = HARDWARE_FLAT_HEX[hardwareColourName];
  } else {
    ctx.fillStyle = safeHardwareColor;
  }
};

// The cassette and rail both use traceCylinderBody with metallic gradients
// that include prominent highlight bands matching the real product photos.

const CASSETTE_HEIGHT_RATIO = 0.04; // ~4% of blind height — the BARE 45mm tube
const RAIL_HEIGHT_RATIO = 0.018; // ~1.8% of blind height — per product photo spec

// ---------------------------------------------------------------------------
// Roll diameter — the tube gets fatter as the blind goes up
//
// A roller blind's visible barrel is not a fixed object. Bare, it is a 45mm
// aluminium tube; fully raised, the entire drop is wound around it and it
// measures about 65mm. The renderer used to draw one fixed cylinder at every
// position, so a blind rolled to the top had all its fabric vanish into a tube
// the same size as when it was fully down.
//
// There is no mm-to-pixel scale anywhere in this renderer — the geometry comes
// from four traced corner pins, not from measurements — so CASSETTE_HEIGHT_RATIO
// is the anchor: 4% of the blind's height IS 45mm, and every other diameter is
// quoted as a ratio against that.
// ---------------------------------------------------------------------------

const TUBE_BARE_MM = 45;  // aluminium barrel, nothing wound on it
const TUBE_FULL_MM = 65;  // the whole drop wound on, blind at the top

/** Diameter of the roll in mm at roll position `p` (1 = fully down, 0 = fully
 * raised).
 *
 * Wound fabric occupies a cross-section, not a length: π(R² − r²) = L·t for a
 * wound length L of thickness t. Solving for R gives a square root, so the
 * diameter climbs steeply over the first turns and flattens as the roll fattens
 * — which is why a blind visibly thickens the moment you start raising it and
 * then changes little over the last third. A linear ramp gets both ends wrong. */
const rollDiameterMm = (p: number): number => {
  const wound = 1 - Math.max(0, Math.min(1, p));
  const r = TUBE_BARE_MM / 2;
  const R = TUBE_FULL_MM / 2;
  return 2 * Math.sqrt(r * r + (R * R - r * r) * wound);
};

/** The bare tube's height as a fraction of blind height, scaled to whatever
 * diameter the current roll position implies. */
const cassetteHeightRatio = (p: number): number =>
  CASSETTE_HEIGHT_RATIO * (rollDiameterMm(p) / TUBE_BARE_MM);

// ---------------------------------------------------------------------------
// What the roll shows — and it is not always the selected colour
//
// Blockout is a BOTTOM ROLL: the fabric comes off the barrel at the back and
// hangs down the far side, so what faces the room on the roll is the fabric's
// REVERSE. Every blockout in the range is backed white for heat reflection, so
// a charcoal blockout has a WHITE roll sitting on the tube. This is the detail
// people most often get wrong when they picture one, and getting it wrong in a
// visualiser sets the wrong expectation before the blind is even ordered.
//
// Sunscreen and light filter roll over the top, so the fabric's FACE is what
// wraps outward and the roll reads in the selected colour.
// ---------------------------------------------------------------------------

/** The white acrylic backing on every blockout in the range. Not pure white —
 * it is a warm off-white, and pure #FFF next to a photographed room reads as a
 * blown-out hole rather than as fabric. */
const BLOCKOUT_BACKING_HEX = '#EDEDED';

/** Which way a fabric rolls, and therefore what colour its roll is. */
const rollsFaceOut = (blindType: string): boolean =>
  blindType === 'sunscreen' || blindType === 'lightfilter';

const rollFaceHex = (blindType: string, fabricColor: string): string =>
  rollsFaceOut(blindType) ? fabricColor : BLOCKOUT_BACKING_HEX;

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

/** Cassette (top roller housing) — a 49mm aluminium cylinder with a prominent
 * horizontal highlight band in the upper third (matching real product photos).
 * Fixed height regardless of roll position. Returns the half-height so callers
 * can position the cassette-mount shadow right below it. One shared cassette
 * also covers both layers of a dual blind — real twin-roller blinds mount both
 * rolls in a single housing. */

/** Traces a true cylindrical tube profile: straight vertical sides with
 * semicircular end caps. This matches the real 49mm aluminium roller tube. */
const traceCylinderBody = (
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  halfH: number,
  u: Point,
  pv: Point,
  endScale = 1,
) => {
  const [ux, uy] = u;
  const [px, py] = pv;

  // Top and bottom edges of the cylinder
  const aTop: Point = [a[0] + px * halfH, a[1] + py * halfH];
  const bTop: Point = [b[0] + px * halfH * endScale, b[1] + py * halfH * endScale];
  const aBot: Point = [a[0] - px * halfH, a[1] - py * halfH];
  const bBot: Point = [b[0] - px * halfH * endScale, b[1] - py * halfH * endScale];

  // Bezier control point factor for a quarter-circle arc
  const k = halfH * 0.5523;

  ctx.beginPath();
  // Bottom edge, left to right
  ctx.moveTo(aBot[0], aBot[1]);
  ctx.lineTo(bBot[0], bBot[1]);
  // Right semicircle (bottom to top)
  ctx.bezierCurveTo(
    bBot[0] + ux * k * endScale, bBot[1] + uy * k * endScale,
    bTop[0] + ux * k * endScale, bTop[1] + uy * k * endScale,
    bTop[0], bTop[1],
  );
  // Top edge, right to left
  ctx.lineTo(aTop[0], aTop[1]);
  // Left semicircle (top to bottom)
  ctx.bezierCurveTo(
    aTop[0] - ux * k, aTop[1] - uy * k,
    aBot[0] - ux * k, aBot[1] - uy * k,
    aBot[0], aBot[1],
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

/** The wound fabric on the barrel: which fabric, and how far the blind is up. */
interface RollState {
  /** Roll position, 1 = fully down, 0 = fully raised. */
  p: number;
  blindType: string;
  fabricColor: string;
  lighting?: BlindLighting;
  plane?: (u: number, v: number) => Point;
}

const drawCassette = (
  ctx: CanvasRenderingContext2D,
  tl: Point,
  tr: Point,
  leftH: number,
  hardwareColourName: 'white' | 'black' | 'chrome' | undefined,
  safeHardwareColor: string,
  avgW: number,
  yRotation = 0, // window rotation for end cap visibility
  roll?: RollState,
): number => {
  // Diameter tracks the roll: 45mm bare, up to 65mm with the whole drop wound
  // on. Without a roll state (curtain and legacy callers) it stays bare.
  const rollP = roll ? Math.max(0, Math.min(1, roll.p)) : 1;
  const ratio = cassetteHeightRatio(rollP);
  const localDiameter = (u: number) => {
    const a = roll!.plane!(u, -ratio / 2), b = roll!.plane!(u, ratio / 2);
    return Math.hypot(b[0]-a[0], b[1]-a[1]);
  };
  const fullH = roll?.plane ? localDiameter(0) : leftH * ratio;
  const halfH = fullH / 2;
  const { u, pv } = axesFor(tl, tr);
  const lighting = roll?.lighting ?? NEUTRAL_BLIND_LIGHT;
  const endScale = roll?.plane ? localDiameter(1) / fullH
    : Math.max(0.7,Math.min(1.4,(3-yRotation)/(3+yRotation)));
  const base = litHardwareHex(hardwareBaseHex(hardwareColourName, safeHardwareColor),lighting);
  const top: Point = [tl[0] + pv[0] * halfH, tl[1] + pv[1] * halfH];
  const bot: Point = [tl[0] - pv[0] * halfH, tl[1] - pv[1] * halfH];

  ctx.save();

  // --- BODY: tube runs full width from tl to tr, connecting to brackets
  traceCylinderBody(ctx, tl, tr, halfH, u, pv, endScale);
  if (hardwareColourName === 'chrome') {
    setHardwareFill(ctx, hardwareColourName, safeHardwareColor, top, bot, lighting);
  } else {
    const grad = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
    grad.addColorStop(0, shadeHex(base, -0.10));
    grad.addColorStop(0.24, shadeHex(base, 0.035));
    grad.addColorStop(0.48, shadeHex(base, 0.01));
    grad.addColorStop(0.6, base);
    grad.addColorStop(1, shadeHex(base, -0.20));
    ctx.fillStyle = grad;
  }
  ctx.fill();

  // Everything below is clipped to the body so no detail escapes the outline.
  ctx.save();
  traceCylinderBody(ctx, tl, tr, halfH, u, pv, endScale);
  ctx.clip();

  // --- FABRIC WOUND ON THE TUBE
  //
  // Once there is fabric on the barrel it wraps the whole circumference, so
  // what you see is the fabric, not the tube — in the reverse's white for a
  // bottom-rolling blockout, or in the selected colour for a sunscreen or light
  // filter that rolls face-out. See rollFaceHex.
  //
  // Coverage ramps in over the first 15% of travel rather than switching on,
  // for two reasons: a hard swap from hardware finish to fabric partway through
  // a smooth motorised sweep is the kind of pop that reads as a bug, and at
  // fully-closed the barrel genuinely is near-bare, which is also the one
  // position where the customer can still see which hardware finish they picked.
  const coverage = roll ? Math.max(0, Math.min(1, (1 - rollP) / 0.15)) : 0;
  if (coverage > 0) {
    const face = litHardwareHex(rollFaceHex(roll!.blindType, roll!.fabricColor),lighting);
    // Same top-lit relationship as the hardware body above, so a wrapped tube
    // and a bare one are lit by the same imagined window.
    const wrapGrad = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
    wrapGrad.addColorStop(0, shadeHex(face, -0.08));
    wrapGrad.addColorStop(0.28, shadeHex(face, 0.025));
    wrapGrad.addColorStop(0.62, face);
    wrapGrad.addColorStop(1, shadeHex(face, -0.22));
    ctx.globalAlpha = coverage;
    ctx.fillStyle = wrapGrad;
    traceCylinderBody(ctx, tl, tr, halfH, u, pv, endScale);
    ctx.fill();
    ctx.globalAlpha = 1;

    // The layer edge where the outermost wrap laps over the one beneath. One
    // faint line low on the roll is enough to read as wound layers; a stack of
    // them turns the tube into a set of stripes.
    const seam = halfH * -0.45;
    ctx.strokeStyle = shadowRgba(0.055 * coverage);
    ctx.lineWidth = Math.max(1, scaleToBlind(0.8, avgW));
    ctx.beginPath();
    ctx.moveTo(tl[0] + pv[0] * seam, tl[1] + pv[1] * seam);
    ctx.lineTo(tr[0] + pv[0] * seam * endScale, tr[1] + pv[1] * seam * endScale);
    ctx.stroke();

    // Where the fabric leaves the roll and becomes the hanging drop it turns
    // through a tight radius and self-shadows. Without this the wrap and the
    // fabric below it merge into one flat shape at the same colour.
    const tangent = halfH * -0.82;
    ctx.strokeStyle = shadowRgba(0.10 * coverage);
    ctx.lineWidth = Math.max(1, scaleToBlind(1, avgW));
    ctx.beginPath();
    ctx.moveTo(tl[0] + pv[0] * tangent, tl[1] + pv[1] * tangent);
    ctx.lineTo(tr[0] + pv[0] * tangent * endScale, tr[1] + pv[1] * tangent * endScale);
    ctx.stroke();
  }

  // --- END CAPS: Only visible on the NEAR side (toward viewer)
  // TRUE 3D PERSPECTIVE:
  // yRot > 0 (viewer to LEFT): see LEFT end cap, right end hidden
  // yRot < 0 (viewer to RIGHT): see RIGHT end cap, left end hidden
  // yRot ≈ 0 (flat): both caps show as small ellipses
  //
  // BEFORE: showLeftCap = yRotation < -0.05 || isFlat (WRONG - backwards)
  // AFTER:  showLeftCap = yRotation > 0.05 || isFlat (viewer to LEFT sees left)
  const capW = Math.max(3, scaleToBlind(6, avgW));
  const capColor = litHardwareHex('#F2F1EF',lighting);
  const isFlat = Math.abs(yRotation) < 0.05;
  const showLeftCap = yRotation > 0.05 || isFlat;   // viewer to LEFT sees left end
  const showRightCap = yRotation < -0.05 || isFlat; // viewer to RIGHT sees right end

  // End cap width scales with viewing angle — bigger when more visible
  const depthScale = Math.abs(yRotation);
  const capScale = isFlat ? 0.4 : Math.min(1.0, 0.3 + depthScale * 1.5);

  ctx.fillStyle = capColor;
  if (showLeftCap) {
    traceEndCapOval(ctx, tl, halfH * 0.92, capW * capScale, u, pv);
    ctx.fill();
  }
  if (showRightCap) {
    traceEndCapOval(ctx, tr, halfH * 0.92 * endScale, capW * capScale, u, pv);
    ctx.fill();
  }
  // Subtle shadow on the inner edge of each cap
  ctx.strokeStyle = shadowRgba(0.08);
  ctx.lineWidth = 1;
  if (showLeftCap) {
    traceEndCapOval(ctx, tl, halfH * 0.92, capW * capScale * 0.7, u, pv);
    ctx.stroke();
  }
  if (showRightCap) {
    traceEndCapOval(ctx, tr, halfH * 0.92 * endScale, capW * capScale * 0.7, u, pv);
    ctx.stroke();
  }

  // --- TOP HIGHLIGHT
  const hi = halfH * 0.75;
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tl[0] + pv[0] * hi, tl[1] + pv[1] * hi);
  ctx.lineTo(tr[0] + pv[0] * hi * endScale, tr[1] + pv[1] * hi * endScale);
  ctx.stroke();

  // --- BOTTOM SHADOW
  ctx.strokeStyle = shadowRgba(0.12);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tl[0] - pv[0] * halfH * 0.85, tl[1] - pv[1] * halfH * 0.85);
  ctx.lineTo(tr[0] - pv[0] * halfH * 0.85 * endScale, tr[1] - pv[1] * halfH * 0.85 * endScale);
  ctx.stroke();

  ctx.restore();
  ctx.restore();

  return halfH;
};

/** Bottom rail — a cylindrical bar with a horizontal highlight band and
 * WHITE end caps (always white regardless of rail color, matching product
 * photo Bottom_bar.jpg). Height is 1.8% of blind height per spec. */
const drawBottomRail = (
  ctx: CanvasRenderingContext2D,
  railTL: Point,
  railTR: Point,
  fabBL: Point,
  fabBR: Point,
  hardwareColourName: 'white' | 'black' | 'chrome' | undefined,
  safeHardwareColor: string,
  avgW: number,
  yRotation = 0, // window rotation for end cap visibility
  lighting: BlindLighting = NEUTRAL_BLIND_LIGHT,
) => {
  const { u, pv } = axesFor(railTL, railTR);
  // Centreline between the rail's top and the fabric's bottom edge, so the
  // tube sits exactly in the band the caller allocated for it.
  const midL: Point = [(railTL[0] + fabBL[0]) / 2, (railTL[1] + fabBL[1]) / 2];
  const midR: Point = [(railTR[0] + fabBR[0]) / 2, (railTR[1] + fabBR[1]) / 2];
  const halfH = Math.max(1, Math.hypot(fabBL[0] - railTL[0], fabBL[1] - railTL[1]) / 2);
  const endScale = Math.max(0.1,Math.min(10,Math.hypot(fabBR[0]-railTR[0],fabBR[1]-railTR[1])/(2*halfH)));
  const base = litHardwareHex(hardwareBaseHex(hardwareColourName, safeHardwareColor),lighting);

  ctx.save();

  // --- BODY: cylindrical profile with metallic gradient similar to cassette
  // but at the smaller 1.8% height. The product photo shows a horizontal
  // highlight band across the face.
  const top: Point = [midL[0] + pv[0] * halfH, midL[1] + pv[1] * halfH];
  const bot: Point = [midL[0] - pv[0] * halfH, midL[1] - pv[1] * halfH];
  traceCylinderBody(ctx, midL, midR, halfH, u, pv, endScale);
  if (hardwareColourName === 'chrome') {
    setHardwareFill(ctx, hardwareColourName, safeHardwareColor, top, bot, lighting);
  } else {
    // Metallic gradient with highlight band in upper portion
    const g = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
    g.addColorStop(0, shadeHex(base, -0.06));
    g.addColorStop(0.16, shadeHex(base, 0.065));  // highlight band
    g.addColorStop(0.32, shadeHex(base, 0.01));
    g.addColorStop(0.65, base);
    g.addColorStop(1, shadeHex(base, -0.16));
    ctx.fillStyle = g;
  }
  ctx.fill();

  ctx.save();
  traceCylinderBody(ctx, midL, midR, halfH, u, pv, endScale);
  ctx.clip();

  // --- END CAPS: ALWAYS WHITE regardless of rail color, matching product photo.
  // TRUE 3D PERSPECTIVE (same logic as cassette):
  // yRot > 0 (viewer to LEFT): see LEFT end cap, right end hidden
  // yRot < 0 (viewer to RIGHT): see RIGHT end cap, left end hidden
  // yRot ≈ 0 (flat): both caps show as small ellipses
  const capW = Math.max(2, scaleToBlind(4, avgW));
  const endCapColor = litHardwareHex('#F2F1EF',lighting);
  const isFlat = Math.abs(yRotation) < 0.05;
  const showLeftCap = yRotation > 0.05 || isFlat;   // viewer to LEFT sees left end
  const showRightCap = yRotation < -0.05 || isFlat; // viewer to RIGHT sees right end

  // End cap width scales with viewing angle
  const depthScale = Math.abs(yRotation);
  const capScale = isFlat ? 0.4 : Math.min(1.0, 0.3 + depthScale * 1.5);

  ctx.fillStyle = endCapColor;
  if (showLeftCap) {
    traceEndCapOval(ctx, midL, halfH * 0.92, capW * capScale, u, pv);
    ctx.fill();
  }
  if (showRightCap) {
    traceEndCapOval(ctx, midR, halfH * 0.92 * endScale, capW * capScale, u, pv);
    ctx.fill();
  }
  // Subtle inner shadow on caps
  ctx.strokeStyle = shadowRgba(0.12);
  ctx.lineWidth = 1;
  if (showLeftCap) {
    traceEndCapOval(ctx, midL, halfH * 0.92, capW * capScale * 0.6, u, pv);
    ctx.stroke();
  }
  if (showRightCap) {
    traceEndCapOval(ctx, midR, halfH * 0.92 * endScale, capW * capScale * 0.6, u, pv);
    ctx.stroke();
  }

  // --- TOP FACE HIGHLIGHT: bright line along the crown
  const hi = halfH * 0.7;
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(midL[0] + pv[0] * hi, midL[1] + pv[1] * hi);
  ctx.lineTo(midR[0] + pv[0] * hi * endScale, midR[1] + pv[1] * hi * endScale);
  ctx.stroke();

  ctx.restore();
  ctx.restore();
};

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
  // Curtain-specific
  productCategory?: 'blind' | 'curtain' | 'wardrobe' | 'shelving';
  curtainType?: 'blockout' | 'sheer';
  curtainOperation?: 'manual' | 'motorised';
  curtainMount?: 'ceiling' | 'window';
  curtainFold?: 'boxpleat' | 'pencilpleat' | 'pinchpleat' | 'sfold';
}

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
  const { blindType, productCategory } = params;

  // Dispatch to new curtain renderer if category is curtain
  if (productCategory === 'curtain') {
    drawNewCurtainArea(ctx, glStateRef, glUnavailableRef, W, H, params, fabricImgs);
    return;
  }

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
  const lighting = lightingFor(photo,W,H,corners);

  const [tl, tr, br, bl] = corners;
  const topW = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
  const bottomW = Math.hypot(br[0] - bl[0], br[1] - bl[1]);
  const avgW = (topW + bottomW) / 2;
  const leftH = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
  const rightH = Math.hypot(br[0] - tr[0], br[1] - tr[1]);

  // Y-axis rotation for end cap visibility (same formula as brackets)
  const yRotation = Math.max(-1, Math.min(1,
    (leftH - rightH) / (leftH + rightH) * 3
  ));

  // Project every drop and rail from the same physical plane. Screen-space
  // interpolation makes a half-raised rail aim at the wrong vanishing point.
  const plane = windowPlane(corners);
  const leftEdge = (t: number): Point => plane(0, t);
  const rightEdge = (t: number): Point => plane(1, t);
  const topEdge = (t: number): Point => plane(t, 0);

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
    // Sunscreen's radius is colour-driven: a dark screen is nearly a window and
    // wants the view almost sharp, a white one scatters it away. See
    // sunscreenDiffusionPx.
    if (type === 'sunscreen') {
      drawBackgroundDiffusion(ctx, photo, W, H, fabricQuad, scaleToBlind(sunscreenDiffusionPx(fabricColor), avgW));
    } else if (type === 'lightfilter') {
      // Broad silhouettes survive the cloth; leaves and other fine detail
      // dissolve into soft light, as in the shop's light-filter photograph.
      drawBackgroundDiffusion(ctx, photo, W, H, fabricQuad, scaleToBlind(14, avgW));
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

      // Preserve weave scale and keep the cloth attached to its bottom rail
      // while it winds into the roller. Mirrored sampling avoids tile seams.
      const surface = surfaceFor(type);
      const {uvScale,uvOffset} = blindTextureCoordinates(surface.tileX,avgW,leftH,p);

      if (type === 'sheer') {
        // Two panels with a centre gap, like a pair of sheer curtains
        const gap = (avgW * 0.04) / avgW / 2; // as fraction of top edge
        const midT = topEdge(0.5 - gap);
        const midT2 = topEdge(0.5 + gap);
        const midBp = plane(0.5 - gap, p);
        const midB2p = plane(0.5 + gap, p);
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
        // Blockout reflects room light; light filter passes soft silhouettes
        // through a woven surface. Sunscreen retains colour-dependent
        // visibility through the mesh.
        drawQuad(state, [tl, tr, fabBR, fabBL], fabricTexture, {
          tint,
          textureAmount: type === 'sunscreen'
            ? sunscreenTextureAmount(surface.textureAmount, fabricColor)
            : surface.textureAmount,
          opacity: fabricOpacityFor(type, fabricColor),
          uvScale,
          shade: true,
          folds: 0,
          shaderType: shaderTypeFor(type),
          lighting, uvOffset, dropFraction:p,
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
      ctx.fillStyle = rgba(fabricColor, fabricOpacityFor(type, fabricColor));
      ctx.fill();
      ctx.restore();
    }

    // The shader carries the fabric lighting. Only a narrow frame contact
    // shadow is added here; repeated broad overlays made the blind bevelled.
    drawAmbientOcclusion(ctx, tl, tr, fabBR, fabBL);

    // --- LIGHT LEAK — warm daylight escaping the fabric's perimeter, at the
    // intensity this fabric's opacity implies. Drawn after the AO so the
    // glow sits over the shadow band at the edge, which is the real
    // relationship: the leak is in front of the recess, not behind it.
    drawLightLeak(ctx, type, tl, tr, fabBL, fabBR, avgW);
  } // end showBlind (depth + fabric)

  // --- CASSETTE — always drawn (not gated on showBlind) since
  // the hardware itself is always present regardless of roll position. ---
  // The roll state is what makes the tube thicken from 45mm to 65mm as the
  // fabric winds on, and what puts the fabric's own colour (or a blockout's
  // white reverse) onto it.
  const cassetteHalfH = drawCassette(
    ctx, tl, tr, leftH, hardwareColourName, safeHardwareColor, avgW, yRotation,
    { p, blindType: type, fabricColor, lighting, plane },
  );

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
    drawBottomRail(ctx, railTL, railTR, fabBL, fabBR, hardwareColourName, safeHardwareColor, avgW, yRotation, lighting);

    // --- BOTTOM RAIL DROP SHADOW — the rail hangs in space; it casts a
    // shadow up onto the fabric directly behind it. ---
    drawRailDropShadow(ctx, tl, tr, railTL, railTR, leftH,
      reach => [leftEdge(railT-reach/leftH), rightEdge(railT-reach/leftH)]);
  }

  // --- CONTACT SHADOW — cast just below the rail, wherever the rail
  // currently sits. No roll-position threshold: now that it is anchored to
  // the rail rather than the sill it stays correct at every position, and
  // gating it caused a visible pop partway through the roll. ---
  if (showBlind) {
    drawContactShadow(ctx, fabBL, fabBR,
      reach => [leftEdge(p+reach/leftH), rightEdge(p+reach/leftH)]);
  }

  // --- CHAIN — not rendered. showChain/chainSide/controlType are kept as
  // valid params for API compatibility, but nothing is drawn.
  void chainSide;
  void showChain;
  void controlType;

  if (showBlind && type === 'sheer') drawVignette(ctx, fabricQuad, true);
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
 * behind it. Slightly clearer than the same sunscreen standalone: it sits behind
 * the blockout, and where both overlap the pair would otherwise read as one
 * thick sheet. A fraction rather than a fixed number so it inherits the
 * standalone path's colour-driven view-through — a dual with a charcoal screen
 * shows the view through its exposed strip just as a standalone one does. */
const DUAL_BACK_OPACITY_SCALE = 0.85;

const dualBackOpacity = (fabricColor: string): number =>
  fabricOpacityFor('sunscreen', fabricColor) * DUAL_BACK_OPACITY_SCALE;

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

  const lighting = lightingFor(photo,W,H,corners);
  const [tl, tr, br, bl] = corners;
  const topW = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
  const bottomW = Math.hypot(br[0] - bl[0], br[1] - bl[1]);
  const avgW = (topW + bottomW) / 2;
  const leftH = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
  const rightH = Math.hypot(br[0] - tr[0], br[1] - tr[1]);

  // Y-axis rotation for end cap visibility (same formula as brackets)
  const yRotation = Math.max(-1, Math.min(1,
    (leftH - rightH) / (leftH + rightH) * 3
  ));

  const plane = windowPlane(corners);
  const leftEdge = (t: number): Point => plane(0, t);
  const rightEdge = (t: number): Point => plane(1, t);

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
    drawBackgroundDiffusion(ctx, photo, W, H, fabricQuad, scaleToBlind(sunscreenDiffusionPx(fabricColor), avgW));
    drawPreFabricDepth(ctx, fabricQuad);
  }

  /** Draws one roller's fabric quad plus its fold-line texture. The two
   * layers share the selected colour but not the fabric: `texturePath` and
   * `opacity` are what make the back read as sunscreen mesh and the front as
   * solid blockout. */
  /** `surfaceType` names which fabric this layer actually IS, so each half of
   * a dual gets its own weave density and deviation amount — the front is a
   * blockout and the back a sunscreen, and they are tuned differently. */
  const drawFabricLayer = (
    dropP: number,
    texturePath: string,
    opacity: number,
    surfaceType: string,
  ) => {
    const layerBL = leftEdge(dropP);
    const layerBR = rightEdge(dropP);
    const surface = surfaceFor(surfaceType);

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
      const {uvScale,uvOffset} = blindTextureCoordinates(surface.tileX,avgW,leftH,dropP);
      if (fabricTexture) {
        drawQuad(state, [tl, tr, layerBR, layerBL], fabricTexture, {
          tint,
          textureAmount: surfaceType === 'sunscreen'
            ? sunscreenTextureAmount(surface.textureAmount, fabricColor)
            : surface.textureAmount,
          opacity,
          uvScale,
          shade: true,
          folds: 0,
          shaderType: shaderTypeFor(surfaceType),
          lighting, uvOffset, dropFraction:dropP,
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
    drawFabricLayer(backP, DUAL_BACK_TEXTURE, dualBackOpacity(fabricColor), 'sunscreen');

    // --- FRONT LAYER — blockout on the room side, opaque, drawn on top and
    // stopping short so the sunscreen stays visible beneath it. ---
    drawFabricLayer(frontP, DUAL_FRONT_TEXTURE, 1, 'blockout');
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
    const stripL = leftEdge(frontP+stripH/leftH), stripR = rightEdge(frontP+stripH/leftH);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(...frontBL, ...stripL);
    g.addColorStop(0, 'rgba(255,245,230,0.08)');
    g.addColorStop(0.45, 'rgba(255,245,230,0.03)');
    g.addColorStop(1, 'rgba(255,245,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(frontBL[0], frontBL[1]);
    ctx.lineTo(frontBR[0], frontBR[1]);
    ctx.lineTo(...stripR);
    ctx.lineTo(...stripL);
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
      const shadowL = leftEdge(frontP+reach/leftH), shadowR = rightEdge(frontP+reach/leftH);
      const g = ctx.createLinearGradient(...frontBL, ...shadowL);
      g.addColorStop(0, shadowRgba(alpha));
      g.addColorStop(1, shadowRgba(0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(frontBL[0], frontBL[1]);
      ctx.lineTo(frontBR[0], frontBR[1]);
      ctx.lineTo(...shadowR);
      ctx.lineTo(...shadowL);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  // --- LIGHTING — over the back layer, which is the lower of the two, so
  // the fabric-only AO band spans exactly the fabric that is showing ---
  if (showBlind) {
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
  //
  // The two tubes wind different fabrics different ways, and each tracks its own
  // roller's position: the back one carries the sunscreen face-out and takes the
  // selected colour, the front one carries the blockout and shows its white
  // reverse. Passing one shared roll state would have put a blockout's white on
  // the sunscreen tube as well.
  drawCassette(
    ctx, backCassetteTL, backCassetteTR, leftH * 0.85, hardwareColourName, safeHardwareColor, avgW, yRotation,
    { p: backP, blindType: 'sunscreen', fabricColor, lighting, plane },
  );
  const cassetteHalfH = drawCassette(
    ctx, tl, tr, leftH, hardwareColourName, safeHardwareColor, avgW, yRotation,
    { p: frontP, blindType: 'blockout', fabricColor, lighting, plane },
  );

  if (showBlind) {
    drawCassetteMountShadow(ctx, tl, tr, frontBL, frontBR, cassetteHalfH, leftH, avgW);

    // --- RAILS — the front layer's rail sits higher; the back layer's rail
    // rides its own bottom edge. Both wind up with their layer. ---
    const railHeight = leftH * RAIL_HEIGHT_RATIO;
    const frontRailT = Math.max(0, frontP - railHeight / leftH);
    drawBottomRail(ctx, leftEdge(frontRailT), rightEdge(frontRailT), frontBL, frontBR, hardwareColourName, safeHardwareColor, avgW, yRotation, lighting);
    drawRailDropShadow(ctx, tl, tr, leftEdge(frontRailT), rightEdge(frontRailT), leftH,
      reach => [leftEdge(frontRailT-reach/leftH), rightEdge(frontRailT-reach/leftH)]);

    const backRailT = Math.max(0, backP - railHeight / leftH);
    drawBottomRail(ctx, leftEdge(backRailT), rightEdge(backRailT), backBL, backBR, hardwareColourName, safeHardwareColor, avgW, yRotation, lighting);
    drawContactShadow(ctx, backBL, backBR,
      reach => [leftEdge(backP+reach/leftH), rightEdge(backP+reach/leftH)]);
  }
};

// ---------------------------------------------------------------------------
// New Curtains — track at top with fold types: S-fold, pencil pleat,
// pinch pleat, box pleat. Two panels meeting at centre.
//
// WINDOW MOUNT (Top Fit): Track at tl→tr, curtain fills window frame exactly.
// CEILING MOUNT (Face Fit): Track 20% above tl, extends 20% beyond frame each
// side, curtain covers window frame and wall above/beside it.
// ---------------------------------------------------------------------------

const drawNewCurtainArea = (
  ctx: CanvasRenderingContext2D,
  _glStateRef: React.MutableRefObject<GLState | null>,
  _glUnavailableRef: React.MutableRefObject<boolean>,
  _W: number,
  _H: number,
  params: AreaParams,
  _fabricImgs: FabricImages
) => {
  const {
    corners,
    fabricColor,
    rollPosition = 1,
    curtainType = 'sheer',
    curtainOperation = 'manual',
    curtainMount = 'ceiling',
    curtainFold = 'sfold',
  } = params;
  const hardwareColourName = params.hardwareColourName;

  const [tl, tr, br, bl] = corners;
  const topW = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
  const bottomW = Math.hypot(br[0] - bl[0], br[1] - bl[1]);
  const avgW = (topW + bottomW) / 2;
  const leftH = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);

  // Edge direction vectors for perspective-correct extensions
  const { u } = axesFor(tl, tr);
  const [ux, uy] = u;

  // Left edge direction (tl to bl)
  const leftDx = bl[0] - tl[0];
  const leftDy = bl[1] - tl[1];
  const leftLen = Math.hypot(leftDx, leftDy) || 1;
  const leftUx = leftDx / leftLen;
  const leftUy = leftDy / leftLen;

  // Right edge direction (tr to br)
  const rightDx = br[0] - tr[0];
  const rightDy = br[1] - tr[1];
  const rightLen = Math.hypot(rightDx, rightDy) || 1;
  const rightUx = rightDx / rightLen;
  const rightUy = rightDy / rightLen;

  // Curtain position: 0 = fully open, 1 = fully closed
  const p = Math.max(0, Math.min(1, rollPosition));
  const openAmount = 1 - p;

  // Fabric opacity based on type
  const fabricOpacity = curtainType === 'sheer' ? 0.45 : 1;

  // Compute curtain area based on mount type
  let trackTL: Point, trackTR: Point;
  let curtainTL: Point, curtainTR: Point, curtainBL: Point, curtainBR: Point;

  if (curtainMount === 'window') {
    // WINDOW MOUNT: Track at top of window frame, curtain within frame
    trackTL = [tl[0], tl[1]];
    trackTR = [tr[0], tr[1]];
    curtainTL = tl;
    curtainTR = tr;
    curtainBL = bl;
    curtainBR = br;
  } else {
    // CEILING MOUNT: Track above window, extends beyond frame
    // Track position: 20% of window height above tl/tr
    const heightOffset = leftH * 0.20;
    // Track extends 20% of window width beyond each side
    const widthExtension = avgW * 0.20;

    // Move track up along the left/right edge directions (perspective-correct)
    // Since edges converge at vanishing point, we move OPPOSITE to edge direction
    trackTL = [
      tl[0] - leftUx * heightOffset - ux * widthExtension,
      tl[1] - leftUy * heightOffset - uy * widthExtension,
    ];
    trackTR = [
      tr[0] - rightUx * heightOffset + ux * widthExtension,
      tr[1] - rightUy * heightOffset + uy * widthExtension,
    ];

    // Curtain top follows track
    curtainTL = trackTL;
    curtainTR = trackTR;

    // Curtain bottom extends slightly past sill (5% below)
    const bottomExtension = leftH * 0.05;
    curtainBL = [
      bl[0] + leftUx * bottomExtension - ux * widthExtension,
      bl[1] + leftUy * bottomExtension - uy * widthExtension,
    ];
    curtainBR = [
      br[0] + rightUx * bottomExtension + ux * widthExtension,
      br[1] + rightUy * bottomExtension + uy * widthExtension,
    ];
  }

  // Interpolation helpers for the curtain area
  const curtainTopEdge = (t: number): Point => [
    curtainTL[0] + (curtainTR[0] - curtainTL[0]) * t,
    curtainTL[1] + (curtainTR[1] - curtainTL[1]) * t,
  ];
  const curtainBottomEdge = (t: number): Point => [
    curtainBL[0] + (curtainBR[0] - curtainBL[0]) * t,
    curtainBL[1] + (curtainBR[1] - curtainBL[1]) * t,
  ];

  // --- DEPTH (pre-fabric) — only for the original window area ---
  drawPreFabricDepth(ctx, corners);

  // Stack-back maximum: compressed stack never exceeds 1/3 of total curtain width
  // This prevents panels from going outside track boundaries
  const maxStackFrac = 1 / 3; // Each stack is at most 1/3 of total width
  const panelWidthFrac = 0.5; // Each panel covers half the track width when closed

  // Calculate where each panel should be based on openAmount
  // At openness 0: panels at 0-0.5 and 0.5-1 (meeting at centre)
  // At openness 1: left stack at 0 to maxStackFrac, right stack at (1-maxStackFrac) to 1
  const leftStackStart = 0;
  const leftStackEnd = maxStackFrac * openAmount + panelWidthFrac * (1 - openAmount);
  const rightStackStart = 1 - (maxStackFrac * openAmount + panelWidthFrac * (1 - openAmount));
  const rightStackEnd = 1;

  // Clamp panel positions to stay within track (0 to 1)
  const leftPanelQuad: Point[] = [
    curtainTopEdge(Math.max(0, leftStackStart)),
    curtainTopEdge(Math.min(1, leftStackEnd)),
    curtainBottomEdge(Math.min(1, leftStackEnd)),
    curtainBottomEdge(Math.max(0, leftStackStart)),
  ];
  const rightPanelQuad: Point[] = [
    curtainTopEdge(Math.max(0, rightStackStart)),
    curtainTopEdge(Math.min(1, rightStackEnd)),
    curtainBottomEdge(Math.min(1, rightStackEnd)),
    curtainBottomEdge(Math.max(0, rightStackStart)),
  ];

  // --- FABRIC PANELS ---
  const drawPanel = (quad: Point[], isLeftPanel: boolean) => {
    const [qtl, qtr, qbr, qbl] = quad;
    const panelW = Math.hypot(qtr[0] - qtl[0], qtr[1] - qtl[1]);
    const panelH = Math.hypot(qbl[0] - qtl[0], qbl[1] - qtl[1]);

    // Draw base fabric
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(qtl[0], qtl[1]);
    ctx.lineTo(qtr[0], qtr[1]);
    ctx.lineTo(qbr[0], qbr[1]);
    ctx.lineTo(qbl[0], qbl[1]);
    ctx.closePath();
    ctx.fillStyle = rgba(fabricColor, fabricOpacity);
    ctx.fill();
    ctx.restore();

    // Draw fold variations based on type
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(qtl[0], qtl[1]);
    ctx.lineTo(qtr[0], qtr[1]);
    ctx.lineTo(qbr[0], qbr[1]);
    ctx.lineTo(qbl[0], qbl[1]);
    ctx.closePath();
    ctx.clip();

    const foldCount = curtainFold === 'sfold' ? 7 : curtainFold === 'pencilpleat' ? 9 : curtainFold === 'pinchpleat' ? 5 : 5;

    // Sequential fold collapse: compute each fold's collapse state
    // Left panel: fold 0 is outer (wall), fold N is inner (centre)
    // Right panel: fold N is outer (wall), fold 0 is inner (centre)

    for (let i = 0; i <= foldCount; i++) {
      const t = i / foldCount;

      // Distance from outer edge: 0 = outer (wall), 1 = inner (centre)
      // Left panel: t=0 is outer, t=1 is inner
      // Right panel: t=1 is outer, t=0 is inner
      const distFromOuter = isLeftPanel ? t : (1.0 - t);

      // Collapse amount with smooth transition (0.3 transition zone)
      const rawCollapse = (distFromOuter - (1.0 - openAmount)) / 0.3;
      const localCollapse = Math.max(0, Math.min(1, rawCollapse));
      // Smooth the collapse with an ease function
      const smoothCollapse = localCollapse * localCollapse * (3 - 2 * localCollapse); // smoothstep

      // Collapsed folds: narrower (higher effective frequency), shallower (lower amplitude)
      // This creates tighter, smaller folds — bunched fabric, not magnified zigzags
      const collapseScale = 1.0 - smoothCollapse * 0.6; // Fold width reduces to 40% when collapsed
      const collapseOffset = smoothCollapse * (1.0 - distFromOuter) * 0.78; // Pull toward outer edge

      // Adjusted position with collapse compression
      const adjustedT = isLeftPanel
        ? t * collapseScale + collapseOffset
        : 1.0 - ((1.0 - t) * collapseScale + collapseOffset);

      // Clamp adjusted position to stay within panel bounds
      const clampedT = Math.max(0, Math.min(1, adjustedT));

      const topPt: Point = [qtl[0] + (qtr[0] - qtl[0]) * clampedT, qtl[1] + (qtr[1] - qtl[1]) * clampedT];
      const botPt: Point = [qbl[0] + (qbr[0] - qbl[0]) * clampedT, qbl[1] + (qbr[1] - qbl[1]) * clampedT];

      // Folds spread wider at bottom, but less so when collapsed
      const spreadFactor = (1 + 0.1 * (1 - t)) * (1.0 - smoothCollapse * 0.5);

      if (curtainFold === 'sfold') {
        // S-fold: smooth continuous curves with alternating light/dark
        const isPeak = i % 2 === 0;

        // Vertical strip for fold — narrower when collapsed (tighter bunching)
        const baseStripW = panelW / foldCount * 0.9;
        const stripW = baseStripW * collapseScale;
        const stripLeft: Point = [topPt[0] - stripW / 2, topPt[1]];
        const stripRight: Point = [topPt[0] + stripW / 2, topPt[1]];
        const stripBotLeft: Point = [botPt[0] - stripW / 2 * spreadFactor, botPt[1]];
        const stripBotRight: Point = [botPt[0] + stripW / 2 * spreadFactor, botPt[1]];

        ctx.beginPath();
        ctx.moveTo(stripLeft[0], stripLeft[1]);
        ctx.lineTo(stripRight[0], stripRight[1]);
        ctx.lineTo(stripBotRight[0], stripBotRight[1]);
        ctx.lineTo(stripBotLeft[0], stripBotLeft[1]);
        ctx.closePath();

        // Fold shadow contrast: Peak at 115% brightness, Trough at 78%
        // Collapsed folds are darker (bunched fabric)
        const collapseDarken = localCollapse * 15;
        if (isPeak) {
          ctx.fillStyle = lighten(fabricColor, 12 - collapseDarken);
        } else {
          ctx.fillStyle = darken(fabricColor, 22 + collapseDarken);
        }
        ctx.globalAlpha = 0.5 + localCollapse * 0.3; // More opaque when collapsed
        ctx.fill();
        ctx.globalAlpha = 1;

      } else if (curtainFold === 'pencilpleat') {
        // Pencil pleat: dense heading band at top, soft waves below
        const headingH = panelH * 0.08;

        // Heading band - darker with dense vertical lines
        if (i === 0) {
          ctx.fillStyle = darken(fabricColor, 20);
          ctx.fillRect(qtl[0], qtl[1], panelW, headingH);

          // Dense vertical lines in heading
          ctx.strokeStyle = darken(fabricColor, 40);
          ctx.lineWidth = 1;
          for (let j = 0; j < foldCount * 3; j++) {
            const lt = j / (foldCount * 3);
            const lx = qtl[0] + panelW * lt;
            ctx.beginPath();
            ctx.moveTo(lx, qtl[1]);
            ctx.lineTo(lx + (j % 2 === 0 ? 2 : -2), qtl[1] + headingH);
            ctx.stroke();
          }
        }

        // Soft wave below heading
        if (i > 0 && i < foldCount) {
          const waveAmp = panelW * 0.01;
          ctx.strokeStyle = shadowRgba(0.12);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const startY = topPt[1] + headingH;
          ctx.moveTo(topPt[0], startY);
          const midX = (topPt[0] + botPt[0]) / 2 + (i % 2 === 0 ? waveAmp : -waveAmp);
          const midY = (startY + botPt[1]) / 2;
          ctx.quadraticCurveTo(midX, midY, botPt[0], botPt[1]);
          ctx.stroke();
        }

      } else if (curtainFold === 'pinchpleat') {
        // Pinch pleat: distinct pinch points with flat panels between
        const pinchSpacing = panelW / 5;

        if (i > 0 && i < foldCount) {
          // Pinch point - dark triangle at heading
          const pinchX = topPt[0];
          const pinchY = topPt[1];
          const pinchW = pinchSpacing * 0.3;
          const pinchH = panelH * 0.06;

          ctx.fillStyle = darken(fabricColor, 45);
          ctx.beginPath();
          ctx.moveTo(pinchX - pinchW / 2, pinchY);
          ctx.lineTo(pinchX + pinchW / 2, pinchY);
          ctx.lineTo(pinchX, pinchY + pinchH);
          ctx.closePath();
          ctx.fill();

          // Flat panel between pinches - slightly lighter
          if (i % 2 === 0) {
            const pLeft = pinchX - pinchSpacing * 0.4;
            const pRight = pinchX + pinchSpacing * 0.4;
            ctx.fillStyle = lighten(fabricColor, 8);
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(pLeft, pinchY + pinchH);
            ctx.lineTo(pRight, pinchY + pinchH);
            ctx.lineTo(pRight + panelW * 0.02, botPt[1]);
            ctx.lineTo(pLeft - panelW * 0.02, botPt[1]);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          // Gentle fold line from pinch
          ctx.strokeStyle = shadowRgba(0.08);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pinchX, pinchY + pinchH);
          ctx.lineTo(botPt[0], botPt[1]);
          ctx.stroke();
        }

      } else if (curtainFold === 'boxpleat') {
        // Box pleat: structured flat panels with sharp fold lines
        if (i > 0 && i < foldCount) {
          // Sharp vertical shadow line - 8px wide
          const shadowW = 8;
          ctx.fillStyle = darken(fabricColor, 50);
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(topPt[0] - shadowW / 2, topPt[1]);
          ctx.lineTo(topPt[0] + shadowW / 2, topPt[1]);
          ctx.lineTo(botPt[0] + shadowW / 2, botPt[1]);
          ctx.lineTo(botPt[0] - shadowW / 2, botPt[1]);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    ctx.restore();

    // --- FABRIC SHADOWS (S-fold troughs) ---
    if (curtainFold === 'sfold') {
      for (let i = 1; i < foldCount; i++) {
        const t = i / foldCount;
        if (i % 2 === 1) {
          const topPt: Point = [qtl[0] + (qtr[0] - qtl[0]) * t, qtl[1] + (qtr[1] - qtl[1]) * t];
          const botPt: Point = [qbl[0] + (qbr[0] - qbl[0]) * t, qbl[1] + (qbr[1] - qbl[1]) * t];

          ctx.save();
          const grad = ctx.createLinearGradient(topPt[0] - 5, topPt[1], topPt[0] + 5, topPt[1]);
          grad.addColorStop(0, shadowRgba(0));
          grad.addColorStop(0.5, shadowRgba(0.15));
          grad.addColorStop(1, shadowRgba(0));
          ctx.strokeStyle = grad;
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(topPt[0], topPt[1]);
          ctx.lineTo(botPt[0], botPt[1]);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  };

  // Draw both panels
  drawPanel(leftPanelQuad, true);
  drawPanel(rightPanelQuad, false);

  // --- TRACK ---
  ctx.save();

  // Track dimensions: 4% of window height
  const trackThickness = leftH * 0.04;

  // Hardware material colours per spec (edge = shadow for white/black)
  const TRACK_COLOURS: Record<'white' | 'black' | 'chrome', { base: string; highlight: string; edge: string }> = {
    white: { base: '#F0EEE9', highlight: '#FFFFFF', edge: '#D8D6D0' },
    black: { base: '#303030', highlight: '#3E3A34', edge: '#1A1816' },
    chrome: { base: '#C8C8C8', highlight: '#E8E8E8', edge: '#888888' },
  };

  const colours = hardwareColourName && TRACK_COLOURS[hardwareColourName]
    ? TRACK_COLOURS[hardwareColourName]
    : TRACK_COLOURS.white;

  // Track gradient based on material
  if (hardwareColourName === 'chrome') {
    // Chrome: linear gradient silver — centre bright, edges darker, top highlight
    const trackGrad = ctx.createLinearGradient(
      trackTL[0], trackTL[1] - trackThickness / 2,
      trackTL[0], trackTL[1] + trackThickness / 2
    );
    trackGrad.addColorStop(0, colours.edge);
    trackGrad.addColorStop(0.15, colours.highlight);
    trackGrad.addColorStop(0.5, colours.base);
    trackGrad.addColorStop(0.85, colours.highlight);
    trackGrad.addColorStop(1, colours.edge);
    ctx.fillStyle = trackGrad;
  } else {
    // White/Black: subtle gloss gradient
    const trackGrad = ctx.createLinearGradient(
      trackTL[0], trackTL[1] - trackThickness / 2,
      trackTL[0], trackTL[1] + trackThickness / 2
    );
    trackGrad.addColorStop(0, colours.highlight);
    trackGrad.addColorStop(0.3, colours.base);
    trackGrad.addColorStop(1, colours.edge);
    ctx.fillStyle = trackGrad;
  }

  // Draw track body
  ctx.beginPath();
  ctx.moveTo(trackTL[0], trackTL[1] - trackThickness / 2);
  ctx.lineTo(trackTR[0], trackTR[1] - trackThickness / 2);
  ctx.lineTo(trackTR[0], trackTR[1] + trackThickness / 2);
  ctx.lineTo(trackTL[0], trackTL[1] + trackThickness / 2);
  ctx.closePath();
  ctx.fill();

  // Chrome highlight line along top edge
  if (hardwareColourName === 'chrome') {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(trackTL[0], trackTL[1] - trackThickness / 2 + 1);
    ctx.lineTo(trackTR[0], trackTR[1] - trackThickness / 2 + 1);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // --- MOUNT BRACKETS (ceiling mount only) ---
  if (curtainMount === 'ceiling') {
    const bracketW = trackThickness * 0.6;
    const bracketH = leftH * 0.08; // Height extending up to ceiling
    const trackCentreX = (trackTL[0] + trackTR[0]) / 2;
    const trackCentreY = (trackTL[1] + trackTR[1]) / 2;

    const drawBracket = (x: number, y: number) => {
      ctx.save();
      // Bracket fill matches track
      if (hardwareColourName === 'chrome') {
        const bracketGrad = ctx.createLinearGradient(x - bracketW / 2, y, x + bracketW / 2, y);
        bracketGrad.addColorStop(0, colours.edge);
        bracketGrad.addColorStop(0.5, colours.base);
        bracketGrad.addColorStop(1, colours.edge);
        ctx.fillStyle = bracketGrad;
      } else {
        ctx.fillStyle = colours.base;
      }

      // Bracket body
      ctx.beginPath();
      ctx.rect(x - bracketW / 2, y - bracketH - trackThickness / 2, bracketW, bracketH);
      ctx.fill();

      // Slight shadow on bracket edge
      ctx.fillStyle = shadowRgba(0.2);
      ctx.beginPath();
      ctx.rect(x + bracketW / 2 - 1, y - bracketH - trackThickness / 2, 1, bracketH);
      ctx.fill();
      ctx.restore();
    };

    // Three brackets: left end, centre, right end
    drawBracket(trackTL[0] + bracketW, trackTL[1]);
    drawBracket(trackCentreX, trackCentreY);
    drawBracket(trackTR[0] - bracketW, trackTR[1]);
  }

  // Motor box for motorised operation
  if (curtainOperation === 'motorised') {
    const motorW = avgW * 0.06;
    const motorH = trackThickness * 1.5;

    ctx.fillStyle = hardwareColourName === 'chrome' ? colours.edge : darken(colours.base, 10);
    ctx.beginPath();
    ctx.moveTo(trackTR[0] - motorW, trackTR[1] - motorH / 2);
    ctx.lineTo(trackTR[0], trackTR[1] - motorH / 2);
    ctx.lineTo(trackTR[0], trackTR[1] + motorH / 2);
    ctx.lineTo(trackTR[0] - motorW, trackTR[1] + motorH / 2);
    ctx.closePath();
    ctx.fill();

    // Motor detail line
    ctx.strokeStyle = darken(colours.base, 30);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(trackTR[0] - motorW * 0.8, trackTR[1]);
    ctx.lineTo(trackTR[0] - motorW * 0.2, trackTR[1]);
    ctx.stroke();
  }

  ctx.restore();

  // --- TRACK SHADOW onto curtain ---
  const trackShadowH = leftH * 0.025;
  ctx.save();
  const shadowGrad = ctx.createLinearGradient(
    curtainTL[0], curtainTL[1],
    curtainTL[0], curtainTL[1] + trackShadowH
  );
  shadowGrad.addColorStop(0, shadowRgba(0.25));
  shadowGrad.addColorStop(1, shadowRgba(0));
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.moveTo(curtainTL[0], curtainTL[1]);
  ctx.lineTo(curtainTR[0], curtainTR[1]);
  ctx.lineTo(curtainTR[0], curtainTR[1] + trackShadowH);
  ctx.lineTo(curtainTL[0], curtainTL[1] + trackShadowH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // --- BOTTOM SHADOW (curtain on floor/sill) ---
  drawContactShadow(ctx, curtainBL, curtainBR);

  // --- EDGE SHADOWS (ambient occlusion where curtain meets wall) ---
  const curtainW = Math.hypot(curtainTR[0] - curtainTL[0], curtainTR[1] - curtainTL[1]);
  ctx.save();
  // Left edge
  const edgeGrad = ctx.createLinearGradient(
    curtainTL[0], curtainTL[1],
    curtainTL[0] + curtainW * 0.05, curtainTL[1]
  );
  edgeGrad.addColorStop(0, shadowRgba(0.2));
  edgeGrad.addColorStop(1, shadowRgba(0));
  ctx.fillStyle = edgeGrad;
  ctx.beginPath();
  ctx.moveTo(curtainTL[0], curtainTL[1]);
  ctx.lineTo(curtainTL[0] + curtainW * 0.05, curtainTL[1]);
  ctx.lineTo(curtainBL[0] + curtainW * 0.05, curtainBL[1]);
  ctx.lineTo(curtainBL[0], curtainBL[1]);
  ctx.closePath();
  ctx.fill();

  // Right edge
  const edgeGradR = ctx.createLinearGradient(
    curtainTR[0], curtainTR[1],
    curtainTR[0] - curtainW * 0.05, curtainTR[1]
  );
  edgeGradR.addColorStop(0, shadowRgba(0.2));
  edgeGradR.addColorStop(1, shadowRgba(0));
  ctx.fillStyle = edgeGradR;
  ctx.beginPath();
  ctx.moveTo(curtainTR[0], curtainTR[1]);
  ctx.lineTo(curtainTR[0] - curtainW * 0.05, curtainTR[1]);
  ctx.lineTo(curtainBR[0] - curtainW * 0.05, curtainBR[1]);
  ctx.lineTo(curtainBR[0], curtainBR[1]);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // --- LIGHT SHEEN (on original window area) ---
  drawLightSheen(ctx, corners);

  // --- VIGNETTE (on original window area) ---
  drawVignette(ctx, corners);
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

/** The quad an area's fabric currently covers, given the roll position. Used
 * to punch the blinds out of the room-dimming pass, so the dimming lands on
 * the room and not on the fabric that is causing it. Curtains use their full
 * opening: their panels slide rather than roll, and an 8% wash does not
 * warrant reproducing the panel geometry. */
const coveredQuadFor = (area: RenderedArea, rollPosition: number): Point[] => {
  const [tl, tr, br, bl] = area.corners;
  if (area.blindType === 'sheer-curtains' || area.blindType === 'blockout-curtains') {
    return [tl, tr, br, bl];
  }
  const p = Math.max(0, Math.min(1, rollPosition));
  const plane = windowPlane(area.corners);
  return [tl, tr, plane(1, p), plane(0, p)];
};

/** A faint cool-down over everything the blinds are NOT covering.
 *
 * A blind that is down is removing light from the room, and rendering it
 * against a photograph exposed for an undressed window quietly contradicts
 * that — the fabric reads as a sticker over an unchanged room. Dimming the
 * surroundings very slightly restores the causal relationship.
 *
 * Scaled by how far the blinds are actually down, so raising them lifts the
 * room back up rather than leaving it dim with nothing blocking the light.
 * Filled even-odd so the blinds themselves are punched out. */
const ROOM_DIM_MAX = 0.08;

const drawRoomDimming = (
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  coveredQuads: Point[][],
  coverage: number,
) => {
  const strength = ROOM_DIM_MAX * Math.max(0, Math.min(1, coverage));
  if (coveredQuads.length === 0 || strength < 0.005) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  for (const quad of coveredQuads) {
    ctx.moveTo(quad[0][0], quad[0][1]);
    for (let i = 1; i < quad.length; i++) ctx.lineTo(quad[i][0], quad[i][1]);
    ctx.closePath();
  }
  ctx.fillStyle = shadowRgba(strength);
  ctx.fill('evenodd');
  ctx.restore();
};

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
  productCategory: area.productCategory,
  curtainType: area.curtainType,
  curtainOperation: area.curtainOperation,
  curtainMount: area.curtainMount,
  curtainFold: area.curtainFold,
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
    return () => {
      const state = glStateRef.current;
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
  // Fired on mount, not deferred. All three textures together are ~384KB now
  // that they are exported at 512x512 — less than the window photo alone — so
  // there is nothing to protect the first render from and no reason to make
  // the first type change wait. (While they were 1254x1254 and ~9MB this ran
  // on requestIdleCallback, because racing them against the window photo
  // slowed the first render to speed up a later swap.)
  //
  // 512x512 is exactly POT_SIZE, so getOrUploadTexture's resample is now a
  // 1:1 copy rather than a downsample.
  //
  // Failures are ignored on purpose: this is a warm-up, and the render path
  // does its own loading and error handling.
  useEffect(() => {
    for (const path of ALL_ROLLER_TEXTURES) {
      loadImage(path).catch(() => {});
    }
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
      // Assigning width/height reallocates and clears the backing store even
      // when the value is unchanged, which during a roll animation meant a fresh
      // multi-megabyte buffer sixty times a second. The photo redraw below
      // clears it anyway.
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;
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

      // Room lighting — after every blind is down, so the wash sits over the
      // finished scene, and once for the whole canvas rather than per area
      // (per area it would stack, darkening a two-window room twice as much
      // as a one-window room for no reason).
      drawRoomDimming(
        ctx,
        W,
        H,
        confirmedAreas.map(a => coveredQuadFor(a, rollPosition)),
        rollPosition,
      );

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
      data-render-surface="blind"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
      }}
    />
  );
};

export default Canvas2DBlindRenderer;
