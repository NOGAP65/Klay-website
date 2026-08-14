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

/** Card width. "Significantly smaller" than the 480 the category tiles ran to —
 * at this size roughly four and a half sit in a 1440 viewport, which is what
 * makes the row read as a row rather than as a grid that happens to scroll. */
const CARD_W = 300;
const CARD_W_MOBILE = 232;

/** Tile height. 7:10, so the card stays portrait — a window covering hangs, so
 * the crop wants height. Same proportion the category tiles had at 480x660. */
const CARD_H = 420;
const CARD_H_MOBILE = 330;

/** How long the row rests on a card before advancing itself. Long enough to read
 * a label, a line of copy and a price without feeling hurried. */
const AUTO_MS = 4200;

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

// ON THE TWO CTAs. Only roller blinds can be configured and bought online today.
// Everything else Klay genuinely sells — it just starts with a conversation
// rather than a configurator, which is ordinary for made-to-measure. So those
// tiles say Enquire, not "Coming Soon": coming soon would be untrue, and it reads
// as a business that isn't ready to take your money, which is the opposite of the
// impression the rest of this page is built to give.
const RANGES: Range[] = [
  {
    label: 'Roller Blinds',
    to: '/blinds',
    blurb: 'Blockout, sunscreen and dual.',
    note: `From $${ROLLER_FROM}`,
    image: '/images/lifestyle/room-kitchen.png',
    objectPosition: 'center 34%',
    cta: 'Shop Now',
  },
  {
    label: 'Sheer Curtains',
    to: '/products?category=sheer-curtains',
    blurb: taglineFor('sheer-curtains'),
    note: `From $${priceFor('sheer-curtains') ?? 360}`,
    // Was range/sheer-curtains.jpg, and it had to move: side by side with the
    // Outdoor tile the two read as the same photograph twice — both pale sheers
    // against a bright window with greenery behind. This is the bedroom frame the
    // old Indoor category tile used, free now that tile is gone, and a bed in
    // shot is what separates it from a doorway onto a deck at a glance.
    image: '/images/categories/indoor.jpg',
    objectPosition: '62% center',
    cta: 'Enquire',
  },
  {
    label: 'Blockout Curtains',
    to: '/products?category=blockout-curtains',
    blurb: taglineFor('blockout-curtains'),
    note: `From $${priceFor('blockout-curtains') ?? 320}`,
    image: '/images/curtains-room.jpg',
    objectPosition: '72% center',
    cta: 'Enquire',
  },
  {
    label: 'Outdoor',
    to: '/outdoor',
    blurb: 'Awnings, screens and alfresco.',
    image: '/images/categories/outdoor.jpg',
    objectPosition: '50% center',
    cta: 'Enquire',
  },
  {
    label: 'Wardrobes',
    to: '/wardrobes',
    blurb: 'Built-in, walk-in and storage.',
    image: '/images/categories/wardrobes.jpg',
    objectPosition: '54% center',
    cta: 'Enquire',
  },
  {
    // NO PHOTOGRAPH EXISTS. There is not one shutter anywhere in public/images,
    // and a roller blind behind the word "Shutters" would misrepresent a product
    // outright — so PhotoTile renders this as charcoal with a hairline frame and
    // its tagline, which is at least the truth about where Klay is.
    //
    // LAST for that reason, not because shutters matter least. At rest the row
    // opens on the four photographed ranges and this one sits off the right edge,
    // reachable but not leading — a flat dark card in the middle of a row of
    // photographs is the one thing on this section that looks like a mistake.
    // Move it back up the list the day there is a shutter photograph.
    label: 'Plantation Shutters',
    to: '/products?category=plantation-shutters',
    blurb: taglineFor('plantation-shutters'),
    cta: 'Enquire',
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

  const step = isMobile ? CARD_W_MOBILE + TILE_GAP : CARD_W + TILE_GAP;

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

  const scrollByCards = useCallback(
    (n: number) => {
      scrollerRef.current?.scrollBy({ left: n * step, behavior: 'smooth' });
    },
    [step],
  );

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
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, AUTO_MS);
    return () => window.clearInterval(tick);
  }, [paused, reduceMotion, step]);

  return (
    // Warm white, the ground the category grid had — and the strip between the
    // cards is this colour showing through. See TILE_GAP.
    <section style={{ background: tokens.warmWhite }}>
      <SectionBand
        label="The collection"
        title="Our Range"
        sub="Made to measure. Installed by experts."
        isMobile={isMobile}
      />

      <div
        style={{ position: 'relative' }}
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
              style={{
                flex: `0 0 ${isMobile ? CARD_W_MOBILE : CARD_W}px`,
                scrollSnapAlign: 'start',
              }}
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
