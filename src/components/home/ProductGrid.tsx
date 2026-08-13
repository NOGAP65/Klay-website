// ---------------------------------------------------------------------------
// 6. Our Range — four columns, edge to edge, priced.
//
// No "request a quote" gatekeeping: every card carries its from-price, because
// the customer this page is written for expects to see the number before they
// speak to anyone.
//
// ON THE LAYOUT. Four columns, six products, and no empty cells — the four
// roller blinds fill row one and the two curtains take half the width each on
// row two. A four-column grid with the briefed five products would have left one
// card alone on row two beside three holes, which with no gaps between cards
// reads as a rendering fault rather than as a layout. Giving the curtains the
// double width also puts the newer, higher-ticket range at the size it deserves.
//
// ON THE DATA. The four rollers come from PRODUCTS, so their names, prices and
// photographs cannot drift from the product pages they link to. The two curtains
// do NOT exist in products.ts — the catalogue is rollers only — so their prices
// are declared here, from the brief, and marked. They need adding to
// products.ts properly; that file is off limits in this pass.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';
import { tokens, layout, motion } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PRODUCTS } from '../../data/products';
import { ArrowLink, CtaLink, SectionHead, useHover } from './primitives';

interface Card {
  name: string;
  priceFrom: number;
  image: string;
  to: string;
  /** Two columns instead of one, so row two closes without empty cells. */
  wide?: boolean;
}

// Haze carries no photograph of its own in products.ts — it reuses the
// Sunscreen shot, documented there as a placeholder. That is survivable on a
// product page and not here: Veil and Haze sit next to each other in this row,
// so the same photograph twice in one row of four reads as a bug. This shows
// light-filtering rollers diffusing a hard sun, which is what Haze is for.
//
// It does mean the card and the product page disagree until a real Haze
// photograph is added to products.ts, which is the actual fix.
const IMAGE_OVERRIDE: Record<string, string> = {
  haze: '/images/lifestyle/room-kitchen.png',
};

// The catalogue's own four, in catalogue order.
const ROLLERS: Card[] = PRODUCTS.map(p => ({
  name: `${p.name} ${p.type}`,
  priceFrom: p.priceFrom,
  image: IMAGE_OVERRIDE[p.slug] ?? p.image,
  to: `/products/${p.slug}`,
}));

// NOT IN products.ts. Prices are the brief's; $320 matches the small blockout
// curtain in the visualiser's own CURTAIN_BASE_PRICES, and $360 for a sheer has
// no counterpart in the codebase at all. Both destinations go through the
// /products resolver, which sends curtains to the enquiry form until they have
// somewhere to be sold.
const CURTAINS: Card[] = [
  {
    name: 'Sheer Curtain',
    priceFrom: 360,
    // Light coming THROUGH the cloth, which is the whole proposition of a sheer.
    image: '/images/room-3.png',
    to: '/products?category=sheer-curtains',
    wide: true,
  },
  {
    name: 'Blockout Curtain',
    priceFrom: 320,
    // Heavy floor-length drapes in a dark room. These two were the other way
    // round at first, which put the palest sheer in the range under the word
    // "Blockout" — a photograph contradicting its own label.
    image: '/images/curtains-room.jpg',
    to: '/products?category=blockout-curtains',
    wide: true,
  },
];

const CARDS = [...ROLLERS, ...CURTAINS];

function ProductCard({ card, isMobile }: { card: Card; isMobile: boolean }) {
  const { hover, bind } = useHover();
  return (
    <Link
      {...bind}
      to={card.to}
      style={{
        display: 'block',
        textDecoration: 'none',
        gridColumn: !isMobile && card.wide ? 'span 2' : undefined,
      }}
    >
      <div
        style={{
          // The wide curtain cards are twice as broad, so a fixed ratio would
          // make them twice as tall as the row above. A flat height keeps both
          // rows in proportion and lets the crop do the work.
          height: isMobile ? 360 : card.wide ? 380 : 420,
          overflow: 'hidden',
          background: tokens.cream,
        }}
      >
        <img
          src={card.image}
          alt={card.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transform: hover ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.6s ease',
          }}
        />
      </div>

      <div
        style={{
          padding: isMobile ? '22px 24px 34px' : '24px 28px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <h3
          style={{
            fontFamily: tokens.body,
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '0.02em',
            color: tokens.ink,
            margin: 0,
          }}
        >
          {card.name}
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 14,
              fontWeight: 500,
              color: tokens.gold,
              transition: motion.link,
            }}
          >
            From ${card.priceFrom}
          </span>
          <ArrowLink label="Shop Now" hovered={hover} />
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid() {
  const isMobile = useIsMobile();

  return (
    <section style={{ background: tokens.parchment, padding: isMobile ? '80px 0' : '120px 0' }}>
      <div
        style={{
          maxWidth: layout.containerMax,
          margin: '0 auto',
          padding: `0 ${layout.inlinePad(isMobile)}px`,
          marginBottom: isMobile ? 44 : 64,
        }}
      >
        <SectionHead label="The collection" title="Our Range" sub="Made to measure. Installed by experts." />
      </div>

      {/* Edge to edge and gapless, so the photographs form one band across the
          page and the parchment only shows under the type. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: 0,
        }}
      >
        {CARDS.map(card => (
          <ProductCard key={card.name} card={card} isMobile={isMobile} />
        ))}
      </div>

      <div
        style={{
          textAlign: 'center',
          marginTop: isMobile ? 44 : 64,
          padding: `0 ${layout.inlinePad(isMobile)}px`,
        }}
      >
        <CtaLink to="/products">View All Products</CtaLink>
      </div>
    </section>
  );
}
