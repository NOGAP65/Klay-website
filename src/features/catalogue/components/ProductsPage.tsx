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

import {
  useEffect,
  useMemo,
  useRef,
  useState } from 'react';
import { Link,
  useSearchParams } from 'react-router-dom';

import { radius, space, tokens, type as typeScale } from '@/ds';
import { useIsMobile,
  useMediaQuery } from '@/shared';

import { useKlayStore } from '../../../store';
import { type CatalogueItem } from '../constants';
import { EMPTY_FACETS } from '../lib/facets';
import {
  applyFacets,
  facetCount,
  groupForCategoryParam,
  type Facets,
} from '../lib/facets';
import { SORT_OPTIONS, sortProducts, type SortOption } from '../lib/sortProducts';

import { FilterRail } from './FilterRail';
import { ShopCard, COLUMN_MIN, COLUMN_GAP, columnWidth } from './ShopCard';
import { defaultSelection, type Selection } from '../configOptions';

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
  const isNarrow = useMediaQuery(RAIL_COLLAPSE);
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
  const [shouldShowSortDropdown, setShowSortDropdown] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  /** WHICH CARD IS OPEN, and it is one at a time. Held here rather than in the
   * card because "close the other one" is a decision only something that can
   * see both can make — and because a customer reading two sets of options at
   * once is reading neither. */
  const [openId, setOpenId] = useState<string | null>(null);

  /** THE CLOSE REVERSES THE OPEN rather than the panel vanishing and the box
   * then shrinking behind it. Clearing openId on the click would unmount the
   * panel on the spot and leave the width animating against an empty box, so
   * this holds the card open at full width while the panel fades, and only then
   * is the id cleared. Switching straight from one card to another skips the
   * wait: the outgoing panel has somewhere to go. */
  const [isClosing, setClosing] = useState(false);

  const toggle = (id: string) => {
    if (openId !== id) {
      setClosing(false);
      setOpenId(id);
      return;
    }
    setClosing(true);
  };

  useEffect(() => {
    if (!isClosing) return;
    const t = window.setTimeout(() => {
      setOpenId(null);
      setClosing(false);
    }, 260);
    return () => window.clearTimeout(t);
  }, [isClosing]);

  /** ONE GRID COLUMN, IN PIXELS, from the grid's own width.
   *
   * COMPUTED, NOT MEASURED, and that is the point: reading it off a sibling has
   * a race in it, because opening a card changes which items sit where and a
   * measurement taken mid-transition returns a number between one column and
   * two. auto-fill's rule is deterministic — as many minmax(COLUMN_MIN, 1fr)
   * tracks as fit with the gaps between them — so running the same arithmetic
   * the browser runs gives the answer with no window to be wrong in.
   *
   * The grid's own width has no such window either: opening a card does not
   * change how wide the grid is. */
  const gridRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => setColWidth(columnWidth(el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isNarrow]);

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

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);

  const items = useMemo(() => {
    const result: CatalogueItem[] = applyFacets(facets);
    return sortProducts(result, sortBy);
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

      <main style={{ background: tokens.paper, minHeight: '100vh' }}>
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
            paddingTop: space.band,
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

        {/* Rail and grid, side by side. The rail is sticky rather than scrolling
            away with the products — a filter you have to scroll back up to
            reach is a filter people stop using. */}
        <section
          style={{
            background: tokens.band,
            padding: isNarrow ? '24px 24px 80px' : '40px 80px 120px',
          }}
        >
          <div
            style={{
              maxWidth: PAGE_MAX,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: space.section,
            }}
          >
            {!isNarrow && (
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
                  gap: space.item,
                  paddingBottom: space.item,
                  marginBottom: activeChips.length ? 0 : 20,
                  borderBottom: `1px solid ${tokens.lineFaint}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: space.snug }}>
                  {isNarrow && (
                    <button
                      onClick={() => setDrawerOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: space.tight,
                        padding: `${space.tight}px ${space.item}px`,
                        borderRadius: radius.md,
                        fontFamily: tokens.body,
                        fontSize: typeScale.label.fontSize,
                        fontWeight: 500,
                        cursor: 'pointer',
                        background: activeCount ? tokens.charcoal : 'transparent',
                        color: activeCount ? tokens.paper : tokens.ink,
                        border: `1px solid ${activeCount ? tokens.charcoal : tokens.line}`,
                      }}
                    >
                      Filters{activeCount ? ` (${activeCount})` : ''}
                    </button>
                  )}
                  <span
                    style={{
                      fontFamily: tokens.body,
                      fontSize: typeScale.label.fontSize,
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
                      gap: space.tight,
                      padding: `${space.tight}px ${space.item}px`,
                      borderRadius: radius.md,
                      fontFamily: tokens.body,
                      fontSize: typeScale.label.fontSize,
                      cursor: 'pointer',
                      background: 'transparent',
                      color: tokens.ink,
                      border: `1px solid ${tokens.lineFaint}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>Sort: {SORT_OPTIONS.find(s => s.id === sortBy)?.label}</span>
                    <span style={{ fontSize: typeScale.micro.fontSize }}>▼</span>
                  </button>

                  {shouldShowSortDropdown && (
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
                          marginTop: space.hairline,
                          background: tokens.paper,
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
                              padding: `${space.snug}px ${space.item}px`,
                              fontFamily: tokens.body,
                              fontSize: typeScale.label.fontSize,
                              cursor: 'pointer',
                              background: sortBy === option.id ? tokens.band : 'transparent',
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
                    gap: space.tight,
                    padding: `${space.item}px 0 ${space.item}px`,
                  }}
                >
                  {activeChips.map(chip => (
                    <button
                      key={`${chip.facet}:${chip.value}`}
                      onClick={() => removeChip(chip)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: space.tight,
                        padding: `${space.tight}px ${space.snug}px`,
                        borderRadius: radius.md,
                        fontFamily: tokens.body,
                        fontSize: typeScale.label.fontSize,
                        cursor: 'pointer',
                        background: tokens.paper,
                        color: tokens.ink,
                        border: `1px solid ${tokens.line}`,
                      }}
                    >
                      {chip.value}
                      <span style={{ fontSize: typeScale.label.fontSize, opacity: 0.5 }}>✕</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setFacets(EMPTY_FACETS)}
                    style={{
                      padding: `${space.tight}px ${space.hairline}px`,
                      marginLeft: space.hairline,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: tokens.body,
                      fontSize: typeScale.label.fontSize,
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
                  ref={gridRef}
                  style={{
                    display: 'grid',
                    // auto-fill rather than a fixed column count, so the grid
                    // simply takes as many ~270px cards as the space left by the
                    // rail allows: three at 1440, four above 1600, two on a
                    // phone. No breakpoint has to know about the rail's width.
                    // 340, UP FROM 270, and the photograph is why. At 270 a
                    // 1440 viewport less the 200px rail fits four columns of
                    // about 290 — and a 4:5 picture 290 wide is smaller than
                    // the homepage's, on the page whose whole job is showing
                    // the product. At 340 the same width takes three of about
                    // 390, which is bigger than the row's own cards.
                    //
                    // It also has to divide by two: the open card spans two
                    // columns, so a row that fits three closed fits one open
                    // plus one closed with no orphan.
                    gridTemplateColumns: isNarrow
                      ? 'repeat(2, 1fr)'
                      : `repeat(auto-fill, minmax(${COLUMN_MIN}px, 1fr))`,
                    // Columns tight so adjacent photographs read as one wall;
                    // rows wide so the price of one product does not float
                    // midway to the picture below it.
                    // Even now the cards are self-contained tiles rather than
                    // a photograph with type under it. The wide row gap existed
                    // to stop one card's price floating toward the picture below
                    // it; with everything inside the tile there is nothing to
                    // separate, and an even gap reads as a wall of photographs.
                    columnGap: isNarrow ? 12 : COLUMN_GAP,
                    rowGap: isNarrow ? 12 : COLUMN_GAP,
                  }}
                >
                  {items.map(item => (
                    <ShopCard
                      key={item.id}
                      item={item}
                      isOpen={openId === item.id}
                      onToggle={() => toggle(item.id)}
                      colWidth={colWidth}
                      isShown={openId === item.id && !isClosing}
                      sel={sel[item.id] ?? defaultSelection(item)}
                      onChange={(fieldId, choiceId) =>
                        setSel(s => ({
                          ...s,
                          [item.id]: { ...(s[item.id] ?? defaultSelection(item)), [fieldId]: choiceId },
                        }))
                      }
                      isNarrow={isNarrow}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: `${space.band}px ${space.group}px` }}>
                  <p
                    style={{
                      fontFamily: tokens.display,
                      fontSize: typeScale.card.fontSize,
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
                      fontSize: typeScale.body.fontSize,
                      color: 'rgba(29,29,29,0.5)',
                      marginTop: space.tight,
                    }}
                  >
                    Try removing a filter — or tell us what you are after.
                  </p>
                  <button
                    onClick={() => setFacets(EMPTY_FACETS)}
                    style={{
                      marginTop: space.group,
                      padding: `${space.snug}px ${space.group}px`,
                      borderRadius: radius.md,
                      fontFamily: tokens.body,
                      fontSize: typeScale.label.fontSize,
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
      {isNarrow && isDrawerOpen && (
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
              background: tokens.paper,
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
                padding: `${space.item}px ${space.group}px`,
                borderBottom: `1px solid ${tokens.lineFaint}`,
              }}
            >
              <span
                style={{
                  fontFamily: tokens.body,
                  fontSize: typeScale.micro.fontSize,
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
                  fontSize: typeScale.subhead.fontSize,
                  cursor: 'pointer',
                  color: tokens.ink,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: `${space.group}px` }}>
              <FilterRail facets={facets} onChange={setFacets} />
            </div>

            <div
              style={{
                display: 'flex',
                gap: space.tight,
                padding: `${space.item}px ${space.group}px`,
                borderTop: `1px solid ${tokens.lineFaint}`,
              }}
            >
              <button
                onClick={() => setFacets(EMPTY_FACETS)}
                style={{
                  flex: 1,
                  padding: `${space.snug}px`,
                  borderRadius: radius.md,
                  fontFamily: tokens.body,
                  fontSize: typeScale.label.fontSize,
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
                  padding: `${space.snug}px`,
                  borderRadius: radius.md,
                  fontFamily: tokens.body,
                  fontSize: typeScale.label.fontSize,
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

    </>
  );
}
