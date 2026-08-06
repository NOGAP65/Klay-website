import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// WAVE FOLD CURTAINS
//
// Wave fold (ripplefold) is the only heading this renderer draws. The panels
// hang from snap tape on a track, which fixes two things that the previous
// implementation got wrong:
//
//   1. The number of waves is a property of the TRACK, not of how far the
//      curtain is drawn. Carriers are sewn to the tape at a fixed spacing, so
//      a 2.4m curtain has the same wave count shut, half open, and stacked.
//      Only the spacing between them changes.
//
//   2. A wave can only compress so far. Fabric has thickness; two carriers
//      cannot occupy the same point. Once a wave reaches its minimum the
//      compression passes to the next one, and the compression front travels
//      from the leading edge (the middle of the window, where the curtain is
//      pulled from) out toward the stacking end at the wall.
//
// Both fall out of computing an explicit width for every wave in JS and
// building the mesh from those widths, rather than displacing a uniform plane
// in a vertex shader and scaling the mesh to fake the compression. The old
// approach had the shader's own x-shift fighting the mesh's scale.x, which is
// why compression kept producing boundary artifacts.
//
// Depth is solved from arc length, not faked. The fabric between two carriers
// is a fixed length, so as the carriers close up the only place for it to go is
// forward into the room: a stacked wave curtain is DEEPER than a shut one, not
// flatter. That single relationship is most of what makes the stack read as
// cloth instead of a striped gradient.
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

type CurtainSize = 'small' | 'medium' | 'large' | 'xl';

interface Canvas2DCurtainRendererProps {
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
  fabricType: 'blockout' | 'sheer';
  hardwareColour: 'white' | 'black' | 'chrome';
  mount: 'ceiling' | 'window';
  colour: string;
  /** 0 = shut (panels meet at the centre), 1 = fully drawn back. */
  openness: number;
  /** Drives the real-world mm scale, and through it the wave count. */
  curtainSize: CurtainSize;
  canvasWidth: number;
  canvasHeight: number;
  photoUrl: string;
}

// --- The physical spec -----------------------------------------------------

/** Nominal track width per size option, in mm. These are the same figures the
 * size pills quote to the customer ("up to 1.8m"), and they are what gives this
 * renderer a real-world scale: wave COUNT has to come from a width in
 * millimetres, not from however many pixels across the traced window happens to
 * be. A phone photo and the default room photo of the same window must produce
 * the same number of waves. */
const TRACK_WIDTH_MM: Record<CurtainSize, number> = {
  small: 1200,
  medium: 1800,
  large: 2400,
  xl: 3000,
};

/** One wave per 160mm of track. Wave heading tape carries a snap every 80mm at
 * the standard 80% fullness, and one wave — a crest and the trough beside it —
 * spans two snaps. So a 2100mm track carries ~13 waves, ~6-7 per panel, which
 * is what the reference photography shows. */
const WAVE_PITCH_MM = 160;

/** Stacked, both panels together occupy a third of the track. A shut panel is
 * half the track, so each wave compresses to exactly a third of its shut pitch
 * — that ratio IS the "takes a third of the space" spec, and it is why the
 * minimum wave width below needs no separate number. */
const OPEN_STACK_FRACTION = 1 / 3;
const WAVE_MIN_RATIO = OPEN_STACK_FRACTION;

// FABRIC_ARC_RATIO lived here: the fabric consumed by one wave as a multiple of
// its shut pitch, 1.42. It fed the arc-length depth solver, and then only the
// weave repeat once that solver was replaced by DEPTH_SHUT/DEPTH_PACKED. Now that
// the weave covers each panel exactly once there is nothing left for it to set.

/** Wave depth, as a multiple of the SHUT pitch: shut, and fully packed.
 *
 * These replace an arc-length solver that bisected the sine's arc integral per
 * wave per frame to hold the fabric length constant. It was not worth its cost,
 * because the answer barely moves: as a wave's width goes to zero its arc length
 * tends to 4x its amplitude, so the amplitude tends to a CONSTANT of a quarter
 * the fabric length — 0.355 of the shut pitch at our fullness, against 0.33 when
 * shut. Two hundred-odd square roots per wave per frame to travel 8%.
 *
 * The depth was never what compression changes. What changes is the wave's
 * ASPECT: the same depth over a third of the width, which is a much steeper
 * surface and reads as a much sharper fold. That comes free from the width. */
const DEPTH_SHUT = 0.33;
const DEPTH_PACKED = 0.36;

/** Width of the compression front, in waves. A hard sequential handover — wave
 * n at its minimum before wave n+1 starts moving — steps visibly as the slider
 * travels. Real fabric loads up its neighbours, so the front is soft over about
 * a wave and a half. */
const FRONT_SOFTNESS = 1.6;

/** How much wider the hem sits than the heading on a stacked panel. The top is
 * pinned to its carrier; below that the fabric is free and a bunched panel
 * splays toward the room. Scaled by how compressed the panel is, so a shut
 * curtain hangs straight and the two panels never cross at the centre. */
const HEM_SPLAY = 0.1;

/** Extra wave depth at the hem, same reason. */
const HEM_DEPTH_GAIN = 0.14;

/** Mesh resolution. Columns are per wave rather than per panel, so a wide
 * curtain gets more geometry instead of coarser waves.
 *
 * ROWS is 8, down from 26. Nothing in this surface varies quickly down the drop:
 * the only vertical terms are the hem splay and hem deepening, both quadratic in
 * height, which 8 rows carry to within a pixel. The other 18 rows were paying
 * full vertex and fragment cost to interpolate a parabola. */
