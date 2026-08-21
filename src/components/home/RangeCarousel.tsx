// ---------------------------------------------------------------------------
// 4. Our Range — one row of product cards, arrows, and it moves on its own.
//
// A CARD IS A PHOTOGRAPH, A NAME, AND THE CONFIGURATOR. The top two thirds are
// built against MONDAY Haircare's range row; the last third is Klay's own
// economics. MONDAY sells four shampoos off a shelf and its cards carry no
// controls at all. Klay sells made to measure, where the configuration IS the
// product — pushing it a page away costs a click and a page load to ask
// something the row could have asked directly.
//
// What did not survive is the old geometry. The tile and the panel were given
// the SAME fixed height, 470 and 470, which made the card 940 against MONDAY at
// 642 and Sixpenny at 504, showed three products of fourteen, and forced the
// panel to scroll inside itself because a wardrobe asks one question and a
// roller asks five. Both size to their own content now, and the row's flex
// children stretch so every gold button still lands on one line.
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
import { radius, tokens, motion, prefersReducedMotion, shadow, space, supporting, eyebrow, headline, layout, type as typeScale } from '../../theme';
import { useIsMobile, useMediaQuery } from '../../hooks/useIsMobile';
// The row reads data/catalogue.ts — the same fourteen products the shop lists,
// in the same order, rendered by the same tile. It used to read a data/ranges.ts
// of its own holding six invented ranges, which meant the homepage and the shop
// described the business differently: the homepage offered "Screens" and
// "Shelving" as peers of "Blinds", and neither Honeycomb Blinds nor Roller
// Shutters nor Frameless Shower Screens appeared anywhere on it.
import { CATALOGUE, type CatalogueItem } from '../../data/catalogue';
import { CtaLink, TILE_GAP, useHover } from './primitives';
import { Link } from 'react-router-dom';
import { ProductGlyph } from '../ProductGlyph';
import { RangeConfigurator } from './RangeConfigurator';
import { defaultSelection, fieldsFor, type Selection } from '../../data/configOptions';

/** Relative luminance, for deciding whether the mechanism drawing goes on in
 * warm white or in ink. The fabric card runs from a 0.905 white to a 0.078
 * black, so one stroke colour cannot serve both ends of it. */
