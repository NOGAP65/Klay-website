import type { CSSProperties } from 'react';
import { tokens } from '@/ds';

interface Props {
  angle: number;
  isReady: boolean;
  onRotate: (degrees: number) => void;
  onReset: () => void;
}

const button: CSSProperties = {
  display: 'grid', placeItems: 'center', width: 44, height: 44, padding: 0,
  border: 0, borderRadius: '50%', background: 'transparent', color: '#fff', cursor: 'pointer',
};

export default function JoineryOrbitControl({ angle, isReady, onRotate, onReset }: Props) {
  return <div role="group" aria-label="3D view controls" style={{
    position: 'absolute', zIndex: 3, right: 12, bottom: 12, padding: '7px 4px 8px',
    borderRadius: 28, background: 'rgba(29,29,29,.88)', color: '#fff',
    boxShadow: '0 2px 10px rgba(0,0,0,.15)', fontFamily: tokens.body,
  }}>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <button type="button" aria-label="Rotate view left" title="Rotate left" disabled={!isReady || angle <= -40} onClick={() => onRotate(-10)} style={{ ...button, opacity: angle <= -40 ? .3 : 1 }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m10 5-7 7 7 7M3 12h13"/></svg>
      </button>
      <button type="button" aria-label="Reset 3D view to 30 degrees" title="Reset to 30°" disabled={!isReady} onClick={onReset} style={{ ...button, width: 50, height: 50, background: 'rgba(255,255,255,.12)', gap: 1, padding: '5px 0' }}>
        <svg width="22" height="21" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true"><path d="m13 2 10 6v11l-10 5L3 19V8Zm0 11 10-5M13 13 3 8m10 5v11M3 8l10-6"/></svg>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.05em', lineHeight: 1 }}>3D</span>
      </button>
      <button type="button" aria-label="Rotate view right" title="Rotate right" disabled={!isReady || angle >= 40} onClick={() => onRotate(10)} style={{ ...button, opacity: angle >= 40 ? .3 : 1 }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m14 5 7 7-7 7m7-7H8"/></svg>
      </button>
    </div>
    <div style={{ textAlign: 'center', fontSize: 10, lineHeight: 1.4, paddingTop: 4, color: 'rgba(255,255,255,.82)' }}>
      Drag to rotate <span aria-hidden="true">·</span> <span aria-label="View angle">{Math.abs(angle)}°</span>
    </div>
  </div>;
}
