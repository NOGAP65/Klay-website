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
import { radius, tokens, motion, space, type as typeScale } from '../../theme';
import type { CatalogueItem } from '../../data/catalogue';
import {
  configuredLine,

  fieldsFor,
  priceFor,
  type ConfigChoice,
  type ConfigField,
  type Selection,
} from '../../data/configOptions';
import { useCartStore } from '../../store/cartStore';
import { useHover } from './primitives';

/** The panel's height, shared by all fourteen so every gold button lands on one
 * line. Derived: TWO fields at 52 plus their gap, the price row, the 52px button
 * and the panel's own padding.
 *
 * Two, not three, because the lead field came out of here and onto the card —
 * see the note on SwatchRow. The 60px the swatch row costs above is the 60px
 * this gives back, so promoting it was free. */
const CONFIG_H = 312;

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
/** A DROPDOWN, for a field whose choices are a scale rather than a set.
 *
 * Native, for the same reasons the visualiser's is: the platform's own picker
 * beats anything drawn here on a phone, and it is keyboard- and
 * screen-reader-correct for free. `appearance: none` strips the system chrome so
 * the box can carry the same height, radius and selected-lozenge treatment as
 * Chip, and the arrow is an inline data URI rather than a positioned element —
 * a select cannot have children, and anything absolutely positioned over it
 * would swallow the click that opens it. */
function FieldSelect({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: string | undefined;
  onChange: (choiceId: string) => void;
}) {
  const arrow = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" fill="none" stroke="${tokens.paper}" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  );
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        height: 34,
        padding: `0 ${space.lg}px 0 ${space.xs}px`,
        boxSizing: 'border-box',
        borderRadius: radius.sm,
        // The chosen value IS the field, so the box wears the selected chip's
        // treatment — it is never empty and never reads as unanswered.
        border: `1px solid ${tokens.ink}`,
        background: tokens.ink,
        color: tokens.paper,
        fontFamily: tokens.body,
        fontSize: 12,
        cursor: 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,${arrow}")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `right ${space.xs}px center`,
      }}
    >
      {field.choices.map(c => (
        // Unstyled: the list is the platform's, and a colour set here is
        // honoured on some and ignored on others. Half-styled native chrome
        // looks worse than none.
        <option key={c.id} value={c.id}>{c.label}</option>
      ))}
    </select>
  );
}

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
        borderRadius: radius.md,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: motion.button,
        // INK, NOT THE ACCENT. Bronze is for actions, and a selected option is not
        // an action — it is a record of one. Keeping selection neutral is also the
        // only way it can be consistent: the visualiser's tabs and pills are
        // selection too and they sit on a near-black card, where the bronze fill
        // and an ink label would both be wrong. A selection language that changed
        // colour depending on the ground under it is worse than a neutral one.
        background: selected ? tokens.fillStrong : 'transparent',
        // A SELECTED PILL IS A FILLED PILL, so its label inverts. The selected
        // fill was gold with ink on it; when the fill went black the label had to
        // follow, and it did not — the audit caught ink on ink at 1:1, which made
        // every selected option read as a solid black lozenge with no word in it.
        color: selected ? tokens.onFillStrong : hover ? tokens.ink : tokens.inkSoft,
        border: `1px solid ${selected ? tokens.line : hover ? tokens.lineStrong : tokens.line}`,
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
        borderRadius: radius.sm,
        cursor: 'pointer',
        background: choice.hex,
        border: `1px solid ${tokens.line}`,
        outline: selected ? `1.5px solid ${tokens.line}` : hover ? `1.5px solid ${tokens.lineStrong}` : 'none',
        outlineOffset: 2,
        transition: 'outline-color 0.2s ease',
      }}
    />
  );
}

