// ---------------------------------------------------------------------------
// A SHOP CARD THAT OPENS INTO ITS OWN CONFIGURATOR.
//
// The homepage's Bestsellers row does this for four products and it is the best
// thing on the site: click Shop Now and the card widens, the configurator
// arrives BESIDE the photograph, and you specify the thing while looking at it.
// The shop page listed all fourteen and did none of it — every card was a link
// out to a detail page or a contact form, so the one place a customer goes to
// choose was the one place they could not.
//
// IT IS THE BESTSELLERS CARD, not the shop tile with a button bolted on. The
// first pass reused ProductCard, which is a photograph with everything printed
// ON it — name, tagline, price and a chip, over a darkening ramp. That reads at
// 480px wide on a category page and it does not read at 290 in a grid with a
// filter rail beside it: four strings and a scrim over a picture you can no
// longer see. The card below is the row's own stack — clean photograph, group
// line, name, one action underneath — where the picture is the whole top of the
// card and nothing is written across it.
//
// SO THE OPEN CARD SPANS TWO COLUMNS. The row could widen a card because it had
// slots either side and a scroller to absorb the overflow; a grid has neither,
// and a card that grew sideways would push its neighbours out of their columns.
// A spanning grid item gets the same result with the grid's own reflow doing
// the work — picture left, controls right, both on screen together, which is
// the whole point. Choosing Forest Green has to repaint something you can see.
//
// ONE AT A TIME, held by the page rather than the card, because "close the
// other one" is a decision only something that can see both can make.
//
// BELOW THE NARROW BREAKPOINT IT STACKS. At two columns across there is no
// second column to give the panel, so the open card spans the full row and the
// configurator sits under the photograph — the same concession the row makes on
// a phone, for the same reason.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { radius, tokens, motion, shadow, space, type as typeScale } from '../theme';
import { useHover } from './home/primitives';

import { type Selection } from '../data/configOptions';
import type { CatalogueItem } from '../data/catalogue';

import { ProductGlyph } from './ProductGlyph';
import { RangeConfigurator } from './home/RangeConfigurator';

export interface ShopCardProps {
  item: CatalogueItem;
  isOpen: boolean;
  onToggle: () => void;
  sel: Selection;
  onChange: (fieldId: string, choiceId: string) => void;
  /** Two columns across rather than three or more — the panel goes underneath
   * instead of beside. */
  isNarrow: boolean;
  /** THE WIDTH OF ONE GRID COLUMN, in pixels, computed by the page from the
   * grid's own width — see COLUMN_MIN there.
   *
   * The card is pinned to it so that opening does not resize the card: the
   * growth is the panel arriving beside something that has not moved. Null
   * before the first measurement, when the card falls back to filling its
   * slot. */
  colWidth: number | null;
  /** True while the panel should be at full width. Distinct from `isOpen`,
   * which stays true through the closing transition so the box has something to
   * shrink back into — clearing them together would unmount the panel and leave
   * the width animating against nothing. */
  isShown: boolean;
}

/** How long the box takes to open, and to shut.
 *
 * SHUTTING IS FASTER, and it has to be: the page holds the card open for
 * CLOSE_MS while the panel fades and then unmounts it, so a shrink longer than
 * that gets cut off partway through and replaced by a card already at its closed
 * width — a jump, in the middle of the animation that exists to remove one. The
 * two numbers are the same number because they have to be.
 *
 * It is also how it should feel. An opening is something you are waiting to see;
 * a closing is something you have finished with. */
export const OPEN_MS = 360;
export const CLOSE_MS = 210;

/** What the cards moving out of the way get, which is longer than the box.
 *
 * They are not racing the box — they are getting out of its way, and a card that
 * wraps to the next row travels two legs and most of the grid's width to do it.
 * At the box's own duration that read as a snap. */
export const TRAVEL_MS = 440;

/** The gap between one card leaving and the next.
 *
 * This is the whole difference between a row of cards rearranging and a row of
 * cards flowing. Every card leaving on the same frame is a single event with no
 * direction in it; a beat apart and the displacement travels through the grid,
 * away from the card that opened and back toward it when it shuts. */
export const STAGGER_MS = 30;

/** The longest the wave may take to cross the whole grid.
 *
 * STAGGER_MS is right for the few cards a customer can see at once, but the
 * range is thirteen movers and a filtered grid is a different length again — so
 * left alone, the same click would run for near enough a second on the full shop
 * and a third of that on a narrowed one. The gap shrinks to fit this instead:
 * the order is kept, and the duration stops being a function of how many
 * products there happen to be. */
