import { MechanismControl } from './MechanismControl';
import { useVisualiserStore } from './useVisualiserStore';

export function OutdoorLiftControls({ onInteract }: { onInteract: () => void }) {
  const position = useVisualiserStore(s => s.rollPosition), change = useVisualiserStore(s => s.setRollPosition);
  const operation = useVisualiserStore(s => s.operation);
  if (operation !== 'manual') return null;
  return <MechanismControl kind="crank" label="Outdoor covering position" value={position} change={change} onInteract={onInteract} />;
}
