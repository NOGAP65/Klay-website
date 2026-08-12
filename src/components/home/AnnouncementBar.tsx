// ---------------------------------------------------------------------------
// 1. Announcement bar — three messages, one at a time, four seconds each.
//
// It sits in normal flow at the very top of the document rather than being
// fixed, so it scrolls away and the nav takes the top edge for the rest of the
// page. Nav is told how far down to start via its `stickBelow` prop, which is
// where BAR_HEIGHT is read.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { tokens } from '../../theme';

const MESSAGES = [
  'Free in-home measure & installation included',
  'Made to order, delivered in 7–10 days',
  'Covering all of Victoria — book online today',
];

const INTERVAL_MS = 4000;
/** Half of the crossfade, so the outgoing message is gone before the next
 * one's text is swapped in — otherwise the two are legible at once. */
const FADE_MS = 320;

export const BAR_HEIGHT = 38;

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Two timers per cycle: fade out, then swap the text and fade back in.
    // The swap happens inside the fade so the change is never seen mid-word.
    const tick = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex(i => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => window.clearInterval(tick);
  }, []);

  return (
    <div
      // aria-live so the rotation is announced rather than silently replacing
      // itself for anyone on a screen reader.
      aria-live="polite"
      style={{
        height: BAR_HEIGHT,
        background: tokens.charcoal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          fontFamily: tokens.body,
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: '0.1em',
          color: tokens.warmWhite,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          opacity: visible ? 0.92 : 0,
          transition: `opacity ${FADE_MS}ms ease`,
        }}
      >
        {MESSAGES[index]}
      </span>
    </div>
  );
}
