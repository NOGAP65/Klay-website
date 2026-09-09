import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { space, tokens, type as typeScale } from '@/ds';
import { useIsMobile, useMediaQuery } from '@/shared';

import { useKlayStore } from '../../../store';
import { defaultSelection, withChoice, type Selection } from '../configOptions';
import type { CatalogueItem } from '../constants';
import { EMPTY_FACETS, applyFacets, facetCount } from '../lib/facets';
import { readBrowseState, writeBrowseState, type BrowseState } from '../lib/shopBrowseState';
import { sortProducts } from '../lib/sortProducts';

import { FilterDrawer } from './FilterDrawer';
import { FilterRail } from './FilterRail';
import { COLUMN_GAP, COLUMN_MIN } from './ShopCard';
import { ShopProductCard } from './ShopProductCard';
import { ShopToolbar } from './ShopToolbar';
import { useShopResults } from './useShopResults';
import './shopBrowsing.css';

const PAGE_MAX = 1600;
const RAIL_WIDTH = 200;
const RAIL_COLLAPSE = '(max-width: 1100px)';

export default function ProductsPage() {
  const isMobile = useIsMobile();
  const isNarrow = useMediaQuery(RAIL_COLLAPSE);
  const setScrollY = useKlayStore(store => store.setScrollY);
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => readBrowseState(searchParams), [searchParams]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  // Keep configured products intact when filtering temporarily hides their cards.
  const [sel, setSel] = useState<Record<string, Selection>>({});
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);
  const items = useMemo(() => sortProducts(applyFacets(state.facets, state.query), state.sort), [state]);
  const { displayed, regionRef, isUpdating } = useShopResults(items, state.query, isDrawerOpen && isNarrow, resultsRef);
  const chooseProduct = useCallback((item: CatalogueItem, field: string, choice: string) => {
    setSel(current => ({ ...current, [item.id]: withChoice(item, current[item.id] ?? defaultSelection(item), field, choice) }));
  }, []);
  const updateBrowse = (next: Partial<BrowseState>, shouldReplace = false) => {
    setSearchParams(current => writeBrowseState(current, { ...readBrowseState(current), ...next }),
      { replace: shouldReplace, preventScrollReset: true });
  };
  const clearAll = () => updateBrowse({ facets: EMPTY_FACETS, query: '' });
  const browseStyle = {
    '--shop-body': tokens.body, '--shop-display': tokens.display,
    '--shop-ink': tokens.ink, '--shop-muted': tokens.inkSoft, '--shop-paper': tokens.paper,
    '--shop-band': tokens.band, '--shop-line': tokens.line, '--shop-accent': tokens.fillStrong,
  } as CSSProperties;

  return <div className="shop-browse" style={browseStyle}>
    <main style={{ background: tokens.paper, minHeight: '100vh' }}>
        <section
          style={{
            position: 'relative',
            height: isMobile ? 'auto' : 360,
            minHeight: isMobile ? 280 : undefined,
            paddingTop: space.band,
            paddingBottom: isMobile ? space.group : 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: "url('/images/categories/indoor.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: '62% center',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(29,29,29,0.7) 0%, rgba(29,29,29,0.3) 100%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: isMobile ? '0 24px' : '0 80px',
              // Same container as the rail and grid below, so the breadcrumb
              // starts on the same vertical line as the first filter group.
              maxWidth: PAGE_MAX,
              margin: '0 auto',
            }}
          >
            <nav
              style={{
                fontFamily: tokens.body,
                fontSize: typeScale.label.fontSize,
                color: 'rgba(248,248,248,0.5)',
                marginBottom: space.item,
              }}
            >
              <Link to="/" style={{ color: 'rgba(248,248,248,0.5)', textDecoration: 'none' }}>
                Home
              </Link>
              <span style={{ margin: `0 ${space.tight}px` }}>/</span>
              <span style={{ color: tokens.paper }}>Shop</span>
            </nav>
            <h1
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 36 : 52,
                fontWeight: 300,
                // Gold, matching the gold SHOP in the nav that brought you
                // here — the bar and the page it opens say the same word in the
                // same colour, so arriving feels like landing rather than
                // navigating. It is also the only large type on this banner:
                // the eyebrow went when the breadcrumb arrived, so there is no
                // second gold thing above it to compete with.
                color: tokens.onDark,
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Everything we make.
            </h1>
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: typeScale.body.fontSize,
                color: 'rgba(248,248,248,0.7)',
                lineHeight: 1.6,
                margin: 0,
                marginTop: space.snug,
                maxWidth: 520,
              }}
            >
              Blinds, curtains, shutters, awnings, wardrobes and shower screens — measured,
              made and installed by hand across Victoria.
            </p>
          </div>
        </section>
      <section aria-label="Shop products" style={{ background: tokens.band,
        padding: isNarrow ? '24px 20px 80px' : '40px 80px 120px' }}>
        <div style={{ maxWidth: PAGE_MAX, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: space.section }}>
          {!isNarrow && <aside aria-label="Product filters" style={{ width: RAIL_WIDTH, flex: `0 0 ${RAIL_WIDTH}px`,
            position: 'sticky', top: 90, maxHeight: 'calc(100dvh - 112px)', overflowY: 'auto', scrollbarWidth: 'thin', paddingRight: 10 }}>
            <FilterRail facets={state.facets} query={state.query} onChange={facets => updateBrowse({ facets })} />
          </aside>}
          <div ref={resultsRef} style={{ flex: 1, minWidth: 0 }}>
            <ShopToolbar state={state} count={items.length} isNarrow={isNarrow} onChange={updateBrowse}
              onOpenFilters={() => setDrawerOpen(true)} />
            <div ref={regionRef} className="shop-results" aria-busy={isUpdating}>
            {displayed.length > 0 ? <div style={{ display: 'grid',
              gridTemplateColumns: isNarrow ? 'repeat(1, 1fr)' : `repeat(auto-fill, minmax(${COLUMN_MIN}px, 1fr))`,
              columnGap: isNarrow ? 12 : COLUMN_GAP, rowGap: isNarrow ? 12 : COLUMN_GAP }}>
              {displayed.map(item => <ShopProductCard key={item.id} item={item} selection={sel[item.id]} onChoice={chooseProduct} />)}
            </div> : <div className="shop-empty">
              <h2>No products found</h2>
              <p>{state.query ? `Nothing matches “${state.query}”${facetCount(state.facets) ? ' with these filters' : ''}. Try a product name such as mirrors or blinds.`
                : 'These filters do not match any products. Remove a selection to see more of the range.'}</p>
              <div className="shop-empty-actions">
                {state.query && <button type="button" className="shop-filter-button" onClick={() => updateBrowse({ query: '' })}>Clear search</button>}
                <button type="button" className="shop-primary-button" onClick={clearAll}>Show all products</button>
                <Link to="/contact" style={{ color: tokens.ink, fontSize: typeScale.label.fontSize, textUnderlineOffset: 3 }}>Ask us for help</Link>
              </div>
            </div>}
            </div>
          </div>
        </div>
      </section>
    </main>
    {isNarrow && <FilterDrawer isOpen={isDrawerOpen} facets={state.facets} query={state.query} count={items.length}
      onChange={facets => updateBrowse({ facets })} onClear={clearAll}
      onClose={() => setDrawerOpen(false)} />}
  </div>;
}
