import { useEffect, useRef, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { MAX_QUANTITY } from '@/core/pricing';

import { tokens } from '@/ds';

import { useCartStore, type CartFeedback as CartNotice } from '../store/cartStore';

import './cartFeedback.css';

function feedbackCopy(feedback: CartNotice | null) {
  if (!feedback) return { title: '', detail: '' };
  const titles = { removed: 'Removed from your cart', restored: 'Restored to your cart',
    limit: 'Quantity limit reached', added: 'Added to your cart' };
  const detail = feedback.kind === 'limit' ? `You can add up to ${MAX_QUANTITY} of this configuration.`
    : feedback.kind === 'removed' ? 'Your choices can be restored below.'
      : feedback.item.priceOnMeasure ? 'Saved with your choices. Price confirmed at measure.' : 'Your selected size and finishes are saved.';
  return { title: titles[feedback.kind], detail };
}

/** One confirmation for all purchase surfaces. Never opens a modal or moves focus on arrival. */
export function CartFeedback() {
  const feedback = useCartStore(store => store.feedback);
  const dismissFeedback = useCartStore(store => store.dismissFeedback);
  const undoRemoval = useCartStore(store => store.undoRemoval);
  const location = useLocation();
  const panelRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  useEffect(() => { dismissFeedback(); }, [location.pathname, dismissFeedback]);
  useEffect(() => {
    if (feedback && document.activeElement instanceof HTMLElement && !panelRef.current?.contains(document.activeElement)) {
      openerRef.current = document.activeElement;
    }
  }, [feedback]);
  const dismiss = () => {
    if (panelRef.current?.contains(document.activeElement) && openerRef.current?.isConnected) {
      openerRef.current.focus({ preventScroll: true });
    }
    dismissFeedback();
  };
  const style = {
    '--feedback-paper': tokens.card, '--feedback-ink': tokens.ink, '--feedback-muted': tokens.inkSoft,
    '--feedback-line': tokens.line, '--feedback-accent': tokens.accent, '--feedback-on-accent': tokens.onAccent,
    '--feedback-font': tokens.body,
  } as CSSProperties;
  const { title, detail } = feedbackCopy(feedback);

  return <div className="cart-feedback-host" style={style}>
    <div className="cart-feedback-announcement" role="status" aria-atomic="true">
      {feedback && `${title}. ${feedback.quantity ? `${feedback.quantity} × ` : ''}${feedback.item.name}.`}
    </div>
    {feedback && <section ref={panelRef} className="cart-feedback" aria-label="Cart confirmation"
      onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); dismiss(); } }}>
      <button type="button" className="cart-feedback-close" aria-label="Dismiss cart confirmation" onClick={dismiss}>×</button>
      <p className="cart-feedback-title">{title}</p>
      <p className="cart-feedback-product">{feedback.quantity > 0 && `${feedback.quantity} × `}{feedback.item.name}</p>
      <p className="cart-feedback-detail">{detail}</p>
      <div className="cart-feedback-actions">
        {feedback.kind === 'removed'
          ? <button type="button" className="cart-feedback-primary" onClick={() => {
            panelRef.current?.querySelector<HTMLButtonElement>('.cart-feedback-close')?.focus();
            undoRemoval(feedback.revision);
          }}>Undo removal</button>
          : <Link className="cart-feedback-primary" to="/cart" onClick={dismissFeedback}>View cart</Link>}
        <button type="button" className="cart-feedback-secondary" onClick={dismiss}>
          {feedback.kind === 'added' ? 'Continue shopping' : 'Dismiss'}
        </button>
      </div>
    </section>}
  </div>;
}
