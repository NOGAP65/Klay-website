import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import { tokens } from '@/ds';

import { useCartStore } from '../store/cartStore';

import './cartRecovery.css';

const DISMISSED_KEY = 'klay-cart-reminder-dismissed';

function wasDismissed() {
  try { return sessionStorage.getItem(DISMISSED_KEY) === 'yes'; }
  catch { return false; }
}

/** A quiet return path for an existing basket; never appears in response to an exit gesture. */
export function CartRecovery({ onDismiss }: { onDismiss?: () => void }) {
  const [hasExistingCart] = useState(() => useCartStore.getState().items.length > 0);
  const [isDismissed, setDismissed] = useState(wasDismissed);
  const items = useCartStore(store => store.items);
  if (!hasExistingCart || isDismissed || !items.length) return null;
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const style = {
    '--recovery-paper': tokens.card, '--recovery-ink': tokens.ink, '--recovery-muted': tokens.inkSoft,
    '--recovery-line': tokens.lineFaint, '--recovery-accent': tokens.accent,
    '--recovery-body': tokens.body,
  } as CSSProperties;
  return <aside className="cart-recovery" style={style} aria-label="Saved cart">
    <div><strong>Pick up where you left off.</strong><p>{count} item{count === 1 ? '' : 's'} in your cart, with your chosen finishes.</p></div>
    <Link to="/cart">Resume your cart <span aria-hidden="true">→</span></Link>
    <button type="button" aria-label="Dismiss saved cart reminder" onClick={() => {
      onDismiss?.();
      setDismissed(true);
      try { sessionStorage.setItem(DISMISSED_KEY, 'yes'); } catch { /* In-memory dismissal still works without browser storage. */ }
    }}>×</button>
  </aside>;
}
