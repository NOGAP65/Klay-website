// ---------------------------------------------------------------------------
// The configurator half of a range card.
//
// It sits under the name block, at the same width, and it SIZES ITSELF.
//
// It used to be given a fixed height equal to the photograph above it, so the
// pair read as one tall card split in half. That symmetry cost more than it
// bought: a wardrobe asks one question and a roller asks five, so the shared
// literal had to clear the worst case and every other card carried the slack —
// which is how the card reached 940px against MONDAY Haircare's 642.
//
// Now the row's flex children stretch to the tallest card and this takes
//  inside one, so every gold button still lands on the same line
// without any component naming a height. The field column keeps its overflow
// guard for the one product with a seventeen-colour card.
//
// WHAT IT OFFERS IS NOT DECIDED HERE. The fields come from data/configOptions,
// which is also what prices the selection and turns it into a cart line. This
// file is the control surface and nothing else — no product knowledge, no
// pricing rules, so a change to what a venetian offers is a change to one table
// rather than to a component.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens, motion, space, type as typeScale } from '../../theme';
import type { CatalogueItem } from '../../data/catalogue';
import {
  configuredLine,
  defaultSelection,
  fieldsFor,
  priceFor,
  type ConfigChoice,
  type ConfigField,
  type Selection,
} from '../../data/configOptions';
import { useCartStore } from '../../store/cartStore';
import { useHover } from './primitives';

/** The panel's height, shared by all fourteen so every gold button lands on one
 * line. Derived: three fields at 56 plus their gaps, the price row, the 52px
 * button and the panel's own padding. */
const CONFIG_H = 372;

/** Field label — the small caps line above each control. Deliberately quieter
 * than the choices themselves: the question is scaffolding, the answers are
 * what the customer is reading. */
const labelStyle: React.CSSProperties = {
  ...typeScale.micro,
  // inkSoft, not inkFaint — at 0.4 these field labels measured 2.44 on
  // parchment and were the second place a non-text token was carrying text.
  color: tokens.inkSoft,
  marginBottom: space.xxs,
};

/** One choice, as a rectangle. Selected is a gold fill with ink text — the same
 * pairing every primary action on the site uses, so a chosen option reads as
 * something the page has committed to rather than as a highlight. */
function Chip({
  choice,
  selected,
  onSelect,
}: {
  choice: ConfigChoice;
  selected: boolean;
  onSelect: () => void;
}) {
  const { hover, bind } = useHover();
  return (
    <button
      {...bind}
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        fontFamily: tokens.body,
        ...typeScale.label,
        letterSpacing: 'normal',
        textTransform: 'none',
        fontWeight: 500,
        lineHeight: 1,
        // Tight, because the tallest product asks five questions and all of
        // them have to clear the action bar inside a fixed 470px panel.
        // The one pill: height 32, 20 either side.
        display: 'inline-flex',
        alignItems: 'center',
        height: 32,
        boxSizing: 'border-box',
        padding: `0 ${space.md}px`,
        borderRadius: 2,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: motion.button,
        background: selected ? tokens.gold : 'transparent',
        color: selected ? tokens.ink : hover ? tokens.ink : tokens.inkSoft,
        border: `1px solid ${selected ? tokens.gold : hover ? tokens.lineStrong : tokens.line}`,
      }}
    >
      {choice.label}
    </button>
  );
}

/** A colour, as cut cloth — square, hairlined, the same object the photo tile's
 * swatch row uses. Selection is a gold ring held OFF the swatch by a white gap
 * rather than a border drawn on it: a border would eat two pixels of a 22px
 * colour and change the colour you are judging. */
function Swatch({
  choice,
  selected,
  onSelect,
}: {
  choice: ConfigChoice;
  selected: boolean;
  onSelect: () => void;
}) {
  const { hover, bind } = useHover();
  return (
    <button
      {...bind}
      onClick={onSelect}
      title={choice.label}
      aria-label={choice.label}
      aria-pressed={selected}
      style={{
        // One swatch definition: 20 x 20, radius 2. It was radius 1 here against
        // 50% in the visualiser controls — the same object as a square in one
        // panel and a circle in the next.
        width: 20,
        height: 20,
        padding: 0,
        borderRadius: 2,
        cursor: 'pointer',
        background: choice.hex,
        border: `1px solid ${tokens.line}`,
        outline: selected ? `1.5px solid ${tokens.gold}` : hover ? `1.5px solid ${tokens.lineStrong}` : 'none',
        outlineOffset: 2,
        transition: 'outline-color 0.2s ease',
      }}
    />
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: string | undefined;
  onChange: (choiceId: string) => void;
}) {
  return (
    <div>
      <div style={labelStyle}>
        {field.label}
        {/* The chosen colour is named beside its label — a grid of squares is
            unreadable without it, and "Fabric colour · Woodland Grey" is what
            the customer will repeat back on the phone. */}
        {field.kind === 'swatches' && value && (
          <span style={{ color: tokens.inkSoft, letterSpacing: '0.3em' }}> · {value}</span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs }}>
        {field.choices.map(c =>
          field.kind === 'swatches' ? (
            <Swatch key={c.id} choice={c} selected={c.id === value} onSelect={() => onChange(c.id)} />
          ) : (
            <Chip key={c.id} choice={c} selected={c.id === value} onSelect={() => onChange(c.id)} />
          ),
        )}
      </div>
    </div>
  );
}

