// ---------------------------------------------------------------------------
// 4. Our Range — one row of range tiles, arrows, and it moves on its own.
//
// This replaces TWO sections: the Indoor/Outdoor/Wardrobes category grid and the
// Dusk/Veil/Duo SKU grid that followed it. They were the same question asked
// twice — two photo grids back to back, both saying "pick what you want to shop
// for", about 1,900px of page between them.
//
// Of the two, the category grid was the weaker idea even though it was the better
// looking one. Nobody shops by "Indoor". They shop for blinds, or for curtains.
// Indoor/Outdoor/Wardrobes is how the business is organised, not how the customer
// thinks — Kookai's tiles are Jackets/Tops/Bottoms, one level below where Klay's
// were. The SKU grid failed the other way: "Dusk / Blockout Roller / From $220"
// makes a first-time visitor decode a brand name before they can decide anything,
// and three of its four cards were rollers, which made the range look narrower
// than the business actually is.
//
// SAME TILE, SMALLER, IN A ROW. The tile is PhotoTile, unchanged — the same object
// the category grid used, because that design works. What changed is the scale and
// the axis: 300px wide against the category tiles' 480, and a horizontal scroller
// instead of a grid.
//
// WHY A CAROUSEL EARNS ITS PLACE HERE. Not for motion's sake. A grid has to divide
// evenly or it leaves holes, and that constraint is what forced every previous
// version of this section into either three tiles or four — always fewer than the
// range Klay actually sells. A row has no such constraint, so this is the first
// version of this section that shows the whole range without dropping one to make
// the maths work. The drift is also the only honest way to say "there is more
// here than fits", which is exactly the message.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens, motion, prefersReducedMotion } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useCartStore } from '../../store/cartStore';
// The row reads data/catalogue.ts — the same fourteen products the shop lists,
// in the same order, rendered by the same tile. It used to read a data/ranges.ts
// of its own holding six invented ranges, which meant the homepage and the shop
// described the business differently: the homepage offered "Screens" and
// "Shelving" as peers of "Blinds", and neither Honeycomb Blinds nor Roller
// Shutters nor Frameless Shower Screens appeared anywhere on it.
import { CATALOGUE, standardBuild } from '../../data/catalogue';
import { PhotoTile, SectionBand, TILE_GAP, useHover } from './primitives';

/** How much of the viewport the row is allowed, centred in what is left.
 *
 * It ran the full width, and at that scale the section owned the whole screen:
 * four tall cards edge to edge is a wall, and a wall reads as the page rather
 * than as one section of it. Held to seventy percent with the warm white
 * showing down both sides, it reads as a row of product ON the page — the
 * margins are what tell you there is more page here than this.
 *
 * Full width on mobile, where seventy percent of a phone is not a column. */
const ROW_WIDTH = '70%';

/** Card width, as a share of the row rather than a fixed pixel count.
 *
 * It was a flat 300px, and that is what left the odd sliver of dead space: six
 * fixed cards land wherever 6 x 304 happens to land against the viewport, so the
 * row ended on a partial card of arbitrary width and the amount left over changed
 * with every monitor. Sized in even shares, exactly three cards fill the row at
 * any width — nothing is ever cut mid-card.
 *
 * THREE, NOT FOUR, and that follows from the row being narrowed to 70%. Four
 * shares of ~1000px is 250px a card, below the 300 the labels were already
 * tight at — "Frameless Shower Screens" needs the width. Three keeps each card
 * at ~330px, which is where it was when the row ran edge to edge.
 *
 * Fourteen cards, three visible: the arrows always have somewhere to go. */
const cardBasis = (isMobile: boolean) =>
  isMobile
    ? `calc((100% - ${TILE_GAP}px) / 1.6)`
    : `calc((100% - ${2 * TILE_GAP}px) / 3)`;

/** Tile height. Up with the width, so the card keeps its portrait crop — a window
 * covering hangs, so the frame wants height. */
const CARD_H = 470;
const CARD_H_MOBILE = 340;

/** How long the row rests before advancing itself. Five seconds — ten read as a
 * row that had stopped rather than one that was waiting, since with four of six
 * cards on screen a whole minute could pass without the visitor seeing it move
 * at all. Still slow enough to read a label, a line and a price before it goes. */
