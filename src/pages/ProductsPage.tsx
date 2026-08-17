// ---------------------------------------------------------------------------
// /products — THE SHOP. One page, the whole range, filters.
//
// This file used to be a redirect. It took ?category=<slug>, looked it up in a
// hand-written map and forwarded you to whichever page could best cope — which
// meant the site had no page listing what Klay sells, and the nav had to carry
// the taxonomy itself: first three category dropdowns, then a range menu, then
// six words spelled across the bar. Every one of those was the navigation doing
// a page's job.
//
// So: SHOP is one link, and this is where it goes. Everything Klay makes is on
// it, and narrowing happens here, in filters, where the customer can see what
// they are narrowing from. data/catalogue.ts assembles the list; nothing about
// the range is written down in this file.
//
// The old ?category= links still work — they preselect a filter rather than
// redirecting, so an old homepage tile lands on the shop already narrowed. See
// rangeForCategoryParam.
//
// THE HERO IS TYPE, NOT A PHOTOGRAPH. Every other landing band on the site runs
// a room shot behind its heading, and doing it here would mean choosing one
// product's photograph to stand for all twenty-two — the grid below is the
// photography, and putting a nineteenth room shot above it competes with the
// thing the page exists to show.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  CATALOGUE,
  RANGE_FILTERS,
  rangeForCategoryParam,
  type CatalogueItem,
} from '../data/catalogue';

type SortOption = 'featured' | 'price-low' | 'name-az';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'name-az', label: 'Name: A to Z' },
];

export default function ProductsPage() {
  const isMobile = useIsMobile();
  const setScrollY = useKlayStore(s => s.setScrollY);
  const [searchParams] = useSearchParams();

  // Read once, from the URL, so /products?category=curtains opens narrowed and
  // an old link keeps meaning what it meant. After that the pills own it —
  // re-reading on every render would fight the click.
  const [activeRange, setActiveRange] = useState(() =>
    rangeForCategoryParam(searchParams.get('category')),
  );
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);

  const items = useMemo(() => {
    let result: CatalogueItem[] =
      activeRange === 'All' ? [...CATALOGUE] : CATALOGUE.filter(i => i.range === activeRange);

    if (sortBy === 'price-low') {
      // Unpriced items sort last rather than being treated as $0 — "price on
      // measure" is not a cheap price, and floating eighteen enquiry cards
      // above the four you can buy would be exactly backwards.
      result = [...result].sort((a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity));
    } else if (sortBy === 'name-az') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [activeRange, sortBy]);

  const columns = isMobile ? 2 : 4;

  return (
    <>
      <Nav />

      <main style={{ background: tokens.warmWhite, minHeight: '100vh' }}>
        {/* The band. Type on parchment — see the note at the top of the file. */}
        <section
          style={{
            background: tokens.parchment,
            padding: isMobile ? '112px 24px 40px' : '150px 80px 52px',
          }}
        >
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 11,
                fontWeight: 500,
                color: tokens.gold,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                margin: 0,
              }}
            >
              The Shop
            </p>
            <h1
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 38 : 60,
                fontWeight: 300,
                color: tokens.ink,
                lineHeight: 1.05,
                margin: 0,
                marginTop: 14,
              }}
            >
              Everything we make.
            </h1>
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 15,
                color: 'rgba(28,24,16,0.55)',
                lineHeight: 1.65,
                margin: 0,
                marginTop: 14,
                maxWidth: 560,
              }}
            >
              Blinds, curtains, awnings, wardrobes, screens and shelving — measured, made
              and installed by hand across Victoria.
            </p>
          </div>
        </section>

        {/* Filters. Sticky, because this grid is long enough that the pills
            scroll away before you have decided, and a filter bar you have to
            scroll back up to reach is a filter bar people stop using. */}
        <div
          style={{
            background: tokens.warmWhite,
            padding: isMobile ? '16px 24px' : '20px 80px',
            borderBottom: `1px solid ${tokens.lineFaint}`,
            position: 'sticky',
            top: 72,
            zIndex: 90,
          }}
        >
          <div
            style={{
              maxWidth: 1240,
              margin: '0 auto',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: 16,
            }}
          >
            {/* All, then the six ranges. The pills are built from the catalogue
                itself, so a range with nothing in it never gets one. */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: isMobile ? 'nowrap' : 'wrap',
                overflowX: isMobile ? 'auto' : 'visible',
                scrollbarWidth: 'none',
              }}
            >
              {[{ id: 'All', label: 'All', count: CATALOGUE.length }, ...RANGE_FILTERS].map(f => {
                const active = activeRange === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveRange(f.id)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 2,
                      fontFamily: tokens.body,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      background: active ? tokens.charcoal : 'transparent',
                      color: active ? tokens.warmWhite : tokens.ink,
                      border: `1px solid ${active ? tokens.charcoal : tokens.lineFaint}`,
                    }}
                  >
                    {f.label}
                    <span style={{ opacity: 0.5, marginLeft: 7, fontWeight: 400 }}>{f.count}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span
                style={{
                  fontFamily: tokens.body,
                  fontSize: 13,
                  color: 'rgba(28,24,16,0.5)',
                  whiteSpace: 'nowrap',
                }}
              >
                {items.length} product{items.length !== 1 ? 's' : ''}
              </span>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSortDropdown(v => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 2,
                    fontFamily: tokens.body,
                    fontSize: 13,
                    cursor: 'pointer',
                    background: 'transparent',
                    color: tokens.ink,
                    border: `1px solid ${tokens.lineFaint}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>Sort: {SORT_OPTIONS.find(s => s.id === sortBy)?.label}</span>
                  <span style={{ fontSize: 10 }}>▼</span>
                </button>

                {showSortDropdown && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                      onClick={() => setShowSortDropdown(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 4,
                        background: tokens.warmWhite,
                        border: `1px solid ${tokens.lineFaint}`,
                        borderRadius: 2,
                        boxShadow: '0 8px 24px rgba(28,24,16,0.12)',
                        overflow: 'hidden',
                        zIndex: 99,
                        minWidth: 190,
                      }}
                    >
                      {SORT_OPTIONS.map(option => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSortBy(option.id);
                            setShowSortDropdown(false);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 16px',
                            fontFamily: tokens.body,
                            fontSize: 13,
                            cursor: 'pointer',
                            background: sortBy === option.id ? tokens.parchment : 'transparent',
                            color: tokens.ink,
                            border: 'none',
                            borderBottom: `1px solid ${tokens.lineFaint}`,
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* The grid. */}
        <section
          style={{
            background: tokens.parchment,
            padding: isMobile ? '32px 24px 80px' : '52px 80px 120px',
          }}
        >
          <div
            style={{
              maxWidth: 1240,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              // Columns tight so adjacent photographs read as one wall; rows
              // wide so the price of one product does not float midway to the
              // picture below it. See the note in ProductCard about the box.
              columnGap: isMobile ? 12 : 20,
              rowGap: isMobile ? 36 : 56,
            }}
          >
            {items.map(item => (
              <ProductCard
                key={item.id}
                to={item.to}
                name={item.name}
                eyebrow={item.range}
                tagline={item.tagline}
                priceFrom={item.priceFrom}
                image={item.image}
                imagePosition={item.imagePosition}
                glyph={item.glyph}
                colours={item.colours}
              />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
