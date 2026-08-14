import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tokens } from '../theme';
import { HARDWARE_HEX, HARDWARE_OPTIONS } from '../data/products';
import { coloursFor, useVisualiserStore, BlindType, CurtainType, CurtainOperation, CurtainMount, CurtainSize } from './useVisualiserStore';

interface VisualiserControlsProps {
  lockedRange?: string; // if passed, hides the blind type row — customer can only configure this type
  compact?: boolean; // if true, uses tighter spacing for homepage embed
  showCurtainControls?: boolean; // if true, show curtain controls when curtain category is active
  /** Flips the panel for a dark ground. Opt-in, and false everywhere but the
   * homepage showcase — VisualiserPage, ProductDetailPage and VisualiserSection
   * all put this on cream and must keep the light treatment. */
  onDark?: boolean;
}

const RADIUS = 2;

// ---------------------------------------------------------------------------
// The two grounds this panel can sit on.
//
// Every colour below is resolved through here rather than reached for on
// `tokens` directly. The panel had thirty-odd inline styles that each assumed a
// cream ground, and adding a dark variant by editing them one at a time is how
// half of them get missed — the ones that go wrong are never the labels you
// notice, they are the hairline under a group heading and the ring on an
// unselected swatch.
//
// Gold is absent on purpose: it is the one colour that holds on both grounds,
// which is why the active pill, the group headings and the selection ring are
// unchanged between the two.
// ---------------------------------------------------------------------------

function skin(onDark: boolean) {
  return {
    /** Field labels — the loudest text in the panel. */
    label: onDark ? tokens.warmWhite : tokens.ink,
    /** The value beside a label, and the line under the price. */
    caption: onDark ? tokens.onDarkMuted : tokens.inkFaint,
    /** Unselected pill text, and the stated-not-chosen heading spec. */
    quiet: onDark ? tokens.onDarkMuted : tokens.inkSoft,
    /** Borders meant to be seen: pill outlines, swatch rings. */
    edge: onDark ? tokens.onDarkEdge : tokens.lineStrong,
    /** Borders meant to be felt: group rules, the price box's edge. */
    hairline: onDark ? tokens.onDarkLine : tokens.line,
    /** The price box's fill. On dark it is a lift off the card rather than a
     * panel of its own colour — a cream box on a black card would read as a
     * hole punched in it. */
    boxFill: onDark ? 'rgba(245,242,237,0.06)' : tokens.cream,
  };
}

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
  onDark = false,
}: {
  label: string;
  sub?: string;
  active: boolean;
  onClick: () => void;
  onDark?: boolean;
}) {
  const sk = skin(onDark);
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
        border: `1px solid ${active ? tokens.gold : sk.edge}`,
        // The active pill is gold-filled with ink on it on BOTH grounds. It is
        // the one thing in the panel that should not change with the ground —
        // the selection has to read the same wherever this is embedded.
        background: active ? tokens.gold : 'transparent',
        color: active ? tokens.ink : sk.quiet,
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
  onDark = false,
}: {
  hex: string;
  label: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
  onDark?: boolean;
}) {
  const size = compact ? 22 : 26;
  const sk = skin(onDark);
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
        border: `1px solid ${sk.edge}`,
        // The inner hairline is what keeps a near-white swatch from dissolving
        // into a cream ground. On black the problem inverts — the pale swatches
        // separate on their own and it is the dark end of the card that needs
        // help — so the inset goes light rather than ink.
        boxShadow: active
          ? `0 0 0 2px ${tokens.gold}`
          : `inset 0 0 0 1px ${onDark ? 'rgba(245,242,237,0.14)' : tokens.lineFaint}`,
        transition: 'box-shadow 0.2s ease',
      }}
    />
  );
}

/** Gold, uppercase — used twice, for the two tiers only. The gold is unchanged
 * on a dark ground; only the rule under it has to move. */
