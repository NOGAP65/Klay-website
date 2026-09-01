import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { tokens, eyebrow, headline, motion, space, supporting, type as typeScale } from '@/ds';
import { DANGER, Field } from '@/ds';
import { Honeypot, Turnstile, isValidEmail, useTurnstileEnabled } from '@/shared';

import { Footer } from '../../../components/Footer';
import { Nav } from '../../../components/Nav';
import { type FieldErrors } from '../../../lib/api';
import { sendEnquiry } from '../api/sendEnquiry';

// DARK ('#0f0d09') and PARCHMENT used to be declared here. Contact is a
// service moment, not a sales one — there is no dark section on this page now,
// so the near-black is gone rather than merely retuned.

const DETAILS = [
  { label: 'Phone', value: '1300 00 KLAY' },
  { label: 'Email', value: 'hello@klayinteriors.com.au' },
  { label: 'Address', value: '18 Maltings Cct, Epping VIC 3076' },
  { label: 'Hours', value: 'Monday – Friday, 8am – 6pm' },
  { label: 'Coverage', value: 'Victoria-wide — Melbourne metro and surrounds' },
];

// The local `Field` that used to live here has moved to components/FormField
// as a controlled input. It took no value/onChange, which is precisely why this
// form could never send anything — it flipped to a thank-you message and threw
// the enquiry away. The booking form uses the same component now, so both
// behave identically.

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);

  // ?product=<name> — set by every GET A QUOTE card on the blind listing pages.
  // Somebody who has just clicked a specific product should not have to retype
  // which one, and an enquiry that arrives saying only "hi" costs a phone call
  // to find out. The line is editable like any other message; it is a starting
  // point, not a locked field.
  //
  // Read once, in the initialiser, rather than in an effect — an effect would
  // overwrite whatever had been typed if the URL changed under the form.
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(() => {
    const product = searchParams.get('product');
    return {
      name: '',
      email: '',
      phone: '',
      notes: product ? `I'd like a quote for: ${product}\n\n` : '',
    };
  });
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileEnabled = useTurnstileEnabled();

  async function handleSubmit() {
    setFormError(null);

    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = 'Please tell us your name.';
    if (!form.email.trim()) errors.email = 'We need an email to reply to.';
    else if (!isValidEmail(form.email)) {
      errors.email = "That email doesn't look right.";
    }
    if (turnstileEnabled && !turnstileToken) {
      setFormError('Please complete the verification challenge.');
      return;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setBusy(true);

    // A contact enquiry is a quote request without a configuration: same
    // endpoint, same table, same inbox Klay already watches. The placeholder
    // blind fields the schema requires live in api/sendEnquiry, named and
    // explained, rather than reading here as if somebody had chosen them.
    const result = await sendEnquiry({
      name: form.name,
      email: form.email,
      phone: form.phone,
      notes: form.notes,
      website: honeypot,
      turnstileToken,
    });

    setBusy(false);
    if (result.ok) {
      setSubmitted(true);
    } else {
      setFormError(result.message);
      if (result.fields) setFieldErrors(result.fields);
    }
  }

  return (
    <>
      {/* onLight: the hero is warm white now, and the nav's links are warmWhite
          while transparent — without this they are invisible above the fold. */}
      <Nav onLight />

      {/* Warm white throughout. Contact is a service moment, not a sales one:
          someone here has already decided to talk to you, and a dark hero
          performs conviction at a person who no longer needs converting. */}
      <section style={{ background: tokens.paper, padding: `${space.focal}px ${space.band}px 0` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ ...eyebrow, marginBottom: 22 }}>Get In Touch</div>
          <h1 style={{ ...headline.hero, color: tokens.ink, maxWidth: 900 }}>
            Let's talk about your windows.
          </h1>
          <p style={{ ...supporting.onLight, maxWidth: 520, marginTop: 24 }}>
            Call, email, or send the form — we reply within one business day.
          </p>
        </div>
      </section>

      <section style={{ background: tokens.paper, padding: `${space.band}px ${space.band}px ${space.focal}px` }}>
        <div style={{ display: 'flex', gap: space.band, maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap' }}>
          {/* Left — details */}
          <div style={{ flex: '1 1 300px' }}>
            {DETAILS.map((d) => (
              <div key={d.label} style={{ marginBottom: 44 }}>
                {/* Ink, not gold. Five gold labels stacked down one column
                    turned the accent into the column's body colour. */}
                <div
                  style={{
                    fontFamily: tokens.body,
                    fontSize: typeScale.micro.fontSize,
                    fontWeight: 500,
                    color: tokens.inkSoft,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3em',
                  }}
                >
                  {d.label}
                </div>
                <div style={{ fontFamily: tokens.display, fontSize: typeScale.card.fontSize, fontWeight: 300, color: tokens.ink, marginTop: 8 }}>
                  {d.value}
                </div>
              </div>
            ))}
          </div>

          {/* Right — form */}
          <div style={{ flex: '1 1 400px' }}>
            {submitted ? (
              <p style={{ fontFamily: tokens.display, fontSize: typeScale.card.fontSize, fontStyle: 'italic', color: tokens.ink }}>
                Thanks — we'll be in touch within one business day.
              </p>
            ) : (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSubmit();
                }}
              >
                <Field
                  label="Name"
                  value={form.name}
                  onChange={set('name')}
                  required
                  autoComplete="name"
                  error={fieldErrors.name}
                  maxLength={120}
                />
                <Field
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
                <Field
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  autoComplete="tel"
                  inputMode="tel"
                  error={fieldErrors.phone}
                  maxLength={40}
                />
                <Field
                  label="Message"
                  value={form.notes}
                  onChange={set('notes')}
                  textarea
                  rows={5}
                  error={fieldErrors.notes}
                  maxLength={2000}
                />

                <Honeypot value={honeypot} onChange={setHoneypot} />
                <Turnstile onVerify={setTurnstileToken} />

                {formError && (
                  <p
                    role="alert"
                    style={{
                      fontFamily: tokens.body,
                      fontSize: typeScale.body.fontSize,
                      color: DANGER,
                      background: 'rgba(160,58,40,0.06)',
                      border: '1px solid rgba(160,58,40,0.2)',
                      padding: `${space.snug}px ${space.item}px`,
                      margin: `0 0 ${space.item}px`,
                    }}
                  >
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  onMouseEnter={() => setCtaHover(true)}
                  onMouseLeave={() => setCtaHover(false)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: space.tight,
                    fontFamily: tokens.body, fontSize: typeScale.label.fontSize, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase',
                    padding: `${space.item}px ${space.section}px`, border: 'none',
                    background: busy ? tokens.inkFaint : ctaHover ? tokens.accentHover : tokens.accent,
                    color: tokens.onAccent,
                    cursor: busy ? 'progress' : 'pointer',
                    transition: motion.button,
                  }}
                >
                  {busy ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
