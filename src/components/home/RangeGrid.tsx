// ---------------------------------------------------------------------------
// Our Range — a 3x3 of product types, edge to edge, under the same band as the
// category grid.
//
// It shows TYPES now, not the four individual roller-blind SKUs it showed
// before. That is the right unit for a section called "Our Range": the question
// it answers is "what does Klay make?", and four variations of one roller blind
// answered a narrower question than the customer was asking.
//
// Nine tiles, because that is what closes a three-column grid without holes. The
// eleven subcategories in data/categories.ts become nine by folding the three
// wardrobe door types (sliding, hinged, walk-in) into one Wardrobes tile — they
// are one purchase with three configurations, not three ranges.
//
// ON THE PHOTOLESS TILES. Only four of the nine have a photograph in the
// repository: roller blinds, sheer curtains, blockout curtains, wardrobes. There
// is no Venetian, Roman, vertical, panel or lined-curtain imagery anywhere, and
// putting a roller blind behind the word "Venetian" would be a straight
// misrepresentation of a product — worse than the kitchen that was captioned
// "Home Office". Those five render as charcoal tiles with a hairline and a gold
// COMING SOON, which is also the truth: data/categories.ts marks every one of
// them available:false.
//
// So the grid doubles as the roadmap. When photography and pricing arrive for a
// type, it gains an `image` and its note becomes a from-price, and nothing else
// about this file changes.
// ---------------------------------------------------------------------------

import { tokens, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PRODUCTS } from '../../data/products';
import { CATEGORIES } from '../../data/categories';
import { CtaLink, PhotoTile, SectionBand } from './primitives';

/** The cheapest thing Klay actually sells, taken from the catalogue rather than
 * written down again — the roller tile's from-price has to move when the
 * catalogue does. */
const ROLLER_FROM = Math.min(...PRODUCTS.map(p => p.priceFrom));

/** Subcategory slug -> its tagline, flattened out of CATEGORIES. The photoless
 * tiles carry these, and they are already written down there — retyping them
 * here would be two copies of the same sentence drifting apart. */
const TAGLINES: Record<string, string> = Object.fromEntries(
  CATEGORIES.flatMap(c => c.subcategories.map(s => [s.slug, s.tagline])),
);

const SOON = 'Coming soon';

interface RangeTile {
  label: string;
  /** Resolved by ProductsPage. */
  category: string;
  image?: string;
  objectPosition?: string;
  note: string;
}

// Ordered so the four photographs interleave with the five charcoal tiles rather
// than clumping into a photo half and an empty half.
const TILES: RangeTile[] = [
  {
    label: 'Roller Blinds',
    category: 'roller-blinds',
    image: '/images/lifestyle/room-kitchen.png',
    objectPosition: 'center 32%',
    note: `From $${ROLLER_FROM}`,
  },
  { label: 'Venetian Blinds', category: 'venetian-blinds', note: SOON },
  {
    label: 'Sheer Curtains',
    category: 'sheer-curtains',
    image: '/images/range/sheer-curtains.jpg',
    objectPosition: '46% center',
    note: 'From $360',
  },
  { label: 'Roman Blinds', category: 'roman-blinds', note: SOON },
  {
    label: 'Wardrobes',
    category: 'wardrobes',
    // A different frame from the one on the category tile above. Same wardrobe,
    // other angle — the same photograph twice on one page, both captioned
    // "Wardrobes", would read as a mistake.
    image: '/images/range/wardrobes.jpg',
    objectPosition: '40% center',
    note: SOON,
  },
  { label: 'Vertical Blinds', category: 'vertical-blinds', note: SOON },
  {
    label: 'Blockout Curtains',
    category: 'blockout-curtains',
    image: '/images/curtains-room.jpg',
    objectPosition: '76% center',
    note: 'From $320',
  },
  { label: 'Panel Blinds', category: 'panel-blinds', note: SOON },
  { label: 'Lined Curtains', category: 'lined-curtains', note: SOON },
];

export function RangeGrid() {
  const isMobile = useIsMobile();

  return (
    <section style={{ background: tokens.warmWhite }}>
      {/* Same band as the category grid, from the same component. */}
      <SectionBand label="The collection" title="Our Range" isMobile={isMobile} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 0,
        }}
      >
        {TILES.map(tile => (
          <PhotoTile
            key={tile.category}
            to={`/products?category=${tile.category}`}
            label={tile.label}
            image={tile.image}
            objectPosition={tile.objectPosition}
            note={tile.note}
            // Only where there is no photograph. On the four that have one, the
            // picture already says what the tagline would, and a 420px tile does
            // not have the room for both.
            blurb={tile.image ? undefined : TAGLINES[tile.category]}
            // Shorter than the category tiles. Three rows of 660 would be two
            // and a half screens of grid on its own.
            minHeight={isMobile ? 300 : 420}
            labelSize="clamp(24px, 2.4vw, 32px)"
          />
        ))}
      </div>

      <div
        style={{
          textAlign: 'center',
          padding: isMobile ? '52px 24px' : '72px 80px',
          maxWidth: layout.containerMax,
          margin: '0 auto',
        }}
      >
        <CtaLink to="/products">View All Products</CtaLink>
      </div>
    </section>
  );
}
