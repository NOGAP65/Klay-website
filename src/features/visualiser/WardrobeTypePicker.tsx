import { tokens, space, radius, type as typeScale } from '@/ds';

import { useVisualiserStore } from './useVisualiserStore';

export default function WardrobeTypePicker({ onDark = false }: { onDark?: boolean }) {
  const state = useVisualiserStore();
  const selected = state.wardrobeSliding ? 'sliding' : state.wardrobeKind;
  const ink = onDark ? tokens.paper : tokens.ink, paper = onDark ? tokens.ink : tokens.paper;
  return <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
    <legend style={{ ...typeScale.label, textTransform: 'none', color: ink, marginBottom: space.tight }}>Type</legend>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.tight }}>
      {([['built-in', 'Built-in'], ['walk-in', 'Walk-in'], ['sliding', 'Sliding doors']] as const).map(([id, label]) =>
        <button key={id} type="button" aria-pressed={selected === id}
          onClick={() => id === 'sliding' ? state.showSlidingDoors() : state.setWardrobeKind(id)}
          style={{ ...typeScale.label, letterSpacing: 'normal', textTransform: 'none', minHeight: 44,
            padding: `${space.tight}px ${space.item}px`, borderRadius: radius.md, cursor: 'pointer',
            border: `1px solid ${onDark ? tokens.onDarkEdge : tokens.lineStrong}`,
            background: selected === id ? ink : paper, color: selected === id ? paper : ink }}>{label}</button>)}
    </div>
  </fieldset>;
}
