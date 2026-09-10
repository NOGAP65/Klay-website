import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { computeHomography } from './homography';
import { foldLean, foldDepth, MIN_FOLD_PITCH } from './curtainCloth';
import { createCurtainLighting, type CurtainLighting } from './curtainLighting';

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
  /** Ordered track width — 'small' | 'medium' | 'large' | 'xl'.
   *
   * IT NO LONGER SETS THE WAVE COUNT. The count comes from the traced window
   * now — see wavesForTrace — because fold count is a physical property of cloth
   * spanning an opening, and the ordered size is a dropdown that may not
   * describe the window in the photograph at all. The traced version is the
   * honest one.
   *
   * KEPT ON THE INTERFACE ANYWAY, and deliberately: callers still pass it, and
   * whether anything else in the renderer should read it is a separate question
   * this reconciliation does not answer. Removing it would be making that
   * decision by omission. It is not destructured below, because nothing in the
   * body reads it yet. */
  size?: string;
  /** 0 = shut (panels meet at the centre), 1 = fully drawn back. */
  openness: number;
  canvasWidth: number;
  canvasHeight: number;
  photoUrl: string;
}

// Fold spacing is calibrated to the room photographs and remains independent
// of image resolution. Wider traced openings carry more folds; the count stays
// fixed while opening so fabric gathers instead of disappearing.
const MIN_WAVES_PER_PANEL = 5;
const MAX_WAVES_PER_PANEL = 28;
const WAVES_AT_FULL_FRAME = 18;
const wavesForTrace = (tracedWidthPx: number, framePx: number): number => {
  const fraction = framePx > 0 ? tracedWidthPx / framePx : 0.5;
  return Math.min(MAX_WAVES_PER_PANEL, Math.max(MIN_WAVES_PER_PANEL, Math.round(fraction * WAVES_AT_FULL_FRAME)));
};
const WAVE_PITCH_MM = 160;

// Fully gathered cloth occupies 24% of the track. The cached arc-length
// solution preserves fullness while the spacing between carriers changes.
const OPEN_STACK_FRACTION = MIN_FOLD_PITCH;
const WAVE_MIN_RATIO = OPEN_STACK_FRACTION;
const DEPTH_PACKED = foldDepth(MIN_FOLD_PITCH, 1);

/** Width of the compression front, in waves. A hard sequential handover — wave
 * n at its minimum before wave n+1 starts moving — steps visibly as the slider
 * travels. Real fabric loads up its neighbours, so the front is soft over about
 * a wave and a half. */
const FRONT_SOFTNESS = 1.6;

/** How much wider the hem sits than the heading on a stacked panel. The top is
 * pinned to its carrier; below that the fabric is free and a bunched panel
 * splays toward the room. Scaled by how compressed the panel is, so a shut
 * curtain hangs straight and the two panels never cross at the centre. */
const HEM_SPLAY = 0.16;

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
const HEM_DEPTH_SWING = 0.10;

/** The heading gets a swing too, and this is what stops the top of the panel
 * reading as a box.
 *
 * It was zero. The reasoning was sound as far as it went — the fabric is clipped
 * to its carriers, and any swing lifted the back half of each wave above the
 * track as a row of dark specks — but the cost was that the top edge came out as
 * a dead straight horizontal line ruled across a rippling surface. A real wave
 * curtain does not do that: the bays that bow toward the room hang visibly lower
 * than the ones that bow away, so the heading scallops just like the hem, only
 * shallower.
 *
 * The specks are fixed properly by HEADING_SINK below rather than by giving up
 * the scallop. Smaller than HEM_DEPTH_SWING because the projection effect really
 * does grow with distance below the camera axis. */
const HEADING_DEPTH_SWING = 0.018;

/** Sinks the heading by its own worst upward excursion, so the scallop hangs
 * BELOW the track line instead of straddling it.
 *
 * z swings symmetrically (colZ = amp * sin), so the shear lowers the forward
 * bays and raises the back ones by the same amount. Dropping the whole heading
 * by that amount puts the highest point back on the track line. Slightly over 1
 * so the back bays finish a shade inside the track's band and are occluded by
 * it — the overlap is what removes the seam between fabric and hardware. */
const HEADING_SINK = 1.12;

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
/** --- GRAVITY IN THE HANGING CLOTH ---------------------------------------
 *
 * Everything above describes the wave as seen from ABOVE — one cross-section,
 * correct at the track. What follows is what the same cloth does on its way
 * down, and it is the difference between a curtain and a sheet of corrugated
 * plastic.
 *
 * The old surface had none of it. z was a function of x alone, evaluated once
 * per column and reused for every row, which is why the render came out as
 * vertical stripes of exactly constant tone: every fold cue in the shader reads
 * the normal, the normal never changed down the drop, so neither could the
 * shading. ROWS was 8 for the same reason, and the comment defending that
 * number stated the assumption out loud — nothing in the surface varied quickly
 * down the drop. Nothing did, because nothing was allowed to.
 */

// Fixed at the tape, individual folds drift and bow gently down the drop.
// The photo shading travels with the same vertices, preserving the fabric grain.
const FOLD_WANDER = 0.38;
const FOLD_WANDER_POWER = 1.35;

/** THE WEIGHTED HEM BAND, which is stiffer than the cloth above it.
 *
 * A made curtain has a doubled hem with a weight in it. It cannot take the full
 * fold depth the free cloth above does, so the section pulls in over the last
 * few percent of the drop. This is what rounds the bottom edge off. Without it
 * the hem was a sawtooth — the sine at full amplitude cut straight across — and
 * a sawtooth hem is a paper fan, not a curtain.
 */
const HEM_STIFFEN = 0.32;
const HEM_STIFFEN_SPAN = 0.08;

/** HOW UNEVEN THE HEM IS, as a fraction of the drop.
 *
 * A hem is a straight line only on a drawing. On a made curtain every fold
 * finishes a millimetre or two off its neighbour — the cloth is cut and sewn
 * flat and then asked to hang in waves, and the two do not reconcile exactly —
 * so the bottom edge is a soft irregular curve. The photograph shows it plainly:
 * the hem wanders by something like a centimetre across a panel, and no two
 * folds end level.
 *
 * Applied by shortening each COLUMN'S drop rather than by moving the bottom row
 * around, which is what makes it grow smoothly out of nothing: at the heading
 * the term is zero however uneven the hem, because the tape holds the top and
 * only the free end can wander.
 */
const HEM_UNEVEN = 0.004;

/** The doubled hem band, as a fraction of the drop, and how much darker it is.
 *
 * The bottom of a made curtain is folded twice and often weighted, so it is two
 * or three layers where the rest is one. On a sheer that is unmissable: a
 * distinctly denser strip along the bottom edge, which is exactly what the
 * backlit reference shows. Without it the cloth just stops. */
const HEM_BAND = 0.035;


