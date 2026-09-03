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
// This is that pattern on a grid instead of a scroller, and the difference
// matters. The row could widen a card because it had somewhere to widen INTO:
// slots either side, and a scroller to absorb the overflow. A grid has neither
// — a card that grew sideways would push its neighbours out of their columns.
//
// SO THE OPEN CARD SPANS TWO COLUMNS instead of overflowing one. The grid
// already reflows around a spanning item, which is exactly the behaviour
// wanted, and inside those two columns the photograph keeps its own width and
// the configurator takes the one that opened up. Same shape as the row: picture
// left, controls right, both on screen together, which is the whole point —
// choosing Forest Green has to repaint something you can see.
//
// THE TILE IS THE BUTTON. It does not navigate: the photograph and its chip both
// open the panel, which is the same call the homepage's cards make. A tile that
// went to a detail page with an expander underneath would be two controls
// disagreeing about what the card is for. See PhotoTile.onActivate.
//
// ONE AT A TIME, held by the page rather than the card, because "close the
// other one" is a decision only something that can see both can make.
//
// BELOW THE NARROW BREAKPOINT IT STACKS. At two columns across there is no
// second column to give the panel, so the open card spans the full row and the
// configurator sits under the photograph — the same concession the row makes on
// a phone, for the same reason.
// ---------------------------------------------------------------------------

import { radius, tokens, shadow, space } from '@/ds';

import { type Selection } from '../configOptions';
import type { CatalogueItem } from '../constants';

import { ProductCard } from './ProductCard';
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
}

export function ShopCard({ item, isOpen, onToggle, sel, onChange, isNarrow }: ShopCardProps) {
  const tile = (
    <ProductCard
      to={item.to}
      onActivate={onToggle}
      cta={isOpen ? 'Close' : 'Shop Now'}
      name={item.name}
      eyebrow={item.group}
      tagline={item.tagline}
      priceFrom={item.priceFrom}
      image={item.image}
      imagePosition={item.imagePosition}
      glyph={item.glyph}
      // NO SWATCH ROW ON THE SHOP TILE. It was the most useful thing a tile
      // could say back when a tile was all there was — but the card opens into
      // a configurator with the same colours in it now, at a size you can
      // actually judge, so the row was the same information twice and the
      // second copy was taking picture off the top of every card.
      //
      // The homepage's cards keep theirs: those four do not all open, and the
      // row is what tells you a product comes in a range at all.
      minHeight={520}
    />
  );

  if (!isOpen) return tile;

  return (
    <div
      style={{
        // THE SPAN IS THE WHOLE MECHANISM. Two columns where there are columns
        // to take, the full row where there are not.
        gridColumn: isNarrow ? '1 / -1' : 'span 2',
        display: 'flex',
        flexDirection: isNarrow ? 'column' : 'row',
        alignItems: 'stretch',
        gap: space.item,
        padding: space.hairline,
        boxSizing: 'border-box',
        background: tokens.card,
        // The open card wears the accent on its own edge, the way the
        // homepage's does — it is the one object on the page being worked on.
        border: `1px solid ${tokens.accent}`,
        borderRadius: radius.lg,
        boxShadow: shadow.rest,
      }}
    >
      <div style={{ flex: isNarrow ? '0 0 auto' : '1 1 0', minWidth: 0 }}>{tile}</div>

      {/* The panel takes whatever the second column opened up. `1 1 0` rather
          than a share of its own, for the reason the homepage's does: the two
          plus the gap between them must not add up to more than the span. */}
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <RangeConfigurator item={item} sel={sel} onChange={onChange} fill />
      </div>
    </div>
  );
}
