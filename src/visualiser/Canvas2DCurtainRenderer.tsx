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
  canvasWidth: number;
  canvasHeight: number;
  photoUrl: string;
}

// --- The physical spec -----------------------------------------------------

/** Waves per panel. FIXED, on every window.
 *
 * This used to be derived from the ordered track width — a table of mm per size
 * pill, divided by the heading tape's snap spacing — which is how a real curtain
 * is quoted and gave a small window fewer waves than a large one. Correct on
 * paper, wrong on screen: at four waves a small window read as two bulges rather
 * than as a wave curtain, and the whole point of the visualiser is that the
 * customer recognises the product. Nine is the count the largest size produced,
 * it looks right at every window, so every window gets it.
 *
 * A whole number, always, and the mesh spans exactly this many full sine periods
 * — so a panel opens and closes on a complete wave and never on half of one.
 * There is no path here that can produce a fractional wave: the compression front
 * moves the wave WIDTHS and never the count. */
const WAVES_PER_PANEL = 9;

/** One wave per 160mm of track: heading tape carries a snap every 80mm at the
 * standard 80% fullness, and one wave — a crest and the trough beside it — spans
 * two snaps.
 *
 * No longer sets the wave count. It is now the renderer's only link to real-world
 * scale, working the other way round: the panel shows WAVES_PER_PANEL waves, each
 * wave is 160mm of track, so the panel is 9 x 160mm of cloth however many pixels
 * wide it happens to be, and one pixel is therefore a known number of
 * millimetres. The cloth physics needs that — a pendulum's period depends on its
 * length in metres, not in pixels. */
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

/** How far the hem rides up and down with fold depth, as a fraction of the fold's
 * own depth — and the same at the heading, where it is much smaller.
 *
 * Without this the panels are boxes. The waves live purely in z, the camera looks
 * straight down -z, so depth moved nothing on screen and the top and bottom edges
 * came out as dead straight horizontal lines across a rippling surface. A real
 * curtain's hem is scalloped: you are looking slightly DOWN at it, so the part of
 * each wave that bulges toward the room sits lower in frame than the part that
 * bows away, and the hem draws that out as a wave of its own.
 *
 * A true perspective camera would give this for free, but the orthographic one is
 * what keeps the render locked to the traced window, so the depth cue is applied
 * as a shear on y instead: a projection effect, which is what it is.
 *
 * Scaled off the reference render, where the hem's scallop measures about 17% of
 * the wave pitch peak-to-peak against a fold depth of ~0.41 of pitch. A little
 * over that here, since this is looked at much smaller than a 1535px still. */
const HEM_DEPTH_SWING = 0.3;

/** Zero at the heading, and for two reasons. The fabric is clipped to its
 * carriers there, so it genuinely has nowhere to move — the swing is a projection
 * effect that grows with distance below the camera's axis, and at the track there
 * is none. And any swing at all lifted part of the heading above the track, which
 * showed as a row of dark specks along its top edge. */
const HEADING_DEPTH_SWING = 0;

// ---------------------------------------------------------------------------
// CLOTH PHYSICS — the hem does not go where the carriers go
//
// Only the heading is attached to anything. The carriers are pulled along the
// track and the rest of the panel follows late, because it has mass and because
// it has to push air out of the way. So the hem trails behind while you draw the
// curtain, overshoots when you stop, swings back, and settles. That overshoot is
// the single most recognisable thing a curtain does, and without it a panel reads
// as a picture of a curtain being slid sideways.
//
// Modelled as a damped harmonic oscillator, which is what a hanging sheet is, in
// the non-inertial frame of the moving heading:
//
//     s'' + 2ζω s' + ω² s = -(a_track + k_air · v_track)
//
// where s is how far the hem lags the heading. Two drive terms, and both are
// needed for different reasons:
//
//   - a_track (inertia). Zero at constant speed, large at the start and end of a
//     drag. This is what produces the FLICK: stop the carriers and the hem is
//     still moving, so it swings past and comes back.
//
//   - k_air · v_track (air resistance). Constant at constant speed, which is what
//     holds the hem in a steady trailing lean for as long as you keep dragging.
//     Inertia alone cannot do that — a pendulum under constant velocity hangs
//     straight down, and the panel would snap to vertical mid-drag.
//
// Both drives scale with how hard the curtain is pulled, so the response is
// automatically paced by the user: a slow drag leans a little and settles almost
// invisibly, a fast one leans hard and swings twice before it stops. Nothing here
// is keyed to a fixed animation duration.
// ---------------------------------------------------------------------------

const GRAVITY = 9.81; // m/s²

/** Fundamental frequency of a hanging chain of length L is 1.2024·sqrt(g/L) —
 * the first zero of J₀ over two — and a curtain panel is close enough to one for
 * that to be the right starting point. It comes out slow, though: a 2.9m drop
 * gives a 2.8 second period, which reads as a rope in a swimming pool rather than
 * as cloth.
 *
 * Scaled up because a curtain is not a chain. It has bending stiffness across its
 * width, the wave heading couples every fold to its neighbours, and the fabric is
 * light enough that air does most of the work — all of which raise the apparent
 * frequency well above the ideal limp-chain mode. Tuned by eye against a real
 * curtain: about a 1.3 second period on a full-height drop, which is what a hem
 * settling actually looks like. */
const SWAY_FREQ_SCALE = 2.2;

/** Damping ratio. Underdamped, so there IS a visible overshoot and a swing back —
 * that is the whole point. Around a third gives roughly two diminishing swings
 * before it settles, which is what cloth does; much less and it wobbles like
 * jelly, much more and the flick is swallowed. */
const SWAY_DAMPING = 0.3;

/** Air resistance, 1/s. Sets the steady lean while the curtain is being pulled at
 * a constant speed. */
const SWAY_AIR = 1.8;

