import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens, eyebrow, motion } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { useCartStore } from '../store/cartStore';

export default function CartPage() {
  const isMobile = useIsMobile();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const [checkoutHover, setCheckoutHover] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    state: 'VIC',
    notes: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Order submitted! We will contact you shortly to arrange measurement.');
    clearCart();
  };

  const total = getTotal();
  /** How many lines carry no price yet. Drives whether the foot of the cart
   * reads as a total or as a quote request — see the total block below. */
  const measureCount = items.filter(i => i.priceOnMeasure).length;

  return (
    <>
      <Nav onLight />
      <div style={{ background: tokens.warmWhite, minHeight: '100vh', paddingTop: isMobile ? 80 : 100 }}>
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

              {/* Checkout Form */}
              <div style={{ flex: 1, maxWidth: isMobile ? '100%' : 420 }}>
                <div style={{ background: tokens.parchment, borderRadius: 12, padding: isMobile ? 24 : 32 }}>
                  <div style={{ ...eyebrow, marginBottom: 24 }}>Your Details</div>

                  <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: `1px solid ${tokens.lineStrong}`,
                            borderRadius: 6,
                            fontFamily: tokens.body,
                            fontSize: 14,
                            background: tokens.warmWhite,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: `1px solid ${tokens.lineStrong}`,
                            borderRadius: 6,
                            fontFamily: tokens.body,
                            fontSize: 14,
                            background: tokens.warmWhite,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: `1px solid ${tokens.lineStrong}`,
                          borderRadius: 6,
                          fontFamily: tokens.body,
                          fontSize: 14,
                          background: tokens.warmWhite,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: `1px solid ${tokens.lineStrong}`,
                          borderRadius: 6,
                          fontFamily: tokens.body,
                          fontSize: 14,
                          background: tokens.warmWhite,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: `1px solid ${tokens.lineStrong}`,
                          borderRadius: 6,
                          fontFamily: tokens.body,
                          fontSize: 14,
                          background: tokens.warmWhite,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                      <div>
                        <label style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleInputChange}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: `1px solid ${tokens.lineStrong}`,
                            borderRadius: 6,
                            fontFamily: tokens.body,
                            fontSize: 14,
                            background: tokens.warmWhite,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                          State
                        </label>
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: `1px solid ${tokens.lineStrong}`,
                            borderRadius: 6,
                            fontFamily: tokens.body,
                            fontSize: 14,
                            background: tokens.warmWhite,
                            boxSizing: 'border-box',
                          }}
                        >
                          <option value="VIC">VIC</option>
                          <option value="NSW">NSW</option>
                          <option value="QLD">QLD</option>
                          <option value="SA">SA</option>
                          <option value="WA">WA</option>
                          <option value="TAS">TAS</option>
                          <option value="NT">NT</option>
                          <option value="ACT">ACT</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                          Postcode *
                        </label>
                        <input
                          type="text"
                          name="postcode"
                          required
                          value={formData.postcode}
                          onChange={handleInputChange}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: `1px solid ${tokens.lineStrong}`,
                            borderRadius: 6,
                            fontFamily: tokens.body,
                            fontSize: 14,
                            background: tokens.warmWhite,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Notes (optional)
                      </label>
                      <textarea
                        name="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Any special requests or instructions..."
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: `1px solid ${tokens.lineStrong}`,
                          borderRadius: 6,
                          fontFamily: tokens.body,
                          fontSize: 14,
                          background: tokens.warmWhite,
                          boxSizing: 'border-box',
                          resize: 'vertical',
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      onMouseEnter={() => setCheckoutHover(true)}
                      onMouseLeave={() => setCheckoutHover(false)}
                      style={{
                        width: '100%',
                        marginTop: 24,
                        padding: '18px 24px',
                        background: checkoutHover ? tokens.accentHover : tokens.accent,
                        color: tokens.onAccent,
                        fontFamily: tokens.body,
                        fontSize: 14,
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: motion.button,
                      }}
                    >
                      Request Quote & Measure
                    </button>

                    <p style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkFaint, marginTop: 16, textAlign: 'center', lineHeight: 1.6 }}>
                      We'll contact you within 24 hours to arrange a free measure and provide a final quote.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}
