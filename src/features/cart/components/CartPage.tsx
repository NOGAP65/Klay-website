import { useState } from 'react';
import { Link } from 'react-router-dom';

import { tokens, eyebrow, motion, radius, space, type as typeScale } from '@/ds';
import { useIsMobile } from '@/shared';

import { useCartStore } from '../store/cartStore';

export default function CartPage() {
  const isMobile = useIsMobile();
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const [isBookHovered, setIsBookHovered] = useState(false);

  const total = getTotal();
  /** How many lines carry no price yet. Drives whether the foot of the cart
   * reads as a total or as a quote request — see the total block below. */
  const measureCount = items.filter(i => i.priceOnMeasure).length;

  return (
    <>
      <div style={{ background: tokens.paper, minHeight: '100vh', paddingTop: isMobile ? 80 : 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '24px' : '40px 60px' }}>

          <h1 style={{ fontFamily: tokens.display, fontSize: isMobile ? 36 : 48, fontWeight: 300, color: tokens.ink, margin: 0 }}>
            Your Cart
          </h1>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <p style={{ fontFamily: tokens.body, fontSize: 18, color: tokens.inkSoft, marginBottom: 24 }}>
                Your cart is empty
              </p>
              <Link
                to="/products"
                style={{
                  display: 'inline-block',
                  padding: '14px 32px',
                  background: tokens.accent,
                  color: tokens.onAccent,
                  fontFamily: tokens.body,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  borderRadius: 6,
                }}
              >
                Browse Blinds
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 40, marginTop: 40 }}>

              {/* Cart Items */}
              <div style={{ flex: 1 }}>
                <div style={{ ...eyebrow, marginBottom: 20 }}>Items ({items.length})</div>

                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '24px 0',
                      borderBottom: `1px solid ${tokens.lineFaint}`,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontFamily: tokens.display, fontSize: 22, fontWeight: 400, color: tokens.ink, margin: 0 }}>
                        {item.name}
                      </h3>
                      <p style={{ fontFamily: tokens.body, fontSize: 13, color: tokens.inkSoft, margin: '8px 0 0' }}>
                        {item.type}
                      </p>
                      {/* A line configured on a card prints the questions it
                          was actually asked; one from the visualiser prints the
                          configurator's four fixed fields. See the cart store's
                          `options` for why the two differ. */}
                      <div style={{ fontFamily: tokens.body, fontSize: 12, color: tokens.inkFaint, marginTop: 12, lineHeight: 1.8 }}>
                        {item.options
                          ? item.options.map(o => <div key={o.label}>{o.label}: {o.value}</div>)
                          : (
                            <>
                              <div>Fabric: {item.fabricColour}</div>
                              <div>Hardware: {item.hardwareColour}</div>
                              <div>Size: {item.windowSize}</div>
                              <div>Operation: {item.operation}</div>
                            </>
                          )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {/* A made-to-measure line carries no figure — see the
                          cart store's priceOnMeasure. Printing $0 would read as
                          free, and printing a guess is worse. */}
                      {item.priceOnMeasure ? (
                        <div style={{ fontFamily: tokens.body, fontSize: 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: tokens.onDark, paddingTop: 8 }}>
                          Price on measure
                        </div>
                      ) : (
                        <div style={{ fontFamily: tokens.display, fontSize: 24, fontWeight: 300, color: tokens.ink }}>
                          ${item.price * item.quantity}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{
                            width: 28,
                            height: 28,
                            border: `1px solid ${tokens.lineStrong}`,
                            background: 'transparent',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontFamily: tokens.body,
                            fontSize: 16,
                            color: tokens.ink,
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontFamily: tokens.body, fontSize: 14, color: tokens.ink, minWidth: 20, textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{
                            width: 28,
                            height: 28,
                            border: `1px solid ${tokens.lineStrong}`,
                            background: 'transparent',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontFamily: tokens.body,
                            fontSize: 16,
                            color: tokens.ink,
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          marginTop: 12,
                          background: 'transparent',
                          border: 'none',
                          fontFamily: tokens.body,
                          fontSize: 12,
                          color: tokens.inkFaint,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {/* The total is the priced lines only. A cart of nothing but
                    measure requests shows no total at all rather than a $0 one
                    — there is genuinely no figure to give until someone has
                    measured, and that is what the row says. */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', borderBottom: `2px solid ${tokens.ink}` }}>
                  <span style={{ fontFamily: tokens.body, fontSize: 14, fontWeight: 600, color: tokens.ink, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {/* SUBTOTAL only when the basket is mixed, because that is
                        the only case where the figure beside it is a part
                        rather than the whole. */}
                    {measureCount > 0 && measureCount < items.length ? 'Subtotal' : 'Total'}
                  </span>
                  <span style={{ fontFamily: tokens.display, fontSize: 32, fontWeight: 300, color: tokens.ink }}>
                    {measureCount === items.length ? 'On measure' : `$${total}`}
                  </span>
                </div>
                <p style={{ fontFamily: tokens.body, fontSize: 12, color: tokens.inkFaint, marginTop: 8 }}>
                  {measureCount > 0 && measureCount < items.length
                    ? `+ installation across Australia. ${measureCount} ${measureCount === 1 ? 'item is' : 'items are'} priced at measure.`
                    : measureCount === items.length
                      ? 'Every item here is made to measure. We quote once we have measured.'
                      : '+ installation across Australia'}
                </p>
              </div>

              {/* WHERE THE BASKET ENDS AND THE CHECKOUT BEGINS — §3, D-01.
                  This panel used to be a nine-field checkout: first name, last
                  name, email, phone, street address, city, state, postcode and
                  notes, behind a button reading REQUEST QUOTE & MEASURE, whose
                  submit handler was:

                      alert('Order submitted! ...'); clearCart();

                  No network call. It collected a full street address, told the
                  customer their order was submitted, and emptied the basket so
                  the evidence went too. That was D-01, the divergence that
                  caused SPECIFICATION.md to be written, and §3 answers it:

                      "cart holds basket contents. It does not check out. There
                       is exactly one checkout, in features/booking, and the
                       cart links to it."

                  So it links. The form is gone rather than wired up, because a
                  second checkout is the thing being removed — not a second
                  checkout that works.

                  WHAT THIS LINK CANNOT YET DO. /book takes ONE configuration in
                  its query string — type, size, op, qty, fabric, hw — and
                  re-validates it through parseOrderConfig. It has no concept of
                  a basket. So this is a plain link and carries nothing: a
                  multi-line basket has nowhere to go, and building a bridge
                  here would be a third implementation of the thing we just
                  deleted. Recorded as an open gap in DIVERGENCE_LOG.md D-01. */}
              <div style={{ flex: 1, maxWidth: isMobile ? '100%' : 420 }}>
                <div style={{ background: tokens.band, borderRadius: radius.lg, padding: isMobile ? space.group : space.section }}>
                  <div style={{ ...eyebrow, marginBottom: space.group }}>Next step</div>

                  <p style={{ fontFamily: tokens.body, fontSize: typeScale.lead.fontSize, color: tokens.ink, lineHeight: 1.7, margin: 0 }}>
                    Every blind is made to measure, so the quote is settled at the
                    appointment rather than here.
                  </p>

                  <Link
                    to="/book"
                    onMouseEnter={() => setIsBookHovered(true)}
                    onMouseLeave={() => setIsBookHovered(false)}
                    style={{
                      display: 'block',
                      width: '100%',
                      marginTop: space.group,
                      padding: `${space.item}px ${space.group}px`,
                      background: isBookHovered ? tokens.accentHover : tokens.accent,
                      color: tokens.onAccent,
                      fontFamily: tokens.body,
                      fontSize: typeScale.body.fontSize,
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      textDecoration: 'none',
                      borderRadius: radius.md,
                      boxSizing: 'border-box',
                      transition: motion.button,
                    }}
                  >
                    Book a free measure
                  </Link>

                  <p style={{ fontFamily: tokens.body, fontSize: typeScale.label.fontSize, color: tokens.inkFaint, marginTop: space.item, textAlign: 'center', lineHeight: 1.6 }}>
                    Bring this list to the appointment — we confirm each line on site.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
