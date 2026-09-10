// A sheared wave has genuine return faces without intersecting itself:
// x = pitch*t + lean*z, z = amplitude*sin(2*pi*t). The shear is invertible.
export const FOLD_LEAN = 0.38;
export const FABRIC_FULLNESS = 2.25;
export const MIN_FOLD_PITCH = 0.24;

export function foldArcLength(pitch: number, amplitude: number, lean = FOLD_LEAN): number {
  const steps = 64;
  let length = 0;
  for (let i = 0; i < steps; i++) {
    const dz = amplitude * Math.PI * 2 * Math.cos((i + 0.5) / steps * Math.PI * 2);
    length += Math.hypot(pitch + lean * dz, dz) / steps;
  }
  return length;
}

export function solveFoldDepth(pitch: number, fabricLength: number): number {
  let lo = 0, hi = fabricLength / 2;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (foldArcLength(pitch, mid) < fabricLength) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// Solve at startup, then interpolate while dragging. Fabric length is conserved
// as carriers gather, without running an iterative solver on every frame.
const depthTable = Array.from({ length: 129 }, (_, i) =>
  solveFoldDepth(MIN_FOLD_PITCH + i / 128 * (1 - MIN_FOLD_PITCH), FABRIC_FULLNESS));

export function foldDepth(pitch: number, extendedPitch: number): number {
  const ratio = Math.max(MIN_FOLD_PITCH, Math.min(1, pitch / extendedPitch));
  const index = (ratio - MIN_FOLD_PITCH) / (1 - MIN_FOLD_PITCH) * 128;
  const lo = Math.min(127, Math.floor(index));
  return extendedPitch * (depthTable[lo] + (depthTable[lo + 1] - depthTable[lo]) * (index - lo));
}
