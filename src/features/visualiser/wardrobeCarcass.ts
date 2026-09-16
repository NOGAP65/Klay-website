import { wardrobeModelById, wardrobeHeight, wardrobeDepth } from '@/features/joinery';
import { DEFAULT_HANDLE_FINISH, hardwareSpec, type HardwareSpec } from '@/features/joinery';

import { createWalkInCarcass } from './walkInCarcass';
import { columnsFor, sidePanelsFor, facePostsFor, BOARD_MM, RAIL_DROP_MM } from './wardrobeGeometry';

export interface Box {
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  /** Multiplies the board colour. Lets the back panel and the drawer fronts sit
   * at their own value without needing a second material. */
  tone?: number;
  /** Overrides the board colour outright — the hanging rails. */
  colour?: [number, number, number];
  /** Brushed metal: shaded along its length rather than filled flat, because a
   * flat grey rectangle reads as painted plastic. */
  metal?: boolean;
  /** STRUCTURAL BOARD — a divider, a shelf, the back panel. Never skinned.
   *
   * The projection maps a point's own (x, y) into the photograph, which is
   * right for the outer frame because the frame is where the photograph's frame
   * is. It is wrong for everything INSIDE, because the modelled interior and
   * the photographed interior are not the same interior: the model puts a
   * divider where the layout says, the photograph has one where the cabinet
   * that was shot had one, and the hanging bays between them stretch. So a
   * modelled divider samples whatever the stretched picture happens to put at
   * its x — which is garments, drawn across the divider.
   *
   * And the cost of not skinning it is nothing, because the board is board: on
   * the white finish it is white either way, and what makes the interior look
   * real is the contents, which are their own cut-outs standing in front of it.
   */
  plain?: boolean;
  /** THE BACK PANEL, and it is called out because it is the one face the
   * photograph must NOT be projected onto.
   *
   * Everything hanging in the cabinet — the rail, the hangers, the coats — is
   * in front of this panel, so a projection along the view axis lands all of it
   * here. Skin the back panel and the picture's own rail and clothes get
   * painted flat onto it, behind the modelled rail and the upright content
   * planes: two rails, two sets of coats, one of each in the wrong place. That
   * is the exact failure the old renderer hit when it mapped the whole
   * elevation onto the frame.
   *
   * Left as plain board, it becomes what it should be — the surface BEHIND the
   * clothes — and the contents stand in front of it at their own depth. */
  back?: boolean;
}

export interface Compartment {
  x0: number; y0: number; x1: number; y1: number;
  /** What belongs in it. The layout knows this — a bay under a rail takes
   * hanging clothes, a shelf opening takes a stack or a box — so the renderer
   * does not have to guess from the geometry. */
  role: 'shelf' | 'hang-long' | 'hang-short' | 'floor' | 'bay';
}

