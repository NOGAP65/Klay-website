// ---------------------------------------------------------------------------
// THE WARDROBE RENDERER.
//
// BUILT-INS ARE MODELLED, NOT PHOTOGRAPHED. The carcass is built in
// millimetres — 2016 high, 447 deep, the layout's own width — and projected
// onto the wall the customer traced. Trace a square-on wall and it comes out
// square on; trace a wall running away to one side and the side return
// foreshortens, the shelf fronts converge and the rails run to the same
// vanishing point as the room, because the geometry is doing it rather than an
// image being stretched into place.
//
// Same idea as the blind and the curtain — solve in the product's own space,
// put it back on the traced quad — with the one difference that a wardrobe has
// depth, so a flat homography is not enough on its own. See projectorFromQuad.
//
// WHY NOT THE SUPPLIED PHOTOGRAPHS. Each carries one viewpoint, and the ten did
// not agree: some front on, some three-quarter, some looking into a corner. A
// photograph cannot be turned to face a different way afterwards, because the
// faces the camera never saw are not in the file. Modelling removes the
// question — there is no baked viewpoint left to disagree with the room. It
// also ends the keying, since there is no background to cut away.
//
// DRAWN IN 2D, and deliberately. The carcass is a few dozen boxes, which is a
// few hundred flat quads — far below the point where a GPU earns its
// complication, and this way the projection can be the exact one the wall needs
// rather than whatever a perspective camera can be talked into. Faces are
// sorted back to front and filled, which is all the depth ordering a convex
// open box requires.
//
// WALK-INS ARE STILL ARTWORK. 7.0L, 9.0L and 12.0U are rooms rather than
// objects — those renders look INTO the robe at two or three walls receding
// away. Modelling one would mean modelling a room; the honest placement is a
// view through the trace.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import { wardrobeArtwork, wardrobeModelById, wardrobeColourHex, WARDROBE_HEIGHT_MM, WARDROBE_DEPTH_MM, type WardrobeArtwork } from './wardrobes';
import { projectorFromQuad, columnsFor, BOARD_MM, RAIL_DROP_MM, type Projector } from './wardrobeGeometry';
import type { Point } from './homography';

export interface WardrobeRendererProps {
  photoUrl: string;
  /** The traced quad in photo pixels, TL TR BR BL. */
  corners: [number, number][];
  modelId: string;
  colourName: string;
}

export default function Canvas2DWardrobeRenderer({
  photoUrl,
  corners,
  modelId,
  colourName,
}: WardrobeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const photo = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = photoUrl;
      });
      if (cancelled) return;

      canvas.width = photo.naturalWidth;
      canvas.height = photo.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(photo, 0, 0);

      const model = wardrobeModelById(modelId);

      if (model.kind === 'walk-in') {
        const art = await wardrobeArtwork(model, colourName, 'interior');
        if (cancelled) return;
        drawWalkIn(ctx, art.image, art.width, art.height, corners);
        return;
      }

      // THE STICKER GOES INSIDE THE MODELLED BOX. The geometry gets the
      // opening's perspective and the reveal right — that is what no
      // photograph can do — and the photograph gets the interior right, which
      // is what no reasonable amount of modelling can: real shelves, real
      // clothes, real shadow between them. Neither is good enough alone and
      // together they are most of the way to a render.
      const art = await wardrobeArtwork(model, colourName, 'front');
      if (cancelled) return;
      drawBuiltIn(ctx, corners, model.id, model.widths[0], colourName, canvas.width, canvas.height, art);
    };

    render().catch(() => {
      /* photo or artwork failed — leave the previous frame in place */
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl, modelId, colourName, JSON.stringify(corners)]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />;
}

// --- Built-in: the modelled carcass ----------------------------------------

/** One axis-aligned box in model millimetres, plus how its faces are shaded. */
interface Box {
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  /** Multiplies the board colour. Lets the back panel and the drawer fronts sit
   * at their own value without needing a second material. */
  tone?: number;
  /** Overrides the board colour outright — the hanging rails. */
  colour?: [number, number, number];
}

/** FACE SHADING, fixed per orientation rather than lit.
 *
 * A room photograph already carries its own light, and a second one from a
 * different direction is what makes a composite read as pasted on. These are
 * the values a matt white board actually shows in a room: the front edge
 * catches most, an upward face next, the two side faces fall away, and the
 * inside of the box is in its own shade because nothing lights the inside of a
 * cupboard. It reads as depth without claiming to know where the sun is. */
