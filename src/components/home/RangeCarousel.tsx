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
// version of this section that shows all six ranges without dropping one to make
// the maths work. The drift is also the only honest way to say "there is more here
// than fits", which is exactly the message.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import { tokens, motion, prefersReducedMotion } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PRODUCTS } from '../../data/products';
import { getSubcategoryBySlug } from '../../data/categories';
import { PhotoTile, SectionBand, TILE_GAP, useHover } from './primitives';

/** Card width, as a share of the row rather than a fixed pixel count.
 *
 * It was a flat 300px, and that is what left the odd sliver of dead space: six
 * fixed cards land wherever 6 x 304 happens to land against the viewport, so the
 * row ended on a partial card of arbitrary width and the amount left over changed
 * with every monitor. Sized in quarters, exactly four cards fill the row at any
 * width — nothing is ever cut mid-card, and each one is ~357px on a 1440 screen,
 * which is also bigger than the 300 they were.
 *
 * Six cards, four visible: the arrows always have somewhere to go. */
const cardBasis = (isMobile: boolean) =>
  isMobile
    ? `calc((100% - ${TILE_GAP}px) / 1.6)`
    : `calc((100% - ${3 * TILE_GAP}px) / 4)`;

/** Tile height. Up with the width, so the card keeps its portrait crop — a window
 * covering hangs, so the frame wants height. */
const CARD_H = 470;
const CARD_H_MOBILE = 340;

/** How long the row rests before advancing itself. Five seconds — ten read as a
 * row that had stopped rather than one that was waiting, since with four of six
 * cards on screen a whole minute could pass without the visitor seeing it move
 * at all. Still slow enough to read a label, a line and a price before it goes. */
const AUTO_MS = 5000;

/** Cheapest roller, from the catalogue rather than typed out — the tile's
 * from-price has to move when the catalogue does. */
const ROLLER_FROM = Math.min(...PRODUCTS.map(p => p.priceFrom));

/** Tagline for a subcategory, read out of the taxonomy. These sentences are
 * already written down in data/categories.ts and a second copy here is a copy
 * that goes stale. */
const taglineFor = (slug: string): string | undefined =>
  getSubcategoryBySlug('indoor', slug)?.tagline ??
  getSubcategoryBySlug('outdoor', slug)?.tagline ??
  getSubcategoryBySlug('wardrobes', slug)?.tagline;

const priceFor = (slug: string): number | undefined =>
  getSubcategoryBySlug('indoor', slug)?.priceFrom;

interface Range {
  label: string;
  to: string;
  blurb?: string;
  note?: string;
  /** Omitted where Klay has no photograph of the range. See the note on
   * Plantation Shutters below. */
  image?: string;
  objectPosition?: string;
  /** "Shop Now" only where the click genuinely reaches a shop. */
  cta: string;
}

