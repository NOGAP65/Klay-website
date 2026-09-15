import { lazy, type CSSProperties } from 'react';

import { tokens } from '@/ds';

import { Hero } from './Hero';
import { DeferredSection } from './DeferredSection';
import { RecommendationBanner } from './RecommendationBanner';
import { SocialProof } from './SocialProof';
import { StepsBar } from './StepsBar';
import { Testimonials } from './Testimonials';
import './homeBanners.css';

const RangeRow = lazy(() => import('./RangeRow').then(module => ({ default: module.RangeRow })));
const VisualiserShowcase = lazy(() => import('./VisualiserShowcase').then(module => ({ default: module.VisualiserShowcase })));

export default function HomePage() {

  return (
    <>

      <main style={{ background: tokens.paper,
        '--banner-paper': tokens.paper, '--banner-card': tokens.card,
        '--banner-band': tokens.band, '--banner-ink': tokens.ink,
        '--banner-muted': tokens.inkSoft, '--banner-on-dark': tokens.onDarkMuted,
        '--banner-accent': tokens.accent, '--banner-accent-edge': tokens.accentEdge,
        '--banner-on-accent': tokens.onAccent, '--banner-line': tokens.line,
        '--banner-display': tokens.display, '--banner-body': tokens.body,
      } as CSSProperties}>
        <div className="home-opening">
          <Hero />
          <StepsBar />
        </div>
        <DeferredSection id="featured-products"><RangeRow /></DeferredSection>
        <RecommendationBanner />
        <DeferredSection id="visualiser"><VisualiserShowcase /></DeferredSection>
        <SocialProof />
        <Testimonials />

      </main>
    </>
  );
}
