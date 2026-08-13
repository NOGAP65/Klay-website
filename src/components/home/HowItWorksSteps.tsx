// ---------------------------------------------------------------------------
// 6. How it works — four steps, no icons.
//
// The decorative numeral is the only graphic, and it is set large and low in
// contrast so it reads as page furniture rather than as a heading competing
// with the step label underneath it. Icons were considered and left out: four
// pictograms for "configure / measure / manufacture / install" say nothing the
// four labels don't, and they are the fastest way to make a page look like a
// template.
// ---------------------------------------------------------------------------

import { tokens, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaLink, SectionHead } from './primitives';

const STEPS = [
  {
    label: 'Design online',
    body: 'Choose your fabric, colour, size and operation, and see the result on a photo of your own window.',
  },
  {
    label: 'We measure your space',
    body: 'A Klay technician comes to you and measures every window himself. No guesswork, no DIY tape measure.',
  },
  {
    label: 'Custom manufactured',
    body: 'Your order is cut and assembled to those exact measurements, in Australia, in seven to ten days.',
  },
  {
    label: 'We install, you enjoy',
    body: 'The same technician returns to fit it, squares everything off and takes the packaging away with him.',
  },
];

export function HowItWorksSteps() {
  const isMobile = useIsMobile();

  return (
    <section
      id="how-it-works"
      style={{ background: tokens.warmWhite, padding: layout.sectionPad(isMobile) }}
    >
      <div style={{ maxWidth: layout.containerMax, margin: '0 auto' }}>
        <SectionHead
          label="How it works"
          title="From your screen to your window — we handle everything."
          align="center"
          maxWidth={860}
          style={{ marginBottom: isMobile ? 56 : 88 }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 48 : 40,
          }}
        >
          {STEPS.map((step, i) => (
            <div key={step.label}>
              {/* 01, not 1. Cormorant Garamond's "1" is a bare stem with no
                  base flag and at this size reads as a capital I; the leading
                  zero resolves it, and the two-digit form is the brief's. */}
              <div
                style={{
                  fontFamily: tokens.display,
                  fontSize: isMobile ? 66 : 84,
                  fontWeight: 300,
                  lineHeight: 0.9,
                  color: tokens.gold,
                  marginBottom: 24,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              {/* Hairline under the numeral, not a card border — it groups the
                  numeral with its own step without drawing four boxes. */}
              <div style={{ height: 1, background: tokens.line, marginBottom: 22 }} />
              <h3
                style={{
                  fontFamily: tokens.body,
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: tokens.ink,
                  margin: 0,
                  marginBottom: 12,
                }}
              >
                {step.label}
              </h3>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 14,
                  lineHeight: 1.75,
                  color: tokens.inkSoft,
                  margin: 0,
                }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: isMobile ? 56 : 72, textAlign: 'center' }}>
          <CtaLink to="/how-it-works" variant="onDark">
            The Full Process
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