export function buildCarcass(
  layoutId: string,
  widthMm: number,
  /** The pull's profile and colour. Defaulted so the two callers that do not
   * care — and any test — need not know the hardware range exists. */
  hardware: HardwareSpec = hardwareSpec(DEFAULT_HANDLE_FINISH),
  /** Built into an opening, or standing against a flat wall. Decides whether
   * the run has end panels — see sidePanelsFor. */
  recessed = true,
): { boxes: Box[]; compartments: Compartment[] } {
  // THE MODEL'S OWN HEIGHT AND DEPTH, not the robe range's constants.
  //
  // The three robes are 2016 x 500 and the linen shelving is 1650 x 447 — a
  // different product in the same catalogue, and the one thing here that cannot
  // read the range constant. Asked through the helpers so no call site has to
  // know which family it is holding.
  const model = wardrobeModelById(layoutId);
  if (model.kind === 'walk-in') return createWalkInCarcass(model.id, hardware);
  const D = wardrobeDepth(model);
  const H = wardrobeHeight(model);
  const boxes: Box[] = [];
  const compartments: Compartment[] = [];

  // Shell: back, two sides, top, bottom.
  // The back panel sits a little down in value. Nothing lights the inside of a
  // cupboard, and at the same tone as the front frame the box has no inside —
  // which is what made the first render read as a white slab on the wall. It is
  // the largest surface in the opening, though, so it sets the colour of the
  // whole thing: too dark and a white wardrobe reads grey, which is what 0.66
  // did.
  // THERE IS NO BACK PANEL. The Forma range is built IN — fixed to the wall,
  // with the customer's own wall as the back of every compartment. A modelled
  // back panel was a whole surface the product does not have, and it was doing
  // real damage: it filled every opening with white board, which is why the
  // interior read as flat whatever the shading did, and it hid the one thing
  // the room view is for, which is the customer's own wall showing through.
  //
  // Taking it out is also what lets the wall's own tone and shadow do the work
  // that the ambient pass was approximating.
  // THE SHELL IS PLAIN BOARD, never skinned — same rule as the dividers and
  // shelves, and for the same reason plus one more.
  //
  // The projection samples a face by its own (x, y), so the top rail samples
  // the very top of the recorded carcass and the bottom rail the very bottom.
  // Those are the two places a staged photograph is least like a rail: above
  // the cabinet is baskets and empty space, below it is shoes, a bag and floor
  // shadow. Measured on 6.0's render, the bottom band is about a third board.
  //
  // Skinned, the rails came out as gaps you could see the room through. They
  // are board on the product and they are board here.
  //
  // AND ONLY THE ENDS THAT HAVE ONE. These are internals fitted into an
  // opening, so the walls are the ends of the run — a panel is drawn at an end
  // only where a tower sits there. See sidePanelsFor.
  const sides = sidePanelsFor(layoutId, recessed);
  if (sides.left) boxes.push({ x: 0, y: 0, z: 0, w: BOARD_MM, h: H, d: D, plain: true });
  if (sides.right) boxes.push({ x: widthMm - BOARD_MM, y: 0, z: 0, w: BOARD_MM, h: H, d: D, plain: true });
  // AND NO BASE AT ALL. This is the correction that matters most, and the
  // supplied renders are unambiguous about it: 3.0 and 6.0 both show a run that
  // is WALL-HUNG — a shelf across the top, rails under it, and open floor
  // beneath, with the tower the only part that reaches the ground. There is no
  // board running along the bottom of the unit and there never was.
  //
  // Drawing one made every layout a box: a full-width plank at floor level
  // closing the picture, which is what a free-standing wardrobe has and what a
  // built-in shelf-and-rail system does not. The tower supplies its own base
  // where there is a tower; everything else stops at the rail.
  //
  // The top of the run is the full-width shelf below, not a carcass top — see
  // the note there.

  // The usable width is columnsFor's business now that columns are resolved in
  // millimetres rather than as fractions of it.
  // THE TOP SHELF RUNS THE WHOLE WIDTH, and it is the top of the product.
  //
  // Read straight off the supplied renders: one continuous shelf across the
  // full opening with everything hanging below it, and boxes and baskets stood
  // ON it. Every column used to cap itself at its own height, so a run came out
  // as two or three separate cupboards standing side by side instead of one
  // robe under one shelf.
  //
  // It sits at the very top of the 2016 — it IS the carcass top — so the run
  // reads from the shelf down.
  const shellInnerH = H - BOARD_MM;
  const topShelfY = H - BOARD_MM;
  const innerH = shellInnerH;
  void topShelfY;
  const y0 = 0;
  // Starts at the wall where there is no panel to start after.
  let x = sides.left ? BOARD_MM : 0;

  const shelf = (cx: number, cw: number, y: number) =>
    boxes.push({ x: cx, y, z: BOARD_MM, w: cw, h: BOARD_MM, d: D - BOARD_MM, plain: true });

  const rail = (cx: number, cw: number, y: number) =>
    boxes.push({
      x: cx, y, z: D * 0.42,
      w: cw, h: 26, d: 26,
      // THE RAIL TAKES THE HANDLE'S FINISH TOO. It is the other piece of
      // visible metalwork in the cabinet, it is bought from the same range, and
      // a brushed-gold pull over a nickel rail is not a robe anybody sells.
      colour: hardware.rgb,
      metal: true,
    });

  /** ONE DRAWER'S PULL, in whichever profile was chosen.
   *
   * `fy` is the front's bottom edge and `fh` its height, so each profile can
   * place itself against the front rather than against the drawer opening —
   * an edge pull belongs on the top lip and a knob in the middle, and those are
   * different distances from different edges.
   *
   * Everything here stands at z = D, which is the face of the front: a pull is
   * the one part of a wardrobe that is deliberately in front of the plane
   * everything else stops at. */
  const drawPull = (cx: number, fy: number, cw: number, fh: number) => {
    const metal = (b: Omit<Box, 'colour' | 'metal'>) =>
      boxes.push({ ...b, colour: hardware.rgb, metal: true });

    // A SLIM BAR, CENTRED ON THE FRONT. 6.0's render has exactly this: a long
    // thin rail across the middle of each drawer, not a chunky pull set low.
    // It was 22 tall at 0.72 of the front, which sat it near the bottom edge
    // and gave the bank a ladder of heavy rungs.
    //
    // SHALLOW, and that is a rendering fix as much as a modelling one. At 18
    // deep against 14 tall the pull's own TOP face was wider than its front,
    // and being polished metal it caught the wall's reflection as a second
    // bright band above the bar — every drawer looked like it had two handles.
    // Verified against the box list: there is one pull per drawer and always
    // was, so the doubling was specular rather than geometric. A 10mm return
    // has almost no top face to light.
    const hw = Math.min(cw * 0.46, 340);
    metal({ x: cx + (cw - hw) / 2, y: fy + fh * 0.5 - 7, z: D, w: hw, h: 14, d: 10 });
  };

  // RESOLVED BEFORE ANYTHING IS DRAWN. The face posts need column 0's width and
  // the loop below needs the same list; calling twice invites them to disagree.
  const columns = columnsFor(layoutId, widthMm, recessed);
  // Shelving is a real carcass, so a divider in it is a full-height board —
  // LINBR02's broom bay is closed off from the shelf run rather than sharing an
  // open span with it.
  const towered = model.kind === 'shelving'
    || columns.some(c => c.fill.kind !== 'hang' && c.fill.kind !== 'hang2');

  // The full-width shelf, spanning between whatever end panels exist.
  {
    const sx = sides.left ? BOARD_MM : 0;
    const sw = widthMm - sx - (sides.right ? BOARD_MM : 0);
    shelf(sx, sw, H - BOARD_MM);

    // AND SHELVING STANDS ON THE FLOOR. The robes are wall-hung — that is the
    // correction the supplied renders forced — but linen shelving is a unit
    // with a bottom shelf you put a basket on, and the deck's own photograph
    // shows it closed at the base. Only this family gets one.
    if (model.kind === 'shelving') shelf(sx, sw, 0);

    // THE FACE POSTS — one on LIN02 and LINBR02, two on LIN05, none on LIN01.
    // See facePostsFor.
    //
    // They stand in the SHELF RUN, which on LINBR02 is only the first column:
    // the broom bay beyond it is a single open compartment and has nothing to
    // hold up. Evenly spaced across whatever that run is, so a 3600 on two
    // posts is three 1200 spans rather than two 1800s.
    const posts = facePostsFor(layoutId);
    const runW = posts > 0 ? columns[0].widthMm : 0;
    for (let i = 1; i <= posts; i++) {
      boxes.push({
        // A full-depth divider runs from the floor to the underside of the top shelf.
        x: sx + (runW / (posts + 1)) * i - BOARD_MM / 2, y: 0, z: BOARD_MM,
        w: BOARD_MM, h: H - BOARD_MM, d: D - BOARD_MM,
        plain: true,
      });
    }
  }

  // WHAT HOLDS THE RUN UP WHERE THERE IS NO TOWER.
  //
  // "SRDH — Shelf & Rail-Divider Support Double Hang Rail". The Divider Support
  // is not a full-height panel: in 3.0's render it is a short fin dropping from
  // the underside of the shelf at mid-span, carrying the shelf and joining the
  // two lengths of rail. Forma 1 was being drawn with a floor-to-ceiling board
  // down its middle, which is a carcass divider from a different product and
  // cut the run into two cupboards.
  //
  // Tower layouts keep their real dividers — a tower has a carcass side, and
  // the board between it and the next bay is that side.
  // Resolved in millimetres, not as fractions of the cabinet: a drawer tower is
  // 507 wide in every layout in the range, and only the bays either side of it
  // take up the slack. See MODULE_WIDTH_MM.
  columns.forEach((column, i) => {
    const cw = column.widthMm;
    if (i < columns.length - 1) {
      // A full divider between real carcasses; a support fin under the shelf
      // otherwise — see the note on the Divider Support above.
      const finH = Math.min(innerH, 420);
      boxes.push(towered
        ? { x: x + cw, y: y0, z: 0, w: BOARD_MM, h: innerH, d: D, plain: true }
        : { x: x + cw, y: H - BOARD_MM - finH, z: 0, w: BOARD_MM, h: finH, d: D, plain: true });
    }

    const fill = column.fill;
    if (fill.kind === 'shelves') {
      // count COMPARTMENTS needs count-1 boards: the carcass's own top and
      // bottom close the first and last openings.
      for (let s = 1; s < fill.count; s++) shelf(x, cw, y0 + (innerH / fill.count) * s);
      for (let s = 0; s < fill.count; s++) {
        compartments.push({
          x0: x, x1: x + cw,
          y0: y0 + (innerH / fill.count) * s,
          y1: y0 + (innerH / fill.count) * (s + 1),
          // The lowest opening in a tower gets the shoes, which is where shoes
          // actually go.
          role: s === 0 ? 'floor' : 'shelf',
        });
      }
    } else if (fill.kind === 'hang') {
      // ONE LONG RAIL, HUNG FROM THE FULL-WIDTH SHELF. No shelf of its own —
      // that was a second board an inch under the first.
      const railY = H - BOARD_MM - RAIL_DROP_MM;
      rail(x, cw, railY);
      compartments.push({ x0: x, x1: x + cw, y0: railY, y1: railY, role: 'hang-long' });
      // THE OPEN BAY ITSELF, recorded so it can be shaded. A hanging
      // compartment is filed at its RAIL with no height, because that is all
      // the contents need — but it leaves the biggest opening in the cabinet
      // with nothing describing it, so the ambient pass skipped it and the bay
      // came out as flat lit board.
      compartments.push({ x0: x, x1: x + cw, y0, y1: railY, role: 'bay' });
    } else if (fill.kind === 'hang2') {
      // DOUBLE HANG: a rail under the shelf and a second one halfway down.
      //
      // The mid board between them is a shelf only where there is a carcass to
      // carry it — 6.0's middle bay has one because it is between a tower side
      // and a divider. On Forma 1, which has neither, the lower rail hangs on
      // drop brackets off the upper and there is no board at all, which is what
      // "Divider Support Double Hang Rail" describes and what makes that
      // product the simple one it is.
      const upper = H - BOARD_MM;
      const mid = y0 + innerH * 0.5;
      if (towered) shelf(x, cw, mid);
      rail(x, cw, upper - RAIL_DROP_MM);
      rail(x, cw, mid - RAIL_DROP_MM);
      // Two rails, so two runs of short hanging, and the shelf above the top
      // one. A hanging compartment is recorded at its RAIL — the clothes hang
      // from it, so its own height is the asset's business, not the opening's.
      compartments.push({ x0: x, x1: x + cw, y0: mid - RAIL_DROP_MM, y1: mid - RAIL_DROP_MM, role: 'hang-short' });
      compartments.push({ x0: x, x1: x + cw, y0: upper - RAIL_DROP_MM, y1: upper - RAIL_DROP_MM, role: 'hang-short' });
      // The two open bays under those rails — see the note on 'bay' above.
      compartments.push({ x0: x, x1: x + cw, y0, y1: mid - RAIL_DROP_MM, role: 'bay' });
      // THE TWO BAYS HAVE TO MEET, and this is the "extra bar below the rail".
      //
      // The upper bay started at mid + BOARD_MM, which is the top face of the
      // mid SHELF — right when every double hang had one. Forma 1 does not: it
      // is a divider support and two rails, so there is no board at mid, and
      // the shade left a 128mm strip between the lower bay's top (the mid rail)
      // and the upper bay's bottom completely unshaded. A bright band across
      // the full width, sitting just under the rail, reading as a second rail.
      //
      // Measured rather than guessed: the box dump shows four rail segments at
      // exactly two heights, 889 and 1888, so the rails were never doubled —
      // it was the shade underneath them.
      compartments.push({
        x0: x, x1: x + cw,
        y0: towered ? mid + BOARD_MM : mid - RAIL_DROP_MM,
        y1: upper - RAIL_DROP_MM,
        role: 'bay',
      });
    } else {
      // A TOWER, not a rail over drawers. The bank fills the lower half and
      // open shelving stacks above it, which is what every one of these towers
      // is in the photographs.
      // The tower runs from the floor to the underside of the full-width
      // shelf, which is the one column that reaches the ground.
      const bankH = innerH * 0.46;
      const dh = bankH / fill.count;
      for (let d = 0; d < fill.count; d++) {
        const fy = y0 + d * dh + 4;
        // Fronts stand proud of the carcass, which is what casts the shadow
        // line between one drawer and the next.
        boxes.push({
          x: x + 4, y: fy, z: D - BOARD_MM,
          w: cw - 8, h: dh - 8, d: BOARD_MM,
          tone: 1.02,
        });
        // THE HANDLE. A drawer without one reads as a blank panel, and a bank of
        // blank panels reads as a fridge. It is the one detail at this scale
        // that says "this opens" — which is most of what a drawer has to say.
        // Standing proud of the front by its own depth, so it catches the light
        // on top and casts a line underneath.
        //
        // FIVE PROFILES, and they are genuinely different objects rather than
        // one bar at three sizes — see wardrobeHardware. The shape is most of
        // what distinguishes two otherwise identical robes, so a picker that
        // changed only the colour would be answering half the question.
        drawPull(x, fy, cw, dh - 8);
      }
      shelf(x, cw, y0 + bankH);
      const above = innerH - bankH;
      for (let sh = 1; sh < fill.shelves; sh++) {
        shelf(x, cw, y0 + bankH + (above / fill.shelves) * sh);
      }
      for (let sh = 0; sh < fill.shelves; sh++) {
        compartments.push({
          x0: x, x1: x + cw,
          y0: y0 + bankH + (above / fill.shelves) * sh,
          y1: y0 + bankH + (above / fill.shelves) * (sh + 1),
          role: 'shelf',
        });
      }
    }

    x += cw + BOARD_MM;
  });

  // Interior shelves meet the dividers instead of passing through them.
  // Cutting each run at the panel also avoids overlapping front faces at an angle.
  if (model.kind === 'shelving' && facePostsFor(layoutId) > 0) {
    const dividers = boxes.filter(b => b.w === BOARD_MM && b.y === 0 && b.h === H - BOARD_MM && b.d === D - BOARD_MM);
    for (let i = boxes.length - 1; i >= 0; i--) {
      const board = boxes[i];
      if (board.h !== BOARD_MM || board.y >= H - BOARD_MM || board.w <= BOARD_MM) continue;
      let spans = [board];
      for (const panel of dividers) spans = spans.flatMap(b => {
        if (panel.x >= b.x + b.w || panel.x + panel.w <= b.x) return [b];
        const pieces: Box[] = [];
        if (panel.x > b.x) pieces.push({ ...b, w: panel.x - b.x });
        if (panel.x + panel.w < b.x + b.w) pieces.push({ ...b, x: panel.x + panel.w, w: b.x + b.w - panel.x - panel.w });
        return pieces;
      });
      boxes.splice(i, 1, ...spans);
    }
  }

  // THE TRACE IS THE FRONT OF THE WARDROBE, not its back.
  //
  // Everything above is laid out with the back panel at z = 0 and the opening
  // at z = D, which is the natural way to describe a cabinet. But the plane the
  // customer traced is the plane the projector puts z = 0 on, and if that is
  // the back then the whole carcass projects FORWARD out of the outline — the
  // front face, the one thing that has to land on the trace, ends up outside it
  // and clipped away. Which is what happened: the hanging section lost its
  // right-hand end to the clip and read as half empty.
  //
  // Shifting the model back by its own depth puts the opening on z = 0 and the
  // back panel at z = -D, so the front lands exactly on the traced quad and
  // everything else recedes behind it — which is also just what looking into an
  // open wardrobe is.
  for (const box of boxes) box.z -= D;

  return { boxes, compartments };
}
