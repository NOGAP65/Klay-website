import { useState } from 'react';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens } from '../theme';

const GOLD = '#C8973A';
const DARK = '#0f0d09';
const PARCHMENT = '#F2EDE4';

const FAQS = [
  {
    q: 'How long does the whole process take?',
    a: 'From your first click to a finished window is typically 2–3 weeks. Measuring happens within 7–10 days of your order, and manufacturing takes a further 5–7 business days before installation is booked in.',
  },
  {
    q: 'What if my windows are an unusual size?',
    a: 'Every blind is cut to your exact measurements after our technician visits, so unusual shapes, heights or widths are not a problem. If a window falls outside our standard range we will tell you during the measure — there is no extra charge for made-to-measure sizing.',
  },
  {
    q: 'Do I need to be home for the measure?',
    a: 'Yes, someone over 18 needs to be present so the technician can access every window and confirm placement with you. Appointments run in 2-hour windows and we will text you when we are on our way.',
  },
  {
    q: 'What does the 5-year warranty cover?',
    a: 'It covers the fabric, mechanism and hardware against manufacturing defects, plus the installation itself. If anything fails under normal use within five years, we repair or replace it at no cost.',
  },
  {
    q: 'Can I motorise my blind later?',
    a: 'In most cases yes — many of our roller systems can be retrofitted with a motor. It is easiest to add at the time of order, but talk to us and we will confirm whether your specific blind can be upgraded after installation.',
  },
  {
    q: 'What areas do you service?',
    a: 'We cover Melbourne metro and surrounding Victorian regions. Enter your address at checkout or call us and we will confirm coverage and the next available measure slot for your suburb.',
  },
];

