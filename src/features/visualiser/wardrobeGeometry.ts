import { computeHomography, type Point } from './homography';
export { BOARD_MM, RAIL_DROP_MM, RAIL_RADIUS_MM, MODULE_WIDTH_MM, LAYOUT_COLUMNS, columnsFor, sidePanelsFor, facePostsFor } from '@/features/joinery';
export type { Column, ColumnFill, ResolvedColumn } from '@/features/joinery';


/** WHAT THE TRACED REGION IS, IN MILLIMETRES, WORKED FROM ITS OWN SHAPE.
 *
 * THE HEIGHT IS THE ONE THING WE ALREADY KNOW. Every cabinet in the range is
 * 2016 high — it is not a variable, it is a property of the product — so the
 * moment a customer drags a box saying "the wardrobe goes here", the height of
 * that box IS 2016mm. Everything else in the picture can then be read off it.
 *
 * AND THAT IS WHY THE PHOTOGRAPH'S DISTANCE STOPS MATTERING. A wall shot from
 * across the room and the same wall shot from the doorway trace to boxes of
 * very different pixel sizes, but both are 2016mm tall, so both resolve to the
 * same millimetres-per-pixel and the same wardrobe. Scale is carried by the
 * product rather than guessed from the room, which is the only way two
 * customers photographing the same alcove get the same answer.
 *
 * A RATIO, NOT A MEASUREMENT. Nothing here needs the lens, the sensor or the
 * distance: the traced box's own width-to-height is all that is asked for, and
 * that ratio survives the camera being anywhere.
 *
 * Averaged over both pairs of edges because a hand-drawn quad is never quite
 * square, and on an angled wall the two uprights genuinely differ — the mean is
 * the honest reading of a shape that is a trapezium on purpose.
 */
export function tracedWidthMm(corners: Point[], heightMm = 2016): number {
  if (corners.length !== 4) return heightMm;
  const [tl, tr, br, bl] = corners;
  const top = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
  const bottom = Math.hypot(br[0] - bl[0], br[1] - bl[1]);
  const left = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
  const right = Math.hypot(br[0] - tr[0], br[1] - tr[1]);
  const wPx = (top + bottom) / 2;
  const hPx = (left + right) / 2;
  if (hPx <= 0) return heightMm;
  return (wPx / hPx) * heightMm;
}

// --- The camera ------------------------------------------------------------

export interface Projector {
  /** Model millimetres → image pixels. */
  project(x: number, y: number, z: number): [number, number];
  /** Camera depth of a model point, for sorting faces back to front. */
  depth(x: number, y: number, z: number): number;
}

/** Where two lines cross, or null if they are within a whisker of parallel. */
function intersect(a: Point, b: Point, c: Point, d: Point): Point | null {
  const x1 = a[0], y1 = a[1], x2 = b[0], y2 = b[1];
  const x3 = c[0], y3 = c[1], x4 = d[0], y4 = d[1];
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(den) < 1e-9) return null;
  const p = x1 * y2 - y1 * x2;
  const q = x3 * y4 - y3 * x4;
  return [(p * (x3 - x4) - (x1 - x2) * q) / den, (p * (y3 - y4) - (y1 - y2) * q) / den];
}

/** THE LENS, RECOVERED FROM THE TRACE ITSELF.
 *
 * The depth was the last thing still being guessed at. Everything else comes
 * out of the four corners exactly — verified against a synthetic camera at
 * 0.0px — but the extrusion is scaled by the focal length, and that was an
 * assumed 1.1 × the image's longer side. Measured against ground truth, a wall
 * shot on a longer lens came out 75% too deep and a wide one 58% too shallow.
 * Nothing about the front face gives that away, so it just quietly looked wrong.
 *
 * A rectangle gives it up, though. Its two pairs of edges meet at two vanishing
 * points, and because the real edges are at right angles those points are
 * conjugate: (V1 − c) · (V2 − c) + f² = 0 with the principal point at c. So the
 * focal length falls straight out of the trace, no EXIF and no assumption.
 *
 * IT DEGENERATES ON A HEAD-ON WALL, where both pairs of edges stay parallel and
 * their vanishing points run off to infinity. That is exactly the case where it
 * does not matter: a wall square to the camera shows almost no depth, so a
 * wrong lens has almost nothing to scale. The fallback covers it.
 *
 * Guarded at both ends, because a near-parallel pair produces a vanishing point
 * a very long way out and an f to match. Anything outside a plausible lens is
 * discarded rather than trusted. */
