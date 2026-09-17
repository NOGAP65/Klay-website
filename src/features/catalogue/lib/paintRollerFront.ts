/** The shop photographs share a 900px window. Carry the already dyed, woven
 * cloth over their exposed rear-feed barrel; keep metal on the end fittings
 * and weights. Sampling the finished cloth preserves its photographic light
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
  if (isDual) {
    // The raised front layer has its own weight. It is absent from the shared
    // full-drop hardware mask, so explicitly finish it rather than dyeing it
    // with the cloth or leaving the photographed silver bar unchanged.
    ctx.fillRect(left, 296, right - left, 10);
    const rail = ctx.createLinearGradient(0, 296, 0, 306);
    rail.addColorStop(0, 'rgba(255,255,255,.08)');
    rail.addColorStop(.35, 'rgba(0,0,0,0)');
    rail.addColorStop(1, 'rgba(0,0,0,.2)');
    ctx.fillStyle = rail;
    ctx.fillRect(left, 296, right - left, 10);
  }
  ctx.restore();
}