const FACE_TONE = {
  front: 1.0,
  top: 0.94,
  bottom: 0.62,
  left: 0.80,
  right: 0.72,
  back: 0.58,
};

const CORNERS_OF_FACE: Record<keyof typeof FACE_TONE, [number, number, number][]> = {
  // Each as unit offsets within the box: [x, y, z] each 0 or 1.
  front: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
  back: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
  left: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]],
  right: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
  top: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
  bottom: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
};

function drawBuiltIn(
  ctx: CanvasRenderingContext2D,
  corners: Point[],
  layoutId: string,
  widthMm: number,
  colourName: string,
  imageW: number,
  imageH: number,
  art: WardrobeArtwork | null,
) {
  const projector = projectorFromQuad(corners, widthMm, WARDROBE_HEIGHT_MM, imageW, imageH);
  if (!projector) return;

  const base = hexToRgb(wardrobeColourHex(colourName));
  // With a photograph going into the opening there is nothing for the modelled
  // shelves, rails and garments to do but show through its edges. Without one
  // they are all there is, so the fallback still builds them.
  const boxes = buildCarcass(layoutId, widthMm, !art);

  // Every face of every box, sorted back to front. A painter's sort is enough
  // here: the carcass is a set of boxes that do not interpenetrate, so no two
  // faces can need splitting.
  type Face = { pts: [number, number][]; depth: number; fill: string };
  const faces: Face[] = [];

  for (const box of boxes) {
    const rgb = box.colour ?? base;
    for (const name of Object.keys(FACE_TONE) as (keyof typeof FACE_TONE)[]) {
      const unit = CORNERS_OF_FACE[name];
      const pts: [number, number][] = [];
      let depthSum = 0;
      for (const [ux, uy, uz] of unit) {
        const X = box.x + ux * box.w;
        const Y = box.y + uy * box.h;
        const Z = box.z + uz * box.d;
        pts.push(projector.project(X, Y, Z));
        depthSum += projector.depth(X, Y, Z);
      }
      const tone = FACE_TONE[name] * (box.tone ?? 1);
      faces.push({
        pts,
        depth: depthSum / 4,
        fill: `rgb(${clamp255(rgb[0] * tone)},${clamp255(rgb[1] * tone)},${clamp255(rgb[2] * tone)})`,
      });
    }
  }

  // Larger depth is further away, so those go down first.
  faces.sort((a, b) => b.depth - a.depth);

  ctx.save();
  // Clipped to the traced opening. A wardrobe drawn past the wall it was traced
  // on is the one error that cannot be explained away, and the carcass overruns
  // by design — the side returns project forward, out of the plane.
  ctx.beginPath();
  ctx.moveTo(corners[0][0], corners[0][1]);
  for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i][0], corners[i][1]);
  ctx.closePath();
  ctx.clip();

  for (const face of faces) {
    ctx.beginPath();
    ctx.moveTo(face.pts[0][0], face.pts[0][1]);
    for (let i = 1; i < face.pts.length; i++) ctx.lineTo(face.pts[i][0], face.pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = face.fill;
    ctx.fill();
    // A hairline of the same colour over the fill closes the seams that
    // anti-aliasing opens between two quads meeting edge to edge.
    ctx.strokeStyle = face.fill;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  // The photograph, set into the reveal. Inset by the board so it sits inside
  // the carcass's own frame rather than over it, and at z = 0 because that is
  // the plane the customer traced and the plane the opening is on.
  if (art) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i][0], corners[i][1]);
    ctx.closePath();
    ctx.clip();
    drawProjectedImage(
      ctx,
      art.image,
      art.width,
      art.height,
      projector,
      BOARD_MM,
      BOARD_MM,
      widthMm - BOARD_MM,
      WARDROBE_HEIGHT_MM - BOARD_MM,
      0,
    );
    ctx.restore();
  }

  drawContactShadow(ctx, projector, widthMm);
}

/** The carcass as a list of boxes, in millimetres, with the opening's
 * bottom-left at the origin: X right along the wall, Y up, Z out of the wall
 * toward the room.
 *
 * OPEN-FRONTED, which is what the Forma range is — every supplied photograph
 * shows shelves and hanging with no doors on. That is also what makes the
 * modelling worth doing: with an open front you see straight into the carcass,
 * so the side returns, the shelf edges and the back panel are all on show, and
 * those receding surfaces are what tell the eye how deep it is. */
