import { useEffect, useRef, useState } from 'react';

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.2,
): { ref: React.RefObject<T>; visible: boolean } {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}