/** ONE LINE PER QUESTION, OPENED ONE AT A TIME.
 *
 * Every field used to be a label with its whole choice list under it, all of
 * them at once. On the roller — light control, seventeen colours, three sizes,
 * two operations — that is a panel taller than the photograph beside it, and on
 * the shop grid it set the height of the entire row it opened in.
 *
 * It also read as a form to fill in rather than a thing to configure, which is
 * the opposite of what the row is for: what sells is the picture, and the
 * controls should be the smaller half of the card.
 *
 * SHUT, A ROW STATES ITS ANSWER — the name at the left, the answer at the
 * right, and a bronze rule under it — so the closed
 * panel is a readable summary of the configuration rather than a stack of
 * questions. That is worth as much as the space: a customer scanning six
 * collapsed rows can see what they have chosen without opening one.
 *
 * ONE AT A TIME, because the point is the panel staying short; two open rows on
 * the roller is most of the height back. Which one is the parent's business —
 * see the accordion state in RangeConfigurator.
 *
 * The chevron rotates rather than swapping glyph, so the row says which way it
 * is going as well as which state it is in. */
function Field({
  field,
  value,
  open,
  divider,
  otherValue,
  onOtherChange,
  onToggle,
  onChange,
}: {
  field: ConfigField;
  value: string | undefined;
  open: boolean;
  onToggle: () => void;
  onChange: (choiceId: string) => void;
  /** A bronze rule under this row. Every row but the last gets one — under the
   * final row it would be a divider with nothing beneath it to divide. */
  divider: boolean;
  /** What the customer typed behind an Other choice, and where to put it.
   *
   * Passed for any field that HAS an Other — the parent decides by looking for
   * the choice, not by naming the field — so a second one would work the same
   * way without touching this. */
  otherValue?: string;
  onOtherChange?: (value: string) => void;
}) {
  // The label of what is chosen, not its id — a row reading "variant · pet" is
  // no summary at all. What they TYPED beats the word Other, which summarises
  // nothing; and a row nobody has answered says Select rather than sitting
  // blank, so the gap reads as a question rather than as a bug.
  const typed = value === 'other' ? otherValue?.trim() : undefined;
  const chosen = typed || field.choices.find(c => c.id === value)?.label || 'Select';

  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          ...labelStyle,
          marginBottom: open ? labelStyle.marginBottom : 0,
        }}
      >
        {field.label}
        <span style={{ color: tokens.inkSoft, letterSpacing: '0.3em', marginLeft: 'auto' }}>
          {chosen}
        </span>
        <span
          aria-hidden="true"
          style={{
            width: 0, height: 0, flex: '0 0 auto',
            marginLeft: chosen ? 0 : 'auto',
            borderLeft: '3.5px solid transparent',
            borderRight: '3.5px solid transparent',
            borderTop: `4px solid ${tokens.inkSoft}`,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.18s ease',
          }}
        />
      </button>

      {/* ANIMATED OPEN. A row that appears instantly reads as the panel
          jumping rather than as a thing unfolding, and with one row closing as
          another opens the whole panel used to snap twice per click.

          Grid-rows rather than max-height: a max-height transition has to guess
          a number bigger than any content, which then makes the easing wrong
          for everything shorter than the guess — a two-chip row eases as slowly
          as a seventeen-swatch one. `1fr` from `0fr` animates to the content's
          own height, so every row takes the same time whatever is in it. */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          opacity: open ? 1 : 0,
          transition: 'grid-template-rows 0.24s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease',
        }}
      >
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
      {(field.kind === 'select' ? (
        <FieldSelect field={field} value={value} onChange={onChange} />
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xs }}>
          {field.choices.map(c =>
            field.kind === 'swatches' ? (
              <Swatch key={c.id} choice={c} selected={c.id === value} onSelect={() => onChange(c.id)} />
            ) : (
              <Chip key={c.id} choice={c} selected={c.id === value} onSelect={() => onChange(c.id)} />
            ),
          )}
        </div>
      ))}

      {/* BEHIND OTHER. It extends the row that is already open rather than
          opening a second thing, and because it sits inside the region the
          accordion animates, it unfolds with the row for free.

          Only where the parent passed a handler, which it does for any field
          with an Other among its choices — this component is not told that
          locations exist. */}
      {value === 'other' && onOtherChange && (
        <input
          type="text"
          value={otherValue ?? ''}
          onChange={e => onOtherChange(e.target.value)}
          placeholder="Which room?"
          aria-label={`${field.label} — please specify`}
          style={{
            marginTop: space.xs,
            width: '100%',
            height: 32,
            boxSizing: 'border-box',
            padding: `0 ${space.xs}px`,
            fontFamily: tokens.body,
            fontSize: 12,
            color: tokens.ink,
            // A CHIP'S SHAPE, UNFILLED. It is the same height and radius as the
            // options above it and sits in the same row of the panel, so it
            // reads as one more answer rather than as a form appearing inside a
            // card. Unfilled because it is empty until it is answered, where a
            // selected chip is filled because it has been.
            background: 'transparent',
            border: `1px solid ${tokens.line}`,
            borderRadius: radius.md,
            outlineColor: tokens.accent,
          }}
        />
      )}
        </div>
      </div>

      {/* IN THE MIDDLE OF THE SPACE, not tight under the row above — which is
          the whole difference between a divider and an underline. The rows used
          to be spaced by the parent's flex gap and a gap cannot have anything in
          the middle of it, so the space lives on this instead: ten above, ten
          below, and the parent's gap is nothing. */}
      {divider && (
        <div
          aria-hidden="true"
          style={{
            height: 1.5,
            margin: '10px 0',
            background: tokens.accent,
            // Bronze at full strength, five rows of it, would be the loudest
            // thing in the panel. Held back this far it is a texture the rows
            // sit between rather than a set of bars across them.
            opacity: 0.32,
          }}
        />
      )}
    </div>
  );
}

