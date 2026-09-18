import { useCallback, useEffect, useRef } from 'react';

/** A tap finishes the movement; grabbing the control cancels it immediately. */
export function useMechanismMotion(value: number, change: (value: number) => void) {
  const frame = useRef<number | null>(null);
  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  const moveTo = (target: number) => {
    stop();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { change(target); return; }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / 350);
      const eased = progress * progress * (3 - 2 * progress);
      change(value + (target - value) * eased);
      frame.current = progress < 1 ? requestAnimationFrame(step) : null;
    };
    frame.current = requestAnimationFrame(step);
  };
  return { moveTo, stop };
}
