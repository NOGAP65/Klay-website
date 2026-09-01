// ---------------------------------------------------------------------------
// 4. Bestsellers — FOUR HERO PRODUCTS IN ONE ROW, AND THE PANEL OPENS BESIDE THEM.
//
// FOUR HERO PRODUCTS, AND ONE PER PART OF THE BUSINESS: a roller blind, a
// curtain, a wardrobe, a folding arm awning. Indoor hard furnishing, indoor soft
// furnishing, joinery, outdoor. Four is the number that fits one row at the
// width the references use — MONDAY, Sixpenny and HAY are all four-up between
// 310 and 335 — so at rest the row holds exactly four cards, has nothing
// off-screen and needs no arrows: there is nowhere for an arrow to go.
//
// THIS SECTION SELLS FOUR THINGS. It is not the catalogue and it is not trying
// to be. The other ten used to be listed further down the homepage as a strip of
// small tiles with no buttons (FullRange, now deleted); the answer to "what else
// do you make?" is the "Shop the full range" action in this section's header,
// which is worded to say it leads somewhere bigger rather than just "Shop All".
// One section trying to both sell and list is what produced every previous
// version of this — see the note at the top of HomePage before merging them back.
//
// TWO OF THE FOUR CARRY A VISUALISE BADGE on the photograph, and which two is
// read off `visualise` in data/catalogue.ts rather than decided here: the
// visualiser draws rollers and curtains, so a wardrobe and an awning have
// nothing to show. The badge does not leave the page — it selects the product in
// the homepage's own visualiser and scrolls to it, which is three sections down.
//
// THE PANEL OPENS SIDEWAYS. Clicking Shop Now widens the card's slot from one
// share to two and the configurator arrives in the space that made, BESIDE the
// photograph. That is not a preference, it is the whole point of the pattern:
// the fabric swatch and the picture it repaints have to be on screen together,
// or choosing Forest Green changes some chips and nothing else. Sideways also
// leaves the photograph at full size while you configure, where a panel dropped
// underneath pushes it up and out of the way at exactly the moment it matters.
//
//   A DRAWER UNDER THE CARD WAS TRIED AND IS GONE. It was cheaper — a grid with
//   no scroller — and it read fine on its own, but it put the picture above the
//   controls instead of next to them, and on the roller it put nine inches of
//   page between the swatch you click and the tile it changes.
//
// WHAT SIDEWAYS COSTS, AND WHY IT IS WORTH IT: the row has to be scrollable,
// because two shares plus three more cards is more than the container. At rest
// it does not scroll — four shares is exactly the row — so the scrollbar and the
// overflow only exist while a card is open, and the row nudges itself along to
// bring the panel fully into view. Every previous version of this section put a
// scroller here to hold FOURTEEN cards, which is what made four of them the
// visible frame of the whole range. Four cards in a scroller that only scrolls
// while you are configuring one of them is a different object.
//
// BELOW 1000px IT STACKS, and it has to: at 1.8 cards across there is no second
// share to give the panel, so the slot goes to the full width of the row and the
// panel sits under the photograph in the same slot. A phone has one column and
// no argument about it.
//
// THE CARD is MONDAY's stack in Klay's faces — the name under the picture rather
// than on it, so it gets to be big.
//
// WHY IT CANNOT ALSO BE MONDAY'S TREATMENT. MONDAY's cards carry no border, no
// elevation and no framing of any kind, and they do not need any: every one of
// their photographs is a single bottle cut out on a flat pastel field. The
// silhouette does the work a border would do, and the negative space around it
// is what makes the eye land on the product. Their card boundary is implicit
// because their PHOTOGRAPH has one.
//
// Klay's photographs are full-bleed interior scenes — a kitchen, a bed, a
// wardrobe, a patio. Edge-to-edge content, no silhouette, no negative space,
// and four of them side by side in a row read as four windows onto four rooms
// rather than four products on a shelf. Copying MONDAY's restraint onto this
// imagery is what left the row feeling flat: the treatment that focuses a
// cut-out does nothing for a scene.
//
// SO THE CARD SUPPLIES THE CONTAINMENT THE PHOTOGRAPH DOES NOT, in four moves,
// and they are meant to be read as one:
//
//   1. THE WHOLE CARD IS ONE OBJECT. Picture, group line, name and the gold
//      action all sit inside a single bounded box — white on the section's
//      near-white, a hairline round it, one radius. Before this the photograph
//      was a floating rectangle and the type and button were loose on the page
//      ground beneath it, which is three objects the eye has to assemble. The
//      1.06:1 between the card and the ground is deliberate and it is the one
//      thing borrowed straight from MONDAY: the card barely separates from the
//      page, so the boundary is felt rather than drawn, and the photograph is
//      still the only strong thing in the frame.
//
//   2. IT SITS UP OFF THE PAGE, and further on hover. A resting shadow and a
//      lift-plus-rise under the pointer, which is what makes the row feel live
//      rather than printed. See the note on the lift for the elevation budget
//      this spends.
//
//   3. THE PHOTOGRAPH IS LIT. A vignette inside the frame — transparent at the
//      centre, a fifth of ink at the corners — plus a small contrast and
//      saturation lift that goes further under the pointer. This is the move
//      that actually replaces MONDAY's clean field: a scene has no falloff of
//      its own, so one is added, and the eye lands mid-frame instead of
//      wandering the room. It is a LIGHTING device, not a scrim — nothing is
//      set over these photographs, and the site's rule against scrims is about
//      type over pictures, which this is not.
//
//   4. THE ROW SPOTLIGHTS. Hover one card and the other three drop in opacity
//      and desaturate; open one and they stay down for as long as it is open.
//      Four scenes competing at equal strength is the actual reason attention
//      does not settle anywhere, and this is the only move that fixes that
//      rather than fixing each card in isolation.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { radius, tokens, motion, shadow, space, supporting, eyebrow, headline, layout, type as typeScale, CtaLink, useHover } from '@/ds';
import { CATALOGUE, type CatalogueItem } from '@/features/catalogue';
import { defaultSelection, fieldsFor, type Selection } from '@/features/catalogue';

