import { useEffect } from 'react';
import { useKlayStore } from '../store';
import { ScrollProgress } from '../components/ScrollProgress';
import { Nav } from '../components/Nav';
import HeroScene from '../components/HeroScene';
import VisualiserSection from '../components/VisualiserSection';
import { JobsSection } from '../components/JobsSection';
import { ShopSection } from '../components/ShopSection';
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
      <main style={{ background: '#F5F2ED' }}>
        <HeroScene />
        <VisualiserSection />
        <JobsSection />
        <ShopSection />
        <ReviewsScene />
        <FinalScene />
        <Footer />
      </main>
      <SectionCounter />
    </>
  );
}