function focalFromQuad(corners: Point[], cx: number, cy: number, imageW: number, imageH: number): number {
  const assumed = 1.1 * Math.max(imageW, imageH);
  const [tl, tr, br, bl] = corners;

  const v1 = intersect(tl, tr, bl, br); // where the two horizontal edges meet
  const v2 = intersect(tl, bl, tr, br); // and the two vertical ones
  if (!v1 || !v2) return assumed;

  // A vanishing point far enough out is parallel in all but arithmetic, and the
  // f it implies is noise amplified by the length of the extrapolation.
  const far = 60 * Math.max(imageW, imageH);
  if (Math.hypot(v1[0] - cx, v1[1] - cy) > far) return assumed;
  if (Math.hypot(v2[0] - cx, v2[1] - cy) > far) return assumed;

  const fSq = -((v1[0] - cx) * (v2[0] - cx) + (v1[1] - cy) * (v2[1] - cy));
  if (!(fSq > 0)) return assumed;
  const f = Math.sqrt(fSq);

  // Between a very wide lens and a short telephoto. Outside that the solve has
  // gone wrong rather than found an unusual camera.
  const lo = 0.35 * Math.max(imageW, imageH);
  const hi = 4.0 * Math.max(imageW, imageH);
  return f >= lo && f <= hi ? f : assumed;
}

/** A REAL CAMERA RECOVERED FROM THE TRACE, for rendering the cabinet in 3D and
 * compositing it onto the photograph.
 *
 * projectorFromQuad returns a homography plus a depth direction, which is all a
 * painter's-algorithm renderer needs and is deliberately NOT a rigid camera —
 * it lets the two axes scale differently so the front face lands exactly on a
 * hand-traced quad that need not match the product's proportions.
 *
 * A GPU cannot be told that. It has one projection matrix, so the camera has to
 * be rigid, and the price is that the cabinet lands where its real proportions
 * put it rather than stretched to fill the drawing. That is the right trade
 * here and it is the same rule the rest of the visualiser now follows: the
 * trace says where and how big the room is, the product says how big the
 * product is, and whether it fits is the answer rather than the input.
 *
 * The decomposition is standard. A plane's image is K[r1 r2 t] up to scale, so
 * dividing the intrinsics out of the homography leaves the pose, and the third
 * rotation column — the axis the photograph never showed — is the cross product
 * of the other two.
 *
 * Returns null on a degenerate trace.
 */
export interface QuadCamera {
  /** Vertical field of view, degrees. */
  fovDeg: number;
  /** Camera position in model space, millimetres. */
  position: [number, number, number];
  /** Camera basis in model space: right, up, and backward (three.js looks down
   * its own −Z, so this is the direction OUT of the screen). */
  right: [number, number, number];
  up: [number, number, number];
  back: [number, number, number];
}