// The cards read data/catalogue.ts — the same fourteen products the shop lists,
// rendered by the same tile. Four of them, named below; nothing about the range
// is written down in this file.

import { ProductGlyph } from '@/features/catalogue';
import { useIsMobile, useMediaQuery, scrollToId } from '@/shared';

import { useVisualiserStore } from '../../../visualiser/useVisualiserStore';
import { TILE_GAP } from '../furniture';

import { RangeConfigurator } from './RangeConfigurator';

/** THE FOUR, AND THE ONE RULE THAT DECIDES THEM: no two may be the same kind of
 * object. A roller blind stands for every blind, a curtain for every soft
 * furnishing, and the last two are the parts of the business a row of blinds
 * cannot say out loud — joinery, and outdoor.
 *
 * Plantation Shutters is the one that lost its place going from six to four, and
 * it is the right one to lose: it is a second indoor hard furnishing, so it is
 * the only card here whose job another card was already doing. It leads the shop
 * instead.
 *
 * IDs rather than a hand-written list of names, so this cannot drift out of step
 * with the catalogue: change a product's name or its photograph in one place and
 * this section follows. An id that stops existing drops out rather than throwing.
 *
 * LOCAL AGAIN. It was exported for FullRange, which listed everything NOT in here
 * so that the two sections partitioned the catalogue between them. That section
 * is gone and nothing else reads this, so it goes back to being this file's
 * business. */
const HERO_IDS = [
  'roller-blinds',
  'curtains',
  'wardrobes',
  'folding-arm-awnings',
];

const RANGE: CatalogueItem[] = HERO_IDS.map(id => CATALOGUE.find(i => i.id === id)).filter(
  (i): i is CatalogueItem => Boolean(i),
);

/** A viewfinder, 14px, drawn here rather than imported.
 *
 * lucide-react is in package.json and nothing in src imports it; the site draws
 * its own marks (ProductGlyph, Nav, FilterRail), and four corner brackets are
 * fewer bytes than the first icon off a library. Corners plus a centre dot,
 * because the badge means "see it framed on your own window" — an eye would say
 * "look at this picture", which is the opposite of the offer. */
function ViewfinderIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M2 5V3.6A1.6 1.6 0 0 1 3.6 2H5" />
        <path d="M9 2h1.4A1.6 1.6 0 0 1 12 3.6V5" />
        <path d="M12 9v1.4a1.6 1.6 0 0 1-1.6 1.6H9" />
        <path d="M5 12H3.6A1.6 1.6 0 0 1 2 10.4V9" />
      </g>
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** "Visualise" on the photograph. It selects this product in the homepage's own
 * visualiser and scrolls down to it.
 *
 * IT DOES NOT NAVIGATE, and that is the point. It used to link to /visualiser —
 * leaving the homepage to use a tool the homepage already has three sections
 * further down, throwing away the visitor's scroll position to show them the same
 * instrument on a page of its own. Now it does what the hero's "Design Yours"
 * does (see scrollToId in primitives), with the product selected on the way.
 *
 * A <button>, not a <Link>, for the same reason that one is: there is no
 * destination. It also settles the nested-anchor problem rather than working
 * around it — the picture and name are wrapped in a <Link to={item.to}>, and an
 * <a> inside an <a> is invalid and swallows its own clicks. It still sits OUTSIDE
 * that link, because a <button> inside an <a> is no better; the card's column is
 * the positioning context and this is placed over the picture from there.
 *
 * Always visible rather than revealed on hover: it exists to tell people the
 * visualiser is there at all, and a control that only appears once you are
 * already pointing at the card cannot do that. On a phone there is no hover to
 * reveal it with either.
 *
 * It carries its own solid pill, so this is not type dropped on a photograph —
 * the rule that forbids that is about unbacked type and scrims over the whole
 * frame, neither of which a 26px-tall lozenge in the corner is. */
function VisualiseBadge({
  target,
  name,
}: {
  target: NonNullable<CatalogueItem['visualise']>;
  name: string;
}) {
  const { isHovered, bind } = useHover();
  const { setProductCategory, setBlindType, setActiveWindow } = useVisualiserStore();

  const onClick = () => {
    // WINDOW 1 FIRST. The panel's setters write to whichever window is active,
    // and a visitor who has already been down there and customised window 3
    // would otherwise have this badge quietly reconfigure that one. Arriving
    // from a product card means "show me this", which is window 1 — and window 1
    // leads, so the windows still following it come along.
    setActiveWindow(0);
    setProductCategory(target.category);
    if (target.blindType) setBlindType(target.blindType);
    scrollToId('visualiser')();
  };

  return (
    <button
      {...bind}
      onClick={onClick}
      aria-label={`Visualise ${name} in your own room`}
      style={{
        position: 'absolute',
        top: space.snug,
        right: space.snug,
        zIndex: 2,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 26,
        padding: `0 ${space.tight}px`,
        borderRadius: radius.md,
        border: 'none',
        cursor: 'pointer',
        // Paper pill, ink label — the same "selected" relationship the
        // visualiser's own controls use on a dark ground, which is what a
        // photograph is. It goes fully opaque and inverts under the pointer, so
        // the badge answers the mouse before the click does.
        background: isHovered ? tokens.ink : 'rgba(248,248,248,0.92)',
        color: isHovered ? tokens.paper : tokens.ink,
        ...typeScale.micro,
        transition: motion.button,
      }}
    >
      <ViewfinderIcon />
      Visualise
    </button>
  );
}

