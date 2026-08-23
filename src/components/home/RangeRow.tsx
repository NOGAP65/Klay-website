// ---------------------------------------------------------------------------
// 4. Our Range — FOUR HERO PRODUCTS, AND THE PICTURES ARE THE ONLY LOUD THING.
//
// FOUR HERO PRODUCTS, ONE PER PART OF THE BUSINESS: a roller blind, a curtain, a
// wardrobe, a folding arm awning. Indoor hard furnishing, indoor soft furnishing,
// joinery, outdoor. Four fits one row at the width the references use — MONDAY,
// Sixpenny and HAY are all four-up between 310 and 335 — so at rest the row holds
// exactly four cards, has nothing off-screen and needs no arrows.
//
// The other ten products have their own section further down the page. See
// FullRange: this row SELLS four things, that strip LISTS the rest.
//
// ---------------------------------------------------------------------------
// WHAT WENT WRONG TWICE BEFORE, because it explains every decision below.
//
// The brief was MONDAY Haircare: their products sit almost inside the page and
// the attention goes entirely to the product. Two attempts were made to buy that
// by TREATING THE CARD — first a bounded white card with a hairline, a resting
// shadow, a hover lift and a row spotlight; then the same card in charcoal, as a
// dark mount, to make it pull without a pointer. The second looked bad and the
// first only worked under a pointer.
//
// Both failed the same way: they added furniture around the problem instead of
// fixing it. The dark mount was the clearest case — it made the photograph
// SMALLER, 309px to 285, and put a heavy competing surface round it, when the
// entire goal was more product and less of everything else.
//
// THE ACTUAL PROBLEM WAS THE PICTURES, and it is worth stating plainly because it
// is invisible until you open the source files. These were not product
// photographs. They were room photographs in which the product was a minority of
// the frame:
//
//   room-kitchen.png is a wide kitchen. The roller blinds are a band across the
//     top, about 30% of the image; the rest is a marble island, cabinetry, stools.
//
//   folding-arm-awnings.webp is a patio. The awning is the top 40%. The bottom
//     60% is a dining table and eight chairs — so cropped on centre, that card
//     was mostly FURNITURE, which is why it read as outdoor dining.
//
//   indoor.jpg is a bedroom whose left 60% is pure sheer and drape, full height,
//     and it was cropped at `62% center` — which lands on the BED.
//
// MONDAY's focus does not come from their card treatment. It comes from the
// bottle filling the frame with nothing else in it. No border, mount, shadow,
// vignette or spotlight can make a room shot read as a product shot.
//
// ---------------------------------------------------------------------------
// SO: CROP IN, AND TAKE THE FURNITURE AWAY.
//
//   THE CROPS ARE TIGHT AND THEY ARE LOCAL. Every hero is framed onto its own
//     product — see HERO_CROP, which is the most important thing in this file.
//
//   THERE IS NO CARD. No box, no background, no border, no radius on anything but
//     the picture, no shadow. The photograph sits on the section's own ground with
//     the group line and the name under it, which is MONDAY's card exactly and is
//     also what the install strip lower down the page already does.
//
//   THERE IS NO GOLD BUTTON. Four saturated gold bars were the most chromatic
//     thing in the section by a distance — louder than any of the photographs,
//     and repeated four times, so gold had no focal power left either. MONDAY's
//     cards carry no button at all. The whole card is the control now, and the
//     only thing under the name is a small caps text label with a rule under it.
//     Gold appears ONCE in the section, on Shop All, and again inside an open
//     configurator where it is a real commitment.
//
//   THE PICTURES GET THE SPACE THE FURNITURE GAVE BACK. Removing a 52px button
//     and a 12px mount from every card returns 64px of vertical and 24px of
//     horizontal to the photographs at no cost to the section's height.
//
// WHAT SURVIVED FROM THE PREVIOUS ROUNDS, because it was never the problem: the
// sideways expansion, the vignette (lighter now — a tight crop needs less help
// than a wide one), the shared photographic grade, and the row spotlight. The
// spotlight is the one device here that needs a pointer, so it is a bonus rather
// than the mechanism.
//
// ONE THING THIS COSTS, stated so it is a decision rather than an oversight: the
// card no longer links to the product page. It cannot — one click target does one
// thing, and on a selling surface built around an on-card configurator that thing
// is "open the configurator". /products and the nav are how you reach a product
// page.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { radius, tokens, motion, space, supporting, eyebrow, headline, layout, type as typeScale } from '../../theme';
import { useIsMobile, useMediaQuery } from '../../hooks/useIsMobile';
// The cards read data/catalogue.ts — the same fourteen products the shop lists.
// Four of them, named below; nothing about the range is written down here.
import { CATALOGUE, type CatalogueItem } from '../../data/catalogue';
import { CtaLink } from './primitives';
import { ProductGlyph } from '../ProductGlyph';
import { RangeConfigurator } from './RangeConfigurator';
import { defaultSelection, fieldsFor, type Selection } from '../../data/configOptions';

