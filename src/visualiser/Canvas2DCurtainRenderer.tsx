import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { computeHomography } from './homography';

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

/** WAVES PER PANEL, FROM THE WIDTH THAT WAS ORDERED.
 *
 * This was fixed at nine on every window. The reasoning was that nine is what
 * the largest size produces and it "looks right at every window" — but it does
 * not, and a wide window is where it fails hardest: nine waves stretched across
 * three metres is nine fat bulges, and the customer sees a curtain that is not
 * the one they are buying. A wave fold curtain has one wave per 160mm of track
 * and that is the whole character of the heading. More track, more waves.
 *
 * So it is derived again — from the SIZE THAT WAS ORDERED, not from the pixels
 * of the trace. Pixels cannot give millimetres on their own, and the size pill
 * is the real number: it is what gets quoted, made and installed. It also means
 * moving that control visibly changes the curtain, which is the correct
 * relationship between a spec and a picture of it.
 *
 * The floor is what the old comment was really protecting against, and it is
 * kept: below about five the panel reads as a few bulges rather than as a wave
 * curtain. A 1.2m track is 3.75 waves a panel on the arithmetic, and it is drawn
 * with five. That is the one place this lies, and it lies in the direction of
 * the product being recognisable.
 *
 * A whole number, always, and the mesh spans exactly this many full sine periods
 * — so a panel opens and closes on a complete wave and never on half of one.
 * There is no path here that can produce a fractional wave: the compression front
 * moves the wave WIDTHS and never the count. */
const MIN_WAVES_PER_PANEL = 5;
const MAX_WAVES_PER_PANEL = 20;

/** Waves a panel would carry if the traced window ran the full width of the
 *  photograph. Everything narrower gets its share of this.
 *
 *  CALIBRATED, not picked: the sample room's window covers about 40% of its
 *  frame and nine waves a panel is what looked right on it, so full frame is
 *  nine over 0.4. Anything that changes the sample room should be checked
 *  against this number rather than the number being nudged to suit it. */
const WAVES_AT_FULL_FRAME = 22;

/** WAVES FROM THE SIZE OF THE TRACE, which is the thing on screen.
 *
 * This was briefly taken from the ordered size pill instead — the millimetres
 * that get quoted and made. Correct on paper and wrong to look at: the picture
 * stopped agreeing with the window in it. A big opening drawn with the same few
 * folds as a small one is the fault being fixed, and the opening is what the
 * customer traced, not what they picked in a list.
 *
 * Measured as a FRACTION OF THE PHOTOGRAPH, never in raw pixels. The same window
 * shot on a phone and on a compact is the same window, and the trace is in image
 * coordinates — so a 4000px photo would otherwise get three times the folds of a
 * 1254px one for no reason a customer could ever see. The fraction is stable
 * across both, and it is also what "bigger" means when you are looking at a
 * picture: bigger IN THE FRAME.
 *
 * Floored at five, because below that a panel reads as a few bulges rather than
 * as a wave curtain, and capped at sixteen so a wall of glass does not turn into
 * corduroy.
 */
const wavesForTrace = (tracedWidthPx: number, framePx: number): number => {
  const fraction = framePx > 0 ? tracedWidthPx / framePx : 0.5;
  const waves = Math.round(fraction * WAVES_AT_FULL_FRAME);
  return Math.min(MAX_WAVES_PER_PANEL, Math.max(MIN_WAVES_PER_PANEL, waves));
};

/** One wave per 160mm of track: heading tape carries a snap every 80mm at the
 * standard 80% fullness, and one wave — a crest and the trough beside it — spans
 * two snaps.
 *
 * It does not set the wave count — the trace does, see wavesForTrace. It is the
 * renderer's link to real-world scale in the other direction: the panel shows
 * however many waves the trace earned, each wave is 160mm of track, so one
 * pixel is a known number of millimetres. The cloth physics needs that, because
 * a pendulum's period depends on its length in metres and not in pixels. */
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
const HEADING_DEPTH_SWING = 0.22;

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