/** Fraction of the heading's acceleration the hem actually feels. Well under 1
 * because the panel is a distributed sheet, not a bob on a string: most of its
 * mass sits nearer the top, where the motion is imposed rather than free. Without
 * this the peak of an eased drag drives a lag wider than the wave pitch. */
const SWAY_ACCEL_GAIN = 0.35;

/** Ceiling on the lag, as a fraction of one shut wave pitch. Cloth runs out of
 * slack; past that it would have to stretch. Also stops a violent slider flick
 * from shearing the mesh into something that is not a curtain.
 *
 * 1.2 pitches is about 190mm of trail at the hem on a full-height drop, which is
 * what a briskly drawn curtain actually does. The ratio is scale-invariant against
 * the stacked panel — a fully open panel is three pitches wide, so the lag can
 * never exceed 40% of it whatever the window measures, which is the number that
 * decides whether a shoved stack squashes plausibly or collapses. */
const SWAY_MAX_RATIO = 1.2;

/** How the lag grows down the drop. Superlinear, so the top third barely moves
 * and the hem carries almost all of it — the heading is clamped to its carriers
 * and the free length below it is what swings. */
const SWAY_SHAPE_POWER = 1.7;

/** How much the waves billow when the panel is moving. Air trapped in front of a
 * moving curtain has to go somewhere, and it deepens the folds. Small: this is a
 * supporting cue, and overdone it looks like the curtain is breathing. */
const SWAY_BILLOW = 0.18;

/** Below these the cloth is at rest and the animation loop stops, so a settled
 * curtain costs nothing. Both have to be met — a hem at zero offset travelling at
 * speed is mid-swing, not settled. */
const SETTLED_OFFSET_PX = 0.04;
const SETTLED_SPEED_PX = 0.4;

/** Longest frame the solver will integrate in one step. A backgrounded tab hands
 * back a multi-second delta on return, and feeding that to the integrator makes
 * the oscillator explode. Clamping loses a little real time on a stall, which is
 * invisible, instead of throwing the panel across the room. */
const MAX_STEP = 1 / 20;

/** One panel's cloth state. Lag is measured along the panel, positive meaning the
 * hem is further from the wall than the heading — i.e. trailing when opening. */
interface SwayState {
  /** Lag in px at the hem. */
  offset: number;
  /** Rate of change of that lag, px/s. */
  speed: number;
  /** Leading-edge position last frame, px from the wall. */
  lastSpan: number;
  /** Leading-edge velocity last frame, px/s — differenced for acceleration. */
  lastVelocity: number;
}

const newSwayState = (span: number): SwayState => ({
  offset: 0,
  speed: 0,
  lastSpan: span,
  lastVelocity: 0,
});

/** Advances the cloth one step and returns the lag to draw with.
 *
 * Semi-implicit Euler: the new velocity is used to move the position. Costs
 * nothing over explicit Euler and is stable for an oscillator at frame-rate
 * steps, where plain Euler gains energy and slowly winds itself up. */
function stepSway(
  state: SwayState,
  span: number,
  dt: number,
  omega: number,
  maxOffset: number,
  /** Distance from the leading edge to the shut position — i.e. to the centre of
   * the window, where the other panel is. */
  roomToCentre: number,
): number {
  if (dt <= 0) {
    state.lastSpan = span;
    return state.offset;
  }

  const velocity = (span - state.lastSpan) / dt;
  const accel = (velocity - state.lastVelocity) / dt;
  state.lastSpan = span;
  state.lastVelocity = velocity;

  const drive = -(accel * SWAY_ACCEL_GAIN + velocity * SWAY_AIR);
  const restore = -omega * omega * state.offset;
  const damp = -2 * SWAY_DAMPING * omega * state.speed;

  state.speed += (restore + damp + drive) * dt;
  state.offset += state.speed * dt;

  // Two different limits, because the two directions run out of room for
  // different reasons.
  //
  // Toward the centre, the OTHER PANEL is in the way. Without this a curtain
  // closed briskly overshoots at the moment the panels meet and the two hems swing
  // straight through each other — the one artifact in this whole model that reads
  // as broken rather than as cloth. Real leading edges collide and stop, so the
  // limit is whatever gap is actually left, which falls to zero exactly as the
  // curtain shuts.
  //
  // Away from the centre it is the fabric itself: past a point the cloth would
  // have to stretch.
  const maxOut = Math.min(maxOffset, Math.max(0, roomToCentre));
  if (state.offset > maxOut) {
    state.offset = maxOut;
    // Kill the velocity with it. Cloth that has run out of slack, or met the other
    // panel, does not keep accelerating — it comes up taut.
    if (state.speed > 0) state.speed = 0;
  } else if (state.offset < -maxOffset) {
    state.offset = -maxOffset;
    if (state.speed < 0) state.speed = 0;
  }

  return state.offset;
}

const swaySettled = (state: SwayState): boolean =>
  Math.abs(state.offset) < SETTLED_OFFSET_PX && Math.abs(state.speed) < SETTLED_SPEED_PX;

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

// --- Sheer opacity -------------------------------------------------------

/** A sheer is a veil, and how much of one depends on the colour it is woven in.
 * A white sheer scatters the daylight coming through it forward into the room and
 * hazes over into something you plainly see; a charcoal one absorbs that scatter
 * and reads much more as a tint over the view. So the paler the colour, the more
 * opaque it renders.
 *
 * The floor is what matters as much as the range: at 0.62 the previous fixed
 * value the fabric was barely there against a bright window, and a curtain you
 * cannot see is not a visualisation of a curtain. Even the darkest colour now
 * covers most of what is behind it. */
const SHEER_OPACITY_DARK = 0.82;
const SHEER_OPACITY_LIGHT = 0.95;