export function RangeConfigurator({
  item,
  onInteract,
}: {
  item: CatalogueItem;
  /** Fired on the first touch of any control. The row advances itself every
   * five seconds, and carrying a card off the screen mid-configuration is the
   * one thing that would make this panel unusable, so the carousel stops for
   * good once anyone starts specifying something. */
  onInteract?: () => void;
}) {
  const navigate = useNavigate();
  const addItem = useCartStore(s => s.addItem);
  const [sel, setSel] = useState<Selection>(() => defaultSelection(item));
  const { hover, bind } = useHover();

  const fields = fieldsFor(item);
  const price = priceFor(item, sel);

  const choose = (fieldId: string) => (choiceId: string) => {
    onInteract?.();
    setSel(s => ({ ...s, [fieldId]: choiceId }));
  };

  const checkout = () => {
    onInteract?.();
    addItem(configuredLine(item, sel));
    navigate('/cart');
    // The app has no scroll restoration, so without this the cart opens at
    // whatever height the homepage was scrolled to — its own footer.
    window.scrollTo(0, 0);
  };

  return (
    <div
      style={{
        // A CAP, NOT A MATCH. It used to be handed the photograph's own height —
        // 470 — which is what made the card 940. This is sized to the median
        // card instead: three fields, a price and a button. The roller, which
        // asks five, scrolls the last one into view inside its own panel rather
        // than making all fourteen cards tall enough for the worst case.
        height: CONFIG_H,
        flex: '0 0 auto',
        minHeight: 0,
        boxSizing: 'border-box',
        background: tokens.cream,
        // Hairline on three sides. The top edge is where the name block ends,
        // and a rule there would read as a divider inside one object.
        borderLeft: `1px solid ${tokens.lineFaint}`,
        borderRight: `1px solid ${tokens.lineFaint}`,
        borderBottom: `1px solid ${tokens.lineFaint}`,
        padding: `${space.md}px`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* The questions. Scrolls within the panel so every card in the row is
          the same height whether it asks one question or five. */}
      <div
        className="klay-vscroll"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: space.sm,
        }}
      >
        {fields.map(f => (
          <Field key={f.id} field={f} value={sel[f.id]} onChange={choose(f.id)} />
        ))}
      </div>

      {/* The action bar, pinned to the bottom of every card in the row. */}
      <div style={{ flex: '0 0 auto', paddingTop: space.sm }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: space.xs,
            marginBottom: space.xs,
          }}
        >
          {/* Priced products show the figure this exact configuration costs —
              it moves as the size and the motor are chosen, because a price
              that ignores the controls above it is worse than none. The rest
              say what they are: quoted once someone has measured. */}
          {price !== null ? (
            <>
              <span style={{ ...typeScale.numeric, color: tokens.ink, lineHeight: 1 }}>
                ${price}
              </span>
              <span style={{ ...typeScale.micro, letterSpacing: 'normal', textTransform: 'none', color: tokens.inkSoft }}>
                + install
              </span>
            </>
          ) : (
            <span
              style={{
                ...typeScale.micro,
                // goldText: this sits on a light panel, where brand gold is 2.11.
                color: tokens.goldText,
              }}
            >
              Price on measure
            </span>
          )}
        </div>
        <button
          {...bind}
          onClick={checkout}
          style={{
            width: '100%',
            padding: `0 ${space.md}px`,
            height: 52,
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: hover ? tokens.goldLight : tokens.gold,
            color: tokens.ink,
            ...typeScale.label,
            lineHeight: 1,
            border: 'none',
            borderRadius: 2,
            cursor: 'pointer',
            transition: motion.button,
          }}
        >
          {/* Says where the click goes. "Add to cart" would leave the visitor
              wondering whether anything more is needed; this is the last step
              before the details form. */}
          {price !== null ? 'Add & Checkout' : 'Add & Request Quote'}
        </button>
      </div>
    </div>
  );
}
