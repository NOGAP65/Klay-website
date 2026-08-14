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
//    4  Where do I start?                category grid
//    5  Who does the work?               how it works
//    6  What does it cost?               range grid
//    7  What if I don't know?            recommendation banner
//    8  What will it look like?          visualiser
//    9  Why curtains / why blinds?       editorial panels
//   10  Does it really look like that?   install strip
//   11  Anything else to know?           journal tiles
//   12  Does anyone else trust them?     reviews
//   13  Right — how do I start?          final CTA
//
// THE GROUNDS. No two adjacent sections share one, top to bottom: charcoal ticker,
// dark hero, warm white, charcoal, parchment, charcoal, ink, warm white, parchment,
// warm white, charcoal, warm white, charcoal, warm white. The visualiser is the
// only ink on the page — the deepest ground under the brightest panel, which is
// what makes the one section that does real work look like the centrepiece rather
// than another band. The charcoal banner immediately above it is the page starting
// to darken into that, not a bar dropped between two light sections.
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
import { CategoryGrid } from '../components/home/CategoryGrid';
import { HowItWorksSteps } from '../components/home/HowItWorksSteps';
import { RangeGrid } from '../components/home/RangeGrid';
import { RecommendationBanner } from '../components/home/RecommendationBanner';
import { VisualiserShowcase } from '../components/home/VisualiserShowcase';
import { AlternatingPanels } from '../components/home/AlternatingPanels';
import { SocialProof } from '../components/home/SocialProof';
import { InspirationTiles } from '../components/home/InspirationTiles';
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

      {/* 2 — Nav. Transparent over the hero (solid={false}), solid charcoal once
          compressed, and offset by the ticker's height until it's gone. */}
      <Nav solid={false} stickBelow={BAR_HEIGHT} />

      <main style={{ background: tokens.warmWhite }}>
        {/* 3 — The promise, full bleed under the transparent nav. */}
        <Hero />

        {/* 4 — Indoor / Outdoor / Wardrobes. Each tile is a real page. */}
        <CategoryGrid />

        {/* 5 — Who does the work. Before anything is priced, because "who
            measures it?" is the objection that stops people shopping at all. */}
        <HowItWorksSteps />

        {/* 6 — Four products with their prices on them. The section that says
            Klay does not hide numbers behind a quote form. */}
        <RangeGrid />

        {/* 7 — The catch, for anyone who read four prices and still doesn't know
            which one is theirs. */}
        <RecommendationBanner />

        {/* 8 — The centrepiece: configure it, see it on your own window, buy it. */}
        <VisualiserShowcase />

        {/* 9 — One panel per range, one idea each: light, then control. The long
            copy on the page, and the only place either range is argued for. */}
        <AlternatingPanels />

        {/* 10 — What it looks like once it's up. Trust, not conversion. */}
        <SocialProof />

        {/* 11 — Four journal tiles. The one section not trying to sell, which is
            what stops the page reading as a catalogue. */}
        <InspirationTiles />

        {/* 12 — Reviews, moving. */}
        <Testimonials />

        {/* 13 — One last ask, pointing back at the tool. */}
        <FinalCta />

        {/* 14 — Footer. */}
        <Footer />
      </main>
    </>
  );
}
