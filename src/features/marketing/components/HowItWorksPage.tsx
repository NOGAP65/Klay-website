import { useState } from 'react';
import { Link } from 'react-router-dom';

import { radius, tokens, eyebrow, headline, motion, space, supporting, type as typeScale, useHover } from '@/ds';

import { STEPS, type Step } from '../constants';

// GOLD / DARK / PARCHMENT used to be declared here as local literals. DARK was
// '#0f0d09' — a near-black darker than ink and outside the palette entirely —
// and PARCHMENT restated a token with a value that had since diverged from it.
// Everything below reads from theme.ts, so this page can no longer drift.

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

/** A still of the configurator, for the step that describes it. Rebuilt on a
 * light card: the steps are warm white and parchment now, and a near-black
 * panel dropped onto them read as a hole in the page rather than as a device.
 * The window itself stays dark — that is a photograph of a view, not a
 * surface, and it is what makes the blind above it legible. */
function VisualiserMock() {
  return (
    <div style={{ background: tokens.card, border: `1px solid ${tokens.line}`, padding: space.group, maxWidth: 420 }}>
      <div style={{ display: 'flex', gap: space.tight, marginBottom: 20 }}>
        {['White', 'Black', 'Chrome'].map((h) => (
          <span
            key={h}
            style={{
              fontFamily: tokens.body, fontSize: typeScale.micro.fontSize, color: tokens.inkSoft, textTransform: 'uppercase',
              letterSpacing: '0.1em', border: `1px solid ${tokens.line}`, padding: `${space.tight}px ${space.snug}px`,
            }}
          >
            {h}
          </span>
        ))}
      </div>
      <div style={{ position: 'relative', height: 220, border: `1px solid ${tokens.line}`, overflow: 'hidden', background: 'linear-gradient(180deg, #2a3a4a, #4a5a6a)' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(248,248,248,0.2)' }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(248,248,248,0.2)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', background: 'repeating-linear-gradient(180deg, rgba(232,228,222,0.85) 0px, rgba(232,228,222,0.85) 1px, transparent 1px, transparent 3px), #EDEDED' }} />
      </div>
      <div style={{ fontFamily: tokens.body, fontSize: typeScale.label.fontSize, color: tokens.textMuted, marginTop: 16, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Blockout Roller — from $220
      </div>
    </div>
  );
}

/** The four steps share one shape, so the only thing that varies between them
 * is content and which side the image sits on. Alternating grounds is what
 * makes each one read as a discrete step rather than as one long page. */
const STEP_NUMBER: React.CSSProperties = {
  fontFamily: tokens.display,
  fontSize: 120,
  fontWeight: 300,
  // `textFaint`, not `onDark`. The four steps alternate between paper and band,
  // which are BOTH light — every step's body copy is `supporting.onLight` — so
  // an on-dark colour was never right here for any of them, and since onDark is
  // paper these numerals rendered at 1:1 and 1.1:1 on their own grounds. They
  // have been invisible for as long as the token has been paper.
  //
  // 120px is large text, so the floor is 3:1, and textFaint clears it on both
  // grounds (4.34 on paper, 3.94 on band) while staying the quiet ordering mark
  // it is meant to be rather than competing with the step's headline.
  color: tokens.textFaint,
  lineHeight: 1,
};

/** The photograph beside a step.
 *
 * These four moved here from the homepage's How It Works section, which no longer
 * exists — the homepage states the process as a gold bar under the hero and sends
 * anyone who wants it in full to this page. They are the strongest assets in the
 * repository, purpose-shot for these exact four beats, and until now this page —
 * the page actually about the process — carried one image: an empty blue room
 * captioned "A Klay technician measuring a window". Steps three and four had
 * cream boxes with a line of text in them.
 *
 * 3:2 and a fixed height so all four sit at the same size whichever side of the
 * row they land on. */
function StepPhoto({ step }: { step: Step }) {
  return (
    <div style={{ height: 320, overflow: 'hidden', border: `1px solid ${tokens.line}` }}>
      <img
        src={step.image}
        alt={step.alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: step.objectPosition,
          display: 'block',
        }}
      />
    </div>
  );
}

const stepSection = (ground: string): React.CSSProperties => ({
  background: ground,
  padding: `${space.focal}px ${space.band}px`,
  display: 'flex',
  gap: 80,
  flexWrap: 'wrap',
  alignItems: 'center',
});

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [hoveredFaq, setHoveredFaq] = useState<number | null>(null);
  const ctaHover = useHover();

  return (
    <>

      {/* Hero — charcoal. The one dark moment on the page: a confident opening
          statement, and the contrast that makes the first step feel like the
          page opening up. */}
      <section style={{ background: tokens.charcoal, padding: `${space.focal}px ${space.band}px ${space.focal}px` }}>
        <div style={{ ...eyebrow, color: tokens.onDarkMuted, marginBottom: 22 }}>The Klay Process</div>
        <h1 style={{ ...headline.hero, color: tokens.paper, maxWidth: 900 }}>
          Four steps to a perfectly dressed window.
        </h1>
        <p style={{ ...supporting.onDark, maxWidth: 520, marginTop: 24 }}>
          No showrooms. No sales reps. Just a clear, simple process from your first click to your finished window.
        </p>
      </section>

      {/* Steps alternate parchment / warm white. Starting on parchment is what
          lets the alternation run unbroken through the FAQ and land the closing
          CTA on warm white. Both were dark before, which made the process — the
          friction-removal part of the page — feel heavier than the promise. */}

      {/* Step 1 — parchment */}
      <section style={stepSection(tokens.band)}>
        <div style={{ flex: '1 1 400px' }}>
          <div style={STEP_NUMBER}>01</div>
          <h2 style={{ ...headline.section, color: tokens.ink, margin: `${space.tight}px 0 0` }}>Design online</h2>
          <p style={{ ...supporting.onLight, lineHeight: 1.8, marginTop: 20, maxWidth: 480 }}>
            Our visualiser lets you see your exact blind, in your room, before you spend a cent. Pick a range, choose your hardware finish and preview it against a photo of your own window.
          </p>
          <p style={{ ...supporting.onLight, lineHeight: 1.8, marginTop: 16, maxWidth: 480 }}>
            No measurements needed yet — that comes later, in person, at no charge. This step is just about landing on the look you want.
          </p>
        </div>
        <div style={{ flex: '1 1 360px', display: 'flex', justifyContent: 'center' }}>
          <VisualiserMock />
        </div>
      </section>

      {/* Step 2 — warm white */}
      <section style={stepSection(tokens.paper)}>
        <div style={{ flex: '1 1 360px' }}>
          <StepPhoto step={STEPS[1]} />
        </div>
        <div style={{ flex: '1 1 400px' }}>
          <div style={STEP_NUMBER}>02</div>
          <h2 style={{ ...headline.section, color: tokens.ink, margin: `${space.tight}px 0 0` }}>We come to you</h2>
          <p style={{ ...supporting.onLight, lineHeight: 1.8, marginTop: 20, maxWidth: 480 }}>
            A Klay technician visits your home within 7–10 days to measure every window precisely — no guesswork, no relying on your own tape measure. They will also talk through hardware and fabric options in person.
          </p>
          <div style={{ fontFamily: tokens.display, fontStyle: 'italic', fontSize: typeScale.subhead.fontSize, color: tokens.onDark, marginTop: 20 }}>
            Free measure — no charge, ever.
          </div>
        </div>
      </section>

      {/* Step 3 — parchment */}
      <section style={stepSection(tokens.band)}>
        <div style={{ flex: '1 1 400px' }}>
          <div style={STEP_NUMBER}>03</div>
          <h2 style={{ ...headline.section, color: tokens.ink, margin: `${space.tight}px 0 0` }}>Made precisely</h2>
          <p style={{ ...supporting.onLight, lineHeight: 1.8, marginTop: 20, maxWidth: 480 }}>
            Your exact measurements go straight to our manufacturing partner, Rynamic Industries SA, where every blind is cut and finished to the millimetre. Nothing is made until your window has been measured.
          </p>
          <p style={{ ...supporting.onLight, lineHeight: 1.8, marginTop: 16, maxWidth: 480 }}>
            Finished blinds are freighted to Melbourne in as little as 2 business days, then quality checked again before your installation is booked.
          </p>
        </div>
        <div style={{ flex: '1 1 360px' }}>
          <StepPhoto step={STEPS[2]} />
        </div>
      </section>

      {/* Step 4 — warm white */}
      <section style={stepSection(tokens.paper)}>
        <div style={{ flex: '1 1 400px' }}>
          <div style={STEP_NUMBER}>04</div>
          <h2 style={{ ...headline.section, color: tokens.ink, margin: `${space.tight}px 0 0` }}>Installed perfectly</h2>
          <p style={{ ...supporting.onLight, lineHeight: 1.8, marginTop: 20, maxWidth: 480 }}>
            The same technician who measured your windows comes back to install them — no handoffs, no re-explaining what you want. They know your home already.
          </p>
          <p style={{ ...supporting.onLight, lineHeight: 1.8, marginTop: 16, maxWidth: 480 }}>
            Before and after photos are sent to you the same day, and every installation is covered by our 5-year warranty on top of standard product cover.
          </p>
        </div>
        <div style={{ flex: '1 1 360px' }}>
          <StepPhoto step={STEPS[3]} />
        </div>
      </section>

      {/* FAQ — parchment, keeping the alternation running and matching the
          softer register the product pages use for the same content. */}
      <section style={{ background: tokens.band, padding: `${space.focal}px ${space.band}px` }}>
        <h2 style={{ ...headline.section, color: tokens.ink, marginBottom: 56 }}>
          Common questions.
        </h2>
        <div style={{ maxWidth: 800 }}>
          {FAQS.map((f, i) => {
            const isOpen = openFaq === i;
            const isHot = hoveredFaq === i;
            return (
              <div key={f.q} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  onMouseEnter={() => setHoveredFaq(i)}
                  onMouseLeave={() => setHoveredFaq(cur => (cur === i ? null : cur))}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'transparent', border: 'none', cursor: 'pointer', padding: `${space.group}px 0`,
                    fontFamily: tokens.display, fontSize: typeScale.subhead.fontSize, textAlign: 'left',
                    // The row responds, not just the icon. Opacity rather than
                    // a colour shift so the question never reads as a link.
                    color: tokens.ink,
                    opacity: isHot ? 0.7 : 1,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {f.q}
                  <span style={{ color: tokens.onDark, fontSize: typeScale.subhead.fontSize, marginLeft: 24, flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s ease' }}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <p style={{ ...supporting.onLight, lineHeight: 1.8, margin: `0 0 ${space.group}px`, maxWidth: 640 }}>
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Closing — warm white with one gold CTA. The page previously ended on
          the last FAQ, which left someone who had just read the entire process
          with nothing to act on at the exact moment their objections had been
          answered. */}
      <section style={{ background: tokens.paper, padding: `${space.focal}px ${space.band}px`, textAlign: 'center' }}>
        <h2 style={{ ...headline.section, color: tokens.ink, maxWidth: 720, margin: '0 auto' }}>
          Start with the part that costs nothing.
        </h2>
        <p style={{ ...supporting.onLight, maxWidth: 480, margin: `${space.group}px auto ${space.section}px` }}>
          Design your blind in the visualiser, then book a free measure. Two to
          three weeks from first click to a finished window.
        </p>
        <Link
          to="/visualiser"
          {...ctaHover.bind}
          style={{
            display: 'inline-block',
            textDecoration: 'none',
            fontFamily: tokens.body,
            fontSize: typeScale.body.fontSize,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: `${space.item}px ${space.section}px`,
            borderRadius: radius.md,
            background: ctaHover.isHovered ? tokens.accentHover : tokens.accent,
            color: tokens.onAccent,
            transition: motion.button,
          }}
        >
          Design Yours
        </Link>
      </section>

    </>
  );
}
