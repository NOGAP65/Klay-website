import { GROUPS, LIGHT_VALUES } from '../constants';

import { EMPTY_FACETS, TYPE_FILTERS, groupForCategoryParam, type Facets } from './facets';
import { SORT_OPTIONS, type SortOption } from './sortProducts';

export interface BrowseState { facets: Facets; query: string; sort: SortOption }
const FACET_PARAMS = { types: 'type', groups: 'area', lights: 'light', availability: 'availability' } as const;
const VALUES = {
  types: TYPE_FILTERS.map(type => type.id), groups: GROUPS, lights: LIGHT_VALUES,
  availability: ['Buy online', 'Price on measure'],
};
export const FACET_KEYS = Object.keys(FACET_PARAMS) as (keyof Facets)[];

export function readBrowseState(params: URLSearchParams): BrowseState {
  const facets: Facets = { ...EMPTY_FACETS };
  for (const key of FACET_KEYS) {
    facets[key] = new Set(params.getAll(FACET_PARAMS[key]).filter(value => (VALUES[key] as readonly string[]).includes(value)));
  }
  // Existing category links land in their product family, rather than all of Other.
  const category = params.get('category')?.toLowerCase();
  if (category && !FACET_KEYS.some(key => params.has(FACET_PARAMS[key]))) {
    const aliases: Record<string, string> = {
      'sheer-curtains': 'curtains', curtain: 'curtains', 'shelving-storage': 'shelving',
      'shower-screen': 'shower-screens', mirrors: 'mirrors',
    };
    const type = TYPE_FILTERS.find(type => type.id === (aliases[category] ?? category) || type.products.includes(category));
    if (type) facets.types.add(type.id);
    else {
      const group = groupForCategoryParam(category);
      if (group !== 'All') facets.groups.add(group);
    }
    if (category === 'sheer-curtains') facets.lights.add('Sheer');
  }
  return {
    facets, query: (params.get('q') ?? '').slice(0, 80),
    sort: SORT_OPTIONS.find(option => option.id === params.get('sort'))?.id ?? 'featured',
  };
}

/** Preserve unrelated campaign parameters while removing stale shop selections. */
export function writeBrowseState(current: URLSearchParams, state: BrowseState) {
  const params = new URLSearchParams(current);
  params.delete('category');
  for (const key of FACET_KEYS) {
    params.delete(FACET_PARAMS[key]);
    for (const value of state.facets[key]) params.append(FACET_PARAMS[key], value);
  }
  params.delete('q');
  if (state.query) params.set('q', state.query.slice(0, 80));
  params.delete('sort');
  if (state.sort !== 'featured') params.set('sort', state.sort);
  return params;
}
