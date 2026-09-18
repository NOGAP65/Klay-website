import { useId } from 'react';

import { tokens } from '@/ds';

import { MechanismArtwork } from './MechanismArtwork';
import { useMechanismDrag } from './useMechanismDrag';

import type { MechanismKind } from './MechanismArtwork';

const INSTRUCTIONS = { crank: 'Turn the handle', cord: 'Pull down to raise, move up to lower', wand: 'Drag to turn', louvre: 'Drag to tilt' };

export function MechanismControl({ kind, label, from = 'Open', to = 'Close', value, change, onInteract }: {
  kind: MechanismKind; label: string; from?: string; to?: string; value: number;
  change: (value: number) => void; onInteract: () => void;
}) {
  const help = useId(), handlers = useMechanismDrag(value, change, onInteract, kind === 'crank' || kind === 'cord' ? kind : 'tilt');
  const setEnd = (next: number) => { onInteract(); change(next); };
  return <div className="preview-mechanism" data-mechanism={kind} style={{ color: tokens.onDark, fontFamily: tokens.body }}>
    <button type="button" className="mechanism-end" aria-label={`${from} — ${label}`} onClick={() => setEnd(0)}><span>{from}</span></button>
    <div className="mechanism-grip" role="slider" aria-label={label} aria-orientation="vertical"
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}
      aria-valuetext={`${Math.round(value * 100)}% ${to === 'Day' ? 'day fabric' : to.toLowerCase()}`}
      aria-describedby={help} tabIndex={0} {...handlers}>
      <MechanismArtwork kind={kind} value={value} />
    </div>
    <button type="button" className="mechanism-end" aria-label={`${to} — ${label}`} onClick={() => setEnd(1)}><span>{to}</span></button>
    <span id={help} className="mechanism-hint">{INSTRUCTIONS[kind]}. Arrow keys adjust; Home selects {from}, End selects {to}.</span>
  </div>;
}
