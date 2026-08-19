// ---------------------------------------------------------------------------
// THE LISTING CARD — now the same object as the homepage's range tile.
//
// It used to be its own design: a photograph with a block of type underneath it
// and a gold bar at the bottom. That was built against Kookai and Allbirds and
// it was a decent card, but it meant the site had TWO card designs — one on the
// homepage's Our Range row and a different one in the shop — and a visitor
// moving between them met the same six ranges wearing different clothes.
//
// So this delegates to PhotoTile. Everything sits on the photograph: the name
// in Cormorant italic bottom-left, the price under it in gold, the colour row
// under that, and a gold SHOP NOW chip. Same hover as the homepage — the image
// pushes in, the whole tile darkens, the label block lifts, the chip pops
// forward and lightens.
//
// THE CHIP IS ALWAYS VISIBLE, which is PhotoTile's own rule and the reason it
// suits this page: a photograph with a word on it is not obviously clickable,
// the push-in alone is too subtle to carry that, and a hover-only action does
// not exist at all on a touch screen.
//
// What this file is now is the ADAPTER — it turns a catalogue item's vocabulary
// (priceFrom, eyebrow, tagline, glyph) into PhotoTile's (note, blurb, label).
// The design lives in one place; the mapping lives here.
// ---------------------------------------------------------------------------

import { type as typeScale } from '../theme';
import { PhotoTile } from './home/primitives';

export interface Swatch {
  name: string;
  hex: string;
}

export interface ProductCardProps {
  /** Where the whole tile goes. */
  to: string;
  name: string;
  /** The range or the fabric. Not rendered as its own line any more — over a
   * photograph a fourth stacked string is one too many, and the name plus the
   * price carry the identification. Kept in the props because it is still the
   * image's alt text, which is where it does real work. */
  eyebrow: string;
  /** One supporting line under the name. */
  tagline?: string;
  /** Present only where the item is genuinely priced. Without it the tile says
   * PRICE ON MEASURE, which is the honest state for everything Klay makes to
   * measure and has never had a price grid for. */
  priceFrom?: number;
  image?: string;
  imagePosition?: string;
  /** ProductGlyph key, drawn on the charcoal of a photoless tile. */
  glyph?: string;
  colours?: Swatch[];
  /** Tile height. The shop and the blind pages run different column counts, so
   * the height comes from the caller rather than being fixed here. */
  minHeight?: number;
}

export function ProductCard({
  to,
  name,
  eyebrow,
  tagline,
  priceFrom,
  image,
  imagePosition,
  glyph,
  colours,
  minHeight = 420,
}: ProductCardProps) {
  return (
    <PhotoTile
      to={to}
      label={name}
      image={image}
      objectPosition={imagePosition}
      minHeight={minHeight}
      // Smaller than the homepage row's default. These tiles are narrower and
      // carry more under the label — a price, sometimes a swatch row — so a
      // 32px name crowds everything below it.
      labelSize={`${typeScale.card.fontSize}px`}
      // The buyable/enquiry distinction, in the one line that was always gold.
      // No "From": the figure is already the cheapest configuration of a
      // made-to-measure product.
      note={priceFrom !== undefined ? `$${priceFrom}` : 'Price on measure'}
      blurb={colours ? undefined : tagline}
      // Uniform wording by decision. Per-card labelling ("Enquire" where there
      // is no price) was tried and overruled in favour of one consistent
      // action; sixteen of these still resolve to the enquiry form, and the fix
      // for that is price grids and product pages rather than a softer label.
      cta="Shop Now"
      // Stacked under the label rather than beside it: these columns are narrow
      // enough that a chip taking its share off the right puts a name like
      // "Straight Drop Awnings" onto three lines.
      ctaBelow
      // The label block here is four elements deep — name, price, sometimes a
      // swatch row, then the chip — so it reaches well up the photograph. The
      // default ramp puts its weight in the last fifteen percent and left "Veil"
      // and "$220" almost invisible on the pale roller frames.
      scrim="deep"
      glyph={glyph}
      colours={colours}
      alt={`${name} — ${eyebrow}`}
    />
  );
}
