import { radius, space, tokens, type as typeScale } from '@/ds';

import { useVisualiserStore } from './useVisualiserStore';

export function SlattedLiftControls({ onInteract }: { onInteract: () => void }) {
  const category = useVisualiserStore(state => state.productCategory);
  const operation = useVisualiserStore(state => state.operation);
  const position = useVisualiserStore(state => state.rollPosition);
  const tilt = useVisualiserStore(state => state.slatTilt);
  const setPosition = useVisualiserStore(state => state.setRollPosition);
  const setTilt = useVisualiserStore(state => state.setSlatTilt);
  const isPlantation = category === 'plantation';
  const controls = [
    ...(!isPlantation && operation === 'manual' ? [{ label: 'Venetian lift', from: 'Raise', to: 'Lower', value: position, change: setPosition }] : []),
    ...(!isPlantation || operation === 'manual' ? [{ label: 'Slat tilt', from: 'Open', to: 'Close', value: isPlantation ? position : tilt, change: isPlantation ? setPosition : setTilt }] : []),
  ];
  if (!controls.length) return null;
  return <div className="honeycomb-lift-controls" style={{ background: tokens.charcoal, color: tokens.onDark,
    borderRadius: radius.md, padding: space.sm, gap: space.sm }}>
    {controls.map(control => <label key={control.label} style={{ ...typeScale.label, letterSpacing: 'normal' }}>
      <span>{control.from}</span>
      <input type="range" aria-label={control.label} min={0} max={100} step={1} value={Math.round(control.value * 100)}
        aria-valuetext={`${Math.round(control.value * 100)}% ${control.to.toLowerCase()}`}
        onPointerDown={onInteract} onKeyDown={onInteract} onChange={event => control.change(Number(event.target.value) / 100)}
        style={{ accentColor: tokens.accent }} />
      <span>{control.to}</span>
    </label>)}
  </div>;
}
