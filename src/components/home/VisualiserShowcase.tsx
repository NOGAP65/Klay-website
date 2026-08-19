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
// ON QUANTITY. `windows` is local state, not store state. The store models one
// configuration, and every consumer of it (the canvas, the price box, the
// booking link) is correct to read it that way; a quantity belongs to the
// order, not the design. It reaches the cart by calling addItem once per
// window — the cart keys lines by configuration and increments, so N identical
// windows land as one line of quantity N.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens, layout, motion, space, type as typeScale, shadow } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useCartStore } from '../../store/cartStore';
import { productByBlindType } from '../../data/products';
import { bookingLink } from '../../lib/bookingLink';
import KlayConfigurator from '../../visualiser/KlayConfigurator';
import VisualiserControls from '../../visualiser/VisualiserControls';
import { useVisualiserStore, type ProductCategory } from '../../visualiser/useVisualiserStore';
import { CtaButton, CtaLink, SectionBand, TextLink, useHover } from './primitives';

const MAX_WINDOWS = 12;

/** Where a curtain enquiry goes. Curtains are configurable here and in the
 * visualiser page, but they are not buyable anywhere on the site: every curtain
 * subcategory in data/categories.ts is available:false, and ProductsPage already
 * resolves all of them to this same form. Sending them to the cart instead would
 * be the one place on the site that pretends otherwise — and CartItem could not
 * describe the order anyway, since it has no mount, no wave-fold heading and a
 * windowSize that stops at large where curtains go to XL. */
const CURTAIN_ENQUIRY = '/contact';

/** Matches the RADIUS the visualiser's own surfaces use, so the card and the
 * canvas box inside it agree rather than being 2px and 12px apart. */
const CARD_RADIUS = 2;

/** Blinds / Curtains, at the top of the control panel.
 *
 * VisualiserPage has its own version of this and keeps it: that one is written
 * for a cream sidebar and fills the active tab with ink, which on this card
 * would be an invisible tab on an identical ground. This one uses the panel's
 * own selection language instead — gold fill with ink on it for the active tab,
 * hairline and muted text for the other — so it reads as the first field of the
 * form rather than as a widget above it.
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
              borderRadius: 2,
              fontFamily: tokens.body,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: `1px solid ${active ? tokens.gold : tokens.onDarkEdge}`,
              background: active ? tokens.gold : 'transparent',
              color: active ? tokens.ink : tokens.onDarkMuted,
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
 * pills — hairline at rest, gold on hover — so the row reads as part of the
 * control panel above it rather than as something bolted on. */
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
        borderRadius: 2,
        // On the black card now, so the hairline and the glyph both invert. The
        // hover fill does not: gold with ink on it is the selection language the
        // pills next to this use, and it holds on either ground.
        border: `1px solid ${active ? tokens.gold : tokens.onDarkEdge}`,
        background: active ? tokens.gold : 'transparent',
        color: active ? tokens.ink : tokens.onDarkMuted,
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

function WindowCount({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: space.sm,
          marginBottom: space.xs,
        }}
      >
        {/* Matched to VisualiserControls' own Field labels — this row sits
            directly under them and has to read as one more field, not as a
            different component that happens to be nearby. */}
        <span style={{ ...typeScale.label, letterSpacing: 'normal', textTransform: 'none', color: tokens.warmWhite }}>
          Number of windows
        </span>
        <span style={{ ...typeScale.label, letterSpacing: 'normal', textTransform: 'none', fontWeight: 400, color: tokens.onDarkMuted }}>
          {value === 1 ? '1 window' : `${value} windows`}
        </span>
      </div>
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
            color: tokens.warmWhite,
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
    </div>
  );
}

