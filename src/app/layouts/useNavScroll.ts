import { useCallback, useSyncExternalStore } from 'react';

function subscribe(notify: () => void): () => void {
  let frame: number | null = null;
  const onScroll = () => {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => { frame = null; notify(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    window.removeEventListener('scroll', onScroll);
    if (frame !== null) cancelAnimationFrame(frame);
  };
}

/** Nav only cares about its ticker offset and the 60px compression threshold.
 * Scrolling beyond them does not change the snapshot or re-render the nav. */
export function useNavScroll(stickBelow: number, isEnabled: boolean): number {
  const snapshot = useCallback(() => isEnabled
    ? Math.min(Math.max(0, window.scrollY), Math.max(61, stickBelow)) : 0, [stickBelow, isEnabled]);
  return useSyncExternalStore(subscribe, snapshot, () => 0);
}
