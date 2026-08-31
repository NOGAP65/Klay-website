// ---------------------------------------------------------------------------
// 5. The visualiser — the centrepiece, and the only section on the page that
// does real work.
//
// Everything here is layout and commerce. The rendering engine is untouched:
// KlayConfigurator owns the canvas, its three states and the photo upload;
// VisualiserControls owns the configuration fields; useVisualiserStore holds
// the configuration. This file adds the two things a homepage embed needs and
// those files have no business knowing about — how many windows the customer
// is buying, and the path from a configuration to a cart line.
//
// ON QUANTITY — AND WHY IT IS NO LONGER JUST A QUANTITY.
//
// `windows` was local state here, one number, on the reasoning that a quantity
// belongs to the order rather than the design. That holds right up until the
// customer has two windows and wants them different, which is the ordinary case
// — a blockout in the bedroom and a sunscreen in the lounge is one job, not two
// visits. So the job now lives in the store as an array of WindowConfig, and
// this file's part is the UI over it: how many windows, which one you are
// editing, and the path from the finished job to a cart line.
//
// The order of the panel is deliberate and it changed. Number of windows comes
// FIRST, because it is the question that decides how many times every question
// under it gets asked — it used to sit at the very bottom, under the price box,
// which put the quantity after the number it multiplies. The price comes LAST,
// under everything that feeds it, and the button is attached to it.
//
// THE WHOLE SECTION IS THE CARD. The action used to sit on its own row below the
// card, centred on both columns; it is inside the control column now, directly
// under the price it is charging. That row cost a button, a quote link and a 32px
// margin of page while the price box sat in the card's bottom-left corner with
// nothing beneath it — the two halves of one decision as far apart as the layout
// could put them.
// ---------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { radius, tokens, layout, motion, space, type as typeScale, shadow } from '@/ds';

import { productByBlindType } from '../../data/products';
import { useIsMobile } from '../../hooks/useIsMobile';
import { bookingLink } from '../../lib/bookingLink';
import { formatAUD } from '../../lib/pricing';
import { useCartStore } from '../../store/cartStore';
import KlayConfigurator from '../../visualiser/KlayConfigurator';
import {
  MAX_WINDOWS,
  type JobWindow,
  priceWindow,
  useVisualiserStore,
  type ProductCategory,
} from '../../visualiser/useVisualiserStore';
import VisualiserControls, { Field, GroupHeading, PriceBox } from '../../visualiser/VisualiserControls';

import { CtaButton, CtaLink, SectionBand, TextLink, useHover } from './primitives';

/** Where a curtain enquiry goes. Curtains are configurable here and in the
 * visualiser page, but they are not buyable anywhere on the site: every curtain
 * subcategory in data/categories.ts is available:false, and ProductsPage already
 * resolves all of them to this same form. Sending them to the cart instead would
 * be the one place on the site that pretends otherwise — and CartItem could not
 * describe the order anyway, since it has no mount, no wave-fold heading and a
 * windowSize that stops at large where curtains go to XL. */
const CURTAIN_ENQUIRY = '/contact';

/** The selected lozenge on THIS card. Every control in this file sits on the ink
 * card and nowhere else, so unlike VisualiserControls' skin() there is no light
 * variant to carry — but the values have to be the same ones that panel resolves
 * to on dark, or the tabs and the pills six pixels below them would disagree
 * about what "selected" looks like.
 *
 * Paper fill, ink label. It was `fillStrong` on `onFillStrong`, which is ink on
 * paper — an ink lozenge on the ink card, i.e. no lozenge. */
const SELECTED = {
  background: tokens.paper,
  color: tokens.ink,
  border: tokens.paper,
} as const;

/** Blinds / Curtains, at the top of the control panel.
 *
 * VisualiserPage has its own version of this and keeps it: that one is written
 * for a cream sidebar and fills the active tab with ink, which on this card
 * would be an invisible tab on an identical ground. This one uses the panel's
 * own selection language instead — SELECTED for the active tab, hairline and
 * muted text for the other — so it reads as the first field of the form rather
 * than as a widget above it.
 *
 * It has to exist for curtains to be reachable at all. VisualiserControls only
 * renders its curtain branch when the store's category is already 'curtain', and
 * nothing on the homepage could set that before this. */
