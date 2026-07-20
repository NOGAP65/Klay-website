import { useReveal } from '../hooks/useReveal';

export function BlindReveal({ children }: { children: React.ReactNode }) {
  const { ref, visible } = useReveal<HTMLDivElement>(0.1);

  return (
    <div ref={ref} style={{ position: 'relative', overflow: 'hidden' }}>
      {children}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#141414',
          zIndex: 10,
          transformOrigin: 'top',
          transform: visible ? 'scaleY(0)' : 'scaleY(1)',
          transition: 'transform 1.2s cubic-bezier(0.76,0,0.24,1)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