export function RangeConfigurator({
  item,
  sel,
  onChange,
  leadFieldId,
  fill = false,
  onInteract,
}: {
  item: CatalogueItem;
  /** THE SELECTION LIVES ON THE CARD, not in here.
   *
   * It used to be local state, which meant the photograph above this panel could
   * not know what fabric had been chosen — so choosing "Forest Green" changed
   * some chips and nothing else. Article's whole trick is that selecting a
   * colourway changes the PICTURE; lifting the state one level is what makes
   * that possible. */
  sel: Selection;
  onChange: (fieldId: string, choiceId: string) => void;
  /** The field the CARD took up under the picture. Excluded here so it is not
   * asked twice. */
  leadFieldId?: string;
  /** Fills its parent instead of taking the shared card height. Set when it is
   * rendered inside the pop-out panel, which sizes itself to the card beside
   * it — see the note on CONFIG_H. */
  fill?: boolean;
  /** Fired on the first touch of any control. The row advances itself every
   * five seconds, and carrying a card off the screen mid-configuration is the
   * one thing that would make this panel unusable, so the carousel stops for
   * good once anyone starts specifying something. */
  onInteract?: () => void;
}) {
  const navigate = useNavigate();
  const addItem = useCartStore(s => s.addItem);
  const { hover, bind } = useHover();
  /** WHICH QUESTION IS OPEN. Null — every row shut — is the resting state,
   * because a panel that opens with one field expanded is a panel that is
   * taller than it needs to be before anyone has touched it. See Field. */
  const [openField, setOpenField] = useState<string | null>(null);

  const fields = fieldsFor(item);
  const price = priceFor(item, sel);

  const choose = (fieldId: string) => (choiceId: string) => onChange(fieldId, choiceId);

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
        // A CAP, NOT A MATCH. It used to be handed the photograph's own height —
        // 470 — which is what made the card 940. The non-fill variant is sized to
        // the median card instead: three fields, a price and a button.
        //
        // FILL MODE STRETCHES, because the panel it sits in is exactly the height
        // of the card beside it — see the note on the panel in RangeRow. It was
        // briefly content-sized, for a version where the panel opened as a drawer
        // underneath the card and had no height to match; the panel is back beside
        // the card and so is this.
        ...(fill ? { flex: '1 1 auto' } : { height: CONFIG_H, flex: '0 0 auto' }),
        minHeight: 0,
        boxSizing: 'border-box',
        background: tokens.cream,
        // Hairline on three sides. The top edge is where the name block ends,
        // and a rule there would read as a divider inside one object.
        ...(fill ? null : {
          borderLeft: `1px solid ${tokens.lineFaint}`,
          borderRight: `1px solid ${tokens.lineFaint}`,
          borderBottom: `1px solid ${tokens.lineFaint}`,
        }),
        // NO PADDING IN FILL MODE. The padding moves onto the two regions
        // inside, so the action button can reach the panel's own edges — see the
        // note on it. Padded here, it sat inset on all four sides and read as a
        // button placed in a box rather than as the bar the card's Shop Now is.
        padding: fill ? 0 : `${space.md}px`,
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
          // The scroll guard is back on in both modes. The panel is the card's
          // height again, so the one product with a seventeen-colour row and five
          // fields can exceed it — and there the scrollbar is the only thing
          // saying there is more to choose from.
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          // NO GAP. The rows are spaced by the rule between them, which has to
          // sit in the middle of that space — see the divider in Field.
          gap: 0,
          // The padding the outer box gave up, so this region owns its own inset
          // and the action bar below can be flush.
          ...(fill ? { padding: `${space.md}px ${space.md}px 0` } : null),
        }}
      >
        {/* The colour swatches are NOT here. They render on the card, directly
            under the photograph, because they are the one field whose effect is
            visible in the picture — see the note on RangeCard. This panel keeps
            the fields that are decisions rather than appearances. */}
        {fields
          .filter(f => f.id !== leadFieldId)
          .map((f, i, shown) => (
            <Field
              key={f.id}
              field={f}
              value={sel[f.id]}
              open={openField === f.id}
              divider={i < shown.length - 1}
              // BY THE CHOICE, NOT BY THE NAME. Any field offering an Other gets
              // the text box and somewhere to put what is typed; Field never
              // learns that this one is about rooms, and a second such field
              // would need no change here or there.
              {...(f.choices.some(c => c.id === 'other')
                ? {
                    otherValue: sel.locationOther,
                    onOtherChange: (t: string) => onChange('locationOther', t),
                  }
                : null)}
              onToggle={() => setOpenField(id => (id === f.id ? null : f.id))}
              onChange={choose(f.id)}
            />
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
            // Inset with the fields above it. Only the button goes flush.
            ...(fill ? { padding: `0 ${space.md}px` } : null),
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
                color: tokens.ink,
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
            // INK, NOT BRONZE, and for the same reason the selected chips are
            // ink — see the note on Chip. Bronze is the site's action colour and
            // it is right on a photograph, where it is a small lozenge against a
            // scene. Here it was a full-width slab of #8A6C46 at the foot of a
            // tall white panel: the largest object in the configurator, louder
            // than the product it is selling, and the one thing in the panel
            // that is neither the picture nor a choice. Ink puts the weight back
            // on what has been chosen.
            background: hover ? tokens.ink : tokens.fillStrong,
            color: tokens.onFillStrong,
            ...typeScale.label,
            lineHeight: 1,
            border: 'none',
            // SQUARE AND FLUSH IN FILL MODE, so it is the same object as the
            // card's Shop Now rather than a button inside a box: same 52px, same
            // full width, same gold, and — because the panel is now exactly the
            // card's height and sits flush against it — the same bottom edge.
            // The two meet and read as one bar across the whole open card.
            borderRadius: fill ? 0 : radius.md,
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
