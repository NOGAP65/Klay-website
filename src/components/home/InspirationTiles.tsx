// ---------------------------------------------------------------------------
// 11. Inspiration tiles — four, edge to edge, no gaps.
//
// The same PhotoTile as the room grid, in one row instead of a 2x2. It sits
// after the testimonials-facing half of the page has started, so it reads as
// "more to read" rather than as another attempt to sell.
//
// ON THE DESTINATIONS. Three of the four were briefed to /blog/bedroom,
// /blog/guide and /blog/motorisation. There is no /blog route in App.tsx and no
// blog in the app, and App.tsx routing is out of scope in this pass — so as
// briefed, three of these four tiles would have landed on the 404 page. Each
// now points at the nearest page that actually answers its label, with the
// intended blog path recorded beside it. When the blog ships, swap the `to` and
// delete the note.
// ---------------------------------------------------------------------------

import { tokens } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PhotoTile, SectionBand } from './primitives';

const TILES = [
  {
    label: 'The Bedroom Edit',
    // Intended: /blog/bedroom. Until then, the blockout roller — the product
    // that article would be about.
    to: '/products/dusk',
    image: '/images/Phoenix%20Blockout%20product%20image.png',
    objectPosition: 'center 38%',
  },
  {
    label: 'Choosing the Right Blind',
    // Intended: /blog/guide. The listing is where the choice is actually made —
    // it carries the fabric filters and the four types side by side.
    to: '/blinds/roller-blinds',
    image: '/images/room-3.png',
    objectPosition: '38% 42%',
  },
  {
    label: 'Motorisation Explained',
    // Intended: /blog/motorisation.
    to: '/how-it-works',
    // A wide blind over sliding doors — the span where a motor stops being a
    // luxury. It also breaks up the two pale empty rooms that were sitting side
    // by side here and reading as the same photograph twice.
    image: '/images/Eclipse%20Dual%20Roller%20product%20image.png',
    objectPosition: 'center 50%',
  },
  {
    // The only one of the four with a real destination as briefed.
    label: 'Book a Consultation',
    to: '/contact',
    image: '/images/hero-room.jpg',
    objectPosition: 'left center',
  },
];

export function InspirationTiles() {
  const isMobile = useIsMobile();

  return (
    <section style={{ background: tokens.charcoal }}>
      {/* The same band as every other grid on the page, onDark for the charcoal
          ground. This row previously arrived with no introduction at all, which
          after two banded grids read as an unfinished section rather than as a
          deliberately quiet one. */}
      <SectionBand
        label="Journal"
        title="Ideas and inspiration."
        isMobile={isMobile}
        onDark
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: 0,
        }}
      >
        {TILES.map(tile => (
          <PhotoTile
            key={tile.label}
            to={tile.to}
            label={tile.label}
            image={tile.image}
            objectPosition={tile.objectPosition}
            minHeight={isMobile ? 260 : 420}
          />
        ))}
      </div>
    </section>
  );
}
