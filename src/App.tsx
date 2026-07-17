import { useEffect } from 'react';
import { useKlayStore } from './store';
import { CustomCursor } from './components/CustomCursor';
import { ScrollProgress } from './components/ScrollProgress';
import { Nav } from './components/Nav';
import { HeroScene } from './components/HeroScene';
import { CollectionScene } from './components/CollectionScene';
import { CurtainsScene } from './components/CurtainsScene';
import { ProcessScene } from './components/ProcessScene';
import { QuoteScene } from './components/QuoteScene';
import { ReviewsScene } from './components/ReviewsScene';
import { FinalScene } from './components/FinalScene';
import { Footer } from './components/Footer';
import { SectionCounter } from './components/SectionCounter';

function App() {
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
      <CustomCursor />
      <ScrollProgress />
      <Nav />
      <main>
        <HeroScene />
        <CollectionScene />
        <CurtainsScene />
        <ProcessScene />
        <QuoteScene />
        <ReviewsScene />
        <FinalScene />
        <Footer />
      </main>
      <SectionCounter />
    </>
  );
}

export default App;
