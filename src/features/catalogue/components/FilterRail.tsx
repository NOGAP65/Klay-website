import { LIGHT_VALUES } from '../constants';
import { TYPE_FILTERS, GROUP_FILTERS, countFor, type Facets } from '../lib/facets';

export function FilterRail({ facets, query = '', onChange }: {
  facets: Facets; query?: string; onChange: (next: Facets) => void;
}) {
  const toggle = (key: keyof Facets, value: string) => {
    const next = new Set(facets[key]);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange({ ...facets, [key]: next });
  };
  const groups: { key: keyof Facets; label: string; options: { id: string; label: string }[] }[] = [
    { key: 'types', label: 'Product type', options: TYPE_FILTERS },
    { key: 'groups', label: 'Shop by area', options: GROUP_FILTERS },
    { key: 'lights', label: 'Light control', options: LIGHT_VALUES.map(value => ({ id: value, label: value })) },
    { key: 'availability', label: 'How to order', options: ['Buy online', 'Price on measure'].map(value => ({ id: value, label: value })) },
  ];
  return <div className="shop-filter-rail">
    {groups.map(group => {
      const options = group.options.map(option => ({ ...option, count: countFor(facets, group.key, option.id, query) }));
      // Only offer refinements that can narrow the current results; selected groups stay removable.
      if (group.key !== 'types' && !facets[group.key].size && options.filter(option => option.count > 0).length < 2) return null;
      return <fieldset key={group.key}>
        <legend>{group.label}</legend>
        {options.map(option => {
          const isChecked = facets[group.key].has(option.id);
          const isDisabled = option.count === 0 && !isChecked;
          return <label key={option.id} className={`shop-filter-option${isDisabled ? ' is-unavailable' : ''}`}>
            <input type="checkbox" checked={isChecked} disabled={isDisabled}
              onChange={() => toggle(group.key, option.id)} />
            <span>{option.label}</span><span className="shop-filter-count" aria-hidden="true">{option.count}</span>
          </label>;
        })}
      </fieldset>;
    })}
  </div>;
}
