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
import { SectionBand, TextLink } from './primitives';

// Each body is trimmed to land on exactly two lines in a quarter-width column.
// That is not fussiness: at three lines one column ran deeper than the others and
// the row's baselines stopped agreeing, which is the kind of unevenness that
// makes a tight section look accidental rather than compressed.
const STEPS = [
  {
    label: 'Design online',
    body: 'Choose fabric, colour, size and operation, and see it on your own window.',
    image: '/images/lifestyle/step-1-configure.png',
    objectPosition: 'center',
  },
  {
    label: 'We measure your space',
    body: 'A Klay technician comes to you and measures every window himself.',
    image: '/images/lifestyle/step-2-measure.png',
    objectPosition: 'center 42%',
  },
  {
    label: 'Custom manufactured',
    body: 'Cut and assembled to your exact measurements in Australia, in 7–10 days.',
    image: '/images/lifestyle/step-3-manufacture.png',
    objectPosition: 'center',
  },
  {
    label: 'We install, you enjoy',
    body: 'The same technician returns to fit it and takes the packaging with him.',
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
        // Charcoal. This section has two jobs at once — it separates the category
        // tiles above from the range grid below, both of which are walls of
        // photography on warm white, AND it delivers the four steps. Parchment
        // was too close to warm white to do the first job: one deliberate step
        // down still read as the same field continuing. Dark does it in one move,
        // and the four step photographs are light enough to gain from the
        // contrast rather than fight it.
        background: tokens.charcoal,
      }}
    >
      {/* The page's shared band, and the reason this section stopped looking
          bolted on. It was the only one of the nine that opened with SectionHead
          instead — a 38px centred headline with 44px of padding, against the 56px
          headline and 76px the bands give every other section. One section
          introducing itself in a different voice and at two-thirds the scale is
          most of what "it doesn't hang together" actually is, and it is invisible
          in isolation: you only see it scrolling past the sections either side.
          The tighter padding also put the eyebrow underneath the fixed nav
          whenever the hero's How It Works button scrolled here, so the section
          opened on a headline with its label hidden.

          The headline lost "— we handle everything" with the change. At the band's
          scale the full sentence ran to two lines, and the four steps below it are
          the proof of that clause anyway. */}
      <SectionBand
        label="How it works"
        title="From your screen to your window."
        isMobile={isMobile}
        onDark
      />

      <div style={{ padding: isMobile ? '0 24px 72px' : '0 80px 96px' }}>
        <div style={{ maxWidth: layout.containerMax, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 30 : 24,
          }}
        >
          {STEPS.map((step, i) => (
            <div key={step.label}>
              <div
                style={{
                  // 2:1. A letterbox rather than a picture, which is the right
                  // shape when the row is a strip of evidence beside its text
                  // rather than a gallery — and 46px shorter per column than the
                  // 3:2 it started at. All four shots have their subject on the
                  // horizontal centre line, so none of them loses anything.
                  aspectRatio: '2 / 1',
                  overflow: 'hidden',
                  borderRadius: 2,
                  // A hairline placeholder rather than a pale block: on charcoal,
                  // a cream box would flash bright before the image lands.
                  background: 'rgba(245,242,237,0.06)',
                  marginBottom: 14,
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
                    color: tokens.warmWhite,
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
                  color: tokens.onDarkMuted,
                  margin: 0,
                }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* A text link, not a button. The section's job is reassurance rather
            than conversion, and a filled CTA cost 50px of button plus the air
            around it to repeat what the nav and the editorial panel both already
            offer. */}
        <div style={{ marginTop: isMobile ? 34 : 40, textAlign: 'center' }}>
          <TextLink to="/how-it-works" onDark>
            See the full process →
          </TextLink>
        </div>
        </div>
      </div>
    </section>
  );
}
