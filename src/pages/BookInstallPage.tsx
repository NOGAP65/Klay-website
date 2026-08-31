import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { FormField, DANGER } from '../components/FormField';
import { Honeypot } from '../components/Honeypot';
import { Turnstile, useTurnstileEnabled } from '../components/Turnstile';
import { radius, tokens, eyebrow, headline, motion, layout } from '@/ds';
import { createCheckoutSession, requestQuote, type BookingPayload, type FieldErrors } from '../lib/api';
import {
  MAX_QUANTITY,
  blindLabel,
  formatAUD,
  parseOrderConfig,
  priceOrder,
  sizeLabel,
} from '../lib/pricing';

// ---------------------------------------------------------------------------
// /book — the one page where a configuration turns into either an enquiry or a
// paid order.
//
// The configuration arrives in the URL rather than being read from the
// visualiser's zustand store. The store would work while navigating inside the
// SPA, but it is not persisted, so a refresh or a shared link would silently
// fall back to defaults and quietly quote for the wrong blind. Query params
// survive both, and the server validates them anyway.
//
// Both buttons submit the same form and the same payload. The only difference
// is which endpoint it goes to, so the customer fills in their details exactly
// once and then decides how to proceed.
// ---------------------------------------------------------------------------

type Mode = 'quote' | 'pay';

/** Tomorrow, as yyyy-mm-dd — a measure-up cannot be booked for today. */
function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const sectionHeading: React.CSSProperties = {
  fontFamily: tokens.body,
  fontSize: 11,
  color: tokens.onDark,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  marginBottom: 18,
};

