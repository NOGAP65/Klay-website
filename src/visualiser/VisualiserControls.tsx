import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tokens } from '../theme';
import { HARDWARE_HEX, HARDWARE_OPTIONS, RYNAMIC_COLOURS } from '../data/products';
import { useVisualiserStore, BlindType, CurtainType, CurtainOperation, CurtainMount, CurtainSize } from './useVisualiserStore';

interface VisualiserControlsProps {
  lockedRange?: string; // if passed, hides the blind type row — customer can only configure this type
  compact?: boolean; // if true, uses tighter spacing for homepage embed
  showCurtainControls?: boolean; // if true, show curtain controls when curtain category is active
}

const RADIUS = 2;

const BLIND_TYPE_OPTIONS: { id: BlindType; label: string }[] = [
  { id: 'blockout', label: 'Blockout' },
  { id: 'sunscreen', label: 'Sunscreen' },
  { id: 'lightfilter', label: 'Light Filter' },
  { id: 'dual', label: 'Dual' },
];

const SIZE_OPTIONS: { id: 'small' | 'medium' | 'large'; label: string; sub: string }[] = [
  { id: 'small', label: 'Small', sub: 'to 1m' },
  { id: 'medium', label: 'Medium', sub: 'to 2m' },
  { id: 'large', label: 'Large', sub: 'to 3m' },
];

const OPERATION_OPTIONS: { id: 'manual' | 'motorised'; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'motorised', label: 'Motorised +$150' },
];

const CURTAIN_TYPE_OPTIONS: { id: CurtainType; label: string }[] = [
  { id: 'blockout', label: 'Blockout' },
  { id: 'sheer', label: 'Sheer' },
];

const CURTAIN_SIZE_OPTIONS: { id: CurtainSize; label: string; sub: string }[] = [
  { id: 'small', label: 'Small', sub: 'up to 1.2m' },
  { id: 'medium', label: 'Medium', sub: 'up to 1.8m' },
  { id: 'large', label: 'Large', sub: 'up to 2.4m' },
  { id: 'xl', label: 'XL', sub: 'up to 3m' },
];

const CURTAIN_OPERATION_OPTIONS: { id: CurtainOperation; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'motorised', label: 'Motorised +$200' },
];

const CURTAIN_MOUNT_OPTIONS: { id: CurtainMount; label: string }[] = [
  { id: 'ceiling', label: 'Ceiling Mount' },
  { id: 'window', label: 'Window Mount' },
];

// ---------------------------------------------------------------------------
// Primitives
//
// One selection language throughout: the active thing gains a gold border,
// everything else carries a hairline. Pills additionally fill, because they
// have no colour of their own to show. Previously pills and swatches each
// had their own idiom and the labels were all gold, which left six equally
// loud blocks and no sense of what mattered.
// ---------------------------------------------------------------------------

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
        padding: sub ? '7px 14px' : '9px 14px',
        borderRadius: RADIUS,
        fontFamily: tokens.body,
        fontSize: 11.5,
        fontWeight: 500,
        lineHeight: 1.25,
        textAlign: 'center',
        cursor: 'pointer',
        border: `1px solid ${active ? tokens.gold : tokens.lineStrong}`,
        background: active ? tokens.gold : 'transparent',
        color: active ? tokens.ink : tokens.inkSoft,
        transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
      }}
    >
      <span>{label}</span>
      {sub && <span style={{ fontSize: 9.5, marginTop: 1, opacity: 0.75 }}>{sub}</span>}
    </button>
  );
}

function Swatch({
  hex,
  label,
  active,
  onClick,
  compact = false,
}: {
  hex: string;
  label: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const size = compact ? 22 : 26;
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        cursor: 'pointer',
        padding: 0,
        background: hex,
        border: `1px solid ${tokens.line}`,
        boxShadow: active ? `0 0 0 2px ${tokens.gold}` : `inset 0 0 0 1px ${tokens.lineFaint}`,
        transition: 'box-shadow 0.2s ease',
      }}
    />
  );
}

/** Gold, uppercase — used twice, for the two tiers only. */
function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: tokens.body,
        fontSize: 10,
        color: tokens.gold,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        paddingBottom: 10,
        marginBottom: 18,
        borderBottom: `1px solid ${tokens.line}`,
      }}
    >
      {children}
    </div>
  );
}

/** Ink, sentence case — one per control. Deliberately quieter than the tier
 * heading above it, so the eye reads groups first and fields second. */
