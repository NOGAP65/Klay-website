import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { AppRoutes } from './router';

/** Scrolls to `#id` after the route renders.
 *
 * The nav's VISUALISE points at /#visualiser — the homepage's visualiser
 * section rather than the standalone /visualiser page — and react-router does
 * not act on a hash by itself. From another page the element does not exist
 * until the homepage has mounted, so this waits a frame and then a beat: the
 * homepage carries a video hero and several images above the target, and
 * scrolling on the first frame lands on a layout that is still settling.
 *
 * Smooth, because arriving mid-page with no travel reads as a broken link —
 * the movement is what tells you the section was already part of this page. */
function ScrollToHash() {
  // `search` IS A DEPENDENCY, and it has to be. The range row's cards link to
  // '/?type=blockout#visualiser' and '/?category=curtain#visualiser' — same path,
  // same hash, different query. Keyed on pathname and hash alone, clicking the
  // second card after the first was a no-op here: React Router saw no change in
  // either, so the configuration switched underneath a visitor who was never
  // carried to the section showing it.
  const { pathname, hash, search } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    let raf = 0;
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }, 120);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [pathname, hash, search]);

  return null;
}
export default function App() {
  return (
    <>
      <ScrollToHash />
      <AppRoutes />
    </>
  );
}
