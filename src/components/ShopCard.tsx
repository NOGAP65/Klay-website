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

export function ShopCard({ item, isOpen, onToggle, sel, onChange, isNarrow }: ShopCardProps) {
  // main's useHover returns hover; the refactor branch renamed it isHovered.
  const { hover: isHovered, bind } = useHover();
  const lit = isHovered || isOpen;

  const card = (
    <div
      {...bind}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        padding: space.xxs,
        background: tokens.card,
        border: `1px solid ${isOpen ? tokens.accent : lit ? tokens.lineStrong : tokens.lineFaint}`,
        borderRadius: radius.lg,
        boxShadow: lit ? shadow.lift : shadow.rest,
        transform: lit ? `translateY(-${LIFT}px)` : 'translateY(0)',
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
            // 4:5 — the site's one portrait ratio, and the row's.
            aspectRatio: '4 / 5',
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
                inset: space.md,
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
          borderRadius: radius.md,
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

  return (
    <div
      style={{
        // THE SPAN IS THE WHOLE MECHANISM. Two columns where there are columns
        // to take, the full row where there are not.
        gridColumn: isNarrow ? '1 / -1' : 'span 2',
        display: 'flex',
        flexDirection: isNarrow ? 'column' : 'row',
        alignItems: 'stretch',
        gap: space.xxs,
      }}
    >
      <div style={{ flex: isNarrow ? '0 0 auto' : '1 1 0', minWidth: 0 }}>{card}</div>

      {/* ARRIVES RATHER THAN APPEARING. The row animates its slot; a grid item
          cannot, so the panel does the work itself — a short rise and a fade,
          which is enough to say "this came from the card" instead of "the page
          reflowed". */}
      <div
        style={{
          flex: '1 1 0',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          background: tokens.card,
          border: `1px solid ${tokens.accent}`,
          borderRadius: radius.lg,
          boxShadow: shadow.rest,
          overflow: 'hidden',
          animation: 'klay-panel-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        <RangeConfigurator item={item} sel={sel} onChange={onChange} fill />
      </div>
    </div>
  );
}
