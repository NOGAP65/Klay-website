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
// So the quad is used as a FOOTPRINT rather than a projection. The sticker is
// fitted upright into the quad's width, at its own aspect ratio, and stood on
// the quad's base. That keeps the photograph's own perspective intact, which is
// the thing that makes it look like a cabinet, and it costs the one thing a
// homography would have bought — matching the wall's exact vanishing point.
// Against that, a wardrobe is nearly always shot square-on and hung on a wall
// the customer also photographed square-on, so the two agree far more often
// than not.
//
// BOTTOM-ANCHORED because a wardrobe stands on the floor. If the traced quad is
// taller than the sticker needs, the gap opens at the TOP, against the ceiling,
// where a gap is what a real cabinet leaves. Centring it instead would float
// the whole unit above the floor, which is the single fastest way to make a
// composite look pasted on.
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

      // Fit to width, then give back any height it cannot have. A wide, shallow
      // trace would otherwise stand a wardrobe straight through the ceiling.
      const ratio = sticker.width / sticker.height;
      let drawW = boxW;
      let drawH = drawW / ratio;
      if (drawH > boxH) {
        drawH = boxH;
        drawW = drawH * ratio;
      }

      const x = left + (boxW - drawW) / 2;
      const y = bottom - drawH;

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
