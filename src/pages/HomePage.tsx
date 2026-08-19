// ---------------------------------------------------------------------------
// The homepage. Fourteen sections, one job each.
//
// It got longer again, and deliberately. The short version was one clean spine —
// promise, categories, process, tool, ranges, proof, ask — and it read well, but
// it had removed the three things that actually sell: a grid with prices on it,
// a catch for the customer who doesn't know what they want, and any reason to be
// here other than to buy. Those are back as sections 6, 7 and 11.
//
// EVERY SECTION ANSWERS ONE QUESTION, in the order a customer asks it:
//
//    1  Is this legitimate?              trust ticker
//    3  What is this?                    hero
//    4  Where do I start?                steps bar
//    5  What can I buy, what's it cost?  range carousel
//    6  What if I don't know?            recommendation banner
//    7  What will it look like?          visualiser
//    8  Who actually does the work?      about panel
//    9  Does it really look like that?   install strip
//   10  Does anyone else trust them?     reviews
//   11  Right — how do I start?          final CTA
//
// THE BIG CHANGE: PRODUCTS FOLLOW CATEGORIES DIRECTLY. How It Works used to sit
// between them, and that is where the page fell over. The customer picks a
// category — the first genuine buying signal they give — and the page answered it
// by explaining its own logistics for a screen and a half before showing a single
// price. Kookai, Politix and Monday all run hero → categories → products, and none
// of them puts a service story in front of the catalogue; the customer who wants
// to know who measures it asks that question when they are close to buying, not
// while they are still browsing.
//
// So How It Works moved down to sit after the two range panels, where it stops
// being an interruption and becomes the answer to the objection those panels
// raise. It is not load-bearing that high anyway: the trust ticker leads with the
// free measure and the installation, the hero's sub-line says "measured and
// installed by experts", and the hero's second button goes straight to it.
//
// THE GROUNDS. No two adjacent sections share one, top to bottom: charcoal ticker,
// dark hero, warm white, parchment, charcoal, ink, warm white, parchment, charcoal,
// warm white, charcoal, warm white, charcoal, warm white. The visualiser is the
// only ink on the page — the deepest ground under the brightest panel, which is
// what makes the one section that does real work look like the centrepiece rather
// than another band. The charcoal banner immediately above it is the page starting
// to darken into that, not a bar dropped between two light sections.
//
// The reorder left the grounds working without touching a single section's colour:
// How It Works keeps its charcoal, and in its new slot it lands between the
// parchment of the second range panel and the warm white of the install strip.
//
// Section components live in components/home. Nav and Footer are shared with
// every other page and stay in components/.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { TrustTicker, BAR_HEIGHT } from '../components/home/TrustTicker';
import { Hero } from '../components/home/Hero';
import { StepsBar } from '../components/home/StepsBar';
import { RangeCarousel } from '../components/home/RangeCarousel';
import { RecommendationBanner } from '../components/home/RecommendationBanner';
import { VisualiserShowcase } from '../components/home/VisualiserShowcase';
import { AboutPanel } from '../components/home/AboutPanel';
import { SocialProof } from '../components/home/SocialProof';
import { Testimonials } from '../components/home/Testimonials';
import { FinalCta } from '../components/home/FinalCta';

export default function HomePage() {
  const setScrollY = useKlayStore((s) => s.setScrollY);

  // Publishes scroll position for the nav, which uses it twice: to swap from
  // transparent to solid charcoal, and to slide up as the trust ticker scrolls
  // off. rAF-throttled — this fires on every scroll event.
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);

  return (
    <>
      {/* 1 — Trust credentials, moving. In flow rather than fixed, so it scrolls
          away and the nav takes the top edge for the rest of the page. */}
      <TrustTicker />

      {/* 2 — Nav. Solid charcoal at every scroll position, like every other page
          on the site — it used to start transparent over the hero and fill in on
          scroll, which meant the logo and the links sat on whatever frame of the
          video happened to be playing behind them. Still offset by the ticker's
          height until that has scrolled away. */}
      <Nav stickBelow={BAR_HEIGHT} />

      <main style={{ background: tokens.warmWhite }}>
        {/* 3 — The promise, full bleed under the transparent nav. */}
        <Hero />

        {/* 4 — The whole process in one gold line. It replaces a 635px How It
            Works section: the four steps are reassurance rather than persuasion,
            and answering "who does the work?" here means the customer meets the
            range already knowing how buying works. The detail moved to
            /how-it-works, which the bar links to. */}
        <StepsBar />

        {/* 5 — The whole range in one row: six tiles, arrows, and it advances on
            its own. This is the category grid and the SKU grid merged — they were
            asking the same question twice, and neither was asking it the way a
            customer thinks. See the note at the top of RangeCarousel. */}
        <RangeCarousel />

        {/* 6 — The catch, for anyone who read the range and still doesn't know
            which one is theirs. */}
        <RecommendationBanner />

        {/* 7 — The centrepiece: configure it, see it on your own window, buy it. */}
        <VisualiserShowcase />

        {/* 8 + 9 — THE EVIDENCE, and these two are a pair.
            "Here are real jobs" followed immediately by "here is who did them"
            is one argument told in two registers — photographs, then the
            sentences behind them. Split apart they were two isolated trust
            sections; together the install strip functions as the about panel's
            evidence and the panel functions as the strip's caption. */}
        <SocialProof />

        {/* Who turns up at the house — the only section about Klay rather than
            about a product. It used to sit between the visualiser and the
            install strip, interrupting the run of evidence with a page of
            prose. Nobody arrives wanting to read about a window furnishings
            business; they read it once they have decided they might buy. */}
        <AboutPanel />

        {/* 10 — One last ask.
            IT CANNOT SIT DIRECTLY UNDER THE VISUALISER, which is where it was.
            Its button is Start Designing and it does not navigate — it scrolls
            to #visualiser. Immediately below that section the CTA bounces you a
            few hundred pixels back up to the thing you just scrolled past,
            which reads as a broken button rather than an invitation. Down here
            it is a real journey back to the top of the page's centrepiece. */}
        <FinalCta />

        {/* 11 — Reviews, moving, and last.
            After the ask rather than before it, which is the unusual way round.
            The reasoning: the nav carries Book a Measure on every screen, so the
            ask is never actually more than a glance away, and what somebody
            wants at the very bottom of a long page is not another button but
            other people saying it went fine. It also means the page ends on
            somebody else's voice instead of Klay's, which is a better last
            impression than a second CTA. */}
        <Testimonials />

        {/* 12 — Footer. */}
        <Footer />
      </main>
    </>
  );
}