function Field({
  label,
  caption,
  children,
}: {
  label: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 9,
        }}
      >
        <span style={{ fontFamily: tokens.body, fontSize: 11, fontWeight: 500, color: tokens.ink }}>
          {label}
        </span>
        {caption && (
          <span style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkFaint }}>
            {caption}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function VisualiserControls({ lockedRange: lockedRangeProp, compact = false, showCurtainControls = false }: VisualiserControlsProps) {
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
  const selectedHardware = HARDWARE_OPTIONS.find(h => h.id === store.hardwareColour);
  const isCurtain = showCurtainControls && store.productCategory === 'curtain';

  // Curtain controls
  if (isCurtain) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 16 : 30 }}>
        <section>
          <GroupHeading>Your curtain</GroupHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 20 }}>
            <Field label="Type">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CURTAIN_TYPE_OPTIONS.map(t => (
                  <Pill
                    key={t.id}
                    label={t.label}
                    active={store.curtainType === t.id}
                    onClick={() => store.setCurtainType(t.id)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Fabric colour" caption={selectedColour?.name}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 9, marginLeft: 2, paddingRight: 2 }}>
                {RYNAMIC_COLOURS.map(c => (
                  <Swatch
                    key={c.name}
                    hex={c.hex}
                    label={c.name}
                    active={store.fabricColour === c.name}
                    onClick={() => store.setFabricColour(c.name)}
                    compact={compact}
                  />
                ))}
              </div>
            </Field>
          </div>
        </section>

        <section>
          <GroupHeading>Details</GroupHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 20 }}>
            <Field label="Hardware" caption={selectedHardware?.label}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 9, marginLeft: 2, paddingRight: 2 }}>
                {HARDWARE_OPTIONS.map(h => (
                  <Swatch
                    key={h.id}
                    hex={HARDWARE_HEX[h.id]}
                    label={h.label}
                    active={store.hardwareColour === h.id}
                    onClick={() => store.setHardwareColour(h.id)}
                    compact={compact}
                  />
                ))}
              </div>
            </Field>

            <Field label="Window size">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CURTAIN_SIZE_OPTIONS.map(s => (
                  <Pill
                    key={s.id}
                    label={s.label}
                    sub={compact ? undefined : s.sub}
                    active={store.curtainSize === s.id}
                    onClick={() => store.setCurtainSize(s.id)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Operation">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CURTAIN_OPERATION_OPTIONS.map(o => (
                  <Pill
                    key={o.id}
                    label={o.label}
                    active={store.curtainOperation === o.id}
                    onClick={() => store.setCurtainOperation(o.id)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Mount">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CURTAIN_MOUNT_OPTIONS.map(m => (
                  <Pill
                    key={m.id}
                    label={m.label}
                    active={store.curtainMount === m.id}
                    onClick={() => store.setCurtainMount(m.id)}
                  />
                ))}
              </div>
            </Field>

            {/* Heading is not a choice — the range is wave fold only. Stated
                rather than dropped, because it is a spec the customer is
                buying and its absence would read as an omission. */}
            <Field label="Heading">
              <div style={{ fontFamily: tokens.body, fontSize: 11.5, color: tokens.inkSoft }}>
                Wave fold — one wave every 160mm of track
              </div>
            </Field>
          </div>
        </section>

        <div
          style={{
            background: tokens.cream,
            border: `1px solid ${tokens.line}`,
            borderRadius: RADIUS,
            padding: compact ? '12px 14px' : '16px 18px',
          }}
        >
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
          <div
            style={{
              fontFamily: tokens.display,
              fontSize: compact ? 32 : 38,
              fontWeight: 300,
              lineHeight: 1.1,
              color: tokens.ink,
              marginTop: compact ? 4 : 6,
            }}
          >
            ${store.getCurtainPrice()}
          </div>
          <div style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkFaint, marginTop: 4 }}>
            + installation across Australia
          </div>
        </div>
      </div>
    );
  }

  // Blind controls (default)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 16 : 30 }}>
      {/* --- TIER 1: the decisions that change what you see ---------------- */}
      <section>
        <GroupHeading>Your blind</GroupHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 20 }}>
          {!store.lockedRange && (
            <Field label="Type">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {BLIND_TYPE_OPTIONS.map(t => (
                  <Pill
                    key={t.id}
                    label={t.label}
                    active={store.blindType === t.id}
                    onClick={() => store.setBlindType(t.id)}
                  />
                ))}
              </div>
            </Field>
          )}

          <Field label="Fabric colour" caption={selectedColour?.name}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 9, marginLeft: 2, paddingRight: 2 }}>
              {RYNAMIC_COLOURS.map(c => (
                <Swatch
                  key={c.name}
                  hex={c.hex}
                  label={c.name}
                  active={store.fabricColour === c.name}
                  onClick={() => store.setFabricColour(c.name)}
                  compact={compact}
                />
              ))}
            </div>
          </Field>
        </div>
      </section>

      {/* --- TIER 2: specification, quieter ------------------------------- */}
      <section>
        <GroupHeading>Details</GroupHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 20 }}>
          <Field label="Hardware" caption={selectedHardware?.label}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 9, marginLeft: 2, paddingRight: 2 }}>
              {HARDWARE_OPTIONS.map(h => (
                <Swatch
                  key={h.id}
                  hex={HARDWARE_HEX[h.id]}
                  label={h.label}
                  active={store.hardwareColour === h.id}
                  onClick={() => store.setHardwareColour(h.id)}
                  compact={compact}
                />
              ))}
            </div>
          </Field>

          <Field label="Window size">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SIZE_OPTIONS.map(s => (
                <Pill
                  key={s.id}
                  label={s.label}
                  sub={compact ? undefined : s.sub}
                  active={store.windowSize === s.id}
                  onClick={() => store.setWindowSize(s.id)}
                />
              ))}
            </div>
          </Field>

          <Field label="Operation">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {OPERATION_OPTIONS.map(o => (
                <Pill
                  key={o.id}
                  label={o.label}
                  active={store.operation === o.id}
                  onClick={() => store.setOperation(o.id)}
                />
              ))}
            </div>
          </Field>
        </div>
      </section>

      {/* --- PRICE: boxed, so the conversion anchor isn't just more text --- */}
      <div
        style={{
          background: tokens.cream,
          border: `1px solid ${tokens.line}`,
          borderRadius: RADIUS,
          padding: compact ? '12px 14px' : '16px 18px',
        }}
      >
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
        <div
          style={{
            fontFamily: tokens.display,
            fontSize: compact ? 32 : 38,
            fontWeight: 300,
            lineHeight: 1.1,
            color: tokens.ink,
            marginTop: compact ? 4 : 6,
          }}
        >
          ${store.getCurrentPrice()}
        </div>
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkFaint, marginTop: 4 }}>
          + installation across Australia
        </div>
      </div>
    </div>
  );
}
