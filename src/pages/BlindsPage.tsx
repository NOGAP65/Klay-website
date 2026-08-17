// ---------------------------------------------------------------------------
// ONE LISTING PAGE, FIVE BLIND TYPES — /blinds/roller-blinds, /venetian-blinds,
// /roman-blinds, /vertical-blinds, /panel-blinds.
//
// This was a page about roller blinds with the roller catalogue, the roller
// intro and the roller FAQ written into the markup. Four of the five blind types
// Klay sells had no page at all, so the taxonomy listed them and nothing on the
// site could reach them.
//
// It is now a template: everything that differs between the types — hero, intro,
// filter pills, what is on the shelf, the questions — comes off
// data/blindTypes.ts, keyed by the `slug` prop the router passes. Adding the
// sixth blind type is an entry in that file and a route.
//
// The design is deliberately unchanged from the roller page it grew out of, so
// the five siblings are recognisably one section of the site rather than five
// pages that happen to be about blinds.
//
// TWO CARDS, AND THE DIFFERENCE IS HONESTY. A roller item has a product slug and
// a price, so its card is a photograph, "From $220" and DESIGN YOURS into the
// configurator. Nothing else does, so those cards show the fabric named across a
// charcoal panel, PRICE ON MEASURE, and GET A QUOTE into the enquiry form with
// the item named. See the note at the top of data/blindTypes.ts — inventing four
// price grids so every card could say "From $x" was the alternative, and a
// made-up figure on a made-to-measure product is one the business has to honour.
// ---------------------------------------------------------------------------

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { BlindGlyph } from '../components/BlindGlyph';
// HARDWARE_HEX/HARDWARE_OPTIONS used to be imported here, for the three bracket
// dots the old card printed. They were the same three greys on every card in the
// grid and described the bracket rather than the blind; the fabric swatch row
// replaced them. Hardware is still chosen, in the configurator, where it is a
// decision rather than decoration.
import {
  BLIND_TYPE_LINKS,
  blindTypeBySlug,
  type BlindItem,
  type BlindType,
} from '../data/blindTypes';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'name-az';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'name-az', label: 'Name: A to Z' },
];

/** Grid columns for a set of this size. These cards are a fixed-ratio row, so a
 * count that does not divide leaves an orphan — five items across four columns
 * is a full row and then one lonely card, which reads as a page still loading.
 * Three columns turns the same five into 3 + 2, which reads as a set. */
const columnsFor = (n: number) => (n % 4 === 0 ? 4 : n < 4 ? n : 3);

/** Where an enquiry card goes. The item is named in the query so the contact
 * form opens with "Venetian Blinds — 50mm Basswood" already in the message
 * rather than making someone who just clicked a specific product retype it. */
const enquiryLink = (type: BlindType, item: BlindItem) =>
  `/contact?product=${encodeURIComponent(`${type.name} — ${item.name}`)}`;

/** How many fabric colours print on a card before the row becomes a count.
 * Seven fits the narrowest column without wrapping, and a wrapped swatch row
 * costs a line of height on every card to show colours eight through fourteen
 * that nobody is choosing from a listing page anyway. */
const SWATCHES_SHOWN = 7;

/** The swatch row — the single most useful thing one of these cards can say.
 *
 * Four roller blinds photographed in four similar rooms look like the same
 * product four times; what actually separates them is the fabric, and what
 * makes any of them feel buyable is that it comes in fourteen colours. Kookai
 * and Allbirds both put the colourway row on the card for exactly this reason,
 * and it is the thing Klay's old card was missing.
 *
 * SQUARES, NOT CIRCLES. Circles read as bullets or as status dots; squares read
 * as swatches — a cut piece of cloth — and they sit with a brand whose every
 * button is a 2px rectangle. This also replaces the three hardware dots the old
 * card carried, which described the bracket rather than the blind and were the
 * same three greys on every card in the grid. */