/** THE SHADOW THE CURTAIN THROWS ON THE SILL.
 *
 * Panels were being composited onto the photograph with nothing underneath
 * them, so they read as pasted on — the single biggest tell left after the
 * folds were fixed. In the reference the sill under the cloth goes markedly
 * dark, and the darkening is deepest right at the hem and gone within a few
 * centimetres.
 *
 * Drawn as its own quad in the same warped space as the track, behind the
 * cloth, rather than painted into the background canvas: it has to move with
 * the panel as the curtain is drawn back, and the background is composited
 * once. */
/** HOW HARD THE SHEER SCATTERS WHAT IS BEHIND IT.
 *
 * The backdrop is redrawn at this fraction of the photograph's width and
 * sampled back up, which is a blur by resampling — cheap, and the softness
 * scales with the image rather than being a fixed pixel radius that would mean
 * one thing on a 1254px room and another on a 4000px phone photo.
 *
 * A twelfth is a sheer, not frosted glass: at this radius a garden behind the
 * cloth stays a garden — you can see it is green and leafy — but no single leaf
 * survives, which is exactly the line a real sheer draws. */
const SHEER_DIFFUSION = 1 / 24;



const SILL_SHADOW_DROP = 0.055;
const SILL_SHADOW_ALPHA = 0.34;

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

/** The disturbance takes TIME to travel down the panel, and this is what makes
 * the difference between cloth and a shape function.
 *
 * The lag used to be applied as sway·vy^p on every row of the same frame, so the
 * whole panel deformed to its new shape at once: pull the heading and the hem
 * responds in the same instant, only by less. Real cloth does not do that — the
 * heading moves, and a moment later the hem finds out.
 *
 * On a chain hanging under its own weight the transverse wave speed at depth x is
 * sqrt(g·x), so the time to reach depth h is 2·sqrt(h/g), and the delay profile
 * down the drop goes as sqrt(vy). That is the shape used below.
 *
 * Divided by SWAY_FREQ_SCALE for exactly the reason that constant exists: an
 * ideal limp chain is slower than a curtain, which is stiffer across its width
 * and much lighter. Keeping the two tied together means the panel's travel time
 * and its swing period stay consistent with each other. */
const SWAY_TRAVEL_SCALE = 0.62;

/** Spread in arrival time between neighbouring folds, as a fraction of the full
 * travel time. Folds are coupled by the heading tape but not welded to each
 * other, and without this the panel ripples as one rigid sheet — every fold
 * reaching its extreme on precisely the same frame, which is the tell that it is
 * a formula and not cloth. Small: past a few percent it stops reading as slack
 * and starts reading as a wobble. */
const SWAY_FOLD_STAGGER = 0.16;

/** How many past lag values to keep. At 60fps this covers about 0.8s, comfortably
 * longer than any travel time the formula produces. */
const SWAY_HISTORY = 50;

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
  /** Ring buffer of recent lag values, so a row partway down the drop can be
   *  drawn with the lag the panel had when the wave passed it. Newest at head. */
  histT: Float64Array;
  histV: Float64Array;
  head: number;
  filled: number;
}

const newSwayState = (span: number): SwayState => ({
  offset: 0,
  speed: 0,
  lastSpan: span,
  lastVelocity: 0,
  histT: new Float64Array(SWAY_HISTORY),
  histV: new Float64Array(SWAY_HISTORY),
  head: -1,
  filled: 0,
});

/** Pushes the current lag onto the history. */
function recordSway(state: SwayState, t: number, value: number): void {
  state.head = (state.head + 1) % SWAY_HISTORY;
  state.histT[state.head] = t;
  state.histV[state.head] = value;
  if (state.filled < SWAY_HISTORY) state.filled++;
}

/** The lag as it was at time `t`, linearly interpolated.
 *
 * Walks back from newest to oldest, which is the right direction: the samples
 * being asked for are always recent, so this exits within a few steps rather
 * than scanning the buffer. Clamps at both ends — before the history starts the
 * panel was at rest, and past the newest sample there is nothing to predict. */
function sampleSway(state: SwayState, t: number): number {
  if (state.filled === 0) return 0;
  let prevIdx = state.head;
  if (t >= state.histT[prevIdx]) return state.histV[prevIdx];

  for (let n = 1; n < state.filled; n++) {
    const idx = (state.head - n + SWAY_HISTORY * 2) % SWAY_HISTORY;
    if (state.histT[idx] <= t) {
      const t0 = state.histT[idx];
      const t1 = state.histT[prevIdx];
      const span = t1 - t0;
      if (span <= 1e-9) return state.histV[idx];
      const f = (t - t0) / span;
      return state.histV[idx] + (state.histV[prevIdx] - state.histV[idx]) * f;
    }
    prevIdx = idx;
  }
  // Older than anything recorded: the panel had not started moving yet.
  return state.histV[prevIdx];
}

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
  /** Now, in seconds. Stamps the history the delayed rows read back from. */
  nowSec: number,
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

  // Recorded AFTER clamping, so what the rows below read back is the lag the
  // panel actually had, not one the cloth was never allowed to reach.
  recordSway(state, nowSec, state.offset);

  return state.offset;
}

const swaySettled = (state: SwayState): boolean =>
  Math.abs(state.offset) < SETTLED_OFFSET_PX && Math.abs(state.speed) < SETTLED_SPEED_PX;

/** Mesh resolution. Columns are per wave rather than per panel, so a wide
 * curtain gets more geometry instead of coarser waves.
 *
 * ROWS IS 36, BACK UP FROM 8.
 *
 * Eight was right for the surface as it was: the only vertical terms were the
 * hem splay and hem deepening, both quadratic, and eight rows carried a parabola
 * to within a pixel. That is no longer what is down there. The section changes
 * shape as it falls now — the carrier's pinch relaxing out of it, each fold's
 * centreline leaning, the hem band pulling in — and every one of those is a
 * curve eight rows cannot hold without faceting.
 *
 * The cost is real and it is bounded: vertex work goes up 4.5x on a mesh of a
 * few thousand vertices, and the fragment cost — which is what actually decides
 * the frame rate — does not move at all, because the panel covers the same
 * pixels either way. */
const COLS_PER_WAVE = 24;
const ROWS = 48;

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


const HARDWARE_HEX: Record<string, string> = {
  white: '#EDEDED',
  black: '#303030',
  chrome: '#B0AEA8',
};

// --- Helpers ---------------------------------------------------------------

// Sheer coverage before extra layers from folds, stacking and the doubled hem.
const SHEER_OPACITY_DARK = 1.35;
const SHEER_OPACITY_LIGHT = 1.10;

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
    depths.push(foldDepth(widths[i], shutWidth) * jitter);
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
  const photoUvs = new Float32Array(vertexCount * 2);

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
      photoUvs[v * 2] = c / cols;
      photoUvs[v * 2 + 1] = 1 - r / ROWS;
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
  geometry.setAttribute('aPhotoUv', new THREE.BufferAttribute(photoUvs, 2));
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
  /** The lag as it was `secondsAgo` ago. Rows further down the drop read further
   *  back, which is how the disturbance is made to travel. Omitted for a static
   *  draw, where every row just uses `sway`. See SWAY_TRAVEL_SCALE. */
  swayAgo?: (secondsAgo: number) => number;
  /** Time for the wave to reach the hem, seconds. */
  travelTime?: number;
}