const sheerOpacity = (colour: string): number => {
  const l = luma01(colour);
  return SHEER_OPACITY_DARK + (SHEER_OPACITY_LIGHT - SHEER_OPACITY_DARK) * l;
};

function luma01(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
}

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
  /** Hem lag from the cloth solver, px along the panel. See stepSway. */
  sway?: number;
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
  const { layout, wallX, towardCentre, topY, bottomY, sway = 0 } = w;
  const { widths, depths, compressions, span, overall } = layout;
  const { positions, normals, compression, depth, cols, count } = mesh;
  const height = topY - bottomY;
  const TAU = Math.PI * 2;

  let maxDepth = 1e-6;
  for (let i = 0; i < count; i++) if (depths[i] > maxDepth) maxDepth = depths[i];

  // Guarded: a fully stacked panel's span is small but never zero, and dividing
  // the lag by it is what distributes the lag along the panel.
  const spanForLag = Math.max(1e-6, span);
  const billow = SWAY_BILLOW * Math.min(1, Math.abs(sway) / Math.max(1e-6, widths[0]));

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
    // Billow: air trapped in front of a moving panel deepens the folds, and it
    // does so lowest down where the cloth is freest.
    const deepen = 1 + HEM_DEPTH_GAIN * vy * vy + billow * vy;

    // Depth read as height: forward of the track sits lower in frame, and more so
    // the further down the drop you look. This is what scallops the hem instead of
    // ruling a straight line under a rippling surface. See HEM_DEPTH_SWING.
    const swing = HEADING_DEPTH_SWING + (HEM_DEPTH_SWING - HEADING_DEPTH_SWING) * vy;

    // The lag at this height. Zero at the heading, since that is bolted to the
    // carriers, growing superlinearly to the full value at the hem.
    const lagAtRow = sway * Math.pow(vy, SWAY_SHAPE_POWER);

    for (let c = 0; c <= cols; c++, v++) {
      const i3 = v * 3;
      const z = colZ[c] * deepen;
      // Scaled by how far along the panel this column sits, because that is how
      // much it is actually being moved: the wall end is stacked and stationary
      // however hard the leading edge is pulled, so it has nothing to lag behind.
      const lag = lagAtRow * (colX[c] / spanForLag);
      positions[i3] = wallX + towardCentre * (colX[c] * splay + lag);
      positions[i3 + 1] = y - z * swing;
      positions[i3 + 2] = z;
      normals[i3] = colNx[c];
      normals[i3 + 1] = 0;
      normals[i3 + 2] = colNz[c];
      compression[v] = colComp[c];
      depth[v] = colZ[c] / maxDepth;
      // The y shear tilts the surface slightly out of the x-z plane. Left out of
      // the normal on purpose: at this magnitude it is a fraction of a degree,
      // and carrying it would cost a normalise per vertex to change nothing.
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
uniform float uTexAmount;
uniform float uBump;

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

  // THE CLOTH'S OWN SURFACE, from the sample photograph. RG are the surface
  // slope along u and v, B is height as albedo. See buildDetailTexture.
  vec3 tex = texture2D(uTexture, vUv * uTexRepeat).rgb;
  float slopeU = (tex.r - 0.5) * 2.0;
  float slopeV = (tex.g - 0.5) * 2.0;
  float relief = (tex.b - 0.5) * 2.0;

  // Tilt the normal by that slope, rather than just darkening the colour with
  // it. This is the whole difference between fabric and a flat panel: relief
  // catches the room light, so the cloth's creases and slub light up on the side
  // facing the window and fall away on the other, and they keep doing that as
  // the fold they sit on turns. Painted on as luminance instead, the same data
  // reads as dirt on a flat surface — which is exactly how it looked.
  //
  // v runs down the drop so its bitangent is world up, and u runs along the wave;
  // for a surface whose normal lies in the x-z plane that tangent is exactly
  // up x N, with no need to carry a tangent attribute.
  //
  // The geometric normal is kept as well. Relief belongs in the light REFLECTED
  // off the cloth, not in the light coming THROUGH it: transmission depends on how
  // far the light travels through the sheet, which is set by the fold the fabric
  // is lying on and not by which thread it crossed on the way out. Feeding the
  // bumped normal into the sheer's transmission made every thread flash
  // independently and the fabric came out looking like crumpled foil.
  vec3 geoN = N;
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 tangent = normalize(cross(up, N));
  N = normalize(N - (tangent * slopeU + up * slopeV) * uBump);

  // The selected colour is the fabric; the photo contributes only its deviation
  // from its own mean, so a white curtain stays white instead of picking up the
  // sample's grey.
  // Two terms, and the second is what keeps dark fabrics from going featureless.
  // The multiplicative term is what makes the selected colour survive — the
  // surface scales the colour rather than being mixed into it, so white stays
  // white — but it scales toward zero as the colour darkens, and on black a 30%
  // swing is a rounding error. The additive term is a fixed absolute swing that
  // does not shrink with the base colour: imperceptible against a pale fabric,
  // and carrying the entire surface on a charcoal or black one.
  vec3 colour = uColour * (1.0 + relief * uTexAmount)
              + vec3(relief * uTexAmount * 0.12);

  // --- LIGHTING -------------------------------------------------------------
  //
  // Deliberately narrow. Everything below used to run about three times the
  // contrast it does now, and the result read as heavy grey shadow painted into
  // the folds rather than as a lit surface — a curtain photographed with one hard
  // lamp in a black room. A real curtain lives in a bright interior: light arrives
  // from the window behind it, off the ceiling, off the floor, off the opposite
  // wall, so the darkest part of a fold is only modestly darker than the lightest.
  // The fold shape has to be carried by WHERE the tone changes, not by how far.

  // Room light: front, above, a little to the left, matching the rest of the
  // visualiser. Half-Lambert rather than clamped n-dot-l — cloth scatters light
  // around its own curvature and a hard terminator on a fold reads as plastic.
  // The exponent is near 1 now; raising it sharpened the terminator, which is the
  // opposite of what a soft interior does.
  vec3 L = normalize(vec3(-0.40, 0.32, 0.86));
  float wrap = dot(N, L) * 0.5 + 0.5;
  float shade = mix(0.80, 1.06, pow(wrap, 1.1));

  // Occlusion in the concave side of a fold, which sees less of the room than the
  // crest does. This is the one cue worth spending contrast on, because it is what
  // actually describes the fold, so it survives while the broad ramp above gives
  // way. Stronger once the waves pack together and start shading each other.
  float cavity = max(0.0, -vDepth);
  shade *= 1.0 - cavity * mix(0.05, 0.14, vCompression);

  // Packed fabric is denser — more layers, less light through and around it.
  shade *= mix(1.0, 0.95, vCompression);

  // The hem picks up floor bounce rather than window light, so it sits a shade
  // below the heading. Barely there on purpose: overdone it reads as the curtain
  // fading out at the bottom.
  float drop = 1.0 - vUv.y;
  shade *= 1.0 - drop * drop * 0.05;

  colour *= shade;

  float alpha = uOpacity;

  // SHEER. Backlit by the window, so brightness is governed by how far the light
  // travels through the cloth: where the surface faces the camera the path is
  // shortest and it glows, and where it turns edge-on the path is long and it goes
  // dense. That contrast is the whole character of a sheer.
  if (uIsSheer > 0.5) {
    float facing = pow(max(geoN.z, 0.0), 1.5);
    vec3 glow = colour + vec3(0.13, 0.11, 0.06);
    colour = mix(colour * 0.90, glow, facing * (1.0 - vCompression * 0.4));

    // TRANSPARENCY FROM THE WEAVE ITSELF, which is the honest way to draw a sheer:
    // it is not a uniformly hazy sheet, it is an open cloth, and what you see
    // through it is the gaps between its threads. So the slub reads as slightly
    // more solid and the open weave as slightly clearer, from the same relief
    // channel the lighting uses. A flat alpha is what made it look like tinted
    // glass rather than fabric.
    alpha *= clamp(1.0 + relief * 0.30, 0.80, 1.10);

    // Packed fabric is layer upon layer, and stacks up nearly solid at the ends.
    alpha = mix(alpha, min(1.0, alpha + 0.14), vCompression);
  }

  gl_FragColor = vec4(colour, clamp(alpha, 0.0, 1.0));
}
`;

// ---------------------------------------------------------------------------
// THE TRACK
//
// Wave curtains do not hang from a pole, they hang from an aluminium track: a
// slim extrusion with a channel along its underside, and gliders running in that
// channel at the heading tape's snap spacing. What was here before was a single
// gradient strip, which is why it read as a roller blind's tube — the two things
// that make a track a track are the CHANNEL and the RUNNERS in it, and it had
// neither.
//
// Drawn as a real profile seen dead on, top to bottom: a bright chamfer along the
// top edge where the extrusion faces the ceiling, a flat front face falling away
// gently, a lower chamfer picking up floor bounce, and a recessed channel in
// shadow with the gliders visible inside it.
//
// Proportions are from the actual hardware — a 16mm face, gliders at 80mm centres
// (which is the same 80mm that makes our 160mm wave pitch, so the runners land on
// the wave zero-crossings by construction), brackets at 600mm centres.
// ---------------------------------------------------------------------------

/** Real profile height, mm. */
const TRACK_FACE_MM = 16;

/** How much the track is drawn oversized, and why it has to be.
 *
 * At true scale a 16mm track is under three pixels on the default room photo,
 * which cannot carry a chamfer, a channel and a row of gliders — it is one grey
 * line. So the profile is drawn about two and a half times life size. Everything
 * INSIDE it stays in correct proportion, and the two spacings that are big enough
 * to render honestly, the gliders and the brackets, are left at their real
 * dimensions. The alternative was a track nobody can see. */
const TRACK_OVERSIZE = 2.4;

/** Floor in pixels, so a small trace or a low-resolution photo still gets a track
 * with a readable profile rather than a hairline. */
const TRACK_MIN_PX = 6;

/** Glider centres, mm. The 80mm wave standard — and the same 80mm the heading
 * tape uses, so one glider sits at every point where the fabric crosses the track
 * plane. */
const RUNNER_PITCH_MM = 80;

/** Bracket centres, mm. 600mm is the maximum the manufacturers specify. */
const BRACKET_PITCH_MM = 600;

/** How far a face-fixed track hangs below its fixing line, as a multiple of the
 * track's own height. Wall brackets exist to hold the track off the wall, and the
 * gap they leave is the whole visual difference between the two mounts. */
const BRACKET_DROP = 1.15;

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
uniform float uIsChrome;
/** Glider pitch in uv.x units, so runners can be drawn procedurally rather than
 * as nineteen more meshes. */
uniform float uRunnerPitch;

varying vec2 vUv;

void main() {
  float y = vUv.y;          // 1 at the top of the extrusion
  float shade;

  if (y > 0.86) {
    // TOP CHAMFER — faces the ceiling, so it takes the most light and is what
    // makes the track read as having a top surface at all.
    shade = 1.06;
  } else if (y > 0.36) {
    // FRONT FACE. Falls away downward, gently: a flat anodised face, not a tube.
    // The old strip ramped hard over its whole height, which is exactly what a
    // cylinder does and is why it looked like a roller.
    shade = mix(0.84, 1.0, (y - 0.36) / 0.5);
  } else if (y > 0.27) {
    // LOWER CHAMFER — turns down and forward, catching a little floor bounce.
    shade = 0.9;
  } else {
    // CHANNEL. Recessed, so it is the darkest part of the profile by a long way.
    // This is the single feature that separates a track from a bar.
    shade = 0.4;
  }

  // Chrome is a rolled metal surface rather than a painted one: a hard bright
  // band where it mirrors the ceiling, a dark one where it mirrors the room.
  if (uIsChrome > 0.5) {
    shade *= 1.0 + 0.22 * sin((y - 0.2) * 6.0);
  }

  // GLIDERS in the channel. Rounded, slightly proud of the slot, and lit from
  // above like everything else. They are what the fabric actually hangs from, and
  // at this spacing they also read as the reason the waves are where they are.
  if (y <= 0.27) {
    float u = vUv.x / max(uRunnerPitch, 1e-5);
    float d = abs(fract(u) - 0.5) * 2.0;     // 0 at a glider's centre
    float bead = 1.0 - smoothstep(0.15, 0.55, d);
    // Brighter on the bead's upper half, so each one reads as a small round body
    // rather than as a painted dash.
    float lift = mix(0.72, 1.02, smoothstep(0.02, 0.24, y));
    shade = mix(shade, lift, bead);
  }

  // The slot's own opening along the very bottom edge — a dark hairline, which is
  // what you actually see of a channel from the front.
  shade *= 1.0 - (1.0 - smoothstep(0.0, 0.05, y)) * 0.45;

  gl_FragColor = vec4(uColour * shade, 1.0);
}
`;

