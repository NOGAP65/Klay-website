import type { CatalogueItem } from '../constants';

// ---------------------------------------------------------------------------
// Sorting the shop's grid.
//
// Extracted from ProductsPage in Phase 4.3.3. §4: "lib/ is pure and testable
// with no React and no network", and §7: a component does not calculate.
//
// It was a nine-line branch inside a 580-line component's useMemo — the largest
// function in the codebase — and the one piece of it that is a rule rather than
// a rendering concern. The reasoning below was already written there and is
// moved unchanged; it is the kind of thing that gets lost when a component is
// later split by someone reading only the JSX.
// ---------------------------------------------------------------------------

export type SortOption = 'featured' | 'price-low' | 'name-az';

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'name-az', label: 'Name: A to Z' },
];

/** Returns a new array; never sorts in place. `featured` is catalogue order,
 *  which is the order the business supplied and is deliberately not alphabetical. */
export function sortProducts(items: CatalogueItem[], sortBy: SortOption): CatalogueItem[] {
  if (sortBy === 'price-low') {
    // Unpriced items sort LAST rather than being treated as $0 — "price on
    // measure" is not a cheap price, and floating sixteen enquiry cards above
    // the six you can buy would be exactly backwards.
    return [...items].sort((a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity));
  }
  if (sortBy === 'name-az') {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }
  return items;
}
