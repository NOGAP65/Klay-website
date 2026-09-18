import { MechanismControl } from './MechanismControl';
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
  return <>{controls.map(control => <MechanismControl key={control.label} kind="cord" {...control} onInteract={onInteract} />)}</>;
}
