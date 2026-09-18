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
const angleAt = (event: PointerEvent<HTMLDivElement>) => {
  const box = event.currentTarget.getBoundingClientRect();
  return Math.atan2(event.clientY - box.top - box.height * .575, event.clientX - box.left - box.width / 2);
};

/** Pointer capture keeps a crank or cord attached to the finger outside its
 * small illustration. Refs avoid losing the first move during a fast gesture. */
export function useMechanismDrag(value: number, change: (value: number) => void, onInteract: () => void, mode: 'crank' | 'cord' | 'tilt') {
  const drag = useRef<{ pointer: number; y: number; angle: number; value: number; travel: number } | null>(null);
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
      drag.current = { pointer: event.pointerId, y: event.clientY, angle: angleAt(event), value,
        travel: Math.max(60, event.currentTarget.getBoundingClientRect().height) };
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const start = drag.current;
      if (!start || start.pointer !== event.pointerId) return;
      const angle = angleAt(event), turn = Math.atan2(Math.sin(angle - start.angle), Math.cos(angle - start.angle));
      const delta = mode === 'crank' ? turn / (Math.PI * 4) : (event.clientY - start.y) / start.travel * (mode === 'cord' ? -1 : 1);
      start.value = clamp(start.value + delta); start.y = event.clientY; start.angle = angle;
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
