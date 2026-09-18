/** The shop photographs share a 900px window. Carry the already dyed, woven
 * cloth over their exposed rear-feed barrel; keep metal on the end fittings
 * only. Sampling the finished cloth preserves its photographic light
 * and makes the crown follow every frame of the existing colour transition. */
export function paintRollerFront(ctx: CanvasRenderingContext2D, layer: HTMLCanvasElement,
  { hardware, isDual }: { hardware: string; isDual: boolean }) {
  const ink = layer.getContext('2d', { colorSpace: 'srgb' });
  if (!ink) return;
  const scale = ctx.canvas.width / 900;
  const left = 155, right = 727, axle = 157;
  // The dual's front blind is partly raised, leaving more fabric on its tube.
  const radius = isDual ? 9 : 7;
  const crest = axle - radius, tangent = axle - radius * .35;
  const join = 184;
  ink.save();
  ink.setTransform(1, 0, 0, 1, 0, 0);
  ink.clearRect(0, 0, layer.width, layer.height);
  ink.globalCompositeOperation = 'source-over';
  // Copy clean cloth below the old tube, including its supplier weave. The
  // last few rows fade into the original photo so there is no pasted-on seam.
  ink.drawImage(ctx.canvas, left * scale, (join - 2) * scale, (right - left) * scale, 4 * scale,
    left * scale, crest * scale, (right - left) * scale, (join - crest) * scale);
  ink.globalCompositeOperation = 'destination-in';
  const fade = ink.createLinearGradient(0, (join - 7) * scale, 0, join * scale);
  fade.addColorStop(0, 'rgba(255,255,255,1)');
  fade.addColorStop(1, 'rgba(255,255,255,0)');
  ink.fillStyle = fade;
  ink.fillRect(left * scale, crest * scale, (right - left) * scale, (join - crest) * scale);
  ink.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.drawImage(layer, 0, 0);
  ctx.scale(scale, scale);
  const bend = ctx.createLinearGradient(0, crest, 0, tangent);
  bend.addColorStop(0, 'rgba(0,0,0,.065)');
  bend.addColorStop(.5, 'rgba(0,0,0,.016)');
  bend.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bend;
  ctx.fillRect(left, crest, right - left, tangent - crest);
  // Only the outer fittings show metal; never a metal stripe across the cloth.
  ctx.fillStyle = hardware;
  for (const x of [left - 1.5, right + 1.5]) {
    ctx.beginPath();
    ctx.ellipse(x, axle, 1.5, 5.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // Both weights are wrapped in their own layer's finished cloth.
  paintWrappedRail(ctx, layer, { top: 579, bottom: 588, hardware });
  if (isDual) paintWrappedRail(ctx, layer, { top: 296, bottom: 306, hardware });
}

function paintWrappedRail(ctx: CanvasRenderingContext2D, layer: HTMLCanvasElement,
  { top, bottom, hardware }: { top: number; bottom: number; hardware: string }) {
  const scale = ctx.canvas.width / 900, left = 155, width = 572;
  const ink = layer.getContext('2d')!;
  ink.save();
  ink.setTransform(1, 0, 0, 1, 0, 0);
  ink.globalCompositeOperation = 'source-over';
  ink.clearRect(0, 0, layer.width, layer.height);
  // Copy a narrow strip above this rail, including the selected supplier weave.
  ink.drawImage(ctx.canvas, left * scale, (top - 10) * scale, width * scale, 5 * scale,
    left * scale, top * scale, width * scale, (bottom - top) * scale);
  ink.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.drawImage(layer, 0, 0);
  ctx.scale(scale, scale);
  const curve = ctx.createLinearGradient(0, top, 0, bottom);
  curve.addColorStop(0, 'rgba(0,0,0,.045)');
  curve.addColorStop(.3, 'rgba(0,0,0,0)');
  curve.addColorStop(1, 'rgba(0,0,0,.18)');
  ctx.fillStyle = curve;
  ctx.fillRect(left, top, width, bottom - top);
  ctx.fillStyle = hardware;
  for (const x of [left, left + width]) {
    ctx.beginPath();
    ctx.ellipse(x, (top + bottom) / 2, 1.6, (bottom - top) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
