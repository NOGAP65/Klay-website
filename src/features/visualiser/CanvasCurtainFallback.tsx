import { useEffect, useMemo, useRef } from 'react';

import { loadImage } from '@/shared';

import { paintCurtainFallback, photographedFolds, prepareFallbackPhoto, type FallbackPhoto } from './curtainFallbackRaster';
import { PreviewStatus } from './PreviewStatus';
import { usePreviewLoad } from './usePreviewLoad';

import type { Canvas2DCurtainRendererProps } from './Canvas2DCurtainRenderer';
import type { Point } from './homography';

/** Bounded, photograph-based renderer for WebGL1-only or low-memory phones. */
export default function CanvasCurtainFallback({ tl, tr, br, bl, fabricType, hardwareColour, mount, colour, openness, photoUrl, canvasWidth, canvasHeight }: Canvas2DCurtainRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<FallbackPhoto>();
  const corners = useMemo<Point[]>(() => [[tl.x, tl.y], [tr.x, tr.y], [br.x, br.y], [bl.x, bl.y]], [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
  const preview = usePreviewLoad(JSON.stringify([photoUrl, fabricType, hardwareColour, mount, corners]));
  const { ready, fail, attempt } = preview;
  useEffect(() => {
    let isCancelled = false;
    const draw = async () => {
      const [photo, folds] = await Promise.all([loadImage(photoUrl), photographedFolds()]);
      if (isCancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { colorSpace: 'srgb' });
      if (!ctx) throw new Error('Canvas unavailable');
      if (photoRef.current?.url !== photoUrl) photoRef.current = prepareFallbackPhoto(ctx, photo, photoUrl);
      paintCurtainFallback(ctx, photoRef.current, folds, { corners, fabricType, hardwareColour, mount, colour, openness });
      canvas.dataset.renderReady = 'true';
      ready();
    };
    void draw().catch(() => { if (!isCancelled) fail(); });
    return () => { isCancelled = true; };
  }, [photoUrl, colour, fabricType, hardwareColour, mount, openness, corners, attempt, ready, fail]);
  return <div style={{ position: 'relative', width: '100%', aspectRatio: `${canvasWidth} / ${canvasHeight}` }}>
    <canvas ref={canvasRef} data-render-surface="curtain" data-render-mode="canvas2d" data-render-ready={!preview.loading && !preview.failed ? 'true' : 'false'} style={{ width: '100%', height: 'auto', display: 'block' }} />
    <PreviewStatus {...preview} label="Loading curtains" />
  </div>;
}