export function VisualiserShowcase() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [windows, setWindows] = useState(1);

  const addItem = useCartStore(s => s.addItem);
  const {
    blindType,
    fabricColour,
    hardwareColour,
    windowSize,
    operation,
    productCategory,
    getCurrentPrice,
    getCurtainPrice,
  } = useVisualiserStore();

  const isCurtain = productCategory === 'curtain';
  // The two categories price on different axes — a curtain off CURTAIN_BASE_PRICES
  // and its own motor add, a blind off pricePerBlind. Reading the blind figure
  // while the panel is showing curtain controls is how the button and the price
  // box immediately above it end up quoting two different numbers.
  const unitPrice = isCurtain ? getCurtainPrice() : getCurrentPrice();

  const handleBuyNow = () => {
    // The catalogue entry for the configured blind type — the cart line needs a
    // product name and a display type, and this is where the visualiser's
    // vocabulary maps back onto the four things Klay actually sells.
    const product = productByBlindType(blindType);
    const line = {
      name: product?.name ?? 'Custom Blind',
      type: product?.type ?? 'Roller Blind',
      blindType,
      fabricColour,
      hardwareColour,
      windowSize,
      operation,
      price: unitPrice,
    };
    for (let i = 0; i < windows; i += 1) addItem(line);
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
    <section id="visualiser" style={{ background: tokens.parchment }}>
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
            borderRadius: CARD_RADIUS,
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
              // space-between, not centre. Centred, the height the controls did
              // not need was split into a dead band above the panel and another
              // below it — about 31px each once the tabs were added, and a good
              // deal more before that. Spread instead, the tabs sit on the
              // canvas's top edge and the window stepper on its bottom, so the
              // configuration is as tall as the thing it configures and the
              // slack becomes breathing room between groups rather than two
              // margins doing nothing.
              justifyContent: isMobile ? 'flex-start' : 'space-between',
              gap: isMobile ? 16 : 22,
            }}
          >
            <CategoryTabs />
            {/* showCurtainControls is what lets the panel switch branches at all
                — without it the tabs would move the store and the renderer but
                leave blind fields on screen. */}
            <VisualiserControls compact onDark showCurtainControls />
            <WindowCount value={windows} onChange={setWindows} />
          </div>

          <div style={{ flex: '1 1 auto', width: '100%', minWidth: 0, order: isMobile ? 1 : 2 }}>
            {/* KlayConfigurator caps its own width at mediaMaxVh x the photo's
                aspect ratio. Its 72vh default was tuned for a full-height page
                and leaves the render floating inside the column here; 84 fills
                the 70% column now that the card's padding has taken some of it. */}
            <KlayConfigurator mediaMaxVh={84} />
          </div>
        </div>

        {/* The conversion line, below the card and centred on it: the button
            belongs to the whole instrument, not to either column. Button and
            quote link sit on one row, the link beside the button rather than
            under it, so the section closes on a single line. */}
        <div
          style={{
            marginTop: isMobile ? 32 : 44,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? 20 : 28,
          }}
        >
          {/* The action splits by category, because only one of the two can be
              bought. A curtain gets an enquiry — see CURTAIN_ENQUIRY — and no
              second link beside it, since a quote link next to a quote button is
              the same destination twice.

              Blinds are unchanged: Buy Now, the same words as every tile on the
              page, with the price on the label because this is the only one of
              them that knows what the thing costs — a bare "Buy Now" under a
              configured render would hide the number the customer just built. */}
          {isCurtain ? (
            <CtaLink to={CURTAIN_ENQUIRY} style={{ minWidth: 280 }}>
              Enquire — from ${unitPrice}
            </CtaLink>
          ) : (
            <>
              <CtaButton onClick={handleBuyNow} style={{ minWidth: 280 }}>
                Buy Now — ${unitPrice * windows}
              </CtaButton>
              <TextLink
                accent
                to={bookingLink({
                  blindType,
                  windowSize,
                  operation,
                  quantity: windows,
                  fabricColour,
                  hardwareColour,
                })}
              >
                or get a free quote →
              </TextLink>
            </>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}
