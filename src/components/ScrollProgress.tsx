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
        width: '100%',
        height: 1,
        zIndex: 9998,
        background: 'rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: `linear-gradient(90deg, ${tokens.gold}, ${tokens.goldLight})`,
          boxShadow: `0 0 8px ${tokens.gold}`,
          transformOrigin: 'left',
        }}
      />
    </div>
  );
}
