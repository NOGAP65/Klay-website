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

import { Link } from 'react-router-dom';

import { radius, tokens, motion, space, type as typeScale, useHover } from '@/ds';

import { type Selection } from '../configOptions';
import type { CatalogueItem } from '../constants';

import { ProductGlyph } from './ProductGlyph';
import { RangeConfigurator } from './RangeConfigurator';

export interface ShopCardProps {
  item: CatalogueItem;
  sel: Selection;
  onChange: (fieldId: string, choiceId: string) => void;

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
 * the order is kept, the duration is not the grid's length.
 *
 * 90, down from 170. At 170 the grid was still rearranging after the box had
 * finished opening, which is two events; at 90 it is one motion with a lead,
 * which is what a stagger is for. */
export const STAGGER_SPAN_MS = 90;

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

export function ShopCard({ item, sel, onChange }: ShopCardProps) {
  const { isHovered, bind } = useHover();
  const lit = isHovered;

  return (
    <article
      {...bind}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
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
                inset: space.item,
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

      {/* THE CONFIGURATION, UNDER THE PICTURE AND ALWAYS THERE.
          Dense mode: every question one line, answerable where it stands, no
          row that opens and nothing that changes height. See DenseField.

          It carries its own Add to cart, so the card needs no button of its
          own — the thing that used to say Shop Now was only ever a door to
          this. */}
      {/* FILLS WHAT IS LEFT, so every Add to cart in a row lands on one line.
          The grid stretches each card to the tallest in its row; without this
          the configurator sized to its own questions and a five-row product put
          its button 40px above a six-row neighbour's. The panel pushes its own
          action bar to the bottom once it has the height — see the flex on the
          field column there. */}
      <div style={{ marginTop: space.item, flex: '1 1 auto', display: 'flex', minHeight: 0 }}>
        <RangeConfigurator item={item} sel={sel} onChange={onChange} dense />
      </div>
    </article>
  );
}