/** Rewrites the fixed mesh in place; normals include folds, lean and hem. */
function writePanelMesh(mesh: PanelMesh, w: PanelWrite): void {
  const { layout, wallX, towardCentre, topY, bottomY, sway = 0, swayAgo, travelTime = 0 } = w;
  const { widths, depths, compressions, span, overall } = layout;
  const { positions, compression, depth, cols, count } = mesh;
  const height = topY - bottomY;
  const TAU = Math.PI * 2;

  let maxDepth = 1e-6;
  for (let i = 0; i < count; i++) if (depths[i] > maxDepth) maxDepth = depths[i];

  // Guarded: a fully stacked panel's span is small but never zero, and dividing
  // the lag by it is what distributes the lag along the panel.
  const spanForLag = Math.max(1e-6, span);
  const billow = SWAY_BILLOW * Math.min(1, Math.abs(sway) / Math.max(1e-6, widths[0]));

  // Per-column values that do NOT depend on height, computed once and reused
  // down every row. What is no longer in here is z and the normal: both are
  // functions of the row now, which is the whole of this change.
  const colX = new Float64Array(cols + 1);
  const colSection = new Float64Array(cols + 1);
  const colAmp = new Float64Array(cols + 1);
  const colWander = new Float64Array(cols + 1);
  const colLean = new Float64Array(cols + 1);
  const colBow = new Float64Array(cols + 1);
  const colComp = new Float64Array(cols + 1);
  /** Extra arrival delay for this column, seconds. Interpolated between waves
   *  rather than stepped, or the panel creases where two neighbours are reading
   *  the history at different times. */
  const colStagger = new Float64Array(cols + 1);
  const staggerScale = travelTime * SWAY_FOLD_STAGGER;

  const extendedWidth = span / count / (1 - overall * (1 - WAVE_MIN_RATIO));
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
    const lo = i0 < 0 ? 0 : i0 > count - 1 ? count - 1 : i0;
    const hi = i0 + 1 < 0 ? 0 : i0 + 1 > count - 1 ? count - 1 : i0 + 1;
    colAmp[c] = depths[lo] + (depths[hi] - depths[lo]) * f;

    colSection[c] = -colAmp[c] * Math.cos(p * TAU);
    // Measured from the WALL end so the hem splay reaches further toward the
    // room while the heading stays pinned to its end carrier.
    colX[c] = span - offset;
    colComp[c] = compressions[wave];

    // Interpolate drift between adjacent folds so the panel stays continuous.
    const w0 = waveJitter(lo, 8.7);
    const w1 = waveJitter(hi, 8.7);
    // Move each fold's whole cross-section, including its photographed light.
    // Shifting only the depth phase left straight stripes painted on the cloth.
    const edgeEase = Math.sin(Math.PI * p / count) * (1 - overall * 0.7);
    colWander[c] = FOLD_WANDER * extendedWidth * (w0 + (w1 - w0) * f) * edgeEase;
    colBow[c] = extendedWidth * 0.09 * (waveJitter(lo, 4.6) + (waveJitter(hi, 4.6) - waveJitter(lo, 4.6)) * f) * edgeEase;
    colLean[c] = foldLean(widths[lo], extendedWidth) + (foldLean(widths[hi], extendedWidth) - foldLean(widths[lo], extendedWidth)) * f;

    // Per-fold arrival offset, interpolated between wave centres on the same
    // t/i0/f the depth uses — so it varies smoothly along the panel instead of
    // stepping at every wave boundary. Reuses the deterministic wave jitter, so
    // the fold that hangs a little deeper is also the one that arrives a little
    // late, which is what an irregular curtain actually does.
    const s0 = waveJitter(lo, 5.3);
    const s1 = waveJitter(hi, 5.3);
    colStagger[c] = staggerScale * (s0 + (s1 - s0) * f);
  }

  // One row's z values, so the normal at a column can be taken from its
  // neighbours in the SAME row rather than from a slope that ignores height.
  const rowZ = new Float64Array(cols + 1);

  // How much shorter each column hangs than its neighbours, in px. Seeded from
  // the same jitter as the widths and the lean, so one fold is consistently the
  // odd one out rather than three unrelated irregularities landing on different
  // folds. See HEM_UNEVEN.
  const colShort = new Float64Array(cols + 1);
  for (let c = 0; c <= cols; c++) {
    const p = (c / cols) * count;
    const t = p - 0.5;
    const i0 = Math.floor(t);
    const f = t - i0;
    const lo = i0 < 0 ? 0 : i0 > count - 1 ? count - 1 : i0;
    const hi = i0 + 1 < 0 ? 0 : i0 + 1 > count - 1 ? count - 1 : i0 + 1;
    const j0 = waveJitter(lo, 2.9);
    const j1 = waveJitter(hi, 2.9);
    colShort[c] = HEM_UNEVEN * height * (j0 + (j1 - j0) * f);
  }

  let v = 0;
  for (let r = 0; r <= ROWS; r++) {
    const vy = r / ROWS; // 0 at the heading, 1 at the hem
    const driftWeight = Math.pow(vy, FOLD_WANDER_POWER);
    const bowWeight = Math.sin(Math.PI * vy);
    const intoHem = smoothstep01((vy - (1 - HEM_STIFFEN_SPAN)) / HEM_STIFFEN_SPAN);
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

    // The heading's own drop, tapering out over the top of the panel. Without it
    // the back half of every wave rises above the track; with it the whole
    // scallop hangs from the track line instead of straddling it.
    // See HEADING_SINK.
    const sink = maxDepth * HEADING_DEPTH_SWING * HEADING_SINK * (1 - vy) * (1 - vy);

    // The lag at this height. Zero at the heading, since that is bolted to the
    // carriers, growing superlinearly to the full value at the hem.
    //
    // Read from the PAST, not from this frame: the wave that is arriving at this
    // depth now left the heading `travelTime·sqrt(vy)` ago, so that is the lag
    // this row is still working through. sqrt because the wave speed on a sheet
    // hanging under its own weight goes as sqrt(depth). See SWAY_TRAVEL_SCALE.
    const rowDelay = travelTime * Math.sqrt(vy);
    const rowSway = swayAgo ? swayAgo(rowDelay) : sway;
    const lagAtRow = rowSway * Math.pow(vy, SWAY_SHAPE_POWER);

    for (let c = 0; c <= cols; c++) rowZ[c] = colSection[c] * (1 - HEM_STIFFEN * intoHem) * deepen;

    for (let c = 0; c <= cols; c++, v++) {
      const i3 = v * 3;
      const z = rowZ[c];
      // Folds are coupled by the heading tape but not welded to each other, so
      // each one arrives a fraction early or late. Without it the panel ripples
      // as a single rigid sheet. See SWAY_FOLD_STAGGER.
      const colLag = swayAgo && colStagger[c] !== 0
        ? swayAgo(Math.max(0, rowDelay + colStagger[c])) * Math.pow(vy, SWAY_SHAPE_POWER)
        : lagAtRow;
      // Scaled by how far along the panel this column sits, because that is how
      // much it is actually being moved: the wall end is stacked and stationary
      // however hard the leading edge is pulled, so it has nothing to lag behind.
      const lag = colLag * (colX[c] / spanForLag);

      // The drop, per column. Zero deviation at the heading and the full
      // deviation at the hem, so the tape stays straight and only the free end
      // wanders. See HEM_UNEVEN.
      const y = topY - (height - colShort[c] * vy) * vy;

      const relaxedDrift = colWander[c] * driftWeight + colBow[c] * bowWeight;
      positions[i3] = wallX + towardCentre * (colX[c] * splay + lag + relaxedDrift + (z + colAmp[c]) * colLean[c]);
      positions[i3 + 1] = y - z * swing - sink;
      positions[i3 + 2] = z;

      compression[v] = colComp[c];
      depth[v] = z / maxDepth;
    }
  }

  const g = mesh.geometry;
  // The cloth can turn back under itself. Full 3D normals also include the
  // leaning folds and weighted hem, so light follows the actual surface.
  g.computeVertexNormals();
  (g.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  (g.attributes.normal as THREE.BufferAttribute).needsUpdate = true;
  (g.attributes.aCompression as THREE.BufferAttribute).needsUpdate = true;
  (g.attributes.aDepth as THREE.BufferAttribute).needsUpdate = true;
}

