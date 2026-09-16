import { tokens } from '../tokens';

import './loadingIndicator.css';

// Lightweight line icons; only opacity/transform animate, with no render timer.
const LOADING_ICONS = [
  { name: 'Blinds', path: 'M10 10H54V16H10Z M13 16V43H51V16 M13 43H51 M32 43V51 M53 18V46 M51 46H55V51H51Z' },
  { name: 'Curtains', path: 'M7 10H57 M11 13V53Q16 49 21 53Q26 49 29 53V13 M35 13V53Q40 49 45 53Q50 49 53 53V13 M17 14V49 M23 14V49 M41 14V49 M47 14V49' },
  { name: 'Wardrobes', path: 'M10 9H54V55H10Z M32 9V55 M27 29V36 M37 29V36 M14 55V58 M50 55V58' },
  { name: 'Shelving', path: 'M11 9H53V55H11Z M11 21H53 M11 33H53 M11 45H53 M32 21V55 M17 14V21 M22 12V21 M39 26H47V33 M16 38H27V45' },
];

/** Honest progress feedback: mounted only while work is pending. */
export function LoadingIndicator({ label = 'Loading', overlay = false, delayed = false }: { label?: string; overlay?: boolean; delayed?: boolean }) {
  return <div className={`loading-indicator${overlay ? ' loading-indicator-overlay' : ''}${delayed ? ' loading-indicator-delayed' : ''}`}
    role="status" aria-label={label} style={{ background: tokens.charcoal, color: tokens.onDark, fontFamily: tokens.body }}>
    <div className="loading-indicator-content">
      <div className="loading-indicator-mark" aria-hidden="true">
        {LOADING_ICONS.map((icon, index) => <svg key={icon.name} className="loading-indicator-icon"
          data-loading-icon={icon.name} viewBox="0 0 64 64" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false"
          style={{ animationDelay: `${index === 0 ? 0 : (index - 4) * 1.6}s` }}>
          <path d={icon.path} />
        </svg>)}
      </div>
      <span>{label}…</span>
    </div>
  </div>;
}
