import { Suspense, type ReactNode } from 'react';

import { useInView } from '@/shared';

/** Keep offscreen configurators out of startup. The anchor exists immediately
 * so deep links can scroll here and trigger loading before the UI is mounted. */
export function DeferredSection({ id, children }: { id: string; children: ReactNode }) {
  const { ref, hasBeenInView } = useInView<HTMLDivElement>('200px 0px');
  const placeholder = <div role="status" aria-label="Loading section" style={{ minHeight: 720 }} />;
  return <div id={id} ref={ref}>
    {hasBeenInView ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder}
  </div>;
}