const COLS_PER_WAVE = 10;
const ROWS = 8;

/** Ceiling on the render buffer's width in pixels.
 *
 * The canvas used to be sized to the photo's own resolution, which is fine for
 * the default 1254px room but means a 4000px phone photo shaded 16 MILLION
 * fragments per frame — enough to drop a low-end machine to single figures while
 * the slider moves. The result is CSS-scaled to the container either way, and
 * the ortho camera maps the world to the viewport rather than to pixels, so
 * capping the buffer costs nothing but sampling and changes no coordinates. */
const RENDER_MAX_WIDTH = 1400;

// The detail map covers each panel EXACTLY ONCE — it is not tiled.
//
// Tiling was tried twice and both ways showed. Plain repeat puts a hard join at
// every tile edge, because a high-passed photograph is not seamless. Mirrored
// repeat has no join, but it does have a reflection axis, and linen slub is
// directional enough that each axis read as a horizontal line ruled across the
// curtain. Fitting one tile to the panel removes the whole class of problem:
// there are no internal boundaries left to see.
//
// The cost is that the weave is magnified — 640 texels across ~850px of fabric,
// so about 1.3x. That is a legibility choice anyway. At true scale a linen
// thread is well under a tenth of a millimetre against a curtain a few hundred
// pixels wide, so a physically-sized weave is invisible and every fabric
// collapses into the same flat wash. Shown slightly magnified, the blockout's
// sateen and the sheer's open linen actually look like different cloth.
//
// It also means the weave stretches with the window's aspect rather than staying
// square. On the window shapes this gets — roughly square panels — that is a few
// percent, and it degrades into softness rather than into an artifact.
const WEAVE_REPEAT = 1;

const HARDWARE_HEX: Record<string, string> = {
  white: '#E8E4DE',
  black: '#2C2824',
  chrome: '#B0AEA8',
};

// --- Helpers ---------------------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r: isNaN(r) ? 200 : r, g: isNaN(g) ? 200 : g, b: isNaN(b) ? 200 : b };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));
const smoothstep01 = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** Deterministic per-wave jitter in [-1, 1]. Real curtains are not identical
 * wave to wave, and a perfectly regular set is the single biggest tell that a
 * render is synthetic. Seeded by wave index so it never shimmers as the slider
 * moves — the same wave always gets the same deviation. */
const waveJitter = (i: number, salt: number): number =>
  Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453 % 1;

// --- Wave geometry maths ---------------------------------------------------

/** Width of every wave in one panel at a given openness, leading edge first.
 *
 * A compression front sweeps from wave 0 (the leading edge, at the middle of
 * the window) out to wave n-1 (against the wall). Waves behind the front are at
 * their minimum, waves ahead of it are untouched, and the handover is soft over
 * FRONT_SOFTNESS waves.
 *
 * The panel's span is whatever these widths add up to — it is NOT computed
 * separately and then divided out. That matters: it means the leading edge is
 * always exactly where the fabric puts it, so the panel can never disagree with
 * its own waves about how wide it is. At openness 0 every wave is shut and the
 * span is half the track; at openness 1 every wave is at its minimum and the
 * span is a sixth of it. */
function waveWidths(count: number, shutWidth: number, openness: number): number[] {
  const minWidth = shutWidth * WAVE_MIN_RATIO;
  const travel = shutWidth - minWidth;
  const front = clamp01(openness) * (count + FRONT_SOFTNESS);
  const widths: number[] = [];
  for (let i = 0; i < count; i++) {
    const compression = smoothstep01((front - i) / FRONT_SOFTNESS);
    widths.push(shutWidth - travel * compression);
  }
  return widths;
}

interface PanelLayout {
  /** Per-wave widths in px, leading edge first. */
  widths: number[];
  /** Per-wave depth in px, leading edge first. */
  depths: number[];
  /** Per-wave compression, 0 shut to 1 packed, leading edge first. */
  compressions: number[];
  /** Total horizontal extent of the panel, px. */
  span: number;
  /** 0 when shut, 1 when fully stacked — drives hem splay and shading. */
  overall: number;
}

function panelLayout(
  count: number,
  shutWidth: number,
  openness: number,
): PanelLayout {
  const even = waveWidths(count, shutWidth, openness);
  const minWidth = shutWidth * WAVE_MIN_RATIO;

  // Carriers do not pack perfectly evenly — the tape stretches, the fabric
  // bunches, and a hand-drawn curtain is never a ruler. Jittered then rescaled
  // to the same total, so the irregularity costs nothing in span: the leading
  // edge still lands exactly where the compression maths puts it.
  const target = even.reduce((a, b) => a + b, 0);
  const jittered = even.map((w, i) => w * (1 + waveJitter(i, 3.1) * 0.05));
  const jitterSum = jittered.reduce((a, b) => a + b, 0);
  const widths = jittered.map(w => (w * target) / jitterSum);

  const depths: number[] = [];
  const compressions: number[] = [];
  for (let i = 0; i < count; i++) {
    const compression = clamp01((shutWidth - widths[i]) / (shutWidth - minWidth));
    const jitter = 1 + waveJitter(i, 1.7) * 0.09;
    depths.push(shutWidth * (DEPTH_SHUT + (DEPTH_PACKED - DEPTH_SHUT) * compression) * jitter);
    compressions.push(compression);
  }

  const span = widths.reduce((a, b) => a + b, 0);
  const shutSpan = count * shutWidth;
  const packedSpan = count * minWidth;
  const overall = clamp01((shutSpan - span) / Math.max(1e-6, shutSpan - packedSpan));

  return { widths, depths, compressions, span, overall };
}

