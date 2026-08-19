// ---------------------------------------------------------------------------
// The controls. Everything a customer can specify about a product, and the one
// action that puts it in the cart.
//
// IT NO LONGER LIVES IN THE RANGE ROW. It used to sit under every card, which
// fused two incompatible jobs into one object: the top half was editorial
// aspiration and the bottom half was a form, so the row asked for about forty
// decisions before it had given anyone a reason to want anything. The controls
// are unchanged and every one of them is still reachable — they open in the
// focused panel instead, one product at a time, once the visitor has chosen.
// See RangeConfigurePanel.
//
// TWO CLUSTERS, NOT FIVE FIELDS. The fields are grouped into what the product
// is and what opening it is going into, with a real boundary between them —
// see data/configOptions' Cluster. Five equal controls in a column read as a
// form; two short questions read as a conversation.
//
// EVERY MEASUREMENT IS A VALUE FROM theme's `space`. Cluster to cluster 52,
// field to field 20, label to control 12: between-group space is 2.6× the
// within-group space, which is what makes the structure legible without a
// single border or fill doing the work.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens, motion, space, type, microCaps } from '../../theme';
import type { CatalogueItem } from '../../data/catalogue';
import {
  configuredLine,
  defaultSelection,
  fieldsFor,
  priceFor,
  type Cluster,
  type ConfigChoice,
  type ConfigField,
  type Selection,
} from '../../data/configOptions';
import { useCartStore } from '../../store/cartStore';
import { useHover } from './primitives';

/** Field label. Ink rather than gold: the panel already carries one gold thing
 * (the price), and a column of gold labels above gold-selected chips is the
 * gold-on-gold-on-gold hierarchy that makes an accent stop being one. */
const labelStyle: React.CSSProperties = {
  fontFamily: tokens.body,
  fontSize: type.micro,
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: tokens.inkBody,
  marginBottom: space.sm,
};

/** One choice.
 *
 * Selected is INK, not gold. Gold's perceived value is inversely proportional
 * to the area it covers — at hairline and small-caps scale it reads as gilt, and
 * in five rows of filled pills it reads as ochre. Ink fill also gives the
 * selected state 15.8:1 against its own label, which no gold fill can. */
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
        fontSize: type.fine,
        fontWeight: 500,
        lineHeight: 1,
        // 44px tall including the border — the minimum comfortable tap target,
        // and the same on the desktop where it is a pointer target.
        padding: '15px 20px',
        borderRadius: 2,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: motion.button,
        background: selected ? tokens.ink : 'transparent',
        color: selected ? tokens.warmWhite : tokens.ink,
        // Gold appears here and only here in the control set: a 1px line under
        // the pointer. Hairline gold is the expensive kind.
        border: `1px solid ${selected ? tokens.ink : hover ? tokens.gold : tokens.line}`,
      }}
    >
      {choice.label}
    </button>
  );
}

/** A colour, as cut cloth. Selection is a ring held off the swatch by a gap
 * rather than a border drawn on it — a border would eat two pixels of the
 * colour being judged. */
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
        width: space.lg,
        height: space.lg,
        padding: 0,
        borderRadius: 1,
        cursor: 'pointer',
        background: choice.hex,
        border: `1px solid ${tokens.line}`,
        outline: selected
          ? `2px solid ${tokens.ink}`
          : hover
            ? `2px solid ${tokens.gold}`
            : 'none',
        outlineOffset: space.nudge,
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
            unreadable without it, and the name is what gets repeated back on
            the phone. */}
        {field.kind === 'swatches' && value && (
          <span style={{ color: tokens.inkBody, letterSpacing: '0.08em' }}> · {value}</span>
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

const CLUSTER_LABEL: Record<Cluster, string> = {
  product: 'The product',
  opening: 'The opening',
};

export function RangeConfigurator({ item, isMobile }: { item: CatalogueItem; isMobile: boolean }) {
  const navigate = useNavigate();
  const addItem = useCartStore(s => s.addItem);
  const [sel, setSel] = useState<Selection>(() => defaultSelection(item));
  const { hover, bind } = useHover();

  const fields = fieldsFor(item);
  const price = priceFor(item, sel);
  const clusters: Cluster[] = ['product', 'opening'];

  const checkout = () => {
    addItem(configuredLine(item, sel));
    navigate('/cart');
    // The app has no scroll restoration, so without this the cart opens at
    // whatever height the homepage was scrolled to — its own footer.
    window.scrollTo(0, 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.xl }}>
      {clusters.map(c => {
        const inCluster = fields.filter(f => f.cluster === c);
        if (!inCluster.length) return null;
        return (
          <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            {/* The cluster's own name, in the gold micro-caps. One per cluster,
                so gold marks structure rather than decorating every label. */}
            <p style={{ ...microCaps, letterSpacing: '0.24em' }}>{CLUSTER_LABEL[c]}</p>
            {inCluster.map(f => (
              <Field
                key={f.id}
                field={f}
                value={sel[f.id]}
                onChange={id => setSel(s => ({ ...s, [f.id]: id }))}
              />
            ))}
          </div>
        );
      })}

      {/* The action. One boundary above it — 52 against the clusters' 20. */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: space.sm,
            marginBottom: space.md,
          }}
        >
          {/* THE ONE GOLD MOMENT. The price of this exact configuration, in the
              editorial face at card scale and in the text-safe gold — the
              highest-value instant in the section, and the only place gold is
              allowed to carry meaning. It is type, not a fill, so it costs the
              section almost no gold area at all.

              Where there is no price, the withheld figure is stated as a
              service received rather than a barrier: "price on measure" reads
              as we will not tell you, and a free measure reads as something
              you are being given. Same fact. */}
          {price !== null ? (
            <>
              <span
                style={{
                  fontFamily: tokens.display,
                  fontSize: type.card,
                  fontWeight: 300,
                  lineHeight: 1,
                  color: tokens.goldText,
                }}
              >
                ${price}
              </span>
              <span style={{ fontFamily: tokens.body, fontSize: type.fine, color: tokens.inkBody }}>
                plus installation
              </span>
            </>
          ) : (
            <span
              style={{
                fontFamily: tokens.display,
                fontSize: type.card,
                fontWeight: 300,
                lineHeight: 1.1,
                color: tokens.goldText,
              }}
            >
              Free measure and quote
            </span>
          )}
        </div>
        <button
          {...bind}
          onClick={checkout}
          style={{
            // Ink, not gold. A full-width gold slab is the single largest
            // cheapening force available to this palette; ink fill with a gold
            // hairline on hover keeps the action unmistakable and the gold
            // expensive.
            width: isMobile ? '100%' : 'auto',
            padding: '19px 52px',
            background: hover ? tokens.charcoal : tokens.ink,
            color: tokens.warmWhite,
            fontFamily: tokens.body,
            fontSize: type.fine,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            border: `1px solid ${hover ? tokens.gold : tokens.ink}`,
            borderRadius: 2,
            cursor: 'pointer',
            transition: motion.button,
          }}
        >
          {/* Never framed as self-design. "You chose, we craft" — the customer
              specified it and Klay makes it, which is the premium reading;
              "design it yourself" is the one that costs a premium brand money. */}
          {price !== null ? 'Add to cart' : 'Request this quote'}
        </button>
      </div>
    </div>
  );
}
