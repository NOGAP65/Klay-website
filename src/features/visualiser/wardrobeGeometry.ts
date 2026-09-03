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
  /** Open shelving. `count` is the number of COMPARTMENTS — the openings you
   * can put something in — not the number of shelf boards.
   *
   * That distinction was a real bug: six was read off the photograph as six
   * compartments and then used as six boards, which with the carcass's own top
   * and bottom cuts the column into SEVEN openings. The tower came out one
   * compartment taller than the product. Compartments are what anyone counts
   * when they look at a wardrobe, so compartments is what this means. */
  | { kind: 'shelves'; count: number }
  /** One long hanging rail near the top. Coats and dresses. */
  | { kind: 'hang' }
  /** Two rails, one above the other. Shirts and trousers — twice the capacity
   * in the same width, which is why every layout above 4.0 has one. */
  | { kind: 'hang2' }
  /** A tower: open shelving above a bank of drawers. `shelves` counts
   * COMPARTMENTS above the bank, for the same reason as above. */
  | { kind: 'drawers'; count: number; shelves: number };

/** THE MODULE WIDTH. Every drawer bank and every shelf tower in the Forma range
 * is this wide, and it does not change with the cabinet.
 *
 * THIS IS THE FACT THAT MAKES THE RANGE A RANGE. A wardrobe is not scaled up
 * and down like a picture — it is built out of standard parts. The tower is one
 * carcass, 507 wide, whether it goes in an 1800 or a 3000; what actually
 * changes between them is how much hanging bay there is either side of it.
 *
 * The first version had every column as a FRACTION of the total width, which
 * quietly said the opposite: it made a 3000's drawers two-thirds wider than an
 * 1800's, so a customer comparing two layouts saw two different products. Held
 * in millimetres, a drawer is a drawer. */
/** AN EXTERNAL DIMENSION, and the distinction is worth being explicit about
 * because getting it the other way round moves every boundary by 27mm.
 *
 * 507 is the module's OUTSIDE width — the carcass complete with its own side
 * panels, which is how a cabinetmaker quotes a module and how the spec's own
 * slice map reads it (the fixed segment runs from the cabinet's outer edge to
 * 507mm in, not from the inside face of the first board).
 *
 * So the opening you can actually put a shelf in is 507 less the board either
 * side of it, and that is what columnsFor resolves. Read as an internal width
 * instead, the tower comes out 534 external and every slice boundary drifts. */
export const MODULE_WIDTH_MM = 507;

export interface Column {
  /** A fixed 507mm module — a drawer bank or a shelf tower. Its width is the
   * same in every cabinet in the range. */
  fixed?: boolean;
  /** For a bay: its share of whatever width is left once the fixed modules
   * have taken theirs. Shares within a layout are relative, not absolute, so
   * two equal bays are 1 and 1 rather than 0.5 and 0.5. */
  share?: number;
  fill: ColumnFill;
}

/** A column once the cabinet's real width is known. */
export interface ResolvedColumn {
  widthMm: number;
  fill: ColumnFill;
}

/** THE INTERNAL ARRANGEMENTS, counted off the supplied product photographs.
 *
 * COUNTED, not estimated, and the difference matters: the first version of this
 * table was written from a glance at each render and six of the seven built-ins
 * were wrong. 3.0 was given one hanging bay when it has two side by side; 4.9
 * and 5.0 had their drawer banks in the wrong column and the wrong number; 6.0
 * was given a double-hang and a single when it is a shelf-and-drawer tower
 * beside a double-hang beside a full-height hang; 8.0 was given four drawers a
 * side when it has four in each of two towers with shelving above them. Each
 * was then checked against the photograph at a size where the drawers and
 * shelves could actually be counted.
 *
 * WHAT IS STILL EDITORIAL is the pitch — how far apart the shelves sit, how tall
 * a drawer is, where a rail hangs. Those come from a cabinetmaker's defaults
 * rather than a drawing, because the photographs do not carry dimensions. The
 * counts and the order are now what the product shows.
 *
 * This only drives the unskinned fallback. With a sticker projected onto the
 * carcass the real arrangement comes from the photograph itself — but the
 * geometry still has to agree with it, or the modelled dividers land in the
 * middle of a photographed hanging bay. */
