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

import { tokens } from '../theme';
import {
  FAMILY_GROUPS,
  LIGHT_VALUES,
  countFor,
  type Facets,
} from '../data/catalogue';

const GROUP_LABEL = {
  fontFamily: tokens.body,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: 'rgba(28,24,16,0.4)',
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
        borderRadius: 2,
        border: `1px solid ${state === 'off' ? 'rgba(28,24,16,0.25)' : tokens.gold}`,
        background: state === 'off' ? 'transparent' : tokens.gold,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
    >
      {state === 'on' && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none" stroke={tokens.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 3.6 L3.4 6 L8 1" />
        </svg>
      )}
      {state === 'partial' && (
        <span style={{ width: 7, height: 1.6, background: tokens.ink, borderRadius: 1 }} />
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
      <span style={{ fontSize: 11, color: 'rgba(28,24,16,0.4)' }}>{count}</span>
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

  /** The family control writes RANGES, never a family of its own — see the note
   * at the top. Ticking it selects every range underneath; unticking clears
   * them. */
  const toggleFamily = (ranges: string[], allOn: boolean) => {
    const next = new Set(facets.ranges);
    ranges.forEach(r => (allOn ? next.delete(r) : next.add(r)));
    onChange({ ...facets, ranges: next });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
      <div>
        <p style={GROUP_LABEL}>Shop by</p>
        {FAMILY_GROUPS.map(group => {
          const ids = group.ranges.map(r => r.id);
          const on = ids.filter(id => facets.ranges.has(id)).length;
          const state = on === 0 ? 'off' : on === ids.length ? 'on' : 'partial';
          const familyCount = group.ranges.reduce(
            (sum, r) => sum + countFor(facets, 'ranges', r.id),
            0,
          );
          return (
            <div key={group.family} style={{ marginBottom: 12 }}>
              <Row
                label={group.family}
                count={familyCount}
                state={state}
                strong
                onToggle={() => toggleFamily(ids, state === 'on')}
              />
              {group.ranges.map(r => (
                <Row
                  key={r.id}
                  label={r.label}
                  count={countFor(facets, 'ranges', r.id)}
                  state={facets.ranges.has(r.id) ? 'on' : 'off'}
                  indent
                  onToggle={() => toggle('ranges', r.id)}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div>
        <p style={GROUP_LABEL}>Where</p>
        {(['Indoor', 'Outdoor'] as const).map(v => (
          <Row
            key={v}
            label={v}
            count={countFor(facets, 'locations', v)}
            state={facets.locations.has(v) ? 'on' : 'off'}
            onToggle={() => toggle('locations', v)}
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
