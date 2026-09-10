export type Point = [number, number];

export const UNIT_QUAD: Point[] = [[0, 0], [1, 0], [1, 1], [0, 1]];

/** A usable outline must stay convex and keep its original winding. */
export function isValidWindowQuad(points: Point[], minEdge = 1): boolean {
  if (points.length !== 4 || points.some(p => p.some(n => !Number.isFinite(n)))) return false;
  return points.every((a, i) => {
    const b = points[(i + 1) % 4], c = points[(i + 2) % 4];
    const ab: Point = [b[0] - a[0], b[1] - a[1]];
    const bc: Point = [c[0] - b[0], c[1] - b[1]];
    return Math.hypot(...ab) >= minEdge && ab[0] * bc[1] - ab[1] * bc[0] > minEdge * minEdge * 0.02;
  });
}

/** Fractions belong to the physical opening, not to its foreshortened edges. */
export function windowPlane(quad: Point[]) {
  const h = computeHomography(UNIT_QUAD, quad);
  return (u: number, v: number): Point => applyHomography(h, [u, v]);
}

/** Extend a plane homography into depth. Photo focal length is estimated when
 * its two vanishing directions cannot determine it. The traced plane remains
 * exact; the estimate only affects protruding folds and hardware. Coordinates
 * are image pixels with y UP, z towards the room. */
export function windowDepthProjection(h: number[], width: number, height: number) {
  const cx = width / 2, cy = height / 2;
  const a = [h[0] - cx * h[6], h[3] - cy * h[6], h[6]];
  const b = [h[1] - cx * h[7], h[4] - cy * h[7], h[7]];
  const frame = Math.max(width, height);
  const fSquared = Math.abs(a[2] * b[2]) > 1e-14
    ? -(a[0] * b[0] + a[1] * b[1]) / (a[2] * b[2]) : -1;
  const focal = fSquared > (frame * 0.6) ** 2 && fSquared < (frame * 3) ** 2
    ? Math.sqrt(fSquared) : frame * 1.2;
  const x = [a[0] / focal, a[1] / focal, a[2]];
  const y = [b[0] / focal, b[1] / focal, b[2]];
  const cross = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
  const scale = Math.sqrt(Math.hypot(...x) * Math.hypot(...y));
  const length = Math.hypot(...cross);
  const z = cross.map(n => -n * scale / length);
  return {
    focal,
    depth: [focal * z[0] + cx * z[2], focal * z[1] + cy * z[2], z[2]],
    // Camera coordinates with positive z towards the viewer. Inverse transpose
    // at the renderer accounts for imperfectly orthogonal hand-drawn outlines.
    basis: [x[0] / scale, y[0] / scale, z[0] / scale,
      x[1] / scale, y[1] / scale, z[1] / scale,
      -x[2] / scale, -y[2] / scale, -z[2] / scale],
  };
}

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