export const LAYOUT_COLUMNS: Record<string, Column[]> = {
  // --- LINEN SHELVING ------------------------------------------------------
  // One bay of four shelves, the deck's "4 x 447mm Shelves". The face post on
  // the wider three is a front upright rather than a divider, so it does not
  // split the run into columns — it is drawn in buildCarcass, where it can sit
  // on the front edge instead of going the full depth.
  LIN01: [{ share: 1, fill: { kind: 'shelves', count: 4 } }],
  LIN02: [{ share: 1, fill: { kind: 'shelves', count: 4 } }],
  LIN05: [{ share: 1, fill: { kind: 'shelves', count: 4 } }],
  // BR IS A BROOM CUPBOARD, and it is the whole difference between this and
  // LIN05 — the two were built identically here because the deck's spec TABLE
  // describes them identically ("4 x 447mm Shelves Face Post", same four
  // widths). The elevation drawings on the same page do not: LIN05 is one run
  // of four shelves on two posts, and LINBR02 stops that run short and puts a
  // full-height open bay at the end with only the top shelf carried over it.
  // That bay is for brooms and a vacuum, which is what a linen cupboard has at
  // one end and what BR stands for.
  //
  // A count of 1 is one compartment and therefore no internal shelf boards —
  // the bay is open floor to head.
  LINBR02: [
    { share: 3, fill: { kind: 'shelves', count: 4 } },
    { share: 1, fill: { kind: 'shelves', count: 1 } },
  ],

  // --- THE BUILT-IN RANGE, BY PRODUCT CODE -------------------------------
  // Three SKUs at 2016mm, and their names say exactly what is in them.

  /** Divider Support + Double Hang Rail.
   *
   * TWO RAILS SIDE BY SIDE, NOT TWO STACKED, and that is what "Double Hang
   * Rail" means here. The Divider Support splits the run in two and each half
   * gets its own full-length rail — so the double is across the unit, not up
   * it. Built as hang2, every bay came out with a second rail halfway down and
   * the product had four.
   *
   * It is also the reading that makes the rest of the range consistent: the
   * tower SKUs are "Tower Divider Double Hang Rail", the same two bays with a
   * 507 module in front of them, and they are not four-rail cabinets either.
   *
   * No tower at all, which is why this is the one made as narrow as 1200 —
   * there is no 507mm module eating the width. */
  SRDH: [
    { share: 1, fill: { kind: 'hang' } },
    { share: 1, fill: { kind: 'hang' } },
  ],

  /** Shelf Tower + Divider + Double Hang Rail. The tower is the fixed module;
   * the double-hung bay and the long hang beside it take the rest. Matches
   * what 4.0's render shows, which is the artwork this SKU wears. */
  SRSTDH02: [
    { fixed: true, fill: { kind: 'shelves', count: 6 } },
    { share: 1.22, fill: { kind: 'hang2' } },
    { share: 1, fill: { kind: 'hang' } },
  ],

  /** Drawer Tower + Divider + Double Hang Rail. Same arrangement with a bank of
   * four drawers under the tower's shelving, as 6.0's render shows. */
  SRDTDH01: [
    // THREE OPENINGS ABOVE THE BANK, counted off 6.0's render — it was 2. The
    // tower is four drawers with three shelf compartments over them, and at 2
    // the openings came out half as tall again as the product's.
    { fixed: true, fill: { kind: 'drawers', count: 4, shelves: 3 } },
    { share: 1.4, fill: { kind: 'hang2' } },
    { share: 1, fill: { kind: 'hang' } },
  ],

  // A shelf tower on the left — six openings — beside one full-height hang.
  '2.9': [
    { fixed: true, fill: { kind: 'shelves', count: 5 } },
    { share: 1, fill: { kind: 'hang' } },
  ],
  // Shelf tower, then TWO hanging bays side by side with a divider between
  // them. The first version had one bay running the whole width.
  '3.0': [
    { fixed: true, fill: { kind: 'shelves', count: 6 } },
    { share: 1, fill: { kind: 'hang' } },
    { share: 1, fill: { kind: 'hang' } },
  ],
  // Shelf tower, a double-hang in the middle, one long hang on the right. The
  // double-hang is the wider of the two bays in the photograph.
  '4.0': [
    { fixed: true, fill: { kind: 'shelves', count: 6 } },
    { share: 1.22, fill: { kind: 'hang2' } },
    { share: 1, fill: { kind: 'hang' } },
  ],
  // Shelves OVER a four-drawer bank on the left, one hang on the right. The
  // drawers sit under the shelves in the same tower, which is why this is a
  // 'drawers' column rather than a shelf one.
  '4.9': [
    { fixed: true, fill: { kind: 'drawers', count: 4, shelves: 3 } },
    { share: 1, fill: { kind: 'hang' } },
  ],
  // Same tower with four drawers, then two hanging bays.
  '5.0': [
    { fixed: true, fill: { kind: 'drawers', count: 4, shelves: 3 } },
    { share: 1.1, fill: { kind: 'hang' } },
    { share: 1, fill: { kind: 'hang' } },
  ],
  // Shelf-and-drawer tower, a double-hang, then a full-height hang for long
  // coats and dresses.
  '6.0': [
    { fixed: true, fill: { kind: 'drawers', count: 4, shelves: 2 } },
    { share: 1.4, fill: { kind: 'hang2' } },
    { share: 1, fill: { kind: 'hang' } },
  ],
  // Symmetrical: a shelf-over-drawers tower at each end, one long hang between
  // them. Four drawers in each tower — and being fixed modules, both towers are
  // the same width by construction rather than by two matching fractions.
  '8.0': [
    { fixed: true, fill: { kind: 'drawers', count: 4, shelves: 3 } },
    { share: 1, fill: { kind: 'hang' } },
    { fixed: true, fill: { kind: 'drawers', count: 4, shelves: 3 } },
  ],
};

