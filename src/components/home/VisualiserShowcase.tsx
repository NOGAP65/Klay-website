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
import { BUY_NOW_LABEL, CtaButton, SectionHead, TextLink, useHover } from './primitives';

const MAX_WINDOWS = 12;

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
    // Straight to the cart. This button says Buy Now, so it has to do what the
    // hero's Buy Now promises rather than quietly banking the configuration and
    // leaving the customer on the same page wondering whether it worked.
    navigate('/cart');
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

        {/* 30/70. Controls are first in the DOM so they read first to a screen
            reader and to anyone tabbing in, and `order` puts the canvas above
            them on a phone — where a column of fields before any picture would
            bury the one thing this section exists to show. */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 36 : 44,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              flex: isMobile ? '1 1 auto' : '0 0 30%',
              width: '100%',
              order: isMobile ? 2 : 1,
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 16 : 22,
            }}
          >
            <VisualiserControls compact />
            <WindowCount value={windows} onChange={setWindows} />
          </div>

          <div style={{ flex: '1 1 auto', width: '100%', minWidth: 0, order: isMobile ? 1 : 2 }}>
            {/* KlayConfigurator caps its own width at mediaMaxVh x the photo's
                aspect ratio. Its 72vh default was tuned for a full-height page
                and leaves the render 150px narrower than the column it sits in
                here, floating in parchment; 88 fills the 70% column instead. */}
            <KlayConfigurator mediaMaxVh={88} />
          </div>
        </div>

        {/* The conversion line. Centred under the whole two-column block rather
            than tucked into the controls column, so it belongs to the render. */}
        <div
          style={{
            marginTop: isMobile ? 40 : 56,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
          }}
        >
          {/* Same words as the hero and the closing CTA. The price is appended
              because this is the one Buy Now on the page that knows what the
              thing costs — a bare "Buy Now" under a configured render would be
              hiding the number the customer just built. */}
          <CtaButton onClick={handleBuyNow} style={{ minWidth: 280 }}>
            {BUY_NOW_LABEL} — ${getCurrentPrice() * windows}
          </CtaButton>
          <TextLink
            to={bookingLink({
              blindType,
              windowSize,
              operation,
              quantity: windows,
              fabricColour,
              hardwareColour,
            })}
          >
            or get a free quote
          </TextLink>
        </div>
      </div>
    </section>
  );
}
