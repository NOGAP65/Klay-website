import { useLayoutEffect, useRef } from 'react';

const FULL_SAMPLE = [0, 0, 1, 1] as const;
/** Paint pigment as image pixels, which automatic dark themes must not reinterpret
 * as a UI background. The owning button supplies the label and selection ring. */
export function ColourSample({ colour = '#ffffff', texture, crop = FULL_SAMPLE, mirror }: {
  colour?: string; texture?: string; crop?: readonly [number, number, number, number]; mirror?: 'none' | 'mixed' | 'all';
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d', { colorSpace: 'srgb' });
    if (!ctx) return;
    let active = true;
    const paint = (image?: HTMLImageElement) => {
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, 64, 64);
      if (image) {
        const [x, y, width, height] = crop;
        ctx.drawImage(image, x * image.naturalWidth, y * image.naturalHeight,
          width * image.naturalWidth, height * image.naturalHeight, 0, 0, 64, 64);
      }
      if (mirror && mirror !== 'none') {
        const gradient = ctx.createLinearGradient(0, 20, 64, 44);
        gradient.addColorStop(0, '#c2ccca');
        gradient.addColorStop(mirror === 'mixed' ? .28 : .45, '#f6f8f6');
        gradient.addColorStop(mirror === 'mixed' ? .49 : 1, '#a6b3b1');
        if (mirror === 'mixed') {
          gradient.addColorStop(.5, 'transparent');
          gradient.addColorStop(1, 'transparent');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
      }
    };
    paint();
    if (!texture) return;
    const image = new Image();
    image.onload = () => { if (active) paint(image); };
    image.src = texture;
    return () => { active = false; image.onload = null; };
  }, [colour, texture, crop, mirror]);
  return <canvas ref={ref} width={64} height={64} aria-hidden="true" data-colour-sample={colour}
    style={{ display: 'block', position: 'absolute', inset: 0, width: '100%', height: '100%',
      borderRadius: 'inherit', pointerEvents: 'none', colorScheme: 'only light', forcedColorAdjust: 'none' }} />;
}
