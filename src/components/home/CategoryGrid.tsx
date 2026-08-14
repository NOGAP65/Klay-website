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
import { CATEGORIES } from '../../data/categories';
import { PhotoTile, SectionBand, TILE_GAP } from './primitives';

// The three tiles come from the category data now rather than being written out
// here, so a tile, its page and the nav dropdown cannot disagree about what a
// category is called or what is in it.
//
// ON THE CTA. "Shop Now", not the "Buy Now" these carried while they pointed at a
// resolver. Each tile now opens a real category page — a listing, which is a
// place you shop rather than a checkout — and every one of the three genuinely
// leads somewhere, which is what the earlier label could not honestly claim for
// Outdoor and Wardrobes. Buy Now still appears on the tiles and the visualiser
// that actually take money.
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
          // A hairline of the section's own warm white, not zero. Butted together
          // these three read as one wide photograph with three captions on it —
          // the join between Indoor and Outdoor was especially bad, both pale
          // curtain frames meeting with nothing to separate them. See TILE_GAP.
          gap: TILE_GAP,
        }}
      >
        {CATEGORIES.map(category => (
          <PhotoTile
            key={category.slug}
            to={`/${category.slug}`}
            label={category.name}
            image={category.image}
            objectPosition={category.objectPosition}
            blurb={category.blurb}
            cta="Shop Now"
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
