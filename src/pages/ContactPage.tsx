import { useState } from 'react';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens } from '../theme';

const DARK = '#0f0d09';
const PARCHMENT = '#F2EDE4';

const DETAILS = [
  { label: 'Phone', value: '1300 00 KLAY' },
  { label: 'Email', value: 'hello@klayinteriors.com.au' },
  { label: 'Address', value: '18 Maltings Cct, Epping VIC 3076' },
  { label: 'Hours', value: 'Monday – Friday, 8am – 6pm' },
  { label: 'Coverage', value: 'Victoria-wide — Melbourne metro and surrounds' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  border: '1px solid rgba(30,26,22,0.15)',
  background: 'white',
  fontFamily: 'Inter',
  fontSize: '14px',
  marginBottom: '16px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: tokens.body,
  fontSize: 11,
  color: tokens.ink,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 6,
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <Nav />

      {/* Hero */}
      <section style={{ background: DARK, padding: '160px 80px 80px' }}>
        <h1 style={{ fontFamily: tokens.display, fontSize: 'clamp(48px, 6vw, 80px)', fontWeight: 300, color: tokens.warmWhite, margin: 0 }}>
          Let's talk about your windows.
        </h1>
      </section>

      {/* Contact section */}
      <section style={{ background: PARCHMENT, padding: '80px' }}>
        <div style={{ display: 'flex', gap: 80, maxWidth: 1280, margin: '0 auto', flexWrap: 'wrap' }}>
          {/* Left — details */}
          <div style={{ flex: '1 1 300px' }}>
            {DETAILS.map((d) => (
              <div key={d.label} style={{ marginBottom: 40 }}>
                <div style={{ fontFamily: tokens.body, fontSize: 10, color: tokens.gold, textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                  {d.label}
                </div>
                <div style={{ fontFamily: tokens.display, fontSize: 28, color: tokens.ink, marginTop: 6 }}>
                  {d.value}
                </div>
              </div>
            ))}
          </div>

          {/* Right — form */}
          <div style={{ flex: '1 1 400px' }}>
            {submitted ? (
              <p style={{ fontFamily: tokens.display, fontSize: 22, fontStyle: 'italic', color: tokens.ink }}>
                Thanks — we'll be in touch within one business day.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <label style={labelStyle}>Name</label>
                <input type="text" required style={inputStyle} />

                <label style={labelStyle}>Email</label>
                <input type="email" required style={inputStyle} />

                <label style={labelStyle}>Phone</label>
                <input type="tel" style={inputStyle} />

                <label style={labelStyle}>Message</label>
                <textarea rows={5} style={{ ...inputStyle, resize: 'vertical' }} />

                <button
                  type="submit"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    fontFamily: tokens.body, fontSize: 12, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase',
                    padding: '16px 32px', border: 'none', background: tokens.gold, color: tokens.dark,
                    cursor: 'pointer',
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
