import { useEffect, useId, useRef, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { tokens } from '@/ds';

import { useCartStore } from '../store/cartStore';

import './cartPopover.css';

/** A compact basket anchored beneath the navigation, without leaving the product page. */
export function CartPopover({ color, isOnDarkGround = false, onOpen }: {
  color: string; isOnDarkGround?: boolean; onOpen?: () => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const location = useLocation();
  const items = useCartStore(store => store.items);
  const removeItem = useCartStore(store => store.removeItem);
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const priced = items.filter(item => !item.priceOnMeasure);
  const subtotal = priced.reduce((total, item) => total + item.price * item.quantity, 0);
  const close = () => { if (detailsRef.current) detailsRef.current.open = false; };

  useEffect(() => { close(); }, [location.key]);
  useEffect(() => {
    const dismiss = (event: PointerEvent | FocusEvent) => {
      if (!detailsRef.current?.contains(event.target as Node)) close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !detailsRef.current?.open) return;
      event.preventDefault();
      close();
      triggerRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('focusin', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('focusin', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  const style = {
    '--cart-ink': tokens.ink, '--cart-muted': tokens.inkSoft,
    '--cart-paper': tokens.paper, '--cart-line': tokens.line,
    '--cart-accent': tokens.accent, '--cart-on-accent': tokens.onAccent,
    '--cart-body': tokens.body, '--cart-display': tokens.display,
    '--cart-trigger-color': color,
    '--cart-trigger-border': isOnDarkGround ? tokens.onDarkEdge : tokens.line,
  } as CSSProperties;

  return <details ref={detailsRef} className="nav-cart" style={style}
    onToggle={event => { if (event.currentTarget.open) onOpen?.(); }}>
    <summary ref={triggerRef} className="nav-cart-trigger" aria-label={count ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart'}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && <span className="nav-cart-badge" aria-hidden="true">{count}</span>}
    </summary>
    <section className="nav-cart-panel" aria-labelledby={titleId}>
      <header>
        <h2 id={titleId}>Your cart <span>({count})</span></h2>
        <button type="button" className="nav-cart-close" aria-label="Close cart" onClick={() => {
          close(); triggerRef.current?.focus({ preventScroll: true });
        }}>×</button>
      </header>
      {items.length ? <>
        <ul className="nav-cart-items">
          {items.map(item => <li key={item.id}>
            <h3>{item.name}</h3>
            <p>{item.options?.map(option => `${option.label}: ${option.value}`).join(' · ')
              ?? `${item.fabricColour} · ${item.hardwareColour}`}</p>
            <div className="nav-cart-item-footer">
              <span>Qty {item.quantity}</span>
              <strong>{item.priceOnMeasure ? 'Price on measure' : `$${(item.price * item.quantity).toLocaleString('en-AU')}`}</strong>
              <button type="button" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id)}>Remove</button>
            </div>
          </li>)}
        </ul>
        <footer>
          {priced.length > 0 && <div className="nav-cart-subtotal"><span>Subtotal</span><strong>${subtotal.toLocaleString('en-AU')}</strong></div>}
          <p>{priced.length < items.length ? 'Made-to-measure items are quoted after measuring.' : 'Installation is confirmed at measure.'}</p>
          <Link to="/cart" className="nav-cart-action" onClick={close}>View cart</Link>
        </footer>
      </> : <div className="nav-cart-empty">
        <p>Your cart is empty.</p>
        <span>Choose your products and finishes to get started.</span>
        <Link to="/products" className="nav-cart-action" onClick={close}>Browse products</Link>
      </div>}
    </section>
  </details>;
}
