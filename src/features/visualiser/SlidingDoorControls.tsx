import { ColourSample, tokens, space, radius, type as typeScale } from '@/ds';
import { slidingMaterials, slidingMetals, slidingOpenings } from '@/features/joinery';

import { useVisualiserStore } from './useVisualiserStore';
import WardrobeTypePicker from './WardrobeTypePicker';

import type { ReactNode } from 'react';

function ChoiceGroup({ label, children }: { label: string; children: ReactNode }) {
  return <fieldset style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
    <legend style={{ ...typeScale.label, textTransform: 'none', marginBottom: space.tight }}>{label}</legend>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.tight }}>{children}</div>
  </fieldset>;
}
export default function SlidingDoorControls({ onDark = false }: { onDark?: boolean }) {
  const config = useVisualiserStore(state => state.slidingDoor), change = useVisualiserStore(state => state.setSlidingDoor);
  const ink = onDark ? tokens.paper : tokens.ink, paper = onDark ? tokens.ink : tokens.paper;
  const choiceStyle = (isSelected: boolean) => ({ ...typeScale.label, letterSpacing: 'normal', textTransform: 'none' as const,
    minHeight: 44, padding: `${space.tight}px ${space.item}px`, borderRadius: radius.md, cursor: 'pointer',
    background: isSelected ? ink : paper, color: isSelected ? paper : ink,
    border: `1px solid ${onDark ? tokens.onDarkEdge : tokens.lineStrong}` });
  return <div style={{ display: 'grid', gap: space.lg, color: ink }}>
    <h2 style={{ ...typeScale.micro, margin: 0, paddingBottom: space.item, borderBottom: `1px solid ${onDark ? tokens.onDarkEdge : tokens.line}` }}>Your wardrobe doors</h2>
    <WardrobeTypePicker onDark={onDark} />
    <ChoiceGroup label="Door style">
      {(['framed', 'shaker'] as const).map(style => <button type="button" key={style} aria-pressed={config.style === style}
        onClick={() => change({ style })} style={choiceStyle(config.style === style)}>{style === 'framed' ? 'Framed' : 'Shaker'}</button>)}
    </ChoiceGroup>
    <ChoiceGroup label="Doors">
      {(['two', 'three'] as const).map(panels => <button type="button" key={panels} aria-pressed={config.panels === panels}
        onClick={() => change({ panels })} style={choiceStyle(config.panels === panels)}>{panels === 'two' ? 'Two doors' : 'Three doors'}</button>)}
    </ChoiceGroup>
    <ChoiceGroup label="Door material & colour">
      {slidingMaterials(config.style).map(material => <button type="button" key={material.name} aria-label={material.name}
        title={material.name} aria-pressed={config.material === material.name} onClick={() => change({ material: material.name })}
        style={{ padding: space.xs, borderRadius: radius.sm, cursor: 'pointer', background: paper,
          border: `2px solid ${config.material === material.name ? tokens.accent : onDark ? tokens.onDarkEdge : tokens.line}` }}>
        <span style={{ width: 28, height: 28, display: 'block', position: 'relative' }}><ColourSample colour={material.hex} texture={material.texture} mirror={material.mirror} /></span>
      </button>)}
      <span style={{ ...typeScale.label, width: '100%', textTransform: 'none' }}>{config.material}</span>
    </ChoiceGroup>
    <ChoiceGroup label="Hardware colour">
      {slidingMetals(config.style).map(colour => <button type="button" key={colour.name} aria-label={colour.name}
        title={colour.name} aria-pressed={config.hardware === colour.name} onClick={() => change({ hardware: colour.name })}
        style={{ padding: space.xs, borderRadius: radius.sm, cursor: 'pointer', background: paper,
          border: `2px solid ${config.hardware === colour.name ? tokens.accent : onDark ? tokens.onDarkEdge : tokens.line}` }}>
        <span style={{ width: 28, height: 28, display: 'block', position: 'relative' }}><ColourSample colour={colour.hex} /></span>
      </button>)}
      <span style={{ ...typeScale.label, width: '100%', textTransform: 'none' }}>{config.hardware}</span>
    </ChoiceGroup>
    <label style={{ display: 'grid', gap: space.tight, ...typeScale.label, textTransform: 'none' }}>
      {config.style === 'framed' ? 'Dimensions (H × W)' : 'Opening size range (H × W)'}
      <select value={config.opening} onChange={event => change({ opening: event.target.value })}
        style={{ ...choiceStyle(false), width: '100%', maxWidth: '100%' }}>
        {slidingOpenings(config.style, config.panels).map(opening => <option key={opening.id} value={opening.id}>{opening.label}</option>)}
      </select>
    </label>
    <p style={{ ...typeScale.label, textTransform: 'none', margin: 0 }}>Price confirmed at measure.</p>
  </div>;
}
