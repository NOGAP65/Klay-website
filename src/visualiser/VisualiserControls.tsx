import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { radius, tokens, space, type as typeScale } from '../theme';
import { formatAUD } from '../lib/pricing';
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
  /** Set false to leave the price box out, when the host renders its own.
   *
   * The homepage showcase does: it prices a whole job of windows rather than the
   * one configuration this panel edits, and it has to put that figure LAST, below
   * its own window controls. Everywhere else the price belongs to this panel and
   * the default stands. */
  showPrice?: boolean;
}


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
    /** Group headings, and the micro label inside the price box.
     *
     * These were `tokens.onDark` on BOTH grounds, which is PAPER — white
     * uppercase text on a cream card. On the three light hosts (VisualiserPage,
     * ProductDetailPage, VisualiserSection) that rendered "YOUR BLIND",
     * "DETAILS" and "ESTIMATED PRICE" as invisible text over a visible hairline,
     * so each tier arrived as a bare rule with an unexplained gap above it.
     * Caught on the running /visualiser page, not in review — white on cream is
     * exactly the kind of miss the skin exists to prevent, and this one dated
     * from the palette losing its gold: the headings used to BE gold, which held
     * on both grounds, and nothing replaced it for the light one. */
    heading: onDark ? tokens.onDark : tokens.ink,
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
    boxFill: onDark ? 'rgba(248,248,248,0.06)' : tokens.cream,

    // --- THE SELECTED THING ------------------------------------------------
    //
    // The lozenge, and it HAS to invert with the ground. `fillStrong` is INK
    // and the homepage card's ground is also INK, so a selected pill on it was
    // a #1D1D1D lozenge on #1D1D1D — no shape at all, just its white label
    // floating where a filled pill should be. Measured on the running page:
    // Blockout, Medium, Manual and the BLINDS tab all read as bare text while
    // every UNSELECTED option beside them carried a visible outline, which is
    // the selection state inverted.
    //
    // What has to hold on both grounds is that the selected option is the one
    // wearing a solid lozenge with the ground's own colour as its text. That is
    // ink-on-cream here and paper-on-ink there — the same relationship, not the
    // same two hex values.
    fillActive: onDark ? tokens.warmWhite : tokens.fillStrong,
    onFillActive: onDark ? tokens.ink : tokens.onFillStrong,
    edgeActive: onDark ? tokens.warmWhite : tokens.line,
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
        justifyContent: 'center',
        // ONE PILL: height 32, 20 either side, radius 2. It was three heights
        // across the site (27 / 34.38 / 37) at three sizes, and the two paddings
        // here — 7px with a sub-label and 9px without — meant the same row of
        // pills changed height depending on which options it was showing.
        //
        // A pill carrying a sub-label needs the room, so that variant is the one
        // exception and it takes the next step up rather than an arbitrary
        // number.
        height: sub ? space.xl : 32,
        padding: `0 ${space.md}px`,
        boxSizing: 'border-box',
        borderRadius: radius.md,
        ...typeScale.label,
        letterSpacing: 'normal',
        textTransform: 'none',
        lineHeight: 1.25,
        textAlign: 'center',
        cursor: 'pointer',
        border: `1px solid ${active ? sk.edgeActive : sk.edge}`,
        // The active pill is a solid lozenge carrying the ground's own colour as
        // its text — ink-on-cream on a light panel, paper-on-ink on the black
        // card. See `fillActive` in skin() for why this is a relationship rather
        // than one fixed pair of hexes: pinning it to ink on both grounds is
        // what made the selected pill disappear into the homepage card.
        background: active ? sk.fillActive : 'transparent',
        color: active ? sk.onFillActive : sk.quiet,
        transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
      }}
    >
      <span>{label}</span>
      {sub && <span style={{ ...typeScale.micro, letterSpacing: 'normal', textTransform: 'none', opacity: 0.75 }}>{sub}</span>}
    </button>
  );
}

