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

import { tokens } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PhotoTile, SectionBand } from './primitives';

// ON THE CTA. One label on all three — "Buy Now" — by explicit direction, after
// I'd shipped it reading "Enquire" on the two categories that cannot be bought
// yet and raised that. Recording the consequence rather than re-arguing it:
// Indoor lands on the roller-blind listing and is a genuine buy, while Outdoor
// and Wardrobes still resolve to the enquiry form, so on those two the button
// promises a checkout and delivers a form.
//
// For a made-to-measure business that is a defensible way to run it — everything
// here ends in a conversation with a technician anyway. It stops being a
// mismatch at all the moment those two categories get somewhere to be sold, and
// the destinations live in ProductsPage, not here.
const CATEGORIES = [
  {
    label: 'Indoor',
    blurb: 'Blinds, sheers and drapes',
    cta: 'Buy Now',
    category: 'indoor',
    image: '/images/categories/indoor.jpg',
    // Biased right so the bed, lamp and nightstand come into the crop with the
    // curtains. A furnished room reads as "indoor"; a wall of cloth reads as a
    // fabric swatch, which is what the first crop of this looked like.
    objectPosition: '62% center',
  },
  {
    label: 'Outdoor',
    blurb: 'Patio, deck and alfresco',
    cta: 'Buy Now',
    category: 'outdoor',
    image: '/images/categories/outdoor.jpg',
    // Centred, which lands the open door, the deck, the balustrade and the tree
    // in the middle of a portrait crop.
    objectPosition: '50% center',
  },
  {
    label: 'Wardrobes',
    blurb: 'Built-in and walk-in',
    cta: 'Buy Now',
    category: 'wardrobes',
    image: '/images/categories/wardrobes.jpg',
    objectPosition: '54% center',
  },
];

export function CategoryGrid() {
  const isMobile = useIsMobile();

  return (
    <section style={{ background: tokens.warmWhite }}>
      {/* The white band, shared with the range grid — see SectionBand. Its
          heading is well up on section size because at 36px it read as a caption
          and got lost between a full-bleed video and three full-bleed
          photographs. Still a band rather than a section: the padding stays well
          short of the 120px the real sections get. */}
      <SectionBand label="Shop by category" title="Start with category." isMobile={isMobile} />

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
            blurb={category.blurb}
            cta={category.cta}
            // Tall. Three portraits across 1440 give each tile ~480 of width, so
            // 660 of height is roughly 3:4 — and a good deal bigger than the 440
            // the four room tiles had.
            minHeight={isMobile ? 440 : 660}
            labelSize="clamp(28px, 3vw, 40px)"
          />
        ))}
      </div>
      {/* Nothing after the tiles. The section ends on the photographs so the
          charcoal band below butts straight up against them — the two read as one
          continuous block rather than as two sections with a strip of warm white
          between them. The Book a Free Measure button that used to sit here was
          what created that strip, and every tile now carries its own action
          anyway. */}
    </section>
  );
}