// SIX RANGES, at the grain the business actually sells in: curtains collapse to
// one tile, and Outdoor and Wardrobes each split into the two things people search
// for separately. Sheer and Blockout were two tiles out of six spent on one
// product with two fabrics, while awnings, screens and shelving — three distinct
// purchases — had no tile at all between them.
//
// EVERY TILE SAYS SHOP NOW. Note that only Blinds currently reaches a shop: the
// other five resolve through ProductsPage to the enquiry form. That is a promise
// the routing does not yet keep, and the fix is pages, not a softer label.
//
// ORDERED so the two tiles with no photograph (Awnings, Screens) do not sit
// together. Alternating them against photographed ranges is the difference between
// a row with two gaps in it and a row that reads as half-built.
const RANGES: Range[] = [
  {
    label: 'Blinds',
    to: '/blinds',
    blurb: 'Blockout, sunscreen and dual.',
    note: `$${ROLLER_FROM}`,
    image: '/images/lifestyle/room-kitchen.png',
    objectPosition: 'center 34%',
    cta: 'Shop Now',
  },
  {
    label: 'Curtains',
    to: '/products?category=curtains',
    blurb: 'Sheer, blockout and lined.',
    // The cheaper of the two curtain types, so the from-price is the honest
    // entry point to the range rather than to one fabric within it.
    note: `$${Math.min(priceFor('sheer-curtains') ?? 360, priceFor('blockout-curtains') ?? 320)}`,
    // The bedroom frame the old Indoor category tile used. It carries sheers AND
    // heavy drapes in the one shot, which is the right picture for a tile that
    // now stands for the whole curtain range rather than one fabric.
    image: '/images/categories/indoor.jpg',
    objectPosition: '62% center',
    cta: 'Shop Now',
  },
  {
    // NO PHOTOGRAPH EXISTS — see the note on Screens below.
    label: 'Awnings',
    to: '/products?category=folding-arm-awnings',
    blurb: taglineFor('folding-arm-awnings'),
    cta: 'Shop Now',
  },
  {
    label: 'Wardrobes',
    to: '/wardrobes',
    blurb: 'Built-in, walk-in and sliding.',
    // THE TWO STORAGE TILES ARE CROPS OF ONE PHOTOGRAPH, and that is deliberate
    // rather than lazy. range/wardrobes.jpg and categories/wardrobes.jpg turn out
    // to be the same frame at two zoom levels, so using one on each tile printed
    // the same picture twice with two different words under it.
    //
    // What saves it is that the frame is composed left to right exactly along the
    // line the two tiles divide on: hanging garments on a rail down the left,
    // open shelves and drawers across the right. Cropped to its left third this
    // is a wardrobe; cropped to its right third it is shelving. Two honest
    // pictures of two different products that happen to share a room — which is
    // what a fitted walk-in actually is.
    image: '/images/categories/wardrobes.jpg',
    objectPosition: '13% center',
    cta: 'Shop Now',
  },
  {
    // NO PHOTOGRAPH EXISTS, and this is now the biggest asset gap on the page.
    // There is not one awning, screen, café blind or louvre roof anywhere in
    // public/images — the only outdoor frame in the repository shows a doorway
    // onto a deck with the room's INDOOR sheers hanging in it, which is why it is
    // not being used here. An indoor sheer captioned "Awnings" is the same
    // mistake as the kitchen that was once captioned "Home Office".
    //
    // PhotoTile renders these two as charcoal with a hairline frame and their
    // tagline. One outdoor shoot turns both into photographs and nothing else in
    // this file changes.
    label: 'Screens',
    to: '/products?category=zip-screens',
    blurb: taglineFor('zip-screens'),
    cta: 'Shop Now',
  },
  {
    label: 'Shelving',
    to: '/products?category=shelving-storage',
    blurb: taglineFor('shelving-storage'),
    // The right third of the same walk-in — shelves, folded stacks and drawer
    // fronts, no hanging rail in shot. See the note on the Wardrobes tile. The
    // tighter of the two files, so the two crops differ in scale as well as in
    // subject.
    image: '/images/range/wardrobes.jpg',
    objectPosition: '78% center',
    cta: 'Shop Now',
  },
];

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
      <div
        style={{
          position: 'relative',
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
          {RANGES.map(range => (
            <div
              key={range.label}
              style={{ flex: `0 0 ${cardBasis(isMobile)}`, scrollSnapAlign: 'start' }}
            >
              <PhotoTile
                to={range.to}
                label={range.label}
                image={range.image}
                objectPosition={range.objectPosition}
                blurb={range.blurb}
                note={range.note}
                cta={range.cta}
                // Stacked, not beside the label — see ctaBelow. These cards are
                // 300px wide against the category tiles' 480.
                ctaBelow
                minHeight={isMobile ? CARD_H_MOBILE : CARD_H}
                // Down from the category tiles' clamp(28px, 3vw, 40px). At 300px
                // wide, 40px of Cormorant put "Blockout Curtains" onto three
                // lines and left no room under it for the blurb and the price.
                labelSize="clamp(19px, 1.7vw, 23px)"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
