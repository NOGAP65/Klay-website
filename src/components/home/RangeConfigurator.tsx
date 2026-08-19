// ---------------------------------------------------------------------------
// The configurator half of a range card.
//
// It sits directly under the photograph, at the SAME WIDTH AND THE SAME HEIGHT,
// so the pair reads as one tall card with a picture on top and its controls
// beneath. That symmetry is the whole idea: the photograph tells you what the
// product is and the panel under it is where you specify and buy it, without
// either half being the poor relation.
//
// Same height across all fourteen, which is the constraint the layout is built
// around. A roller asks five questions and a wardrobe asks one, so the panels
// would otherwise be wildly different heights and the row would look broken.
// The fields therefore live in a scrolling column and the action bar is pinned
// to the bottom — every card's price and button land on the same line, and the
// one product with a long colour card scrolls inside its own panel rather than
// stretching the row.
//
// WHAT IT OFFERS IS NOT DECIDED HERE. The fields come from data/configOptions,
// which is also what prices the selection and turns it into a cart line. This
// file is the control surface and nothing else — no product knowledge, no
// pricing rules, so a change to what a venetian offers is a change to one table
// rather than to a component.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens, motion } from '../../theme';
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

/** Field label — the small caps line above each control. Deliberately quieter
 * than the choices themselves: the question is scaffolding, the answers are
 * what the customer is reading. */
const labelStyle: React.CSSProperties = {
  fontFamily: tokens.body,
  fontSize: 9.5,
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: tokens.inkFaint,
  marginBottom: 6,
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
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1,
        // Tight, because the tallest product asks five questions and all of
        // them have to clear the action bar inside a fixed 470px panel.
        padding: '7px 10px',
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
        width: 20,
        height: 20,
        padding: 0,
        borderRadius: 1,
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
          <span style={{ color: tokens.inkSoft, letterSpacing: '0.08em' }}> · {value}</span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
  height,
  isMobile,
  onInteract,
}: {
  item: CatalogueItem;
  /** Matched to the photograph above it — see the file header. */
  height: number;
  isMobile: boolean;
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
        height,
        boxSizing: 'border-box',
        background: tokens.cream,
        // Hairline on three sides only. The top edge is where the photograph
        // ends, and a line there would cut the card in half rather than close
        // it — the two halves are one object.
        borderLeft: `1px solid ${tokens.lineFaint}`,
        borderRight: `1px solid ${tokens.lineFaint}`,
        borderBottom: `1px solid ${tokens.lineFaint}`,
        padding: isMobile ? '16px 16px 14px' : '20px 20px 18px',
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
          gap: isMobile ? 10 : 11,
        }}
      >
        {fields.map(f => (
          <Field key={f.id} field={f} value={sel[f.id]} onChange={choose(f.id)} />
        ))}
      </div>

      {/* The action bar, pinned to the bottom of every card in the row. */}
      <div style={{ flex: '0 0 auto', paddingTop: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 8,
          }}
        >
          {/* Priced products show the figure this exact configuration costs —
              it moves as the size and the motor are chosen, because a price
              that ignores the controls above it is worse than none. The rest
              say what they are: quoted once someone has measured. */}
          {price !== null ? (
            <>
              <span style={{ fontFamily: tokens.display, fontSize: 26, fontWeight: 300, color: tokens.ink, lineHeight: 1 }}>
                ${price}
              </span>
              <span style={{ fontFamily: tokens.body, fontSize: 10, color: tokens.inkFaint }}>
                + install
              </span>
            </>
          ) : (
            <span
              style={{
                fontFamily: tokens.body,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: tokens.gold,
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
            padding: '13px 16px',
            background: hover ? tokens.goldLight : tokens.gold,
            color: tokens.ink,
            fontFamily: tokens.body,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
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