function buildCarcass(layoutId: string, widthMm: number, includeInterior: boolean): Box[] {
  const D = WARDROBE_DEPTH_MM;
  const H = WARDROBE_HEIGHT_MM;
  const boxes: Box[] = [];

  // Shell: back, two sides, top, bottom.
  // The back panel sits a little down in value. Nothing lights the inside of a
  // cupboard, and at the same tone as the front frame the box has no inside —
  // which is what made the first render read as a white slab on the wall. It is
  // the largest surface in the opening, though, so it sets the colour of the
  // whole thing: too dark and a white wardrobe reads grey, which is what 0.66
  // did.
  boxes.push({ x: 0, y: 0, z: 0, w: widthMm, h: H, d: BOARD_MM, tone: 0.82 });
  boxes.push({ x: 0, y: 0, z: 0, w: BOARD_MM, h: H, d: D });
  boxes.push({ x: widthMm - BOARD_MM, y: 0, z: 0, w: BOARD_MM, h: H, d: D });
  boxes.push({ x: 0, y: H - BOARD_MM, z: 0, w: widthMm, h: BOARD_MM, d: D });
  boxes.push({ x: 0, y: 0, z: 0, w: widthMm, h: BOARD_MM, d: D });

  const inner = widthMm - 2 * BOARD_MM;
  const innerH = H - 2 * BOARD_MM;
  const y0 = BOARD_MM;
  let x = BOARD_MM;

  const shelf = (cx: number, cw: number, y: number) =>
    boxes.push({ x: cx, y, z: BOARD_MM, w: cw, h: BOARD_MM, d: D - BOARD_MM });

  const rail = (cx: number, cw: number, y: number) =>
    boxes.push({
      x: cx, y, z: D * 0.42,
      w: cw, h: 26, d: 26,
      colour: [185, 188, 192],
    });

  /** WHAT HANGS ON THE RAIL, and it is there for a reason rather than for
   * decoration. An empty modelled carcass is a set of white boxes inside a
   * white box: truthful, and almost impossible to read, because every surface
   * takes nearly the same tone and the depth cues cancel out. Something dark
   * hanging in the opening is what gives the eye a back to the box and a scale
   * for the shelf above it — which is exactly why every supplied photograph is
   * staged with clothes in it.
   *
   * Deliberately coarse: blocks of muted colour at the pitch of hanging
   * garments, not modelled clothing. At the size this renders, a block reads as
   * a row of coats and anything more detailed reads as noise. */
  const garments = (cx: number, cw: number, railY: number, dropMm: number) => {
    const PITCH = 110;
    const count = Math.max(3, Math.floor(cw / PITCH));
    const gw = (cw - 20) / count;
    for (let i = 0; i < count; i++) {
      const tone = GARMENT_TONES[i % GARMENT_TONES.length];
      // Lengths vary a little, the way a rail of real clothes does — a dead
      // level hem is the one thing that gives away a repeated block.
      const drop = dropMm * (0.86 + ((i * 37) % 100) / 100 * 0.14);
      boxes.push({
        x: cx + 12 + i * gw, y: railY - drop, z: D * 0.30,
        w: gw * 0.97, h: drop, d: 150,
        colour: tone,
      });
    }
  };

  if (!includeInterior) {
    for (const box of boxes) box.z -= WARDROBE_DEPTH_MM;
    return boxes;
  }

  const columns = columnsFor(layoutId);
  columns.forEach((column, i) => {
    const cw = inner * column.width;
    if (i < columns.length - 1) {
      boxes.push({ x: x + cw, y: y0, z: 0, w: BOARD_MM, h: innerH, d: D });
    }

    const fill = column.fill;
    if (fill.kind === 'shelves') {
      for (let s = 1; s <= fill.count; s++) shelf(x, cw, y0 + (innerH / (fill.count + 1)) * s);
    } else if (fill.kind === 'hang') {
      const shelfY = y0 + innerH * 0.82;
      shelf(x, cw, shelfY);
      const railY = shelfY - RAIL_DROP_MM;
      garments(x, cw, railY, innerH * 0.56);
      rail(x, cw, railY);
    } else if (fill.kind === 'hang2') {
      const upper = y0 + innerH * 0.86;
      const mid = y0 + innerH * 0.46;
      shelf(x, cw, upper);
      shelf(x, cw, mid);
      garments(x, cw, upper - RAIL_DROP_MM, innerH * 0.34);
      garments(x, cw, mid - RAIL_DROP_MM, innerH * 0.34);
      rail(x, cw, upper - RAIL_DROP_MM);
      rail(x, cw, mid - RAIL_DROP_MM);
    } else {
      const bankH = innerH * 0.52;
      const dh = bankH / fill.count;
      for (let d = 0; d < fill.count; d++) {
        // Fronts stand proud of the carcass, which is what casts the shadow
        // line between one drawer and the next.
        boxes.push({
          x: x + 4, y: y0 + d * dh + 4, z: D - BOARD_MM,
          w: cw - 8, h: dh - 8, d: BOARD_MM,
          tone: 1.02,
        });
      }
      shelf(x, cw, y0 + bankH);
      const railY = y0 + innerH - RAIL_DROP_MM;
      garments(x, cw, railY, innerH * 0.38);
      rail(x, cw, railY);
    }

    x += cw + BOARD_MM;
  });

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
  for (const box of boxes) box.z -= WARDROBE_DEPTH_MM;

  return boxes;
}

