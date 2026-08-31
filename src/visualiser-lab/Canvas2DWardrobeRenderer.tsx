// ---------------------------------------------------------------------------
// THE WARDROBE RENDERER — two products, two placements.
//
// WHY NOTHING HERE WARPS ONTO THE TRACED QUAD, which is what every other
// renderer in this folder does and is the first thing to reach for.
//
// A blind and a curtain are flat things on the plane of the window, so mapping
// them onto the traced quad through a homography is exactly right: the quad IS
// their plane. A wardrobe is not flat, and more to the point these renders are
// photographs with a lens and a viewpoint already baked into them. Push one
// through a second perspective transform and the two compound: shelves that
// were square go to skew, the stiles lean, and the eye reads the result as a
// crooked picture rather than as furniture.
//
// So the trace is used as a FRAME, and the render is chosen to suit it rather
// than distorted to fit it — see viewForTrace. Getting the viewpoint right is
// the job of the artwork; getting it in the right place is the job of this
// file.
//
// --- BUILT-IN: an object standing against a wall ---------------------------
//
// Fills the traced box exactly, because the outline is the one instruction the
// customer has actually given. A contact shadow goes down at its base: without
// it the unit reads as hovering however well it is placed, since the eye takes
// the darkening where an object meets the floor as the proof that it is
// standing on it.
//
// --- WALK-IN: a room you are standing in -----------------------------------
//
// These renders look INTO the robe — two or three walls receding away from the
// camera. There is no object to stand anywhere, so the built-in placement is
// meaningless for them: a contact shadow under a room is nonsense, and so is
// standing a room on a floor.
//
// They are drawn as a VIEW THROUGH THE TRACE instead: the opening the customer
// drew becomes a doorway, the render fills it, and the wall's own thickness is
// suggested by a soft inner shadow around the edge. The image is scaled to
// cover the opening rather than stretched to it, so a robe interior is never
// squeezed out of proportion — a room read at the wrong aspect stops looking
// like a room at all, which is the one thing this view has to preserve.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import {
  wardrobeArtwork,
  wardrobeModelById,
  viewForTrace,
  tracedRecedesLeft,
} from './wardrobes';

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
      const view = viewForTrace(corners, model.kind);
      const art = await wardrobeArtwork(model, colourName, view);
      // Awaiting the artwork gives React room to have swapped the photo, the
      // model or the colour underneath us. Bail rather than paint a stale one
      // over a fresh background.
      if (cancelled) return;

      const xs = corners.map(c => c[0]);
      const ys = corners.map(c => c[1]);
      const left = Math.min(...xs);
      const right = Math.max(...xs);
      const top = Math.min(...ys);
      const bottom = Math.max(...ys);
      const boxW = right - left;
      const boxH = bottom - top;
      if (boxW <= 0 || boxH <= 0) return;

      if (model.kind === 'walk-in') {
        drawWalkIn(ctx, art.image, art.width, art.height, left, top, boxW, boxH);
      } else {
        drawBuiltIn(
          ctx,
          art.image,
          left,
          top,
          boxW,
          boxH,
          bottom,
          view === 'angle' && tracedRecedesLeft(corners),
        );
      }
    };

    render().catch(() => {
      /* photo or artwork failed to load — leave the previous frame in place */
    });

    return () => {
      cancelled = true;
    };
    // corners is a fresh array each render; its contents are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl, modelId, colourName, JSON.stringify(corners)]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />;
}

/** A cabinet standing on the floor, filling the traced box.
 *
 * `mirror` flips it horizontally, for a wall that recedes to the left when the
 * angled render was drawn receding to the right. The flip is around the box's
 * own centre so the artwork stays exactly inside the outline. */
function drawBuiltIn(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
  bottom: number,
  mirror: boolean,
) {
  // The contact shadow first, so the cabinet's own edge stays crisp on top of
  // it. Tight to the base and blurred, which is what a shadow on a floor does
  // a few centimetres from the object casting it.
  const shadowH = Math.max(4, h * 0.018);
  const gradient = ctx.createLinearGradient(0, bottom - shadowH, 0, bottom + shadowH);
  gradient.addColorStop(0, 'rgba(0,0,0,0.28)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.filter = `blur(${Math.max(1, shadowH * 0.5)}px)`;
  ctx.fillStyle = gradient;
  ctx.fillRect(x, bottom - shadowH, w, shadowH * 2);
  ctx.restore();

  if (mirror) {
    ctx.save();
    ctx.translate(x + w / 2, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, -w / 2, y, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(image, x, y, w, h);
  }
}

/** A robe interior seen through the traced opening.
 *
 * COVER, NOT STRETCH. The render is scaled so the opening is filled and the
 * overflow is clipped away, rather than squeezed to the opening's shape. A
 * cabinet can take a little distortion and still read as a cabinet; a room
 * cannot — the moment its verticals lean or its depth foreshortens wrongly it
 * stops looking like somewhere you could walk into, which is the whole of what
 * this view is for. */
function drawWalkIn(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imgW: number,
  imgH: number,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const scale = Math.max(w / imgW, h / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  // Centred horizontally, and pinned to the BOTTOM vertically: the floor of the
  // robe has to meet the bottom of the opening or the visitor is looking into a
  // room that is floating.
  ctx.drawImage(image, x + (w - drawW) / 2, y + h - drawH, drawW, drawH);

  // The opening's own reveal. A doorway cut through a wall shows the wall's
  // thickness, and that band of shade around the edge is most of what tells the
  // eye it is looking THROUGH something rather than AT a picture hung on it.
  const reveal = Math.max(3, Math.min(w, h) * 0.02);
  const edge = ctx.createLinearGradient(x, 0, x + reveal, 0);
  edge.addColorStop(0, 'rgba(0,0,0,0.38)');
  edge.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = edge;
  ctx.fillRect(x, y, reveal, h);

  const edgeR = ctx.createLinearGradient(x + w, 0, x + w - reveal, 0);
  edgeR.addColorStop(0, 'rgba(0,0,0,0.38)');
  edgeR.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = edgeR;
  ctx.fillRect(x + w - reveal, y, reveal, h);

  const edgeT = ctx.createLinearGradient(0, y, 0, y + reveal * 1.4);
  edgeT.addColorStop(0, 'rgba(0,0,0,0.46)');
  edgeT.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = edgeT;
  ctx.fillRect(x, y, w, reveal * 1.4);

  ctx.restore();
}