export default function BookInstallPage() {
  const [searchParams] = useSearchParams();

  // Config is derived from the URL and never edited here — quantity is the one
  // thing the customer can change on this page, so it is the only piece held in
  // React state.
  const urlConfig = useMemo(
    () =>
      parseOrderConfig({
        blindType: searchParams.get('type'),
        windowSize: searchParams.get('size'),
        operation: searchParams.get('op'),
        quantity: searchParams.get('qty'),
      }),
    [searchParams],
  );

  const fabricColour = searchParams.get('fabric') ?? undefined;
  const hardwareColour = searchParams.get('hw') ?? undefined;
  const wasCancelled = searchParams.get('cancelled') === '1';

  const [quantity, setQuantity] = useState(urlConfig.quantity);
  const config = { ...urlConfig, quantity };
  const priced = priceOrder(config);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    suburb: '',
    postcode: '',
    preferredDate: '',
    notes: '',
  });
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const [busy, setBusy] = useState<Mode | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [quoteSent, setQuoteSent] = useState(false);

  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileEnabled = useTurnstileEnabled();

  const payload = (): BookingPayload => ({
    ...form,
    blindType: config.blindType,
    windowSize: config.windowSize,
    operation: config.operation,
    quantity: config.quantity,
    fabricColour,
    hardwareColour,
    website: honeypot,
    turnstileToken,
  });

  /** Cheap pre-flight so an obviously incomplete form does not need a round
   *  trip. The server validates independently — this is courtesy, not the
   *  boundary. */
  function localErrors(): FieldErrors {
    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = 'Please tell us your name.';
    if (!form.email.trim()) errors.email = 'We need an email to reply to.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "That email doesn't look right.";
    }
    if (form.postcode.trim() && !/^\d{4}$/.test(form.postcode.trim())) {
      errors.postcode = 'Australian postcodes are four digits.';
    }
    return errors;
  }

  async function submit(mode: Mode) {
    setFormError(null);

    const errors = localErrors();
    if (turnstileEnabled && !turnstileToken) {
      setFormError('Please complete the verification challenge.');
      return;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setBusy(mode);

    if (mode === 'quote') {
      const result = await requestQuote(payload());
      setBusy(null);
      if (result.ok) {
        setQuoteSent(true);
      } else {
        setFormError(result.message);
        if (result.fields) setFieldErrors(result.fields);
      }
      return;
    }

    const result = await createCheckoutSession(payload());
    if (result.ok) {
      // Hand off to Stripe. Deliberately not clearing `busy` — the button stays
      // disabled through the redirect so an impatient second click cannot open
      // a second session (and a second order row).
      window.location.assign(result.data.url);
      return;
    }
    setBusy(null);
    setFormError(result.message);
    if (result.fields) setFieldErrors(result.fields);
  }

  if (quoteSent) {
    return (
      <>
        <Nav onLight />
        <main
          style={{
            background: tokens.warmWhite,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '160px 5vw 120px',
          }}
        >
          <div style={{ maxWidth: 520, textAlign: 'center' }}>
            <div style={{ width: 40, height: 1, background: tokens.fillStrong, margin: '0 auto 28px' }} />
            <h1 style={{ ...headline.section, color: tokens.ink, marginBottom: 20 }}>
              Request received
            </h1>
            <p style={{ fontFamily: tokens.body, fontSize: 15, lineHeight: 1.7, color: tokens.inkSoft }}>
              Thanks {form.name.split(' ')[0]} — we've sent a confirmation to{' '}
              <strong style={{ color: tokens.ink }}>{form.email}</strong> and we'll be in touch
              within one business day to arrange your measure-up.
            </p>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                marginTop: 36,
                fontFamily: tokens.body,
                fontSize: 12,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: tokens.ink,
                textDecoration: 'none',
                borderBottom: `1px solid ${tokens.line}`,
                paddingBottom: 4,
              }}
            >
              Back to Klay
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav onLight />

      <main style={{ background: tokens.warmWhite, paddingTop: 140, paddingBottom: 120 }}>
        <div style={{ maxWidth: layout.containerMax, margin: '0 auto', padding: '0 5vw' }}>
          <div style={{ maxWidth: 640, marginBottom: 56 }}>
            <p style={{ ...eyebrow, color: tokens.onDark, marginBottom: 18 }}>Book an install</p>
            <h1 style={{ ...headline.section, color: tokens.ink, marginBottom: 20 }}>
              Two ways to go ahead.
            </h1>
            <p style={{ fontFamily: tokens.body, fontSize: 15, lineHeight: 1.75, color: tokens.inkSoft }}>
              Ask us for a quote and we'll confirm the price after measuring, or pay now and
              we'll book your measure and install straight away. Either way a real person
              calls you within one business day.
            </p>
          </div>

          {wasCancelled && (
            <div
              role="status"
              style={{
                background: tokens.cream,
                border: `1px solid ${tokens.line}`,
                borderLeft: `2px solid ${tokens.line}`,
                padding: '16px 20px',
                marginBottom: 40,
                fontFamily: tokens.body,
                fontSize: 14,
                color: tokens.inkSoft,
                maxWidth: 640,
              }}
            >
              Payment was cancelled — nothing has been charged. Your details are below if you
              want to try again, or ask for a quote instead.
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'flex-start' }}>
            {/* ---------- form ---------- */}
            <div style={{ flex: '1 1 420px', minWidth: 300 }}>
              <h2 style={sectionHeading}>Your details</h2>

              <form onSubmit={(e) => e.preventDefault()} noValidate>
                <FormField
                  label="Name"
                  value={form.name}
                  onChange={set('name')}
                  required
                  autoComplete="name"
                  error={fieldErrors.name}
                  maxLength={120}
                />
                <FormField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  required
                  autoComplete="email"
                  inputMode="email"
                  error={fieldErrors.email}
                  maxLength={200}
                />
                <FormField
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  autoComplete="tel"
                  inputMode="tel"
                  error={fieldErrors.phone}
                  maxLength={40}
                />
                <FormField
                  label="Street address"
                  value={form.address}
                  onChange={set('address')}
                  autoComplete="street-address"
                  error={fieldErrors.address}
                  maxLength={240}
                />

                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: '2 1 0' }}>
                    <FormField
                      label="Suburb"
                      value={form.suburb}
                      onChange={set('suburb')}
                      autoComplete="address-level2"
                      error={fieldErrors.suburb}
                      maxLength={120}
                    />
                  </div>
                  <div style={{ flex: '1 1 0' }}>
                    <FormField
                      label="Postcode"
                      value={form.postcode}
                      onChange={set('postcode')}
                      autoComplete="postal-code"
                      inputMode="numeric"
                      error={fieldErrors.postcode}
                      maxLength={4}
                    />
                  </div>
                </div>

                <FormField
                  label="Preferred date"
                  type="date"
                  value={form.preferredDate}
                  onChange={set('preferredDate')}
                  min={tomorrowISO()}
                  error={fieldErrors.preferredDate}
                />
                <FormField
                  label="Anything we should know?"
                  value={form.notes}
                  onChange={set('notes')}
                  textarea
                  placeholder="Access, parking, number of windows, timing…"
                  error={fieldErrors.notes}
                  maxLength={2000}
                />

                <Honeypot value={honeypot} onChange={setHoneypot} />
                <Turnstile onVerify={setTurnstileToken} />
              </form>
            </div>

            {/* ---------- summary + the two actions ---------- */}
            <aside
              style={{
                flex: '1 1 340px',
                minWidth: 300,
                background: tokens.cream,
                border: `1px solid ${tokens.line}`,
                padding: 32,
                position: 'sticky',
                top: 110,
              }}
            >
              <h2 style={sectionHeading}>Your configuration</h2>

              <p
                style={{
                  fontFamily: tokens.display,
                  fontSize: 24,
                  fontWeight: 300,
                  color: tokens.ink,
                  margin: '0 0 6px',
                }}
              >
                {blindLabel(config.blindType)}
              </p>
              <p style={{ fontFamily: tokens.body, fontSize: 13, color: tokens.inkSoft, margin: '0 0 24px' }}>
                {sizeLabel(config.windowSize)} · {config.operation}
                {fabricColour ? ` · ${fabricColour}` : ''}
                {hardwareColour ? ` · ${hardwareColour} hardware` : ''}
              </p>

              {/* Quantity is the one editable thing here — the rest of the
                  configuration belongs to the visualiser. */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  paddingBottom: 20,
                  marginBottom: 20,
                  borderBottom: `1px solid ${tokens.line}`,
                }}
              >
                <span style={{ fontFamily: tokens.body, fontSize: 13, color: tokens.ink }}>
                  How many blinds?
                </span>
                <input
                  type="number"
                  min={1}
                  max={MAX_QUANTITY}
                  value={quantity}
                  onChange={(e) => {
                    // Empty string while typing must not become NaN, and the
                    // server clamps to the same 1..MAX range regardless.
                    const next = Number(e.target.value);
                    setQuantity(Number.isFinite(next) ? Math.min(Math.max(Math.floor(next), 1), MAX_QUANTITY) : 1);
                  }}
                  style={{
                    width: 72,
                    padding: '10px 12px',
                    background: tokens.warmWhite,
                    border: `1px solid ${tokens.line}`,
                    fontFamily: tokens.body,
                    fontSize: 14,
                    color: tokens.ink,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </label>

              {priced.lines.map((line) => (
                <div
                  key={line.label}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}
                >
                  <span style={{ fontFamily: tokens.body, fontSize: 13, color: tokens.inkSoft }}>
                    {line.label}
                  </span>
                  <span style={{ fontFamily: tokens.body, fontSize: 13, color: tokens.ink, whiteSpace: 'nowrap' }}>
                    {formatAUD(line.amount)}
                  </span>
                </div>
              ))}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 16,
                  marginTop: 20,
                  paddingTop: 20,
                  borderTop: `1px solid ${tokens.line}`,
                }}
              >
                <span style={{ fontFamily: tokens.body, fontSize: 13, color: tokens.ink }}>Total</span>
                <span
                  style={{
                    fontFamily: tokens.display,
                    fontSize: 34,
                    fontWeight: 300,
                    color: tokens.ink,
                    lineHeight: 1,
                  }}
                >
                  {formatAUD(priced.total)}
                </span>
              </div>
              <p style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkFaint, margin: '8px 0 0' }}>
                Includes {formatAUD(priced.gstIncluded)} GST. Final price confirmed on measure-up.
              </p>

              {formError && (
                <p
                  role="alert"
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 13,
                    color: DANGER,
                    background: 'rgba(160,58,40,0.06)',
                    border: `1px solid rgba(160,58,40,0.2)`,
                    padding: '12px 14px',
                    margin: '24px 0 0',
                  }}
                >
                  {formError}
                </p>
              )}

              {/* Primary is Pay — it is the one that completes the job in a
                  single visit. Quote sits under it as the lower-commitment
                  alternative rather than competing for the same weight. */}
              <button
                type="button"
                onClick={() => submit('pay')}
                disabled={busy !== null}
                style={{
                  width: '100%',
                  marginTop: 28,
                  padding: '17px 16px',
                  background: busy ? tokens.inkFaint : tokens.accent,
                  color: tokens.onAccent,
                  fontFamily: tokens.body,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  border: 'none',
                  borderRadius: radius.md,
                  cursor: busy ? 'progress' : 'pointer',
                  transition: motion.button,
                }}
              >
                {busy === 'pay' ? 'Opening checkout…' : `Pay ${formatAUD(priced.total)} & book`}
              </button>

              <button
                type="button"
                onClick={() => submit('quote')}
                disabled={busy !== null}
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '16px',
                  background: 'transparent',
                  color: tokens.ink,
                  fontFamily: tokens.body,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  border: `1px solid ${tokens.lineStrong}`,
                  borderRadius: radius.md,
                  cursor: busy ? 'progress' : 'pointer',
                  transition: motion.button,
                }}
              >
                {busy === 'quote' ? 'Sending…' : 'Request a quote instead'}
              </button>

              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: tokens.inkFaint,
                  margin: '18px 0 0',
                  textAlign: 'center',
                }}
              >
                Card payments are handled by Stripe. Klay never sees your card details.
              </p>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
