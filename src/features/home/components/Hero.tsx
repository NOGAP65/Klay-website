import { CtaButton, usePrefersReducedMotion } from '@/ds';
import { scrollToId } from '@/shared';

const HERO_VIDEO = '/hero_video.mp4';
const HERO_STILL = '/images/rooms/room-living.png';

export function Hero() {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      {shouldReduceMotion ? (
        <img className="home-hero-media" src={HERO_STILL}
          alt="A sunlit room with made-to-measure window coverings" fetchPriority="high" />
      ) : (
        <video className="home-hero-media" autoPlay muted loop playsInline
          poster={HERO_STILL} aria-hidden="true" tabIndex={-1}>
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
      )}
      <div className="home-hero-shade" aria-hidden="true" />
      <div className="home-hero-content">
        <p className="home-banner-eyebrow">Klay Interiors</p>
        <h1 id="home-hero-title">The finishing layer<br />of <em>your home.</em></h1>
        <CtaButton onClick={scrollToId('visualiser')}>Design Yours</CtaButton>
      </div>
    </section>
  );
}
