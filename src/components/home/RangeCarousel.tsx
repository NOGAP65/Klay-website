// ---------------------------------------------------------------------------
// 4. Our Range — one row of product cards, arrows, and it moves on its own.
//
// A CARD IS TWO HALVES: the photograph, and a configurator of exactly the same
// width and height directly beneath it. The top half says what the product is;
// the bottom half is where it gets specified and bought. Nothing about a
// product is a page away any more — the whole transaction happens in the row.
//
// That is the change this section has been working towards. It went from two
// grids that asked "what do you want to shop for" (below), to one row that
// answered it with a photograph and a from-price, to a row where the answer
// includes the fabric, the size, the motor and the price of that exact
// specification. See RangeConfigurator for the panel and data/configOptions
// for what each of the fourteen products is allowed to ask.
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
// SAME TILE, SMALLER, IN A ROW. The top half is PhotoTile, unchanged — the same
// object the category grid used, because that design works. What changed is the
// scale and the axis: ~330px wide against the category tiles' 480, and a
// horizontal scroller instead of a grid.
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
import { tokens, motion, prefersReducedMotion } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
// The row reads data/catalogue.ts — the same fourteen products the shop lists,
// in the same order, rendered by the same tile. It used to read a data/ranges.ts
// of its own holding six invented ranges, which meant the homepage and the shop
// described the business differently: the homepage offered "Screens" and
// "Shelving" as peers of "Blinds", and neither Honeycomb Blinds nor Roller
// Shutters nor Frameless Shower Screens appeared anywhere on it.
import { CATALOGUE } from '../../data/catalogue';
import { PhotoTile, SectionBand, TILE_GAP, useHover } from './primitives';
import { RangeConfigurator } from './RangeConfigurator';

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
 * WITH A FLOOR UNDER IT. Three shares of 70% is 331px on a 1440 screen and
 * 234px on a 1024 one, and at 234 the card stops working: the configurator's
 * chips wrap to three rows and the seventeen-colour curtain card no longer
 * clears its own action bar. The floor holds the card at 280px and lets the
 * third one hang half off the row instead — a partial card at the edge of a
 * scroller is a normal thing that says "keep going", where a cramped one just
 * looks wrong.
 *
 * Fourteen cards, three visible: the arrows always have somewhere to go. */
const CARD_MIN = 280;

const cardBasis = (isMobile: boolean) =>
  isMobile
    ? `calc((100% - ${TILE_GAP}px) / 1.6)`
    : `max(${CARD_MIN}px, calc((100% - ${2 * TILE_GAP}px) / 3))`;

/** Tile height. Up with the width, so the card keeps its portrait crop — a window
 * covering hangs, so the frame wants height.
 *
 * THE CONFIGURATOR UNDER IT IS THE SAME NUMBER, so a card is a photograph with
 * an equal panel of controls beneath it and the row has one shared baseline —
 * see RangeConfigurator. A card is therefore twice this tall overall, which is
 * the price of putting the whole specification on the homepage instead of two
 * pages further in. */
const CARD_H = 470;
const CARD_H_MOBILE = 340;

const cardHeight = (isMobile: boolean) => (isMobile ? CARD_H_MOBILE : CARD_H);

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
  top,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
  /** Centred on the PHOTOGRAPH rather than on the card, which is twice as tall
   * now that a configurator hangs under every tile. At the card's own midpoint
   * the arrows landed exactly on the seam between the two halves, reading as
   * controls belonging to the panel and sitting over its first row of chips. */
  top: number;
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
        top,
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
  /** Set the first time anyone touches a control in any card's configurator,
   * and never cleared. Hovering already pauses the drift, but hover does not
   * exist on a touch screen — and a row that carries the card off the edge
   * while someone is halfway through choosing a fabric is worse than a row
   * that does not move at all. Once the visitor is specifying something, the
   * row has done its job of showing there is more and stops. */
  const [frozen, setFrozen] = useState(false);
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
    if (reduceMotion || paused || frozen) return;
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
  }, [paused, frozen, reduceMotion]);

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
            <Arrow direction="prev" onClick={() => scrollByCards(-1)} disabled={atStart} top={CARD_H / 2} />
            <Arrow direction="next" onClick={() => scrollByCards(1)} disabled={atEnd} top={CARD_H / 2} />
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
              {/* The picture. No chip and no swatch row on it any more: the
                  panel below owns the colours and owns the action, and a Shop
                  Now on the photograph would be a second, different way to buy
                  the same product sitting 20px above the first. The tile still
                  links to the product for anyone who wants to read first. */}
              <PhotoTile
                to={item.to}
                label={item.name}
                image={item.image}
                objectPosition={item.imagePosition}
                blurb={item.tagline}
                note={item.priceFrom !== undefined ? `From $${item.priceFrom}` : 'Price on measure'}
                minHeight={cardHeight(isMobile)}
                // Down from the category tiles' clamp(28px, 3vw, 40px). At 300px
                // wide, 40px of Cormorant put "Blockout Curtains" onto three
                // lines and left no room under it for the blurb and the price.
                labelSize="clamp(19px, 1.7vw, 23px)"
                glyph={item.glyph}
                alt={`${item.name} — ${item.group}`}
                // Same reason as the shop's cards: the label block runs a name,
                // a line of copy and a price, which reaches well up a pale
                // photograph.
                scrim="deep"
              />
              {/* Its other half — same width, same height. */}
              <RangeConfigurator
                item={item}
                height={cardHeight(isMobile)}
                isMobile={isMobile}
                onInteract={() => setFrozen(true)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
