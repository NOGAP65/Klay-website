import { useEffect, useMemo, useRef } from 'react';

import { loadImage } from '@/shared';

import { paintCurtainFallback, photographedFolds, prepareFallbackPhoto, type FallbackPhoto } from './curtainFallbackRaster';

import type { Canvas2DCurtainRendererProps } from './Canvas2DCurtainRenderer';
import type { Point } from './homography';

/** Bounded, photograph-based renderer for WebGL1-only or low-memory phones. */
export default function CanvasCurtainFallback({ tl, tr, br, bl, fabricType, hardwareColour, mount, colour, openness, photoUrl }: Canvas2DCurtainRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<FallbackPhoto>();
  const corners = useMemo<Point[]>(() => [[tl.x, tl.y], [tr.x, tr.y], [br.x, br.y], [bl.x, bl.y]], [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
  useEffect(() => {
    let isCancelled = false;
    const draw = async () => {
      const [photo, folds] = await Promise.all([loadImage(photoUrl), photographedFolds()]);
      if (isCancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { colorSpace: 'srgb' });
      if (!ctx) return;
      if (photoRef.current?.url !== photoUrl) photoRef.current = prepareFallbackPhoto(ctx, photo, photoUrl);
      paintCurtainFallback(ctx, photoRef.current, folds, { corners, fabricType, hardwareColour, mount, colour, openness });
      canvas.dataset.renderReady = 'true';
    };
    void draw().catch(() => {});
    return () => { isCancelled = true; };
  }, [photoUrl, colour, fabricType, hardwareColour, mount, openness, corners]);
  return <canvas ref={canvasRef} data-render-surface="curtain" data-render-mode="canvas2d" style={{ width: '100%', height: 'auto', display: 'block' }} />;
}