/** End cap. Moulded, slightly proud of the profile, and flat rather than
 * chamfered — so it reads as a cap and not as more track. */
const TRACK_CAP_FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 uColour;
varying vec2 vUv;
void main() {
  float shade = mix(0.78, 1.02, smoothstep(0.0, 0.85, vUv.y));
  // Inner edge in shadow where it meets the extrusion.
  shade *= 1.0 - (1.0 - smoothstep(0.0, 0.22, vUv.x)) * 0.18;
  gl_FragColor = vec4(uColour * shade, 1.0);
}
`;

/** Wall brackets, plus the shadow the track throws on the wall behind it.
 *
 * Drawn on one strip spanning the fixing gap, because a face-fixed track's
 * brackets are behind it: dead on from the room you see the plate bridging the
 * gap between the wall and the track, and — more tellingly than the bracket
 * itself — the shadow the whole assembly casts on the wall above.
 */
const BRACKET_FRAGMENT_SHADER = `
precision mediump float;

uniform vec3 uColour;
uniform float uBracketPitch;   // in uv.x units
uniform float uBracketWidth;   // ditto

varying vec2 vUv;

void main() {
  // Shadow on the wall: darkest immediately under the fixing line and fading up.
  float shadow = (1.0 - smoothstep(0.0, 0.75, vUv.y)) * 0.30;

  float u = vUv.x / max(uBracketPitch, 1e-5);
  float d = abs(fract(u) - 0.5) * 2.0;
  float half = uBracketWidth / max(uBracketPitch, 1e-5);
  float onBracket = 1.0 - smoothstep(half, half * 1.5, d);

  if (onBracket > 0.01) {
    // The plate itself: hardware colour, and darker than the track's front face
    // because it faces down the wall rather than out into the room.
    float plate = mix(0.62, 0.78, vUv.y);
    gl_FragColor = vec4(uColour * plate, onBracket);
  } else {
    gl_FragColor = vec4(0.05, 0.04, 0.03, shadow);
  }
}
`;

// --- Fabric textures ------------------------------------------------------

// ---------------------------------------------------------------------------
// FABRIC — purpose-made flat swatches
//
// These are shot (well, generated) to spec for this renderer: 1254px square,
// the cloth flat and taut, lit dead even edge to edge, weave filling the
// frame, no props and no watermark. That specification is the reason this
// section is now short.
//
// The samples it replaced were draped studio photographs, and nearly all the
// machinery here existed to undo that: they carried their own folds and their
// own lighting, which tiled onto our waves as a second set of creases lying
// at the wrong angle, and a badge in one corner that tiled as a row of dark
// blobs. Undoing it took a search for the frame's flattest patch, a crop that
// dodged the badge, and a low pass aggressive enough to strip every crease —
// which took most of the fabric's character with it and left something close
// enough to flat colour that the two cloths were indistinguishable.
//
// A flat swatch needs none of that. The whole frame is usable, and the low
// pass only has to remove the swatch's overall level so the shader gets a
// deviation rather than a colour. Everything else — thread grid, slub,
// surface — is kept and used as relief.
// ---------------------------------------------------------------------------

const FABRIC_SAMPLE: Record<'blockout' | 'sheer', string> = {
  // CASE-SENSITIVE all the way down, and these two do not even agree with each
  // other: `Blockout_produced` is capitalised and `sheer_produced` is not, and
  // `curtains` is lowercase. A Linux host serves any other casing as a
  // different URL that 404s, which is the worst failure shape there is — it
  // only shows up after deploy. Match the filenames on disk exactly.
  blockout: '/images/Textures/curtains/Blockout_produced.png',
  sheer: '/images/Textures/curtains/sheer_produced.png',
};

/** Working size of the extracted detail map. The swatches are 1254px square and
 * the whole frame is usable, so 1024 is a mild downscale that keeps the weave
 * resolved — the blockout's threads sit about 4px apart in the source, and at 512
 * they landed on the Nyquist limit and half blurred away. */
const DETAIL_SIZE = 1024;

/** Resolution the low frequencies are measured at, as a fraction of DETAIL_SIZE.
 *
 * Down to 1/32 now the swatches are flat: each cell is ~32px, so only structure
 * broader than about 64px is removed. On an evenly lit swatch there is almost
 * nothing at that scale to take out beyond the overall grey level, which is the
 * one thing that does have to go — the shader wants a deviation to modulate the
 * selected colour with, not a colour of its own.
 *
 * Everything finer is kept and used as relief, which now includes the sheer's
 * slub patches. Those are the fabric, and with one tile per panel they appear
 * once rather than repeating, so they read as cloth varying across its width. The
 * draped samples needed this eight times more aggressive purely to kill creases,
 * and that took the character out with them. */
const DETAIL_LOW_FRACTION = 1 / 32;
const DETAIL_LOW_SIZE = Math.round(DETAIL_SIZE * DETAIL_LOW_FRACTION);

/** Standard deviation the packed slope channels are normalised to. Keeps the
 * 8-bit range well used and makes uBump mean the same thing for any sample. */
const SLOPE_TARGET_STD = 0.16;

/** Standard deviation the detail map is normalised to, so uTexAmount means the
 * same thing whatever the sample photo's own contrast happens to be. Swap in a
 * new fabric and it arrives at a comparable strength instead of needing the
 * shader retuned. */
const DETAIL_TARGET_STD = 0.055;

// SAMPLE_CROP and pickFlattestCrop lived here. The crop used to be two thirds of
// the frame, positioned by scoring a grid of candidates for whichever patch had
// the least large-scale structure in it — because a crease is high-frequency
// across itself, survives any filter strong enough to keep the weave, and ends up
// ruled diagonally across the curtain, so the only real answer was to not crop
// one. On a flat swatch there is no crease to dodge and no badge to avoid, so the
// crop is the whole frame and there is nothing to choose.

interface FabricTexture {
  texture: THREE.Texture;
}

const textureCache = new Map<string, Promise<FabricTexture>>();

function buildDetailTexture(path: string): Promise<FabricTexture> {
  let cached = textureCache.get(path);
  if (cached) return cached;

  cached = (async () => {
    const img = await loadImage(path);
    const S = DETAIL_SIZE;
    const L = DETAIL_LOW_SIZE;

    // The whole frame, squared off from the centre in case a future swatch is not
    // square. These are, so this is a straight full-frame read.
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;

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

    // HEIGHT = photo minus its own low frequencies. What is left is the cloth's
    // surface: its creases, its slub, its weave — the ups and downs the sample
    // was photographed with, minus the studio's lighting.
    const height = new Float32Array(S * S);
    let sum = 0;
    for (let y = 0; y < S; y++) {
      const fy = ((y + 0.5) / S) * L - 0.5;
      for (let x = 0; x < S; x++) {
        const i = y * S + x;
        const luma = (src[i * 4] * 0.299 + src[i * 4 + 1] * 0.587 + src[i * 4 + 2] * 0.114) / 255;
        const d = luma - sampleLow(((x + 0.5) / S) * L - 0.5, fy);
        height[i] = d;
        sum += d;
      }
    }
    const mean = sum / (S * S);
    let variance = 0;
    for (let i = 0; i < S * S; i++) {
      const d = height[i] - mean;
      variance += d * d;
    }
    const std = Math.sqrt(variance / (S * S));
    const gain = Math.min(8, Math.max(0.2, DETAIL_TARGET_STD / Math.max(1e-5, std)));
    for (let i = 0; i < S * S; i++) height[i] = (height[i] - mean) * gain;

    // SLOPE. The relief is used by tilting the surface normal, not by darkening
    // the colour, and that needs the height field's gradient. Central
    // differences, wrapped, so the edges get a slope like everywhere else.
    const gx = new Float32Array(S * S);
    const gy = new Float32Array(S * S);
    let slopeVar = 0;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const i = y * S + x;
        const xl = (x + S - 1) % S;
        const xr = (x + 1) % S;
        const yu = (y + S - 1) % S;
        const yd = (y + 1) % S;
        gx[i] = (height[y * S + xr] - height[y * S + xl]) * 0.5;
        gy[i] = (height[yd * S + x] - height[yu * S + x]) * 0.5;
        slopeVar += gx[i] * gx[i] + gy[i] * gy[i];
      }
    }
    const slopeStd = Math.sqrt(slopeVar / (2 * S * S));
    const slopeGain = Math.min(40, Math.max(0.5, SLOPE_TARGET_STD / Math.max(1e-6, slopeStd)));

    // Packed: RG carry the surface slope along u and v, B carries the height as
    // albedo variation. One fetch in the shader rather than three, which matters
    // on the hardware this has to run on.
    const out = document.createElement('canvas');
    out.width = S;
    out.height = S;
    const octx = out.getContext('2d');
    if (!octx) throw new Error('2d context unavailable');
    const image = octx.createImageData(S, S);
    const pack = (v: number) => Math.round(Math.min(255, Math.max(0, (v * 0.5 + 0.5) * 255)));
    for (let i = 0; i < S * S; i++) {
      image.data[i * 4] = pack(gx[i] * slopeGain);
      image.data[i * 4 + 1] = pack(gy[i] * slopeGain);
      image.data[i * 4 + 2] = pack(height[i]);
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

    return { texture };
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
  /** Natural frequency of the hem's swing, rad/s. From the drop in METRES, which
   * is why the renderer needs a physical scale at all. */
  omega: number;
  /** Ceiling on the hem's lag, px. */
  maxSway: number;
  /** One panel's width with the curtain shut, px — the centre line, as far as the
   * leading edge can ever travel. The cloth solver clamps against it so two
   * closing hems cannot swing through each other. */
  shutPanelWidth: number;
}

export default function Canvas2DCurtainRenderer({
  tl, tr, br, bl,
  fabricType,
  hardwareColour,
  mount,
  colour,
  openness,
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

  // One cloth state serves both panels. They are mirror images pulled at the same
  // rate, so their spans and therefore their dynamics are identical in panel-local
  // coordinates; only the anchor and the direction differ, and both of those are
  // applied at draw time.
  const swayRef = useRef<SwayState | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  /** Repositions both panels and repaints. Writes into buffers allocated once at
   * setup — see createPanelMesh. */
  const draw = (open: number, sway: number) => {
    const layout = layoutRef.current;
    const left = leftMeshRef.current;
    const right = rightMeshRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!layout || !left || !right || !renderer || !scene || !camera) return;

    const { windowLeft, windowRight, windowTop, windowBottom, waveCount, shutWaveWidth } = layout;
    // One layout serves both panels — the wave widths are identical.
    const shaped = panelLayout(waveCount, shutWaveWidth, open);

    writePanelMesh(left, {
      layout: shaped,
      wallX: windowLeft,
      towardCentre: 1,
      topY: windowTop,
      bottomY: windowBottom,
      sway,
    });
    writePanelMesh(right, {
      layout: shaped,
      wallX: windowRight,
      towardCentre: -1,
      topY: windowTop,
      bottomY: windowBottom,
      sway,
    });

    renderer.render(scene, camera);
  };

  /** Runs the cloth solver until the hem is still.
   *
   * A frame loop rather than a redraw per openness change, because the cloth
   * outlives the input: the interesting part of a curtain's motion is the swing
   * AFTER you stop dragging, and a renderer that only repaints when its props
   * change can never show it. The loop starts on any openness change and stops
   * itself once the panel is settled, so a curtain standing still costs nothing —
   * which is the whole reason the geometry writes are in-place. */
  const runSolver = () => {
    if (frameRef.current !== null) return; // already running

    const tick = (now: number) => {
      frameRef.current = null;
      const layout = layoutRef.current;
      const sway = swayRef.current;
      if (!layout || !sway) return;

      const dt = Math.min(MAX_STEP, Math.max(0, (now - lastTimeRef.current) / 1000));
      lastTimeRef.current = now;

      const open = opennessRef.current;
      // The solver is driven by the leading edge's real position, not by openness
      // directly: openness is a 0..1 control value, and the compression curve
      // between it and the fabric is not linear. Physics has to see the pixels the
      // cloth is actually being moved through.
      const span = panelLayout(layout.waveCount, layout.shutWaveWidth, open).span;
      const offset = stepSway(
        sway, span, dt, layout.omega, layout.maxSway,
        layout.shutPanelWidth - span,
      );
      draw(open, offset);

      // Keep going while the cloth is moving OR the input still is. The input test
      // is on the velocity the solver just recorded, not on a span comparison —
      // stepSway has already overwritten lastSpan by this point, so differencing
      // it here would always read zero. It matters for a slow drag, where the lag
      // can pass through zero between frames and would otherwise look settled
      // mid-motion.
      const inputMoving = Math.abs(sway.lastVelocity) > 1e-3;
      if (!swaySettled(sway) || inputMoving) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        // Land exactly at rest so a settled panel is bit-identical frame to frame
        // and never leaves a sub-pixel shimmer behind.
        sway.offset = 0;
        sway.speed = 0;
        draw(open, 0);
      }
    };

    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(tick);
  };

  const stopSolver = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
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

      // WAVE COUNT — the same on every window. See WAVES_PER_PANEL.
      const waveCount = WAVES_PER_PANEL;

      // Panels meet at the centre with a hairline between them, so a shut pair
      // reads as two panels rather than one sheet.
      const gap = windowWidth * 0.004;
      const shutPanelWidth = (windowWidth - gap) / 2;
      const shutWaveWidth = shutPanelWidth / waveCount;

      // PHYSICAL SCALE, backwards out of the wave pitch. Each wave is 160mm of
      // track whatever the window measures, so one wave's width in pixels IS the
      // conversion — and the drop follows from the traced window's aspect. The
      // cloth solver needs metres: a pendulum's period comes from its length, and
      // a tall curtain has to swing more slowly than a short one.
      const pxPerMm = shutWaveWidth / WAVE_PITCH_MM;
      const dropMetres = Math.max(0.3, (windowTop - windowBottom) / pxPerMm / 1000);
      const omega = SWAY_FREQ_SCALE * 1.2024 * Math.sqrt(GRAVITY / dropMetres);

      // TRACK AND MOUNT. A face-fixed (window mount) track hangs off brackets, so
      // it sits below its fixing line with a visible gap; a ceiling-mounted one
      // clamps flush with nothing showing above it. That gap is the entire visual
      // difference between the two options, and until now `mount` was read and
      // discarded — the control did nothing at all.
      const trackHeight = Math.max(TRACK_MIN_PX, TRACK_FACE_MM * pxPerMm * TRACK_OVERSIZE);
      const faceFixed = mount !== 'ceiling';
      const bracketDrop = faceFixed ? trackHeight * BRACKET_DROP : 0;
      // The heading hangs from the track, so the fabric starts below the brackets.
      const headingY = windowTop - bracketDrop;

      layoutRef.current = {
        windowLeft,
        windowRight,
        windowTop: headingY,
        windowBottom,
        waveCount,
        shutWaveWidth,
        omega,
        maxSway: shutWaveWidth * SWAY_MAX_RATIO,
        shutPanelWidth,
      };

      // The cloth starts at rest, wherever the panel happens to be — a fresh trace
      // or a photo swap is not a curtain being yanked.
      swayRef.current = newSwayState(
        panelLayout(waveCount, shutWaveWidth, opennessRef.current).span,
      );

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

      // MSAA back on. It was turned off on the grounds that the only hard edge in
      // the scene was the panel silhouette and that edge was vertical, so the CSS
      // downscale could carry it. That stopped being true the moment the hem
      // started following the fold depth: a shallow sloped edge is the worst case
      // for aliasing, and the scallop came out as a hard sawtooth. Cheaper than
      // supersampling the whole buffer to fix one edge, and the curtain path has
      // the headroom for it.
      const renderer = new THREE.WebGLRenderer({
        canvas: threeCanvas,
        alpha: true,
        antialias: true,
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
            uOpacity: { value: isSheer ? sheerOpacity(colour) : 1.0 },
            uIsSheer: { value: isSheer ? 1.0 : 0.0 },
            uTexture: { value: fabric.texture },
            uTexRepeat: { value: repeat },
            // Albedo variation stays modest: the relief now carries the surface
            // through the lighting, and doubling it up in the colour as well
            // pushes the cloth back toward looking stained.
            uTexAmount: { value: isSheer ? 0.30 : 0.32 },
            // How hard the sample's relief tilts the normal — and therefore how
            // much the cloth glints. Pulled down from 0.7/1.0: a steep normal
            // tilt on every thread catches the light like a sheen, which is what
            // was making the fabric look faintly satin. Enough to read the weave
            // as a surface, not enough to make it shine. The sheer sits lower
            // again despite the more pronounced weave, because a backlit veil is
            // mostly transmitted light and relief on top of that reads as
            // glitter rather than as thread.
            uBump: { value: isSheer ? 0.45 : 0.6 },
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

      // --- TRACK ASSEMBLY -------------------------------------------------
      // The panels hang from something, and it has to look like the thing they
      // actually hang from. In front of the deepest possible wave so it covers the
      // heading, the way a real track hides the top of the tape.
      const hw = hexToRgb(HARDWARE_HEX[hardwareColour] ?? HARDWARE_HEX.white);
      const hardwareVec = new THREE.Vector3(hw.r / 255, hw.g / 255, hw.b / 255);
      const trackZ = shutWaveWidth * DEPTH_PACKED * (1 + HEM_DEPTH_GAIN) * 1.3 + 1;
      const centreX = (windowLeft + windowRight) / 2;

      // BRACKETS — face fix only. Drawn first so the track overlaps their lower
      // end, which is how a bracket actually sits: behind the extrusion, clipped
      // to it. The strip also carries the shadow the assembly throws on the wall.
      if (faceFixed && bracketDrop > 0.5) {
        const bracketMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uColour: { value: hardwareVec },
            uBracketPitch: { value: (BRACKET_PITCH_MM * pxPerMm) / windowWidth },
            // A bracket plate is around 25mm across the face.
            uBracketWidth: { value: (25 * pxPerMm) / windowWidth },
          },
          vertexShader: TRACK_VERTEX_SHADER,
          fragmentShader: BRACKET_FRAGMENT_SHADER,
          transparent: true,
          depthWrite: false,
        });
        // Overlapped upward past the fixing line so the wall shadow has somewhere
        // to fall, and downward so the plate disappears behind the track.
        const stripH = bracketDrop + trackHeight * 0.6;
        const bracketStrip = new THREE.Mesh(
          new THREE.PlaneGeometry(windowWidth, stripH),
          bracketMaterial,
        );
        bracketStrip.position.set(centreX, windowTop - stripH / 2 + trackHeight * 0.1, trackZ - 1);
        bracketStrip.renderOrder = 2;
        scene.add(bracketStrip);
      }

      const trackMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColour: { value: hardwareVec },
          uIsChrome: { value: hardwareColour === 'chrome' ? 1 : 0 },
          // Glider pitch in uv.x. Real 80mm centres — and since the wave pitch is
          // two of these, a glider lands on every wave zero-crossing without
          // anything having to be aligned by hand.
          uRunnerPitch: { value: (RUNNER_PITCH_MM * pxPerMm) / windowWidth },
        },
        vertexShader: TRACK_VERTEX_SHADER,
        fragmentShader: TRACK_FRAGMENT_SHADER,
      });
      const track = new THREE.Mesh(
        new THREE.PlaneGeometry(windowWidth, trackHeight),
        trackMaterial,
      );
      track.position.set(centreX, headingY + trackHeight / 2, trackZ);
      track.renderOrder = 3;
      scene.add(track);

      // END CAPS — a track is cut to length and capped, and the cap is a moulded
      // part slightly proud of the extrusion. Without them the track runs off the
      // edge of the opening as if it continued through the wall.
      const capW = Math.max(2, trackHeight * 0.42);
      const capMaterial = new THREE.ShaderMaterial({
        uniforms: { uColour: { value: hardwareVec } },
        vertexShader: TRACK_VERTEX_SHADER,
        fragmentShader: TRACK_CAP_FRAGMENT_SHADER,
      });
      for (const [x, flip] of [[windowLeft, -1], [windowRight, 1]] as const) {
        const cap = new THREE.Mesh(
          new THREE.PlaneGeometry(capW, trackHeight * 1.06),
          capMaterial,
        );
        cap.position.set(x + (flip * capW) / 2, headingY + trackHeight / 2, trackZ + 0.5);
        cap.scale.x = flip;
        cap.renderOrder = 4;
        scene.add(cap);
      }

      draw(opennessRef.current, 0);
    };

    init();

    return () => {
      cancelled = true;
      stopSolver();
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
    mount, fabricType, hardwareColour,
  ]);

  // Openness kicks the solver rather than drawing. The solver reads the live
  // openness off its ref every frame and keeps running past the last prop change,
  // which is what lets the hem finish its swing after the input stops.
  useEffect(() => {
    runSolver();
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
    const isSheer = fabricType === 'sheer';
    for (const material of materials) {
      (material.uniforms.uColour.value as THREE.Vector3).set(rgb.r / 255, rgb.g / 255, rgb.b / 255);
      // A sheer's opacity is a function of its colour, so it has to move with it.
      if (isSheer) material.uniforms.uOpacity.value = sheerOpacity(colour);
    }
    renderer.render(scene, camera);
  }, [colour, fabricType]);

  useEffect(() => {
    return () => {
      // The solver holds a rAF handle and touches the renderer, so it has to stop
      // before anything it draws into is disposed.
      stopSolver();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
