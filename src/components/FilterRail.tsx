// ---------------------------------------------------------------------------
// THE FILTER RAIL — four facet groups down the left of the shop.
//
// WHY A RAIL AND NOT A ROW OF PILLS, which is what /products had: Klay's range
// is HIERARCHICAL and a horizontal bar cannot show nesting. Six pills side by
// side say Blinds and Wardrobes are the same kind of thing. They are not — the
// business sells window coverings, outdoor shade and storage, and the family a
// range belongs to is the first cut a customer makes. A vertical list can
// indent; a row cannot.
//
// The rail costs a grid column at 1440 (four cards become three) and nothing at
// all above 1600, where the page already had dead margin either side of its
// container. Three cards at ~340px are also LARGER than the four at ~290 they
// replace, which suits a card built around a big portrait photograph.
//
// NESTED CHECKBOXES. Ticking a family ticks its ranges; untick one range and
// the family goes half-filled. The family box is not a separate filter — it is
// a shortcut for the ranges under it, which is why `ranges` is the only thing
// this component ever writes for that group. One source of truth, two controls.
//
// COUNTS ARE LIVE and computed against the other groups — see countFor. A count
// that ignored the rest of the rail would offer "Wardrobes 3" while Outdoor was
// ticked, and clicking it would empty the grid.
// ---------------------------------------------------------------------------

import { radius, tokens } from '@/ds';
import { GROUP_FILTERS, LIGHT_VALUES, countFor, type Facets } from '../data/catalogue';

const GROUP_LABEL = {
  fontFamily: tokens.body,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: 'rgba(29,29,29,0.4)',
  margin: '0 0 14px',
};

/** A 2px square that fills gold when on, and shows a bar rather than a tick
 * when a family is only partly selected. Square because every control on this
 * site is, and because a checkbox that can be indeterminate needs a shape that
 * can carry three states legibly. */
function Box({ state }: { state: 'off' | 'on' | 'partial' }) {
  return (
    <span
      style={{
        width: 15,
        height: 15,
        flexShrink: 0,
        borderRadius: radius.sm,
        border: `1px solid ${state === 'off' ? 'rgba(29,29,29,0.25)' : tokens.fillStrong}`,
        background: state === 'off' ? 'transparent' : tokens.fillStrong,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
    >
      {state === 'on' && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none" stroke={tokens.onFillStrong} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 3.6 L3.4 6 L8 1" />
        </svg>
      )}
      {/* The partial dash sits on the same filled box as the tick above, so it
          takes the same inverted colour. Both were ink on gold. */}
      {state === 'partial' && (
        <span style={{ width: 7, height: 1.6, background: tokens.onFillStrong, borderRadius: 1 }} />
      )}
    </span>
  );
}

function Row({
  label,
  count,
  state,
  onToggle,
  indent = false,
  strong = false,
}: {
  label: string;
  count: number;
  state: 'off' | 'on' | 'partial';
  onToggle: () => void;
  indent?: boolean;
  strong?: boolean;
}) {
  // A count of zero means this option cannot combine with what is already
  // ticked. It stays visible — hiding options makes the rail jump around under
  // the pointer — but goes quiet and stops responding.
  const dead = count === 0 && state === 'off';
  return (
    <button
      onClick={dead ? undefined : onToggle}
      disabled={dead}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '6px 0',
        paddingLeft: indent ? 25 : 0,
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        cursor: dead ? 'default' : 'pointer',
        opacity: dead ? 0.35 : 1,
        fontFamily: tokens.body,
        fontSize: 13,
        fontWeight: strong ? 500 : 400,
        color: tokens.ink,
      }}
    >
      <Box state={state} />
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ fontSize: 11, color: 'rgba(29,29,29,0.4)' }}>{count}</span>
    </button>
  );
}

export function FilterRail({
  facets,
  onChange,
}: {
  facets: Facets;
  onChange: (next: Facets) => void;
}) {
  /** Toggle one value inside one group. Sets are copied rather than mutated so
   * React sees a new object and re-renders. */
  const toggle = (key: keyof Facets, value: string) => {
    const next = new Set(facets[key]);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange({ ...facets, [key]: next });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
      <div>
        {/* The business's own grouping — Indoor, Outdoor, Other — rather than an
            invented family layer above it. It was Window Coverings / Shade /
            Storage with the six ranges nested underneath, which was a taxonomy
            the site had made up for itself; when the real product list arrived
            it came grouped this way, so the rail follows it. */}
        <p style={GROUP_LABEL}>Shop by</p>
        {GROUP_FILTERS.map(g => (
          <Row
            key={g.id}
            label={g.label}
            count={countFor(facets, 'groups', g.id)}
            state={facets.groups.has(g.id) ? 'on' : 'off'}
            strong
            onToggle={() => toggle('groups', g.id)}
          />
        ))}
      </div>

      <div>
        <p style={GROUP_LABEL}>Light</p>
        {LIGHT_VALUES.map(v => (
          <Row
            key={v}
            label={v}
            count={countFor(facets, 'lights', v)}
            state={facets.lights.has(v) ? 'on' : 'off'}
            onToggle={() => toggle('lights', v)}
          />
        ))}
      </div>

      <div>
        {/* Standing in for a price filter. Only six of the twenty-two products
            have a price, so "under $X" would delete two thirds of the shop and
            imply prices that do not exist — see the facet note in
            data/catalogue.ts. */}
        <p style={GROUP_LABEL}>Availability</p>
        {(['Buy online', 'Price on measure'] as const).map(v => (
          <Row
            key={v}
            label={v}
            count={countFor(facets, 'availability', v)}
            state={facets.availability.has(v) ? 'on' : 'off'}
            onToggle={() => toggle('availability', v)}
          />
        ))}
      </div>
    </div>
  );
}
