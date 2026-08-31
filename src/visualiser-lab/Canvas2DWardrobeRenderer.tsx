// ---------------------------------------------------------------------------
// THE WARDROBE RENDERER — a keyed product photograph, stood in the room.
//
// WHY THIS DOES NOT WARP ONTO THE TRACED QUAD, which is what every other
// renderer here does and is the first thing to reach for.
//
// A blind and a curtain are flat things on the plane of the window, so mapping
// them onto the traced quad through a homography is exactly right: the quad IS
// their plane. A wardrobe is not flat and, more to the point, these stickers
// are not drawings — they are photographs with a lens and a viewpoint already
// baked into them. Push one through a second perspective transform and the two
// compound: shelves that were square go to skew, the vertical stiles lean, and
// the eye reads the result as a crooked picture rather than as furniture.
//
// So the quad is used as a FRAME rather than a projection: the sticker is drawn
// upright into its bounding box. That keeps the photograph's own perspective
// intact, which is the thing that makes it look like a cabinet, and it costs the
// one thing a homography would have bought — matching the wall's exact vanishing
// point. Against that, a wardrobe is nearly always shot square-on and hung on a
// wall the customer also photographed square-on, so the two agree far more often
// than not.
//
// IT FILLS THE OUTLINE EXACTLY. Whatever is traced is where the wardrobe goes:
// left edge to left edge, base to base, top to top. An earlier version fitted
// the sticker to the width at its own aspect ratio and stood it on the base,
// which meant a trace taller than the sticker's proportions left a band of room
// showing above the cabinet — the customer drew a box and got something smaller
// than the box, in a place they had not chosen.
//
// The trade is that a trace whose proportions are far from the product's will
// stretch it, and nothing here corrects that. It is the right trade: the outline
// is the one instruction the customer has actually given, and honouring it is
// worth more than protecting them from a shape they drew on purpose. The
// dimensions under the layout picker say what the real proportions are.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import { wardrobeSticker, wardrobeModelById, wardrobeColourHex } from './wardrobes';

export interface WardrobeRendererProps {
  photoUrl: string;
  /** The traced quad in photo pixels, TL TR BR BL — used as a footprint. */
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

      const sticker = await wardrobeSticker(wardrobeModelById(modelId), wardrobeColourHex(colourName));
      // Awaiting the sticker gives React room to have swapped the photo, the
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

      const drawW = boxW;
      const drawH = boxH;
      const x = left;
      const y = top;

      // A contact shadow along the base. Without it the unit reads as hovering
      // however well it is placed — the eye takes the darkening where an object
      // meets the floor as the proof that it is standing on it. Elliptical and
      // tight to the base, drawn under the sticker so the cabinet's own edge
      // stays crisp on top of it.
      const shadowH = Math.max(4, drawH * 0.018);
      const gradient = ctx.createLinearGradient(0, bottom - shadowH, 0, bottom + shadowH);
      gradient.addColorStop(0, 'rgba(0,0,0,0.28)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.filter = `blur(${Math.max(1, shadowH * 0.5)}px)`;
      ctx.fillStyle = gradient;
      ctx.fillRect(x, bottom - shadowH, drawW, shadowH * 2);
      ctx.restore();

      ctx.drawImage(sticker, x, y, drawW, drawH);
    };

    render().catch(() => {
      /* image or sticker failed to load — leave the previous frame in place */
    });

    return () => {
      cancelled = true;
    };
    // corners is a fresh array each render; its contents are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl, modelId, colourName, JSON.stringify(corners)]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />;
}
