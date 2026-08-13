// ---------------------------------------------------------------------------
// Shop by category — a white band, then three tall tiles, edge to edge.
//
// Three verticals rather than the 2x2 of rooms this replaced. The split is now
// the one the business actually runs on — Indoor, Outdoor, Wardrobes — instead of
// four rooms that all resolved to roller blinds anyway, and a portrait tile is
// the right shape for it: a window covering hangs, so the crop wants height.
//
// ON THE PHOTOGRAPHY. All three are frames pulled out of public/hero_video.mp4,
// which turned out to be a montage rather than one scene: a furnished bedroom in
// sheers and drapes, a doorway open onto a timber deck, and a walk-in wardrobe.
// They are the brand's own footage, they are consistent with each other because
// they came from one shoot, and they replaced stand-ins that were
// misrepresenting the categories outright — a kitchen captioned "Home Office"
// among them.
//
// Outdoor is still the honest weak point. The frame shows a genuine outdoor
// area, but the covering in shot is the room's indoor sheers: there is no
// external blind anywhere in the video or in public/images. That tile is the one
// that still wants a real photograph.
//
// The first pass took two near-identical curtain frames for Indoor and Outdoor.
// They were both lovely and side by side they read as the same photograph twice,
// which is the failure mode to watch for when every asset comes from one shoot.
// ---------------------------------------------------------------------------

import { tokens, eyebrow } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PhotoTile } from './primitives';

const CATEGORIES = [
  {
    label: 'Indoor',
    category: 'indoor',
    image: '/images/categories/indoor.jpg',
    // Biased right so the bed, lamp and nightstand come into the crop with the
    // curtains. A furnished room reads as "indoor"; a wall of cloth reads as a
    // fabric swatch, which is what the first crop of this looked like.
    objectPosition: '62% center',
  },
  {
    label: 'Outdoor',
    category: 'outdoor',
    image: '/images/categories/outdoor.jpg',
    // Centred, which lands the open door, the deck, the balustrade and the tree
    // in the middle of a portrait crop.
    objectPosition: '50% center',
  },
  {
    label: 'Wardrobes',
    category: 'wardrobes',
    image: '/images/categories/wardrobes.jpg',
    objectPosition: '54% center',
  },
];

export function CategoryGrid() {
  const isMobile = useIsMobile();

  return (
    <section style={{ background: tokens.warmWhite }}>
      {/* The white band. Louder than it was — the heading is up around section
          size now, because at 36px it read as a caption and got lost between a
          full-bleed video and three full-bleed photographs. Still a band rather
          than a section: the padding stays well short of the 120px the real
          sections get. */}
      <div
        style={{
          padding: isMobile ? '52px 24px' : '76px 80px',
          textAlign: 'center',
        }}
      >
        <p style={{ ...eyebrow, marginBottom: 16 }}>Shop by category</p>
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: 'clamp(34px, 4.4vw, 56px)',
            fontWeight: 300,
            lineHeight: 1.05,
            color: tokens.ink,
            margin: 0,
          }}
        >
          Start with category.
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          // Zero. The three photographs meet with nothing between them; any gap
          // turns a wall of categories into three cards.
          gap: 0,
        }}
      >
        {CATEGORIES.map(category => (
          <PhotoTile
            key={category.category}
            to={`/products?category=${category.category}`}
            label={category.label}
            image={category.image}
            objectPosition={category.objectPosition}
            // Tall. Three portraits across 1440 give each tile ~480 of width, so
            // 660 of height is roughly 3:4 — and a good deal bigger than the 440
            // the four room tiles had.
            minHeight={isMobile ? 440 : 660}
            labelSize="clamp(28px, 3vw, 40px)"
          />
        ))}
      </div>
    </section>
  );
}
