// ---------------------------------------------------------------------------
// BUILT-IN WARDROBES, BUILT RATHER THAN PHOTOGRAPHED.
//
// The stickers are gone from the built-in path and this file is why.
//
// A photograph has one viewpoint baked into it. Ten of them had ten, which is
// what made the range read as a jumble — some front on, some three-quarter,
// some looking into a corner — and no amount of compositing fixes that, because
// the faces the camera never saw are not in the file. Two renders per layout
// would have covered two walls; the wall the customer actually photographed is
// at whatever angle it happens to be.
//
// So the wardrobe is MODELLED, and the traced quad tells us where the camera
// stood. Trace a square-on wall and it comes out square on; trace a wall running
// away to the left and the carcass runs away with it, side return foreshortening
// and shelves converging, because that is what the geometry does. The same idea
// as the blind and the curtain — solve in the product's own space, put it back
// on the traced quad — but with real depth rather than a flat plane, which is
// the whole of what "more complex" means here.
//
// TWO PARTS LIVE HERE: the shape of each layout, and the camera that sees it.
// ---------------------------------------------------------------------------

import { computeHomography, type Point } from './homography';

// --- The layouts -----------------------------------------------------------

export type ColumnFill =
  /** Fixed shelves, evenly spaced up the full height. */
  | { kind: 'shelves'; count: number }
  /** One long hanging rail near the top. Coats and dresses. */
  | { kind: 'hang' }
  /** Two rails, one above the other. Shirts and trousers — twice the capacity
   * in the same width, which is why every layout above 4.0 has one. */
  | { kind: 'hang2' }
  /** A bank of drawers in the bottom half with a rail over it. */
  | { kind: 'drawers'; count: number };

export interface Column {
  /** Share of the total width. The shares in a layout sum to 1. */
  width: number;
  fill: ColumnFill;
}

/** THE INTERNAL ARRANGEMENTS, and they are EDITORIAL — read off the supplied
 * product photographs rather than out of a joinery drawing. The column count,
 * the order and the rough proportions match what each render shows; the exact
 * shelf pitch and drawer heights are a sensible cabinetmaker's default.
 *
 * That is the right level of claim for a visualiser, which is selling the look
 * of the thing in the room rather than promising a cutting list. If the real
 * drawings turn up, this is the one place to correct. */
export const LAYOUT_COLUMNS: Record<string, Column[]> = {
  '2.9': [
    { width: 0.32, fill: { kind: 'shelves', count: 5 } },
    { width: 0.68, fill: { kind: 'hang' } },
  ],
  '3.0': [
    { width: 0.22, fill: { kind: 'shelves', count: 6 } },
    { width: 0.78, fill: { kind: 'hang' } },
  ],
  '4.0': [
    { width: 0.22, fill: { kind: 'shelves', count: 6 } },
    { width: 0.50, fill: { kind: 'hang2' } },
    { width: 0.28, fill: { kind: 'hang' } },
  ],
  '4.9': [
    { width: 0.36, fill: { kind: 'drawers', count: 4 } },
    { width: 0.64, fill: { kind: 'hang' } },
  ],
  '5.0': [
    { width: 0.28, fill: { kind: 'drawers', count: 3 } },
    { width: 0.72, fill: { kind: 'hang' } },
  ],
  '6.0': [
    { width: 0.20, fill: { kind: 'shelves', count: 5 } },
    { width: 0.46, fill: { kind: 'hang2' } },
    { width: 0.34, fill: { kind: 'hang' } },
  ],
  '8.0': [
    { width: 0.24, fill: { kind: 'drawers', count: 4 } },
    { width: 0.52, fill: { kind: 'hang' } },
    { width: 0.24, fill: { kind: 'drawers', count: 4 } },
  ],
};

export const columnsFor = (id: string): Column[] => LAYOUT_COLUMNS[id] ?? LAYOUT_COLUMNS['3.0'];

/** Board thickness, mm. 18mm is what these carcasses are actually made from,
 * and at this scale it is the difference between joinery and a cardboard box —
 * every shelf shows its edge. */
export const BOARD_MM = 18;
/** How far the rail sits below the top of a hanging section. */
export const RAIL_DROP_MM = 60;
export const RAIL_RADIUS_MM = 13;

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
