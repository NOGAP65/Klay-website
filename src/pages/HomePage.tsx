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
      {/* Order is the argument, and each section only works once the one above
          it has done its job:
            Hero        — the promise. What your life could look like.
            Visualiser  — proof of concept. See it in your own room first.
            Social      — validation, placed AFTER desire exists. Proof shown
                          before someone wants the thing is just noise.
            Reviews     — validation in words, straight after it in pictures.
            Shop        — now they want it, show them what to buy.
            Final       — the close. Dark, one dominant CTA.
          Shop used to sit above the two proof sections, which asked people to
          choose a product before anything had established the product was
          worth choosing.

          Tonal rhythm that falls out of it: charcoal, warm white, parchment,
          parchment, warm white, charcoal, charcoal. Light resets attention
          after each dark moment, the two proof sections share one warm tone
          so they read as a single body of evidence, and the close and footer
          land as one continuous dark block. */}
      <main style={{ background: tokens.warmWhite }}>
        <HeroScene />
        <VisualiserSection />
        <SocialSection />
        <ReviewsScene />
        <ShopSection />
        <FinalScene />
        <Footer />
      </main>
      <SectionCounter />
    </>
  );
}