/** THE FOUR, AND THE ONE RULE THAT DECIDES THEM: no two may be the same kind of
 * object. A roller blind stands for every blind, a curtain for every soft
 * furnishing, and the last two are the parts of the business a row of blinds
 * cannot say out loud — joinery, and outdoor.
 *
 * IDs rather than names, so this cannot drift out of step with the catalogue.
 *
 * EXPORTED, because FullRange lists everything that is NOT in here — the two
 * sections partition the catalogue between them, so a product promoted to this
 * row leaves the strip below on the same edit. */
export const HERO_IDS = [
  'roller-blinds',
  'curtains',
  'wardrobes',
  'folding-arm-awnings',
];

const RANGE: CatalogueItem[] = HERO_IDS.map(id => CATALOGUE.find(i => i.id === id)).filter(
  (i): i is CatalogueItem => Boolean(i),
);

/** THE CROPS, AND THIS IS THE MOST IMPORTANT THING IN THE FILE.
 *
 * Every hero render is a wide room scene in which the product Klay actually sells
 * occupies a fraction of the frame. Framed onto the product, the same file becomes
 * a product photograph; framed on its centre, it stays a picture of a room that
 * happens to contain one. Nothing else in this section matters as much.
 *
 * IT TAKES BOTH A POSITION AND A ZOOM, and the order they apply in is the whole
 * trick. Every source here is 16:9 and the tile is 4:5, so `object-fit: cover`
 * scales the image to match the container HEIGHT and the width overflows by about
 * 122%. Two consequences, and the second one cost a round:
 *
 *   The X half of object-position chooses which vertical slice of the source you
 *     see. 0% is the left edge of the photograph, 100% the right.
 *
 *   The Y half does nothing whatsoever. There is no vertical overflow to position
 *     within, so the full height of the source is on screen no matter what it says.
 *     The roller blinds sit in the top third of their frame and NO object-position
 *     could ever have framed them.
 *
 * So the zoom does the vertical work. transform-origin names the point that stays
 * still while the rest grows away from it, and at scale Z the visible region
 * shrinks to 1/Z around that point.
 *
 * WHICH MEANS THE ORIGIN IS IN THE TILE, NOT IN THE PHOTOGRAPH. That is the part
 * that was wrong first time: `curtains` was given an origin of 19% to reach the
 * sheers down the left of the bedroom, and 19% of the TILE is still the middle of
 * the source, because cover had already thrown the left third away before the
 * transform ran. The card kept showing the bed. Position picks the slice, then the
 * zoom frames inside it.
 *
 * WHY THE VALUES LIVE HERE AND NOT IN THE CATALOGUE. catalogue.ts carries an
 * `imagePosition` per product and it is right for what it does — it serves the
 * shop grid, the full-range strip and the listing pages, which all want the WHOLE
 * product in a landscape tile. These are hero crops for one row at one ratio.
 * Pushing them into the catalogue would break the four other surfaces that read
 * the same field.
 *
 * Each of these was set by looking at the rendered card, not by arithmetic. */
const HERO_CROP: Record<string, { pos: string; zoom: number; origin: string }> = {
  // THE WINDOW BAND. Blinds run across the top 45% of a wide kitchen and below
  // them is a marble island that has nothing to do with what is being sold. The
  // position takes the middle-right of the frame, where two blinds are drawn to
  // the same height; the zoom lifts off the island and lands on the fabric, with
  // just enough window under it to say what the fabric is doing.
  // 15 rather than 19, which had the mixer tap and a soap bottle along the bottom
  // edge — kitchen props in what is supposed to be a photograph of a blind.
  'roller-blinds': { pos: '58% center', zoom: 1.9, origin: '50% 15%' },
  // THE SHEERS DOWN THE LEFT WALL, which are the best product photograph in the
  // whole set: sheer and drape, ceiling to floor, backlit. Position 4% because
  // they are at the very left edge of the source — the bed is the right half and
  // this is the crop that finally excludes it. Only a light zoom after that; the
  // slice is already all curtain.
  curtains: { pos: '4% center', zoom: 1.12, origin: '50% 45%' },
  // THE JOINERY ALREADY FILLS ITS FRAME, so this is the one that barely needs
  // touching — a small push in to lose the doorway at the right and land on the lit
  // shelving and the folded stacks, which is what makes it read as built rather
  // than bought.
  wardrobes: { pos: '46% center', zoom: 1.18, origin: '50% 44%' },
  // THE AWNING ITSELF — the top 40% of the frame. Centred and unzoomed this card
  // was a dining table and eight chairs with a dark band above them. The zoom puts
  // the arm and the fabric across the frame and leaves the glazing beneath as
  // context rather than as the subject.
  // 20 rather than 17: at 17 a triangle of blue sky sat in the top right corner,
  // which is the one cool note in a row of four warm photographs and it read as a
  // mistake rather than as weather.
  'folding-arm-awnings': { pos: '46% center', zoom: 1.7, origin: '50% 20%' },
};