/** The darkening where the carcass meets the floor. Without it the unit reads
 * as hovering however well it is placed — the eye takes the shade at an
 * object's base as the proof that it is standing on something. Drawn along the
 * projected front-bottom edge, so it follows the wall's own perspective rather
 * than sitting level across the picture. */
function drawContactShadow(ctx: CanvasRenderingContext2D, projector: Projector, widthMm: number) {
  const left = projector.project(0, 0, 0);
  const right = projector.project(widthMm, 0, 0);
  const backLeft = projector.project(0, 0, -WARDROBE_DEPTH_MM);
  const backRight = projector.project(widthMm, 0, -WARDROBE_DEPTH_MM);
  const drop = Math.max(
    3,
    Math.hypot(left[0] - backLeft[0], left[1] - backLeft[1]) * 0.10,
  );

  ctx.save();
  ctx.filter = `blur(${drop * 0.6}px)`;
  ctx.beginPath();
  ctx.moveTo(backLeft[0], backLeft[1]);
  ctx.lineTo(backRight[0], backRight[1]);
  ctx.lineTo(right[0], right[1] + drop);
  ctx.lineTo(left[0], left[1] + drop);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.fill();
  ctx.restore();
}

/** Muted, and none of them saturated. These sit inside somebody's actual
 * bedroom photograph, so a strong colour would be the loudest thing in the
 * frame and would date the render besides. Charcoals, oatmeals and greys are
 * what the supplied photographs are staged with. */
const GARMENT_TONES: [number, number, number][] = [
  [74, 74, 78],
  [206, 198, 186],
  [120, 118, 116],
  [238, 236, 232],
  [92, 96, 104],
  [168, 158, 144],
];

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

/** Draws an image onto a model-space rectangle through the projector.
 *
 * PERSPECTIVE, BY SUBDIVISION. Canvas 2D can only do affine transforms, which
 * cannot express a perspective warp — an affine map keeps parallel lines
 * parallel, and the whole point here is that they converge. Chopping the
 * rectangle into a grid and drawing each little cell with its own affine
 * approximation gets there: over a cell a few pixels across the perspective is
 * very nearly linear, and the error falls off as the square of the cell size.
 * Twelve divisions is past the point where any of it is visible.
 *
 * Each cell goes down as two triangles, because three points are exactly what
 * an affine transform is determined by. The destination triangle is pushed out
 * about half a pixel from its own centre before it is clipped — adjacent cells
 * otherwise leave hairline gaps where two anti-aliased edges meet, and a grid
 * of pale seams across a photograph is far more visible than the overlap that
 * hiding them costs. */
function drawProjectedImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imgW: number,
  imgH: number,
  projector: Projector,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  z: number,
  divisions = 12,
) {
  const N = divisions;
  // Model→image corner lookup, computed once per grid vertex rather than four
  // times over as each cell asks for its own.
  const grid: [number, number][][] = [];
  for (let j = 0; j <= N; j++) {
    const row: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      row.push(projector.project(x0 + ((x1 - x0) * i) / N, y0 + ((y1 - y0) * j) / N, z));
    }
    grid.push(row);
  }

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      // Source rectangle. The model's Y runs up and the image's runs down, so
      // the vertical index is flipped on the way into the bitmap.
      const su0 = (imgW * i) / N;
      const su1 = (imgW * (i + 1)) / N;
      const sv0 = (imgH * (N - j)) / N;
      const sv1 = (imgH * (N - j - 1)) / N;

      const p00 = grid[j][i];
      const p10 = grid[j][i + 1];
      const p11 = grid[j + 1][i + 1];
      const p01 = grid[j + 1][i];

      triangle(ctx, image, su0, sv0, su1, sv0, su1, sv1, p00, p10, p11);
      triangle(ctx, image, su0, sv0, su1, sv1, su0, sv1, p00, p11, p01);
    }
  }
}

