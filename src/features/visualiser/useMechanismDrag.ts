import { useRef } from 'react';

import type { KeyboardEvent, PointerEvent } from 'react';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const keyValue = (key: string, value: number, step: number) => {
  if (key === 'Home') return 0;
  if (key === 'End') return 1;
  if (['ArrowUp', 'ArrowLeft'].includes(key)) return clamp(value - step);
  if (['ArrowDown', 'ArrowRight'].includes(key)) return clamp(value + step);
  return null;
};
/** All preview hardware uses the same straight gesture: up opens, down closes.
 * The illustration animates its mechanism without demanding a precise gesture. */
export function useMechanismDrag(value: number, change: (value: number) => void, onInteract: () => void) {
  const drag = useRef<{ pointer: number; y: number; value: number; travel: number } | null>(null);
  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (!event.isPrimary || event.button !== 0) return;
      event.preventDefault(); onInteract(); event.currentTarget.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { pointer: event.pointerId, y: event.clientY, value,
        travel: Math.max(60, event.currentTarget.getBoundingClientRect().height) };
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const start = drag.current;
      if (!start || start.pointer !== event.pointerId) return;
      const delta = (event.clientY - start.y) / start.travel;
      start.value = clamp(start.value + delta); start.y = event.clientY;
      change(start.value);
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: release,
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      const next = keyValue(event.key, value, event.shiftKey ? .1 : .02);
      if (next === null) return;
      event.preventDefault(); onInteract(); change(next);
    },
  };
}
