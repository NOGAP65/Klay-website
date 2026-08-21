// ---------------------------------------------------------------------------
// 6. How Klay works — the four steps, on the banner between the range and the
// visualiser.
//
// IT USED TO BE A QUESTION AND A PROMISE: "Not sure where to start?", a line
// offering a three-question recommender, and a button. Two things were wrong with
// that. The recommender did not exist — there is no quiz route and no quiz
// component in the app, so the button went to the enquiry form and the page was
// describing a feature it did not have. And the slot was being spent on a mood
// rather than on information: a visitor who has just scrolled fourteen products
// is not asking "where do I start", they are asking "what actually happens if I
// buy this".
//
// SO THE FOUR STEPS GO HERE, and this is the first place on the homepage they are
// stated properly. The gold bar under the hero names them in 54px and links away;
// the /how-it-works page carries the photographs. Between those two the page had
// no place where somebody could actually READ the process, which is the question
// this position in the page raises.
//
// WHY THE PROCESS AND NOT THE DIFFERENTIATORS. "What makes us different" was the
// other option and it is the weaker one here, because the page already says it
// twice: the trust ticker opens with six credentials — free measure, installation
// included, made in Melbourne, warranty, coverage, no sales reps — and the about
// panel restates them in prose. A third telling adds nothing. The process is
// stated nowhere at length, and it is the thing that carries the answer to the
// real objection at this point in the page: somebody comes to your house, twice,
// and measures it himself.
//
// THE SCRIM IS FLAT NOW, and that follows from the content rather than being a
// taste change. It was a flat 0.45 with a radial layer on top of it — dark in the
// middle, thinning to 0.15 at 70% out — because the type was one centred column,
// and a flat wash heavy enough to hold type in the centre dulled the whole
// photograph to solve a problem that only existed there.
//
// Four columns spread across the full width put type exactly where that radial
// was thinnest. Two gradients also make the actual alpha behind any given word
// unknowable: you cannot solve for a contrast ratio when the ground under the
// fourth step depends on how far it happens to sit from the frame's centre. One
// flat layer can be solved for, and is — see SCRIM.
//
// The photograph stays. It is the whole back wall of a room in sheers, which is
// atmosphere rather than a product shot, and that is still right for the one
// section on the page that is about the service rather than about a product.
// ---------------------------------------------------------------------------

import { tokens, headline, layout, space, type as typeScale } from '../../theme';
import { useMediaQuery } from '../../hooks/useIsMobile';
import { CtaLink } from './primitives';
import { STEPS } from '../../data/steps';

const BANNER = '/images/range/sheer-curtains.jpg';

/** WHERE FOUR COLUMNS STOP FITTING. Below this the row goes to two, and below
 * STACK to one.
 *
 * 1000 rather than the site's 768 for the same reason the steps bar uses 1000:
 * the labels are sentences — "We measure your space", "We install, you enjoy" —
 * not single words, and four of them across a 940px row leaves 220px a column,
 * where a 26px display label breaks to three lines and the step stops reading as
 * a step. */
const FOUR_UP = '(min-width: 1000px)';
const STACK = '(max-width: 560px)';

/** THE SCRIM, solved against the worst case rather than chosen.
 *
 * This photograph is pale cloth in sunlight, so the BRIGHT end governs. Sampled
 * every pixel of the content box at 1440x562 under this crop, the brightest
 * ground any type can land on is #EDEDED — 0.851 relative luminance, which is
 * very nearly paper. Compositing ink (#1D1D1D) over it at alpha a:
 *
 *   warm white at 4.5:1  needs a >= 0.565
 *   gold at 3:1          needs a >= 0.740
 *
 * GOLD IS WHAT SETS IT, not the body copy, and that is the opposite of what it
 * looks like. 0.70 was the first value tried and it holds warm white at 6.34:1
 * with room to spare while leaving the gold numerals at 2.68:1 — a fail, and
 * one that would have shipped had the alpha been picked off the body copy alone.
 * 0.75 measures warm white 7.49:1 and gold 3.17:1, clearing both with margin at
 * the single brightest pixel in the frame; almost all of the area is darker
 * still. A heavy wash, and right for what this section now is: the photograph is
 * a ground under four columns of information, not the subject. */
const SCRIM = 0.75;