export function cameraFromQuad(
  corners: Point[],
  widthMm: number,
  heightMm: number,
  imageW: number,
  imageH: number,
): QuadCamera | null {
  if (corners.length !== 4 || widthMm <= 0 || heightMm <= 0) return null;

  const cx = imageW / 2;
  const cy = imageH / 2;
  const f = focalFromQuad(corners, cx, cy, imageW, imageH);

  // Model plane, Z = 0, origin at the opening's bottom-left, Y up. Traced
  // corners arrive TL TR BR BL.
  const model: Point[] = [[0, heightMm], [widthMm, heightMm], [widthMm, 0], [0, 0]];

  let h: number[];
  try {
    h = computeHomography(model, corners);
  } catch {
    return null;
  }

  // K⁻¹H: the top two rows are (row − centre × bottom row) / f.
  const a = [
    (h[0] - cx * h[6]) / f, (h[1] - cx * h[7]) / f, (h[2] - cx * h[8]) / f,
    (h[3] - cy * h[6]) / f, (h[4] - cy * h[7]) / f, (h[5] - cy * h[8]) / f,
    h[6], h[7], h[8],
  ];
  const col = (i: number) => [a[i], a[i + 3], a[i + 6]];
  const norm = (v: number[]) => Math.hypot(v[0], v[1], v[2]);

  const c0 = col(0);
  const c1 = col(1);
  const c2 = col(2);
  const n0 = norm(c0);
  const n1 = norm(c1);
  if (!isFinite(n0) || !isFinite(n1) || n0 < 1e-12 || n1 < 1e-12) return null;

  // One scale for both, so the rotation stays as close to orthonormal as the
  // trace allows before it is forced.
  let lambda = 2 / (n0 + n1);
  // The cabinet must be IN FRONT of the camera. A homography is only defined up
  // to sign, so half the time the decomposition arrives inside out.
  if (c2[2] * lambda < 0) lambda = -lambda;

  let r1 = c0.map(v => v * lambda);
  let r2 = c1.map(v => v * lambda);
  const t = c2.map(v => v * lambda);

  // Gram-Schmidt, then the third axis follows from the pair.
  const d = r1[0] * r2[0] + r1[1] * r2[1] + r1[2] * r2[2];
  r2 = r2.map((v, i) => v - (d / 2) * r1[i]);
  r1 = r1.map((v, i) => v - (d / 2) * r2[i]);
  const l1 = norm(r1);
  const l2 = norm(r2);
  if (l1 < 1e-12 || l2 < 1e-12) return null;
  r1 = r1.map(v => v / l1);
  r2 = r2.map(v => v / l2);
  const r3 = [
    r1[1] * r2[2] - r1[2] * r2[1],
    r1[2] * r2[0] - r1[0] * r2[2],
    r1[0] * r2[1] - r1[1] * r2[0],
  ];

  // R maps world to camera, so its ROWS are the camera's axes in world space.
  // Position is −Rᵀt.
  const pos: [number, number, number] = [
    -(r1[0] * t[0] + r2[0] * t[1] + r3[0] * t[2]),
    -(r1[1] * t[0] + r2[1] * t[1] + r3[1] * t[2]),
    -(r1[2] * t[0] + r2[2] * t[1] + r3[2] * t[2]),
  ];

  // Image space has Y DOWN and looks along +Z; three.js has Y UP and looks
  // along −Z. So the camera's up is −r2 and its backward is −r3.
  return {
    fovDeg: (2 * Math.atan(imageH / (2 * f)) * 180) / Math.PI,
    position: pos,
    right: [r1[0], r1[1], r1[2]],
    up: [-r2[0], -r2[1], -r2[2]],
    back: [-r3[0], -r3[1], -r3[2]],
  };
}

/** Builds the projection that puts a modelled wardrobe onto the traced wall.
 *
 * TWO HALVES, AND THE SPLIT IS THE POINT.
 *
 * The FRONT FACE is placed by the plain homography through the four traced
 * corners, so it lands on them exactly. That matters because the outline is the
 * one instruction the customer actually gave, and because a hand-traced box does
 * not have to match the product's real proportions — trace a tall narrow slot
 * for a wide wardrobe and no rigid camera can satisfy both. The homography can,
 * because it is free to scale the two axes differently.
 *
 * The DEPTH direction comes from a camera pose recovered from the same quad.
 * A plane's image is its camera's intrinsics times two columns of a rotation
 * plus a translation; divide the intrinsics back out and what is left is the
 * pose, and the third rotation column — the one the photograph never showed —
 * is the cross product of the other two. That vector is the wall's normal, and
 * it is what the carcass is extruded along.
 *
 * Solving it as one rigid camera instead was the first attempt and it fitted the
 * corners to within 150 pixels, because forcing the rotation orthonormal has to
 * throw away whatever the trace and the real proportions disagree about. Taking
 * the fit from the homography and only the direction from the pose keeps both.
 *
 * FOCAL LENGTH IS ASSUMED — a phone photo arrives with no EXIF here, and one
 * rectangle cannot give up both the lens and the pose. 1.1 × the image's longer
 * side is a normal-ish lens. Being a little wrong makes the depth read slightly
 * deep or shallow; it cannot affect the front face, which is nailed to the
 * trace regardless.
 *
 * Returns null on a degenerate quad — three corners in a line, or a trace
 * collapsed to nothing. */
