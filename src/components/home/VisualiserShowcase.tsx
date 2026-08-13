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
import { tokens, layout, motion } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useCartStore } from '../../store/cartStore';
import { productByBlindType } from '../../data/products';
import { bookingLink } from '../../lib/bookingLink';
import KlayConfigurator from '../../visualiser/KlayConfigurator';
import VisualiserControls from '../../visualiser/VisualiserControls';
import { useVisualiserStore } from '../../visualiser/useVisualiserStore';
import { CtaButton, SectionHead, TextLink, useHover } from './primitives';

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
        border: `1px solid ${active ? tokens.gold : tokens.lineStrong}`,
        background: active ? tokens.gold : 'transparent',
        color: active ? tokens.ink : tokens.inkSoft,
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
        <span style={{ fontFamily: tokens.body, fontSize: 11, fontWeight: 500, color: tokens.ink }}>
          Number of windows
        </span>
        <span style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkFaint }}>
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
            color: tokens.ink,
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
  const [windows, setWindows] = useState(1);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore(s => s.addItem);
  const { blindType, fabricColour, hardwareColour, windowSize, operation, getCurrentPrice } =
    useVisualiserStore();

  const handleAddToCart = () => {
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
    // Confirms in place rather than navigating. The button says Add to Cart, not
    // Checkout, so it should not move the customer off a configuration they may
    // want to adjust — and the nav's cart badge increments at the same moment,
    // which is the other half of the feedback.
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2600);
  };

  return (
    <section id="visualiser" style={{ background: tokens.parchment, padding: isMobile ? '80px 24px' : '120px 80px' }}>
      <div style={{ maxWidth: layout.containerMax, margin: '0 auto' }}>
        <SectionHead
          label="The Klay visualiser"
          title={
            <>
              See it in your home <span style={{ fontStyle: 'italic' }}>before you buy.</span>
            </>
          }
          sub="Upload a photo of your window and configure in real time."
          align="center"
          style={{ marginBottom: isMobile ? 44 : 64 }}
        />

        {/* ONE CARD, two columns at 30/70. Both columns share the card's cream
            ground and its radius, so the controls read as part of the same
            instrument as the render rather than as a form sitting next to a
            picture. The canvas keeps its own charcoal box — that is
            KlayConfigurator's, it is protected, and a dark surround is right
            behind a photograph anyway: inside this card it reads as the screen
            in the panel.

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
            background: tokens.cream,
            border: `1px solid ${tokens.lineFaint}`,
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
            <VisualiserControls compact />
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
          {/* The price rides on the label because this is the only CTA on the
              page that knows what the thing costs — a bare "Add to Cart" under a
              configured render hides the number the customer just built. */}
          <CtaButton onClick={handleAddToCart} style={{ minWidth: 280 }}>
            {added ? 'Added to cart ✓' : `Add to Cart — $${getCurrentPrice() * windows}`}
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
    </section>
  );
}