/** THE CARRIER PINCHES, THE HEM DOES NOT.
 *
 * At the heading the cloth is clamped every 80mm by a snap, so the wave is
 * pinched hard at each carrier and the lobe between them is pushed round and
 * full — a squarer wave than a sine. Below the tape nothing holds it, and the
 * section relaxes toward the plain sinusoid the fabric would take on its own.
 *
 * Applied as the exponent on |sin| with the sign kept: below 1 flattens the
 * lobe and steepens the crossing, which is what a pinched carrier does; at 1 it
 * IS the sine. The heading value is what the render was missing entirely.
 */
const FOLD_PINCH_HEADING = 0.72;
const FOLD_PINCH_HEM = 0.97;

/** HOW FAR A FOLD'S CENTRELINE WANDERS BY THE HEM, in fractions of one wave.
 *
 * A fold is a hinge, not a rail. The top is fixed to a carrier and the bottom
 * is free, so every fold leans a little — never the same amount twice, and the
 * lean is what stops nine folds reading as nine printed lines. Seeded from the
 * same waveJitter that already varies the widths, so a fold that hangs wider
 * also leans further and the two irregularities agree instead of fighting.
 *
 * Superlinear in depth: the tape holds the top third almost straight and the
 * lean accumulates below it. Same shape, and the same reason, as
 * SWAY_SHAPE_POWER.
 *
 * 0.45 IS MEASURED OFF A PHOTOGRAPH, not chosen. In a backlit sheer at a window
 * the folds lean several degrees over the drop and no two lean alike — some
 * cross. The first pass used 0.17 and it still read as ruled lines, because a
 * sixth of a wave over two metres is under a degree and the eye does not see it.
 * Nearly half a wave does.
 */
const FOLD_WANDER = 0.45;
const FOLD_WANDER_POWER = 1.35;

/** THE WEIGHTED HEM BAND, which is stiffer than the cloth above it.
 *
 * A made curtain has a doubled hem with a weight in it. It cannot take the full
 * fold depth the free cloth above does, so the section pulls in over the last
 * few percent of the drop. This is what rounds the bottom edge off. Without it
 * the hem was a sawtooth — the sine at full amplitude cut straight across — and
 * a sawtooth hem is a paper fan, not a curtain.
 */
const HEM_STIFFEN = 0.22;
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
const HEM_UNEVEN = 0.014;

/** The doubled hem band, as a fraction of the drop, and how much darker it is.
 *
 * The bottom of a made curtain is folded twice and often weighted, so it is two
 * or three layers where the rest is one. On a sheer that is unmissable: a
 * distinctly denser strip along the bottom edge, which is exactly what the
 * backlit reference shows. Without it the cloth just stops. */
const HEM_BAND = 0.035;
const HEM_BAND_DENSITY = 0.30;

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
const SHEER_DIFFUSION = 1 / 12;

/** TRANSMISSION AND SCATTER, and the two of them ADD.
 *
 * A backlit sheer is the brightest thing in the room — brighter than the wall
 * beside it, often clipping to white where the window is directly behind. Every
 * photograph of one shows this and the render was doing the opposite: it sat
 * DARKER than the wall, because the cloth was being blended OVER the window as
 * a mix. A mix can only ever land between the two things it mixes, so putting
 * cloth over glass could only darken the glass. That is a grey film, and it is
 * what it looked like.
 *
 * What actually reaches the eye is two separate paths summed:
 *
 *   TRANSMITTED  the window's own light, having come through the weave. Soft,
 *                because the threads scattered it on the way (see
 *                SHEER_DIFFUSION), and NOT shaded by the folds — light that has
 *                passed through the cloth does not care which way the surface
 *                was facing.
 *   SCATTERED    the room's light bouncing off the near face. This one IS shaded
 *                by the folds, and it is the only thing that is.
 *
 * Summing them produces the whole behaviour for free, including two things that
 * were being chased separately before. Over the bright window the transmitted
 * term dominates and the folds WASH OUT — which is exactly what the reference
 * shows, the folds nearly vanishing into the glow and reappearing at the edges.
 * And the total can exceed the wall's brightness, so the cloth glows instead of
 * greying.
 *
 * Both are scaled by the fabric's own opacity, so a charcoal sheer transmits
 * little and scatters dark while a white one does the opposite. */
