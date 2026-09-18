import { MechanismControl } from './MechanismControl';
import { useVisualiserStore } from './useVisualiserStore';

import type { MechanismKind } from './MechanismArtwork';

export function SlattedLiftControls({ onInteract }: { onInteract: () => void }) {
  const category = useVisualiserStore(state => state.productCategory);
  const operation = useVisualiserStore(state => state.operation);
  const position = useVisualiserStore(state => state.rollPosition);
  const tilt = useVisualiserStore(state => state.slatTilt);
  const setPosition = useVisualiserStore(state => state.setRollPosition);
  const setTilt = useVisualiserStore(state => state.setSlatTilt);
  const isPlantation = category === 'plantation';
  const controls: { kind: MechanismKind; label: string; from: string; to: string; value: number; change: (value: number) => void }[] = [
    ...(!isPlantation && operation === 'manual' ? [{ kind: 'cord' as const, label: 'Venetian lift', from: 'Raise', to: 'Lower', value: position, change: setPosition }] : []),
    { kind: isPlantation ? 'louvre' : 'wand', label: 'Slat tilt', from: 'Open', to: 'Close', value: isPlantation ? position : tilt, change: isPlantation ? setPosition : setTilt },
  ];
  return <>{controls.map(control => <MechanismControl key={control.label} {...control} onInteract={onInteract} />)}</>;
}