function VisualiserMock() {
  return (
    <div style={{ background: '#1a1208', border: '1px solid rgba(200,151,58,0.2)', padding: 28, maxWidth: 420 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['White', 'Black', 'Chrome'].map((h) => (
          <span
            key={h}
            style={{
              fontFamily: tokens.body, fontSize: 10, color: 'rgba(248,246,242,0.5)', textTransform: 'uppercase',
              letterSpacing: '0.1em', border: '1px solid rgba(248,246,242,0.2)', padding: '6px 12px',
            }}
          >
            {h}
          </span>
        ))}
      </div>
      <div style={{ position: 'relative', height: 220, border: '1px solid rgba(255,255,255,0.15)', overflow: 'hidden', background: 'linear-gradient(180deg, #2a3a4a, #4a5a6a)' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', background: 'repeating-linear-gradient(180deg, rgba(228,224,218,0.85) 0px, rgba(228,224,218,0.85) 1px, transparent 1px, transparent 3px), #EDEAE4' }} />
      </div>
      <div style={{ fontFamily: tokens.body, fontSize: 11, color: GOLD, marginTop: 16, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Blockout Roller — from $220
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Nav />

      {/* Hero */}
      <section style={{ background: DARK, padding: '160px 80px 100px' }}>
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 20 }}>
          The Klay Process
        </div>
        <h1 style={{ fontFamily: tokens.display, fontSize: 'clamp(48px, 6vw, 88px)', fontWeight: 300, color: tokens.warmWhite, margin: 0, lineHeight: 1.05, maxWidth: 900 }}>
          Four steps to a perfectly dressed window.
        </h1>
        <p style={{ fontFamily: tokens.body, fontSize: 15, color: 'rgba(248,246,242,0.5)', maxWidth: 520, marginTop: 20 }}>
          No showrooms. No sales reps. Just a clear, simple process from your first click to your finished window.
        </p>
      </section>

      {/* Step 1 — dark */}
      <section style={{ background: DARK, padding: '100px 80px', display: 'flex', gap: 80, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 400px' }}>
          <div style={{ fontFamily: tokens.display, fontSize: 120, fontWeight: 300, color: GOLD, lineHeight: 1 }}>01</div>
          <h2 style={{ fontFamily: tokens.display, fontSize: 52, fontWeight: 300, color: tokens.warmWhite, margin: '8px 0 0' }}>Design online</h2>
          <p style={{ fontFamily: tokens.body, fontSize: 15, color: 'rgba(248,246,242,0.55)', lineHeight: 1.8, marginTop: 20, maxWidth: 480 }}>
            Our visualiser lets you see your exact blind, in your room, before you spend a cent. Pick a range, choose your hardware finish and preview it against a photo of your own window.
          </p>
          <p style={{ fontFamily: tokens.body, fontSize: 15, color: 'rgba(248,246,242,0.55)', lineHeight: 1.8, marginTop: 16, maxWidth: 480 }}>
            No measurements needed yet — that comes later, in person, at no charge. This step is just about landing on the look you want.
          </p>
        </div>
        <div style={{ flex: '1 1 360px', display: 'flex', justifyContent: 'center' }}>
          <VisualiserMock />
        </div>
      </section>

      {/* Step 2 — parchment */}
      <section style={{ background: PARCHMENT, padding: '100px 80px', display: 'flex', gap: 80, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 360px' }}>
          <div style={{ height: 320, overflow: 'hidden', border: '1px solid rgba(30,26,22,0.1)' }}>
            <img src="/images/room-2.png" alt="A Klay technician measuring a window" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
          </div>
        </div>
        <div style={{ flex: '1 1 400px' }}>
          <div style={{ fontFamily: tokens.display, fontSize: 120, fontWeight: 300, color: GOLD, lineHeight: 1 }}>02</div>
          <h2 style={{ fontFamily: tokens.display, fontSize: 52, fontWeight: 300, color: tokens.ink, margin: '8px 0 0' }}>We come to you</h2>
          <p style={{ fontFamily: tokens.body, fontSize: 15, color: tokens.textMid, lineHeight: 1.8, marginTop: 20, maxWidth: 480 }}>
            A Klay technician visits your home within 7–10 days to measure every window precisely — no guesswork, no relying on your own tape measure. They will also talk through hardware and fabric options in person.
          </p>
          <div style={{ fontFamily: tokens.display, fontStyle: 'italic', fontSize: 20, color: GOLD, marginTop: 20 }}>
            Free measure — no charge, ever.
          </div>
        </div>
      </section>

      {/* Step 3 — dark */}
      <section style={{ background: DARK, padding: '100px 80px', display: 'flex', gap: 80, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 400px' }}>
          <div style={{ fontFamily: tokens.display, fontSize: 120, fontWeight: 300, color: GOLD, lineHeight: 1 }}>03</div>
          <h2 style={{ fontFamily: tokens.display, fontSize: 52, fontWeight: 300, color: tokens.warmWhite, margin: '8px 0 0' }}>Made precisely</h2>
          <p style={{ fontFamily: tokens.body, fontSize: 15, color: 'rgba(248,246,242,0.55)', lineHeight: 1.8, marginTop: 20, maxWidth: 480 }}>
            Your exact measurements go straight to our manufacturing partner, Rynamic Industries SA, where every blind is cut and finished to the millimetre. Nothing is made until your window has been measured.
          </p>
          <p style={{ fontFamily: tokens.body, fontSize: 15, color: 'rgba(248,246,242,0.55)', lineHeight: 1.8, marginTop: 16, maxWidth: 480 }}>
            Finished blinds are freighted to Melbourne in as little as 2 business days, then quality checked again before your installation is booked.
          </p>
        </div>
        <div style={{ flex: '1 1 360px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 360, height: 220, border: '1px solid rgba(200,151,58,0.2)', background: 'linear-gradient(180deg, #1a1208, #241c10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: tokens.display, fontSize: 14, color: 'rgba(248,246,242,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Cut to the millimetre
            </span>
          </div>
        </div>
      </section>

      {/* Step 4 — parchment */}
      <section style={{ background: PARCHMENT, padding: '100px 80px', display: 'flex', gap: 80, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 400px' }}>
          <div style={{ fontFamily: tokens.display, fontSize: 120, fontWeight: 300, color: GOLD, lineHeight: 1 }}>04</div>
          <h2 style={{ fontFamily: tokens.display, fontSize: 52, fontWeight: 300, color: tokens.ink, margin: '8px 0 0' }}>Installed perfectly</h2>
          <p style={{ fontFamily: tokens.body, fontSize: 15, color: tokens.textMid, lineHeight: 1.8, marginTop: 20, maxWidth: 480 }}>
            The same technician who measured your windows comes back to install them — no handoffs, no re-explaining what you want. They know your home already.
          </p>
          <p style={{ fontFamily: tokens.body, fontSize: 15, color: tokens.textMid, lineHeight: 1.8, marginTop: 16, maxWidth: 480 }}>
            Before and after photos are sent to you the same day, and every installation is covered by our 5-year warranty on top of standard product cover.
          </p>
        </div>
        <div style={{ flex: '1 1 360px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 360, height: 220, border: '1px solid rgba(30,26,22,0.12)', background: tokens.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: tokens.display, fontSize: 14, color: tokens.textMuted, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              5-Year Warranty
            </span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: DARK, padding: '100px 80px' }}>
        <h2 style={{ fontFamily: tokens.display, fontSize: 52, fontWeight: 300, color: tokens.warmWhite, marginBottom: 48 }}>
          Common questions.
        </h2>
        <div style={{ maxWidth: 800 }}>
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} style={{ borderBottom: '1px solid rgba(248,246,242,0.12)' }}>
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'transparent', border: 'none', cursor: 'pointer', padding: '24px 0',
                    fontFamily: tokens.display, fontSize: 20, color: tokens.warmWhite, textAlign: 'left',
                  }}
                >
                  {f.q}
                  <span style={{ color: GOLD, fontSize: 20, marginLeft: 24, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s ease' }}>
                    +
                  </span>
                </button>
                {open && (
                  <p style={{ fontFamily: tokens.body, fontSize: 15, color: 'rgba(248,246,242,0.55)', lineHeight: 1.8, margin: '0 0 24px', maxWidth: 640 }}>
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </>
  );
}
