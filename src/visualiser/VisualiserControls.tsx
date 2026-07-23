import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tokens } from '../theme';
import { useVisualiserStore } from './useVisualiserStore';

interface VisualiserControlsProps {
  lockedRange?: string; // if passed, hides range switcher — customer can only configure this range
}

const RANGE_OPTIONS = [
  { id: 'blockout', label: 'Blockout' },
  { id: 'sunscreen', label: 'Sunscreen' },
  { id: 'dual', label: 'Dual' },
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

const HARDWARE_SWATCH_STYLE: Record<string, React.CSSProperties> = {
  White: { background: '#F0EDE8' },
  Black: { background: '#2A2A2A' },
  Chrome: { background: 'linear-gradient(135deg,#e8e8e8,#a0a0a0)' },
};

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

  // Locks the range from either the `lockedRange` prop or a `?range=` URL
  // param (e.g. arriving from a product page) — runs once on mount only.
  useEffect(() => {
    const range = lockedRangeProp ?? searchParams.get('range');
    if (range) {
      store.setLockedRange(range);
      store.setRange(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!store.lockedRange && (
        <div>
          <SectionLabel>Range</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {RANGE_OPTIONS.map(r => (
              <Pill
                key={r.id}
                label={r.label}
                active={store.selectedRange === r.id}
                onClick={() => store.setRange(r.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionLabel>Hardware finish</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {['White', 'Black', 'Chrome'].map(hw => (
            <button
              key={hw}
              aria-label={hw}
              onClick={() => store.setHardware(hw)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                cursor: 'pointer',
                border: store.selectedHardware === hw ? `2px solid ${tokens.gold}` : '1px solid rgba(28,24,16,0.15)',
                ...HARDWARE_SWATCH_STYLE[hw],
              }}
            />
          ))}
        </div>
        <div style={{ fontFamily: tokens.display, fontSize: 18, color: '#1C1810', marginTop: 12 }}>
          {store.getCurrentSku()?.name ?? ''}
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
              active={store.controlType === o.id}
              onClick={() => store.setControlType(o.id)}
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
