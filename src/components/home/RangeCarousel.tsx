// ---------------------------------------------------------------------------
// 7. Our Range — three featured products, priced.
//
// The cards are built from PRODUCTS rather than from a list written out here,
// so a name, price or photograph can't disagree with the product page the card
// links to. Three of the four are featured; Haze is the one held back, because
// it is the entry in data/products.ts still carrying placeholder imagery and
// pricing, and a "From $220" on a photograph of a different blind is the kind
// of detail a customer notices at the till rather than here.
//
// Prices are shown, not hidden behind an enquiry. That is the whole point of
// the section.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';
import { tokens, layout, motion, shadow } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PRODUCTS } from '../../data/products';
import { railPadding, RailArrows, SectionHead, useHover, useRail } from './primitives';

const FEATURED = PRODUCTS.filter(p => p.slug !== 'haze');

function ProductCard({ product }: { product: (typeof PRODUCTS)[number] }) {
  const { hover, bind } = useHover();
  return (
    <Link
      {...bind}
      to={`/products/${product.slug}`}
      style={{
        flex: '0 0 auto',
        width: 'clamp(280px, 32vw, 384px)',
        textDecoration: 'none',
        scrollSnapAlign: 'start',
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        transition: motion.card,
      }}
    >
      <div
        style={{
          aspectRatio: '3 / 4',
          overflow: 'hidden',
          borderRadius: 2,
          background: tokens.cream,
          boxShadow: hover ? shadow.lift : shadow.rest,
          transition: motion.card,
        }}
      >
        <img
          src={product.image}
          alt={`${product.name} — ${product.type}`}
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

      <div style={{ marginTop: 22 }}>
        <div
          style={{
            fontFamily: tokens.body,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: tokens.inkFaint,
            marginBottom: 10,
          }}
        >
          {product.type}
        </div>
        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: 30,
            fontWeight: 300,
            lineHeight: 1.1,
            color: tokens.ink,
            margin: 0,
          }}
        >
          {product.name}
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 16,
            marginTop: 14,
          }}
        >
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: tokens.gold,
            }}
          >
            From ${product.priceFrom}
          </span>
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: hover ? tokens.gold : tokens.ink,
              borderBottom: `1px solid ${hover ? tokens.gold : tokens.line}`,
              paddingBottom: 3,
              transition: motion.link,
            }}
          >
            Shop Now
          </span>
        </div>
      </div>
    </Link>
  );
}

export function RangeCarousel() {
  const isMobile = useIsMobile();
  const { railRef, overflows, nudge } = useRail(24);

  return (
    <section style={{ background: tokens.parchment, padding: isMobile ? '80px 0' : '120px 0' }}>
      <div
        style={{
          maxWidth: layout.gridMax,
          margin: '0 auto',
          padding: `0 ${layout.inlinePad(isMobile)}px`,
          marginBottom: isMobile ? 40 : 56,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 32,
        }}
      >
        <SectionHead label="The collection" title="Our Range" sub="Priced, in stock, and made to your measurements." />
        {!isMobile && overflows && <RailArrows nudge={nudge} />}
      </div>

      {/* scroll-padding-left mirrors padding-left — see the note in
          CategoryStrip for what goes wrong without it. */}
      <div
        ref={railRef}
        className="klay-hscroll"
        style={{
          display: 'flex',
          gap: 24,
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
          paddingLeft: railPadding(isMobile),
          scrollPaddingLeft: railPadding(isMobile),
          paddingRight: layout.inlinePad(isMobile),
          paddingBottom: 8,
        }}
      >
        {FEATURED.map(product => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
