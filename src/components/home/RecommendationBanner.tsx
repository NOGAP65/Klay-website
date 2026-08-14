// ---------------------------------------------------------------------------
// 7. The catch — for the customer who isn't ready to browse.
//
// It sits between the range and the visualiser deliberately. Someone who has just
// scrolled past four priced products without clicking one is telling you they
// don't know which they need, and the next thing they meet should be an offer to
// decide for them rather than a configurator that assumes they already have.
//
// Short by design — it is a divider that happens to convert, not a section
// competing with the two it separates. One headline, one line, one button, and
// no photograph.
//
// ON THE GROUND. Charcoal, per the brief, and it holds up here: the range grid
// above is parchment and the visualiser below is ink, so this reads as the page
// beginning to darken into the centrepiece rather than as a dark bar dropped
// between two light ones. Gold on charcoal measures 5.6:1, so the headline is
// gold as briefed — the same headline on parchment would be 1.9:1 and would have
// to be ink instead.
//
// ON THE DESTINATION. The three-question recommender this CTA describes does not
// exist — there is no quiz route and no quiz component in the app. The button
// goes to the enquiry form, which is a real page staffed by a real person, so the
// promise is kept, just not self-service. Point it at the quiz once that is
// built.
// ---------------------------------------------------------------------------

import { tokens, headline, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaLink } from './primitives';

export function RecommendationBanner() {
  const isMobile = useIsMobile();

  return (
    <section
      style={{
        background: tokens.charcoal,
        minHeight: isMobile ? 260 : 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '64px 24px' : '76px 80px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: layout.containerMax }}>
        {/* Below the section scale on purpose. This is a divider, and at the full
            64px it competed with the range headline above and the visualiser
            headline below — three section headlines of equal weight in one
            screen, one of which is a passing offer. */}
        <h2 style={{ ...headline.section, color: tokens.gold, fontSize: 'clamp(32px, 4vw, 48px)' }}>
          Not sure where to start?
        </h2>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 15,
            lineHeight: 1.7,
            color: tokens.warmWhite,
            margin: '18px auto 0',
            maxWidth: 560,
            opacity: 0.86,
          }}
        >
          Answer a few questions and we&rsquo;ll recommend the right product for your room.
        </p>
        <div style={{ marginTop: 32 }}>
          <CtaLink to="/contact">Get My Recommendation</CtaLink>
        </div>
      </div>
    </section>
  );
}