/** THE LAYOUT AT A REAL WIDTH: fixed modules take their 507, the bays divide
 * what is left.
 *
 * WHEN THERE IS NOT ENOUGH WIDTH the modules shrink together rather than the
 * bays going negative. A cabinet narrower than its own towers is not a cabinet
 * anyone makes, but a customer dragging a trace can ask for one, and a bay of
 * negative width puts dividers outside the carcass. Every column keeps a floor
 * of a third of a module so the layout stays legible while it is being dragged.
 */
/** WHICH ENDS OF THE RUN HAVE A BOARD ON THEM, and for most of the range the
 * answer is one of them.
 *
 * THESE ARE INTERNALS, NOT CABINETS. The deck files all three 2016mm SKUs under
 * "Internals" and describes them as Shelf & Rail systems — SRDH is "Shelf &
 * Rail - Divider Support Double Hang Rail", the other two are the same with a
 * Tower in front of it. They are fitted INTO an opening, so the customer's own
 * walls are the ends of the run and there is no panel standing against them.
 *
 * What does have sides is a TOWER. A shelf tower or a drawer bank is a real
 * carcass module, 507 wide complete with its own two side panels, and that is
 * the "fixed" column in the layout table. So the rule is not a new flag to keep
 * in step with anything: an end carries a panel exactly when a tower sits at
 * that end.
 *
 * Which gives, for the range as it stands:
 *
 *   Forma 1  (SRDH)      divider support only, no tower  ->  neither end
 *   Forma 2  (SRSTDH02)  shelf tower at the left         ->  left only
 *   Forma 3  (SRDTDH01)  drawer tower at the left        ->  left only
 *
 * Drawing both ends regardless was making every unit a free-standing box, which
 * is the wrong product: it put a white panel between the run and the wall it is
 * fixed to, and on Forma 1 — which is a rail, a shelf and a divider — it
 * invented a carcass the customer is not buying. */
/** HOW MANY FACE POSTS, which is not the same question as whether there is one.
 *
 * A face post is a front upright carrying the shelves at mid-span. It sits on
 * the FRONT edge rather than running the full depth — a full-depth board would
 * make two cupboards of what is meant to be one open run.
 *
 * Counted off the deck's own elevations rather than its spec table, because the
 * table cannot tell these apart: it calls LIN02, LIN05 and LINBR02 all "4 x
 * 447mm Shelves Face Post", singular, and the drawings show one, two and one.
 * LIN01 is made at 900 and 1200 only and spans without help.
 *
 * The count is what the width needs: a 3600 run on a single post is two 1800
 * spans, which is a shelf that dips. */
export const facePostsFor = (id: string): number =>
  id === 'LIN05' ? 2 : id === 'LIN02' || id === 'LINBR02' ? 1 : 0;