/** Relative luminance, for deciding whether the mechanism drawing goes on in warm
 * white or in ink. Only reached if one of the four loses its photograph. */
const luminance = (hex: string) => {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** FOUR ACROSS ONLY ABOVE THIS. Below it the row shows 1.8 and the panel stacks
 * instead of sitting beside — four-up at a 900px viewport would measure a 182px
 * tile, half the smallest card any reference uses, and two shares of it would
 * leave the panel narrower than one row of chips.
 *
 * Deliberately NOT the site's 768px mobile breakpoint. That one decides whether
 * the header stacks and whether the name drops to 20px; this one decides the row's
 * whole geometry, and the two have different answers between 769 and 999. */
const FOUR_UP = '(min-width: 1000px)';

/** Above this the open slot takes TWO shares; below it, three. It is about how
 * wide the PANEL ends up, not the card: two shares of a 940px row leaves the panel
 * about 232px, at which point every chip row wraps and the panel grows past the
 * card's height. Three gives it around 464. */
const WIDE_ROW = '(min-width: 1250px)';

/** THE STRIP BETWEEN TWO CARDS, and it is this section's own number rather than
 * the shared TILE_GAP the install strip and the full-range grid use.
 *
 * TILE_GAP is 4, which is a seam rather than a gap — right for the install strip,
 * where five photographs are MEANT to read as one continuous band. This row wants
 * the opposite: four separate products, four separate pictures. With no card box
 * around them the strip is the only thing keeping them apart, so it has to be a
 * real interval. MONDAY's row at 1340 runs four cards of about 315 with roughly 25
 * between them. */
const ROW_GAP = space.md;

/** Cards across the row. A fraction below the four-up breakpoint, because the
 * sliver of the next card is the only thing that says the row scrolls, and on a
 * whole number it ends on a card edge and reads as a complete grid. */
const cols = (fourUp: boolean) => (fourUp ? 4 : 1.8);

/** One share, as a CSS length for the slots. */
const cardBasis = (fourUp: boolean) =>
  `calc((100% - ${(Math.ceil(cols(fourUp)) - 1) * ROW_GAP}px) / ${cols(fourUp)})`;

/** How many shares the open slot takes. One below the four-up breakpoint, which is
 * the stacked case: the slot goes to the whole row and the panel sits under the
 * photograph rather than beside it. */
const openShares = (fourUp: boolean, wideRow: boolean) => (!fourUp ? 1 : wideRow ? 2 : 3);

/** The open slot's width. Every card after it slides along by the difference. */
const cardBasisOpen = (fourUp: boolean, wideRow: boolean) => {
  if (!fourUp) return '100%';
  const n = openShares(fourUp, wideRow);
  return `calc(((100% - ${(cols(fourUp) - 1) * ROW_GAP}px) / ${cols(fourUp)}) * ${n} + ${(n - 1) * ROW_GAP}px)`;
};

/** THE SAME SHARE IN PIXELS, from the row's own width — the identical arithmetic,
 * so the two cannot disagree.
 *
 * This exists because the card has to be pinned to a pixel width, and every way of
 * MEASURING that width off the live DOM has a race in it: a slot's offsetWidth is
 * mid-transition for 450ms after either a card opening or closing, and reading it
 * then gives a number between one share and two. Computing it from the row's
 * clientWidth has no such window, because opening a card does not change how wide
 * the row is. */
const sharePx = (rowWidth: number, fourUp: boolean) =>
  (rowWidth - (Math.ceil(cols(fourUp)) - 1) * ROW_GAP) / cols(fourUp);

/** How long a card takes to widen. Shared by the slot transition, the panel's
 * entrance and the scroll nudge that follows both, so the three cannot drift out of
 * step — the nudge has to start AFTER the width has settled, or two layout
 * animations run at once. */
const EXPAND_MS = 450;

/** How long the panel takes to leave before the card starts narrowing. Shorter
 * than EXPAND_MS: a thing arriving wants to be seen, a thing leaving wants to be
 * out of the way. */
const COLLAPSE_MS = 220;

/** The configuration panel's own height, measured in the running page. The row
 * reserves it so that opening a card never moves the section below. */
const PANEL_H = 560;

/** THE VIGNETTE, and it is lighter than it was — a fifth of ink at the corners
 * became an eighth.
 *
 * A wide room shot needs a lot of help to tell the eye where to look, and the
 * heavier wash was doing that job. A tight crop does not: the product already
 * fills the frame, so the vignette is back to what it should have been all along —
 * a slight darkening at the corners that keeps the picture from dissolving into a
 * near-white page, not a spotlight painted onto it.
 *
 * Ink at low alpha rather than black, because a pure-black wash greys a warm
 * render — the same reason the site's shadows are mixed from ink. */
const VIGNETTE =
  'radial-gradient(120% 90% at 50% 45%, rgba(29,29,29,0) 52%, rgba(29,29,29,0.05) 78%, rgba(29,29,29,0.13) 100%)';

/** How far the non-focused cards drop while another is hovered or open. Opacity
 * and saturation together, because either alone is too polite to notice.
 *
 * These are the two numbers to turn if the spotlight is too strong or too weak.
 * 0.62 was tuned when the cards had gold buttons on them, where anything lower
 * made a Shop Now look disabled rather than recessive. With the buttons gone there
 * is nothing on a card that can be mistaken for a dead control, so it can go back
 * to being a real step. */
const DIM_OPACITY = 0.5;
const DIM_SATURATION = 0.65;

// ---------------------------------------------------------------------------
// THE CARD — a tightly cropped photograph, the group, the name, and one line of
// text that says it can be clicked. Nothing else.
//
// IT IS ONE BUTTON, all of it. There is no separate control to press: the whole
// card toggles its configurator, which is what lets the gold bar go. A <button>
// wrapping a picture and some type is valid and it is keyboard-reachable, which a
// clickable <div> would not be.
//
// TWO COLUMNS WHEN OPEN, one when shut, AND NO GAP BETWEEN THEM. The panel is a
// flex sibling of the card column, flush against it with square inner corners, so
// the pair reads as one shape that has been extended sideways rather than as a
// second object parked next to the first.
// ---------------------------------------------------------------------------
function RangeCard({
  item,
  open,
  ready,
  onToggle,
  isMobile,
  hover,
  dimmed,
  stacked,
  cardPx,
}: {
  item: CatalogueItem;
  /** Whether this card's configuration panel is showing. One at a time across the
   * whole row. */
  open: boolean;
  /** True once the width animation has finished. The configurator waits for it. */
  ready: boolean;
  onToggle: () => void;
  isMobile: boolean;
  /** Under the pointer. OWNED BY THE ROW rather than by this card, because the row
   * needs to know which card it is in order to dim the other three. */
  hover: boolean;
  /** Another card has the attention — this one steps back. */
  dimmed: boolean;
  /** Below the four-up breakpoint the panel goes UNDER the photograph instead of
   * beside it, because there is no second share to put it in. */
  stacked: boolean;
  /** The card's width in pixels, computed from the row's own width. Null until the
   * first measurement, when the card falls back to filling its slot. */
  cardPx: number | null;
}) {
  const [sel, setSel] = useState<Selection>(() => defaultSelection(item));
  const choose = (fieldId: string, choiceId: string) =>
    setSel(s => ({ ...s, [fieldId]: choiceId }));

  // The chosen colour, read back so the tile can take it as its ground.
  const fields = fieldsFor(item);
  const leadField = fields.find(f => f.kind === 'swatches') ?? fields.find(f => f.id === 'variant');
  const chosen = leadField?.choices.find(c => c.id === sel[leadField.id]);
  // THE GLYPH FALLBACK, and all four of the current selection have photographs so
  // none of this is reached. It stays because the four are chosen by id: if one is
  // swapped for a product with no photograph, the tile takes the chosen fabric
  // colour as its ground and draws the mechanism on it rather than being a hole in
  // the page. IT IS ALSO WHY THE PANEL GOES BESIDE THE CARD AND NOT UNDER IT — the
  // picture stays in view while you configure, so choosing a colour visibly
  // repaints the tile next to the swatch you just clicked.
  const tileGround = !item.image && chosen?.hex ? chosen.hex : undefined;
  const glyphOnLight = tileGround ? luminance(tileGround) > 0.45 : false;

  // No entry means the catalogue's own position, centred and unzoomed — the right
  // default for a product that already fills its frame.
  const crop =
    HERO_CROP[item.id] ??
    { pos: item.imagePosition ?? 'center', zoom: 1, origin: '50% 50%' };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'stretch',
        height: '100%',
        position: 'relative',
        // NO BACKGROUND, NO BORDER, NO PADDING, NO SHADOW. The card is the
        // photograph and the type under it, sitting on the section's own ground.
        // See the note at the top of the file for the two card treatments that
        // came before this and why both were furniture.
        //
        // The spotlight is all that is left on this box.
        opacity: dimmed ? DIM_OPACITY : 1,
        filter: dimmed ? `saturate(${DIM_SATURATION})` : 'none',
        transition: 'opacity 0.4s ease, filter 0.4s ease',
      }}
    >
      {/* THE CARD IS PINNED TO A PIXEL WIDTH, open or shut, and this is the one
          thing that stops it changing size. Every expression of it as a share of
          the SLOT was wrong, because the slot is what animates: the basis flips on
          the tick the state changes, while the slot is still one share wide, so the
          card became half a share and grew back as the slot widened. Closing ran it
          in reverse. The tile is 4:5, so its height followed, and every card and
          every section below it moved with it. */}
      <div
        style={{
          flex: stacked ? '0 0 auto' : cardPx ? `0 0 ${cardPx}px` : '0 0 100%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ONE CONTROL FOR THE WHOLE CARD. Reset to a block with no chrome of its
            own — the button IS the card, so anything a browser would draw on it is
            exactly the furniture this section just got rid of. */}
        <button
          onClick={onToggle}
          style={{
            display: 'block',
            width: '100%',
            padding: 0,
            border: 'none',
            background: 'none',
            font: 'inherit',
            color: 'inherit',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              // The one radius on the card, and the only thing left that says
              // "object" rather than "picture pasted on a page".
              borderRadius: radius.md,
              // 4:5 — the site's one portrait ratio, shared with the install strip
              // and the About panel.
              aspectRatio: '4 / 5',
              background: tileGround ?? (item.image ? tokens.parchment : tokens.charcoal),
            }}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={`${item.name} — ${item.group}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  // WHICH SLICE OF THE SOURCE. See HERO_CROP — this is the half
                  // that chooses horizontally, and the zoom below is the half that
                  // chooses vertically.
                  objectPosition: crop.pos,
                  display: 'block',
                  // THE CROP. See HERO_CROP — the zoom is what frames the product,
                  // and the 1.04 on hover is the old scale composed with it rather
                  // than replacing it.
                  transformOrigin: crop.origin,
                  transform: `scale(${crop.zoom * (hover ? 1.04 : 1)})`,
                  // A small lift in contrast and saturation, a little more under
                  // the pointer. The same correction on all four is a shared grade
                  // — the nearest thing to art direction that can be applied after
                  // the fact, and what pulls four renders shot at different
                  // temperatures into one set.
                  filter: hover
                    ? 'saturate(1.1) contrast(1.05) brightness(1.01)'
                    : 'saturate(1.04) contrast(1.03)',
                  transition: 'transform 0.7s ease, filter 0.5s ease',
                }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: space.md,
                  border: `1px solid ${
                    hover ? tokens.onDarkEdge : glyphOnLight ? tokens.line : tokens.onDarkLine
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.3s ease',
                }}
              >
                <ProductGlyph
                  type={item.glyph ?? ''}
                  size={140}
                  color={glyphOnLight ? tokens.ink : tokens.warmWhite}
                  ground={tileGround ?? tokens.charcoal}
                  opacity={hover ? 0.75 : 0.6}
                />
              </div>
            )}

            {/* THE VIGNETTE, pointer-transparent so it takes nothing off the
                control it sits inside. It lightens under the pointer rather than
                deepening: the hovered card is the one being looked at, so its frame
                opens up while the other three keep their falloff. */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background: VIGNETTE,
                opacity: hover ? 0.5 : 1,
                pointerEvents: 'none',
                transition: 'opacity 0.5s ease',
              }}
            />
          </div>

          {/* Small caps group, big name — MONDAY's stack in Klay's faces. Across
              these four the group line runs INDOOR, INDOOR, OTHER, OUTDOOR, which
              is the section's whole argument in four words. */}
          <div
            style={{
              fontFamily: tokens.body,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: tokens.inkSoft,
              marginTop: space.md,
            }}
          >
            {item.group}
          </div>

          <h3
            style={{
              ...typeScale.card,
              // SMALLER ON MOBILE, where a card is a fraction of the width it has
              // on a desktop. "Frameless Shower Screens" at the full card scale
              // wraps to three lines there.
              ...(isMobile ? { fontSize: 20 } : null),
              // TWO LINES' WORTH, RESERVED, whether the name needs them or not. The
              // action labels below are a horizontal line across the row and they
              // have to stay one: with the cards sizing to their own content, a
              // single name that wraps drops its label below its neighbours' and
              // the row reads as broken. It costs one line of empty space under the
              // names that fit on one, which is invisible on this ground.
              minHeight: `${2 * 1.1 * (isMobile ? 20 : 26)}px`,
              color: tokens.ink,
              marginTop: space.xs,
            }}
          >
            {/* THE NAME IS THE NAME. No price — the panel prices the actual
                configuration, and a from-figure here would be a second, vaguer
                number twenty pixels above a real one. */}
            {item.name}
          </h3>

          {/* THE ACTION, AND IT IS TYPE RATHER THAN A BUTTON. This is the 52px gold
              bar's replacement, and the swap is most of what this round is: four
              saturated gold bars were louder than any of the photographs and
              repeated four times, so they took the attention the pictures were
              supposed to get AND spent gold's focal power in the same move. Micro
              caps with a rule under them says "this can be clicked" at a fraction
              of the volume.

              A <span>, not a nested button — the whole card is already the control,
              and a button inside a button is invalid. */}
          <span
            style={{
              ...typeScale.micro,
              display: 'inline-block',
              // CLOSE UNDER THE NAME, not a group away from it. The name block
              // reserves two lines and three of these four names take one, so
              // there is already a blank line above this label — at the group
              // step as well it read as an orphan floating near the bottom of
              // nothing. Tight to the name, the pair reads as one block.
              marginTop: space.xs,
              paddingBottom: space.xxs,
              color: hover ? tokens.ink : tokens.inkSoft,
              borderBottom: `1px solid ${hover ? tokens.ink : tokens.lineStrong}`,
              transition: motion.link,
            }}
          >
            {open ? 'Close' : 'Shop now'}
          </span>
        </button>
      </div>

      {/* THE PANEL — in the flow, in the space the row just made. A flex sibling
          rather than an overlay, so it covers nothing and the neighbouring cards
          genuinely move aside instead of being hidden behind it.

          IT KEEPS ITS SURFACE while the card gave up its own. That is not
          inconsistent: a photograph is content and wants no box, a form is a
          control surface and needs one — the cream ground is what makes a
          seventeen-swatch colour row read as one panel of choices. */}
      {open && (
        <div
          style={{
            // WHATEVER IS LEFT, not a share of its own. Giving the card and the
            // panel half each of a box that also had to hold the gap between them
            // overflowed the slot by exactly one gap. The card is sized first, to
            // precisely one share; the panel takes the remainder.
            flex: stacked ? '1 1 auto' : '1 1 0',
            minWidth: 0,
            marginTop: stacked ? ROW_GAP : 0,
            // EXACTLY THE CARD'S HEIGHT, and this is what enforces it. The panel
            // holds its content in an absolutely-positioned child, so it has NO
            // intrinsic height — the row's height is decided by the card alone and
            // `align-items: stretch` hands that height back to the panel.
            position: 'relative',
            background: tokens.cream,
            borderRadius: stacked
              ? `0 0 ${radius.md}px ${radius.md}px`
              : `0 ${radius.md}px ${radius.md}px 0`,
            overflow: 'hidden',
            // Fades in once the width has settled, and back out before it narrows.
            // Opacity carries both, so a close that interrupts an open just runs
            // from wherever it got to.
            opacity: ready ? 1 : 0,
            transition: `opacity ${COLLAPSE_MS}ms ease`,
          }}
        >
          {/* MOUNTED ONLY ONCE THE EXPANSION IS DONE. Profiled, the click frame
              cost 139ms at 4x throttle and it was not the animation — it persisted
              with every animation disabled. It is React mounting the fields, the
              chips and up to seventeen swatches on the same frame a layout
              animation starts. Deferring it means the width animates against an
              empty box.

              THE ABSOLUTE FILL is what lets the panel match the card rather than
              the card's content stretching to match the panel. */}
          {ready && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
              <RangeConfigurator item={item} sel={sel} onChange={choose} fill />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RangeRow() {
  const isMobile = useIsMobile();
  const fourUp = useMediaQuery(FOUR_UP);
  const wideRow = useMediaQuery(WIDE_ROW);
  const stacked = !fourUp;
  const scrollerRef = useRef<HTMLDivElement>(null);

  /** Which card has its configuration panel open. One at a time. */
  const [openId, setOpenId] = useState<string | null>(null);

  /** Which card is under the pointer, and it lives HERE rather than in the card
   * because the spotlight is a property of the row: dimming the other three is
   * something only the row can decide. Null on a touch screen, where there is no
   * hover and the effect simply does not apply. */
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /** The height the row holds whether a card is open or not, so opening one never
   * moves the section below. Measured rather than guessed: the panel's content does
   * not depend on the viewport once it is wide enough not to wrap, while the card,
   * being a 4:5 tile, does shrink — so the panel is the taller of the two on a
   * narrow desktop and it is the panel that has to be reserved for.
   *
   * Only where the panel sits BESIDE the card. Stacked, the open slot is the
   * photograph's height plus the panel's, and no reserve could cover that without
   * leaving the same emptiness at rest. */
  const rowMinHeight = stacked ? undefined : PANEL_H;

  /** THE CARD'S WIDTH IN PIXELS, so nothing about the slot's transition can reach
   * it. COMPUTED FROM THE ROW'S WIDTH, not measured off a slot: reading a closed
   * sibling's offsetWidth looked like the honest source — it is the same calc(),
   * already resolved — and it broke every card but the first, because closing one
   * re-runs this while that slot is still two shares wide and only beginning its
   * 450ms shrink.
   *
   * A FULL SHARE NOW, with nothing subtracted. It used to lose two paddings and two
   * borders to the card box; there is no card box. */
  const [cardPx, setCardPx] = useState<number | null>(null);
  useEffect(() => {
    const row = scrollerRef.current;
    if (!row) return;
    const measure = () => setCardPx(sharePx(row.clientWidth, fourUp));
    measure();
    // The row's width is the only input, so the row is what has to be watched —
    // not the window, which also fires on height changes that cannot affect it.
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, [fourUp]);

  /** THE CLOSE REVERSES THE OPEN, rather than the panel vanishing and the card then
   * shrinking behind it. Opening runs widen, then fade in; closing has to run fade
   * out, then narrow — so a click cannot simply clear `openId`, which would unmount
   * the panel on the spot and leave the width animating against an empty box.
   *
   * Switching straight from one card to another skips the wait: the outgoing panel
   * has somewhere to go, so making the visitor watch it leave first would be a
   * delay with nothing behind it. */
  const [closing, setClosing] = useState(false);

  const toggle = (id: string) => {
    if (openId !== id) {
      setClosing(false);
      setOpenId(id);
      return;
    }
    setClosing(true);
  };

  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(() => {
      setOpenId(null);
      setClosing(false);
    }, COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [closing]);

  /** True once the open card has finished widening. The configurator waits for it,
   * so the width animates against an empty box and the form arrives into one that
   * has stopped moving. */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!openId) {
      setReady(false);
      return;
    }
    const t = window.setTimeout(() => setReady(true), EXPAND_MS);
    return () => window.clearTimeout(t);
  }, [openId]);

  /** BRING THE EXPANDED CARD FULLY INTO VIEW. Opening the rightmost card widens it
   * past the row's right edge. The row nudges itself along by however much is
   * overhanging, and by nothing at all when the card already fits.
   *
   * AFTER the width transition, not during it. Both a smooth scroll and a
   * flex-basis transition force layout on every frame, and running them together
   * was the jank: profiled at 4x CPU throttle the overlap produced frames of 91ms,
   * 49ms and 242ms clustered in the first 300ms.
   *
   * The target is computed from the same share arithmetic the slot uses rather than
   * by doubling a closed sibling — a sibling is one share, and the open slot is two
   * at one breakpoint and three at another. */
  useEffect(() => {
    if (!openId) return;
    const timer = window.setTimeout(() => {
      const row = scrollerRef.current;
      const slot = row?.querySelector<HTMLElement>(`[data-slot="${openId}"]`);
      if (!row || !slot) return;
      const n = openShares(fourUp, wideRow);
      const target = sharePx(row.clientWidth, fourUp) * n + (n - 1) * ROW_GAP;
      const over = slot.offsetLeft + target - (row.scrollLeft + row.clientWidth);
      if (over > 0) row.scrollTo({ left: row.scrollLeft + over, behavior: 'smooth' });
    }, EXPAND_MS);
    return () => window.clearTimeout(timer);
  }, [openId, fourUp, wideRow]);

  // Escape closes the panel. A pop-out that can only be dismissed by finding its
  // own control is one people feel trapped by.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setClosing(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);

  /** ONE CONTAINER FOR THE HEADER AND THE ROW, so the first picture's left edge
   * lands on the same vertical line as "Our Range" by construction rather than by
   * two paddings that happen to agree. */
  const inner: React.CSSProperties = {
    maxWidth: layout.gridMax,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: layout.inlinePad(isMobile),
    paddingRight: layout.inlinePad(isMobile),
  };

  return (
    // Warm white, and with the card boxes gone this is also the ground the
    // photographs sit directly on and the colour of the strip between them.
    <section style={{ background: tokens.warmWhite }}>
      {/* THE HEADER IS RANGED LEFT WITH THE ACTION OPPOSITE, which is the other
          half of what MONDAY's range section does: heading hard left at display
          scale, the supporting line under it, and one link alone on the right of
          the same band. Centred reads as a caption above a row; ranged left with
          something opposite it reads as a section heading with a decision attached.

          SHOP ALL IS NOW THE ONLY GOLD IN THE SECTION at rest, which is the point
          of taking it off the cards: one gold object in a section pulls, five do
          not. */}
      <div
        style={{
          ...inner,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          justifyContent: 'space-between',
          gap: space.lg,
          padding: isMobile
            ? `${space.xl}px ${layout.inlinePad(isMobile)}px ${space.lg}px`
            : `${space.xxl}px ${layout.inlinePad(isMobile)}px ${space.lg}px`,
        }}
      >
        <div>
          <p style={{ ...eyebrow, marginBottom: space.md }}>The collection</p>
          <h2 style={{ ...headline.section, color: tokens.ink }}>Our Range</h2>
          <p style={{ ...supporting.onLight, marginTop: space.md, maxWidth: 460 }}>
            Made to measure. Installed by experts.
          </p>
        </div>
        {/* DESKTOP ONLY, HERE. On mobile the header is a column, so Shop All landed
            directly under the supporting line and ABOVE the row — a full-width gold
            button asking the visitor to leave for the shop before they had been
            shown a single product. It moves below the cards. */}
        {!isMobile && <CtaLink to="/products">Shop All</CtaLink>}
      </div>

      {/* THE SAME CONTAINER AS THE HEADER, and the padding is on THIS box rather
          than on the scroller inside it. Padding on a scroll container sits at the
          start and end of the scrollable CONTENT, so it would slide away with the
          row instead of holding the edges — and with scroll snapping on, the
          browser also snaps the first card to the scrollport edge and scrolls past a
          start padding, leaving the first card flush against the viewport while the
          heading above it is correctly inset. */}
      <div
        style={{
          ...inner,
          position: 'relative',
          // Closes the section. Thin on purpose: a margin finishing a section
          // rather than a gap between two.
          paddingBottom: space.md,
        }}
      >
        <div
          ref={scrollerRef}
          className="klay-hscroll"
          style={{
            display: 'flex',
            gap: ROW_GAP,
            // AT REST THIS DOES NOT SCROLL. Four cards at one share each is exactly
            // the row, so there is no overflow and no scrollbar until a card is
            // opened and its slot takes two shares. Below the four-up breakpoint the
            // row shows 1.8 cards and does scroll, which is what the sliver of the
            // second card is there to say.
            overflowX: 'auto',
            // THE SECTION RESERVES ITS OPEN HEIGHT, so the page below never moves
            // when a card is opened. `alignItems: flex-start` stops the reserve
            // stretching the closed cards to fill it.
            minHeight: rowMinHeight,
            alignItems: 'flex-start',
            // Snaps to card edges so the row never rests showing two half cards.
            // Off while a card is open — see the slot.
            scrollSnapType: openId ? 'none' : 'x mandatory',
          }}
        >
          {RANGE.map(item => {
            const open = openId === item.id;
            return (
              <div
                key={item.id}
                // THE ANIMATION IS THE LAYOUT. Opening a card widens its slot from
                // one share to two, and because these are flex siblings in a row
                // every card after it slides along by exactly that much — no card is
                // covered and no space is wasted.
                data-slot={item.id}
                // CONTAINMENT. The flex-basis transition changes this box every
                // frame, and without a boundary the browser has to consider the
                // whole row's subtree each time — measured at 432 style
                // recalculations for a single card opening.
                className="klay-slot"
                style={{
                  flex: `0 0 ${open ? cardBasisOpen(fourUp, wideRow) : cardBasis(fourUp)}`,
                  // SNAP OFF WHILE OPEN. Mandatory snapping and a programmatic
                  // scroll fight each other — the browser re-snaps to the nearest
                  // card edge and undoes the nudge bringing the open card into view.
                  // It comes back when the panel closes.
                  scrollSnapAlign: open ? 'none' : 'start',
                  transition: `flex-basis ${EXPAND_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <RangeCard
                  item={item}
                  open={open}
                  ready={open && ready && !closing}
                  isMobile={isMobile}
                  // The open card keeps the pointer treatment for as long as it is
                  // open, whether or not the pointer is still on it: it is plainly
                  // the card being worked on.
                  hover={hoveredId === item.id || open}
                  // AN OPEN CARD OUTRANKS A HOVERED ONE. While one is open the other
                  // three stay back regardless of where the pointer is, because the
                  // visitor is configuring something and a card brightening under a
                  // stray pointer distracts from it.
                  dimmed={openId ? !open : Boolean(hoveredId) && hoveredId !== item.id}
                  stacked={stacked}
                  cardPx={cardPx}
                  onToggle={() => toggle(item.id)}
                />
              </div>
            );
          })}
        </div>

        {/* Mobile's Shop All, under the four rather than over them. Ranged left with
            the cards, not centred — it is the same object that sits at the end of
            the header row on desktop, so it keeps the same alignment. */}
        {isMobile && (
          <div style={{ paddingTop: space.lg }}>
            <CtaLink to="/products">Shop All</CtaLink>
          </div>
        )}
      </div>
    </section>
  );
}