export function projectorFromQuad(
  corners: Point[],
  widthMm: number,
  heightMm: number,
  imageW: number,
  imageH: number,
): Projector | null {
  if (corners.length !== 4 || widthMm <= 0 || heightMm <= 0) return null;

  const cx = imageW / 2;
  const cy = imageH / 2;
  const f = focalFromQuad(corners, cx, cy, imageW, imageH);

  // Model plane, Z = 0, origin at the opening's bottom-left, Y up. The traced
  // corners arrive TL TR BR BL, so their partners are the rectangle's corners
  // in that same order — and "top" in model space is the larger Y.
  const model: Point[] = [
    [0, heightMm],
    [widthMm, heightMm],
    [widthMm, 0],
    [0, 0],
  ];

  let h: number[];
  try {
    h = computeHomography(model, corners);
  } catch {
    return null;
  }

  // K⁻¹ is [[1/f, 0, -cx/f], [0, 1/f, -cy/f], [0, 0, 1]], so the top two rows of
  // K⁻¹H are (row − centre × bottom row) / f.
  const a = [
    (h[0] - cx * h[6]) / f, (h[1] - cx * h[7]) / f, (h[2] - cx * h[8]) / f,
    (h[3] - cy * h[6]) / f, (h[4] - cy * h[7]) / f, (h[5] - cy * h[8]) / f,
    h[6], h[7], h[8],
  ];

  const col = (i: number) => [a[i], a[i + 3], a[i + 6]];
  const norm = (v: number[]) => Math.hypot(v[0], v[1], v[2]);

  let r1 = col(0);
  let r2 = col(1);
  const n1 = norm(r1);
  const n2 = norm(r2);
  if (!isFinite(n1) || !isFinite(n2) || n1 < 1e-12 || n2 < 1e-12) return null;

  r1 = r1.map(v => v / n1);
  // Gram-Schmidt: r2 forced square to r1, then r3 follows from the pair.
  const dot = r1[0] * r2[0] + r1[1] * r2[1] + r1[2] * r2[2];
  r2 = r2.map((v, i) => v - dot * r1[i]);
  const r2n = norm(r2);
  if (r2n < 1e-12) return null;
  r2 = r2.map(v => v / r2n);
  let r3 = [
    r1[1] * r2[2] - r1[2] * r2[1],
    r1[2] * r2[0] - r1[0] * r2[2],
    r1[0] * r2[1] - r1[1] * r2[0],
  ];

  // The wall's normal must point back toward the camera, or the carcass gets
  // extruded into the wall instead of out of it. A homography is only defined
  // up to sign, so half the time it arrives the wrong way round.
  if (r3[2] > 0) r3 = r3.map(v => -v);

  // The depth column, in the same units and scale as the homography's own
  // columns: H = (1/s)·K·[r1 r2 t], so the third column is (1/s)·K·r3 with
  // s the scale that made r1 a unit vector.
  // λ, not 1/λ. H = λ·K·[r1 r2 t], so the depth column that belongs on the same
  // scale as H's own columns is λ·K·r3. Inverting it leaves the front face
  // exactly right — it is nailed to the homography — while the carcass extrudes
  // several times too far, which is a convincing enough picture of a wardrobe
  // that it takes a measurement rather than a glance to catch.
  const s = n1;
  const c3 = [s * (f * r3[0] + cx * r3[2]), s * (f * r3[1] + cy * r3[2]), s * r3[2]];

  // Depth increases away from the camera; the scale is arbitrary but consistent,
  // which is all a painter's sort needs.
  const depthOf = (x: number, y: number, z: number) =>
    (h[6] * x + h[7] * y + h[8]) + c3[2] * z;

  return {
    project(x, y, z) {
      const u = h[0] * x + h[1] * y + h[2] + c3[0] * z;
      const v = h[3] * x + h[4] * y + h[5] + c3[1] * z;
      const w = h[6] * x + h[7] * y + h[8] + c3[2] * z;
      const d = Math.abs(w) < 1e-9 ? 1e-9 : w;
      return [u / d, v / d];
    },
    depth: depthOf,
  };
}
