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

import { radius, tokens, motion, shadow, space, type as typeScale, useHover } from '@/ds';

import { type Selection } from '../configOptions';
import type { CatalogueItem } from '../constants';

import { ProductGlyph } from './ProductGlyph';
import { RangeConfigurator } from './RangeConfigurator';

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

/** How far the card rises under the pointer. The row's number, so the two
 * surfaces feel like the same object. */
const LIFT = 3;

/** The row's own lighting: a radial wash, transparent across the middle and a
 * fifth of ink at the corners, centred slightly above centre because that is
 * where the window is in these renders. It gives a photograph of a whole room
 * the falloff a studio shot of one object has for free. */
const VIGNETTE =
  'radial-gradient(118% 88% at 50% 42%, rgba(29,29,29,0) 42%, rgba(29,29,29,0.08) 70%, rgba(29,29,29,0.20) 100%)';

export function ShopCard({ item, isOpen, onToggle, sel, onChange, isNarrow, colWidth, isShown }: ShopCardProps) {
  const { isHovered, bind } = useHover();
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
        padding: isOpen ? 0 : space.hairline,
        ...(isOpen
          ? null
          : {
              background: tokens.card,
              border: `1px solid ${lit ? tokens.lineStrong : tokens.lineFaint}`,
              borderRadius: radius.lg,
              boxShadow: lit ? shadow.lift : shadow.rest,
              transform: lit ? `translateY(-${LIFT}px)` : 'translateY(0)',
            }),
        transition: `${motion.card}, border-color 0.3s ease`,
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
            // 5:4 RATHER THAN 4:5, and the shop is the one place that should
            // differ from the row. The row shows four cards side by side across
            // a full-width band, where a portrait tile is what stops them
            // reading as one long strip. The shop stacks fourteen down a page
            // beside a filter rail: at 4:5 a 390-wide card ran near 700 tall,
            // so barely two rows cleared the fold and scrolling the range meant
            // scrolling past the same card four times.
            //
            // Landscape is also truer to the photographs. Every one of them is
            // a room — a kitchen, a bed, a patio — and a room is wider than it
            // is tall; the portrait crop was cutting the sides off the very
            // thing the picture is of.
            aspectRatio: '5 / 4',
            background: item.image ? tokens.band : tokens.charcoal,
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
                inset: space.item,
                border: `1px solid ${tokens.onDarkLine}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ProductGlyph type={item.glyph ?? ''} size={140} color={tokens.paper} ground={tokens.charcoal} opacity={lit ? 0.75 : 0.6} />
            </div>
          )}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: VIGNETTE,
              opacity: lit ? 0.55 : 1,
              pointerEvents: 'none',
              transition: 'opacity 0.5s ease',
            }}
          />
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
            marginTop: space.item,
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
            marginTop: space.tight,
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
          border: 'none',
          cursor: 'pointer',
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
          padding: space.hairline,
          background: tokens.card,
          // THE WHOLE SHAPE WEARS THE ACCENT, enclosing the card and the panel
          // together, so the edge grows with the card rather than being a second
          // thing drawn around a second box.
          border: `1px solid ${tokens.accent}`,
          borderRadius: radius.lg,
          boxShadow: shadow.lift,
          overflow: 'hidden',
          // The row's own duration and easing, so the two surfaces move alike.
          transition: 'width 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
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
              : `0 0 ${colWidth - 2 * space.hairline - 2}px`,
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
            flex: '1 1 0',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            // FADES IN BEHIND THE WIDTH, not with it. The box takes 450ms to
            // open; a panel fading over the same 450ms is visible while the
            // space it is in is still half made, which reads as two things
            // happening at once. Held back until the width has nearly settled,
            // it reads as one: the card opens, then the controls are there.
            opacity: wide ? 1 : 0,
            transition: 'opacity 0.2s ease 0.26s',
          }}
        >
          <RangeConfigurator item={item} sel={sel} onChange={onChange} fill />
        </div>
      </div>
    </div>
  );
}