/** Relative luminance, for deciding whether the mechanism drawing goes on in
 * warm white or in ink. Only reached if one of the four loses its photograph —
 * see the note on the glyph fallback. */
const luminance = (hex: string) => {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** FOUR ACROSS ONLY ABOVE THIS. Below it the row shows 1.8 and the panel stacks
 * instead of sitting beside — see the note at the top. The number comes from the
 * card: four-up at a 900px viewport would measure a 182px tile, which is half
 * the smallest card any reference uses, and two shares of it would leave the
 * panel 182px, which is narrower than one row of chips.
 *
 * It is deliberately NOT the site's 768px mobile breakpoint. That one decides
 * whether the header stacks and whether the name drops to 20px; this one decides
 * the row's whole geometry, and the two questions have different answers between
 * 769 and 999. */
const FOUR_UP = '(min-width: 1000px)';

/** Above this the open slot takes TWO shares; below it, three.
 *
 * It is about how wide the PANEL ends up, not about the card. Two shares of a
 * 940px row leaves the panel about 232px, at which point every chip row wraps
 * and the panel grows past the card's own height — measured at 719px against a
 * 443px card, which stretched the row and threw the section below it down by
 * 276px. Three shares gives the panel around 464 and the chips fit the rows they
 * were designed for. */
const WIDE_ROW = '(min-width: 1250px)';

/** Cards across the row. A fraction below the four-up breakpoint, because the
 * sliver of the next card is the only thing that says the row scrolls, and on a
 * whole number it ends on a card edge and reads as a complete grid. */
const cols = (fourUp: boolean) => (fourUp ? 4 : 1.8);

/** One share, as a CSS length for the slots. */
const cardBasis = (fourUp: boolean) =>
  `calc((100% - ${(Math.ceil(cols(fourUp)) - 1) * TILE_GAP}px) / ${cols(fourUp)})`;

/** How many shares the open slot takes. One below the four-up breakpoint, which
 * is the stacked case: the slot goes to the whole row and the panel sits under
 * the photograph rather than beside it. */
const openShares = (fourUp: boolean, wideRow: boolean) => (!fourUp ? 1 : wideRow ? 2 : 3);

/** The open slot's width. See openShares, and WIDE_ROW for why it is not always
 * two. Every card after it slides along by the difference. */
const cardBasisOpen = (fourUp: boolean, wideRow: boolean) => {
  if (!fourUp) return '100%';
  const n = openShares(fourUp, wideRow);
  return `calc(((100% - ${(cols(fourUp) - 1) * TILE_GAP}px) / ${cols(fourUp)}) * ${n} + ${(n - 1) * TILE_GAP}px)`;
};

/** THE SAME SHARE IN PIXELS, from the row's own width — the identical
 * arithmetic, so the two cannot disagree.
 *
 * This exists because the card has to be pinned to a pixel width (see the note
 * where it is applied), and every way of MEASURING that width off the live DOM
 * has a race in it: a slot's offsetWidth is mid-transition for 450ms after
 * either a card opening or a card closing, and reading it then gives a number
 * between one share and two. Computing it from the row's clientWidth has no such
 * window, because opening a card does not change how wide the row is. */
const sharePx = (rowWidth: number, fourUp: boolean) =>
  (rowWidth - (Math.ceil(cols(fourUp)) - 1) * TILE_GAP) / cols(fourUp);

/** How long a card takes to widen. Shared by the slot transition, the panel's
 * entrance and the scroll nudge that follows both, so the three cannot drift out
 * of step — the nudge in particular has to start AFTER the width has settled, or
 * two layout animations run at once. */
const EXPAND_MS = 450;

/** How long the panel takes to leave before the card starts narrowing. Shorter
 * than EXPAND_MS: a thing arriving wants to be seen, a thing leaving wants to be
 * out of the way. */
const COLLAPSE_MS = 220;

/** The configuration panel's own height, measured in the running page: a header,
 * up to four fields, the price line and the 52px button come to this at every
 * viewport the panel is wide enough for. The row reserves it so that opening a
 * card never moves the section below. */
const PANEL_H = 560;

/** How far the gold frame stands off the selected card.
 *
 * The frame cannot grow outwards: its outer edge already sits on the slot's own
 * bounds, and the slots carry `contain: paint`, which clips every descendant to
 * the slot's padding box. So the frame keeps its size and the card insets inside
 * it — which puts a band of the section's own ground between the gold line and
 * the photograph, and that is what makes it read as a frame around the card
 * rather than a stroke on the card's edge.
 *
 * 4, the smallest step on the scale, and also exactly the strip between two
 * cards, so the air inside the frame matches the air between frames — and it is
 * the inset that makes the outer radius and the photograph's radius agree: 4 of
 * padding around a 6 radius reads as a 10 radius on the outside, which is what
 * the card carries. */
const FRAME = space.hairline;

/** THE CARD'S OWN EDGE. One pixel, and it is always there — only its colour
 * changes, from a decorative hairline at rest to the accent on the open card.
 *
 * ALWAYS PRESENT IS THE WHOLE POINT. The version before this drew the selected
 * card's frame as an absolutely-positioned overlay specifically because a real
 * border appearing on open would add two pixels to the card and the 4:5 tile
 * would turn them into two and a half of height, moving the row and every
 * section under it. A border that never appears or disappears cannot do that,
 * so the overlay is gone and this is a genuine border.
 *
 * It still has to come out of the pinned card width — see the measurement. */
const BORDER = 1;

/** How far the card rises under the pointer.
 *
 * THE ELEVATION BUDGET, and this does spend some of it. The homepage was given
 * exactly one lifted object — the visualiser card — and the range cards
 * deliberately carried a hairline instead. That was the right call when this
 * section was fourteen cards in a scroller; it is the wrong one now that it is
 * four hero products and the page's only selling surface above the visualiser.
 * The lift is small, it is on hover rather than at rest, and the resting shadow
 * stays well under the visualiser's, so the hierarchy is a step rather than a
 * tie. */
const LIFT = 3;

/** THE VIGNETTE — the lighting, and the single most useful thing here.
 *
 * A radial wash, transparent across the middle of the frame and a fifth of ink
 * at the corners, centred slightly above the middle because that is where the
 * window is in every one of these renders. It gives a photograph of a whole room
 * the falloff a studio shot of one object has for free, which is what stops the
 * eye reading the skirting boards.
 *
 * Ink at low alpha rather than black: a pure-black wash greys a warm render, the
 * same reason the shadows are mixed from ink. */
const VIGNETTE =
  'radial-gradient(118% 88% at 50% 42%, rgba(29,29,29,0) 42%, rgba(29,29,29,0.08) 70%, rgba(29,29,29,0.20) 100%)';

/** How far the non-focused cards drop while another is hovered or open. Opacity
 * and saturation together, because either alone is too polite to notice.
 *
 * THESE ARE THE TWO NUMBERS TO TURN if the spotlight is too strong or not strong
 * enough — nothing else in the section needs touching. They were 0.55 and 0.7,
 * which read well on the photographs and badly on the gold buttons: a Shop Now at
 * 55% on a stepped-back card looks disabled rather than recessive, and a visitor
 * who reads three of the four buttons as dead has been told something false. At
 * 0.62 the buttons stay plainly live and the hovered card still clearly wins. */
const DIM_OPACITY = 0.62;
const DIM_SATURATION = 0.75;

// ---------------------------------------------------------------------------
// THE CARD — a clean photograph, then the name underneath it, then the one gold
// action; and when it is open, the configurator beside all of that.
//
// TWO COLUMNS WHEN OPEN, one when shut, AND NO GAP BETWEEN THEM. The panel used
// to be separated from the card by the row's own 4px strip, which made it a
// second object sitting next to the card rather than the card carrying on.
// Flush, with the panel's left corners square and its border gone, the pair
// reads as one shape that has been extended sideways.
// ---------------------------------------------------------------------------
function RangeCard({
  item,
  open,
  ready,
  framed,
  onToggle,
  isMobile,
  isHovered,
  dimmed,
  stacked,
  cardPx,
}: {
  item: CatalogueItem;
  /** Whether this card's configuration panel is showing. One at a time across
   * the whole row — the point of moving the controls off the card is that the
   * visitor reads one set of options rather than four. */
  open: boolean;
  /** True once the width animation has finished. The configurator waits for it —
   * see the note where the panel renders. */
  ready: boolean;
  /** Whether to draw the gold frame. Not the same as `open`: it stays true for
   * the width transition after the card closes, so the frame shrinks back with
   * the card instead of vanishing at full width. */
  framed: boolean;
  onToggle: () => void;
  isMobile: boolean;
  /** Under the pointer. OWNED BY THE ROW rather than by this card, because the
   * row needs to know which card it is to dim the other three — one source of
   * truth beats a local hover here and a second one there. It also means the
   * whole card responds, not just the link: hovering the gold button or the strip
   * of card beside the picture lights the picture, which is what a single object
   * should do. */
  isHovered: boolean;
  /** Another card has the attention — this one steps back. See DIM_OPACITY. */
  dimmed: boolean;
  /** Below the four-up breakpoint the panel goes UNDER the photograph instead of
   * beside it, because there is no second share to put it in. */
  stacked: boolean;
  /** The card's width in pixels, computed from the row's own width. Null until
   * the first measurement, when the card falls back to filling its slot. */
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
  // none of this is reached. It stays because the four are chosen by id above: if
  // one is swapped for a product with no photograph, the tile takes the chosen
  // fabric colour as its ground and draws the mechanism on it, rather than being
  // a charcoal hole in the page. THIS IS ALSO WHY THE PANEL GOES BESIDE THE CARD
  // AND NOT UNDER IT — the card stays in view while you configure, so choosing a
  // colour visibly repaints the tile next to the swatch you just clicked. Above
  // 0.45 luminance the drawing flips to ink, because a warm-white mechanism on a
  // cream fabric is invisible.
  const tileGround = !item.image && chosen?.hex ? chosen.hex : undefined;
  const glyphOnLight = tileGround ? luminance(tileGround) > 0.45 : false;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'stretch',
        height: '100%',
        position: 'relative',
        // THE STANDOFF. The border is on this box and the contents sit in from
        // it, so the edge never touches the photograph or the gold buttons — and
        // the band of card colour between them is what reads as a mount.
        padding: FRAME,
        boxSizing: 'border-box',

        // --- THE CARD ITSELF. See move 1 in the note at the top of this file.
        // White on the section's near-white — 1.06:1, so the box is felt rather
        // than seen, and the photograph stays the only strong thing in it.
        background: tokens.card,
        // Decorative at rest, one step up under the pointer, the accent when the
        // configurator is open. The open card wears the same gold as the action
        // that opened it, which is what ties the pair together without a second
        // element to animate.
        border: `${BORDER}px solid ${
          framed ? tokens.accent : isHovered ? tokens.lineStrong : tokens.lineFaint
        }`,
        borderRadius: radius.lg,

        // --- ELEVATION. See move 2, and LIFT for the budget this spends.
        boxShadow: isHovered ? shadow.lift : shadow.rest,
        transform: isHovered ? `translateY(-${LIFT}px)` : 'translateY(0)',

        // --- THE SPOTLIGHT, from this card's side of it. See move 4.
        opacity: dimmed ? DIM_OPACITY : 1,
        filter: dimmed ? `saturate(${DIM_SATURATION})` : 'none',

        // motion.card carries the transform and the shadow — the site's one
        // duration for a card lifting. The other three are slower on purpose: a
        // border darkening or three cards stepping back should not snap.
        transition: `${motion.card}, border-color 0.3s ease, opacity 0.4s ease, filter 0.4s ease`,
      }}
    >
      {/* THE OPEN CARD WEARS THE ACCENT ON ITS OWN EDGE, and it encloses the card
          and the configurator together because this wrapper IS that combined
          shape — the card column and the panel are its two children. So the edge
          grows with the expansion rather than being a second thing that has to be
          animated in step with it.

          IT OUTLASTS THE CLOSE ON PURPOSE, by `framed` rather than by `open`.
          `open` goes false the moment the id is cleared, which is the moment the
          slot STARTS its 450ms narrowing — so the gold would drop back to a
          hairline at full width while the card was still shrinking. Held for the
          width transition, the close is the open in reverse. */}

      {/* THE CARD IS PINNED TO A PIXEL WIDTH, open or shut, and this is the one
          thing that stops it changing size. Every expression of it as a share of
          the SLOT was wrong, because the slot is what animates:

            Shut it was `100%` and open `50% - gap/2`, and both resolve to the same
            number at rest — but the basis flips on the tick the state changes,
            while the slot is still one share wide. So the card became half a
            share and then grew back as the slot widened. Closing ran it in
            reverse: the id cleared while the slot was still two shares, so the
            card jumped to the full two and shrank. The tile is 4:5, so its height
            followed, and every card and every section below it moved with it.
            That is the glitch, and it was invisible at rest, which is why
            measuring the endpoints did not find it.

          A pixel width cannot be affected by the slot's transition at all.

          LESS THE BORDER AS WELL AS THE PADDING, since the card box gained a real
          edge — see the measurement, and BORDER. */}
      <div
        style={{
          flex: stacked ? '0 0 auto' : cardPx ? `0 0 ${cardPx}px` : '0 0 100%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          // The positioning context for the Visualise badge, which has to sit
          // over the picture from OUTSIDE the link wrapping it.
          position: 'relative',
        }}
      >
        {/* Only the picture and the name are inside the link. The button below
            and the panel beside carry real buttons, and a <button> nested inside
            an <a> is invalid and swallows its own clicks. */}
        <Link
          to={item.to}
          style={{ display: 'block', textDecoration: 'none', flex: '0 0 auto' }}
        >
          {/* The tile carries its own ground, one step off the section's — the
              mount the picture sits in. MONDAY does the same, and it is what
              makes the row read as a set of objects rather than pictures
              floating on a background. */}
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              // ONE STEP INSIDE THE CARD'S RADIUS. Concentric corners: 6 here
              // plus the 4px inset reads as the 10 on the card, so the picture
              // looks mounted in the card rather than pasted over it. It carried
              // the card's own radius before, when it WAS the card.
              borderRadius: radius.md,
              // 4:5 — the site's one portrait ratio, shared with the install
              // strip and the About panel.
              aspectRatio: '4 / 5',
              background: tileGround ?? (item.image ? tokens.band : tokens.charcoal),
              // NO SHADOW HERE ANY MORE. The card carries the elevation now, and
              // a second shadow 4px inside the first drew a seam round the
              // picture instead of lifting anything.
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
                  objectPosition: item.imagePosition ?? 'center',
                  display: 'block',
                  transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                  // THE PICTURE LIGHTS UP RATHER THAN ONLY MOVING. A small lift
                  // in contrast and saturation at rest, a little more under the
                  // pointer — see move 3 in the note at the top. The renders come
                  // in at slightly different temperatures and strengths, and this
                  // is also what pulls the four of them into one set: the same
                  // correction on all four is a shared grade, which is the nearest
                  // thing to art direction that can be applied after the fact.
                  filter: isHovered
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
                  border: `1px solid ${
                    isHovered ? tokens.onDarkEdge : glyphOnLight ? tokens.line : tokens.onDarkLine
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
                  color={glyphOnLight ? tokens.ink : tokens.paper}
                  ground={tileGround ?? tokens.charcoal}
                  opacity={isHovered ? 0.75 : 0.6}
                />
              </div>
            )}

            {/* THE VIGNETTE. See move 3 at the top of the file and the note on
                VIGNETTE itself. Painted over the picture and under nothing, and
                pointer-transparent so it takes no clicks off the link it sits in.

                It lightens under the pointer rather than deepening: the hovered
                card is the one being looked at, so the frame opens up while the
                other three keep their falloff — the vignette and the spotlight
                are the same gesture from two directions. */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background: VIGNETTE,
                opacity: isHovered ? 0.55 : 1,
                pointerEvents: 'none',
                transition: 'opacity 0.5s ease',
              }}
            />
          </div>

          {/* Small caps group, big name — MONDAY's stack in Klay's faces.
              THE GROUP LINE EARNS ITS PLACE NOW, and it did not before. Four
              cards all reading INDOOR is four repetitions of one word; across
              these four it runs INDOOR, INDOOR, OTHER, OUTDOOR, which is the
              section's whole argument stated in four words. */}
          <div
            style={{
              fontFamily: tokens.body,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: tokens.inkSoft,
              marginTop: space.item,
            }}
          >
            {item.group}
          </div>

          <h3
            style={{
              ...typeScale.card,
              // SMALLER ON MOBILE, where a card is most of a 390px viewport but
              // the panel below it is not. "Frameless Shower Screens" at the full
              // card scale wraps to three lines in that width and the type
              // becomes the tallest thing on the card.
              ...(isMobile ? { fontSize: 20 } : null),
              // TWO LINES' WORTH, RESERVED, whether the name needs them or not.
              // The gold buttons are the strongest horizontal line in the section
              // and they have to be ONE line across the row; with the cards
              // sizing to their own content, a single name that wraps drops its
              // button below its neighbours' and the row reads as broken. It
              // costs one line of empty space under the names that fit on one,
              // which is invisible — it is the same warm white as the card.
              minHeight: `${2 * 1.1 * (isMobile ? 20 : 26)}px`,
              color: tokens.ink,
              marginTop: space.tight,
              transition: 'color 0.25s ease',
            }}
          >
            {/* THE NAME IS THE NAME. No price here — the panel prices the actual
                configuration, and a from-figure on the card would be a second,
                vaguer number twenty pixels above a real one. */}
            {item.name}
          </h3>
        </Link>

        {/* Only on the products the visualiser can draw — see `visualise` in
            data/catalogue.ts. Two of these four cards carry it; a wardrobe and
            an awning do not, because the renderer has neither. */}
        {item.visualise && <VisualiseBadge target={item.visualise} name={item.name} />}

        {/* THE ONE ACTION. Gold, full width, and it does not navigate — it opens
            the configuration panel beside this card. */}
        <button
          onClick={onToggle}
          style={{
            marginTop: space.item,
            width: '100%',
            height: 52,
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius.md,
            border: 'none',
            cursor: 'pointer',
            background: open || isHovered ? tokens.accentHover : tokens.accent,
            color: tokens.onAccent,
            ...typeScale.label,
            lineHeight: 1,
            transition: motion.button,
          }}
        >
          {open ? 'Close' : 'Shop Now'}
        </button>
      </div>

      {/* THE PANEL — in the flow, in the space the row just made. It is a flex
          sibling rather than an overlay, so it covers nothing and the
          neighbouring cards genuinely move aside instead of being hidden behind
          it. */}
      {open && (
        <div
          style={{
            // WHATEVER IS LEFT, not a share of its own. Giving the card and the
            // panel half each of a box that also had to hold the gap between
            // them overflowed the slot by exactly one gap. The card is sized
            // first, to precisely one share; the panel takes the remainder, so
            // the two cannot add up to more than the slot at any width.
            flex: stacked ? '1 1 auto' : '1 1 0',
            minWidth: 0,
            marginTop: stacked ? TILE_GAP : 0,
            // EXACTLY THE CARD'S HEIGHT, and this is what enforces it. The panel
            // holds its content in an absolutely-positioned child, so the panel
            // itself has NO intrinsic height — which means the row's height is
            // decided by the card alone, and `align-items: stretch` then hands
            // that height back to the panel. Before this the panel was
            // content-sized and the taller of the two on the products that ask
            // most: the roller measured 559 against a 521 card at 1440.
            position: 'relative',
            background: tokens.card,
            // NO BORDER, AND SQUARE ON THE LEFT. A hairline all the way round
            // drew the panel as its own box; the left edge in particular put a
            // rule down the join it is supposed to be crossing. Radius on the
            // outer two corners only, so the shape ends where the card ends.
            borderRadius: stacked ? `0 0 ${radius.md}px ${radius.md}px` : `0 ${radius.md}px ${radius.md}px 0`,
            overflow: 'hidden',
            // The same shadow the tile carries, and it continues it rather than
            // repeating it: the panel is flush and painted after, so it covers
            // the tile's right-hand shadow and the pair casts one.
            boxShadow: shadow.rest,
            // Fades in once the width has settled, and back out before it
            // narrows — the same move in reverse. Opacity carries both, so a
            // close that interrupts an open just runs from wherever it got to.
            opacity: ready ? 1 : 0,
            transition: `opacity ${COLLAPSE_MS}ms ease`,
          }}
        >
          {/* MOUNTED ONLY ONCE THE EXPANSION IS DONE. Profiled, the click frame
              cost 139ms at 4x throttle, and it was not the animation: it
              persisted identically with every animation disabled via
              prefers-reduced-motion. It is React mounting the fields, the chips
              and up to seventeen swatches on the same frame a layout animation
              starts. Deferring it means the width animates against an empty box.

              THE ABSOLUTE FILL is what lets the panel match the card rather than
              the card's content stretching to match the panel — inset 0 against a
              box whose height came from its sibling. */}
          {ready && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
              {/* NO TITLE BAR, and its 41px is what makes the rest fit. It
                  repeated the product name, which is set at card scale a few
                  pixels to the left and still on screen — the panel is beside the
                  card, not on top of it, so there was nothing to re-establish.
                  Its close button went with it: the card's own gold button reads
                  Close while the panel is open and sits immediately to the left,
                  and Escape still works. */}
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
   * hover and the whole effect simply does not apply — which is correct, not a
   * gap. See move 4 in the note at the top of the file. */
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /** The height the row holds whether a card is open or not, so opening one
   * never moves the section below.
   *
   * A CONSTANT, and measured rather than guessed. The panel is content-sized — a
   * header, up to four fields, a price line and the button — and it comes out at
   * 559px at both 1440 and 1100, because none of that content depends on the
   * viewport once the panel is wide enough not to wrap. The card, being a 4:5
   * tile, DOES shrink with the viewport. So the panel is the taller of the two on
   * a narrow desktop and it is the panel that has to be reserved for.
   *
   * Only where the panel sits BESIDE the card. Stacked, the open slot is the
   * photograph's height plus the panel's and no reserve could cover it without
   * leaving that much empty room at rest. */
  const rowMinHeight = stacked ? undefined : PANEL_H;

  /** THE CARD'S WIDTH IN PIXELS, so nothing about the slot's transition can
   * reach it. See the note where it is applied.
   *
   * COMPUTED FROM THE ROW'S WIDTH, not measured off a slot, and that is the whole
   * point. Reading a closed sibling's offsetWidth looked like the honest source —
   * it is the same calc(), already resolved — and it broke every card but the
   * first. Closing a card clears `openId`, which re-runs this effect IMMEDIATELY,
   * while that slot is still two shares wide and only beginning its 450ms shrink.
   * So it measured two shares, and every card opened after that took its whole
   * slot.
   *
   * The row's own width has no such window. clientWidth rather than offsetWidth
   * because the scrollbar is hidden and it is the content box that a flex child's
   * percentage resolves against. */
  const [cardPx, setCardPx] = useState<number | null>(null);
  useEffect(() => {
    const row = scrollerRef.current;
    if (!row) return;

    // Less the frame's standoff AND the card's border on both sides: the card
    // column sits inside the wrapper's content box, which is the slot less two
    // borders and two paddings.
    const measure = () =>
      setCardPx(sharePx(row.clientWidth, fourUp) - 2 * FRAME - 2 * BORDER);
    measure();
    // The row's width is the only input, so the row is what has to be watched —
    // not the window, which also fires on height changes that cannot affect it.
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, [fourUp]);

  /** THE CLOSE REVERSES THE OPEN, rather than the panel vanishing and the card
   * then shrinking behind it.
   *
   * Opening runs widen, then fade in. Closing has to run fade out, then narrow —
   * so a click cannot simply clear `openId`, which would unmount the panel on the
   * spot and leave the width animating against an empty box. `closing` holds the
   * card open at full width while the panel fades, and only then is the id
   * cleared.
   *
   * Switching straight from one card to another skips the wait: the outgoing
   * panel has somewhere to go, so making the visitor watch it leave first would
   * be a delay with nothing behind it. */
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

  /** WHICH CARD WEARS THE GOLD FRAME. It tracks `openId` on the way in and lags
   * it by the width transition on the way out — clearing the id is what STARTS
   * the 450ms narrowing, so a frame keyed on the id disappears at full width and
   * leaves the card shrinking behind nothing. */
  const [framedId, setFramedId] = useState<string | null>(null);
  useEffect(() => {
    if (openId) {
      setFramedId(openId);
      return;
    }
    const t = window.setTimeout(() => setFramedId(null), EXPAND_MS);
    return () => window.clearTimeout(t);
  }, [openId]);

  /** True once the open card has finished widening. The configurator waits for
   * it, so the width animates against an empty box and the form arrives into one
   * that has stopped moving. */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!openId) {
      setReady(false);
      return;
    }
    const t = window.setTimeout(() => setReady(true), EXPAND_MS);
    return () => window.clearTimeout(t);
  }, [openId]);

  /** BRING THE EXPANDED CARD FULLY INTO VIEW. Opening the rightmost card widens
   * it past the row's right edge — measured on the old fourteen-card version, the
   * panel simply fell off the end. The row nudges itself along by however much is
   * overhanging, and by nothing at all when the card already fits, which at rest
   * with four cards in a four-up row is most of them.
   *
   * AFTER the width transition, not during it. Both a smooth scroll and a
   * flex-basis transition force layout on every frame, and running them together
   * was the jank: profiled at 4x CPU throttle the overlap produced frames of
   * 91ms, 49ms and 242ms clustered in the first 300ms. Sequenced, each is a cheap
   * animation on its own — and it costs nothing in feel, because the card is
   * already visibly expanding during those 450ms. */
  useEffect(() => {
    if (!openId) return;
    const timer = window.setTimeout(() => {
      const row = scrollerRef.current;
      const slot = row?.querySelector<HTMLElement>(`[data-slot="${openId}"]`);
      if (!row || !slot) return;
      // MEASURE AGAINST THE TARGET WIDTH, not the current one — the flex-basis is
      // mid-transition on the frame after the state change, so offsetWidth gives
      // a card partway between one share and two and the nudge lands short.
      //
      // Computed from the same share arithmetic the slot itself uses rather than
      // read off a closed sibling: a sibling is one share, and the open slot is
      // two shares at one breakpoint and three at another, so doubling a sibling
      // under-nudged by a whole share below 1250.
      const n = openShares(fourUp, wideRow);
      const target = sharePx(row.clientWidth, fourUp) * n + (n - 1) * TILE_GAP;
      const over = slot.offsetLeft + target - (row.scrollLeft + row.clientWidth);
      if (over > 0) row.scrollTo({ left: row.scrollLeft + over, behavior: 'smooth' });
    }, EXPAND_MS);
    return () => window.clearTimeout(timer);
  }, [openId, fourUp, wideRow]);

  // Escape closes the panel. A pop-out that can only be dismissed by finding its
  // own X is a pop-out people feel trapped by.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setClosing(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);

  /** ONE CONTAINER FOR THE HEADER AND THE ROW, so the first card's left edge
   * lands on the same vertical line as "Bestsellers" by construction rather than by
   * two paddings that happen to agree. An earlier version had the heading 80px in
   * and the row at 0, which is two different left margins in one section. */
  const inner: React.CSSProperties = {
    maxWidth: layout.gridMax,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: layout.inlinePad(isMobile),
    paddingRight: layout.inlinePad(isMobile),
  };

  return (
    // Warm white, and the 4px strip between the cards is this colour showing
    // through. See TILE_GAP.
    <section style={{ background: tokens.paper }}>
      {/* THE HEADER IS RANGED LEFT WITH THE ACTION OPPOSITE, which is the other
          half of what MONDAY's range section does: heading hard left at display
          scale, the supporting line under it, and one link alone on the right of
          the same band. Centred reads as a caption above a row; ranged left with
          something opposite it reads as a section heading with a decision
          attached.

          Compact, because this is the first section under the hero and every
          pixel the band takes is a pixel of product pushed below the fold. */}
      <div
        style={{
          ...inner,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          justifyContent: 'space-between',
          gap: space.group,
          padding: isMobile
            ? `${space.section}px ${layout.inlinePad(isMobile)}px ${space.group}px`
            : `${space.band}px ${layout.inlinePad(isMobile)}px ${space.group}px`,
        }}
      >
        <div>
          {/* THIS WAS "The collection" / "Our Range" AND THAT WAS THE PROBLEM.
              The section is four products and the catalogue is fourteen, so a
              heading claiming to be THE RANGE was competing with the section
              that actually is it: "Our Range" over four cards, then "The full
              range" over ten more, in that order down the page. Naming these as
              the ones that sell most answers why these four and not the others,
              and leaves the full range unambiguously the place you go to see
              everything. */}
          <p style={{ ...eyebrow, marginBottom: space.item }}>Most asked for</p>
          <h2 style={{ ...headline.section, color: tokens.ink }}>Bestsellers</h2>
          <p style={{ ...supporting.onLight, marginTop: space.item, maxWidth: 460 }}>
            Made to measure. Installed by experts.
          </p>
        </div>
        {/* DESKTOP ONLY, HERE. On mobile the header is a column, so Shop All
            landed directly under the supporting line and ABOVE the row — a
            full-width gold button asking the visitor to leave for the shop
            before they had been shown a single product. It moves below the
            cards, where it means "and there is more", which is what it is for. */}
        {!isMobile && <CtaLink to="/products">Shop the full range</CtaLink>}
      </div>

      {/* THE SAME CONTAINER AS THE HEADER ABOVE IT, and the padding is on THIS
          box rather than on the scroller inside it. That is not tidiness:
          padding on a scroll container sits at the start and end of the
          scrollable CONTENT, so it would slide away with the row instead of
          holding the edges — and with scroll snapping on, the browser also
          snaps the first card to the scrollport edge and silently scrolls past
          a start padding, leaving the first card flush against the viewport
          while the heading above it is correctly inset. */}
      <div
        style={{
          ...inner,
          position: 'relative',
          // Closes the section. Deliberately thin: this is a margin finishing a
          // section rather than a gap between two, so it is closer in weight to
          // the 4px strips framing the cards than to the padding a real section
          // carries.
          paddingBottom: space.item,
        }}
      >
        <div
          ref={scrollerRef}
          className="klay-hscroll"
          style={{
            display: 'flex',
            gap: TILE_GAP,
            // AT REST THIS DOES NOT SCROLL. Four cards at one share each is
            // exactly the row, so there is no overflow and no scrollbar until a
            // card is opened and its slot takes two shares. Below the four-up
            // breakpoint the row shows 1.8 cards and does scroll, which is what
            // the sliver of the second card is there to say.
            overflowX: 'auto',
            // THE SECTION RESERVES ITS OPEN HEIGHT, so the page below never
            // moves when a card is opened. `alignItems: flex-start` is what stops
            // the reserve stretching the closed cards to fill it — they keep
            // their own height and the spare sits underneath.
            minHeight: rowMinHeight,
            alignItems: 'flex-start',
            // Snaps to card edges so the row never rests showing two half cards,
            // however it was moved. Off while a card is open — see the slot.
            scrollSnapType: openId ? 'none' : 'x mandatory',
          }}
        >
          {RANGE.map(item => {
            const open = openId === item.id;
            return (
              <div
                key={item.id}
                // THE ANIMATION IS THE LAYOUT. Opening a card widens its slot
                // from one share to two, and because these are flex siblings in a
                // row every card after it slides along by exactly that much — no
                // card is covered and no space is wasted. Transitioning
                // flex-basis is what makes the row move rather than jump.
                data-slot={item.id}
                // CONTAINMENT. The flex-basis transition changes this box every
                // frame, and without a containment boundary the browser has to
                // consider the whole row's subtree each time. Measured at 432
                // style recalculations for a single card opening before this.
                className="klay-slot"
                style={{
                  flex: `0 0 ${open ? cardBasisOpen(fourUp, wideRow) : cardBasis(fourUp)}`,
                  // SNAP OFF WHILE OPEN. Mandatory snapping and a programmatic
                  // scroll fight each other — the browser re-snaps to the nearest
                  // card edge and undoes the nudge that was bringing the open
                  // card into view. It comes back the moment the panel closes.
                  scrollSnapAlign: open ? 'none' : 'start',
                  transition: `flex-basis ${EXPAND_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                }}
                // ON THE SLOT, NOT THE CARD. The card lifts and translates on
                // hover, and a pointer sitting in the 3px it vacates would leave
                // and re-enter it forever — the handler has to be on a box that
                // does not move.
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <RangeCard
                  item={item}
                  open={open}
                  ready={open && ready && !closing}
                  framed={framedId === item.id}
                  isMobile={isMobile}
                  // The open card keeps the pointer treatment for as long as it is
                  // open, whether or not the pointer is still on it: it is plainly
                  // the card being worked on, and letting it drop back to a resting
                  // hairline while its own configurator is showing reads as the
                  // card having been abandoned.
                  isHovered={hoveredId === item.id || open}
                  // AN OPEN CARD OUTRANKS A HOVERED ONE. While one is open the
                  // other three stay back regardless of where the pointer is,
                  // because the visitor is configuring something and a card
                  // brightening under a stray pointer is a distraction from it.
                  dimmed={openId ? !open : Boolean(hoveredId) && hoveredId !== item.id}
                  stacked={stacked}
                  cardPx={cardPx}
                  onToggle={() => toggle(item.id)}
                />
              </div>
            );
          })}
        </div>

        {/* Mobile's Shop All, under the four rather than over them. Ranged left
            with the cards, not centred — it is the same object that sits at the
            end of the header row on desktop, so it keeps the same alignment. */}
        {isMobile && (
          <div style={{ paddingTop: space.group }}>
            <CtaLink to="/products">Shop the full range</CtaLink>
          </div>
        )}
      </div>
    </section>
  );
}