// --- Mesh construction ----------------------------------------------------

/** One panel's mesh, allocated once. Openness rewrites the typed arrays in place
 * and flags them; it never builds a BufferGeometry.
 *
 * Rebuilding was the whole cost of moving the slider: a fresh BufferGeometry,
 * four fresh typed arrays, a fresh index array and a computeVertexNormals pass
 * per panel per frame, and — worst of the lot — a GPU buffer created and deleted
 * sixty times a second, which is exactly the pattern a low-end driver handles
 * worst. Wave COUNT is fixed for the life of the track, so the vertex count and
 * the index buffer are fixed too, and only the positions actually move. */
interface PanelMesh {
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
  normals: Float32Array;
  compression: Float32Array;
  depth: Float32Array;
  cols: number;
  count: number;
}

function createPanelMesh(count: number): PanelMesh {
  const cols = count * COLS_PER_WAVE;
  const vertexCount = (cols + 1) * (ROWS + 1);

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const compression = new Float32Array(vertexCount);
  const depth = new Float32Array(vertexCount);

  // UVs never change: u runs along the FABRIC, not along x. Every wave holds the
  // same length of cloth whatever its width, so p/count is already an arc-length
  // parameter — which means the weave compresses with the wave instead of
  // stretching across it, and none of it depends on openness.
  let v = 0;
  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c <= cols; c++) {
      uvs[v * 2] = c / cols;
      uvs[v * 2 + 1] = 1 - r / ROWS;
      v++;
    }
  }

  // Indices are a plain grid and outlive every openness change.
  const indices = new Uint16Array(cols * ROWS * 6);
  let k = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c;
      const b = a + cols + 1;
      indices[k++] = a; indices[k++] = b; indices[k++] = a + 1;
      indices[k++] = a + 1; indices[k++] = b; indices[k++] = b + 1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  const normAttr = new THREE.BufferAttribute(normals, 3);
  const compAttr = new THREE.BufferAttribute(compression, 1);
  const depthAttr = new THREE.BufferAttribute(depth, 1);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  normAttr.setUsage(THREE.DynamicDrawUsage);
  compAttr.setUsage(THREE.DynamicDrawUsage);
  depthAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', posAttr);
  geometry.setAttribute('normal', normAttr);
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('aCompression', compAttr);
  geometry.setAttribute('aDepth', depthAttr);
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  // Drawn with an orthographic camera dead-on, so the bounding sphere only has
  // to contain the panel; computing it per frame from 400-odd vertices is waste.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

  return { geometry, positions, normals, compression, depth, cols, count };
}

interface PanelWrite {
  layout: PanelLayout;
  /** x of the fixed end, against the wall. */
  wallX: number;
  /** +1 if the panel runs from its wall end toward increasing x. */
  towardCentre: 1 | -1;
  topY: number;
  bottomY: number;
}

/** Rewrites one panel's vertex data for a new openness.
 *
 * Normals are derived analytically from the surface slope rather than by
 * computeVertexNormals, which walked every triangle taking cross products. This
 * is a height field z(x) with only smooth quadratic terms down the drop, so the
 * slope at a column is the same all the way down it: the normal is computed once
 * per COLUMN and copied down, which is ROWS times less work than per vertex, and
 * needs no cross products at all. */
