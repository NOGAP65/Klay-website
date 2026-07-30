import { useState } from 'react';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens, eyebrow, headline, motion, supporting } from '../theme';

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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: tokens.body,
  fontSize: 11,
  color: tokens.inkSoft,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 8,
};

/** Inputs carry the only focus state on the site that matters for
 * accessibility: outline:'none' removes the browser's own focus ring, so
 * without a replacement a keyboard user has no idea which field they are in.
 * A gold border is that replacement, and it doubles as the brand's one accent
 * doing real work rather than decoration. */
function Field({
  label,
  type,
  required,
  textarea,
}: {
  label: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  const style: React.CSSProperties = {
    width: '100%',
    padding: '15px 16px',
    // Was background:'white' — pure white on a warm palette, and the one value
    // the brand explicitly rules out at the opposite end from pure black.
    background: tokens.cream,
    border: `1px solid ${focused ? tokens.gold : tokens.line}`,
    fontFamily: tokens.body,
    fontSize: 14,
    color: tokens.ink,
    marginBottom: 20,
    outline: 'none',
    boxSizing: 'border-box',
    transition: motion.link,
  };

  return (
    <>
      <label style={labelStyle}>{label}</label>
      {textarea ? (
        <textarea
          rows={5}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...style, resize: 'vertical' }}
        />
      ) : (
        <input
          type={type}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={style}
        />
      )}
    </>
  );
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);

  return (
    <>
      {/* onLight: the hero is warm white now, and the nav's links are warmWhite
          while transparent — without this they are invisible above the fold. */}
      <Nav onLight />

      {/* Warm white throughout. Contact is a service moment, not a sales one:
          someone here has already decided to talk to you, and a dark hero
          performs conviction at a person who no longer needs converting. */}
      <section style={{ background: tokens.warmWhite, padding: '180px 80px 0' }}>
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

      <section style={{ background: tokens.warmWhite, padding: '80px 80px 140px' }}>
        <div style={{ display: 'flex', gap: 80, maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap' }}>
          {/* Left — details */}
          <div style={{ flex: '1 1 300px' }}>
            {DETAILS.map((d) => (
              <div key={d.label} style={{ marginBottom: 44 }}>
                {/* Ink, not gold. Five gold labels stacked down one column
                    turned the accent into the column's body colour. */}
                <div
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 10,
                    fontWeight: 500,
                    color: tokens.inkSoft,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3em',
                  }}
                >
                  {d.label}
                </div>
                <div style={{ fontFamily: tokens.display, fontSize: 28, fontWeight: 300, color: tokens.ink, marginTop: 8 }}>
                  {d.value}
                </div>
              </div>
            ))}
          </div>

          {/* Right — form */}
          <div style={{ flex: '1 1 400px' }}>
            {submitted ? (
              <p style={{ fontFamily: tokens.display, fontSize: 24, fontStyle: 'italic', color: tokens.ink }}>
                Thanks — we'll be in touch within one business day.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <Field label="Name" type="text" required />
                <Field label="Email" type="email" required />
                <Field label="Phone" type="tel" />
                <Field label="Message" textarea />

                <button
                  type="submit"
                  onMouseEnter={() => setCtaHover(true)}
                  onMouseLeave={() => setCtaHover(false)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    fontFamily: tokens.body, fontSize: 12, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase',
                    padding: '18px 40px', border: 'none',
                    background: ctaHover ? tokens.goldLight : tokens.gold,
                    color: tokens.ink,
                    cursor: 'pointer',
                    transition: motion.button,
                  }}
                >
                  Send Message
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