const AUTO_MS = 5000;

/** Round arrow, overlaid on the row's edge and vertically centred.
 *
 * Overlaid rather than parked above the row, because the section's heading band
 * is centred and a pair of arrows ranged right underneath it reads as debris
 * beside the headline. On the row's edges they read as controls belonging to the
 * row. Warm white fill so they hold over any photograph — a hairline-on-
 * transparent arrow disappears against the pale frames here. */
function Arrow({
  direction,
  onClick,
  disabled,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
}) {
  const { hover, bind } = useHover();
  const active = hover && !disabled;
  return (
    <button
      {...bind}
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Previous ranges' : 'Next ranges'}
      style={{
        position: 'absolute',
        top: '50%',
        [direction === 'prev' ? 'left' : 'right']: 20,
        transform: 'translateY(-50%)',
        zIndex: 2,
        width: 46,
        height: 46,
        borderRadius: '50%',
        border: 'none',
        background: active ? tokens.gold : tokens.warmWhite,
        color: tokens.ink,
        fontFamily: tokens.body,
        fontSize: 17,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        // Fades out rather than vanishing at the ends of the row, so the control
        // stays where the pointer expects it.
        opacity: disabled ? 0 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        boxShadow: '0 4px 14px rgba(28,24,16,0.22)',
        transition: `${motion.button}, opacity 0.3s ease`,
      }}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}

export function RangeCarousel() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const addItem = useCartStore(s => s.addItem);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [paused, setPaused] = useState(false);
  // Read once. A row that advances itself is exactly what this preference exists
  // to stop; under it the row holds still and becomes one the reader scrolls.
  const [reduceMotion] = useState(prefersReducedMotion);

  /** One card plus its strip. Measured off the rendered row rather than computed
   * from a constant, because the cards are sized in percentages now — the arrows
   * have to move by whatever a quarter of THIS viewport turned out to be. */
  const step = () => {
    const el = scrollerRef.current;
    const first = el?.firstElementChild as HTMLElement | undefined;
    return first ? first.offsetWidth + TILE_GAP : 0;
  };

  /** Which arrows are live. Read off real scroll position rather than tracked in
   * state, so a touch swipe or a trackpad scroll updates them too — this row is
   * natively scrollable and the arrows are not its only control. */
  const syncEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    // 2px of slack: scrollWidth and clientWidth are fractional at some zoom
    // levels and an exact comparison never becomes true, which would leave the
    // next arrow live at the end of the row forever.
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  const scrollByCards = (n: number) => {
    scrollerRef.current?.scrollBy({ left: n * step(), behavior: 'smooth' });
  };

  useEffect(syncEdges, [syncEdges]);

  /** Shop Now. The product's standard build goes in the cart and the visitor
   * lands on the cart, where the next click is checkout — see data/catalogue's
   * standardBuild for what each product goes in as.
   *
   * Navigating rather than staying put with a "✓ Added" flash, because the
   * point of the change is the two-click path out. A confirmation that leaves
   * the visitor on the homepage has spent one of those two clicks on being
   * told something. */
  const shopNow = (item: (typeof CATALOGUE)[number]) => () => {
    addItem(standardBuild(item));
    navigate('/cart');
    // The app keeps the window's scroll position across a route change — it has
    // no scroll restoration of any kind — so a click from a row two thirds down
    // the homepage arrived at the cart's FOOTER, showing the site's contact
    // details rather than the thing just added. Reset here rather than adding a
    // global handler, which would be a change to every route on the site.
    window.scrollTo(0, 0);
  };

  // The row moves on its own when it is left alone. It pauses under the pointer,
  // and on reaching the end it returns to the start rather than stopping — a
  // carousel that quietly dies after one pass looks broken rather than finished.
  useEffect(() => {
    if (reduceMotion || paused) return;
    const tick = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step(), behavior: 'smooth' });
      }
    }, AUTO_MS);
    return () => window.clearInterval(tick);
  }, [paused, reduceMotion]);

  return (
    // Warm white, the ground the category grid had — and the strip between the
    // cards is this colour showing through. See TILE_GAP.
    <section style={{ background: tokens.warmWhite }}>
      {/* Compact. This is the first section under the hero, so every pixel the
          band takes is a pixel of product pushed below the fold — which defeats
          the point of moving the range up here in the first place. Same type as
          every other band on the page, so the page still speaks in one voice;
          only the air around it is tighter. */}
      <SectionBand
        label="The collection"
        title="Our Range"
        sub="Made to measure. Installed by experts."
        isMobile={isMobile}
        compact
      />

      {/* The same strip down the outside edges as between the cards, so the row
          is framed on all four sides by warm white rather than running off into
          the viewport on the left and right. Grid gap and flex gap both only
          apply BETWEEN items, so the outer two have to be padding — and putting
          it here rather than on the scroller matters: padding on a scroll
          container sits at the start and end of the scrollable CONTENT, so it
          would slide away with the row instead of holding the edges. */}
      {/* paddingBottom closes the section. Without it the last row of Shop Now
          chips sat hard against the charcoal band below, so the row read as
          having been cut off rather than as having ended — the strips frame it on
          three sides and the fourth was the next section.

          Deliberately thin, and it was 64. That is a section's worth of air: it
          separated the row from the banner below instead of finishing it, leaving
          a band of empty warm white doing nothing between two things that both
          want attention. This is a margin closing a section, not a gap between
          two — closer in weight to the 4px strips framing the other three sides
          than to the padding a real section carries. */}
      {/* Seventy percent of the viewport, centred — see ROW_WIDTH. The margins
          are auto rather than a symmetric padding so the row stays centred
          whatever the section is nested in. */}
      <div
        style={{
          position: 'relative',
          width: isMobile ? 'auto' : ROW_WIDTH,
          marginLeft: isMobile ? undefined : 'auto',
          marginRight: isMobile ? undefined : 'auto',
          paddingLeft: TILE_GAP,
          paddingRight: TILE_GAP,
          paddingBottom: isMobile ? 20 : 26,
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Arrows are hidden on mobile: the row is natively scrollable, a thumb
            is a better control than a 46px target, and two buttons floating over
            a 232px card cover most of it. */}
        {!isMobile && (
          <>
            <Arrow direction="prev" onClick={() => scrollByCards(-1)} disabled={atStart} />
            <Arrow direction="next" onClick={() => scrollByCards(1)} disabled={atEnd} />
          </>
        )}

        <div
          ref={scrollerRef}
          onScroll={syncEdges}
          className="klay-hscroll"
          style={{
            display: 'flex',
            gap: TILE_GAP,
            overflowX: 'auto',
            // Snaps to card edges so the row never rests showing two half cards,
            // however it was moved — arrow, thumb or trackpad.
            scrollSnapType: 'x mandatory',
          }}
        >
          {CATALOGUE.map(item => (
            <div
              key={item.id}
              style={{ flex: `0 0 ${cardBasis(isMobile)}`, scrollSnapAlign: 'start' }}
            >
              <PhotoTile
                to={item.to}
                label={item.name}
                image={item.image}
                objectPosition={item.imagePosition}
                blurb={item.colours ? undefined : item.tagline}
                note={item.priceFrom !== undefined ? `$${item.priceFrom}` : 'Price on measure'}
                cta="Shop Now"
                // The chip adds and goes to the cart; the rest of the tile
                // still opens the product. See PhotoTile's onCta.
                onCta={shopNow(item)}
                // Stacked, not beside the label — see ctaBelow. These cards are
                // 300px wide against the category tiles' 480.
                ctaBelow
                minHeight={isMobile ? CARD_H_MOBILE : CARD_H}
                // Down from the category tiles' clamp(28px, 3vw, 40px). At 300px
                // wide, 40px of Cormorant put "Blockout Curtains" onto three
                // lines and left no room under it for the blurb and the price.
                labelSize="clamp(19px, 1.7vw, 23px)"
                glyph={item.glyph}
                colours={item.colours}
                alt={`${item.name} — ${item.group}`}
                // Same reason as the shop's cards: the label block runs name,
                // price, sometimes a swatch row and a stacked chip, which reaches
                // well up a pale photograph.
                scrim="deep"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