// --- Shaders --------------------------------------------------------------

const VERTEX_SHADER = `
uniform mat3 uQuadH;
uniform mat4 uShadowMatrix;
varying vec4 vShadow;
attribute float aCompression;
attribute float aDepth;
attribute vec2 aPhotoUv;
varying vec2 vPhotoUv;

uniform vec2 uFrame;

varying vec3 vNormal;
varying vec2 vUv;
varying float vCompression;
varying float vDepth;
/** Where this fragment lands on the photograph, 0..1. The camera is an ortho
 *  box over the image, so warped world coordinates ARE image pixels. */
varying vec2 vBackdrop;

void main() {
  vNormal = normalMatrix * normal;
  vUv = uv;
  vPhotoUv = aPhotoUv;
  vCompression = aCompression;
  vDepth = aDepth;
  // ONTO THE TRACED QUAD. Everything above is solved square — the waves, the
    // sway, the track — in an axis-aligned box, and this is where it gets put
    // back on a window that was photographed in perspective. modelMatrix first
    // so the vertex is in world pixel space, then the homography with its
    // perspective divide, then the ordinary projection.
    vec4 world = modelMatrix * vec4(position, 1.0);
    vShadow = uShadowMatrix * world;
    vec3 warped = uQuadH * vec3(world.xy, 1.0);
    world.xy = warped.xy / warped.z;
    vBackdrop = world.xy / uFrame;
    gl_Position = projectionMatrix * viewMatrix * world;
}
`;

// Surface illumination and self-shadowing are computed from the 3D folds.
// Sheer transmission sums the optical path through ALL overlapping layers.
const FRAGMENT_SHADER = `
precision highp float;
uniform vec3 uColour;
uniform float uOpacity;
uniform float uIsSheer;
uniform sampler2D uBackdrop;
uniform sampler2D uShadowMap;
uniform sampler2D uDensity;
uniform sampler2D uTexture;
uniform sampler2D uFoldPhoto;
uniform float uPhotoMirror;
varying vec2 vPhotoUv;
uniform vec2 uTexRepeat;
uniform vec3 uRoomTint;
uniform float uRoomExposure;
varying vec4 vShadow;
varying vec2 vBackdrop;
varying vec3 vNormal;
varying vec2 vUv;
varying float vCompression;
varying float vDepth;

float shadowTap(vec3 p, vec2 offset) {
  return step(p.z - 0.00055, texture2D(uShadowMap, p.xy + offset * 0.0013).r);
}
float visibility() {
  vec3 p = vShadow.xyz / vShadow.w;
  float lit = shadowTap(p,vec2(-1.0,-1.0)) + shadowTap(p,vec2(0.0,-1.0)) + shadowTap(p,vec2(1.0,-1.0))
    + shadowTap(p,vec2(-1.0,0.0)) + shadowTap(p,vec2(0.0,0.0)) + shadowTap(p,vec2(1.0,0.0))
    + shadowTap(p,vec2(-1.0,1.0)) + shadowTap(p,vec2(0.0,1.0)) + shadowTap(p,vec2(1.0,1.0));
  return lit / 9.0;
}
void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  if (N.z < 0.0) N = -N;
  float tooth = texture2D(uTexture, vUv * uTexRepeat).r - 0.5;
  vec3 L = normalize(vec3(-0.75, 0.45, 1.0));
  float facing = max(N.z, 0.0);
  float direct = max(dot(N,L), 0.0);
  // Use the shop photograph's actual fold falloff as the resting light field.
  // Every photographed valley is registered to one geometric return, so the
  // light deforms with the cloth instead of tiling unrelated stripes over it.
  vec3 foldPhoto = texture2D(uFoldPhoto, vec2(mix(vPhotoUv.x,1.0-vPhotoUv.x,uPhotoMirror),vPhotoUv.y)).rgb;
  float photoLight = dot(foldPhoto,vec3(0.299,0.587,0.114));
  float cavity = pow(max(0.0, -vDepth), 1.5);
  float gathered = smoothstep(0.0,1.0,vCompression);
  float liveLight = (0.78 + 0.22 * direct) * mix(0.72,1.0,visibility());
  float shade = (0.10 + photoLight) * mix(1.0,liveLight,gathered * 0.75);
  shade *= 1.0 - cavity * gathered * 0.12;
  vec3 surface = uColour * uRoomTint * shade * (1.0 + tooth * 0.10) * uRoomExposure;
  float dark = 1.0 - smoothstep(0.05, 0.5, dot(uColour, vec3(0.299,0.587,0.114)));
  float fibre = pow(1.0 - facing, 2.0) * direct * 0.04;
  surface += vec3(fibre * dark);
  if (uIsSheer > 0.5) {
    float path = texture2D(uDensity, vBackdrop).r * 12.0;
    float transmit = exp(-uOpacity * max(1.0, path));
    vec3 behind = texture2D(uBackdrop, vBackdrop).rgb;
    // Backlit fibres scatter towards the viewer. This varies with the room's
    // actual light field; the selected dye still absorbs part of that light.
    vec3 backlit = mix(uColour, vec3(1.0), 0.18) * (0.80 + 0.20 * behind);
    vec3 cloth = mix(surface, backlit * (0.55 + photoLight * 0.48), 0.45);
    surface = cloth * (1.0 - transmit) + behind * transmit;
  }
  gl_FragColor = vec4(clamp(surface,0.0,1.0),1.0);
}
`;

