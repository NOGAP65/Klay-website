import { useId } from 'react';

import { tokens } from '@/ds';

import { MechanismArtwork } from './MechanismArtwork';
import { useMechanismDrag } from './useMechanismDrag';
import { useMechanismMotion } from './useMechanismMotion';

import type { MechanismKind } from './MechanismArtwork';

export function MechanismControl({ kind, label, from = 'Open', to = 'Close', value, change, onInteract }: {
  kind: MechanismKind; label: string; from?: string; to?: string; value: number;
  change: (value: number) => void; onInteract: () => void;
}) {
  const help = useId(), { moveTo, stop } = useMechanismMotion(value, change);
  const interrupt = () => { stop(); onInteract(); };
  const handlers = useMechanismDrag(value, change, interrupt);
  const setEnd = (next: number) => { onInteract(); moveTo(next); };
  return <div className="preview-mechanism" data-mechanism={kind} style={{ color: tokens.onDark, fontFamily: tokens.body }}>
    <button type="button" className="mechanism-end" aria-label={`${from} — ${label}`} onClick={() => setEnd(0)}><span>↑ {from}</span></button>
    <div className="mechanism-grip" role="slider" aria-label={label} aria-orientation="vertical"
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}
      aria-valuetext={`${Math.round(value * 100)}% ${to === 'Day' ? 'day fabric' : to.toLowerCase()}`}
      aria-describedby={help} tabIndex={0} {...handlers}>
      <MechanismArtwork kind={kind} value={value} />
    </div>
    <button type="button" className="mechanism-end" aria-label={`${to} — ${label}`} onClick={() => setEnd(1)}><span>↓ {to}</span></button>
    <span id={help} className="mechanism-hint">Tap {from} or {to}, or drag up and down. Arrow keys adjust; Home selects {from}, End selects {to}.</span>
  </div>;
}
