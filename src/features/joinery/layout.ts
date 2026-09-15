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
/** Number of shelving dividers. Each divider now spans the full shelf depth, as specified for the current range. */
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