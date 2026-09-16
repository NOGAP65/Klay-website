import { useEffect, useId, useRef, type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject } from 'react';

import { tokens } from '../tokens';

import './dialog.css';

function containTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return;
  const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')]
    .filter(element => element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement?.getAttribute('tabindex') === '-1')) {
    event.preventDefault(); last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first?.focus();
  }
}

/** Native modal semantics: inert background, Escape, contained focus and return to the opener. */
export function Dialog({ isOpen, title, children, onClose, closeLabel = 'Close dialog', returnFocusRef }: {
  isOpen: boolean; title: string; children: ReactNode; onClose: () => void; closeLabel?: string; returnFocusRef?: RefObject<HTMLElement>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen, returnFocusRef]);
  const style = {
    '--dialog-paper': tokens.card, '--dialog-ink': tokens.ink,
    '--dialog-muted': tokens.inkSoft, '--dialog-line': tokens.line,
    '--dialog-accent': tokens.accent, '--dialog-body': tokens.body, '--dialog-display': tokens.display,
  } as CSSProperties;
  return <dialog ref={dialogRef} className="klay-dialog" style={style} aria-labelledby={titleId}
    onKeyDown={containTab}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <header className="klay-dialog-header">
      <h2 ref={titleRef} id={titleId} tabIndex={-1}>{title}</h2>
      <button type="button" aria-label={closeLabel} onClick={onClose}>×</button>
    </header>
    <div className="klay-dialog-content">{children}</div>
  </dialog>;
}