const SHEER_TRANSMIT_GAIN = 1.25;
const SHEER_SCATTER_GAIN = 1.0;

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
const COLS_PER_WAVE = 10;
const ROWS = 36;

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
  white: '#EDEDED',
  black: '#303030',
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
 * cannot see is not a visualisation of a curtain. Even the darkest colour still
 * covers most of what is behind it.
 *
 * THE SETTLED POINT IS BETWEEN TWO FAILURES. 0.62 was a tinted pane you could
 * read a fence through, so it stopped selling a curtain; 0.82/0.95 corrected
 * that and overshot, because at those values a sheer against a bright window
 * is a pale sheet and the one thing a customer buys a sheer FOR — that it
 * filters the light instead of stopping it — never appears on screen. These
 * sit a little below that: the garden behind is legible as shape and colour
 * without resolving into detail, which is what a sheer actually does, and the
 * difference from the blockout option is now obvious at a glance rather than a
 * matter of a few percent of white.
 *
 * The gap between the two ends is deliberately unchanged. It is the physics —
 * a pale sheer scatters daylight forward and hazes over, a dark one absorbs
 * that scatter and tints — and only the overall level was wrong. */
const SHEER_OPACITY_DARK = 0.74;
const SHEER_OPACITY_LIGHT = 0.87;

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
  /** The lag as it was `secondsAgo` ago. Rows further down the drop read further
   *  back, which is how the disturbance is made to travel. Omitted for a static
   *  draw, where every row just uses `sway`. See SWAY_TRAVEL_SCALE. */
  swayAgo?: (secondsAgo: number) => number;
  /** Time for the wave to reach the hem, seconds. */
  travelTime?: number;
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
  const { layout, wallX, towardCentre, topY, bottomY, sway = 0, swayAgo, travelTime = 0 } = w;
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

  // Per-column values that do NOT depend on height, computed once and reused
  // down every row. What is no longer in here is z and the normal: both are
  // functions of the row now, which is the whole of this change.
  const colX = new Float64Array(cols + 1);
  const colPhase = new Float64Array(cols + 1);
  const colAmp = new Float64Array(cols + 1);
  const colWander = new Float64Array(cols + 1);
  const colComp = new Float64Array(cols + 1);
  /** Extra arrival delay for this column, seconds. Interpolated between waves
   *  rather than stepped, or the panel creases where two neighbours are reading
   *  the history at different times. */
  const colStagger = new Float64Array(cols + 1);
  const staggerScale = travelTime * SWAY_FOLD_STAGGER;

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

    colPhase[c] = p * TAU;
    // Measured from the WALL end so the hem splay reaches further toward the
    // room while the heading stays pinned to its end carrier.
    colX[c] = span - offset;
    colComp[c] = compressions[wave];

    // The lean this fold takes by the hem, in radians of its own cycle. Same
    // interpolation as the depth so it varies smoothly along the panel, and
    // seeded from the same jitter, so the fold that hangs deeper is the one
    // that also leans further. See FOLD_WANDER.
    const w0 = waveJitter(lo, 8.7);
    const w1 = waveJitter(hi, 8.7);
    colWander[c] = FOLD_WANDER * TAU * (w0 + (w1 - w0) * f);

    // Per-fold arrival offset, interpolated between wave centres on the same
    // t/i0/f the depth uses — so it varies smoothly along the panel instead of
    // stepping at every wave boundary. Reuses the deterministic wave jitter, so
    // the fold that hangs a little deeper is also the one that arrives a little
    // late, which is what an irregular curtain actually does.
    const s0 = waveJitter(lo, 5.3);
    const s1 = waveJitter(hi, 5.3);
    colStagger[c] = staggerScale * (s0 + (s1 - s0) * f);
  }

  /** THE SECTION AT ONE HEIGHT.
   *
   * Three things happen to it on the way down and all three are gravity:
   *   the carrier's pinch relaxes out    — FOLD_PINCH_*
   *   the fold leans off vertical        — FOLD_WANDER
   *   the weighted hem pulls the fold in — HEM_STIFFEN
   *
   * `sign(sin)·|sin|^e` rather than a plain sine: at e below 1 the lobe flattens
   * and the crossing steepens, which is the shape a snap carrier forces on the
   * cloth it is holding. At e = 1 it is exactly the sine it always was, which is
   * what the free cloth near the hem relaxes back to.
   */
  const sectionZ = (c: number, vy: number): number => {
    const pinch = FOLD_PINCH_HEADING + (FOLD_PINCH_HEM - FOLD_PINCH_HEADING) * vy;
    const phase = colPhase[c] + colWander[c] * Math.pow(vy, FOLD_WANDER_POWER);
    const s = Math.sin(phase);
    const shaped = s < 0 ? -Math.pow(-s, pinch) : Math.pow(s, pinch);
    // The hem band, over the last HEM_STIFFEN_SPAN of the drop only.
    const intoHem = smoothstep01((vy - (1 - HEM_STIFFEN_SPAN)) / HEM_STIFFEN_SPAN);
    return colAmp[c] * shaped * (1 - HEM_STIFFEN * intoHem);
  };

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

    for (let c = 0; c <= cols; c++) rowZ[c] = sectionZ(c, vy) * deepen;

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

      positions[i3] = wallX + towardCentre * (colX[c] * splay + lag);
      positions[i3 + 1] = y - z * swing - sink;
      positions[i3 + 2] = z;

      // THE NORMAL, FROM THIS ROW'S OWN NEIGHBOURS. It used to be computed once
      // per column from the analytic slope of a sine and copied down the whole
      // drop, on the grounds that the slope did not change with height. It does
      // now — that is the entire change — so a central difference across the two
      // adjacent columns is taken instead, one-sided at the two edges. The
      // surface is smooth in x, so this is the answer the derivative would give,
      // and it stays right whatever sectionZ is made to do next.
      const cLo = c > 0 ? c - 1 : c;
      const cHi = c < cols ? c + 1 : c;
      const dz = rowZ[cHi] - rowZ[cLo];
      const dx = (colX[cHi] - colX[cLo]) * splay * towardCentre;
      const nx = -dz;
      const nz = dx;
      const len = Math.hypot(nx, nz) || 1;

      normals[i3] = nx / len;
      normals[i3 + 1] = 0;
      normals[i3 + 2] = nz / len;
      compression[v] = colComp[c];
      depth[v] = z / maxDepth;
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
uniform mat3 uQuadH;
attribute float aCompression;
attribute float aDepth;

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
  vCompression = aCompression;
  vDepth = aDepth;
  // ONTO THE TRACED QUAD. Everything above is solved square — the waves, the
    // sway, the track — in an axis-aligned box, and this is where it gets put
    // back on a window that was photographed in perspective. modelMatrix first
    // so the vertex is in world pixel space, then the homography with its
    // perspective divide, then the ordinary projection.
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec3 warped = uQuadH * vec3(world.xy, 1.0);
    world.xy = warped.xy / warped.z;
    vBackdrop = world.xy / uFrame;
    gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec3 uColour;
