import { useEffect } from 'react';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { ScrollProgress } from '../components/ScrollProgress';
import { Nav } from '../components/Nav';
import HeroScene from '../components/HeroScene';
import VisualiserSection from '../components/VisualiserSection';
import { ShopSection } from '../components/ShopSection';
import { SocialSection } from '../components/SocialSection';
import { ReviewsScene } from '../components/ReviewsScene';
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
      {/* Tonal rhythm, top to bottom: charcoal, warm white, parchment,
          charcoal, warm white, ink, ink. Light and dark alternate the whole
          way down and the two closing sections darken into the footer, so
          the page builds instead of flickering between tones. */}
      <main style={{ background: tokens.warmWhite }}>
        <HeroScene />
        <VisualiserSection />
        <ShopSection />
        <SocialSection />
        <ReviewsScene />
        <FinalScene />
        <Footer />
      </main>
      <SectionCounter />
    </>
  );
}
