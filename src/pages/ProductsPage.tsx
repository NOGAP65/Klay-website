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
// groupForCategoryParam.
//
// IT OPENS ON THE SAME PHOTOGRAPHIC BAND the blind listing pages use — same
// height, same gradient, same breadcrumb and heading treatment — so the shop and
// the pages beneath it read as one section of the site rather than two designs
// that happen to share a nav. See the note on the banner below for why that
// particular frame.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { ShopCard, COLUMN_GAP, COLUMN_MIN } from '../components/ShopCard';
import { defaultSelection, type Selection } from '../data/configOptions';
import { useKlayStore } from '../store';
import { radius, tokens } from '../theme';
import { useIsMobile, useMediaQuery } from '../hooks/useIsMobile';
import { FilterRail } from '../components/FilterRail';
import {
  EMPTY_FACETS,
  applyFacets,
  facetCount,
  groupForCategoryParam,
  type CatalogueItem,
  type Facets,
} from '../data/catalogue';

type SortOption = 'featured' | 'price-low' | 'name-az';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'name-az', label: 'Name: A to Z' },
];

/** Wider than the 1240 the rest of the site uses, because the rail eats 200 of
 * it. At 1240 the grid would drop to three cards on a 1600 screen that has the
 * room for four. */
const PAGE_MAX = 1440;

const RAIL_WIDTH = 200;

// COLUMN_MIN, COLUMN_GAP and columnWidth come from the card, which is the
// thing that pins itself to them — see ShopCard. The grid is laid out from the
// same two numbers, so the tracks the browser draws and the widths the card
// pins to cannot disagree.

/** Below this the rail becomes a drawer behind a Filters button. It is not the
 * site's 768px phone breakpoint: a 200px rail plus a three-card grid needs
 * about 1100px before the cards get too small to carry a photograph, which
 * happens well above phone width. */
const RAIL_COLLAPSE = '(max-width: 1100px)';