/** One affine-mapped triangle of the source image. */
function triangle(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sx0: number, sy0: number,
  sx1: number, sy1: number,
  sx2: number, sy2: number,
  d0: [number, number],
  d1: [number, number],
  d2: [number, number],
) {
  const denom = sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0;
  if (Math.abs(denom) < 1e-9) return;

  // Half a pixel of bleed, away from the triangle's own centre. Adjacent cells
  // otherwise leave hairline gaps where two anti-aliased edges meet, and a grid
  // of pale seams across a photograph is far more visible than the overlap that
  // hiding them costs.
  const ccx = (d0[0] + d1[0] + d2[0]) / 3;
  const ccy = (d0[1] + d1[1] + d2[1]) / 3;
  const grow = (p: [number, number]): [number, number] => {
    const dx = p[0] - ccx;
    const dy = p[1] - ccy;
    const len = Math.hypot(dx, dy) || 1;
    return [p[0] + (dx / len) * 0.5, p[1] + (dy / len) * 0.5];
  };
  const [x0, y0] = grow(d0);
  const [x1, y1] = grow(d1);
  const [x2, y2] = grow(d2);

  // The affine map taking the three source corners onto the three destination
  // ones. Three points determine it exactly, which is why the cell is split
  // into triangles rather than drawn as a quad.
  const m11 = -(sy0 * (x2 - x1) - sy1 * x2 + sy2 * x1 + (sy1 - sy2) * x0) / denom;
  const m12 = (sy1 * y2 + sy0 * (y1 - y2) - sy2 * y1 + (sy2 - sy1) * y0) / denom;
  const m21 = (sx0 * (x2 - x1) - sx1 * x2 + sx2 * x1 + (sx1 - sx2) * x0) / denom;
  const m22 = -(sx1 * y2 + sx0 * (y1 - y2) - sx2 * y1 + (sx2 - sx1) * y0) / denom;
  const dx =
    (sx0 * (sy2 * x1 - sy1 * x2) + sy0 * (sx1 * x2 - sx2 * x1) + (sx2 * sy1 - sx1 * sy2) * x0) / denom;
  const dy =
    (sx0 * (sy2 * y1 - sy1 * y2) + sy0 * (sx1 * y2 - sx2 * y1) + (sx2 * sy1 - sx1 * sy2) * y0) / denom;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.clip();
  ctx.transform(m11, m12, m21, m22, dx, dy);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

// --- Walk-in: a view through the opening -----------------------------------

function drawWalkIn(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imgW: number,
  imgH: number,
  corners: Point[],
) {
  const xs = corners.map(c => c[0]);
  const ys = corners.map(c => c[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const w = Math.max(...xs) - x;
  const h = Math.max(...ys) - y;
  if (w <= 0 || h <= 0) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // COVER, NOT STRETCH. A cabinet takes some distortion and still reads as a
  // cabinet; a room does not — the moment its verticals lean it stops looking
  // like somewhere you could walk into, which is all this view has to do.
  const scale = Math.max(w / imgW, h / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  // Pinned to the bottom: the robe's floor has to meet the bottom of the
  // opening or the visitor is looking into a room that floats.
  ctx.drawImage(image, x + (w - drawW) / 2, y + h - drawH, drawW, drawH);

  // The opening's reveal — the band of shade that tells the eye it is looking
  // THROUGH something rather than AT a picture hung on the wall.
  const reveal = Math.max(3, Math.min(w, h) * 0.02);
  const side = (fromX: number, toX: number, rx: number, rw: number) => {
    const g = ctx.createLinearGradient(fromX, 0, toX, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.38)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(rx, y, rw, h);
  };
  side(x, x + reveal, x, reveal);
  side(x + w, x + w - reveal, x + w - reveal, reveal);

  const top = ctx.createLinearGradient(0, y, 0, y + reveal * 1.4);
  top.addColorStop(0, 'rgba(0,0,0,0.46)');
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top;
  ctx.fillRect(x, y, w, reveal * 1.4);

  ctx.restore();
}