export const STAGGER_SPAN_MS = 170;

/** How far a card drops out of its row before it travels along.
 *
 * A little more than the gap between rows, so the card clears its own row and
 * is unmistakably travelling BELOW the grid rather than through it — the whole
 * point of the dip is that the lane it moves along is empty. Much more than this
 * and the cards in the row beneath start disappearing behind it. */
export const LANE_DIP_PX = 26;

/** THE GRID'S OWN TWO NUMBERS, and they live here rather than on the page
 * because the card does arithmetic with them: it pins itself to one column and
 * its panel to the other plus the gap the span swallows. The page lays the grid
 * out from the same two, so the tracks the browser draws and the widths the
 * card pins to cannot disagree.
 *
 * 340 up from 270 because of the photograph — a 1440 viewport less the 200px
 * rail fits four columns of about 290 at 270, and a 4:5 picture 290 wide is
 * smaller than the homepage's on the page whose whole job is showing product.
 * It also has to divide by two, since the open card spans two columns. */
export const COLUMN_MIN = 340;
/** The gutter, and it widened when the cards lost their frames.
 *
 * 20 was set while every card carried a border, a radius and a shadow — three
 * things stating where one product stopped and the next began. With those gone
 * the gap is the only separator left, and two photographs 20px apart read as one
 * strip. Monday runs 30 between tiles that likewise have no frame; 28 keeps four
 * columns on a 1440 viewport, which 30 would not. */
export const COLUMN_GAP = 28;

/** One grid column in pixels, from the grid's own width.
 *
 * COMPUTED, NOT MEASURED. Reading it off a sibling has a race in it: opening a
 * card changes which items sit where, and a measurement taken mid-transition
 * returns a number between one column and two. auto-fill's rule is
 * deterministic — as many minmax(COLUMN_MIN, 1fr) tracks as fit with the gaps
 * between them — so running the same arithmetic the browser runs gives the
 * answer with no window to be wrong in. Verified against the live grid: this
 * returns 353.33 where the browser's tracks measure 353.328px. */
export const columnWidth = (gridWidth: number): number => {
  const cols = Math.max(1, Math.floor((gridWidth + COLUMN_GAP) / (COLUMN_MIN + COLUMN_GAP)));
  return (gridWidth - (cols - 1) * COLUMN_GAP) / cols;
};

