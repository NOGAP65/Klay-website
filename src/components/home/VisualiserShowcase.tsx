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
import { tokens, layout, motion } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useCartStore } from '../../store/cartStore';
import { productByBlindType } from '../../data/products';
import { bookingLink } from '../../lib/bookingLink';
import KlayConfigurator from '../../visualiser/KlayConfigurator';
import VisualiserControls from '../../visualiser/VisualiserControls';
import { useVisualiserStore } from '../../visualiser/useVisualiserStore';
import { CtaButton, SectionBand, TextLink, useHover } from './primitives';

const MAX_WINDOWS = 12;

/** Matches the RADIUS the visualiser's own surfaces use, so the card and the
 * canvas box inside it agree rather than being 2px and 12px apart. */
const CARD_RADIUS = 2;

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
        width: 30,
        height: 30,
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
          gap: 12,
          marginBottom: 9,
        }}
      >
        {/* Matched to VisualiserControls' own Field labels — this row sits
            directly under them and has to read as one more field, not as a
            different component that happens to be nearby. */}
        <span style={{ fontFamily: tokens.body, fontSize: 11, fontWeight: 500, color: tokens.warmWhite }}>
          Number of windows
        </span>
        <span style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.onDarkMuted }}>
          {value === 1 ? '1 window' : `${value} windows`}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            fontFamily: tokens.body,
            fontSize: 15,
            fontWeight: 500,
            color: tokens.warmWhite,
            minWidth: 24,
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
  const { blindType, fabricColour, hardwareColour, windowSize, operation, getCurrentPrice } =
    useVisualiserStore();

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
      price: getCurrentPrice(),
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
    // Cream, not warmWhite, and that is load-bearing rather than a shade of
    // preference. AlternatingPanels immediately below is warm white, so warm
    // white here would run two identical grounds together and lose the join —
    // the page's rule is that no two adjacent sections share one. Cream is also
    // simply the whitest thing in the palette, which is what was asked for.
    <section id="visualiser" style={{ background: tokens.cream }}>
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
      <div style={{ padding: isMobile ? '0 24px 72px' : '0 0 96px' }}>
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
            gap: isMobile ? 28 : 32,
            alignItems: 'stretch',
            // The black rectangle. Ink rather than charcoal — charcoal is the
            // page's ordinary dark and is already doing that job in the nav, the
            // steps bar and the canvas box inside this very card. Ink is a step
            // deeper, which is what lets the canvas box read as a screen set into
            // the card rather than as the same surface continuing.
            background: tokens.ink,
            // No border. It was a hairline of ink at 0.08, which existed to lift
            // a cream card off a parchment ground one step away from it. Against
            // cream the black card separates completely on its own, and the
            // hairline would only muddy the edge that is now doing the work.
            borderRadius: CARD_RADIUS,
            padding: isMobile ? 20 : 28,
          }}
        >
          <div
            style={{
              flex: isMobile ? '1 1 auto' : '0 0 30%',
              width: '100%',
              order: isMobile ? 2 : 1,
              display: 'flex',
              flexDirection: 'column',
              // Centred against the canvas, which is the taller of the two. Top
              // aligned, the ~170px the controls don't need collected into one
              // dead cream block at the foot of the card; split above and below
              // it reads as the card's own margin.
              justifyContent: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? 16 : 22,
            }}
          >
            <VisualiserControls compact onDark />
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
          {/* Buy Now, the same words as every tile on the page. The price rides on
              the label because this is the only one of them that knows what the
              thing costs — a bare "Buy Now" under a configured render would hide
              the number the customer just built. */}
          <CtaButton onClick={handleBuyNow} style={{ minWidth: 280 }}>
            Buy Now — ${getCurrentPrice() * windows}
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
          </div>
        </div>
      </div>
    </section>
  );
}
