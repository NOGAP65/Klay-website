import { useKlayStore } from '../store';
import { tokens } from '../theme';

export function ScrollProgress() {
  const scrollY = useKlayStore((s) => s.scrollY);
  const max =
    typeof document !== 'undefined'
      ? document.documentElement.scrollHeight - window.innerHeight
      : 1;
  const progress = max > 0 ? Math.min(scrollY / max, 1) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 2,
        width: `${progress * 100}%`,
        background: tokens.gold,
        zIndex: 999,
        pointerEvents: 'none',
        transition: 'width 0.1s linear',
      }}
    />
  );
}
