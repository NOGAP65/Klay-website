import { useEffect, useRef } from 'react';

import { PreviewStatus } from './PreviewStatus';
import { usePreviewLoad } from './usePreviewLoad';
import { createWardrobeRoomEngine, type RoomRenderSettings } from './wardrobeRoomEngine';

export default function WardrobeRoomRenderer(settings: RoomRenderSettings) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ReturnType<typeof createWardrobeRoomEngine> | null>(null);
  const key = JSON.stringify(settings);
  const { ready, fail, loading: isLoading, failed: hasFailed, retry, attempt, delayed: isDelayed } = usePreviewLoad(key);
  useEffect(() => {
    if (!canvas.current) return;
    const instance = createWardrobeRoomEngine(canvas.current);
    engine.current = instance;
    return () => { engine.current = null; instance.dispose(); };
  }, [attempt]);
  useEffect(() => {
    let cancelled = false;
    const instance = engine.current;
    if (!instance) return;
    void instance.draw(JSON.parse(key) as RoomRenderSettings, () => !cancelled)
      .then(() => { if (!cancelled) ready(); })
      .catch(() => { if (!cancelled) fail(); });
    return () => { cancelled = true; };
  }, [key, attempt, ready, fail]);
  return <>
    <canvas ref={canvas} data-render-surface="wardrobe-room" data-render-ready={!isLoading && !hasFailed}
      data-preview-loading={isLoading || undefined} style={{ width: '100%', height: '100%', display: 'block' }} />
    <PreviewStatus loading={isLoading} failed={hasFailed} retry={retry} delayed={isDelayed} label="Loading wardrobe" />
  </>;
}