function writePanelMesh(mesh: PanelMesh, w: PanelWrite): void {
  const { layout, wallX, towardCentre, topY, bottomY } = w;
  const { widths, depths, compressions, span, overall } = layout;
  const { positions, normals, compression, depth, cols, count } = mesh;
  const height = topY - bottomY;
  const TAU = Math.PI * 2;

  let maxDepth = 1e-6;
  for (let i = 0; i < count; i++) if (depths[i] > maxDepth) maxDepth = depths[i];

  // Per-column values, computed once and reused down every row.
  const colX = new Float64Array(cols + 1);
  const colZ = new Float64Array(cols + 1);
  const colNx = new Float64Array(cols + 1);
  const colNz = new Float64Array(cols + 1);
  const colComp = new Float64Array(cols + 1);

  let cum = 0;      // distance from the leading edge at the current wave's start
  let wave = 0;
  for (let c = 0; c <= cols; c++) {
    const p = (c / cols) * count;
    while (wave < count - 1 && p >= wave + 1) {
      cum += widths[wave];
      wave++;
    }
    const width = widths[wave];
    const offset = cum + width * (p - wave);

    // Depth interpolated between wave centres, so amplitude varies smoothly
    // along the panel. As a step function it creased the surface at every wave
    // boundary where two neighbours were compressed differently.
    const t = p - 0.5;
    const i0 = Math.floor(t);
    const f = t - i0;
    const d0 = depths[i0 < 0 ? 0 : i0 > count - 1 ? count - 1 : i0];
    const d1 = depths[i0 + 1 < 0 ? 0 : i0 + 1 > count - 1 ? count - 1 : i0 + 1];
    const amp = d0 + (d1 - d0) * f;

    const phase = p * TAU;
    colZ[c] = amp * Math.sin(phase);
    // Measured from the WALL end so the hem splay reaches further toward the
    // room while the heading stays pinned to its end carrier.
    colX[c] = span - offset;
    colComp[c] = compressions[wave];

    // Slope: dz/dp over dx/dp. dx/dp is -width (offset grows with p, distance
    // from the wall shrinks), and the dominant dz/dp term is the sine's own
    // derivative — the amplitude ramp between neighbours is an order down and
    // contributes nothing visible.
    const dzdp = amp * TAU * Math.cos(phase);
    const dxdp = -width * towardCentre;
    // Normal perpendicular to (dxdp, dzdp) in the x-z plane; the shader forces
    // it to face the camera, so the sign here is free.
    const nx = -dzdp;
    const nz = dxdp;
    const len = Math.hypot(nx, nz) || 1;
    colNx[c] = nx / len;
    colNz[c] = nz / len;
  }

  let v = 0;
  for (let r = 0; r <= ROWS; r++) {
    const vy = r / ROWS; // 0 at the heading, 1 at the hem
    const y = topY - height * vy;
    // Only a compressed panel splays: at openness 0 this is 1 and the two panels
    // meet cleanly at the centre instead of overlapping.
    const splay = 1 + HEM_SPLAY * vy * vy * overall;
    const deepen = 1 + HEM_DEPTH_GAIN * vy * vy;

    for (let c = 0; c <= cols; c++, v++) {
      const i3 = v * 3;
      positions[i3] = wallX + towardCentre * colX[c] * splay;
      positions[i3 + 1] = y;
      positions[i3 + 2] = colZ[c] * deepen;
      normals[i3] = colNx[c];
      normals[i3 + 1] = 0;
      normals[i3 + 2] = colNz[c];
      compression[v] = colComp[c];
      depth[v] = colZ[c] / maxDepth;
    }
  }

  const g = mesh.geometry;
  (g.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  (g.attributes.normal as THREE.BufferAttribute).needsUpdate = true;
  (g.attributes.aCompression as THREE.BufferAttribute).needsUpdate = true;
  (g.attributes.aDepth as THREE.BufferAttribute).needsUpdate = true;
}

// --- Shaders --------------------------------------------------------------

const VERTEX_SHADER = `
attribute float aCompression;
attribute float aDepth;

varying vec3 vNormal;
varying vec2 vUv;
varying float vCompression;
varying float vDepth;

void main() {
  vNormal = normalMatrix * normal;
  vUv = uv;
  vCompression = aCompression;
  vDepth = aDepth;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec3 uColour;
uniform float uOpacity;
uniform float uIsSheer;
uniform sampler2D uTexture;
uniform vec2 uTexRepeat;
uniform float uTexMean;
uniform float uTexAmount;

varying vec3 vNormal;
varying vec2 vUv;
varying float vCompression;
varying float vDepth;

void main() {
  // The panel is a single-valued height field z(x) seen from +z, so the
  // room-facing normal always has z >= 0. Forcing that is exact here and means
  // neither triangle winding nor DoubleSide can flip the lighting.
  vec3 N = normalize(vNormal);
  if (N.z < 0.0) N = -N;

  // WEAVE. The selected colour is the fabric; the photo contributes only its
  // deviation from its own mean luminance, so a white curtain stays white
  // instead of picking up the texture photo's grey.
  vec3 tex = texture2D(uTexture, vUv * uTexRepeat).rgb;
  float luma = dot(tex, vec3(0.299, 0.587, 0.114));
  float detail = clamp(luma - uTexMean, -0.5, 0.5);
  vec3 colour = uColour * (1.0 + detail * uTexAmount)
              + vec3(detail * uTexAmount * 0.10);

  // KEY LIGHT from the room: front, above, a little to the left, matching the
  // rest of the visualiser. Half-Lambert rather than clamped n-dot-l — cloth
  // scatters light around its own curvature and a hard terminator on a fold
  // reads as plastic.
  vec3 L = normalize(vec3(-0.40, 0.32, 0.86));
  float wrap = dot(N, L) * 0.5 + 0.5;
  float shade = mix(0.60, 1.14, pow(wrap, 1.35));

  // Self-shadowing in the troughs. A trough faces away from the room and sees
  // less of it, and the effect is stronger once the waves are packed together
  // and start occluding each other.
  float trough = max(0.0, -vDepth);
  shade *= 1.0 - trough * mix(0.10, 0.26, vCompression);

  // Packed fabric is denser and darker — more layers, less light through and
  // around it.
  shade *= mix(1.0, 0.88, vCompression);

  // The hem sits further from the light and picks up floor bounce rather than
  // window light.
  float drop = 1.0 - vUv.y;
  shade *= 1.0 - drop * drop * 0.10;

  colour *= shade;

  // SHEER. Backlit by the window, so brightness is governed by how far the
  // light travels through the cloth: where the surface faces the camera the
  // path is shortest and it glows, and where it turns edge-on the path is long
  // and it goes dense. That contrast is the whole character of a sheer, and it
  // is why a sheer wave curtain reads as translucent even in a still.
  if (uIsSheer > 0.5) {
    float facing = pow(max(N.z, 0.0), 1.7);
    vec3 glow = colour + vec3(0.20, 0.17, 0.10);
    colour = mix(colour * 0.82, glow, facing * (1.0 - vCompression * 0.45));
  }

  gl_FragColor = vec4(colour, uOpacity);
}
`;

const TRACK_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const TRACK_FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 uColour;
varying vec2 vUv;
void main() {
  // Lit along the top edge, falling into shadow underneath — a slim extruded
  // profile seen head on. vUv.y is 1 at the top of the strip.
  // Kept under 1.0 so a white track stays a white object with a readable
  // profile instead of clipping to a blown-out bar across the top of the photo.
  float t = vUv.y;
  float shade = mix(0.58, 0.98, smoothstep(0.0, 0.75, t));
  shade += (1.0 - smoothstep(0.0, 0.18, abs(t - 0.70))) * 0.08;
  gl_FragColor = vec4(uColour * shade, 1.0);
}
`;

// --- Fabric textures ------------------------------------------------------

// ---------------------------------------------------------------------------
// FABRIC — the real sample photography
//
// From the sample library under public/images/Textures/curtains: the actual
// cloth we sell, photographed. Two things have to be dealt with before a
// draped studio photograph can be used as a tiling surface, and neither is
// optional:
//
//   1. The photographs have their OWN folds and their own studio lighting —
//      big soft diagonal gradients across the frame. Tiled onto our waves
//      those gradients read as a second set of folds lying at the wrong
//      angle, arguing with the geometry. They also make even a mirrored
//      repeat obvious, because the eye picks up the patchwork of light and
//      dark long before it notices a weave.
//
//   2. The library stamps a round badge into the top-right corner of every
//      frame, which would tile across the curtain as a row of dark blobs.
//
// So the photo is not used directly. It is cropped clear of the badge and
// then HIGH-PASSED: the low frequencies, which are the drape and the
// lighting, are measured and subtracted, leaving only the weave — the thread
// grid, the slub, the surface. That is precisely what the shader wants, since
// it already treats the texture as a deviation to modulate the selected
// colour rather than as colour in its own right. What survives is the
// fabric's real surface character: the blockout's smooth sateen, the sheer's
// open linen grid.
// ---------------------------------------------------------------------------

const FABRIC_SAMPLE: Record<'blockout' | 'sheer', string> = {
  // CASE-SENSITIVE, and `curtains` is lowercase on disk. A Linux host serves
  // /Curtains/ as a different URL that 404s, which is the worst failure shape
  // there is — it only shows up after deploy.
  blockout: '/images/Textures/curtains/Blockout_curtains_1.png',
  sheer: '/images/Textures/curtains/Sheer_curtains_1.png',
};

/** Working size of the extracted detail map. Matched to the crop's own resolution
 * — the samples are ~780px and the crop keeps ~510 of that — so thread detail is
 * neither upscaled into softness nor thrown away. */
const DETAIL_SIZE = 512;

/** Resolution the low frequencies are measured at, as a fraction of DETAIL_SIZE.
 * At 3/16 each cell is about 5px of the crop, so anything broader than ~11px is
 * treated as drape and removed and only finer structure survives as weave —
 * which is where the thread grid lives, at roughly 4px in these samples.
 *
 * The first attempt measured this far too coarsely. It cleared the big studio
 * gradients but left the mid-frequency creases, which then tiled as diagonal
 * streaks. The rule is that anything you could mistake for a fold has to go,
 * because we draw the folds ourselves; only what reads as thread may stay. */
const DETAIL_LOW_FRACTION = 3 / 16;
const DETAIL_LOW_SIZE = Math.round(DETAIL_SIZE * DETAIL_LOW_FRACTION);

/** Standard deviation the detail map is normalised to, so uTexAmount means the
 * same thing whatever the sample photo's own contrast happens to be. Swap in a
 * new fabric and it arrives at a comparable strength instead of needing the
 * shader retuned. */
const DETAIL_TARGET_STD = 0.055;

/** Side of the crop, as a fraction of the frame's short edge. Two thirds rather
 * than the whole frame: the crop position is chosen, not fixed, and it needs room
 * to move. See pickFlattestCrop. */
const SAMPLE_CROP = 0.66;

interface FabricTexture {
  texture: THREE.Texture;
  meanLuma: number;
}

/** The square patch of a sample frame with the least large-scale structure in it.
 *
 * These are draped photographs, so some of the frame is near-flat cloth and some
 * of it carries a hard crease. A crease is high-frequency ACROSS itself, so the
 * high pass keeps it, and it ends up ruled diagonally across the curtain — which
 * is exactly what happened when this cropped a fixed corner: the blockout
 * sample's deepest folds sit in the bottom left, which is where it was looking.
 *
 * So score a grid of candidate positions by how much low-frequency variation each
 * contains and take the calmest. Candidates overlapping the badge the sample
 * library stamps into the top-right corner are rejected outright. This also means
 * a new sample dropped into the folder gets a sensible crop without anyone having
 * to go and find one by eye. */
function pickFlattestCrop(img: HTMLImageElement): { sx: number; sy: number; side: number } {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const side = Math.min(W, H) * SAMPLE_CROP;
  const fallback = { sx: 0, sy: H - side, side };

  // Generous box around the badge — better to reject a usable crop than to tile
  // a dark blob across the curtain.
  const badgeLeft = W * 0.78;
  const badgeBottom = H * 0.22;

  const P = 16;
  const probe = document.createElement('canvas');
  probe.width = P;
  probe.height = P;
  const pctx = probe.getContext('2d');
  if (!pctx) return fallback;

  const STEPS = 4;
  let best: { sx: number; sy: number; side: number } | null = null;
  let bestScore = Infinity;
  for (let iy = 0; iy < STEPS; iy++) {
    for (let ix = 0; ix < STEPS; ix++) {
      const sx = ((W - side) * ix) / (STEPS - 1);
      const sy = ((H - side) * iy) / (STEPS - 1);
      if (sx + side > badgeLeft && sy < badgeBottom) continue;

      pctx.drawImage(img, sx, sy, side, side, 0, 0, P, P);
      const d = pctx.getImageData(0, 0, P, P).data;
      let mean = 0;
      const luma = new Float32Array(P * P);
      for (let i = 0; i < P * P; i++) {
        luma[i] = (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) / 255;
        mean += luma[i];
      }
      mean /= P * P;
      let score = 0;
      for (let i = 0; i < P * P; i++) score += (luma[i] - mean) ** 2;
      score /= P * P;

      if (score < bestScore) {
        bestScore = score;
        best = { sx, sy, side };
      }
    }
  }
  return best ?? fallback;
}

const textureCache = new Map<string, Promise<FabricTexture>>();

function buildDetailTexture(path: string): Promise<FabricTexture> {
  let cached = textureCache.get(path);
  if (cached) return cached;

  cached = (async () => {
    const img = await loadImage(path);
    const S = DETAIL_SIZE;
    const L = DETAIL_LOW_SIZE;

    const { sx, sy, side } = pickFlattestCrop(img);

    const sharp = document.createElement('canvas');
    sharp.width = S;
    sharp.height = S;
    const sctx = sharp.getContext('2d');
    if (!sctx) throw new Error('2d context unavailable');
    sctx.drawImage(img, sx, sy, side, side, 0, 0, S, S);
    const src = sctx.getImageData(0, 0, S, S).data;

    // LOW PASS BY DOWNSCALE, not by blur. ctx.filter blur treats everything
    // outside the bitmap as transparent and averages it in, so it haloes the
    // border — subtracting that would ring a bright frame around every tile. A
    // downscale is a box average with no boundary to get wrong. Two steps, since
    // a single large reduction is where browsers start dropping samples rather
    // than averaging them.
    const step = L * 2;
    const mid = document.createElement('canvas');
    mid.width = step;
    mid.height = step;
    const mctx = mid.getContext('2d');
    if (!mctx) throw new Error('2d context unavailable');
    mctx.drawImage(sharp, 0, 0, S, S, 0, 0, step, step);

    const lowCanvas = document.createElement('canvas');
    lowCanvas.width = L;
    lowCanvas.height = L;
    const lctx = lowCanvas.getContext('2d');
    if (!lctx) throw new Error('2d context unavailable');
    lctx.drawImage(mid, 0, 0, step, step, 0, 0, L, L);
    const lowData = lctx.getImageData(0, 0, L, L).data;

    const low = new Float32Array(L * L);
    for (let i = 0; i < L * L; i++) {
      low[i] = (lowData[i * 4] * 0.299 + lowData[i * 4 + 1] * 0.587 + lowData[i * 4 + 2] * 0.114) / 255;
    }

    const sampleLow = (fx: number, fy: number): number => {
      const x = Math.min(L - 1, Math.max(0, fx));
      const y = Math.min(L - 1, Math.max(0, fy));
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(L - 1, x0 + 1);
      const y1 = Math.min(L - 1, y0 + 1);
      const tx = x - x0;
      const ty = y - y0;
      const a = low[y0 * L + x0];
      const b = low[y0 * L + x1];
      const c = low[y1 * L + x0];
      const d = low[y1 * L + x1];
      return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    };

    // Detail = photo minus its own low frequencies.
    const detail = new Float32Array(S * S);
    let sum = 0;
    for (let y = 0; y < S; y++) {
      const fy = ((y + 0.5) / S) * L - 0.5;
      for (let x = 0; x < S; x++) {
        const i = y * S + x;
        const luma = (src[i * 4] * 0.299 + src[i * 4 + 1] * 0.587 + src[i * 4 + 2] * 0.114) / 255;
        const d = luma - sampleLow(((x + 0.5) / S) * L - 0.5, fy);
        detail[i] = d;
        sum += d;
      }
    }
    const mean = sum / (S * S);
    let variance = 0;
    for (let i = 0; i < S * S; i++) {
      const d = detail[i] - mean;
      variance += d * d;
    }
    const std = Math.sqrt(variance / (S * S));
    const gain = Math.min(8, Math.max(0.2, DETAIL_TARGET_STD / Math.max(1e-5, std)));

    // Written greyscale and centred on mid-grey: the shader reads luminance
    // only, and the fabric's colour is the customer's choice, never the photo's.
    const out = document.createElement('canvas');
    out.width = S;
    out.height = S;
    const octx = out.getContext('2d');
    if (!octx) throw new Error('2d context unavailable');
    const image = octx.createImageData(S, S);
    for (let i = 0; i < S * S; i++) {
      const v = Math.round(Math.min(255, Math.max(0, (0.5 + (detail[i] - mean) * gain) * 255)));
      image.data[i * 4] = v;
      image.data[i * 4 + 1] = v;
      image.data[i * 4 + 2] = v;
      image.data[i * 4 + 3] = 255;
    }
    octx.putImageData(image, 0, 0);

    const texture = new THREE.CanvasTexture(out);
    // Clamped, because the map covers each panel exactly once and never wraps —
    // see WEAVE_REPEAT. Nothing samples outside 0..1, so the wrap mode is only
    // here to make that explicit rather than leave a repeat mode implying tiling
    // that does not happen.
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    // No mipmaps: the map is magnified, not minified, so a mip chain would never
    // be sampled and generating it only costs memory and upload time. Without
    // POT dimensions WebGL1 would refuse them anyway.
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    // Centred on 0.5 by construction, so the shader's subtraction leaves the
    // weave and nothing else.
    return { texture, meanLuma: 0.5 };
  })();

  textureCache.set(path, cached);
  return cached;
}

// --- Component ------------------------------------------------------------

interface Layout {
  windowLeft: number;
  windowRight: number;
  windowTop: number;
  windowBottom: number;
  /** Wave count PER PANEL — fixed for the life of this track. */
  waveCount: number;
  /** One wave's width with the curtain shut, px. */
  shutWaveWidth: number;
  pxPerMm: number;
}

export default function Canvas2DCurtainRenderer({
  tl, tr, br, bl,
  fabricType,
  hardwareColour,
  mount,
  colour,
  openness,
  curtainSize,
  canvasWidth,
  canvasHeight,
  photoUrl,
}: Canvas2DCurtainRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const threeRef = useRef<HTMLCanvasElement>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const leftMeshRef = useRef<PanelMesh | null>(null);
  const rightMeshRef = useRef<PanelMesh | null>(null);
  const materialsRef = useRef<THREE.ShaderMaterial[]>([]);
  const layoutRef = useRef<Layout | null>(null);

  // Openness animates at 60fps; everything else changes on a click. Keeping the
  // live value in a ref lets the heavy setup effect read it without listing it
  // as a dependency and tearing down the renderer on every animation frame,
  // which is what the previous version did.
  const opennessRef = useRef(openness);
  opennessRef.current = openness;

  /** Repositions both panels for an openness and repaints. Writes into buffers
   * allocated once at setup — see createPanelMesh. */
  const applyOpenness = (open: number) => {
    const layout = layoutRef.current;
    const left = leftMeshRef.current;
    const right = rightMeshRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!layout || !left || !right || !renderer || !scene || !camera) return;

    const { windowLeft, windowRight, windowTop, windowBottom, waveCount, shutWaveWidth } = layout;
    // One layout serves both panels — they are mirror images, so the wave widths
    // are identical and only the anchor and direction differ.
    const shaped = panelLayout(waveCount, shutWaveWidth, open);

    writePanelMesh(left, {
      layout: shaped,
      wallX: windowLeft,
      towardCentre: 1,
      topY: windowTop,
      bottomY: windowBottom,
    });
    writePanelMesh(right, {
      layout: shaped,
      wallX: windowRight,
      towardCentre: -1,
      topY: windowTop,
      bottomY: windowBottom,
    });

    renderer.render(scene, camera);
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const bgCanvas = bgRef.current;
      const threeCanvas = threeRef.current;
      if (!bgCanvas || !threeCanvas) return;

      const [photo, fabric] = await Promise.all([
        loadImage(photoUrl),
        buildDetailTexture(FABRIC_SAMPLE[fabricType] ?? FABRIC_SAMPLE.blockout),
      ]);
      if (cancelled) return;

      const W = photo.naturalWidth;
      const H = photo.naturalHeight;

      bgCanvas.width = W;
      bgCanvas.height = H;

      // The fabric buffer is capped; the ortho camera below still spans 0..W in
      // photo pixels, so world coordinates are unchanged and the two canvases
      // stay aligned — both are CSS-sized to the container.
      const renderScale = Math.min(1, RENDER_MAX_WIDTH / W);
      threeCanvas.width = Math.round(W * renderScale);
      threeCanvas.height = Math.round(H * renderScale);

      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) bgCtx.drawImage(photo, 0, 0);

      // Three's y runs up, the photo's runs down.
      const flip = (p: Point) => ({ x: p.x, y: H - p.y });
      const tlPx = flip(tl);
      const trPx = flip(tr);
      const blPx = flip(bl);
      const brPx = flip(br);

      const windowLeft = Math.min(tlPx.x, blPx.x);
      const windowRight = Math.max(trPx.x, brPx.x);
      const windowTop = Math.max(tlPx.y, trPx.y);
      const windowBottom = Math.min(blPx.y, brPx.y);
      const windowWidth = windowRight - windowLeft;

      void mount;

      // WAVE COUNT — from the ordered track width in mm, then held. Rounded to
      // a whole wave per panel because half a wave cannot be sewn, and floored
      // at 3 so a small window still reads as a wave curtain rather than as two
      // bulges.
      const trackWidthMm = TRACK_WIDTH_MM[curtainSize] ?? 1800;
      const pxPerMm = windowWidth / trackWidthMm;
      const waveCount = Math.max(3, Math.round(trackWidthMm / 2 / WAVE_PITCH_MM));

      // Panels meet at the centre with a hairline between them, so a shut pair
      // reads as two panels rather than one sheet.
      const gap = windowWidth * 0.004;
      const shutPanelWidth = (windowWidth - gap) / 2;
      const shutWaveWidth = shutPanelWidth / waveCount;

      layoutRef.current = {
        windowLeft,
        windowRight,
        windowTop,
        windowBottom,
        waveCount,
        shutWaveWidth,
        pxPerMm,
      };

      // Tear down anything from a previous run before building again.
      if (sceneRef.current) {
        sceneRef.current.traverse(obj => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            const m = mesh.material;
            if (Array.isArray(m)) m.forEach(x => x.dispose());
            else (m as THREE.Material).dispose();
          }
        });
        sceneRef.current.clear();
      }
      if (rendererRef.current) rendererRef.current.dispose();

      // antialias off: MSAA on a buffer this size is one of the most expensive
      // things you can ask of an integrated GPU, and it buys almost nothing here
      // because the result is CSS-downscaled to the container anyway — that
      // downscale is itself a resolve. The fabric has no hard edges against the
      // photo either; the panel silhouette is the only one, and it is vertical.
      const renderer = new THREE.WebGLRenderer({
        canvas: threeCanvas,
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(1);
      renderer.setSize(threeCanvas.width, threeCanvas.height, false);
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.OrthographicCamera(0, W, H, 0, -1000, 1000);
      camera.position.set(0, 0, 100);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      const rgb = hexToRgb(colour);
      const colourVec = new THREE.Vector3(rgb.r / 255, rgb.g / 255, rgb.b / 255);
      const isSheer = fabricType === 'sheer';

      const repeat = new THREE.Vector2(WEAVE_REPEAT, WEAVE_REPEAT);

      const makeMaterial = () =>
        new THREE.ShaderMaterial({
          uniforms: {
            uColour: { value: colourVec },
            uOpacity: { value: isSheer ? 0.62 : 1.0 },
            uIsSheer: { value: isSheer ? 1.0 : 0.0 },
            uTexture: { value: fabric.texture },
            uTexRepeat: { value: repeat },
            uTexMean: { value: fabric.meanLuma },
            // The sheer's open linen grid is its whole character and wants to be
            // read; the blockout is a smooth sateen whose surface is nearly
            // featureless, and pushing it harder only amplifies photo grain.
            // Comparable numbers because the detail map is normalised — see
            // DETAIL_TARGET_STD.
            uTexAmount: { value: isSheer ? 1.0 : 0.6 },
          },
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          transparent: isSheer,
          depthWrite: !isSheer,
          side: THREE.DoubleSide,
        });

      // Buffers allocated here and only ever rewritten — applyOpenness fills in
      // the positions below.
      const leftMesh = createPanelMesh(waveCount);
      const rightMesh = createPanelMesh(waveCount);
      const leftMaterial = makeMaterial();
      const rightMaterial = makeMaterial();
      materialsRef.current = [leftMaterial, rightMaterial];
      const leftPanel = new THREE.Mesh(leftMesh.geometry, leftMaterial);
      const rightPanel = new THREE.Mesh(rightMesh.geometry, rightMaterial);
      leftPanel.frustumCulled = false;
      rightPanel.frustumCulled = false;
      leftPanel.renderOrder = 1;
      rightPanel.renderOrder = 1;
      scene.add(leftPanel, rightPanel);
      leftMeshRef.current = leftMesh;
      rightMeshRef.current = rightMesh;

      // TRACK — the panels hang from something, and without it they float in
      // the opening. Drawn in front of the fabric so it covers the heading, the
      // way a real track hides the top of the tape.
      const trackHeight = Math.max(3, (windowTop - windowBottom) * 0.022);
      const trackGeometry = new THREE.PlaneGeometry(windowWidth, trackHeight);
      const trackMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColour: {
            value: new THREE.Vector3(
              ...(() => {
                const h = hexToRgb(HARDWARE_HEX[hardwareColour] ?? HARDWARE_HEX.white);
                return [h.r / 255, h.g / 255, h.b / 255] as [number, number, number];
              })(),
            ),
          },
        },
        vertexShader: TRACK_VERTEX_SHADER,
        fragmentShader: TRACK_FRAGMENT_SHADER,
      });
      const track = new THREE.Mesh(trackGeometry, trackMaterial);
      track.position.set(
        (windowLeft + windowRight) / 2,
        windowTop - trackHeight / 2,
        // In front of the deepest possible wave: the packed depth, plus the hem
        // gain, plus the jitter, plus a margin.
        shutWaveWidth * DEPTH_PACKED * (1 + HEM_DEPTH_GAIN) * 1.3 + 1,
      );
      track.renderOrder = 2;
      scene.add(track);

      applyOpenness(opennessRef.current);
    };

    init();

    return () => {
      cancelled = true;
    };
    // The corner props are listed as eight NUMBERS, not as four objects.
    //
    // KlayConfigurator builds them as fresh object literals in its JSX, so their
    // identity changes on every render — which meant this effect, the one that
    // disposes the WebGL renderer and recompiles both shader programs, re-ran on
    // every single frame of a slider drag. Keeping openness out of the list did
    // nothing while the corners were pulling it in anyway. Depending on the
    // values makes it fire when the trace actually moves.
    //
    // openness and colour are absent on purpose — both are handled by the two
    // effects below without touching the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    photoUrl, canvasWidth, canvasHeight,
    tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y,
    mount, fabricType, curtainSize, hardwareColour,
  ]);

  useEffect(() => {
    applyOpenness(openness);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openness]);

  // Colour is a uniform, not a rebuild. It used to be a setup dependency, back
  // when the texture was picked from the colour's luminance — a light weave scan
  // for pale fabrics, a dark one for deep ones. The detail map is greyscale and
  // colour-independent now, so every swatch click was disposing the renderer and
  // recompiling two shader programs to change three floats.
  useEffect(() => {
    const materials = materialsRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!materials.length || !renderer || !scene || !camera) return;

    const rgb = hexToRgb(colour);
    for (const material of materials) {
      (material.uniforms.uColour.value as THREE.Vector3).set(rgb.r / 255, rgb.g / 255, rgb.b / 255);
    }
    renderer.render(scene, camera);
  }, [colour]);

  useEffect(() => {
    return () => {
      if (sceneRef.current) {
        sceneRef.current.traverse(obj => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            const m = mesh.material;
            if (Array.isArray(m)) m.forEach(x => x.dispose());
            else (m as THREE.Material).dispose();
          }
        });
      }
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={bgRef}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <canvas
        ref={threeRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'auto',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
