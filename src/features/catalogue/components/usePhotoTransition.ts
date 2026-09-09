import { useEffect, useRef, useState } from 'react';

interface Frame { colour: string; hardware: string }
const channels = (hex: string) => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
const blend = (from: string, to: string, t: number) => {
  const a = channels(from);
  return '#' + channels(to).map((b, i) => Math.round(a[i] + (b - a[i]) * t).toString(16).padStart(2, '0')).join('');
};

/** Retarget from the currently painted value so rapid selections stay smooth. */
export function usePhotoTransition(target: Frame, isReduced: boolean): Frame {
  const [frame, setFrame] = useState(target);
  const painted = useRef(target);
  const { colour, hardware } = target;
  useEffect(() => {
    const from = painted.current;
    const to = { colour, hardware };
    if (isReduced) { painted.current = to; setFrame(to); return; }
    if (from.colour === colour && from.hardware === hardware) return;
    const start = performance.now();
    let request = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 320);
      const t = 1 - (1 - progress) ** 3;
      const next = progress === 1 ? to : {
        colour: blend(from.colour, colour, t), hardware: blend(from.hardware, hardware, t),
      };
      painted.current = next;
      setFrame(next);
      if (progress < 1) request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [colour, hardware, isReduced]);
  return isReduced ? target : frame;
}