export function ShopCard({ item, isOpen, onToggle, sel, onChange, isNarrow, colWidth, isShown }: ShopCardProps) {
  // main's useHover returns `hover`; the refactor branch renamed it isHovered.
  const { hover: isHovered, bind } = useHover();
  const lit = isHovered || isOpen;

  /** MOUNTED SHUT, THEN OPENED — and without this the open does not animate at
   * all while the close does, which is exactly what it looked like.
   *
   * A CSS transition needs two values to move between. The open branch is a
   * different element from the closed card, so it MOUNTS with width already at
   * the full span: there is no previous value, nothing transitions, and the box
   * is 727px wide on the first frame. Measured frame by frame, opening sat at
   * 727 from t=0 while closing eased 446 → 343 over 450ms — one direction
   * animating and the other not.
   *
   * So it mounts at one column and is told to open on the next frame, which
   * gives the transition its start value. Two frames rather than one: React
   * can commit and the browser can paint within a single rAF, and a style
   * applied in the same paint as the mount is still the initial value. */
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      return;
    }
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [isOpen]);

  /** Full width only once it has both been told to open and had its first frame
   * at one column. Closing clears isShown, which runs the same transition back. */
  const wide = isShown && entered;

  // ONE OBJECT WHEN OPEN, and the card gives up its own chrome to make that
  // true. Open, the border, the radius, the shadow and the lift all belong to
  // the wrapper below, which encloses the card AND the panel; the card keeps
  // only its padding. Left carrying its own set, the open state was a bounded
  // box beside another bounded box with a gap down the middle — three separate
  // statements that they are separate things.
  const card = (
    <div
      {...bind}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        // NO PADDING OF ITS OWN WHEN OPEN. The wrapper already holds the frame,
        // and a second inset here was doing two visible things: it left a
        // channel between Close and Add & Checkout, and it pushed the card's
        // button down by its own bottom padding so the two halves of what
        // should be one bar sat at different heights.
        // NO CARD AT ALL WHEN CLOSED — no background, no border, no radius, no
        // padding, no shadow. That is not a stylistic preference, it is what
        // both reference sites measure: mondayhaircare and kookai both report
        // background rgba(0, 0, 0, 0), border 0px, radius 0px, shadow none on
        // the repeating product tile. We had every one of them, and each was a
        // line drawn AROUND the product rather than a way of showing it.
        //
        // The photograph is the card now. The hover signal moves onto the
        // picture, which already scales and warms — a lift needs something to
        // lift, and there is no longer a plate under the image to raise.
        padding: 0,
        transition: motion.card,
      }}
    >
      {/* Only the picture and the name are inside the link, and the link is a
          real one: on the shop, unlike the homepage, a product page is
          somewhere a customer might actually want to go. The action below is
          what opens the configurator. */}
      <Link to={item.to} style={{ display: 'block', textDecoration: 'none', flex: '0 0 auto' }}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: radius.md,
            // 4:5, AND THIS IS THE SINGLE BIGGEST REASON THE PRODUCTS NOW
            // READ. At 5:4 the picture was 343x275 in a 434 card — under two
            // thirds of it — where monday measures 347x499 in 688 and kookai
            // 295x443 in 511. Portrait, at 73% and 87%. Ours was landscape at
            // 63%, which is a photograph illustrating a card instead of a
            // photograph being one. 4:5 takes it to 429px tall: 1.6x the image
            // area in the same column, and the same share of the card monday
            // gives it.
            //
            // THE OLD NOTE HERE ARGUED 5:4 ON TWO GROUNDS, and both need
            // answering rather than ignoring. It said 4:5 ran a card near 700
            // tall — but that was arithmetic on a 390-wide card, and COLUMN_MIN
            // has been 340 since, so the card lands at 588, between the two
            // references. It also said landscape is truer to photographs of
            // rooms, which is real: the crop is why this is 4:5 and not the 0.70
            // and 0.67 the references run. A moderate portrait keeps the window
            // in frame — and objectPosition is per item for the few where the
            // subject sits off centre.
            aspectRatio: '4 / 5',
            // A MISSING PHOTOGRAPH IS AN EMPTY FRAME, NOT A BLACK ONE. On the
            // old landscape tile the charcoal fallback was a smallish dark
            // rectangle; at 4:5 it is 435px tall and was out-shouting every
            // product that does have a picture. The band is the page's own
            // quiet grey, so a gap in the photography now reads as a gap.
            background: tokens.band,
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
                // NOT 'center'. A room cropped to 4:5 about its middle lands
                // on the floor, and every product here — blinds, curtains,
                // shutters, awnings — hangs high on a wall. 35% keeps the
                // window in frame. Per-item imagePosition still wins, which is
                // what that field is for.
                objectPosition: item.imagePosition ?? '50% 35%',
                display: 'block',
                transform: lit ? 'scale(1.04)' : 'scale(1)',
                filter: lit
                  ? 'saturate(1.12) contrast(1.06) brightness(1.02)'
                  : 'saturate(1.04) contrast(1.03)',
                transition: 'transform 0.7s ease, filter 0.5s ease',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: space.md,
                border: `1px solid ${tokens.lineFaint}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ProductGlyph type={item.glyph ?? ''} size={140} color={tokens.inkSoft} ground={tokens.band} opacity={lit ? 0.75 : 0.55} />
            </div>
          )}
          {/* NO SCRIM. The vignette existed to give the photograph an edge
              against the white card behind it; there is no card behind it now,
              so all it did was put up to a fifth of ink over the product. Both
              references darken their product shots by nothing at all. */}
        </div>

        {/* THE GROUP AND THE NAME, UNDER the picture rather than on it. Three
            lines at most, and the price is not one of them: the panel prices
            the actual configuration, and a from-figure twenty pixels above a
            real one is a second, vaguer number. */}
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
            // TWO LINES' WORTH, RESERVED, whether the name needs them or not —
            // the actions are the strongest horizontal line in the grid and
            // they have to land together across a row. A single name that wraps
            // would otherwise drop its button below its neighbours'.
            minHeight: `${2 * 1.1 * parseFloat(String(typeScale.card.fontSize))}px`,
            color: tokens.ink,
            marginTop: space.xs,
          }}
        >
          {item.name}
        </h3>
      </Link>

      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          marginTop: 'auto',
          width: '100%',
          height: 52,
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          // SQUARE ON THE JOIN. Open, this button and the panel's Add &
          // Checkout are flush against each other at the same 52px, so a radius
          // on the inside edge would put a notch in what has to read as one bar
          // across the whole card.
          borderRadius: isOpen ? `${radius.md}px 0 0 ${radius.md}px` : radius.md,
          cursor: 'pointer',
          border: 'none',
          // FILLED BRONZE, and it was briefly not.
          //
          // The reference analysis argued the fill away: fourteen solid bars
          // were the highest-contrast thing on the page, and neither monday nor
          // kookai fills a button at all. That was a fair reading of the OLD
          // card, where the picture was 275px of 434 and the button really was
          // the loudest thing in it. It stopped being true the moment the
          // photograph went portrait — 433 of 587, three quarters of the card,
          // which outweighs a 52px bar underneath without any help.
          //
          // The bar is also the only thing on a resting card that says the
          // configurator exists. An underline says "link", and this opens a
          // panel in place.
          background: isOpen || isHovered ? tokens.accentHover : tokens.accent,
          color: tokens.onAccent,
          ...typeScale.label,
          lineHeight: 1,
          transition: motion.button,
        }}
      >
        {isOpen ? 'Close' : 'Shop Now'}
      </button>
    </div>
  );

  if (!isOpen) return card;

  // THE SLOT JUMPS; NOTHING VISIBLE DOES. The grid item takes its two columns
  // on the tick the state changes — `grid-column` cannot be animated — but it
  // carries no border, no background and no shadow, so there is nothing on it
  // to be seen jumping. Everything visible is on the box inside it, which
  // animates its own width across the space the span just made.
  return (
    <div
      style={{
        gridColumn: isNarrow ? '1 / -1' : 'span 2',
        display: 'flex',
      }}
    >
      <div
        style={{
          // ONE COLUMN TO THE FULL SPAN. Stacked, there is only ever one column
          // to be, so it opens downward instead and the width holds still.
          width: isNarrow || wide || colWidth === null ? '100%' : colWidth,
          display: 'flex',
          flexDirection: isNarrow ? 'column' : 'row',
          alignItems: 'stretch',
          // NO GAP. The two halves meet; a channel between them would be the one
          // thing saying they are two objects.
          boxSizing: 'border-box',
          padding: space.xxs,
          background: tokens.card,
          // THE WHOLE SHAPE WEARS THE ACCENT, enclosing the card and the panel
          // together, so the edge grows with the card rather than being a second
          // thing drawn around a second box.
          border: `1px solid ${tokens.accent}`,
          borderRadius: radius.lg,
          boxShadow: shadow.lift,
          overflow: 'hidden',
          // Shutting is quicker than opening — see CLOSE_MS — and the
          // property changes along with the width, so each direction gets its
          // own duration out of the same declaration.
          transition: `width ${wide ? OPEN_MS : CLOSE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        {/* PINNED, so the card does not resize while the box grows around it.
            Less the box's own frame and border, which the closed card carries
            itself — the card's CONTENT is then exactly as wide open as shut,
            which is the whole point of pinning it. */}
        <div
          style={{
            flex: isNarrow || colWidth === null
              ? '1 1 auto'
              : `0 0 ${colWidth - 2 * space.xxs - 2}px`,
            minWidth: 0,
          }}
        >
          {card}
        </div>

      {/* NO BORDER, AND SQUARE ON THE JOIN. A hairline all the way round drew
          the panel as its own box, and the inside edge in particular put a rule
          down the join it is meant to be crossing. Radius on the outer corners
          only, so the shape ends where the card ends.

          It fades and slides out of the card rather than appearing: the row can
          animate its slot widening, a grid item cannot, so the panel does that
          work itself. klay-panel-in is the row's own keyframe. */}
        <div
          style={{
            // PINNED TO WHERE IT ENDS, so nothing inside is laid out twice.
            // At `1 1 0` the panel's width animated along with the box, and the
            // configurator's rows — label left, value right — wrapped, unwrapped
            // and re-settled on every frame of the 450ms. The box clips; the
            // growth uncovers type that has not moved.
            flex: isNarrow || colWidth === null
              ? '1 1 auto'
              : `0 0 ${colWidth + COLUMN_GAP}px`,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            // FADES IN BEHIND THE WIDTH, not with it. The box takes 450ms to
            // open; a panel fading over the same 450ms is visible while the
            // space it is in is still half made, which reads as two things
            // happening at once. Held back until the width has nearly settled,
            // it reads as one: the card opens, then the controls are there.
            opacity: wide ? 1 : 0,
            transition: 'opacity 0.18s ease 0.16s',
          }}
        >
          <RangeConfigurator item={item} sel={sel} onChange={onChange} fill />
        </div>
      </div>
    </div>
  );
}
