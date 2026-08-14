// ---------------------------------------------------------------------------
// 11. Journal tiles — four, edge to edge, no gaps.
//
// The same PhotoTile as the category grid, in one row instead of three. It sits
// after the install strip, once the page has stopped selling and started proving,
// so it reads as "more to read" rather than as another attempt to close.
//
// It is what stops the page being a pure catalogue. Between the install strip and
// the reviews, both of which are evidence, this is the one section that is just
// the brand having something to say — which is the balance the reference sites
// strike and the thing a competitor site with the same products does not have.
//
// ON THE DESTINATIONS. Three of the four were briefed to /blog/bedroom,
// /blog/guide and /blog/motorisation. There is no /blog route in App.tsx and no
// blog in the app, and routing is out of scope in this pass — so as briefed,
// three of these four tiles would have landed on the 404 page. Each now points at
// the nearest page that actually answers its label, with the intended blog path
// recorded beside it. When the blog ships, swap the `to` and delete the note.
// ---------------------------------------------------------------------------

import { tokens } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PhotoTile, SectionBand, TILE_GAP } from './primitives';

// ON THE PHOTOGRAPHY. None of these four appears in the install strip directly
// above or the editorial panel directly above that — the same photograph twice
// within one screen of scroll is the single most obvious way a page stops looking
// composed, and the first pass at this row had two of the install strip's five
// shots in it. Each of these is at least five sections away from its other use.
//
// room-1.png and room-2.png are deliberately NOT used here, though they were the
// obvious spare assets. They are the visualiser's cold blue base plates — empty
// unfurnished rooms shot for the renderer to composite onto — and dropping one
// into a warm editorial row is exactly the thing that reads as out of place.
const TILES = [
  {
    label: 'The Bedroom Edit',
    // Intended: /blog/bedroom. Until then, the blockout roller — the product that
    // article would be about.
    to: '/products/dusk',
    // The one genuinely unused lifestyle shot in the repository: a bedroom in
    // full-length drapes with the city behind it.
    image: '/images/curtains-room.jpg',
    objectPosition: '68% center',
  },
  {
    label: 'Choosing Your Blind',
    // Intended: /blog/guide. The listing is where the choice is actually made —
    // it carries the four types side by side with their fabrics.
    to: '/blinds/roller-blinds',
    // The dual roller: two fabrics on one bracket, which is the choice this tile
    // is about made visible in one frame.
    image: '/images/Eclipse%20Dual%20Roller%20product%20image.png',
    objectPosition: 'center 45%',
  },
  {
    label: 'Motorisation Explained',
    // Intended: /blog/motorisation. The process page is the nearest thing that
    // explains how an install works.
    to: '/how-it-works',
    // A bedroom blockout — the span and the room where a motor stops being a
    // luxury and starts being the reason people buy the upgrade.
    image: '/images/Phoenix%20Blockout%20product%20image.png',
    objectPosition: 'center 42%',
  },
  {
    // The only one of the four with a real destination as briefed.
    label: 'Book a Consultation',
    to: '/contact',
    image: '/images/lifestyle/step-2-measure.png',
    objectPosition: 'center 42%',
  },
];

export function InspirationTiles() {
  const isMobile = useIsMobile();

  return (
    // Charcoal, between two warm whites — the install strip above and the reviews
    // below. Parchment would not have separated them: one step down from warm
    // white still reads as the same field continuing, and this row's job is to
    // break a long light stretch at the bottom of the page into two halves.
    <section style={{ background: tokens.charcoal }}>
      {/* The same band as every other grid on the page, onDark for the charcoal
          ground. Without it this row arrives with no introduction, which after
          two banded sections reads as unfinished rather than as deliberately
          quiet. */}
      <SectionBand label="Journal" title="Ideas and inspiration." isMobile={isMobile} onDark />

      <div
        style={{
          display: 'grid',
          // Two-up on a phone rather than one. Four full-width tiles stacked is
          // four screens of scroll for a section that is not trying to convert.
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: TILE_GAP,
          // The outer two strips. Gap only applies between items, so the edges
          // have to be padding — same treatment as the range row, so every tile
          // row on the page is framed rather than one being framed and two
          // running off into the viewport.
          padding: `0 ${TILE_GAP}px`,
        }}
      >
        {TILES.map(tile => (
          <PhotoTile
            key={tile.label}
            to={tile.to}
            label={tile.label}
            image={tile.image}
            objectPosition={tile.objectPosition}
            // Shorter than the category tiles' 660. Four of those would be a
            // screen and a half of grid for the page's quietest section.
            minHeight={isMobile ? 240 : 420}
            labelSize="clamp(20px, 2vw, 28px)"
          />
        ))}
      </div>
    </section>
  );
}
