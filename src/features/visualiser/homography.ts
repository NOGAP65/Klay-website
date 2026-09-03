export type Point = [number, number];

/**
 * Computes the 3x3 homography H (row-major, normalised so h[8] = 1) such that
 * for each correspondence i:
 *
 *   [x'·w, y'·w, w]ᵀ = H · [x, y, 1]ᵀ   where (x, y) = src[i], (x', y') = dst[i]
 *
 * Used to map the traced window quad (photo pixel space) onto the unit square
 * (texture UV space) so the fragment shader can sample the fabric texture with
 * true perspective correction — per-pixel, not per-triangle-vertex.
 */
export function computeHomography(src: Point[], dst: Point[]): number[] {
  if (src.length !== 4 || dst.length !== 4) {
    throw new Error('computeHomography requires exactly 4 point correspondences');
  }
  // Standard DLT setup: 8 equations in the 8 unknowns h0..h7 (h8 fixed to 1).
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [X, Y] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
    b.push(Y);
  }
  const h = solveLinearSystem(A, b);
  return [...h, 1];
}

/** Gauss-Jordan elimination with partial pivoting. */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) {
      throw new Error('Degenerate quad — corners are collinear or coincident');
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];

    const p = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= p;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map(row => row[n]);
}

/**
 * Applies a homography to a point, including the perspective divide.
 * Handy for CPU-side checks and for positioning 2D-canvas hardware overlays.
 */
export function applyHomography(h: number[], [x, y]: Point): Point {
  const w = h[6] * x + h[7] * y + h[8];
  return [
    (h[0] * x + h[1] * y + h[2]) / w,
    (h[3] * x + h[4] * y + h[5]) / w,
  ];
}

/**
 * Converts a row-major 3x3 matrix to the column-major Float32Array layout
 * WebGL's uniformMatrix3fv expects (transpose must be false in WebGL1).
 */
export function toColumnMajor(m: number[]): Float32Array {
  return new Float32Array([
    m[0], m[3], m[6],
    m[1], m[4], m[7],
    m[2], m[5], m[8],
  ]);
}