// --- Track profile ---------------------------------------------------------
// Slightly enlarge the 16 mm face to preserve the underside at preview sizes.
const TRACK_FACE_MM = 16;
const TRACK_OVERSIZE = 1.6;
const TRACK_MIN_PX = 5;
const BRACKET_GAP_MM = 34;

const TRACK_VERTEX_SHADER = `
uniform mat3 uQuadH;
varying vec2 vUv;
void main() {
  vUv = uv;
  // ONTO THE TRACED QUAD. Everything above is solved square — the waves, the
    // sway, the track — in an axis-aligned box, and this is where it gets put
    // back on a window that was photographed in perspective. modelMatrix first
    // so the vertex is in world pixel space, then the homography with its
    // perspective divide, then the ordinary projection.
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec3 warped = uQuadH * vec3(world.xy, 1.0);
    world.xy = warped.xy / warped.z;
    gl_Position = projectionMatrix * viewMatrix * world;
}
`;

/** THE SILL SHADOW.
 *
 * Black, with an alpha that is strongest at the hem and gone within
 * SILL_SHADOW_DROP of the drop below it. Squared rather than linear, because
 * contact shadow is an occlusion term and occlusion closes up fast: a linear
 * ramp spreads the same darkness evenly and reads as a painted grey band, which
 * is the same mistake the fold shading was making before the references.
 *
 * u carries a taper at the two ends, so the shadow does not stop dead where the
 * panel does — the cloth is not a wall and its shadow has soft ends.
 */
const SHADOW_FRAGMENT_SHADER = `
precision mediump float;
uniform float uAlpha;
varying vec2 vUv;
void main() {
  // v is 1 at the hem and 0 at the bottom of the quad.
  float fall = vUv.y * vUv.y;
  float ends = smoothstep(0.0, 0.10, vUv.x) * smoothstep(0.0, 0.10, 1.0 - vUv.x);
  gl_FragColor = vec4(0.0, 0.0, 0.0, fall * ends * uAlpha);
}
`;

// Broad matte face, softly rolled edges and a recessed underside. Runners are
// mostly concealed by the heading; fixed beads across an open track look toothed.
const TRACK_FRAGMENT_SHADER = `
precision highp float;
uniform vec3 uColour;
uniform vec3 uRoomTint;
uniform float uIsChrome;
varying vec2 vUv;
void main() {
  float y = vUv.y;
  float upper = smoothstep(0.74,0.98,y);
  float lower = 1.0 - smoothstep(0.13,0.33,y);
  float slot = 1.0 - smoothstep(0.035,0.13,y);
  float diffuse = 0.89 + upper * 0.09 - lower * 0.16 - slot * 0.22;
  float spec = 0.018 + upper * 0.038;
  float reflectedBand = exp(-pow((y-0.70)/0.16,2.0));
  spec += uIsChrome * (0.12 * reflectedBand + 0.06 * upper);
  vec3 col = uColour * uRoomTint * diffuse + vec3(spec);
  gl_FragColor = vec4(clamp(col,0.0,1.0),1.0);
}
`;

const TRACK_CAP_FRAGMENT_SHADER = `
precision highp float;
uniform vec3 uColour;
uniform vec3 uRoomTint;
varying vec2 vUv;
void main() {
  vec2 q = abs(vUv-0.5) - vec2(0.28,0.28);
  float edge = length(max(q,0.0)) + min(max(q.x,q.y),0.0) - 0.22;
  float alpha = 1.0 - smoothstep(-0.035,0.015,edge);
  float roundLight = smoothstep(0.12,0.88,vUv.y);
  float seam = 1.0 - smoothstep(0.0,0.10,vUv.x);
  vec3 col = uColour * uRoomTint * (0.78 + 0.16*roundLight - seam*0.055) + vec3(0.024*roundLight);
  gl_FragColor = vec4(clamp(col,0.0,1.0),alpha);
}
`;

