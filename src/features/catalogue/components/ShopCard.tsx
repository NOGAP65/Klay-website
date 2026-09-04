// ---------------------------------------------------------------------------
// A SHOP CARD THAT OPENS INTO ITS OWN CONFIGURATOR.
//
// The homepage's Bestsellers row does this for four products and it is the best
// thing on the site: click Shop Now and the card widens, the configurator
// arrives BESIDE the photograph, and you specify the thing while looking at it.
// The shop page listed all fourteen and did none of it — every card was a link
// out to a detail page or a contact form, so the one place a customer goes to
// choose was the one place they could not.
//
// IT IS THE BESTSELLERS CARD, not the shop tile with a button bolted on. The
// first pass reused ProductCard, which is a photograph with everything printed
// ON it — name, tagline, price and a chip, over a darkening ramp. That reads at
// 480px wide on a category page and it does not read at 290 in a grid with a
// filter rail beside it: four strings and a scrim over a picture you can no
// longer see. The card below is the row's own stack — clean photograph, group
// line, name, one action underneath — where the picture is the whole top of the
// card and nothing is written across it.
//
// SO THE OPEN CARD SPANS TWO COLUMNS. The row could widen a card because it had
// slots either side and a scroller to absorb the overflow; a grid has neither,
// and a card that grew sideways would push its neighbours out of their columns.
// A spanning grid item gets the same result with the grid's own reflow doing
// the work — picture left, controls right, both on screen together, which is
// the whole point. Choosing Forest Green has to repaint something you can see.
//
// ONE AT A TIME, held by the page rather than the card, because "close the
// other one" is a decision only something that can see both can make.
//
// BELOW THE NARROW BREAKPOINT IT STACKS. At two columns across there is no
// second column to give the panel, so the open card spans the full row and the
// configurator sits under the photograph — the same concession the row makes on
// a phone, for the same reason.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';

import { useIsMobile } from '@/shared';

import { radius, tokens, motion, space, type as typeScale, useHover } from '@/ds';

import { type Selection } from '../configOptions';
import { fabricShot, FABRIC_SHOT_DIR } from '../fabricShots';
// Relative, like the feature's other three importers of this file — see the
// note at its head on why it has not moved.
import { HARDWARE_HEX } from '../../../data/products';
import type { CatalogueItem } from '../constants';

import { ProductGlyph } from './ProductGlyph';
import { RangeConfigurator } from './RangeConfigurator';

export interface ShopCardProps {
  item: CatalogueItem;
  sel: Selection;
  onChange: (fieldId: string, choiceId: string) => void;

}

/** How long the box takes to open, and to shut.
 *
 * SHUTTING IS FASTER, and it has to be: the page holds the card open for
 * CLOSE_MS while the panel fades and then unmounts it, so a shrink longer than
 * that gets cut off partway through and replaced by a card already at its closed
 * width — a jump, in the middle of the animation that exists to remove one. The
 * two numbers are the same number because they have to be.
 *
 * It is also how it should feel. An opening is something you are waiting to see;
 * a closing is something you have finished with. */
export const OPEN_MS = 360;
export const CLOSE_MS = 210;

/** What the cards moving out of the way get, which is longer than the box.
 *
 * They are not racing the box — they are getting out of its way, and a card that
 * wraps to the next row travels two legs and most of the grid's width to do it.
 * At the box's own duration that read as a snap. */
export const TRAVEL_MS = 440;

/** The gap between one card leaving and the next.
 *
 * This is the whole difference between a row of cards rearranging and a row of
 * cards flowing. Every card leaving on the same frame is a single event with no
 * direction in it; a beat apart and the displacement travels through the grid,
 * away from the card that opened and back toward it when it shuts. */
export const STAGGER_MS = 30;

/** The longest the wave may take to cross the whole grid.
 *
 * STAGGER_MS is right for the few cards a customer can see at once, but the
 * range is thirteen movers and a filtered grid is a different length again — so
 * left alone, the same click would run for near enough a second on the full shop
 * and a third of that on a narrowed one. The gap shrinks to fit this instead:
 * the order is kept, the duration is not the grid's length.
 *
 * 90, down from 170. At 170 the grid was still rearranging after the box had
 * finished opening, which is two events; at 90 it is one motion with a lead,
 * which is what a stagger is for. */
export const STAGGER_SPAN_MS = 90;

