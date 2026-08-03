import { useEffect } from 'react';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { ScrollProgress } from '../components/ScrollProgress';
import { Nav } from '../components/Nav';
import HeroScene from '../components/HeroScene';
import VisualiserSection from '../components/VisualiserSection';
import { ProcessSection } from '../components/ProcessSection';
import { ShopSection } from '../components/ShopSection';
import { ReviewsSection } from '../components/ReviewsSection';
import { FinalScene } from '../components/FinalScene';
import { Footer } from '../components/Footer';
import { SectionCounter } from '../components/SectionCounter';

export default function HomePage() {
  const setScrollY = useKlayStore((s) => s.setScrollY);

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
      <ScrollProgress />
      <Nav />
      <main style={{ background: tokens.warmWhite }}>
        {/* Hero — video with centered CTAs */}
        <HeroScene />
        {/* Visualiser — the key differentiator */}
        <VisualiserSection />
        {/* Process — how it works */}
        <ProcessSection />
        {/* Shop by category */}
        <ShopSection />
        {/* Reviews — customer testimonials */}
        <ReviewsSection />
        {/* Final CTA — charcoal close */}
        <FinalScene />
        <Footer />
      </main>
      <SectionCounter />
    </>
  );
}
