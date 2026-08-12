// ---------------------------------------------------------------------------
// 4. Category strip — five photo tiles on a horizontal rail.
//
// ON THE DESTINATIONS. Every tile goes to /products?category=<slug>, and
// ProductsPage resolves that slug to the page that can actually sell the thing.
// It has to work that way because the catalogue and the router disagree: four
// roller-blind products are routed and buyable, while every curtain and
// wardrobe subcategory in data/categories.ts is still available:false and has
// no route at all. Pointing a Sheer Curtains tile at the roller-blind listing
// would be a bait-and-switch, and pointing it at /curtains would 404 — so the
// two ranges that aren't on sale yet resolve to the enquiry form instead. When
// those categories get a listing page, the map in ProductsPage is the one place
// that changes.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';
import { tokens, layout, motion, shadow } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { railPadding, RailArrows, SectionHead, useHover, useRail } from './primitives';

interface Tile {
  label: string;
  /** Resolved by ProductsPage — see the note above. */
  category: string;
  image: string;
  /** Vertical crop. These photographs put the window covering at different
   * heights, and a flat 'center' cuts the product out of three of the five. */
  objectPosition: string;
}

const TILES: Tile[] = [
  {
    label: 'Roller Blinds',
    category: 'roller-blinds',
    image: '/images/lifestyle/room-kitchen.png',
    objectPosition: 'center 30%',
  },
  {
    label: 'Dual Roller',
    category: 'dual-roller',
    // The catalogue's own Eclipse shot. The empty-room renders in
    // public/images have a roller in them, but nothing that reads as a DUAL
    // roller — the two layers are the entire product.
    image: '/images/Eclipse%20Dual%20Roller%20product%20image.png',
    objectPosition: 'center 45%',
  },
  {
    label: 'Sheer Curtains',
    category: 'sheer-curtains',
    image: '/images/room-5.png',
    objectPosition: '72% 40%',
  },
  {
    label: 'Blockout Curtains',
    category: 'blockout-curtains',
    image: '/images/curtains-room.jpg',
    objectPosition: '78% center',
  },
  {
    label: 'Wardrobes',
    category: 'wardrobes',
    image: '/images/hero-room.jpg',
    objectPosition: 'left center',
  },
];

function CategoryTile({ tile }: { tile: Tile }) {
  const { hover, bind } = useHover();
  return (
    <Link
      {...bind}
      to={`/products?category=${tile.category}`}
      style={{
        flex: '0 0 auto',
        width: 'clamp(232px, 24vw, 318px)',
        textDecoration: 'none',
        scrollSnapAlign: 'start',
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        transition: motion.card,
      }}
    >
      <div
        style={{
          aspectRatio: '4 / 5',
          overflow: 'hidden',
          borderRadius: 2,
          background: tokens.parchment,
          boxShadow: hover ? shadow.lift : shadow.rest,
          transition: motion.card,
        }}
      >
        <img
          src={tile.image}
          alt={tile.label}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: tile.objectPosition,
            display: 'block',
            // A slow push-in on hover. The tile itself lifts; the photograph
            // inside it grows, so the crop moves rather than the whole card
            // simply scaling.
            transform: hover ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.6s ease',
          }}
        />
      </div>
      <div
        style={{
          marginTop: 18,
          fontFamily: tokens.body,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: hover ? tokens.gold : tokens.ink,
          transition: motion.link,
        }}
      >
        {tile.label}
      </div>
    </Link>
  );
}

export function CategoryStrip() {
  const isMobile = useIsMobile();
  const gap = isMobile ? 16 : 24;
  const railPad = railPadding(isMobile);
  const { railRef, overflows, nudge } = useRail(gap);

  return (
    <section style={{ background: tokens.warmWhite, padding: isMobile ? '80px 0' : '120px 0' }}>
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
        <SectionHead label="Shop by category" title="Everything for the window." />
        {!isMobile && overflows && <RailArrows nudge={nudge} />}
      </div>

      {/* The rail runs to the viewport edge rather than stopping at the
          container, so a tile is always half-visible on the right and the row
          reads as scrollable without an affordance drawn on top of it. The
          leading pad matches the container inset so the first tile still lines
          up with the headline above it.

          scroll-padding-left has to match padding-left exactly. Without it the
          snapport starts at the rail's own left edge, so the browser snaps the
          first tile's start edge to x=0 on load — silently scrolling the rail
          by the width of the padding and cropping the first tile and its label
          off the left of the viewport. */}
      <div
        ref={railRef}
        className="klay-hscroll"
        style={{
          display: 'flex',
          gap,
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
          paddingLeft: railPad,
          scrollPaddingLeft: railPad,
          paddingRight: layout.inlinePad(isMobile),
          paddingBottom: 8,
        }}
      >
        {TILES.map(tile => (
          <CategoryTile key={tile.category} tile={tile} />
        ))}
      </div>
    </section>
  );
}
