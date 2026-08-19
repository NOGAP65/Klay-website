// ---------------------------------------------------------------------------
// 4. Our Range — one row of product cards, arrows, and it moves on its own.
//
// A CARD IS A PHOTOGRAPH AND A NAME. It was a photograph with a full
// configurator welded underneath it — a 470px tile over a 470px panel of chips.
// That made the card 940 tall against MONDAY Haircare's 642 and Sixpenny's 504,
// showed three products of fourteen, and rendered fourteen simultaneous forms on
// what is meant to be a browse surface. See the note on RangeCard.
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
import { tokens, motion, prefersReducedMotion, space, supporting, eyebrow, headline, layout, type as typeScale } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
// The row reads data/catalogue.ts — the same fourteen products the shop lists,
// in the same order, rendered by the same tile. It used to read a data/ranges.ts
// of its own holding six invented ranges, which meant the homepage and the shop
// described the business differently: the homepage offered "Screens" and
// "Shelving" as peers of "Blinds", and neither Honeycomb Blinds nor Roller
// Shutters nor Frameless Shower Screens appeared anywhere on it.
import { CATALOGUE, type CatalogueItem } from '../../data/catalogue';
import { ArrowLink, CtaLink, TILE_GAP, useHover } from './primitives';
import { Link } from 'react-router-dom';
import { ProductGlyph } from '../ProductGlyph';

/** How much of the viewport the row is allowed, centred in what is left.
 *
 * It ran the full width, and at that scale the section owned the whole screen:
 * four tall cards edge to edge is a wall, and a wall reads as the page rather
 * than as one section of it. Held to seventy percent with the warm white
 * showing down both sides, it reads as a row of product ON the page — the
 * margins are what tell you there is more page here than this.
 *
 * Full width on mobile, where seventy percent of a phone is not a column. */
// FULL CONTAINER, not 70%. At 70% the row was 1000px inside a 1440 viewport —
// 220px of dead margin down each side while the cards were simultaneously
// cramped enough to need a 280px floor under them. Narrow and tight at once,
// which is the tell that the width was not derived from the content. MONDAY's
// row is 1340 of 1440; every reference measured sits between 1330 and 1374.
const ROW_WIDTH = '100%';

/** Card width, as a share of the row rather than a fixed pixel count.
 *
 * It was a flat 300px, and that is what left the odd sliver of dead space: six
 * fixed cards land wherever 6 x 304 happens to land against the viewport, so the
 * row ended on a partial card of arbitrary width and the amount left over changed
 * with every monitor. Sized in even shares, exactly three cards fill the row at
 * any width — nothing is ever cut mid-card.
 *
 * Fourteen cards, four visible: the arrows always have somewhere to go. */

const cardBasis = (isMobile: boolean) =>
  isMobile
    ? `calc((100% - ${TILE_GAP}px) / 1.6)`
    // FOUR ACROSS, not three. With the configurator off the card and the row
    // at full width there is room for four ~307px cards, which is what every
    // reference shows — MONDAY, Sixpenny and HAY are all four-up at 310-335.
    // The CARD_MIN floor goes with the three-up maths that needed it.
    : `calc((100% - ${3 * TILE_GAP}px) / 4)`;

/** The tile height the arrows centre on. The card is taller than this — the
 * name block sits under the tile — but the arrows belong on the PHOTOGRAPH, not
 * on the card's own midpoint, which would put them over the type. */
const CARD_H = 470;


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
        [direction === 'prev' ? 'left' : 'right']: space.md,
        transform: 'translateY(-50%)',
        zIndex: 2,
        // 52 and radius 2 — the site's one control height and its one radius.
        // It was a 46px circle, which made it the only round object on the page
        // and one of seven radii.
        width: 52,
        height: 52,
        borderRadius: 2,
        // A hairline instead of the drop shadow it carried. §5.5 gives the
        // homepage exactly one elevated object — the visualiser card — so a
        // second shadow here would spend the hierarchy that buys. The border
        // does the job the shadow was actually doing, which was separating a
        // warm-white control from a pale photograph rather than lifting it.
        border: `1px solid ${tokens.line}`,
        background: active ? tokens.gold : tokens.warmWhite,
        color: tokens.ink,
        ...typeScale.body,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        // Fades out rather than vanishing at the ends of the row, so the control
        // stays where the pointer expects it.
        opacity: disabled ? 0 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: `${motion.button}, opacity 0.3s ease`,
      }}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// THE CARD — a clean photograph, then the name underneath it.