uniform float uOpacity;
uniform float uIsSheer;
uniform sampler2D uBackdrop;
uniform float uHasBackdrop;
uniform float uTransmitGain;
uniform float uScatterGain;
varying vec2 vBackdrop;
uniform float uHemBand;
uniform float uHemDensity;
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

  // NARROW AND DARK, NOT WIDE AND GREY — and getting that backwards is what made
  // the old render read as painted shading rather than as cloth.
  //
  // In a photograph of hanging sheer the tone is not a symmetric wave at all: it
  // is a WIDE soft bright lobe separated from the next one by a NARROW crease
  // that goes genuinely dark, nearly black against a lit window. The previous
  // constants had it the other way round, spreading a gentle 7–20% darkening
  // across half of every wave. That reads as grey paint because no real fold is
  // shaded that way.
  //
  // The exponent is what makes it narrow: at 2.2 the term is still near zero
  // over most of the lobe and only bites in the last of the trough, so the dark
  // arrives as a line. The coefficient is then free to be several times what it
  // was without the panel going muddy, because it is only ever applied to a
  // sliver.
  float cavityShaped = pow(cavity, 2.2);
  shade *= 1.0 - cavityShaped * mix(0.34, 0.48, vCompression);

  // And the crest is the part that sees the most room, so it lifts slightly.
  // Cheaper on contrast than pushing the troughs further down, and it is the
  // separation between one fold and the next that carries the shape.
  shade *= 1.0 + max(0.0, vDepth) * 0.045;

  // THE TRACK'S OWN SHADOW. It hangs directly over the heading and blocks the
  // ceiling light, so the top of the cloth sits in a band of shade — much deeper
  // inside the folds, which the track closes off almost entirely. This is what
  // attaches the fabric to the hardware: without it the panel reads as starting
  // below the track rather than hanging from it.
  float underTrack = smoothstep(0.80, 1.0, vUv.y);
  shade *= 1.0 - underTrack * (0.10 + cavity * 0.14);

  // Packed fabric is denser — more layers, less light through and around it.
  // Squared, so only genuinely stacked cloth darkens: a half-open panel is still
  // a curtain, not a bundle. The old flat 0.95 barely registered at full stack,
  // where the fabric is several layers thick and visibly heavier.
  shade *= mix(1.0, 0.89, vCompression * vCompression);

  // The hem picks up floor bounce rather than window light, so it sits a shade
  // below the heading. Barely there on purpose: overdone it reads as the curtain
  // fading out at the bottom.
  float drop = 1.0 - vUv.y;
  shade *= 1.0 - drop * drop * 0.05;

  // THE DOUBLED HEM. Two or three layers where the rest of the panel is one, so
  // it is both darker and — below, in the alpha — denser. On a sheer against a
  // window this strip is one of the most recognisable things about the product,
  // and the cloth simply stopped without it.
  float hemBand = 1.0 - smoothstep(0.0, uHemBand, vUv.y);
  shade *= 1.0 - hemBand * 0.13;

  colour *= shade;

  float alpha = uOpacity;

  // SHEER. Backlit by the window, so brightness is governed by how far the light
  // travels through the cloth: where the surface faces the camera the path is
  // shortest and it glows, and where it turns edge-on the path is long and it goes
  // dense. That contrast is the whole character of a sheer.
  if (uIsSheer > 0.5) {
    // 2.4, up from 1.5, and the floor drops from 0.90 to 0.74. Same reading off
    // the same photograph: on a backlit sheer the glow is confined to the part
    // of the lobe square to the camera, and the cloth goes dense fast as it
    // turns away — the light path through the weave lengthens as 1/cos and the
    // fabric stacks up behind itself. A wide gentle glow is the tell of a
    // surface being lit rather than a cloth being seen through.
    float facing = pow(max(geoN.z, 0.0), 2.4);
    vec3 glow = colour + vec3(0.13, 0.11, 0.06);
    colour = mix(colour, glow, facing * (1.0 - vCompression * 0.4));

    // TRANSPARENCY FROM THE WEAVE ITSELF, which is the honest way to draw a sheer:
    // it is not a uniformly hazy sheet, it is an open cloth, and what you see
    // through it is the gaps between its threads. So the slub reads as slightly
    // more solid and the open weave as slightly clearer, from the same relief
    // channel the lighting uses. A flat alpha is what made it look like tinted
    // glass rather than fabric.
    alpha *= clamp(1.0 + relief * 0.30, 0.80, 1.10);

    // Packed fabric is layer upon layer, and stacks up nearly solid at the ends.
    alpha = mix(alpha, min(1.0, alpha + 0.14), vCompression);

    // THE CLOTH SCATTERS, IT DOES NOT JUST LET LIGHT PAST.
    //
    // Left to ordinary alpha blending, everything behind a sheer arrives at the
    // eye SHARP — the garden through the window was legible leaf by leaf under a
    // veil, which is what glass does, or a tinted film. It is not what cloth
    // does. A sheer is an open weave in front of a bright field: light entering
    // it is scattered by every thread it passes, so the image behind survives
    // only as tone and colour, never as detail.
    //
    // The blend has to be done here rather than by the compositor, because the
// compositor only has the sharp original to blend with. So the diffused
    // backdrop is sampled and mixed in at exactly the weight the alpha would
    // have carried, and the fragment then draws opaque — the same visual
    // weight of cloth, over a backdrop that has been through the weave.
    if (uHasBackdrop > 0.5) {
      // The window's light, already softened by the weave. See SHEER_DIFFUSION.
      vec3 behind = texture2D(uBackdrop, vBackdrop).rgb;

      // How much gets through. Less where the cloth is stacked several layers
      // deep, less again through the doubled hem, and a little less where the
      // surface has turned away from the camera and the path through the weave
      // is longer than the sheet is thick.
      float transmit = (1.0 - uOpacity) * uTransmitGain;
      transmit *= 1.0 - vCompression * 0.55;
      transmit *= 1.0 - hemBand * 0.45;
      transmit *= mix(0.72, 1.0, facing);

      // The near face, lit by the room. This carries the fold shading — and it
      // is the ONLY term that does, which is why the folds fade out against the
      // bright window and come back against the wall.
      vec3 scattered = colour * uOpacity * uScatterGain;

      colour = behind * transmit + scattered;
      // Composited here, so it draws opaque: the blend has already happened and
      // the framebuffer must not do it a second time against the sharp original.
      alpha = 1.0;
    }

    // And the doubled hem is the same effect in a strip: three layers of a sheer
    // read almost as a solid band. See HEM_BAND_DENSITY.
    alpha = mix(alpha, min(1.0, alpha + uHemDensity), hemBand);
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

/** How far a face-fixed track hangs below its fixing line, in mm.
 *
 * A face bracket screws to the wall above the opening and the track clamps into
 * its lower end, so the track sits roughly 34mm below the screws — about twice
 * the 16mm face. That drop is the whole visible difference between the two
 * mounts (the brackets themselves are not drawn; the track hides them), so it
 * has to survive the same 2.4x oversize the profile gets. Expressed as a bare
 * multiple of the track height it did not: at 1.15x, the track covered all but
 * about two pixels of it and the Ceiling/Window control looked inert. */
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

  // Two separate terms, and the split is the whole point.
  //
  // NOTE: no backticks anywhere in this file's GLSL — the shaders live in JS
  // template literals, so one would end the string and break the build.
  //
  // diffuse is the anodising or paint. It MULTIPLIES the hardware colour, so it
  // carries the hue — but multiplying is all the old shader did, and that is why
  // only the white track worked. On #303030 black the entire 0.4-1.06 range
  // collapses into near-black: channel, chamfers and gliders all landed within a
  // few levels of each other and the profile read as a flat sticker.
  //
  // spec is the sheen, and it is ADDED, not multiplied — so it does not care how
  // dark the base is. That is physically how a dark anodised extrusion stays
  // legible in a real room: you read its shape from the light it throws back at
  // you, not from parts of it getting darker.
  float diffuse;
  float spec;

  if (y > 0.88) {
    // TOP CHAMFER — faces the ceiling, takes the most light, and is what makes
    // the track read as having a top surface at all.
    diffuse = 0.98; spec = 0.45;
  } else if (y > 0.40) {
    // FRONT FACE. Falls away downward, gently: a flat face, not a tube. The
    // original ramped hard over its whole height, which is what a cylinder does
    // and is why it looked like a roller.
    float t = (y - 0.40) / 0.48;
    diffuse = mix(0.86, 1.0, t);
    spec = 0.10 + 0.16 * t;
  } else if (y > 0.29) {
    // LOWER CHAMFER — turns down and forward, catching a little floor bounce.
    diffuse = 0.92; spec = 0.22;
  } else {
    // CHANNEL. Recessed, so much the darkest part of the profile. This is the
    // single feature that separates a track from a bar.
    diffuse = 0.42; spec = 0.02;
  }

  // CHROME mirrors the room, and that is the only thing that distinguishes it
  // from grey paint. Read down the face: ceiling (bright), the horizon line
  // where wall meets ceiling (dark), then floor bounce (dim). The previous
  // single sine over the whole height just banded the bar.
  if (uIsChrome > 0.5) {
    float sky     = smoothstep(0.62, 0.96, y);
    float horizon = 1.0 - smoothstep(0.0, 0.09, abs(y - 0.58));
    float bounce  = smoothstep(0.42, 0.30, y);
    diffuse *= 1.0 - 0.34 * horizon;
    spec += 0.85 * sky + 0.20 * bounce;
  }

  // GLIDERS in the channel — what the fabric actually hangs from, and at this
  // spacing also the reason the waves fall where they do.
  if (y <= 0.29) {
    float u = vUv.x / max(uRunnerPitch, 1e-5);
    float d = abs(fract(u) - 0.5) * 2.0;     // 0 at a glider's centre
    // A dome, not the old hard-edged dash — that read as a stitched seam.
    float bead = 1.0 - smoothstep(0.10, 0.62, d);
    // Falls off vertically too, so each one is a bead sitting in the slot
    // rather than a full-height bar filling it.
    float vy = smoothstep(0.02, 0.26, y) * (1.0 - smoothstep(0.20, 0.29, y));
    bead *= clamp(vy * 1.6, 0.0, 1.0);
    diffuse = mix(diffuse, 0.86, bead);
    // A small highlight on each crown, so the runners read on dark hardware too.
    spec += bead * (1.0 - smoothstep(0.0, 0.34, d)) * 0.42;
  }

  // The slot's own opening along the very bottom edge — a dark hairline, which
  // is what you actually see of a channel from the front.
  float slot = 1.0 - smoothstep(0.0, 0.055, y);
  diffuse *= 1.0 - slot * 0.5;
  spec *= 1.0 - slot;

  // Painted white hardware is matte; anodised black and polished chrome are not.
  // Scaling the specular by how light the base already is keeps a white track
  // from clipping to a blown-out bar, while letting a black one read fully.
  float lum = dot(uColour, vec3(0.299, 0.587, 0.114));
  float specGain = mix(1.0, 0.28, smoothstep(0.25, 0.85, lum));

  vec3 col = uColour * diffuse + vec3(spec * specGain);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

/** End cap. Moulded, slightly proud of the profile, and flat rather than
 * chamfered — so it reads as a cap and not as more track. */
const TRACK_CAP_FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 uColour;
varying vec2 vUv;
void main() {
  // Same diffuse + additive-specular split as the extrusion, for the same
  // reason: a purely multiplicative cap vanishes on dark hardware, and then the
  // track appears to run off through the wall again.
  float diffuse = mix(0.78, 1.0, smoothstep(0.0, 0.85, vUv.y));
  float spec = 0.30 * smoothstep(0.45, 1.0, vUv.y);
  // Inner edge in shadow where it meets the extrusion.
  float inner = 1.0 - smoothstep(0.0, 0.22, vUv.x);
  diffuse *= 1.0 - inner * 0.18;
  spec *= 1.0 - inner;

  float lum = dot(uColour, vec3(0.299, 0.587, 0.114));
  float specGain = mix(1.0, 0.28, smoothstep(0.25, 0.85, lum));
  gl_FragColor = vec4(clamp(uColour * diffuse + vec3(spec * specGain), 0.0, 1.0), 1.0);
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
    // MIPMAPPED, AND THIS IS WHY THE CLOTH LOOKED LIKE A HONEYCOMB.
    //
    // The old reasoning was that the map is magnified rather than minified, so a
    // mip chain would never be sampled. That is true of exactly one case: a
    // fully-drawn panel across a wide window on a full-size buffer. It is false
    // everywhere else, and the cases where it is false are the ones on screen
    // most of the time.
    //
    // u runs along the FABRIC, not along x, so the whole 640-texel map is
    // carried across whatever width the panel currently occupies. Draw the
    // curtain back and that width collapses to a third — the same map crushed
    // into a third of the pixels, a minification of three or four times. And the
    // map's content is an open-weave linen: a REGULAR SQUARE GRID. A regular grid
    // sampled below its own Nyquist limit does not go soft, it beats against the
    // pixel lattice and produces a second, coarser grid that is not in the cloth
    // at all. That interference is the honeycomb, and it was worst exactly where
    // the fabric stacks — which is where the panel is narrowest.
    //
    // Trilinear plus anisotropy fixes it properly rather than by blurring the
    // texture: the mip chain supplies a correctly band-limited sample for
    // whatever minification this frame is asking for, and the anisotropic taps
    // keep the weave sharp along the fold while it is being averaged across it.
    //
    // The WebGL1 note the old comment carried no longer applies: three's renderer
    // is WebGL2 here, where NPOT textures take mipmaps and repeat wrapping like
    // any other.
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    // Anisotropy is set once the renderer exists and can be asked for its
    // limit — the textures are built before it. See the init below.
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
      backdrop.colorSpace = THREE.SRGBColorSpace;
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

      // WAVE COUNT — from how much of the frame the trace covers. See
      // wavesForTrace.
      const waveCount = wavesForTrace(windowWidth, W);

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

      const rgb = hexToRgb(colour);
      const colourVec = new THREE.Vector3(rgb.r / 255, rgb.g / 255, rgb.b / 255);
      const isSheer = fabricType === 'sheer';

      const repeat = new THREE.Vector2(WEAVE_REPEAT, WEAVE_REPEAT);

      const makeMaterial = () =>
        new THREE.ShaderMaterial({
          uniforms: {
            uQuadH: { value: quadMatrix },
            uColour: { value: colourVec },
            uOpacity: { value: isSheer ? sheerOpacity(colour) : 1.0 },
            uIsSheer: { value: isSheer ? 1.0 : 0.0 },
            // Only the sheer looks through anything. A blockout has nothing
            // behind it to diffuse, so it never samples this.
            uBackdrop: { value: backdrop },
            uHasBackdrop: { value: isSheer && blurCtx ? 1.0 : 0.0 },
            uTransmitGain: { value: SHEER_TRANSMIT_GAIN },
            uScatterGain: { value: SHEER_SCATTER_GAIN },
            uFrame: { value: new THREE.Vector2(W, H) },
            uHemBand: { value: HEM_BAND },
            uHemDensity: { value: HEM_BAND_DENSITY },
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
            // 0.30 for the sheer, down from 0.45. The bump turns the weave map
            // into relief that catches the room light, and on an open-weave
            // linen every hole in the mesh becomes its own lit cell. Correct in
            // principle — that IS what the cloth does — but at this viewing
            // distance a real sheer reads as a translucent haze with the odd
            // slub catching, not as a resolved egg-crate. The blockout's sateen
            // has no open grid to light up and keeps its 0.6.
            uBump: { value: isSheer ? 0.30 : 0.6 },

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

      // NO BRACKETS. They were drawn here and have been removed: in the room,
      // looking at a curtain from anywhere a person actually stands, the track
      // hides its own brackets almost completely. Drawing them put a row of hard
      // tabs along the top that reads as hardware clutter and is not what the
      // product looks like. The face-fix DROP stays — the track sitting lower
      // than a ceiling fix is the real, visible difference between the mounts.

      const trackMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uQuadH: { value: quadMatrix },
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
        uniforms: { uQuadH: { value: quadMatrix }, uColour: { value: hardwareVec } },
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