function Swatch({
  hex,
  label,
  active,
  onClick,
  onDark = false,
}: {
  hex: string;
  label: string;
  active: boolean;
  onClick: () => void;
  onDark?: boolean;
}) {
  // ONE SWATCH: 20 x 20 at every size, radius 2. It was 22 or 26 here, 13 on
  // the range tiles and 20 in the visualiser controls — and this one was a
  // circle while the configurator's was a 1px-radius square, so the same object
  // was drawn as two different shapes on one page.
  const size = 20;
  const sk = skin(onDark);
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: radius.sm,
        cursor: 'pointer',
        padding: 0,
        background: hex,
        border: `1px solid ${sk.edge}`,
        // The inner hairline is what keeps a near-white swatch from dissolving
        // into a cream ground. On black the problem inverts — the pale swatches
        // separate on their own and it is the dark end of the card that needs
        // help — so the inset goes light rather than ink.
        // The ring inverts with the ground for the same reason the pill's fill
        // does: an ink ring drawn on the ink card was 2px of the card's own
        // colour, so the chosen colour looked no different from the thirteen
        // beside it. It sits OUTSIDE the swatch, so it has to contrast with the
        // ground rather than with the fabric.
        boxShadow: active
          ? `0 0 0 2px ${sk.fillActive}`
          : `inset 0 0 0 1px ${onDark ? 'rgba(248,248,248,0.14)' : tokens.lineFaint}`,
        transition: 'box-shadow 0.2s ease',
      }}
    />
  );
}

/** Gold, uppercase — used twice, for the two tiers only. The gold is unchanged
 * on a dark ground; only the rule under it has to move.
 *
 * Exported so a host adding a group of its own gets THIS heading rather than an
 * imitation of it. The homepage showcase had hand-copied the Field label markup
 * for its window stepper, and a copy is a thing that stops matching. */