/** THE GRID'S OWN TWO NUMBERS, and they live here rather than on the page
 * because the card does arithmetic with them: it pins itself to one column and
 * its panel to the other plus the gap the span swallows. The page lays the grid
 * out from the same two, so the tracks the browser draws and the widths the
 * card pins to cannot disagree.
 *
 * 480, because the card is now a photograph AND a column of questions beside
 * it — about half a page each. Ella, which this is measured against, runs 677 in
 * a 1400 container; 480 puts two on our 1200 grid (1440 less the 200px rail) and
 * drops to one below that, which is what a phone wants regardless.
 *
 * It was 340 when the card was a photograph with a name under it, and 270 before
 * the picture was made the point of it. */
export const COLUMN_MIN = 480;
/** The gutter, and it widened when the cards lost their frames.
 *
 * 20 was set while every card carried a border, a radius and a shadow — three
 * things stating where one product stopped and the next began. With those gone
 * the gap is the only separator left, and two photographs 20px apart read as one
 * strip. Monday runs 30 between tiles that likewise have no frame; 28 keeps four
 * columns on a 1440 viewport, which 30 would not. */
export const COLUMN_GAP = 28;

/** One grid column in pixels, from the grid's own width.
 *
 * COMPUTED, NOT MEASURED. Reading it off a sibling has a race in it: opening a
 * card changes which items sit where, and a measurement taken mid-transition
 * returns a number between one column and two. auto-fill's rule is
 * deterministic — as many minmax(COLUMN_MIN, 1fr) tracks as fit with the gaps
 * between them — so running the same arithmetic the browser runs gives the
 * answer with no window to be wrong in. Verified against the live grid: this
 * returns 353.33 where the browser's tracks measure 353.328px. */
export const columnWidth = (gridWidth: number): number => {
  const cols = Math.max(1, Math.floor((gridWidth + COLUMN_GAP) / (COLUMN_MIN + COLUMN_GAP)));
  return (gridWidth - (cols - 1) * COLUMN_GAP) / cols;
};

/** THE THREE THINGS TRUE OF EVERY PRODUCT, and they fill the space capping the
 * picture at 3:4 leaves under it.
 *
 * Not filler: each is already claimed elsewhere on the site — the warranty on
 * How It Works, the installation in the pricing breakdown, the coverage in
 * config/site — and together they answer what a customer wonders while looking
 * at a price. Who fits it, what happens if it breaks, where it is made.
 *
 * Ella puts the same three in the same place, which is what suggested it. */
const ASSURANCES = [
  'Professional installation included',
  '5-year warranty',
  'Made to measure in Melbourne',
];

/** THE COLOUR A DYED SHOT IS MULTIPLIED BY.
 *
 * The swatch's own hex, straight from the catalogue — the photograph has already
 * been normalised so that multiplying by it lands on the right cloth. White
 * where nothing is chosen, which is a no-op and leaves the fabric as shot. */
const dyeColour = (item: CatalogueItem, sel: Selection): string =>
  item.colours?.find(c => c.name === sel.colour)?.hex ?? '#FFFFFF';

/** THE COLOUR THE HEADRAIL AND BOTTOM BAR ARE PAINTED. The same three the
 * visualiser uses, so a blind specified here and a blind specified there are the
 * same blind. Chrome where nothing is chosen, which is what the photographs were
 * taken with. */
const hardwareColour = (sel: Selection): string =>
  HARDWARE_HEX[sel.hardware as keyof typeof HARDWARE_HEX] ?? HARDWARE_HEX.chrome;