export function RecommendationBanner() {
  const fourUp = useMediaQuery(FOUR_UP);
  const stacked = useMediaQuery(STACK);

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        // ONE RATIO FOR THE FULL-BLEED BANNER ROLE, shared with the closing CTA:
        // 1440/2.56 = 562. A floor rather than a height, so the two-column and
        // stacked arrangements can be as tall as their content needs while the
        // desktop one holds the role's proportion exactly.
        minHeight: stacked ? 0 : 562,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: stacked ? `${space.xl}px ${space.md}px` : `${space.xxl}px 80px`,
        // Behind the photograph rather than beside it — it is what shows while
        // the image is still loading, and charcoal keeps that moment on-brand
        // instead of flashing white.
        background: tokens.charcoal,
      }}
    >
      <img
        src={BANNER}
        // Decorative. The steps carry the meaning and the room is not a product
        // being described.
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // Slightly below centre: the top third of this frame is ceiling track
          // and the bottom third is floor, so the cloth sits low in a letterbox
          // crop of it.
          objectPosition: 'center 58%',
          display: 'block',
        }}
      />

      {/* FLAT, not radial — see the note at the top of the file. One layer now
          rather than two, because a flat wash under a radial one was two
          gradients doing one job and made the real alpha behind any given word
          impossible to reason about. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(29,29,29,${SCRIM})`,
        }}
      />

      <div style={{ position: 'relative', width: '100%', maxWidth: layout.gridMax }}>
        {/* THE SECTION'S NAME, and nothing else above the steps. The headline it
            replaces was a question with a paragraph under it selling a feature
            that does not exist; the steps below are the content now, so anything
            here beyond naming them is text between the reader and the thing they
            came to read. */}
        <h2
          style={{
            ...headline.section,
            color: tokens.warmWhite,
            textAlign: 'center',
          }}
        >
          How Klay works
        </h2>

        {/* AN ORDERED LIST, because that is what this is. The numerals are
            rendered rather than list markers so they can take the display face
            at the step-number size, and the list-style goes with them. */}
        <ol
          style={{
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: fourUp ? 'repeat(4, 1fr)' : stacked ? '1fr' : 'repeat(2, 1fr)',
            gap: stacked ? space.lg : space.xl,
            margin: `${space.xl}px 0 0`,
            padding: 0,
            textAlign: 'left',
          }}
        >
          {STEPS.map((step, i) => (
            <li key={step.label}>
              {/* ONE RULE, SEVERED FOUR TIMES — a timeline, not four captions.
                  Every rule is the same gold now. It was gold on the first and
                  warm white on the other three, to say where the sequence
                  started; the numerals already say that, and making one entry
                  differ breaks the thing that lets a reader compare the four at
                  a glance. Identical rules separated only by the grid's gaps read
                  as a single line running the width of the banner and cut between
                  steps, which is the sequence stated in one stroke. */}
              <div
                style={{
                  height: 1,
                  background: tokens.fillStrong,
                  marginBottom: space.md,
                }}
              />

              {/* NUMERAL AND VERB ON ONE LINE. Stacked, the numeral was a
                  separate object above the label and the eye had to assemble
                  "01" and "Design" into one thing. Set together, baseline
                  aligned, they read as "01 Design" — which is what the step is
                  called. Stacking was only necessary while the labels were long
                  enough to wrap. */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: space.sm,
                  marginBottom: space.xs,
                }}
              >
                <span
                  style={{
                    ...typeScale.numeric,
                    // Gold, and it is the reason the scrim is as heavy as it is:
                    // at 32px this is large text, so 3:1 applies, and gold on
                    // the brightest pixel in the frame is the tightest ratio in
                    // the section — 3.17:1 against warm white's 7.49:1.
                    color: tokens.onDark,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 style={{ ...typeScale.card, color: tokens.warmWhite }}>{step.label}</h3>
              </div>

              {/* WHO DOES IT, in the same slot in all four. This is the argument
                  the section is actually making — the customer does one of these
                  and Klay does three — and it used to be buried inside two of the
                  labels and missing from the other two.
                  Warm white rather than gold, though gold is what a secondary
                  line like this would normally take here. At 10px it is small
                  text, so it needs 4.5:1, and gold measures 3.17 on this
                  photograph. The caps and the letter-spacing separate it from the
                  sentence below without spending colour on it. */}
              <div
                style={{
                  ...typeScale.micro,
                  color: tokens.warmWhite,
                  marginBottom: space.sm,
                }}
              >
                {step.actor}
              </div>

              <p
                style={{
                  ...typeScale.body,
                  // Warm white at full strength, not the onDarkMuted 0.6 the
                  // supporting role uses. That token is defined against a flat
                  // charcoal ground; over a photograph it loses the sentence in
                  // the bright half of the frame even under this scrim.
                  color: tokens.warmWhite,
                  opacity: 0.88,
                }}
              >
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        {/* ONE ACTION, and it is the one the steps have just described. It was
            "Get My Recommendation" pointing at the enquiry form, which was the
            right destination under the wrong name — the quiz it promised does not
            exist. Step two is a technician coming to the house, so booking that
            is what somebody who has read this wants to do next, and the enquiry
            form is genuinely where it happens. */}
        <div style={{ marginTop: space.xl, textAlign: 'center' }}>
          <CtaLink to="/contact">Book a Free Measure</CtaLink>
        </div>
      </div>
    </section>
  );
}