// The approved shop photograph supplies the blockout's fine fabric detail.
// Its broad fold lighting is removed; geometry and the shadow pass provide it.
const FABRIC_SAMPLE: Record<'blockout' | 'sheer', string> = {
  blockout: '/images/fabrics/curtains-blockout.webp',
  sheer: '/images/visualiser/textures/curtains/sheer_produced.png',
};
interface FabricTexture { texture: THREE.Texture }
const textureCache = new Map<string, Promise<FabricTexture>>();
function buildDetailTexture(path: string): Promise<FabricTexture> {
  const cached = textureCache.get(path);
  if (cached) return cached;
  const pending = loadImage(path).then(img => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    const fromShop = path.includes('/fabrics/');
    if (fromShop) ctx.drawImage(img, 113, 105, 280, 585, 0, 0, 512, 1024);
    else ctx.drawImage(img, 0, 0, 512, 1024);
    const pixels = ctx.getImageData(0,0,512,1024);
    const low = document.createElement('canvas');
    low.width = 512; low.height = 1024;
    const lowCtx = low.getContext('2d')!;
    lowCtx.filter = 'blur(18px)'; lowCtx.drawImage(canvas,0,0);
    const smooth = lowCtx.getImageData(0,0,512,1024).data;
    for (let i=0;i<pixels.data.length;i+=4) {
      const value = (pixels.data[i]+pixels.data[i+1]+pixels.data[i+2]) / 3;
      const base = (smooth[i]+smooth[i+1]+smooth[i+2]) / 3;
      const detail = Math.max(0,Math.min(255,128+(value-base)*1.4));
      pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=detail;
      pixels.data[i+3]=255;
    }
    ctx.putImageData(pixels,0,0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.NoColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return {texture};
  }).catch(error => {textureCache.delete(path); throw error;});
  textureCache.set(path,pending);
  return pending;
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
  /** Time for a disturbance at the heading to reach the hem, seconds.
   *  See SWAY_TRAVEL_SCALE. */
  travelTime: number;
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
  const foregroundRef = useRef<HTMLCanvasElement>(null);

  const lightingRef = useRef<CurtainLighting | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const leftMeshRef = useRef<PanelMesh | null>(null);
  const rightMeshRef = useRef<PanelMesh | null>(null);
  const materialsRef = useRef<THREE.ShaderMaterial[]>([]);
  /** One sill shadow per panel. See SILL_SHADOW_ALPHA. */
  const shadowMeshesRef = useRef<THREE.Mesh[]>([]);
  const shadowDropRef = useRef(0);
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
  /** When the solver went still, seconds. The loop runs on past it for one
   *  travelTime so the wave can finish running down the drop. */
  const settledAtRef = useRef<number | null>(null);

  /** Repositions both panels and repaints. Writes into buffers allocated once at
   * setup — see createPanelMesh. */
  /** `nowSec` is only passed from the solver loop. A static draw — a fresh trace,
   *  a colour change — has no history to read and every row uses `sway`. */
  const colourRef = useRef(colour);
  colourRef.current = colour;

  const draw = (open: number, sway: number, nowSec?: number) => {
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

    const state = swayRef.current;
    const swayAgo =
      nowSec !== undefined && state
        ? (secondsAgo: number) => sampleSway(state, nowSec - secondsAgo)
        : undefined;

    const common = {
      layout: shaped,
      topY: windowTop,
      bottomY: windowBottom,
      sway,
      swayAgo,
      travelTime: layout.travelTime,
    };

    writePanelMesh(left, { ...common, wallX: windowLeft, towardCentre: 1 });
    writePanelMesh(right, { ...common, wallX: windowRight, towardCentre: -1 });

    // The sill shadow follows the cloth that casts it. A unit plane scaled to
    // this openness's span, sat immediately under the hem and behind the panel.
    const shadows = shadowMeshesRef.current;
    if (shadows.length === 2) {
      const drop = shadowDropRef.current;
      const span = Math.max(1, shaped.span);
      const top = windowBottom - drop / 2;
      shadows[0].scale.x = span;
      shadows[0].position.set(windowLeft + span / 2, top, -1);
      shadows[1].scale.x = span;
      shadows[1].position.set(windowRight - span / 2, top, -1);
    }

    const roomFilter = fabricType === 'blockout' ? `brightness(${0.90 + open * 0.10})` : 'none';
    if (bgRef.current) bgRef.current.style.filter = roomFilter;
    if (foregroundRef.current) foregroundRef.current.style.filter = roomFilter;
    lightingRef.current?.render();
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
      const nowSec = now / 1000;
      const offset = stepSway(
        sway, span, dt, layout.omega, layout.maxSway,
        layout.shutPanelWidth - span,
        nowSec,
      );
      draw(open, offset, nowSec);

      // Keep going while the cloth is moving OR the input still is. The input test
      // is on the velocity the solver just recorded, not on a span comparison —
      // stepSway has already overwritten lastSpan by this point, so differencing
      // it here would always read zero. It matters for a slow drag, where the lag
      // can pass through zero between frames and would otherwise look settled
      // mid-motion.
      const inputMoving = Math.abs(sway.lastVelocity) > 1e-3;
      const settled = swaySettled(sway) && !inputMoving;

      // The hem being still is no longer the end of the motion. Rows down the
      // drop are reading the lag from up to travelTime ago, so when the solver
      // settles they still have that much history to work through. Stopping on
      // the solver alone would snap the lower half of the panel straight, which
      // is the exact tail-end flick this model exists to show.
      if (!settled) settledAtRef.current = null;
      else if (settledAtRef.current === null) settledAtRef.current = nowSec;

      const drained =
        settledAtRef.current !== null &&
        nowSec - settledAtRef.current >= layout.travelTime;

      if (!settled || !drained) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        // Land exactly at rest so a settled panel is bit-identical frame to frame
        // and never leaves a sub-pixel shimmer behind.
        sway.offset = 0;
        sway.speed = 0;
        settledAtRef.current = null;
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
    let backdropTexture: THREE.Texture | undefined;
    let foldPhotoTexture: THREE.Texture | undefined;

    const init = async () => {
      const bgCanvas = bgRef.current;
      const threeCanvas = threeRef.current;
      if (!bgCanvas || !threeCanvas) return;

      const [photo, fabric, foldPhotoImage] = await Promise.all([
        loadImage(photoUrl),
        buildDetailTexture(FABRIC_SAMPLE[fabricType] ?? FABRIC_SAMPLE.blockout),
        loadImage('/images/fabrics/curtains-blockout.webp'),
      ]);
      if (cancelled) return;

      const W = photo.naturalWidth;
      const H = photo.naturalHeight;

      bgCanvas.width = W;
      bgCanvas.height = H;

      // The fabric buffer is capped; the ortho camera below still spans 0..W in
      // photo pixels, so world coordinates are unchanged and the two canvases
      // stay aligned — both are CSS-sized to the container.
      const renderScale = Math.min(1, Math.min(RENDER_MAX_WIDTH, (containerRef.current?.clientWidth || W) * 1.6) / W);
      threeCanvas.width = Math.round(W * renderScale);
      threeCanvas.height = Math.round(H * renderScale);

      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) bgCtx.drawImage(photo, 0, 0);
      const foreground = foregroundRef.current;
      if (foreground) {
        foreground.width = W; foreground.height = H;
        const ctx = foreground.getContext('2d')!;
        ctx.clearRect(0,0,W,H);
        if (photoUrl.endsWith('/curtain-shop-room.webp')) {
          // Foreground objects stay in front of the curtain. The plant matte
          // is restricted to its known area, so outdoor foliage is never cut out.
          ctx.drawImage(photo,0,0);
          const fg = ctx.getImageData(0,0,W,H);
          for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
            const i=(y*W+x)*4;
            const nx=x/W, ny=y/H;
            const light=(fg.data[i]*0.299+fg.data[i+1]*0.587+fg.data[i+2]*0.114)/255;
            const leaf = nx<0.085 && ny>0.39 && ny<0.64;
            const edge = ny<0.65 ? 0.06+(ny-0.615)*0.8 : ny<0.77 ? 0.088 : 0.088-(ny-0.77)*0.24;
            const sofa = ny>0.615 && ny<0.829 && nx<edge;
            fg.data[i+3] = sofa ? 255 : leaf ? Math.round(clamp01((0.67-light)/0.16)*clamp01((0.085-nx)/0.008)*255) : 0;
          }
          ctx.putImageData(fg,0,0);
        }
      }
      // Sample neutral surfaces around the opening, excluding dark furniture
      // and saturated foliage, to match each customer's room colour and light.
      const lightCanvas = document.createElement('canvas');
      lightCanvas.width=32; lightCanvas.height=32;
      const lightCtx=lightCanvas.getContext('2d')!;
      lightCtx.drawImage(photo,0,0,32,32);
      const lightPixels=lightCtx.getImageData(0,0,32,32).data;
      const roomRGB=[0,0,0]; let roomSamples=0;
      for(let y=0;y<20;y++) for(let x=0;x<32;x++) {
        if(y>3 && x>3 && x<28) continue;
        const i=(y*32+x)*4, rgb=[lightPixels[i],lightPixels[i+1],lightPixels[i+2]];
        if(Math.min(...rgb)<90 || Math.max(...rgb)-Math.min(...rgb)>60) continue;
        rgb.forEach((v,c)=>{roomRGB[c]+=v;}); roomSamples++;
      }
      const brightest=Math.max(...roomRGB,1);
      const roomTint=new THREE.Vector3(...roomRGB.map(v=>roomSamples ? 0.72+0.28*v/brightest : 1) as [number,number,number]);


      // THE DIFFUSED BACKDROP the sheer looks through. Redrawn small and
      // sampled back up, which is a blur by resampling: the browser's own
      // downscale does the averaging, and reading it at full size with a linear
      // filter does the rest. Cheap enough to build once per photo, and the
      // radius scales with the image rather than being a fixed number of pixels
      // that would mean different things on a 1254px room and a 4000px phone
      // shot. See SHEER_DIFFUSION.
      const blurW = Math.max(8, Math.round(W * SHEER_DIFFUSION));
      const blurH = Math.max(8, Math.round(H * SHEER_DIFFUSION));
      const blurCanvas = document.createElement('canvas');
      blurCanvas.width = blurW;
      blurCanvas.height = blurH;
      const blurCtx = blurCanvas.getContext('2d');
      if (blurCtx) {
        blurCtx.imageSmoothingEnabled = true;
        blurCtx.imageSmoothingQuality = 'high';
        blurCtx.drawImage(photo, 0, 0, blurW, blurH);
      }
      const backdrop = new THREE.CanvasTexture(blurCanvas);
      backdropTexture = backdrop;
      backdrop.colorSpace = THREE.NoColorSpace;
      backdrop.wrapS = THREE.ClampToEdgeWrapping;
      backdrop.wrapT = THREE.ClampToEdgeWrapping;
      backdrop.minFilter = THREE.LinearFilter;
      backdrop.magFilter = THREE.LinearFilter;
      backdrop.generateMipmaps = false;
      backdrop.needsUpdate = true;

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

      // THE SLANT. The blind renderer has always drawn onto the traced quad; the
      // curtain collapsed that quad to its bounding box and drew square inside
      // it, so on a window photographed in perspective the curtain's track ran
      // level while the window's head sloped away beneath it, and the hem sat
      // flat on a sill that did not. It read as a decal on the photo rather than
      // as cloth in the room.
      //
      // The whole scene is still SOLVED square — the cloth simulation wants a
      // rectangle and the wave pitch means nothing on a trapezium — and is then
      // mapped onto the quad by this homography in the vertex shaders. Solve
      // square, draw crooked.
      //
      // Corner order matches the quad's: the box's top-left goes to the quad's
      // top-left. Geometry outside the box (the track above the head, the
      // panels' overhang past the reveal) extrapolates through the same
      // transform, which is what keeps the track parallel to the window head
      // instead of stopping at it.
      const quadMatrix = (() => {
        const box: [number, number][] = [
          [windowLeft, windowTop],
          [windowRight, windowTop],
          [windowRight, windowBottom],
          [windowLeft, windowBottom],
        ];
        const quad: [number, number][] = [
          [tlPx.x, tlPx.y],
          [trPx.x, trPx.y],
          [brPx.x, brPx.y],
          [blPx.x, blPx.y],
        ];
        try {
          const h = computeHomography(box, quad);
          // Matrix3.set takes row-major, which is what computeHomography returns.
          return new THREE.Matrix3().set(h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], h[8]);
        } catch {
          // Collinear or coincident corners. An un-warped curtain is wrong; a
          // missing one is worse, so fall back to drawing it square.
          return new THREE.Matrix3();
        }
      })();

      // WAVE COUNT — from the trace itself. See wavesForTrace.
      //
      // Measured across the QUAD'S OWN EDGES rather than its bounding box. A
      // window photographed at an angle has a top edge and a bottom edge of
      // different lengths, and the box around it is wider than either — so the
      // box overstates a slanted trace and would hand it folds it has not
      // earned. The mean of the two edges is the track the curtain actually runs
      // along.
      //
      // WIDTH AND NOT AREA, deliberately. A taller window does not get more
      // folds: the waves are spaced along the track, so a 3m opening carries the
      // same heading whether it is a metre tall or three. Bigger trace, more
      // folds — but bigger ACROSS.
      const topEdge = Math.hypot(trPx.x - tlPx.x, trPx.y - tlPx.y);
      const bottomEdge = Math.hypot(brPx.x - blPx.x, brPx.y - blPx.y);
      const waveCount = wavesForTrace((topEdge + bottomEdge) / 2, W);
      // Register the shop's photographed troughs to individual physical folds.
      // An atlas avoids UV jumps at repeated folds and preserves the full drop.
      // Start beyond the foreground plant and sofa in the source photograph.
      const troughs = [113,141,173,208,242,277,310,352,393];
      const atlas = document.createElement('canvas');
      atlas.width = waveCount * 64; atlas.height = 1024;
      const atlasCtx = atlas.getContext('2d')!;
      for (let i=0;i<waveCount;i++) {
        const j = i % (troughs.length-1);
        atlasCtx.drawImage(foldPhotoImage,troughs[j],57,troughs[j+1]-troughs[j],654,i*64,0,64,1024);
      }
      foldPhotoTexture = new THREE.CanvasTexture(atlas);
      foldPhotoTexture.colorSpace = THREE.NoColorSpace;
      foldPhotoTexture.minFilter = THREE.LinearMipmapLinearFilter;
      foldPhotoTexture.needsUpdate = true;


      // A small centre overlap closes the light leak between the two panels.
      const gap = -windowWidth * 0.002;
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
      // Time for the wave to run the drop: 2·sqrt(h/g) for a sheet hanging under
      // its own weight, corrected by the same factor as the frequency so the two
      // stay consistent. See SWAY_TRAVEL_SCALE.
      const travelTime =
        (2 * Math.sqrt(dropMetres / GRAVITY) * SWAY_TRAVEL_SCALE) / SWAY_FREQ_SCALE;

      // TRACK AND MOUNT. A face-fixed (window mount) track hangs off brackets, so
      // it sits below its fixing line with a visible gap; a ceiling-mounted one
      // clamps flush with nothing showing above it. That gap is the entire visual
      // difference between the two options, and until now `mount` was read and
      // discarded — the control did nothing at all.
      const trackHeight = Math.max(TRACK_MIN_PX, TRACK_FACE_MM * pxPerMm * TRACK_OVERSIZE);
      const faceFixed = mount !== 'ceiling';
      // Same oversize as the profile, so the gap scales with it and the two
      // mounts stay visibly different at any photo resolution.
      const bracketDrop = faceFixed
        ? Math.max(trackHeight * 1.6, BRACKET_GAP_MM * pxPerMm * TRACK_OVERSIZE)
        : 0;
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
        travelTime,
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

      // The weave is minified hard whenever the panel stacks, and it is a
      // regular grid, so it needs every anisotropic tap the device will give
      // it. Set here rather than in buildDetailTexture because that runs
      // before there is a renderer to ask.
      fabric.texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      fabric.texture.needsUpdate = true;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.OrthographicCamera(0, W, H, 0, -1000, 1000);
      camera.position.set(0, 0, 100);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      const rgb = hexToRgb(colourRef.current);
      const colourVec = new THREE.Vector3(rgb.r / 255, rgb.g / 255, rgb.b / 255);
      const isSheer = fabricType === 'sheer';

      const repeat = new THREE.Vector2(1, 1);

      const makeMaterial = () =>
        new THREE.ShaderMaterial({
          uniforms: {
            uQuadH: { value: quadMatrix },
            uShadowMap: { value: null },
            uShadowMatrix: { value: new THREE.Matrix4() },
            uDensity: { value: null },
            uRoomTint: { value: roomTint },
            uRoomExposure: { value: 1.0 },
            uColour: { value: colourVec },
            uOpacity: { value: isSheer ? sheerOpacity(colourRef.current) : 1.0 },
            uIsSheer: { value: isSheer ? 1.0 : 0.0 },
            // Only the sheer looks through anything. A blockout has nothing
            // behind it to diffuse, so it never samples this.
            uBackdrop: { value: backdrop },
            uHasBackdrop: { value: isSheer && blurCtx ? 1.0 : 0.0 },
            uFrame: { value: new THREE.Vector2(W, H) },
            uHemBand: { value: HEM_BAND },
            uTexture: { value: fabric.texture },
            uFoldPhoto: { value: foldPhotoTexture },
            uPhotoMirror: { value: 0 },
            uTexRepeat: { value: repeat },

          },
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          transparent: false,
          depthWrite: true,
          side: THREE.DoubleSide,
        });

      // Buffers allocated here and only ever rewritten — applyOpenness fills in
      // the positions below.
      const leftMesh = createPanelMesh(waveCount);
      const rightMesh = createPanelMesh(waveCount);
      const leftMaterial = makeMaterial();
      const rightMaterial = makeMaterial();
      // Both panels receive light from the same side of the room.
      rightMaterial.uniforms.uPhotoMirror.value = 1;
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

      // --- SILL SHADOW ----------------------------------------------------
      // One per panel, because each one has to follow its own leading edge as
      // the curtain is drawn back. A unit plane, scaled and placed in draw()
      // where the span for this openness is known.
      //
      // renderOrder -1 and no depth write: it is composited under the cloth and
      // over the photograph, and it must never occlude the panel that casts it.
      const shadowMaterial = new THREE.ShaderMaterial({
        uniforms: { uQuadH: { value: quadMatrix }, uAlpha: { value: SILL_SHADOW_ALPHA } },
        vertexShader: TRACK_VERTEX_SHADER,
        fragmentShader: SHADOW_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
      });
      const shadowDrop = (windowTop - windowBottom) * SILL_SHADOW_DROP;
      const shadows: THREE.Mesh[] = [];
      for (let i = 0; i < 2; i++) {
        const s = new THREE.Mesh(new THREE.PlaneGeometry(1, shadowDrop), shadowMaterial);
        s.renderOrder = -1;
        scene.add(s);
        shadows.push(s);
      }
      shadowMeshesRef.current = shadows;
      shadowDropRef.current = shadowDrop;

      // --- TRACK ASSEMBLY -------------------------------------------------
      // The panels hang from something, and it has to look like the thing they
      // actually hang from. In front of the deepest possible wave so it covers the
      // heading, the way a real track hides the top of the tape.
      const hw = hexToRgb(HARDWARE_HEX[hardwareColour] ?? HARDWARE_HEX.white);
      const hardwareVec = new THREE.Vector3(hw.r / 255, hw.g / 255, hw.b / 255);
      const trackZ = shutWaveWidth * DEPTH_PACKED * (1 + HEM_DEPTH_GAIN) * 1.3 + 1;
      const centreX = (windowLeft + windowRight) / 2;

      const trackMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uQuadH: { value: quadMatrix },
          uColour: { value: hardwareVec },
          uIsChrome: { value: hardwareColour === 'chrome' ? 1 : 0 },
          uRoomTint: { value: roomTint },
        },
        vertexShader: TRACK_VERTEX_SHADER,
        fragmentShader: TRACK_FRAGMENT_SHADER,
      });
      const track = new THREE.Mesh(
        new THREE.PlaneGeometry(windowWidth, trackHeight),
        trackMaterial,
      );
      track.position.set(centreX, headingY + trackHeight * 0.22, trackZ);
      track.renderOrder = 3;
      scene.add(track);

      // END CAPS — a track is cut to length and capped, and the cap is a moulded
      // part slightly proud of the extrusion. Without them the track runs off the
      // edge of the opening as if it continued through the wall.
      const capW = Math.max(2, trackHeight * 0.46);
      const capMaterial = new THREE.ShaderMaterial({
        uniforms: { uQuadH: { value: quadMatrix }, uColour: { value: hardwareVec }, uRoomTint: { value: roomTint } },
        vertexShader: TRACK_VERTEX_SHADER,
        fragmentShader: TRACK_CAP_FRAGMENT_SHADER,
        transparent: true,
      });
      for (const [x, flip] of [[windowLeft, -1], [windowRight, 1]] as const) {
        const cap = new THREE.Mesh(
          new THREE.PlaneGeometry(capW, trackHeight * 1.06),
          capMaterial,
        );
        cap.position.set(x + (flip * capW) / 2, headingY + trackHeight * 0.22, trackZ + 0.5);
        cap.scale.x = flip;
        cap.renderOrder = 4;
        scene.add(cap);
      }

      // A faint wall shadow seats the rail in the room, including when open.
      const railShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(windowWidth + capW, trackHeight * 2.2),
        new THREE.ShaderMaterial({
          uniforms: {uQuadH:{value:quadMatrix},uAlpha:{value:0.12}},
          vertexShader:TRACK_VERTEX_SHADER, fragmentShader:SHADOW_FRAGMENT_SHADER,
          transparent:true, depthWrite:false,
        }),
      );
      railShadow.position.set(centreX,headingY-trackHeight*0.6,-2);
      railShadow.renderOrder=-2;
      scene.add(railShadow);
      if (faceFixed) {
        // Small wall-fix straps sit behind the rail instead of a floating gap.
        const strapWidth=Math.max(2,trackHeight*0.38);
        const strapHeight=bracketDrop-trackHeight*0.35;
        for (const fraction of [0.05,0.5,0.95]) {
          const strap=new THREE.Mesh(new THREE.PlaneGeometry(strapWidth,strapHeight),capMaterial);
          strap.position.set(windowLeft+windowWidth*fraction,windowTop-strapHeight/2,trackZ-0.5);
          strap.renderOrder=2;
          scene.add(strap);
        }
      }

      lightingRef.current?.dispose();
      const lighting = createCurtainLighting(renderer, scene, camera, [leftPanel, rightPanel], quadMatrix, W, H, VERTEX_SHADER, isSheer);
      lightingRef.current = lighting;
      for (const material of materialsRef.current) {
        material.uniforms.uShadowMap.value = lighting.shadowMap;
        material.uniforms.uShadowMatrix.value = lighting.shadowMatrix;
        material.uniforms.uDensity.value = lighting.densityMap;
      }
      draw(opennessRef.current, 0);
    };

    init();

    return () => {
      cancelled = true;
      backdropTexture?.dispose();
      foldPhotoTexture?.dispose();
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
      lightingRef.current?.dispose();
      if (rendererRef.current) rendererRef.current.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Photo, cloth and foreground are separate registered surfaces. */}
      <canvas
        ref={bgRef}
        data-render-surface="curtain-backdrop"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <canvas
        ref={threeRef}
        data-render-surface="curtain"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'auto',
          pointerEvents: 'none',
        }}
      />
      <canvas ref={foregroundRef} data-render-surface="curtain-foreground"
        style={{position:'absolute',inset:0,width:'100%',height:'auto',pointerEvents:'none'}} />
    </div>
  );
}
