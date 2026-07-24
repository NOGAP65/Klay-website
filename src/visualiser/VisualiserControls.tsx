import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tokens } from '../theme';
import { RYNAMIC_COLOURS } from '../data/products';
import { useVisualiserStore, BlindType, HardwareColour } from './useVisualiserStore';

interface VisualiserControlsProps {
  lockedRange?: string; // if passed, hides the blind type row — customer can only configure this type
}

const BLIND_TYPE_OPTIONS: { id: BlindType; label: string }[] = [
  { id: 'blockout', label: 'Blockout' },
  { id: 'sunscreen', label: 'Sunscreen' },
  { id: 'lightfilter', label: 'Light Filter' },
  { id: 'dual', label: 'Dual' },
];

const HARDWARE_OPTIONS: { id: HardwareColour; label: string; hex: string }[] = [
  { id: 'white', label: 'White', hex: '#E8E4DE' },
  { id: 'black', label: 'Black', hex: '#2C2824' },
  { id: 'chrome', label: 'Chrome', hex: '#B0AEA8' },
];

const SIZE_OPTIONS: { id: 'small' | 'medium' | 'large'; label: string; sub: string }[] = [
  { id: 'small', label: 'Small', sub: 'up to 1m' },
  { id: 'medium', label: 'Medium', sub: 'up to 2m' },
  { id: 'large', label: 'Large', sub: 'up to 3m' },
];

const OPERATION_OPTIONS: { id: 'manual' | 'motorised'; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'motorised', label: 'Motorised (+$150)' },
];

function Pill({
  label,
  sub,
  active,
  onClick,
}: {
  label: string;
  sub?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 'auto',
        padding: '8px 16px',
        fontFamily: tokens.body,
        fontSize: 12,
        fontWeight: 500,
        textAlign: 'center',
        cursor: 'pointer',
        border: active ? `1px solid ${tokens.gold}` : '1px solid rgba(28,24,16,0.2)',
        background: active ? tokens.gold : 'transparent',
        color: active ? tokens.dark : 'rgba(28,24,16,0.6)',
      }}
    >
      <div>{label}</div>
      {sub && <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>{sub}</div>}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: tokens.body,
        fontSize: 10,
        color: tokens.gold,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

export default function VisualiserControls({ lockedRange: lockedRangeProp }: VisualiserControlsProps) {
  const [searchParams] = useSearchParams();
  const store = useVisualiserStore();

  // Locks the blind type from either the `lockedRange` prop or a `?range=`
  // URL param (e.g. arriving from a product page) — runs once on mount only.
  useEffect(() => {
    const range = lockedRangeProp ?? searchParams.get('range');
    if (range) {
      store.setLockedRange(range);
      store.setBlindType(range as BlindType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedColour = RYNAMIC_COLOURS.find(c => c.name === store.fabricColour);

  return (
    <>
      {!store.lockedRange && (
        <div>
          <SectionLabel>Blind type</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BLIND_TYPE_OPTIONS.map(t => (
              <Pill
                key={t.id}
                label={t.label}
                active={store.blindType === t.id}
                onClick={() => store.setBlindType(t.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionLabel>Fabric colour</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {RYNAMIC_COLOURS.map(c => (
            <button
              key={c.name}
              aria-label={c.name}
              onClick={() => store.setFabricColour(c.name)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                cursor: 'pointer',
                background: c.hex,
                border: store.fabricColour === c.name ? `2px solid ${tokens.gold}` : '1px solid rgba(28,24,16,0.15)',
                boxShadow: c.name === 'White' ? 'inset 0 0 0 1px rgba(28,24,16,0.08)' : 'none',
              }}
            />
          ))}
        </div>
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: '#1C1810', marginTop: 10 }}>
          {selectedColour?.name ?? ''}
        </div>
      </div>

      <div>
        <SectionLabel>Hardware colour</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {HARDWARE_OPTIONS.map(h => (
            <button
              key={h.id}
              aria-label={h.label}
              onClick={() => store.setHardwareColour(h.id)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                cursor: 'pointer',
                background: h.hex,
                border: store.hardwareColour === h.id ? `2px solid ${tokens.gold}` : '1px solid rgba(28,24,16,0.15)',
              }}
            />
          ))}
        </div>
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: '#1C1810', marginTop: 10 }}>
          {HARDWARE_OPTIONS.find(h => h.id === store.hardwareColour)?.label ?? ''}
        </div>
      </div>

      <div>
        <SectionLabel>Window size</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SIZE_OPTIONS.map(s => (
            <Pill
              key={s.id}
              label={s.label}
              sub={s.sub}
              active={store.windowSize === s.id}
              onClick={() => store.setWindowSize(s.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Operation</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {OPERATION_OPTIONS.map(o => (
            <Pill
              key={o.id}
              label={o.label}
              active={store.operation === o.id}
              onClick={() => store.setOperation(o.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            fontFamily: tokens.body,
            fontSize: 10,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
          }}
        >
          Estimated price
        </div>
        <div style={{ fontFamily: tokens.display, fontSize: 36, fontWeight: 300, color: '#1C1810' }}>
          ${store.getCurrentPrice()}
        </div>
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: 'rgba(28,24,16,0.4)', marginTop: 4 }}>
          + professional installation across Victoria
        </div>
      </div>
    </>
  );
}