const luminance = (hex: string) => {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

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

/** FOUR ACROSS, not three. With the configurator off the card and the row at
 * full width there is room for four ~307px cards, which is what every reference
 * shows — MONDAY, Sixpenny and HAY are all four-up at 310-335. The CARD_MIN
 * floor goes with the three-up maths that needed it.
 *
 * On mobile, 1.6 rather than 1: the card takes most of the row and the sliver of
 * the next one is what says the row scrolls. */
const COLS = 4;
const COLS_MOBILE = 1.6;

/** One share, as a CSS length for the slots. */
const cardBasis = (isMobile: boolean) =>
  isMobile
    ? `calc((100% - ${TILE_GAP}px) / ${COLS_MOBILE})`
    : `calc((100% - ${(COLS - 1) * TILE_GAP}px) / ${COLS})`;

/** THE SAME SHARE IN PIXELS, from the row's own width — the identical
 * arithmetic, so the two cannot disagree.
 *
 * This exists because the card has to be pinned to a pixel width (see the note
 * where it is applied), and every way of MEASURING that width off the live DOM
 * has a race in it: a slot's offsetWidth is mid-transition for 450ms after
 * either a card opening or a card closing, and reading it then gives a number
 * between one share and two. Computing it from the row's clientWidth has no such
 * window, because opening a card does not change how wide the row is. */
const sharePx = (rowWidth: number, isMobile: boolean) =>
  isMobile
    ? (rowWidth - TILE_GAP) / COLS_MOBILE
    : (rowWidth - (COLS - 1) * TILE_GAP) / COLS;

/** The open card's slot: TWO shares, so the configurator gets a full card's
 * width beside the photograph and needs no scrolling of its own. Every card
 * after it slides along by exactly one share.
 *
 * On mobile the card already takes most of the row, so it goes to the whole of
 * it and the panel stacks under the photograph instead of beside it. */
const cardBasisOpen = (isMobile: boolean, wide: boolean) =>
  isMobile
    ? '100%'
    : wide
      ? `calc(((100% - ${(COLS - 1) * TILE_GAP}px) / ${COLS}) * 2 + ${TILE_GAP}px)`
      // THREE SHARES on a narrow desktop, and this is the fix for the section
      // jump rather than a cosmetic choice. Two shares of a 940px row leaves the
      // panel about 232px wide, at which point every chip row wraps and the
      // panel grows to 719px against a 443px card — the row stretches and the
      // section below leaps 276px. Three shares gives the panel ~464px, the
      // chips fit the rows they were designed for, and the panel stays within
      // the card's own height.
      : `calc(((100% - ${(COLS - 1) * TILE_GAP}px) / ${COLS}) * 3 + ${2 * TILE_GAP}px)`;

/** The tile height the arrows centre on. The card is taller than this — the
 * name block sits under the tile — but the arrows belong on the PHOTOGRAPH, not
 * on the card's own midpoint, which would put them over the type. */
const CARD_H = 470;


/** How long the row rests before advancing itself. Five seconds — ten read as a
 * row that had stopped rather than one that was waiting, since with four of six
 * cards on screen a whole minute could pass without the visitor seeing it move
 * at all. Still slow enough to read a label, a line and a price before it goes. */
const AUTO_MS = 5000;

/** How long a card takes to widen. Shared by the slot transition, the panel's
 * entrance and the scroll nudge that follows both, so the three cannot drift
 * out of step — the nudge in particular has to start AFTER the width has
 * settled, or two layout animations run at once. */
const EXPAND_MS = 450;

/** Above this the open card takes two shares; below it, three. See
 * cardBasisOpen — it is about how wide the panel ends up, not about the card. */
/** How long the panel takes to leave before the card starts narrowing. Shorter
 * than EXPAND_MS: a thing arriving wants to be seen, a thing leaving wants to be
 * out of the way. */
const COLLAPSE_MS = 220;

/** The configuration panel's own height, measured in the running page: a
 * header, up to four fields, the price line and the 52px button come to this at
 * every viewport the panel is wide enough for. The row reserves it. */
const PANEL_H = 560;

const WIDE_ROW = '(min-width: 1250px)';

/** HOW FAR THE GOLD FRAME STANDS OFF THE CARD.
 *
 * The frame cannot grow outwards. Its outer edge already sits on the slot's own
 * bounds, and the slots carry `contain: paint`, which clips every descendant to
 * the slot's padding box — anything drawn past it is simply not painted. Growing
 * the slot instead would mean fewer cards across the row.
 *
 * So the frame keeps its size and the card insets inside it. The visible change
 * is the same one either way: a band of the section's own ground between the gold
 * line and the photograph, which is what makes it read as a frame around the card
 * rather than as a stroke on the card's edge.
 *
 * 4, the smallest step on the scale, and it is also exactly the strip between two
 * cards — so the air inside the frame and the air between frames match. */
const FRAME = space.xxs;

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
  /** Centred on the PHOTOGRAPH rather than on the card. At the card’s own
   * midpoint the arrows land on the configurator panel, reading as controls
   * belonging to it and sitting over its first row of chips. */
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
        borderRadius: radius.md,
        // A hairline instead of the drop shadow it carried. §5.5 gives the
        // homepage exactly one elevated object — the visualiser card — so a
        // second shadow here would spend the hierarchy that buys. The border
        // does the job the shadow was actually doing, which was separating a
        // warm-white control from a pale photograph rather than lifting it.
        border: `1px solid ${tokens.line}`,
        background: active ? tokens.card : tokens.onDarkMuted,
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
function RangeCard({
  item,
  open,
  ready,
  framed,
  onToggle,
  isMobile,
  cardPx,
}: {
  item: CatalogueItem;
  /** Whether this card's configuration panel is showing. One at a time across
   * the whole row — the carousel owns which. */
  open: boolean;
  /** True once the width animation has finished. The configurator waits for it
   * — see the note where the panel renders. */
  ready: boolean;
  /** Whether to draw the gold frame. Not the same as `open`: it stays true for
   * the width transition after the card closes, so the frame shrinks back with
   * the card instead of vanishing at full width. */
  framed: boolean;
  onToggle: () => void;
  isMobile: boolean;
  /** The card's width in pixels, measured off a closed slot. Null until the
   * first measurement, when the card falls back to filling its slot. */
  cardPx: number | null;
}) {
  const { hover, bind } = useHover();
  const [sel, setSel] = useState<Selection>(() => defaultSelection(item));
  const choose = (fieldId: string, choiceId: string) =>
    setSel(s => ({ ...s, [fieldId]: choiceId }));


  // The chosen colour, read back so the tile can take it as its ground. A colour
  // card where one exists, otherwise the product's own variant — Blockout /
  // Light filter for a roman, Aluminium / Timber / Faux for a venetian, neither
  // of which carries a hex and so leaves the tile alone.
  const fields = fieldsFor(item);
  const leadField = fields.find(f => f.kind === 'swatches') ?? fields.find(f => f.id === 'variant');
  const chosen = leadField?.choices.find(c => c.id === sel[leadField.id]);
  // THE FABRIC COLOUR BECOMES THE TILE'S GROUND on the ten products with no
  // photograph. It still works — better, in fact — now the controls sit in a
  // panel BESIDE the card rather than under it: the card stays in view while
  // you configure, so choosing Forest Green visibly repaints the tile next to
  // the swatch you just clicked. Above 0.45 luminance the drawing flips to ink,
  // because a warm-white mechanism on a cream fabric is invisible.
  const tileGround = !item.image && chosen?.hex ? chosen.hex : undefined;
  const glyphOnLight = tileGround ? luminance(tileGround) > 0.45 : false;

  return (
    // TWO COLUMNS WHEN OPEN, one when shut, AND NO GAP BETWEEN THEM. The
    // configurator was separated from the card by the row's own 4px strip, which
    // made it a second object sitting next to the card rather than the card
    // carrying on. Flush, with the panel's left corners square and its border
    // gone, the pair reads as one shape that has been extended sideways.
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'stretch',
        height: '100%',
        // For the gold frame, which is an overlay — see below.
        position: 'relative',
        // THE STANDOFF. The frame is drawn on this box's outer edge and the
        // contents sit in from it, so the gold line never touches the
        // photograph or the gold buttons. See FRAME.
        padding: FRAME,
        boxSizing: 'border-box',
      }}
    >
      {/* THE GOLD FRAME, ON THE SELECTED CARD ONLY. Nothing carries it while the
          row is just being browsed; opening one with Shop Now draws it, and it
          encloses the card and the configurator together because this wrapper IS
          that combined shape — the card column and the panel are its two
          children. So it grows with the expansion rather than being a second
          thing that has to be animated in step with it.

          IT OUTLASTS THE CLOSE ON PURPOSE, by `framed` rather than by `open`.
          `open` goes false the moment the id is cleared, which is the moment the
          slot STARTS its 450ms narrowing — so the line would vanish at full
          width and the card would shrink behind nothing. Held for the width
          transition, the frame shrinks back with the card and the close is the
          open in reverse, which is what the rest of this component already does.

          THE STANDOFF STAYS WHETHER THE LINE IS DRAWN OR NOT. The 4px padding
          below is unconditional: making it appear with the frame would resize
          the card on every open, and the tile is 4:5, so 8px of width would
          become 10 of height and the whole row would move.

          AN OVERLAY, NOT A BORDER, and that is not a style preference. A real
          border on this box adds two pixels to the card's width and height,
          which is the one thing that must never happen here: the tile is 4:5, so
          two pixels of width become two and a half of height and the whole row
          and every section below it moves. An outline would not affect layout
          either, but the slots carry `contain: layout paint`, which clips
          anything drawn outside the slot's own box — an outline sits outside the
          border edge and would be cut off. An inset child is inside the
          containment boundary and costs no layout at all.

          Painted last and pointer-transparent, so it sits over the photograph
          and the chips without taking a single click off them. */}
      {framed && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            border: `1px solid ${tokens.line}`,
            borderRadius: radius.md,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}
      {/* THE CARD IS PINNED TO A PIXEL WIDTH, open or shut, and this is the one
          thing that stops it changing size. Every expression of it as a share of
          the SLOT was wrong, because the slot is what animates:

            Shut it was `100%` and open `50% - gap/2`, and both resolve to 317 at
            rest — but the basis flips on the tick the state changes, while the
            slot is still 317 wide. So the card became 50% of 317, or 157, and
            then grew back to 317 as the slot widened. Closing ran it in reverse:
            `openId` cleared while the slot was still 638, so the card jumped to
            the full 638 and shrank. The tile is 4:5, so its height followed —
            396 to 195 and back — and every card and every section below it moved
            with it. That is the glitch, and it was invisible at rest, which is
            why measuring the endpoints did not find it.

          A pixel width cannot be affected by the slot's transition at all. It is
          measured off a closed slot rather than computed, so it is exactly the
          same calc() the closed cards use, already resolved by the browser —
          see the note on cardPx. */}
      <div
        style={{
          flex: isMobile ? '0 0 auto' : cardPx ? `0 0 ${cardPx}px` : '0 0 100%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      {/* Only the picture and the name are inside the link. The button below
          and the panel beside carry real buttons, and a <button> nested inside
          an <a> is invalid and swallows its own clicks. */}
      <Link
        {...bind}
        to={item.to}
        style={{ display: 'block', textDecoration: 'none', flex: '0 0 auto' }}
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
          borderRadius: radius.lg,
          // 4:5 — the site's one portrait ratio, shared with the install strip
          // and the About panel.
          aspectRatio: '4 / 5',
          background: tileGround ?? (item.image ? tokens.parchment : tokens.charcoal),
          // THE CARD KEEPS ITS SHADOW. It sits on the box rather than being
          // animated, so it costs one paint at mount and nothing per frame —
          // the expensive version was the 450ms background FADE that used to
          // sit here, not the shadow.
          boxShadow: shadow.rest,
          // NO TRANSITION on the ground. It faded over 0.45s, which repaints a
          // 317x396 box every frame for the whole of that — and it fired at the
          // same moment the row was animating flex-basis, so two expensive
          // animations overlapped. The colour change is legible instantly; it
          // was the fade that cost, not the swap.
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
              border: `1px solid ${
                hover ? tokens.onDarkEdge : glyphOnLight ? tokens.line : tokens.onDarkLine
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.3s ease',
            }}
          >
            <ProductGlyph
              type={item.glyph ?? ''}
              size={140}
              color={glyphOnLight ? tokens.ink : tokens.warmWhite}
              ground={tileGround ?? tokens.charcoal}
              opacity={hover ? 0.75 : 0.6}
            />
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
          color: hover ? tokens.ink : tokens.ink,
          marginTop: space.xs,
          transition: 'color 0.25s ease',
        }}
      >
        {/* THE NAME IS THE NAME. It used to carry the chosen colourway after an
            em dash — "Roller Blinds — White" — on the Article pattern, where the
            product title states what you have specified. It reads differently
            here: every card in the row defaults to a selection nobody has made
            yet, so the row opened saying White fourteen times and the product's
            actual name was the shorter half of a longer label. The panel names
            the colour above its swatches, where the choice is being made. */}
        {item.name}
      </h3>

        {/* No price here. The panel prices the actual configuration, and a
            from-figure on the card would be a second, vaguer number twenty
            pixels above a real one. */}
      </Link>

      {/* THE ONE ACTION. Gold, full width, and it does not navigate — it opens
          the configuration panel beside this card. */}
      <button
        onClick={onToggle}
        style={{
          marginTop: space.md,
          width: '100%',
          height: 52,
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.md,
          border: 'none',
          cursor: 'pointer',
          background: open || hover ? tokens.accentHover : tokens.accent,
          color: tokens.onAccent,
          ...typeScale.label,
          lineHeight: 1,
          transition: motion.button,
        }}
      >
        {open ? 'Close' : 'Shop Now'}
      </button>
      </div>

      {/* THE PANEL — in the flow, in the space the row just made.
          It is a flex sibling rather than an overlay, so it covers nothing and
          the neighbouring cards genuinely move aside instead of being hidden
          behind it. */}
      {open && (
        <div
          style={{
            // WHATEVER IS LEFT, not a share of its own. Giving the card and the
            // panel half each of a box that also had to hold the gap between
            // them overflowed the slot by exactly one gap. The card is sized
            // first, to precisely one share; the panel takes the remainder, so
            // the two cannot add up to more than the slot at any width.
            flex: isMobile ? '1 1 auto' : '1 1 0',
            minWidth: 0,
            marginTop: isMobile ? TILE_GAP : 0,
            // EXACTLY THE CARD'S HEIGHT, and this is what enforces it. The panel
            // holds its content in an absolutely-positioned child, so the panel
            // itself has NO intrinsic height — which means the row's height is
            // decided by the card alone, and `align-items: stretch` then hands
            // that height back to the panel. Before this the panel was
            // content-sized and the taller of the two on the products that ask
            // most: the roller measured 559 against a 521 card at 1440, and 491
            // against 415 at 1100. Whatever it contains now, it is the card's
            // height, because it cannot report a height of its own.
            position: 'relative',
            background: tokens.cream,
            // NO BORDER, AND SQUARE ON THE LEFT. A hairline all the way round
            // drew the panel as its own box; the left edge in particular put a
            // rule down the join it is supposed to be crossing. Radius on the
            // outer two corners only, so the shape ends where the card ends.
            borderRadius: '0 2px 2px 0',
            overflow: 'hidden',
            // The same shadow the tile carries, and it continues it rather than
            // repeating it: the panel is flush and painted after, so it covers
            // the tile's right-hand shadow and the pair casts one.
            boxShadow: shadow.rest,
            // Fades in once the width has settled, and back out before it
            // narrows — the same move in reverse. Opacity carries both, so a
            // close that interrupts an open just runs from wherever it got to.
            opacity: ready ? 1 : 0,
            transition: 'opacity ' + COLLAPSE_MS + 'ms ease',
          }}
        >
          {/* MOUNTED ONLY ONCE THE EXPANSION IS DONE — the header along with the
              fields, not just the fields.
              Profiled, the click frame cost 139ms at 4x throttle, and it was not
              the animation: it persisted identically with every animation
              disabled via prefers-reduced-motion. It is React mounting the
              fields, the chips and up to seventeen swatches on the same frame a
              layout animation starts. Deferring it means the width animates
              against an empty box.
              The HEADER has to wait too, and for a second reason. The panel is
              a few pixels wide on the first frames of the expansion, where a
              product name and a close button wrap to one word per line and make
              the panel taller than the card — which grows the row, which moves
              the section below. An empty box cannot do that. */}
          {/* THE ABSOLUTE FILL. It is what lets the panel match the card rather
              than the card's content stretching to match the panel — see the
              note on position above. inset 0 against a box whose height came
              from its sibling. */}
          {ready && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
              {/* THE TITLE BAR IS GONE, and its 41px is what makes the rest fit.
                  It repeated the product name, which is set at card scale a few
                  pixels to the left and still on screen — the panel is beside the
                  card, not on top of it, so there was nothing to re-establish.
                  Its close button went with it: the card's own gold button reads
                  Close while the panel is open and sits immediately to the left,
                  and Escape still works. Two affordances for one action, one of
                  which cost the panel the height it needed to stop scrolling. */}
              <RangeConfigurator item={item} sel={sel} onChange={choose} fill />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RangeCarousel() {
  const isMobile = useIsMobile();
  const wideRow = useMediaQuery(WIDE_ROW);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [paused, setPaused] = useState(false);
  /** Set the first time anyone touches a control in any card configurator, and
   * never cleared. Hover already pauses the drift, but hover does not exist on
   * a touch screen — and carrying a card off the edge while someone is halfway
   * through choosing a fabric is worse than a row that never moves. */
  const [frozen, setFrozen] = useState(false);
  /** Which card has its configuration panel open. One at a time — the whole
   * point of moving the controls off the card is that the visitor reads one set
   * of options rather than fourteen. */
  const [openId, setOpenId] = useState<string | null>(null);

  /** The height the row holds whether a card is open or not, so opening one
   * never moves the section below. See the note where it is applied.
   *
   * A CONSTANT, and measured rather than guessed. The panel is content-sized —
   * a header, up to four fields, a price line and the button — and it comes out
   * at 559px at both 1440 and 1100, because none of that content depends on the
   * viewport once the panel is wide enough not to wrap. The card, being a 4:5
   * tile, DOES shrink with the viewport: 549 at 1440 but 443 at 1100. So the
   * panel is the taller of the two on a narrow desktop and it is the panel that
   * has to be reserved for.
   *
   * Reserved up front rather than grown on first open. Growing it measured
   * correctly but only after the fact, so the first card opened still moved the
   * page — which is the whole thing this exists to stop. */
  const rowMinHeight = PANEL_H;

  /** THE CARD'S WIDTH IN PIXELS, so nothing about the slot's transition can
   * reach it. See the note where it is applied for why a percentage of the slot
   * cannot work.
   *
   * COMPUTED FROM THE ROW'S WIDTH, not measured off a slot, and that is the
   * whole point. Reading a closed sibling's offsetWidth looked like the honest
   * source — it is the same calc(), already resolved — and it broke every card
   * but the first. Closing a card clears `openId`, which re-runs this effect
   * IMMEDIATELY, while that slot is still 638px wide and only beginning its
   * 450ms shrink back to 317. So it measured 638, and every card opened after
   * that took its whole slot: measured, the tile went 317x396 to 638x798 and the
   * section jumped 842 to 1204.
   *
   * The row's own width has no such window. Opening a card does not change how
   * wide the row is, so there is no moment at which this reads the wrong thing.
   * clientWidth rather than offsetWidth because the scrollbar is hidden and it
   * is the content box that a flex child's percentage resolves against — which
   * is what makes this the same number `cardBasis` produces. */
  const [cardPx, setCardPx] = useState<number | null>(null);
  useEffect(() => {
    const row = scrollerRef.current;
    if (!row) return;
    // Less the frame's standoff on both sides: the card column sits inside the
    // wrapper's padding box, not inside the slot, so a full share would overflow
    // it by exactly 2 * FRAME.
    const measure = () => setCardPx(sharePx(row.clientWidth, isMobile) - 2 * FRAME);
    measure();
    // The row's width is the only input, so the row is what has to be watched —
    // not the window, which also fires on height changes that cannot affect it.
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, [isMobile]);

  /** THE CLOSE REVERSES THE OPEN, rather than the panel vanishing and the card
   * then shrinking behind it.
   *
   * Opening runs widen, then fade in. Closing has to run fade out, then narrow —
   * so a click cannot simply clear `openId`, which would unmount the panel on
   * the spot and leave the width animating against an empty box. `closing` holds
   * the card open at full width while the panel fades, and only then is the id
   * cleared.
   *
   * Switching straight from one card to another skips the wait: the outgoing
   * panel has somewhere to go, so making the visitor watch it leave first would
   * be a delay with nothing behind it. */
  const [closing, setClosing] = useState(false);

  const toggle = (id: string) => {
    if (openId !== id) {
      // Opening stops the row for good. Carrying a card off the edge
      // mid-configuration is the one thing that would make this unusable, and
      // hover does not exist on a touch screen.
      setFrozen(true);
      setClosing(false);
      setOpenId(id);
      return;
    }
    setClosing(true);
  };

  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(() => {
      setOpenId(null);
      setClosing(false);
    }, COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [closing]);

  /** WHICH CARD WEARS THE GOLD FRAME. It tracks `openId` on the way in and lags
   * it by the width transition on the way out.
   *
   * The lag is the whole reason it is not just `openId`. Clearing the id is what
   * STARTS the 450ms narrowing, so a frame keyed on the id disappears at full
   * width and leaves the card shrinking behind nothing. Held for exactly that
   * transition, the frame narrows with the card and the close mirrors the open. */
  const [framedId, setFramedId] = useState<string | null>(null);
  useEffect(() => {
    if (openId) {
      setFramedId(openId);
      return;
    }
    const t = window.setTimeout(() => setFramedId(null), EXPAND_MS);
    return () => window.clearTimeout(t);
  }, [openId]);

  /** True once the open card has finished widening. The configurator waits for
   * it, so the width animates against an empty box and the form arrives into
   * one that has stopped moving — see the note where the panel mounts. */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!openId) {
      setReady(false);
      return;
    }
    const t = window.setTimeout(() => setReady(true), EXPAND_MS);
    return () => window.clearTimeout(t);
  }, [openId]);

  /** BRING THE EXPANDED CARD FULLY INTO VIEW. Opening the rightmost visible
   * card doubles its width, which measured put its right edge at 1681 against a
   * row ending at 1360 — the panel simply fell off the end. The row nudges
   * itself along by however much is overhanging, and by nothing at all when the
   * card already fits.
   *
   * Waits a frame: the flex-basis is still the closed width on the tick the
   * state changes, so measuring immediately reads the old geometry. */
  useEffect(() => {
    if (!openId) return;
    // AFTER the width transition, not during it. Both a smooth scroll and a
    // flex-basis transition force layout on every frame, and running them
    // together was the jank: profiled at 4x CPU throttle the overlap produced
    // frames of 91ms, 49ms and 242ms clustered in the first 300ms. Sequenced,
    // each is a cheap animation on its own.
    //
    // It costs nothing in feel, because the card is already visibly expanding
    // during those 450ms — the nudge only tidies the case where the expanded
    // card would overhang the row's right edge.
    const timer = window.setTimeout(() => {
      const row = scrollerRef.current;
      const slot = row?.querySelector<HTMLElement>(`[data-slot="${openId}"]`);
      if (!row || !slot) return;
      // MEASURE AGAINST THE TARGET WIDTH, not the current one. The flex-basis is
      // mid-transition on the frame after the state change — reading
      // offsetWidth here gives a card partway between one share and two, and
      // the nudge lands short. Measured that way the rightmost card still
      // overhung by 241px.
      //
      // The target is two shares plus the gap between them, and a closed
      // sibling is the honest source for one share: it is the same calc() the
      // slot itself uses, already resolved by the browser.
      const closed = Array.from(row.children).find(c => c !== slot) as HTMLElement | undefined;
      const target = closed ? closed.offsetWidth * 2 + TILE_GAP : slot.offsetWidth;
      const over = slot.offsetLeft + target - (row.scrollLeft + row.clientWidth);
      if (over > 0) row.scrollTo({ left: row.scrollLeft + over, behavior: 'smooth' });
    }, EXPAND_MS);
    return () => window.clearTimeout(timer);
  }, [openId]);

  // Escape closes the panel. A pop-out that can only be dismissed by finding
  // its own X is a pop-out people feel trapped by.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setClosing(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);
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
        {/* GOLD WITH INK ON IT, the site's one primary-action pairing, which is
            also what the fourteen Shop Now buttons in the row below are. It was
            the `onDark` variant — a charcoal box with gold text — which made the
            section's own action the odd one out: the darkest object in a warm
            white section, sitting above a row of gold buttons that all mean the
            same thing. Ink on gold measures 6.8:1 against the charcoal
            variant's 5.6, so it reads better as well as matching. */}
        <CtaLink to="/products">Shop All</CtaLink>
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
            // THE SECTION RESERVES ITS OPEN HEIGHT. Measured: opening the roller
            // card — five fields and a fourteen-colour row — grew the section
            // from 832 to 841 at 1440, and from 716 to 992 at 1100, because a
            // narrower card wraps the panel's chips onto more rows. The section
            // below leapt down by 276px mid-animation, which is the glitch.
            //
            // The row is tall enough for the open state from the start, so the
            // page below never moves. `alignItems: flex-start` is what stops the
            // reserve stretching the closed cards to fill it — they keep their
            // own height and the spare sits underneath.
            minHeight: rowMinHeight,
            alignItems: 'flex-start',
            // Snaps to card edges so the row never rests showing two half cards,
            // however it was moved — arrow, thumb or trackpad.
            // Off while a card is open — see the note on the slot below.
            scrollSnapType: openId ? 'none' : 'x mandatory',
          }}
        >
          {CATALOGUE.map(item => {
            const open = openId === item.id;
            return (
            <div
              key={item.id}
              // THE ANIMATION IS THE LAYOUT. Opening a card widens its slot
              // from one share to two, and because these are flex siblings in
              // a row every card after it slides along by exactly that much —
              // no card is covered and no space is wasted. Transitioning
              // flex-basis is what makes the row move rather than jump.
              data-slot={item.id}
              // CONTAINMENT. The flex-basis transition changes this box every
              // frame, and without a containment boundary the browser has to
              // consider the whole row's subtree each time.  tells
              // it nothing inside affects anything outside, so the per-frame
              // work is scoped to one card. Measured: 432 style recalculations
              // for a single card opening before this.
              className="klay-slot"
              style={{
                flex: `0 0 ${open ? cardBasisOpen(isMobile, wideRow) : cardBasis(isMobile)}`,
                // SNAP OFF WHILE OPEN. Mandatory snapping and a programmatic
                // scroll fight each other — the browser re-snaps to the nearest
                // card edge and undoes the nudge that was bringing the open card
                // into view. It comes back the moment the panel closes.
                scrollSnapAlign: open ? 'none' : 'start',
                transition: `flex-basis ${EXPAND_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
              }}
            >
              <RangeCard
                item={item}
                open={open}
                ready={open && ready && !closing}
                framed={framedId === item.id}
                isMobile={isMobile}
                cardPx={cardPx}
                onToggle={() => toggle(item.id)}
              />
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