export function ShopCard({ item, sel, onChange }: ShopCardProps) {
  // SIDE BY SIDE IS A DESKTOP IDEA. At 375px the row gave the photograph 190px
  // and the questions 190px and neither worked — chips wrapped one per line and
  // the picture was a postage stamp. Under the phone breakpoint the two columns
  // become two rows.
  const stacked = useIsMobile();
  const { isHovered, bind } = useHover();

  /** THE PHOTOGRAPH FOR THIS CONFIGURATION, where one has been taken. Looked up
   * in the generated manifest rather than assembled from a template — see
   * fabricShots.ts, and the specification's note on why a constructed asset path
   * is unauditable. */
  const shot = fabricShot(item.id, sel.variant);
  const lit = isHovered;

  return (
    <article
      {...bind}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
        // THE EDGE COMES BACK, and Ella is why. It went when the photograph WAS
        // the card and a frame round it was a line drawn between the customer
        // and the product. A card that also holds a column of controls is a
        // different object: two of them per row, side by side, and without an
        // edge one card's questions read as the next one's.
        background: tokens.card,
        border: `1px solid ${lit ? tokens.lineStrong : tokens.lineFaint}`,
        borderRadius: radius.lg,
        padding: space.item,
        transition: `${motion.card}, border-color 0.3s ease`,
        // NO CARD AT ALL WHEN CLOSED — no background, no border, no radius, no
        // padding, no shadow. That is not a stylistic preference, it is what
        // both reference sites measure: mondayhaircare and kookai both report
        // background rgba(0, 0, 0, 0), border 0px, radius 0px, shadow none on
        // the repeating product tile. We had every one of them, and each was a
        // line drawn AROUND the product rather than a way of showing it.
        //
        // The photograph is the card now. The hover signal moves onto the
        // picture, which already scales and warms — a lift needs something to
        // lift, and there is no longer a plate under the image to raise.
      }}
    >
      {/* THE HEAD, spanning both columns. Stacked, the name sat between the
          picture and the questions and read as a caption on the photograph;
          across the top it does a name's job — says what this whole card is
          about before either column starts.

          The link is a real one: on the shop, unlike the homepage, a product
          page is somewhere a customer might actually want to go. */}
      <Link
        to={item.to}
        style={{ display: 'block', textDecoration: 'none', flex: '0 0 auto', marginBottom: space.snug }}
      >
        <div
          style={{
            fontFamily: tokens.body,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: tokens.inkSoft,
          }}
        >
          {item.group}
        </div>
        <h3 style={{ ...typeScale.card, color: tokens.ink, marginTop: 2 }}>{item.name}</h3>
        {item.tagline && (
          <p
            style={{
              ...typeScale.micro,
              letterSpacing: 'normal',
              textTransform: 'none',
              color: tokens.inkSoft,
              margin: `${space.tight}px 0 0`,
            }}
          >
            {item.tagline}
          </p>
        )}
      </Link>

      {/* THE TWO COLUMNS. */}
      <div
        style={{
          display: 'flex',
          flexDirection: stacked ? 'column' : 'row',
          gap: space.item,
          flex: '1 1 auto',
          minHeight: 0,
          alignItems: 'stretch',
        }}
      >
        <Link
          to={item.to}
          style={{
            textDecoration: 'none',
            // Half the card each on a desktop. Stacked, the picture takes the
            // full width and its own ratio decides its height.
            flex: stacked ? '0 0 auto' : '1 1 50%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: radius.md,
            // 4:5, AND THIS IS THE SINGLE BIGGEST REASON THE PRODUCTS NOW
            // READ. At 5:4 the picture was 343x275 in a 434 card — under two
            // thirds of it — where monday measures 347x499 in 688 and kookai
            // 295x443 in 511. Portrait, at 73% and 87%. Ours was landscape at
            // 63%, which is a photograph illustrating a card instead of a
            // photograph being one. 4:5 takes it to 429px tall: 1.6x the image
            // area in the same column, and the same share of the card monday
            // gives it.
            //
            // THE OLD NOTE HERE ARGUED 5:4 ON TWO GROUNDS, and both need
            // answering rather than ignoring. It said 4:5 ran a card near 700
            // tall — but that was arithmetic on a 390-wide card, and COLUMN_MIN
            // has been 340 since, so the card lands at 588, between the two
            // references. It also said landscape is truer to photographs of
            // rooms, which is real: the crop is why this is 4:5 and not the 0.70
            // and 0.67 the references run. A moderate portrait keeps the window
            // in frame — and objectPosition is per item for the few where the
            // subject sits off centre.
            // NO RATIO AT ALL — IT FILLS THE COLUMN. A fixed one in a column
            // whose height is set by the questions beside it means the picture
            // stops wherever the ratio says and the rest of the column is
            // nothing; the last pass left a third of the left side empty. Taking
            // the height from the card removes the dead space AND makes the
            // photograph the biggest thing on the card again, which is where
            // this started.
            //
            // The crop rules do the rest: cover, anchored high, so a room stays
            // a room whatever shape the column turns out to be.
            // IT FILLS THE COLUMN BUT MAY NOT BECOME A SLIVER. Filling alone
            // meant the height came from the questions beside it, and six of
            // them make a column 500px tall — so a photograph 217 wide came out
            // at 0.41, a letterbox stood on its end. A kitchen does not survive
            // that: the blind ends up a strip at the top with a metre of
            // benchtop under it.
            //
            // 3:4 is the tallest it may go. Past that the height goes to white
            // space under the picture instead of into the crop — which is what
            // Ella does, its picture 400x290 in a 478 card with the column below
            // it simply empty. A photograph that fits badly is worse than a card
            // with room in it.
            //
            // Stacked, it is a landscape band across the full width instead.
            // `flex: 1 1 auto` AND an aspect ratio is a contradiction, and flex
            // wins: the picture stretched to the column and the ratio was
            // ignored, which is how it came out at 0.51 with the cap supposedly
            // applied. It is `0 0 auto` and a ratio, full stop — the height
            // comes from the width, and whatever the questions beside it need
            // beyond that is white space under the photograph rather than a
            // deeper crop.
            width: '100%',
            flex: '0 0 auto',
            aspectRatio: stacked ? '4 / 3' : '3 / 4',
            // KEEPS THE MULTIPLY INSIDE THE FRAME. Without it the dye layer
            // composites against whatever is painted beneath — the card, the
            // grid, the page — and one blind would tint the card beside it.
            isolation: 'isolate',
            // A MISSING PHOTOGRAPH IS AN EMPTY FRAME, NOT A BLACK ONE. On the
            // old landscape tile the charcoal fallback was a smallish dark
            // rectangle; at 4:5 it is 435px tall and was out-shouting every
            // product that does have a picture. The band is the page's own
            // quiet grey, so a gap in the photography now reads as a gap.
            background: tokens.band,
          }}
        >
          {shot || item.image ? (
            <img
              src={shot ? `${FABRIC_SHOT_DIR}/${shot.file}` : item.image}
              alt={`${item.name} — ${item.group}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                // NOT 'center'. A room cropped to 4:5 about its middle lands
                // on the floor, and every product here — blinds, curtains,
                // shutters, awnings — hangs high on a wall. 35% keeps the
                // window in frame. Per-item imagePosition still wins, which is
                // what that field is for.
                // Back toward the middle with the crop: 35% was pulling the
                // frame up to keep a window in a TALL crop. A landscape one is
                // already looking at the top half of the room.
                objectPosition: item.imagePosition ?? '50% 45%',
                display: 'block',
                transform: lit ? 'scale(1.04)' : 'scale(1)',
                filter: lit
                  ? 'saturate(1.12) contrast(1.06) brightness(1.02)'
                  : 'saturate(1.04) contrast(1.03)',
                transition: 'transform 0.7s ease, filter 0.5s ease',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: space.item,
                border: `1px solid ${tokens.lineFaint}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ProductGlyph type={item.glyph ?? ''} size={140} color={tokens.inkSoft} ground={tokens.band} opacity={lit ? 0.75 : 0.55} />
            </div>
          )}
          {/* THE DYE. A flat colour multiplied through the blind's own mask,
              over a photograph whose fabric has been normalised to white — which
              between them ARE dyed cloth, because multiplying is what dyeing
              does. The weave, the folds and the falloff all survive as
              proportions of the colour.

              Only where the shot carries a mask: timber is timber-coloured and
              has nothing to dye. */}
          {shot?.mask && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background: dyeColour(item, sel),
                mixBlendMode: 'multiply',
                // A SHEER TAKES LESS DYE THAN A BLOCKOUT, and at full strength
                // the fabric row appeared to do nothing on exactly the colours
                // where it matters most: Black blockout and Black sheer landed
                // on the same near-black, when in a real window one is opaque
                // and the other is mostly daylight. The photograph underneath
                // shows through in proportion — see `dye` in fabricShots.
                opacity: shot.dye,
                WebkitMaskImage: `url(${FABRIC_SHOT_DIR}/${shot.mask})`,
                maskImage: `url(${FABRIC_SHOT_DIR}/${shot.mask})`,
                WebkitMaskSize: 'cover',
                maskSize: 'cover',
                WebkitMaskPosition: item.imagePosition ?? '50% 45%',
                maskPosition: item.imagePosition ?? '50% 45%',
                pointerEvents: 'none',
                // The picture scales under the pointer; the dye has to scale
                // with it or the colour slides off the cloth.
                transform: lit ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 0.7s ease, background 0.25s ease',
              }}
            />
          )}

          {/* THE HARDWARE, PAINTED RATHER THAN DYED — and the distinction is
              real. Cloth is dyed, so the colour goes through the weave and
              multiply is right. Metal is anodised or powder-coated: the surface
              IS the colour, and a highlight on chrome is not a lighter chrome,
              it is a reflection. So this paints the swatch at full strength and
              a soft-light pass puts the original's specular back over it, which
              keeps the tube reading as a tube. */}
          {shot?.hardware && (
            <>
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: hardwareColour(sel),
                  WebkitMaskImage: `url(${FABRIC_SHOT_DIR}/${shot.hardware})`,
                  maskImage: `url(${FABRIC_SHOT_DIR}/${shot.hardware})`,
                  WebkitMaskSize: 'cover',
                  maskSize: 'cover',
                  WebkitMaskPosition: item.imagePosition ?? '50% 45%',
                  maskPosition: item.imagePosition ?? '50% 45%',
                  pointerEvents: 'none',
                  transform: lit ? 'scale(1.04)' : 'scale(1)',
                  transition: 'transform 0.7s ease, background 0.25s ease',
                }}
              />
              {/* The specular, back on top. Without it a chrome tube is a flat
                  grey rectangle and the blind stops looking photographed. */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${FABRIC_SHOT_DIR}/${shot.file})`,
                  backgroundSize: 'cover',
                  backgroundPosition: item.imagePosition ?? '50% 45%',
                  mixBlendMode: 'soft-light',
                  // 0.4, NOT 0.85. The headrail photographs as bright chrome, so
                  // soft-lighting it over a dark swatch lifts the dark badly:
                  // at 0.85, Black (#303030, rgb 48) rendered at rgb 99 — grey,
                  // not black, and barely separable from chrome. This is enough
                  // to keep the tube's roundness without the colour losing.
                  opacity: 0.4,
                  WebkitMaskImage: `url(${FABRIC_SHOT_DIR}/${shot.hardware})`,
                  maskImage: `url(${FABRIC_SHOT_DIR}/${shot.hardware})`,
                  WebkitMaskSize: 'cover',
                  maskSize: 'cover',
                  WebkitMaskPosition: item.imagePosition ?? '50% 45%',
                  maskPosition: item.imagePosition ?? '50% 45%',
                  pointerEvents: 'none',
                  transform: lit ? 'scale(1.04)' : 'scale(1)',
                  transition: 'transform 0.7s ease',
                }}
              />
            </>
          )}

          {/* NO SCRIM. The vignette existed to give the photograph an edge
              against the white card behind it; there is no card behind it now,
              so all it did was put up to a fifth of ink over the product. Both
              references darken their product shots by nothing at all. */}
        </div>

        {/* THE NAME IS NOT HERE ANY MORE — it moved to the head of the card,
            above both columns. Under the picture it read as a caption on the
            photograph; across the top it says which product the whole card is
            about, which is a name's job.

            WHAT IS HERE INSTEAD fills the space the 3:4 cap leaves under the
            photograph — see ASSURANCES. Stacked there is no such space, so they
            run as one line under the picture rather than a stack beside the
            questions. */}
          <div
            style={{
              marginTop: space.snug,
              display: 'flex',
              flexDirection: stacked ? 'row' : 'column',
              flexWrap: 'wrap',
              gap: stacked ? `0 ${space.snug}px` : space.hairline,
            }}
          >
            {ASSURANCES.map(a => (
              <span
                key={a}
                style={{
                  ...typeScale.micro,
                  letterSpacing: 'normal',
                  textTransform: 'none',
                  color: tokens.inkSoft,
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </Link>

        {/* THE QUESTIONS, in the other column. It fills the height the
            photograph set, and pushes its own price and Add to cart to the
            bottom of it — so every card in a row ends on one line whatever it
            asks. */}
        <div style={{ flex: stacked ? '1 1 auto' : '1 1 50%', minWidth: 0, display: 'flex', minHeight: 0 }}>
          <RangeConfigurator item={item} sel={sel} onChange={onChange} dense />
        </div>
      </div>
    </article>
  );
}
