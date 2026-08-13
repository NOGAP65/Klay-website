// ---------------------------------------------------------------------------
// How it works — four steps, each with its photograph.
//
// The photographs are back, and they are the strongest assets in the repository:
// purpose-shot for these four beats, and internally consistent down to the same
// technician appearing in step two and step four. A section explaining who does
// the work is exactly where photographs of the work belong, and typography alone
// was asking the reader to take it on trust.
//
// It is also SHORTER than the typographic version it replaces, which is the
// harder half of the job. Where the height went:
//
//   - The decorative numeral was 84px of Cormorant with a hairline under it and
//     margins either side, about 130px per column before a word was read. It is
//     now 20px, on the same line as the step's title, which is a whole line of
//     vertical rhythm rather than a block.
//   - The headline came down from the 64px section scale, and the gap beneath it
//     from 88 to 52.
//   - Section padding came down from the standard 120 to 88.
//
// That buys back more than the images cost, so the section carries four
// photographs and still occupies less of the page than it did with none.
// ---------------------------------------------------------------------------

import { tokens, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaLink, SectionHead } from './primitives';

const STEPS = [
  {
    label: 'Design online',
    body: 'Choose fabric, colour, size and operation, and see it on a photo of your own window.',
    image: '/images/lifestyle/step-1-configure.png',
    objectPosition: 'center',
  },
  {
    label: 'We measure your space',
    body: 'A Klay technician comes to you and measures every window himself. No DIY tape measure.',
    image: '/images/lifestyle/step-2-measure.png',
    objectPosition: 'center 40%',
  },
  {
    label: 'Custom manufactured',
    body: 'Cut and assembled to those exact measurements, in Australia, in seven to ten days.',
    image: '/images/lifestyle/step-3-manufacture.png',
    objectPosition: 'center',
  },
  {
    label: 'We install, you enjoy',
    body: 'The same technician returns to fit it, squares it off, and takes the packaging with him.',
    image: '/images/lifestyle/step-4-install.png',
    objectPosition: '38% center',
  },
];

export function HowItWorksSteps() {
  const isMobile = useIsMobile();

  return (
    <section
      id="how-it-works"
      style={{
        background: tokens.warmWhite,
        // 80, not the layout.sectionPad 120. This section earns its keep on
        // information rather than on atmosphere, and at 120 it was the longest
        // thing on the page for what it says.
        padding: isMobile ? '68px 24px' : '80px 80px',
      }}
    >
      <div style={{ maxWidth: layout.containerMax, margin: '0 auto' }}>
        <SectionHead
          label="How it works"
          title="From your screen to your window — we handle everything."
          align="center"
          // Wide enough, at this size, for the whole sentence to sit on ONE line
          // on a desktop. It was two lines at 44/820 and three at the 64px
          // section scale — 90px of headline for eleven words.
          maxWidth={1040}
          titleSize="clamp(26px, 3vw, 38px)"
          style={{ marginBottom: isMobile ? 36 : 48 }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 36 : 28,
          }}
        >
          {STEPS.map((step, i) => (
            <div key={step.label}>
              <div
                style={{
                  // 3:2 rather than 4:3 — the same width buys 40px less height
                  // per column, and none of these four shots needs the extra.
                  aspectRatio: '3 / 2',
                  overflow: 'hidden',
                  borderRadius: 2,
                  background: tokens.parchment,
                  marginBottom: 18,
                }}
              >
                <img
                  src={step.image}
                  alt={step.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: step.objectPosition,
                    display: 'block',
                  }}
                />
              </div>

              {/* Numeral and title on ONE line. This is where most of the height
                  saving is: the numeral keeps its gold Cormorant identity but
                  stops being a block of its own. */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    fontFamily: tokens.display,
                    fontSize: 20,
                    fontWeight: 400,
                    lineHeight: 1,
                    color: tokens.gold,
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 12.5,
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: tokens.ink,
                    margin: 0,
                  }}
                >
                  {step.label}
                </h3>
              </div>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 13.5,
                  lineHeight: 1.7,
                  color: tokens.inkSoft,
                  margin: 0,
                }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* A link rather than the filled button that was here. The section's job
            is reassurance, not conversion — and a full-size CTA cost 50px of
            button plus the air around it to repeat something the nav and the
            editorial panel both already offer. */}
        <div style={{ marginTop: isMobile ? 40 : 48, textAlign: 'center' }}>
          <CtaLink to="/how-it-works" variant="onDark" style={{ padding: '14px 32px' }}>
            See the full process
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