function SwatchRow({ colours }: { colours: { name: string; hex: string }[] }) {
  // SAMPLED ACROSS THE CARD, NOT THE FIRST SEVEN. RYNAMIC_COLOURS is ordered
  // light to dark, so slicing off the top gave White, Surfmist, Light Grey,
  // Dune, Cream, Sand and Beige — seven near identical creams, under which the
  // range appeared to be beige and beige only. Forest Green, Red, Deep Ocean
  // Blue and Black were all inside the "+7".
  //
  // Taking an even stride through the list instead spans the whole card, so the
  // row answers the question it is there to answer: how wide is this range.
  // Index 0 and the last index are always included — the extremes are the two
  // that matter most.
  const shown =
    colours.length <= SWATCHES_SHOWN
      ? colours
      : Array.from({ length: SWATCHES_SHOWN }, (_, i) =>
          colours[Math.round((i * (colours.length - 1)) / (SWATCHES_SHOWN - 1))],
        );
  const rest = colours.length - shown.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
      {shown.map(c => (
        <span
          key={c.name}
          title={c.name}
          style={{
            width: 13,
            height: 13,
            borderRadius: 1,
            background: c.hex,
            // A hairline on every swatch, not just the pale ones. Without it
            // White and Surfmist dissolve into the parchment ground and the row
            // appears to start three swatches in.
            border: '1px solid rgba(28,24,16,0.16)',
          }}
        />
      ))}
      {rest > 0 && (
        <span
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            color: 'rgba(28,24,16,0.45)',
            marginLeft: 4,
            letterSpacing: '0.02em',
          }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// THE CARD. Rebuilt against Kookai, Allbirds and DIY Blinds — all three of which
// agree on the thing Klay's card was doing wrong.
//
// NO CARD. There is no box: no white panel, no 12px radius, no border, no drop
// shadow, and nothing lifts on hover. The photograph sits straight on the
// section's ground and the type sits under it. Every reference does this, and
// the reason is that a listing grid is a wall of photographs — putting each one
// in a raised white tray means the eye reads twelve trays before it reads a
// single blind. Klay's old card had all five of those decorations at once.
//
// PORTRAIT, NOT SQUARE. 4:5. A window covering hangs, so the frame wants height,
// and every reference grid is portrait for the same reason its subject is.
//
// NO BUTTON. The whole tile is the link. A filled gold DESIGN YOURS on all four
// cards turned the grid into a row of buttons with pictures above them, and gold
// is meant to mean "the one action here" — it cannot mean that twelve times on
// one screen. What the button was carrying that mattered is whether this item is
// buyable, and the price line says that better: "From $220" against "Price on
// measure".
//
// THE LAST ROW IS WHAT VARIES. Colours for a roller; the descriptor line for a
// venetian, which has no colour card and whose names (25mm vs 50mm Aluminium)
// mean nothing without it. Same slot, same rhythm, different fact.
// ---------------------------------------------------------------------------
function ItemCard({ type, item }: { type: BlindType; item: BlindItem }) {
  const [hover, setHover] = useState(false);
  const buyable = Boolean(item.productSlug);

  return (
    <Link
      to={buyable ? `/products/${item.productSlug}` : enquiryLink(type, item)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'block', textDecoration: 'none' }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '4 / 5',
          overflow: 'hidden',
          borderRadius: 2,
          background: item.image ? '#EEEAE4' : tokens.charcoal,
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={`${item.name} — ${item.label}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              // The only thing hover does. The card does not move, gain a
              // shadow or change colour — the photograph breathes and that is
              // enough to say "this is live".
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        ) : (
          // NO PHOTOGRAPH OF THIS PRODUCT EXISTS — see the note at the top of
          // BlindGlyph. A line drawing of the mechanism, not a photograph of a
          // roller captioned "Venetian" and not the item's own name repeated a
          // centimetre above where it already appears. One shoot replaces this
          // with an `image` in the data and nothing in this file changes.
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <BlindGlyph type={type.slug} size="58%" opacity={hover ? 0.68 : 0.5} />
          </div>
        )}
      </div>

      {/* Eyebrow — the fabric or the finish. Muted rather than gold: gold on
          every card in a twelve-card grid stops being an accent and becomes the
          grid's body colour. */}
      <div
        style={{
          fontFamily: tokens.body,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(28,24,16,0.45)',
          marginTop: 16,
        }}
      >
        {item.label}
      </div>

      {/* Name and price on one baseline. Two rows here would push the swatches
          below the fold of a short viewport, and name-left / price-right is the
          arrangement every reference grid uses. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 5,
        }}
      >
        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: 21,
            fontWeight: 300,
            lineHeight: 1.15,
            margin: 0,
            color: hover ? tokens.gold : tokens.ink,
            transition: 'color 0.25s ease',
          }}
        >
          {item.name}
        </h3>
        <span
          style={{
            fontFamily: tokens.body,
            // The buyable/enquiry distinction the gold button used to carry.
            // A price is a number; "price on measure" is a sentence, so it is
            // set smaller and quieter rather than pretending to be one.
            fontSize: buyable ? 14 : 10,
            fontWeight: buyable ? 500 : 400,
            letterSpacing: buyable ? undefined : '0.1em',
            textTransform: buyable ? undefined : 'uppercase',
            whiteSpace: 'nowrap',
            color: buyable ? tokens.ink : 'rgba(28,24,16,0.42)',
          }}
        >
          {buyable ? `From $${item.priceFrom}` : 'Price on measure'}
        </span>
      </div>

      {/* What varies within this item. */}
      {item.colours ? (
        <SwatchRow colours={item.colours} />
      ) : (
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 13,
            lineHeight: 1.45,
            color: 'rgba(28,24,16,0.5)',
            margin: 0,
            marginTop: 10,
          }}
        >
          {item.tagline}
        </p>
      )}
    </Link>
  );
}

/** The row of five under the hero. These pages are siblings and there is no
 * other way between them — the nav's range menu stops at "Blinds" — so the
 * strip is load-bearing navigation, not decoration. */
function TypeStrip({ current, isMobile }: { current: string; isMobile: boolean }) {
  return (
    <div
      style={{
        background: tokens.warmWhite,
        borderBottom: `1px solid ${tokens.lineFaint}`,
        padding: isMobile ? '14px 24px' : '18px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          gap: isMobile ? 18 : 32,
          alignItems: 'center',
          // Five names do not fit a phone. They scroll sideways rather than
          // wrapping into a two-line block that pushes the grid down the page.
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {BLIND_TYPE_LINKS.map(t => {
          const active = t.slug === current;
          return (
            <Link
              key={t.slug}
              to={`/blinds/${t.slug}`}
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                fontWeight: active ? 500 : 400,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                color: active ? tokens.ink : 'rgba(28,24,16,0.5)',
                paddingBottom: 5,
                borderBottom: `1px solid ${active ? tokens.gold : 'transparent'}`,
                transition: 'color 0.2s ease, border-color 0.2s ease',
              }}
            >
              {t.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

interface BlindsPageProps {
  /** Which blind type this route is. Defaults to rollers, which is what bare
   * /blinds has always shown and what every existing link expects. */
  slug?: string;
}

export default function BlindsPage({ slug = 'roller-blinds' }: BlindsPageProps = {}) {
  const isMobile = useIsMobile();
  const setScrollY = useKlayStore(s => s.setScrollY);

  const type = blindTypeBySlug(slug) ?? blindTypeBySlug('roller-blinds')!;

  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);

  // Moving between the five types is a route change on the same component, so
  // React keeps the state — without this, filtering to Timber on venetians and
  // then clicking Roman leaves an empty grid and a pill that no longer exists.
  useEffect(() => {
    setActiveFilter('all');
    setOpenFaq(null);
    window.scrollTo(0, 0);
  }, [slug]);

  const filteredItems = useMemo(() => {
    let result = type.items.filter(
      item => activeFilter === 'all' || item.filter === activeFilter,
    );

    switch (sortBy) {
      case 'price-low':
        // Unpriced items sort last in either direction rather than being
        // treated as $0 or $∞ — "price on measure" is not a low price.
        result = [...result].sort(
          (a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity),
        );
        break;
      case 'price-high':
        result = [...result].sort(
          (a, b) => (b.priceFrom ?? -Infinity) - (a.priceFrom ?? -Infinity),
        );
        break;
      case 'name-az':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [type, activeFilter, sortBy]);

  const columns = columnsFor(filteredItems.length);

  return (
    <>
      <Nav />

      <main style={{ background: tokens.warmWhite, minHeight: '100vh' }}>
        {/* Hero */}
        <section
          style={{
            position: 'relative',
            height: isMobile ? 280 : 360,
            paddingTop: 72,
            overflow: 'hidden',
          }}
        >
          {/* A photograph where one exists — rollers — and a charcoal band
              carrying the mechanism drawing where one does not. Borrowing the
              roller frame for the other four would put a picture of the wrong
              product under the heading; see the note in BlindGlyph. */}
          {type.heroImage ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url('${type.heroImage}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: type.heroPosition ?? 'center',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, rgba(28,24,16,0.7) 0%, rgba(28,24,16,0.3) 100%)',
                }}
              />
            </>
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: tokens.charcoal,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                // Ranged right and past the edge, so the drawing is a large
                // quiet mark behind the type rather than a diagram parked in the
                // middle of a band. The copy runs down the left of this hero and
                // is never over it.
                paddingRight: isMobile ? 0 : '6vw',
                // The nav is fixed and overlays the top 72px of this band, so
                // the drawing centres in what is VISIBLE rather than in the
                // box — without it the head rail sits behind the nav bar.
                paddingTop: 72,
                overflow: 'hidden',
              }}
            >
              <BlindGlyph type={type.slug} size={isMobile ? 190 : 260} opacity={0.16} />
            </div>
          )}
          <div
            style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: isMobile ? '0 24px' : '0 80px',
              maxWidth: 1200,
              margin: '0 auto',
            }}
          >
            <nav
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                color: 'rgba(245,242,237,0.5)',
                marginBottom: 16,
              }}
            >
              <Link to="/" style={{ color: 'rgba(245,242,237,0.5)', textDecoration: 'none' }}>
                Home
              </Link>
              <span style={{ margin: '0 8px' }}>/</span>
              <Link to="/blinds" style={{ color: 'rgba(245,242,237,0.5)', textDecoration: 'none' }}>
                Blinds
              </Link>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ color: tokens.warmWhite }}>{type.name}</span>
            </nav>
            <h1
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 36 : 52,
                fontWeight: 300,
                color: tokens.warmWhite,
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {type.name}
            </h1>
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 15,
                color: 'rgba(245,242,237,0.7)',
                lineHeight: 1.6,
                margin: 0,
                marginTop: 12,
                maxWidth: 520,
              }}
            >
              {type.intro}
            </p>
          </div>
        </section>

        <TypeStrip current={type.slug} isMobile={isMobile} />

        {/* Filter & Sort bar */}
        <div
          style={{
            background: tokens.warmWhite,
            padding: isMobile ? '16px 24px' : '20px 24px',
            borderBottom: `1px solid ${tokens.lineFaint}`,
            position: 'sticky',
            top: 72,
            zIndex: 90,
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: 16,
            }}
          >
            {/* Filter tabs. 'All' is prepended here rather than written into
                every type's filter list, and its label names the axis the pills
                below it divide on — fabric for a roller, finish for a venetian. */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[{ id: 'all', label: 'All' }, ...type.filters].map(option => (
                <button
                  key={option.id}
                  onClick={() => setActiveFilter(option.id)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 6,
                    fontFamily: tokens.body,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: activeFilter === option.id ? tokens.charcoal : 'transparent',
                    color: activeFilter === option.id ? tokens.warmWhite : tokens.ink,
                    border: `1px solid ${activeFilter === option.id ? tokens.charcoal : tokens.lineFaint}`,
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Sort & count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span
                style={{
                  fontFamily: tokens.body,
                  fontSize: 13,
                  color: 'rgba(28,24,16,0.5)',
                  whiteSpace: 'nowrap',
                }}
              >
                {filteredItems.length} option{filteredItems.length !== 1 ? 's' : ''}
              </span>

              {/* Sort dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 6,
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
                        borderRadius: 8,
                        boxShadow: '0 8px 24px rgba(28,24,16,0.12)',
                        overflow: 'hidden',
                        zIndex: 99,
                        minWidth: 180,
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

        {/* The grid */}
        <section
          style={{
            background: tokens.parchment,
            padding: isMobile ? '32px 24px 80px' : '48px 24px 120px',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {filteredItems.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? 'repeat(2, 1fr)'
                    : `repeat(${columns}, 1fr)`,
                  // Asymmetric now that the cards have no boxes. Columns run
                  // tight, because adjacent photographs reading as one wall is
                  // the effect every reference grid is after. Rows run wide,
                  // because the type under a card has to belong to the card
                  // above it rather than to the photograph below — with an even
                  // gap the price of one blind floats midway to the next.
                  columnGap: isMobile ? 12 : 20,
                  rowGap: isMobile ? 36 : 56,
                }}
              >
                {filteredItems.map(item => (
                  <ItemCard key={item.id} type={type} item={item} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <p style={{ fontFamily: tokens.body, fontSize: 16, color: 'rgba(28,24,16,0.5)' }}>
                  Nothing here under that filter.
                </p>
                <button
                  onClick={() => setActiveFilter('all')}
                  style={{
                    marginTop: 16,
                    padding: '12px 24px',
                    borderRadius: 6,
                    fontFamily: tokens.body,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: tokens.gold,
                    color: tokens.ink,
                    border: 'none',
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section
          style={{
            background: tokens.warmWhite,
            padding: isMobile ? '64px 24px 80px' : '80px 24px 100px',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
                FAQ
              </p>
              <h2
                style={{
                  fontFamily: tokens.display,
                  fontSize: isMobile ? 28 : 36,
                  fontWeight: 300,
                  color: tokens.ink,
                  margin: 0,
                  marginTop: 12,
                }}
              >
                Common Questions
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {type.faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={faq.q} style={{ borderBottom: `1px solid ${tokens.lineFaint}` }}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 24,
                        padding: '20px 0',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: tokens.display,
                          fontSize: 18,
                          fontWeight: 400,
                          color: tokens.ink,
                          margin: 0,
                        }}
                      >
                        {faq.q}
                      </h3>
                      <span
                        style={{
                          fontSize: 24,
                          color: tokens.gold,
                          fontWeight: 300,
                          transition: 'transform 0.3s ease',
                          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                        }}
                      >
                        +
                      </span>
                    </button>
                    <div
                      style={{
                        maxHeight: isOpen ? 240 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease, padding 0.3s ease',
                        paddingBottom: isOpen ? 20 : 0,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: tokens.body,
                          fontSize: 15,
                          color: 'rgba(28,24,16,0.65)',
                          lineHeight: 1.7,
                          margin: 0,
                        }}
                      >
                        {faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <p style={{ fontFamily: tokens.body, fontSize: 15, color: 'rgba(28,24,16,0.6)', margin: 0 }}>
                Still have questions?{' '}
                <Link to="/visualiser" style={{ color: tokens.gold, textDecoration: 'none', fontWeight: 500 }}>
                  Try the Visualiser
                </Link>{' '}
                or call 1300 00 KLAY
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