export default function ProductsPage() {
  const isMobile = useIsMobile();
  const narrow = useMediaQuery(RAIL_COLLAPSE);
  const setScrollY = useKlayStore(s => s.setScrollY);
  const [searchParams] = useSearchParams();

  // Read once, from the URL, so /products?category=curtains opens narrowed and
  // an old link keeps meaning what it meant. After that the rail owns it —
  // re-reading on every render would fight the clicks.
  const [facets, setFacets] = useState<Facets>(() => {
    const range = groupForCategoryParam(searchParams.get('category'));
    return range === 'All' ? EMPTY_FACETS : { ...EMPTY_FACETS, groups: new Set([range]) };
  });
  const [sortBy, setSortBy] = useState<SortOption>('featured');



  /** EVERY CARD'S SELECTION, KEPT BY ID.
   *
   * Lifted out of the cards for the same reason the homepage lifts it: closing
   * a card unmounts its panel, and a configuration that evaporates when you
   * close it is one the customer has to make twice. Keyed by product so opening
   * a second card cannot inherit the first one's answers.
   *
   * Sparse — a product gets an entry the first time it is touched, and
   * defaultSelection fills in for everything else. */
  const [sel, setSel] = useState<Record<string, Selection>>({});
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);

  const items = useMemo(() => {
    let result: CatalogueItem[] = applyFacets(facets);

    if (sortBy === 'price-low') {
      // Unpriced items sort last rather than being treated as $0 — "price on
      // measure" is not a cheap price, and floating sixteen enquiry cards above
      // the six you can buy would be exactly backwards.
      result = [...result].sort((a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity));
    } else if (sortBy === 'name-az') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [facets, sortBy]);

  const activeCount = facetCount(facets);

  /** Every ticked value, flattened, so the chip row can list them in one pass
   * and each chip knows which group to remove itself from. */
  const activeChips = useMemo(
    () =>
      (['groups', 'lights', 'availability'] as const).flatMap(facet =>
        [...facets[facet]].map(value => ({ facet, value })),
      ),
    [facets],
  );

  const removeChip = (chip: { facet: keyof Facets; value: string }) => {
    const next = new Set(facets[chip.facet]);
    next.delete(chip.value);
    setFacets({ ...facets, [chip.facet]: next });
  };

  return (
    <>
      <Nav />

      <main style={{ background: tokens.warmWhite, minHeight: '100vh' }}>
        {/* The banner — the same photographic band the blind listing pages open
            with, so the shop and the pages under it are recognisably one
            section of the site rather than two designs.

            THE FRAME IS THE BEDROOM WITH SHEERS AND DRAPES, and choosing it took
            some care: a banner over the whole catalogue is one photograph
            standing in for every product on the page. hero-room.jpg — the obvious
            candidate — has no window covering in it at all, just an armchair,
            which is a poor advertisement for a window furnishings shop. This one
            carries two products in the one shot and reads as "window", and it is
            the only frame in the repository that does. It is also not used
            anywhere in the grid below, so the banner is not a duplicate of a
            card thirty pixels under it. */}
        <section
          style={{
            position: 'relative',
            height: isMobile ? 280 : 360,
            paddingTop: 72,
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
                fontSize: 12,
                color: 'rgba(248,248,248,0.5)',
                marginBottom: 16,
              }}
            >
              <Link to="/" style={{ color: 'rgba(248,248,248,0.5)', textDecoration: 'none' }}>
                Home
              </Link>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ color: tokens.warmWhite }}>Shop</span>
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
                fontSize: 15,
                color: 'rgba(248,248,248,0.7)',
                lineHeight: 1.6,
                margin: 0,
                marginTop: 12,
                maxWidth: 520,
              }}
            >
              Blinds, curtains, shutters, awnings, wardrobes and shower screens — measured,
              made and installed by hand across Victoria.
            </p>
          </div>
        </section>

        {/* Rail and grid, side by side. The rail is sticky rather than scrolling
            away with the products — a filter you have to scroll back up to
            reach is a filter people stop using. */}
        <section
          style={{
            background: tokens.parchment,
            padding: narrow ? '24px 24px 80px' : '40px 80px 120px',
          }}
        >
          <div
            style={{
              maxWidth: PAGE_MAX,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 44,
            }}
          >
            {!narrow && (
              <aside
                style={{
                  width: RAIL_WIDTH,
                  flex: `0 0 ${RAIL_WIDTH}px`,
                  position: 'sticky',
                  // Clears the fixed nav, plus air.
                  top: 96,
                  // Its own scroll if the rail ever outgrows the viewport, so a
                  // long rail cannot trap the page.
                  maxHeight: 'calc(100vh - 130px)',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                }}
              >
                <FilterRail facets={facets} onChange={setFacets} />
              </aside>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Toolbar: what is showing, how it is sorted, and — on narrow
                  screens — the button that opens the rail as a drawer. */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  paddingBottom: 16,
                  marginBottom: activeChips.length ? 0 : 20,
                  borderBottom: `1px solid ${tokens.lineFaint}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {narrow && (
                    <button
                      onClick={() => setDrawerOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 16px',
                        borderRadius: radius.md,
                        fontFamily: tokens.body,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        background: activeCount ? tokens.charcoal : 'transparent',
                        color: activeCount ? tokens.warmWhite : tokens.ink,
                        border: `1px solid ${activeCount ? tokens.charcoal : tokens.line}`,
                      }}
                    >
                      Filters{activeCount ? ` (${activeCount})` : ''}
                    </button>
                  )}
                  <span
                    style={{
                      fontFamily: tokens.body,
                      fontSize: 13,
                      color: 'rgba(29,29,29,0.5)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {items.length} product{items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowSortDropdown(v => !v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      borderRadius: radius.md,
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
                          borderRadius: radius.md,
                          boxShadow: '0 8px 24px rgba(29,29,29,0.12)',
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

              {/* ACTIVE FILTERS, SPELLED OUT. With four groups it is easy to
                  leave something ticked, scroll down and wonder why the shop
                  only has three products in it — and on narrow screens the rail
                  is behind a button, so without this there is nothing on screen
                  saying anything is filtered at all. */}
              {activeChips.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 8,
                    padding: '16px 0 20px',
                  }}
                >
                  {activeChips.map(chip => (
                    <button
                      key={`${chip.facet}:${chip.value}`}
                      onClick={() => removeChip(chip)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 12px',
                        borderRadius: radius.md,
                        fontFamily: tokens.body,
                        fontSize: 12,
                        cursor: 'pointer',
                        background: tokens.warmWhite,
                        color: tokens.ink,
                        border: `1px solid ${tokens.line}`,
                      }}
                    >
                      {chip.value}
                      <span style={{ fontSize: 13, opacity: 0.5 }}>✕</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setFacets(EMPTY_FACETS)}
                    style={{
                      padding: '7px 4px',
                      marginLeft: 4,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: tokens.body,
                      fontSize: 12,
                      color: tokens.onDark,
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                    }}
                  >
                    Clear all
                  </button>
                </div>
              )}

              {items.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    // auto-fill rather than a fixed column count, so the grid
                    // simply takes as many ~270px cards as the space left by the
                    // rail allows: three at 1440, four above 1600, two on a
                    // phone. No breakpoint has to know about the rail's width.
                    gridTemplateColumns: narrow
                      ? 'repeat(2, 1fr)'
                      // 340, UP FROM 270, and the photograph is why. At 270 a
                    // 1440 viewport less the 200px rail fits four columns of
                    // about 290 — and a 4:5 picture 290 wide is smaller than
                    // the homepage's, on the page whose whole job is showing
                    // the product. At 340 the same width takes three of about
                    // 390, which is bigger than the row's own cards.
                    //
                    // Nothing spans two columns any more — no card opens — so
                    // this no longer has to divide by two. It stays at 340
                    // because that is what makes the picture bigger than the
                    // homepage row's, which was the reason for it.
                      : `repeat(auto-fill, minmax(${COLUMN_MIN}px, 1fr))`,
                    // Columns tight so adjacent photographs read as one wall;
                    // rows wide so the price of one product does not float
                    // midway to the picture below it.
                    // Even now the cards are self-contained tiles rather than
                    // a photograph with type under it. The wide row gap existed
                    // to stop one card's price floating toward the picture below
                    // it; with everything inside the tile there is nothing to
                    // separate, and an even gap reads as a wall of photographs.
                    columnGap: narrow ? 12 : COLUMN_GAP,
                    rowGap: narrow ? 12 : COLUMN_GAP,
                  }}
                >
                  {items.map(item => (
                    <ShopCard
                      key={item.id}
                      item={item}
                      sel={sel[item.id] ?? defaultSelection(item)}
                      onChange={(fieldId, choiceId) =>
                        setSel(prev => ({
                          ...prev,
                          [item.id]: { ...(prev[item.id] ?? defaultSelection(item)), [fieldId]: choiceId },
                        }))
                      }
                    />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '90px 24px' }}>
                  <p
                    style={{
                      fontFamily: tokens.display,
                      fontSize: 24,
                      fontWeight: 300,
                      color: tokens.ink,
                      margin: 0,
                    }}
                  >
                    Nothing matches all of those.
                  </p>
                  <p
                    style={{
                      fontFamily: tokens.body,
                      fontSize: 14,
                      color: 'rgba(29,29,29,0.5)',
                      marginTop: 10,
                    }}
                  >
                    Try removing a filter — or tell us what you are after.
                  </p>
                  <button
                    onClick={() => setFacets(EMPTY_FACETS)}
                    style={{
                      marginTop: 22,
                      padding: '13px 26px',
                      borderRadius: radius.md,
                      fontFamily: tokens.body,
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      background: tokens.fillStrong,
                      color: tokens.onFillStrong,
                      border: 'none',
                    }}
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* The rail as a drawer, below 1100. Same component, so the two can never
          offer different filters. */}
      {narrow && drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(29,29,29,0.45)', zIndex: 9500 }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 'min(340px, 88vw)',
              background: tokens.warmWhite,
              zIndex: 9600,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: `1px solid ${tokens.lineFaint}`,
              }}
            >
              <span
                style={{
                  fontFamily: tokens.body,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: tokens.ink,
                }}
              >
                Filters
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  color: tokens.ink,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <FilterRail facets={facets} onChange={setFacets} />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '16px 24px',
                borderTop: `1px solid ${tokens.lineFaint}`,
              }}
            >
              <button
                onClick={() => setFacets(EMPTY_FACETS)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: radius.md,
                  fontFamily: tokens.body,
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: tokens.ink,
                  border: `1px solid ${tokens.line}`,
                }}
              >
                Clear
              </button>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  flex: 2,
                  padding: '14px',
                  borderRadius: radius.md,
                  fontFamily: tokens.body,
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  background: tokens.fillStrong,
                  color: tokens.onFillStrong,
                  border: 'none',
                }}
              >
                Show {items.length}
              </button>
            </div>
          </div>
        </>
      )}

      <Footer />
    </>
  );
}
