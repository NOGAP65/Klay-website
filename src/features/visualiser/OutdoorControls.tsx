import { ColourSample, tokens, space, radius, type as typeScale } from '@/ds';

import { useVisualiserStore } from './useVisualiserStore';
import { coloursFor } from './windowProducts';

import type { ReactNode } from 'react';

function Group({ label, children }: { label: string; children: ReactNode }) {
  return <fieldset style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
    <legend style={{ ...typeScale.label, textTransform: 'none', marginBottom: space.tight }}>{label}</legend>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.tight }}>{children}</div>
  </fieldset>;
}
export default function OutdoorControls({ onDark = false }: { onDark?: boolean }) {
  const category = useVisualiserStore(s => s.productCategory), colour = useVisualiserStore(s => s.fabricColour);
  const size = useVisualiserStore(s => s.windowSize), operation = useVisualiserStore(s => s.operation);
  const setColour = useVisualiserStore(s => s.setFabricColour), setSize = useVisualiserStore(s => s.setWindowSize);
  const setOperation = useVisualiserStore(s => s.setOperation), isShutter = category === 'roller-shutter';
  const ink = onDark ? tokens.paper : tokens.ink, paper = onDark ? tokens.ink : tokens.paper;
  const choice = (selected: boolean) => ({ ...typeScale.label, letterSpacing: 'normal', textTransform: 'none' as const,
    minHeight: 44, padding: `${space.tight}px ${space.item}px`, borderRadius: radius.md, cursor: 'pointer',
    background: selected ? ink : paper, color: selected ? paper : ink,
    border: `1px solid ${onDark ? tokens.onDarkEdge : tokens.lineStrong}` });
  return <div style={{ display: 'grid', gap: space.lg, color: ink }}>
    <h2 style={{ ...typeScale.micro, margin: 0 }}>Your {isShutter ? 'roller shutter' : 'zip screen'}</h2>
    <Group label={isShutter ? 'Colour' : 'Mesh colour'}>
      {coloursFor(category).map(sample => <button type="button" key={sample.name} aria-label={sample.name}
        title={sample.name} aria-pressed={colour === sample.name} onClick={() => setColour(sample.name)}
        style={{ ...choice(false), minWidth: 44, padding: space.xs, border: `2px solid ${colour === sample.name ? tokens.accent : tokens.lineStrong}` }}>
        <span style={{ display: 'block', position: 'relative', width: 30, height: 30 }}><ColourSample colour={sample.hex} /></span>
      </button>)}
      <span style={{ ...typeScale.label, width: '100%', textTransform: 'none' }}>{colour}</span>
    </Group>
    <Group label="Opening size">
      {(['small', 'medium', 'large'] as const).map(value => <button type="button" key={value} aria-pressed={size === value}
        style={choice(size === value)} onClick={() => setSize(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}
    </Group>
    <Group label="Operation">
      {(['manual', 'motorised'] as const).map((value, index) => <button type="button" key={value} aria-pressed={operation === value}
        style={choice(operation === value)} onClick={() => setOperation(value)}>{(isShutter ? ['Crank', 'Battery'] : ['Manual', 'Motorised'])[index]}</button>)}
    </Group>
    <p style={{ ...typeScale.label, textTransform: 'none', margin: 0 }}>Price confirmed at measure.</p>
  </div>;
}
