import { useEffect, useRef } from 'react';
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
  const previousPath = useRef(pathname);

  useEffect(() => {
    const changed = previousPath.current !== pathname;
    previousPath.current = pathname;
    if (!hash) {
      if (changed) window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    if (hash === '#top') { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    let id: string;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const scroll = () => {
      const target = document.getElementById(id);
      if (!target) return false;
      target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      return true;
    };
    if (scroll()) return;
    // A lazy route may arrive after the initial navigation effect.
    const observer = new MutationObserver(() => { if (scroll()) observer.disconnect(); });
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true });
    const timer = window.setTimeout(() => observer.disconnect(), 8000);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
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
