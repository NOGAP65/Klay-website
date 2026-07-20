import { useEffect, useRef, useState } from 'react';
import { tokens, prefersReducedMotion } from '../theme';

const SECTION_IDS = ['top', 'collection', 'curtains', 'wardrobes', 'process', 'reviews', 'final'];

export function SectionCounter() {
  const [index, setIndex] = useState(1);
  const [fade, setFade] = useState(true);
  const current = useRef(1);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
              const next = i + 1;
              if (next === current.current) return;
              current.current = next;
              setFade(false);
              setTimeout(() => {
                setIndex(next);
                setFade(true);
              }, 200);
            }
          });
        },
        { threshold: [0.3, 0.5] },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 40,
        right: 48,
        zIndex: 50,
        fontFamily: tokens.display,
        fontSize: 80,
        fontWeight: 300,
        color: tokens.gold,
        opacity: fade ? 0.05 : 0,
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease',
        lineHeight: 1,
      }}
    >
      {String(index).padStart(2, '0')}
    </div>
  );
}
