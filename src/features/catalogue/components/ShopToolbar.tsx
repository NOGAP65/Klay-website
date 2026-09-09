import { CATALOGUE } from '../constants';
import { EMPTY_FACETS, facetCount, facetLabel, type Facets } from '../lib/facets';
import { FACET_KEYS, type BrowseState } from '../lib/shopBrowseState';
import { SORT_OPTIONS, type SortOption } from '../lib/sortProducts';

export function ShopToolbar({ state, count, isNarrow, onChange, onOpenFilters }: {
  state: BrowseState; count: number; isNarrow: boolean;
  onChange: (next: Partial<BrowseState>, shouldReplace?: boolean) => void;
  onOpenFilters: () => void;
}) {
  const activeCount = facetCount(state.facets);
  const chips = FACET_KEYS.flatMap(facet => [...state.facets[facet]].map(value => ({ facet, value })));
  const removeChip = (facet: keyof Facets, value: string) => {
    const next = new Set(state.facets[facet]);
    next.delete(value);
    onChange({ facets: { ...state.facets, [facet]: next } });
  };
  return <>
    <form className="shop-search" role="search" onSubmit={event => event.preventDefault()}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" />
      </svg>
      <input type="search" aria-label="Search products" placeholder="Search blinds, mirrors, wardrobes…"
        value={state.query} maxLength={80} onChange={event => onChange({ query: event.target.value }, true)} />
      {state.query && <button type="button" className="shop-icon-button" aria-label="Clear search"
        onClick={() => onChange({ query: '' }, true)}>×</button>}
    </form>
    <div className="shop-browse-toolbar">
      {isNarrow && <button type="button" className={`shop-filter-button${activeCount ? ' is-active' : ''}`}
        aria-haspopup="dialog" onClick={onOpenFilters}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M2 5h16M2 15h16M7 2v6M13 12v6" />
        </svg>Filters{activeCount ? ` (${activeCount})` : ''}
      </button>}
      <span className="shop-result-count" role="status" aria-atomic="true">
        {isNarrow ? `${count} product${count === 1 ? '' : 's'}` : `${count} of ${CATALOGUE.length} products`}
      </span>
      <label className="shop-sort"><span className="shop-sr-only">Sort products</span>
        <select value={state.sort} onChange={event => onChange({ sort: event.target.value as SortOption })}>
          {SORT_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select><span aria-hidden="true">⌄</span>
      </label>
    </div>
    {(chips.length > 0 || state.query) && <div className="shop-active-filters" aria-label="Active filters">
      {state.query && <button type="button" aria-label={`Remove search: ${state.query}`} onClick={() => onChange({ query: '' })}>
        <span>“{state.query}”</span><span aria-hidden="true">×</span>
      </button>}
      {chips.map(chip => <button type="button" key={`${chip.facet}:${chip.value}`}
        aria-label={`Remove ${facetLabel(chip.facet, chip.value)} filter`} onClick={() => removeChip(chip.facet, chip.value)}>
        <span>{facetLabel(chip.facet, chip.value)}</span><span aria-hidden="true">×</span>
      </button>)}
      <button type="button" className="shop-clear" onClick={() => onChange({ facets: EMPTY_FACETS, query: '' })}>Clear all</button>
    </div>}
  </>;
}