export function sidePanelsFor(
  id: string,
  /** True where the unit is built into an opening. See the note below. */
  recessed = true,
): { left: boolean; right: boolean } {
  const columns = LAYOUT_COLUMNS[id] ?? LAYOUT_COLUMNS.SRSTDH02;
  // OUT OF A RECESS IT IS A CABINET, and it needs both ends.
  //
  // Everything above describes a unit fitted INTO an opening, where the walls
  // are the ends of the run. Stand the same internals against a flat wall and
  // that is no longer true: there is nothing at either end, and a shelf running
  // to open air is not a product — it is a run of board with its edges showing.
  // So off a recess the unit gains a full side panel at each end and becomes
  // the free-standing carcass the alcove was doing the job of.
  //
  // This is the one thing the recess switch changes about the joinery, and it
  // is a real change: a customer ordering out of an alcove is buying two more
  // panels.
  if (!recessed) return { left: true, right: true };
  return {
    left: !!columns[0]?.fixed,
    right: !!columns[columns.length - 1]?.fixed,
  };
}

// hasHandlesFor lived here and is gone. It hid the hardware controls on layouts
// with no drawer, which was right while they asked about a drawer PULL — and
// wrong as soon as the question became the finish. Every model has visible
// metalwork: the hanging rails, which Forma 1 is almost entirely made of, and
// they come from the same range in the same finish as the pulls. So the finish
// is asked on all three and there is nothing to gate.

export function columnsFor(id: string, widthMm: number, recessed = true): ResolvedColumn[] {
  const columns = LAYOUT_COLUMNS[id] ?? LAYOUT_COLUMNS.SRSTDH02;
  const sides = sidePanelsFor(id, recessed);
  // Only the panels that exist come off the width — see sidePanelsFor. With
  // both subtracted unconditionally, a unit with no end panels lost 36mm of
  // opening to board that is not there, and every column inside it was drawn
  // narrow by its share of that.
  const endBoards = (sides.left ? BOARD_MM : 0) + (sides.right ? BOARD_MM : 0);
  const inner = Math.max(1, widthMm - endBoards - (columns.length - 1) * BOARD_MM);

  // How much board each column carries: the full outer panel at an end of the
  // run that HAS one, half a divider where it meets a neighbour. Subtracting
  // this from the module's external 507 gives the opening inside it.
  const flank = (i: number) =>
    (i === 0 ? (sides.left ? BOARD_MM : 0) : BOARD_MM / 2) +
    (i === columns.length - 1 ? (sides.right ? BOARD_MM : 0) : BOARD_MM / 2);

  const fixedIdx = columns.map((c, i) => (c.fixed ? i : -1)).filter(i => i >= 0);
  const shareTotal = columns.reduce((s, c) => s + (c.fixed ? 0 : c.share ?? 1), 0);
  const flexCount = columns.filter(c => !c.fixed).length;

  // The openings the fixed modules want, once their own board is taken off.
  const wantedInner = fixedIdx.reduce((s, i) => s + (MODULE_WIDTH_MM - flank(i)), 0);
  // A hanging bay narrower than this is not usable, so below it the modules are
  // the ones that give ground rather than the bays going to nothing.
  const minBayInner = flexCount * 300;

  const squeeze = wantedInner > 0 && wantedInner + minBayInner > inner
    ? Math.max(0.33, (inner - minBayInner) / wantedInner)
    : 1;

  const fixedInner = new Map<number, number>();
  for (const i of fixedIdx) fixedInner.set(i, (MODULE_WIDTH_MM - flank(i)) * squeeze);
  const fixedTotalInner = [...fixedInner.values()].reduce((s, v) => s + v, 0);
  const leftover = Math.max(0, inner - fixedTotalInner);

  return columns.map((c, i) => ({
    widthMm: c.fixed
      ? fixedInner.get(i)!
      : shareTotal > 0
        ? (leftover * (c.share ?? 1)) / shareTotal
        : 0,
    fill: c.fill,
  }));
}

/** Board thickness, mm. 18mm is what these carcasses are actually made from,
 * and at this scale it is the difference between joinery and a cardboard box —
 * every shelf shows its edge. */
export const BOARD_MM = 18;
/** How far the rail sits below the shelf it hangs from.
 *
 * 110, up from 60, and the old number was what made Forma 1 look like it had
 * two boards at the top and two at the middle. A rail is 26mm through and the
 * shelf above it is 18: at a 60mm drop there are 16mm of daylight between them,
 * which on screen is under a pixel — so the shelf and the rail merged into one
 * thick doubled bar, and the layout that is mostly rails was the one it ruined.
 *
 * 110 is also just where a rail goes. It has to clear a hanger's hook and the
 * shoulder of what is on it, which is why no joiner fixes one an inch under a
 * shelf. The gap now reads as the gap it is. */
export const RAIL_DROP_MM = 110;
export const RAIL_RADIUS_MM = 13;

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