//
// Built against MONDAY Haircare's range row, which is the reference: seventeen
// products in a horizontal scroller, cards at 315 × 642, and NOTHING on the
// photograph. The name sits below the tile in the display face at heading size,
// with a small caps category above it and one line of meta below.
//
// Two things that buys, and neither is decoration:
//
//   THE PHOTOGRAPH IS NEVER TOUCHED. Nothing is set over it, so it needs no
//     scrim, no text-shadow and no deep gradient — the same lesson the hero
//     just learned. Klay's case is stronger than MONDAY's, because ten of the
//     fourteen tiles carry a line drawing rather than a photograph and type
//     over those was competing with the drawing for the same dark ground.
//
//   THE NAME GETS TO BE BIG. Over a photograph a product name has to stay small
//     enough to sit in a corner and light enough not to fight the picture. Under
//     it, "Frameless Shower Screens" can be set in Cormorant at the card scale
//     and read as the loudest thing on the card, which is what MONDAY's
//     personality actually comes from — type scale, not ornament.
//
// The configurator that used to hang under every tile is gone from the row. It
// made the card 940px tall against MONDAY's 642, which meant three products
// visible instead of four and fourteen simultaneous forms on a browse surface.
// RangeConfigurator.tsx is left in the tree, unused — restoring it is one line.
// ---------------------------------------------------------------------------
function RangeCard({ item, isMobile }: { item: CatalogueItem; isMobile: boolean }) {
  const { hover, bind } = useHover();
  return (
    <Link
      {...bind}
      to={item.to}
      style={{ display: 'block', textDecoration: 'none' }}
    >
      {/* The tile carries its own ground, one step off the section's. On the ten
          photoless products it is what stops the card reading as a hole punched
          in the page; on the four photographed ones it is the mount the picture
          sits in. MONDAY does the same — its tiles are a shade off the page
          white, which is what makes the row read as a set of objects rather than
          as pictures floating on a background. */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          // 4:5 — the site's one portrait ratio, shared with the install strip
          // and the About panel.
          aspectRatio: '4 / 5',
          background: item.image ? tokens.parchment : tokens.charcoal,
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={`${item.name} — ${item.group}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: item.imagePosition ?? 'center',
              display: 'block',
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.7s ease',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: space.md,
              border: `1px solid ${hover ? tokens.goldLine : tokens.onDarkLine}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.3s ease',
            }}
          >
            <ProductGlyph type={item.glyph ?? ''} size={140} opacity={hover ? 0.6 : 0.42} />
          </div>
        )}
      </div>

      {/* Small caps category, big name, one line of meta — MONDAY's stack
          exactly, in Klay's faces. */}
      <div
        style={{
          fontFamily: tokens.body,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: tokens.inkSoft,
          marginTop: space.md,
        }}
      >
        {item.group}
      </div>

      <h3
        style={{
          ...typeScale.card,
          color: hover ? tokens.goldText : tokens.ink,
          marginTop: space.xs,
          transition: 'color 0.25s ease',
        }}
      >
        {item.name}
      </h3>

      {/* Where MONDAY puts a star rating. Klay has no review data per product,
          so the honest equivalent is the thing a made-to-measure buyer actually
          wants next: what it costs, or that it is quoted on measure. */}
      <div
        style={{
          fontFamily: tokens.body,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: tokens.goldText,
          marginTop: space.xs,
        }}
      >
        {item.priceFrom !== undefined ? `From $${item.priceFrom}` : 'Price on measure'}
      </div>

      {!isMobile && (
        <div style={{ marginTop: space.sm }}>
          <ArrowLink label="Shop Now" hovered={hover} />
        </div>
      )}
    </Link>
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
      {/* THE HEADER IS RANGED LEFT WITH THE ACTION OPPOSITE, which is the other
          half of what MONDAY's range section is doing. Their heading sits hard
          left at display scale, the supporting line under it, and "Where To Buy"
          alone on the right of the same band.
          Centred — which this was, through SectionBand — is the safe
          arrangement and it reads as a caption above a row. Ranged left with
          something opposite it uses the full width and reads as a section
          heading with a decision attached. */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          justifyContent: 'space-between',
          gap: space.lg,
          maxWidth: layout.gridMax,
          margin: '0 auto',
          padding: isMobile
            ? `${space.xl}px ${layout.inlinePad(isMobile)}px ${space.lg}px`
            : `${space.xxl}px ${layout.inlinePad(isMobile)}px ${space.lg}px`,
        }}
      >
        <div>
          <p style={{ ...eyebrow, marginBottom: space.md }}>The collection</p>
          <h2 style={{ ...headline.section, color: tokens.ink }}>Our Range</h2>
          <p style={{ ...supporting.onLight, marginTop: space.md, maxWidth: 460 }}>
            Made to measure. Installed by experts.
          </p>
        </div>
        <CtaLink to="/products" variant="onDark">
          Shop All
        </CtaLink>
      </div>

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
      {/* THE SAME CONTAINER AS THE HEADER ABOVE IT, so the first card's left
          edge lands on the same vertical line as "Our Range". It ran edge to
          edge, which put the heading 80px in and the row at 0 — two different
          left margins in one section, and the first card cut by the viewport.
          Aligning them is most of what makes the section read as composed
          rather than assembled. */}
      <div
        style={{
          position: 'relative',
          width: ROW_WIDTH,
          maxWidth: layout.gridMax,
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: layout.inlinePad(isMobile),
          paddingRight: layout.inlinePad(isMobile),
          paddingBottom: space.md,
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
              <RangeCard item={item} isMobile={isMobile} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
