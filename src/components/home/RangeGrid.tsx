// ---------------------------------------------------------------------------
// 6. Our Range — four priced cards, edge to edge.
//
// This is the conversion section, and the one thing it must do is show a number.
// A customer arriving from a traditional blind company has just been asked to
// fill in a form to find out what anything costs; four prices on the page,
// visible before they have given up an email address, is the single clearest
// statement that Klay works differently.
//
// FOUR CARDS, NOT NINE. An earlier version of this section showed all nine
// product types, five of them as charcoal COMING SOON tiles. That answered "what
// does Klay make?" — a reasonable question, but not this section's. The category
// grid above already answers it, and a grid where more than half the cells cannot
// be bought reads as a roadmap rather than a range. These four are the four
// things that have a real price today.
//
// ON THE FOURTH CARD. Three come from the product catalogue; Sheer Curtains comes
// from the taxonomy, because it has a specified from-price ($360) and a real
// photograph but no product record — curtains are not configurable yet. Its card
// is deliberately identical to the other three: the price is real, so hiding it
// behind a different treatment would reintroduce exactly the gatekeeping this
// section exists to remove. It resolves through /products?category=, which sends
// curtain enquiries to a person rather than to a 404.
//
// A CARD, NOT A PHOTOTILE. The tiles elsewhere on the page put a label over a
// full-bleed photograph, which suits a room or a category — an atmosphere with a
// name on it. A priced product needs its name, its price and its action legible
// as text, and white type over a photograph cannot hold a price. So the picture
// is on top and the type sits beneath it on the section's own ground, which is
// also what makes four of these read as one row of products rather than four
// unrelated pictures.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';
import { tokens, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PRODUCTS } from '../../data/products';
import { getSubcategoryBySlug } from '../../data/categories';
import { ArrowLink, CtaLink, SectionBand, useHover } from './primitives';

interface RangeCard {
  name: string;
  /** The type line under the name — 'Blockout Roller'. */
  type: string;
  priceFrom: number;
  image: string;
  objectPosition: string;
  to: string;
}

/** Looked up by slug rather than taking the first three of PRODUCTS, so
 * reordering the catalogue cannot silently change which products are featured
 * here — and a renamed slug fails loudly at build rather than rendering a card
 * with no name and $NaN on it. */
const featured = (slug: string): (typeof PRODUCTS)[number] => {
  const product = PRODUCTS.find(p => p.slug === slug);
  if (!product) throw new Error(`RangeGrid: no product with slug "${slug}"`);
  return product;
};

const SHEERS = getSubcategoryBySlug('indoor', 'sheer-curtains');

const CARDS: RangeCard[] = [
  ...(['dusk', 'veil', 'duo'] as const).map(slug => {
    const p = featured(slug);
    return {
      name: p.name,
      type: p.type,
      priceFrom: p.priceFrom,
      image: p.image,
      objectPosition: 'center',
      to: `/products/${p.slug}`,
    };
  }),
  {
    name: 'Sheer',
    // Named to match the catalogue's own pattern — a one-word product name and
    // the type beneath it — rather than "Sheer Curtains" over "Sheer Curtains".
    type: 'Curtains',
    // From the taxonomy, not typed out. This figure is specified in one place and
    // a second copy of it here is a copy that goes stale.
    priceFrom: SHEERS?.priceFrom ?? 360,
    image: SHEERS?.image ?? '/images/range/sheer-curtains.jpg',
    objectPosition: '46% center',
    to: '/products?category=sheer-curtains',
  },
];

function Card({ card, isMobile }: { card: RangeCard; isMobile: boolean }) {
  const { hover, bind } = useHover();

  return (
    <Link
      {...bind}
      to={card.to}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        // Cream, one step up from the parchment ground. It is what gives four
        // gapless cards an edge to each other without a rule or a gutter between
        // them — the section ground shows only at the top and bottom of the row,
        // so the four read as one block.
        background: hover ? tokens.warmWhite : tokens.cream,
        transition: 'background 0.3s ease',
      }}
    >
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 5' }}>
        <img
          src={card.image}
          alt={`${card.name} ${card.type}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: card.objectPosition,
            display: 'block',
            transform: hover ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.7s ease',
          }}
        />
      </div>

      {/* The type block. flex-grow so four cards whose names wrap differently
          still put their price and their action on the same baseline. */}
      <div
        style={{
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          padding: isMobile ? '24px 22px 26px' : '28px 26px 30px',
        }}
      >
        <h3
          style={{
            fontFamily: tokens.body,
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: tokens.ink,
            margin: 0,
          }}
        >
          {card.name}
        </h3>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 12.5,
            color: tokens.inkSoft,
            margin: '6px 0 0',
          }}
        >
          {card.type}
        </p>
        {/* Gold, and the largest thing in the block. This is the section's whole
            argument — see the note at the top of the file. */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 15,
            fontWeight: 500,
            color: tokens.gold,
            margin: '16px 0 0',
          }}
        >
          From ${card.priceFrom}
        </p>
        <div style={{ marginTop: 'auto', paddingTop: 22 }}>
          <ArrowLink label="Shop Now" hovered={hover} />
        </div>
      </div>
    </Link>
  );
}

export function RangeGrid() {
  const isMobile = useIsMobile();

  return (
    // Parchment. The section above is charcoal and the banner below it is
    // charcoal again, so this is the light band between two darks — and one step
    // down from warmWhite, which the category grid above already used.
    <section style={{ background: tokens.parchment }}>
      {/* The page's shared band, same component as the category, visualiser,
          install and journal sections. It supplies the top padding. */}
      <SectionBand
        label="The collection"
        title="Our Range"
        sub="Made to measure. Installed by experts."
        isMobile={isMobile}
      />

      <div
        style={{
          display: 'grid',
          // Gapless, and capped at the wider grid max — these are photographs
          // first, and 1200 would shrink four of them below the point of being
          // persuasive. Two columns on a phone rather than one: a single column
          // of four cards is four full screens of scroll for one section.
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 0,
          maxWidth: layout.gridMax,
          margin: '0 auto',
        }}
      >
        {CARDS.map(card => (
          <Card key={card.to} card={card} isMobile={isMobile} />
        ))}
      </div>

      {/* The one exit for someone who wants the full list rather than one of the
          four. A dark fill, not gold: there are already four gold prices and four
          gold Shop Nows in the grid above, and a fifth gold object directly
          beneath them would be the least important one shouting loudest. */}
      <div
        style={{
          textAlign: 'center',
          padding: isMobile ? '44px 24px 72px' : '56px 80px 96px',
        }}
      >
        <CtaLink to="/blinds/roller-blinds" variant="onDark">
          View All Products
        </CtaLink>
      </div>
    </section>
  );
}