function CategoryTabs() {
  const { productCategory, setProductCategory } = useVisualiserStore();
  const tabs: { id: ProductCategory; label: string }[] = [
    { id: 'blind', label: 'Blinds' },
    { id: 'curtain', label: 'Curtains' },
  ];

  return (
    <div style={{ display: 'flex', gap: space.xxs }}>
      {tabs.map(tab => {
        const active = productCategory === tab.id;
        return (
          <button
            key={tab.id}
            aria-pressed={active}
            onClick={() => setProductCategory(tab.id)}
            style={{
              flex: 1,
              padding: `${space.sm}px`,
              borderRadius: radius.md,
              fontFamily: tokens.body,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: `1px solid ${active ? SELECTED.border : tokens.onDarkEdge}`,
              background: active ? SELECTED.background : 'transparent',
              color: active ? SELECTED.color : tokens.onDarkMuted,
              transition: motion.button,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** Square stepper button. Same selection language as the configurator's own
 * pills — hairline at rest, the SELECTED lozenge on hover — so the row reads as
 * part of the control panel above it rather than as something bolted on. */
function StepButton({
  label,
  ariaLabel,
  disabled,
  onClick,
}: {
  label: string;
  ariaLabel: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const { hover, bind } = useHover();
  const active = hover && !disabled;
  return (
    <button
      {...bind}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      style={{
        // 32 x 32, on the scale and matching the pill height beside it.
        width: 32,
        height: 32,
        borderRadius: radius.md,
        // On the black card, so the hairline and the glyph both invert, and the
        // hover fill is the same lozenge every selected control in the panel
        // wears.
        border: `1px solid ${active ? SELECTED.border : tokens.onDarkEdge}`,
        background: active ? SELECTED.background : 'transparent',
        color: active ? SELECTED.color : tokens.onDarkMuted,
        fontFamily: tokens.body,
        fontSize: 15,
        lineHeight: 1,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: motion.button,
      }}
    >
      {label}
    </button>
  );
}

/** The real Field from VisualiserControls now, not a hand-copy of its label
 * markup — the copy that used to be here had already drifted from the original's
 * caption weight. */
function WindowCount({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    // No caption. Field's caption states the chosen value beside the label,
    // which for a stepper is the number already sitting between its two
    // buttons — "Number of windows … 1 window" over a control reading "1" is
    // the same fact three times.
    <Field onDark label="Number of windows">
      <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
        <StepButton
          label="−"
          ariaLabel="One window fewer"
          disabled={value <= 1}
          onClick={() => onChange(Math.max(1, value - 1))}
        />
        {/* Inter, not Cormorant. Cormorant Garamond's "1" is a bare stem with
            no base flag, which at this size is indistinguishable from a capital
            I — a quantity that reads as a letter is worse than a quantity in
            the body face. */}
        <span
          style={{
            ...typeScale.body,
            fontWeight: 500,
            color: tokens.paper,
            minWidth: space.md,
            textAlign: 'center',
          }}
        >
          {value}
        </span>
        <StepButton
          label="+"
          ariaLabel="One window more"
          disabled={value >= MAX_WINDOWS}
          onClick={() => onChange(Math.min(MAX_WINDOWS, value + 1))}
        />
      </div>
    </Field>
  );
}

/** Which window the panel is editing and the canvas is showing.
 *
 * This is the affordance the section was missing: the configurator could only
 * ever describe ONE window, so a job of three was three copies of whatever the
 * customer happened to leave on screen. It only appears above one window —
 * a single tab reading "1" is a control that cannot do anything.
 *
 * Numbers, not "Window 1", because at 30% of the card the labels would wrap
 * before the third tab; the Field label above says what the numbers are, and
 * the caption names the one that is selected in full. */
function WindowPicker({
  windows,
  active,
  matched,
  onSelect,
  onMatchAll,
}: {
  windows: JobWindow[];
  active: number;
  matched: boolean;
  onSelect: (index: number) => void;
  onMatchAll: () => void;
}) {
  const count = windows.length;
  return (
    <Field onDark label="Customising" caption={`Window ${active + 1} of ${count}`}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: space.xxs }}>
        {windows.map((w, i) => {
          const isActive = i === active;
          // Window 1 leads, so its own flag is meaningless — it is never dotted,
          // and it is not announced as following itself.
          const onItsOwn = i > 0 && w.customised;
          const follows = i > 0 && !w.customised;
          return (
            <button
              key={i}
              aria-pressed={isActive}
              aria-label={
                `Customise window ${i + 1}` +
                (onItsOwn ? ' (customised)' : follows ? ' (following window 1)' : '')
              }
              onClick={() => onSelect(i)}
              style={{
                // 32 square, the pill height and the stepper's — this row sits
                // between the two and cannot be a third size.
                position: 'relative',
                width: 32,
                height: 32,
                borderRadius: radius.md,
                border: `1px solid ${isActive ? SELECTED.border : tokens.onDarkEdge}`,
                background: isActive ? SELECTED.background : 'transparent',
                color: isActive ? SELECTED.color : tokens.onDarkMuted,
                ...typeScale.label,
                letterSpacing: 'normal',
                textTransform: 'none',
                lineHeight: 1,
                cursor: 'pointer',
                transition: motion.button,
              }}
            >
              {i + 1}
              {/* A window that has left window 1 gets a dot. Without it the tabs
                  are identical and there is nothing on screen to say which
                  windows a change to window 1 is about to move — which is the
                  one thing about this control that could surprise someone. */}
              {onItsOwn && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: isActive ? SELECTED.color : tokens.onDarkMuted,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Says what the dots mean, and only while something on screen has one.
          Sentence case, not micro: typeScale.micro is uppercase and letter-
          spaced — the same treatment as GroupHeading — so as a hint it read as a
          fourth section heading sitting inside the third one. */}
      {!matched && (
        <div
          style={{
            ...typeScale.label,
            letterSpacing: 'normal',
            textTransform: 'none',
            fontWeight: 400,
            color: tokens.onDarkMuted,
            marginTop: space.sm,
          }}
        >
          Dotted windows keep their own settings
        </div>
      )}

      {/* Only offered once the windows actually differ, because on a job that
          already matches it is a button that does nothing. It is the way back
          from a per-window job to a uniform one: twelve windows on one fabric
          would otherwise be the same six choices made twelve times. */}
      {!matched && (
        <button
          onClick={onMatchAll}
          style={{
            marginTop: space.xs,
            padding: 0,
            background: 'none',
            border: 'none',
            ...typeScale.label,
            letterSpacing: 'normal',
            textTransform: 'none',
            fontWeight: 400,
            color: tokens.onDarkMuted,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            cursor: 'pointer',
          }}
        >
          Match every window to this one
        </button>
      )}
    </Field>
  );
}

export function VisualiserShowcase() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const addItem = useCartStore(s => s.addItem);
  const {
    // The flat fields are the ACTIVE window — see the store's own note. They are
    // what the booking link travels on.
    blindType,
    fabricColour,
    hardwareColour,
    windowSize,
    operation,
    productCategory,
    windows,
    activeWindow,
    setWindowCount,
    setActiveWindow,
    applyActiveToAll,
    windowsMatch,
    getJobTotal,
  } = useVisualiserStore();

  const isCurtain = productCategory === 'curtain';
  const count = windows.length;
  // The whole job, each window on its own configuration and its own category's
  // pricing axis. It was unitPrice * windows, which is only the same number
  // while every window matches — and they no longer have to.
  const jobTotal = getJobTotal();

  const handleBuyNow = () => {
    // One cart line per window, each described and priced from ITS OWN config.
    // The cart keys lines by configuration and increments, so three matching
    // windows still land as one line of quantity 3 while a differently
    // configured fourth gets a line of its own.
    //
    // 'blind' is not a guess: this button only renders for blinds, because a
    // curtain is enquiry-only — see CURTAIN_ENQUIRY.
    windows.forEach(w => {
      // The catalogue entry for the configured blind type — the cart line needs a
      // product name and a display type, and this is where the visualiser's
      // vocabulary maps back onto the four things Klay actually sells.
      const product = productByBlindType(w.blindType);
      addItem({
        name: product?.name ?? 'Custom Blind',
        type: product?.type ?? 'Roller Blind',
        blindType: w.blindType,
        fabricColour: w.fabricColour,
        hardwareColour: w.hardwareColour,
        windowSize: w.windowSize,
        operation: w.operation,
        price: priceWindow(w, 'blind'),
      });
    });
    // Straight to the cart, because the button says Buy Now. When it read "Add to
    // Cart" the right behaviour was the opposite — confirm in place and leave the
    // customer on a configuration they might still want to adjust — but a Buy Now
    // that silently banks the order and leaves you looking at the same screen
    // reads as a button that did nothing.
    navigate('/cart');
  };

  return (
    // INVERTED. This was ink — the page's one near-black ground — carrying a
    // bright cream card, on the reasoning that the deepest ground under the
    // brightest panel is what marks the centrepiece. The pairing still holds; it
    // is the assignment that has swapped. The card is the black object now and
    // the section is the white it sits on, which puts the contrast on the
    // instrument itself rather than on the band around it.
    //
    // PARCHMENT, NOT CREAM — cream is retired as a section ground.
    //
    // Measured, cream sits at luminance 0.935 and warm white at 0.890: 4.5%
    // apart, which is the same ground to the eye. The site has two perceptually
    // distinct light grounds, not three, and the token's own comment says what
    // cream is actually for — "cards sitting on parchment". Using it as a band
    // was spending a card colour on a section.
    //
    // The join this was guarding is still guarded: the install strip below is
    // warm white and the range row above is warm white, so parchment separates
    // from both. No two adjacent sections share a ground.
    <section id="visualiser" style={{ background: tokens.band }}>
      {/* The same band as the category and range sections, from the same
          component, so the page's three big sections are introduced identically
          rather than in three slightly different voices. It supplies this
          section's top padding, which is why the section itself no longer carries
          any — the band's own 76px is the rhythm now.

          It is the one band that takes a sub. This is the only section on the
          page that has to tell you how to use it; above a wall of photographs the
          same line would be explaining a picture. */}
      <SectionBand
        label="The Klay visualiser"
        title={
          <>
            See it in your home <span style={{ fontStyle: 'italic' }}>before you buy.</span>
          </>
        }
        sub="Upload a photo of your window and configure in real time."
        isMobile={isMobile}
      />

      {/* Two elements, not one: the inset lives on the outer and the cap on the
          inner. Putting both on one div made the cap include the padding — every
          global box-sizing is border-box here — which quietly took 160px off the
          card and 100px off the canvas the moment this section moved to a band. */}
      {/* No horizontal padding on desktop any more. The card sizes itself at 75%
          of the viewport now, so an 80px inset either side would be measuring
          that 75% against a container the padding had already narrowed — the
          card would land at 75% of 1280 on a 1440 screen, not 75% of 1440. */}
      <div style={{ padding: isMobile ? `0 ${space.md}px ${space.xl}px` : `0 0 ${space.xxl}px` }}>
        <div
          style={{
            // 75% of the screen, centred. Capped at gridMax so the card cannot
            // become the one element on the page that ignores the layout system
            // — and the cap is not reached until 1920, so every ordinary desktop
            // width gets the full 75%.
            width: isMobile ? '100%' : '75%',
            maxWidth: isMobile ? undefined : layout.gridMax,
            margin: '0 auto',
          }}
        >
        {/* ONE CARD, two columns at 30/70. Both columns share the card's ink
            ground and its radius, so the controls read as part of the same
            instrument as the render rather than as a form sitting next to a
            picture. The canvas keeps its own charcoal box — that is
            KlayConfigurator's and it is left alone — which on an ink card now
            reads as a screen set very slightly proud of the panel around it
            rather than as the dark hole it was against cream.

            The controls take `onDark` for the same reason. They are the one
            thing in here with no colour of their own, so on a black card every
            label, hairline and unselected pill has to be told to invert; the
            flag is opt-in, and the three other places that embed this panel are
            all still on cream and still pass nothing.

            Controls are first in the DOM so they come first to a screen reader
            and to anyone tabbing in; `order` puts the canvas above them on a
            phone, where a column of fields before any picture would bury the one
            thing this section exists to show. */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: space.lg,
            alignItems: 'stretch',
            // The black rectangle. Ink rather than charcoal — charcoal is the
            // page's ordinary dark and is already doing that job in the nav, the
            // steps bar and the canvas box inside this very card. Ink is a step
            // deeper, which is what lets the canvas box read as a screen set into
            // the card rather than as the same surface continuing.
            background: tokens.ink,
            // No border. It was a hairline of ink at 0.08, which existed to lift
            // a cream card off a parchment ground one step away from it. The
            // black card separates completely on its own, and the hairline would
            // only muddy the edge that is now doing the work.
            borderRadius: radius.lg,
            padding: isMobile ? space.md : space.lg,
            // THE ONE ELEVATED OBJECT ON THE PAGE. Four shadow tokens were
            // declared and nothing consumed any of them, so nothing on the
            // homepage sat ON the surface rather than in it. One raised object
            // on a flat page is read as the most important thing on it, which is
            // the cheapest hierarchy available and costs one property — and this
            // is the section the page is built around. Deliberately nowhere else
            // on the homepage: a second lifted card halves the value of this one.
            boxShadow: shadow.rest,
          }}
        >
          <div
            style={{
              flex: isMobile ? '1 1 auto' : '0 0 30%',
              width: '100%',
              order: isMobile ? 2 : 1,
              display: 'flex',
              flexDirection: 'column',
              // flex-start with ONE pocket of slack, not space-between.
              //
              // space-between divided every pixel the panel did not need into
              // equal gaps between its blocks — so the rhythm of the column
              // depended on the height of the canvas beside it, and the gap
              // between the tabs and the first group was whatever was left over
              // rather than a number anyone chose. Two different browser widths
              // gave two different panels.
              //
              // Now every gap is space.lg, matching the between-group step the
              // controls use in compact mode, and all the slack is collected in
              // the one place it reads as deliberate: above the price box, which
              // takes marginTop auto below and sits on the canvas's bottom edge.
              justifyContent: 'flex-start',
              gap: space.lg,
            }}
          >
            <CategoryTabs />

            {/* THE JOB, FIRST. How many windows decides how many times every
                question below it gets asked, so it cannot come after them — and
                it certainly cannot come after the price, which is where it was.
                The picker under it is what makes the windows individually
                configurable at all. */}
            <section>
              <GroupHeading onDark>Your windows</GroupHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
                <WindowCount value={count} onChange={setWindowCount} />
                {count > 1 && (
                  <WindowPicker
                    windows={windows}
                    active={activeWindow}
                    matched={windowsMatch()}
                    onSelect={setActiveWindow}
                    onMatchAll={applyActiveToAll}
                  />
                )}
              </div>
            </section>

            {/* showCurtainControls is what lets the panel switch branches at all
                — without it the tabs would move the store and the renderer but
                leave blind fields on screen.
                showPrice=false because the job total belongs below, under every
                window control that feeds it. */}
            <VisualiserControls compact onDark showCurtainControls showPrice={false} />

            {/* THE CLOSE: what it costs, then the button that buys it, as one
                block at the foot of the column.

                The action used to sit BELOW THE CARD, centred on the whole
                instrument, on the reasoning that it belonged to both columns
                rather than either. What that actually bought was a third row of
                page — button, quote link and a 32px margin — under a card that
                already had a price box sitting in its bottom-left corner with
                nothing beneath it. The two halves of one decision were as far
                apart as the layout could put them.

                Price and action are the same thought, so they are now the same
                block, and the whole thing takes the marginTop:auto the price box
                had on its own. */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: space.md,
                marginTop: isMobile ? undefined : 'auto',
              }}
            >
              <PriceBox
                onDark
                amount={jobTotal}
                note={
                  count === 1
                    ? '+ installation across Australia'
                    : `${count} windows + installation across Australia`
                }
              />

              {/* The action splits by category, because only one of the two can
                  be bought. A curtain gets an enquiry — see CURTAIN_ENQUIRY — and
                  no second link under it, since a quote link below a quote button
                  is the same destination twice.

                  Blinds are unchanged: Buy Now, the same words as every tile on
                  the page, with the price on the label because this is the only
                  one of them that knows what the thing costs — a bare "Buy Now"
                  under a configured render would hide the number the customer
                  just built.

                  FULL WIDTH, not minWidth 280. In a 30% column 280px is wider
                  than the space at some breakpoints, and `whiteSpace: nowrap` on
                  ctaBase means it would not have wrapped — it would have pushed
                  the column open and thrown the card's two-column split out.
                  100% lets the label set the constraint instead: at the narrowest
                  desktop column it is the button that is measured, not the
                  layout. */}
              {isCurtain ? (
                <CtaLink to={CURTAIN_ENQUIRY} style={{ width: '100%' }}>
                  Enquire — from {formatAUD(jobTotal)}
                </CtaLink>
              ) : (
                <>
                  <CtaButton onClick={handleBuyNow} style={{ width: '100%' }}>
                    Buy Now — {formatAUD(jobTotal)}
                  </CtaButton>
                  {/* onDark, AND IT IS NOT OPTIONAL NOW. This link was on the
                      parchment under the card and took the light treatment; on
                      the ink card the same default resolves to near-black text on
                      a near-black ground. Centred under the button rather than
                      beside it — there is no room for a row in this column.

                      /book quotes ONE configuration, so a job whose windows
                      differ travels as the window on screen times the window
                      count. That is the honest limit of a shareable URL of four
                      short params, and it is a measure appointment at the other
                      end — the installer prices what they measure. The common
                      case is unaffected: growing the job clones window 1, so the
                      windows match unless one was deliberately changed. */}
                  <div style={{ textAlign: 'center' }}>
                    <TextLink
                      onDark
                      accent
                      to={bookingLink({
                        blindType,
                        windowSize,
                        operation,
                        quantity: count,
                        fabricColour,
                        hardwareColour,
                      })}
                    >
                      or get a free quote →
                    </TextLink>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Centred vertically, because the two columns are no longer the same
              height and cannot be made so. The canvas is WIDTH-limited — it caps
              at the photo's aspect ratio against this column, 717px at a 1512
              viewport, well under the 84vh it is allowed — while the control
              column is as tall as its fields, now around 890. Left at the top of
              a stretched column the render sat above ~170px of empty card, which
              read as the card having been built for a taller picture. Centred,
              the same slack becomes even margin above and below it. */}
          <div
            style={{
              flex: '1 1 auto',
              width: '100%',
              minWidth: 0,
              order: isMobile ? 1 : 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            {/* KlayConfigurator caps its own width at mediaMaxVh x the photo's
                aspect ratio. Its 72vh default was tuned for a full-height page
                and leaves the render floating inside the column here; 84 fills
                the 70% column now that the card's padding has taken some of it. */}
            <KlayConfigurator mediaMaxVh={84} />
          </div>
        </div>

        {/* NOTHING BELOW THE CARD. The card is the whole section now — see the
            note on the price-and-action block inside the control column. */}
        </div>
      </div>
    </section>
  );
}
