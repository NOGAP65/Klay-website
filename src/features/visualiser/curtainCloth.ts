// A sheared wave has genuine return faces without intersecting itself:
// x = pitch*t + lean*z, z = amplitude*sin(2*pi*t). The shear is invertible.
export const FOLD_LEAN = 0.38;
const RELAXED_LEAN = 0.08;
export const FABRIC_FULLNESS = 2.25;
export const MIN_FOLD_PITCH = 0.24;

// A hanging S-fold has a broad, rounded face and a narrower return. An equal
// sine wave gives both the same width and reads as corrugated plastic.
const FOLD_CROWN = 0.42;
export function foldSection(turn: number): number {
  const angle = turn * Math.PI * 2;
  return -Math.cos(angle + FOLD_CROWN * Math.sin(angle));
}

export function foldArcLength(pitch: number, amplitude: number, lean = FOLD_LEAN): number {
  const steps = 64;
  let length = 0;
  for (let i = 0; i < steps; i++) {
    const angle = (i + 0.5) / steps * Math.PI * 2;
    const dz = amplitude * Math.PI * 2 * Math.sin(angle + FOLD_CROWN*Math.sin(angle))
      * (1 + FOLD_CROWN*Math.cos(angle));
    length += Math.hypot(pitch + lean * dz, dz) / steps;
  }
  return length;
}

/** Open, rounded lobes only turn back under themselves as carriers gather. */
export function foldLean(pitch: number, extendedPitch: number): number {
  const compression = Math.max(0, Math.min(1, (1 - pitch / extendedPitch) / (1 - MIN_FOLD_PITCH)));
  const eased = compression * compression * (3 - 2 * compression);
  return RELAXED_LEAN + (FOLD_LEAN - RELAXED_LEAN) * eased;
}

export function solveFoldDepth(pitch: number, fabricLength: number, lean = FOLD_LEAN): number {
  let lo = 0, hi = fabricLength / 2;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (foldArcLength(pitch, mid, lean) < fabricLength) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// Solve at startup, then interpolate while dragging. Fabric length is conserved
// as carriers gather, without running an iterative solver on every frame.
const depthTable = Array.from({ length: 129 }, (_, i) => {
  const pitch = MIN_FOLD_PITCH + i / 128 * (1 - MIN_FOLD_PITCH);
  return solveFoldDepth(pitch, FABRIC_FULLNESS, foldLean(pitch, 1));
});

export function foldDepth(pitch: number, extendedPitch: number): number {
  const ratio = Math.max(MIN_FOLD_PITCH, Math.min(1, pitch / extendedPitch));
  const index = (ratio - MIN_FOLD_PITCH) / (1 - MIN_FOLD_PITCH) * 128;
  const lo = Math.min(127, Math.floor(index));
  return extendedPitch * (depthTable[lo] + (depthTable[lo + 1] - depthTable[lo]) * (index - lo));
}