export function GroupHeading({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  const sk = skin(onDark);
  return (
    <div
      style={{
        ...typeScale.micro,
        color: sk.heading,
        paddingBottom: space.sm,
        marginBottom: space.md,
        borderBottom: `1px solid ${sk.hairline}`,
      }}
    >
      {children}
    </div>
  );
}

/** Ink, sentence case — one per control. Deliberately quieter than the tier
 * heading above it, so the eye reads groups first and fields second. */
export function Field({
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
          gap: space.sm,
          marginBottom: space.xs,
        }}
      >
        <span style={{ ...typeScale.label, letterSpacing: 'normal', textTransform: 'none', color: sk.label }}>
          {label}
        </span>
        {caption && (
          <span style={{ ...typeScale.label, letterSpacing: 'normal', textTransform: 'none', fontWeight: 400, color: sk.caption }}>
            {caption}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** The conversion anchor, boxed so the figure is not just more text in the
 * column.
 *
 * It was written out twice in this file, once per category branch, differing
 * only in which getter supplied the number — and the two copies had to be kept
 * in step by hand. It is exported for the same reason GroupHeading is: the
 * homepage showcase renders one below its own window controls, and an imitation
 * of this box on a black card would be the copy that stops matching.
 *
 * `note` carries the line under the price, because the showcase's job total has
 * something more to say than a single window's does. */
export function PriceBox({
  amount,
  note = '+ installation across Australia',
  onDark = false,
  style,
}: {
  amount: number;
  note?: string;
  onDark?: boolean;
  style?: React.CSSProperties;
}) {
  const sk = skin(onDark);
  return (
    <div
      style={{
        background: sk.boxFill,
        border: `1px solid ${sk.hairline}`,
        borderRadius: radius.md,
        padding: `${space.md}px`,
        ...style,
      }}
    >
      <div style={{ fontFamily: tokens.body, ...typeScale.micro, color: sk.heading }}>
        Estimated price
      </div>
      <div
        style={{
          fontFamily: tokens.display,
          ...typeScale.numeric,
          fontWeight: 300,
          lineHeight: 1.1,
          color: sk.label,
          marginTop: space.xxs,
        }}
      >
        {/* formatAUD, not a bare `$${n}` — a four-figure job total printed as
            $1240 is the one number on the page without a thousands separator. */}
        {formatAUD(amount)}
      </div>
      <div style={{ ...typeScale.label, letterSpacing: 'normal', textTransform: 'none', fontWeight: 400, color: sk.caption, marginTop: space.xxs }}>
        {note}
      </div>
    </div>
  );
}

export default function VisualiserControls({ lockedRange: lockedRangeProp, compact = false, showCurtainControls = false, onDark = false, showPrice = true }: VisualiserControlsProps) {
  const [searchParams] = useSearchParams();
  const store = useVisualiserStore();
  // `sk`, not `s`: the options loops below all bind `s` as their map
  // variable, and a skin called `s` would be shadowed inside every one.
  const sk = skin(onDark);

  // BETWEEN GROUPS, versus WITHIN A GROUP.
  //
  // theme's scale is explicit about this: md (20) is the gap within a group, xl
  // (52) the gap between groups. This panel spent md on both whenever compact
  // was set — so the two tiers, the fields inside them and the price box all sat
  // exactly 20px apart, six evenly spaced blocks with no reading order in the
  // spacing at all. Fields keep md; groups now get a real step up.
  //
  // Compact takes lg (32) rather than the full xl because this variant has to
  // stay as short as the canvas beside it; the step is still 1.6x its fields,
  // which is all a hierarchy needs.
  const groupGap = compact ? space.lg : space.xl;

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: groupGap }}>
        <section>
          <GroupHeading onDark={onDark}>Your curtain</GroupHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <Field onDark={onDark} label="Type">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs }}>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs, marginLeft: 0, paddingRight: 0 }}>
                {palette.map(c => (
                  <Swatch
                    onDark={onDark}
                    key={c.name}
                    hex={c.hex}
                    label={c.name}
                    active={store.fabricColour === c.name}
                    onClick={() => store.setFabricColour(c.name)}
                  />
                ))}
              </div>
            </Field>
          </div>
        </section>

        <section>
          <GroupHeading onDark={onDark}>Details</GroupHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <Field onDark={onDark} label="Hardware" caption={selectedHardware?.label}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs, marginLeft: 0, paddingRight: 0 }}>
                {HARDWARE_OPTIONS.map(h => (
                  <Swatch
                    onDark={onDark}
                    key={h.id}
                    hex={HARDWARE_HEX[h.id]}
                    label={h.label}
                    active={store.hardwareColour === h.id}
                    onClick={() => store.setHardwareColour(h.id)}
                  />
                ))}
              </div>
            </Field>

            <Field onDark={onDark} label="Window size">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs }}>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs }}>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs }}>
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
              <div style={{ ...typeScale.label, letterSpacing: 'normal', textTransform: 'none', fontWeight: 400, color: sk.quiet }}>
                Wave fold — one wave every 160mm of track
              </div>
            </Field>
          </div>
        </section>

        {showPrice && <PriceBox onDark={onDark} amount={store.getCurtainPrice()} />}
      </div>
    );
  }

  // Blind controls (default)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: groupGap }}>
      {/* --- TIER 1: the decisions that change what you see ---------------- */}
      <section>
        <GroupHeading onDark={onDark}>Your blind</GroupHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          {!store.lockedRange && (
            <Field onDark={onDark} label="Type">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs }}>
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs, marginLeft: 0, paddingRight: 0 }}>
              {palette.map(c => (
                <Swatch
                  onDark={onDark}
                  key={c.name}
                  hex={c.hex}
                  label={c.name}
                  active={store.fabricColour === c.name}
                  onClick={() => store.setFabricColour(c.name)}
                />
              ))}
            </div>
          </Field>
        </div>
      </section>

      {/* --- TIER 2: specification, quieter ------------------------------- */}
      <section>
        <GroupHeading onDark={onDark}>Details</GroupHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
          <Field onDark={onDark} label="Hardware" caption={selectedHardware?.label}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs, marginLeft: 0, paddingRight: 0 }}>
              {HARDWARE_OPTIONS.map(h => (
                <Swatch
                  onDark={onDark}
                  key={h.id}
                  hex={HARDWARE_HEX[h.id]}
                  label={h.label}
                  active={store.hardwareColour === h.id}
                  onClick={() => store.setHardwareColour(h.id)}
                />
              ))}
            </div>
          </Field>

          <Field onDark={onDark} label="Window size">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs }}>
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs }}>
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

      {/* --- PRICE: last, and only when the host isn't placing its own ------ */}
      {showPrice && <PriceBox onDark={onDark} amount={store.getCurrentPrice()} />}
    </div>
  );
}
