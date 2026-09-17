import { radius, space, tokens, type as typeScale } from '@/ds';

import { useVisualiserStore } from './useVisualiserStore';

/** Preview movement only: these positions never become product options. */
export function HoneycombLiftControls({ showLift, showDay, onInteract }: {
  showLift: boolean; showDay: boolean; onInteract: () => void;
}) {
  const position = useVisualiserStore(state => state.rollPosition);
  const day = useVisualiserStore(state => state.honeycombDayPosition);
  const setPosition = useVisualiserStore(state => state.setRollPosition);
  const setDay = useVisualiserStore(state => state.setHoneycombDayPosition);
  const controls = [
    ...(showLift ? [{ label: 'Honeycomb position', from: 'Open', to: 'Close', value: position, change: setPosition }] : []),
    ...(showDay ? [{ label: 'Day & Night balance', from: 'Night', to: 'Day', value: day, change: setDay }] : []),
  ];
  if (!controls.length) return null;
  return <div className="honeycomb-lift-controls" style={{ background: tokens.charcoal, color: tokens.onDark,
    borderRadius: radius.md, padding: space.sm, gap: space.sm }}>
    {controls.map(control => <label key={control.label} style={{ ...typeScale.label, letterSpacing: 'normal' }}>
      <span>{control.from}</span>
      <input aria-label={control.label} type="range" min={0} max={100} step={1}
        value={Math.round(control.value * 100)}
        aria-valuetext={control.label === 'Honeycomb position' ? `${Math.round(control.value * 100)}% closed` : `${Math.round(control.value * 100)}% day fabric`}
        onPointerDown={onInteract} onKeyDown={onInteract}
        onChange={event => control.change(Number(event.target.value) / 100)} style={{ accentColor: tokens.accent }} />
      <span>{control.to}</span>
    </label>)}
  </div>;
}
