import { radius, space, tokens, type as typeScale } from '@/ds';

import { useVisualiserStore } from './useVisualiserStore';

export function OutdoorLiftControls({ onInteract }: { onInteract: () => void }) {
  const position = useVisualiserStore(s => s.rollPosition), change = useVisualiserStore(s => s.setRollPosition);
  return <div className="honeycomb-lift-controls" style={{ background: tokens.charcoal, color: tokens.onDark,
    borderRadius: radius.md, padding: space.sm }}>
    <label style={{ ...typeScale.label, letterSpacing: 'normal' }}>
      <span>Open</span>
      <input type="range" aria-label="Outdoor covering position" min={0} max={100} step={1} value={Math.round(position * 100)}
        aria-valuetext={`${Math.round(position * 100)}% closed`} onPointerDown={onInteract} onKeyDown={onInteract}
        onChange={event => change(Number(event.target.value) / 100)} style={{ accentColor: tokens.accent }} />
      <span>Close</span>
    </label>
  </div>;
}
