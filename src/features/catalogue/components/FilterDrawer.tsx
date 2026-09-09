import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { useMediaQuery } from '@/shared';

import { EMPTY_FACETS, facetCount, type Facets } from '../lib/facets';

import { FilterRail } from './FilterRail';

function keepFocusInDrawer(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return;
  const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')];
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

export function FilterDrawer({ isOpen, facets, query, count, onChange, onClear, onClose }: {
  isOpen: boolean; facets: Facets; query: string; count: number;
  onChange: (next: Facets) => void; onClear: () => void; onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [isClosing, setClosing] = useState(false);
  const finishClose = () => { setClosing(false); onClose(); };
  const requestClose = () => {
    if (isReduced) finishClose();
    else setClosing(true);
  };
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return <dialog ref={dialogRef} className="shop-filter-drawer" aria-labelledby="shop-filter-title" data-closing={isClosing}
    onCancel={event => { event.preventDefault(); requestClose(); }} onKeyDown={keepFocusInDrawer}
    onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === 'shop-drawer-out') finishClose(); }}
    onClick={event => { if (event.target === event.currentTarget) requestClose(); }}>
    <div className="shop-drawer-content">
      <header><h2 id="shop-filter-title">Filters</h2>
        <button autoFocus type="button" className="shop-icon-button" aria-label="Close filters" onClick={requestClose}>×</button>
      </header>
      <div className="shop-drawer-scroll">
        {query && <div className="shop-drawer-search">
          <p>Searching for “{query}”</p><button type="button" className="shop-clear" onClick={onClear}>Clear search & filters</button>
        </div>}
        <FilterRail facets={facets} query={query} onChange={onChange} />
      </div>
      <footer>
        <button type="button" className="shop-filter-button" disabled={!facetCount(facets)} onClick={() => onChange(EMPTY_FACETS)}>Reset filters</button>
        <button type="button" className="shop-primary-button" onClick={requestClose}>
          Show {count} product{count === 1 ? '' : 's'}
        </button>
      </footer>
    </div>
  </dialog>;
}
