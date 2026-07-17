import { useEffect, useRef } from 'react';
import { useKlayStore } from '../store';
import { tokens, prefersReducedMotion } from '../theme';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const setCursor = useKlayStore((s) => s.setCursor);
  const setCursorHover = useKlayStore((s) => s.setCursorHover);
  const hover = useKlayStore((s) => s.cursorHover);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    let raf = 0;
    let ringX = window.innerWidth / 2;
    let ringY = window.innerHeight / 2;
    const target = { x: ringX, y: ringY };

    const place = (el: HTMLDivElement | null, x: number, y: number) => {
      if (el) el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      setCursor(e.clientX, e.clientY);
      place(dotRef.current, e.clientX, e.clientY);
      if (reduced) place(ringRef.current, e.clientX, e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      setCursorHover(!!el?.closest('a, button, [data-hover]'));
    };

    const loop = () => {
      ringX += (target.x - ringX) * 0.18;
      ringY += (target.y - ringY) * 0.18;
      place(ringRef.current, ringX, ringY);
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(raf);
    };
  }, [setCursor, setCursorHover]);

  const ringSize = hover ? 56 : 36;

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: tokens.gold,
          pointerEvents: 'none',
          zIndex: 10000,
          mixBlendMode: 'difference',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: ringSize,
          height: ringSize,
          borderRadius: '50%',
          border: `1px solid ${hover ? tokens.goldLight : tokens.gold}`,
          background: hover ? 'rgba(200,151,58,0.08)' : 'transparent',
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'width 0.3s ease, height 0.3s ease, background 0.3s ease, border-color 0.3s ease',
        }}
      />
    </>
  );
}
