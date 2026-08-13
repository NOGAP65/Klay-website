// ---------------------------------------------------------------------------
// The homepage. Nine sections, one job each.
//
// It got shorter on purpose. The product-range grid moved to the three category
// pages, where a customer who has chosen a side of the glass can see everything
// on it; the gold guarantee bar, the "Not sure where to start?" catch and the
// journal tiles all came off. What is left is one spine with nothing on it twice:
// the promise, the three categories, who does the work, the tool, the two ranges
// at length, proof, reviews, and one last ask.
//
// THE GROUNDS. No two adjacent sections share one, top to bottom: charcoal, warm
// white, charcoal, ink, warm white, parchment, warm white, parchment, charcoal,
// warm white. The visualiser is the only ink on the page — the deepest ground
// under the brightest panel, which is what makes the one section that does real
// work look like the centrepiece rather than another band.
//
// Section components live in components/home. Nav and Footer are shared with
// every other page and stay in components/.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { AnnouncementBar, BAR_HEIGHT } from '../components/home/AnnouncementBar';
import { Hero } from '../components/home/Hero';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { HowItWorksSteps } from '../components/home/HowItWorksSteps';
import { VisualiserShowcase } from '../components/home/VisualiserShowcase';
import { AlternatingPanels } from '../components/home/AlternatingPanels';
import { SocialProof } from '../components/home/SocialProof';
import { Testimonials } from '../components/home/Testimonials';
import { FinalCta } from '../components/home/FinalCta';

export default function HomePage() {
  const setScrollY = useKlayStore((s) => s.setScrollY);

  // Publishes scroll position for the nav, which uses it twice: to swap from
  // transparent to solid charcoal, and to slide up as the announcement bar
  // scrolls off. rAF-throttled — this fires on every scroll event.
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
      {/* 1 — Announcement bar, in flow so it scrolls away. */}
      <AnnouncementBar />

      {/* 2 — Nav. Transparent over the hero (solid={false}), solid charcoal
          once compressed, and offset by the bar's height until it's gone. */}
      <Nav solid={false} stickBelow={BAR_HEIGHT} />

      <main style={{ background: tokens.warmWhite }}>
        {/* 3 — The promise, full bleed under the transparent nav. */}
        <Hero />

        {/* 4 — Indoor / Outdoor / Wardrobes. Each tile is now a real page. */}
        <CategoryGrid />

        {/* 5 — Who does the work. Before the tool, because "who measures it?" is
            the objection that stops people configuring anything. */}
        <HowItWorksSteps />

        {/* 6 — The centrepiece: configure it, see it, buy it. */}
        <VisualiserShowcase />

        {/* 7 — One panel per range, one idea each: light, then control. The long
            copy on the page, and the only place either range is argued for. */}
        <AlternatingPanels />

        {/* 8 — What it looks like once it's up. Trust, not conversion. */}
        <SocialProof />

        {/* 9 — Reviews, moving. */}
        <Testimonials />

        {/* 10 — One last ask, pointing back at the tool. */}
        <FinalCta />

        {/* 11 — Footer. */}
        <Footer />
      </main>
    </>
  );
}