function GroupHeading({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
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
        borderBottom: `1px solid ${skin(onDark).hairline}`,
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
  onDark = false,
}: {
  label: string;
  caption?: string;
  children: React.ReactNode;
  onDark?: boolean;
}) {
  const sk = skin(onDark);
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
        <span style={{ fontFamily: tokens.body, fontSize: 11, fontWeight: 500, color: sk.label }}>
          {label}
        </span>
        {caption && (
          <span style={{ fontFamily: tokens.body, fontSize: 11, color: sk.caption }}>
            {caption}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function VisualiserControls({ lockedRange: lockedRangeProp, compact = false, showCurtainControls = false, onDark = false }: VisualiserControlsProps) {
  const [searchParams] = useSearchParams();
  const store = useVisualiserStore();
  // `sk`, not `s`: the options loops below all bind `s` as their map
  // variable, and a skin called `s` would be shadowed inside every one.
  const sk = skin(onDark);

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

  const selectedHardware = HARDWARE_OPTIONS.find(h => h.id === store.hardwareColour);
  const isCurtain = showCurtainControls && store.productCategory === 'curtain';

  // The swatch grid is whichever card this category actually offers — blinds and
  // curtains are different cloth and different ranges. Keyed off the store's own
  // category rather than `isCurtain`, which is additionally gated on the host
  // passing showCurtainControls, so the swatches can never end up from a
  // different range than the colour the renderer is resolving.
  const palette = coloursFor(store.productCategory);
  const selectedColour = palette.find(c => c.name === store.fabricColour);

  // Curtain controls
  if (isCurtain) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 16 : 30 }}>
        <section>
          <GroupHeading onDark={onDark}>Your curtain</GroupHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 20 }}>
            <Field onDark={onDark} label="Type">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CURTAIN_TYPE_OPTIONS.map(t => (
                  <Pill
                    onDark={onDark}
                    key={t.id}
                    label={t.label}
                    active={store.curtainType === t.id}
                    onClick={() => store.setCurtainType(t.id)}
                  />
                ))}
              </div>
            </Field>

            <Field onDark={onDark} label="Fabric colour" caption={selectedColour?.name}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 9, marginLeft: 2, paddingRight: 2 }}>
                {palette.map(c => (
                  <Swatch
                    onDark={onDark}
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
          <GroupHeading onDark={onDark}>Details</GroupHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 20 }}>
            <Field onDark={onDark} label="Hardware" caption={selectedHardware?.label}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 9, marginLeft: 2, paddingRight: 2 }}>
                {HARDWARE_OPTIONS.map(h => (
                  <Swatch
                    onDark={onDark}
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

            <Field onDark={onDark} label="Window size">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CURTAIN_SIZE_OPTIONS.map(s => (
                  <Pill
                    onDark={onDark}
                    key={s.id}
                    label={s.label}
                    sub={compact ? undefined : s.sub}
                    active={store.curtainSize === s.id}
                    onClick={() => store.setCurtainSize(s.id)}
                  />
                ))}
              </div>
            </Field>

            <Field onDark={onDark} label="Operation">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CURTAIN_OPERATION_OPTIONS.map(o => (
                  <Pill
                    onDark={onDark}
                    key={o.id}
                    label={o.label}
                    active={store.curtainOperation === o.id}
                    onClick={() => store.setCurtainOperation(o.id)}
                  />
                ))}
              </div>
            </Field>

            <Field onDark={onDark} label="Mount">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CURTAIN_MOUNT_OPTIONS.map(m => (
                  <Pill
                    onDark={onDark}
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
            <Field onDark={onDark} label="Heading">
              <div style={{ fontFamily: tokens.body, fontSize: 11.5, color: sk.quiet }}>
                Wave fold — one wave every 160mm of track
              </div>
            </Field>
          </div>
        </section>

        <div
          style={{
            background: sk.boxFill,
            border: `1px solid ${sk.hairline}`,
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
              color: sk.label,
              marginTop: compact ? 4 : 6,
            }}
          >
            ${store.getCurtainPrice()}
          </div>
          <div style={{ fontFamily: tokens.body, fontSize: 11, color: sk.caption, marginTop: 4 }}>
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
        <GroupHeading onDark={onDark}>Your blind</GroupHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 20 }}>
          {!store.lockedRange && (
            <Field onDark={onDark} label="Type">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {BLIND_TYPE_OPTIONS.map(t => (
                  <Pill
                    onDark={onDark}
                    key={t.id}
                    label={t.label}
                    active={store.blindType === t.id}
                    onClick={() => store.setBlindType(t.id)}
                  />
                ))}
              </div>
            </Field>
          )}

          <Field onDark={onDark} label="Fabric colour" caption={selectedColour?.name}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 9, marginLeft: 2, paddingRight: 2 }}>
              {palette.map(c => (
                <Swatch
                  onDark={onDark}
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
        <GroupHeading onDark={onDark}>Details</GroupHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 12 : 20 }}>
          <Field onDark={onDark} label="Hardware" caption={selectedHardware?.label}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 9, marginLeft: 2, paddingRight: 2 }}>
              {HARDWARE_OPTIONS.map(h => (
                <Swatch
                  onDark={onDark}
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

          <Field onDark={onDark} label="Window size">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SIZE_OPTIONS.map(s => (
                <Pill
                  onDark={onDark}
                  key={s.id}
                  label={s.label}
                  sub={compact ? undefined : s.sub}
                  active={store.windowSize === s.id}
                  onClick={() => store.setWindowSize(s.id)}
                />
              ))}
            </div>
          </Field>

          <Field onDark={onDark} label="Operation">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {OPERATION_OPTIONS.map(o => (
                <Pill
                  onDark={onDark}
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
          background: sk.boxFill,
          border: `1px solid ${sk.hairline}`,
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
            color: sk.label,
            marginTop: compact ? 4 : 6,
          }}
        >
          ${store.getCurrentPrice()}
        </div>
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: sk.caption, marginTop: 4 }}>
          + installation across Australia
        </div>
      </div>
    </div>
  );
}
