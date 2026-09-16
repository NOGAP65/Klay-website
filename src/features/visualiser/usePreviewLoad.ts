import { useCallback, useState } from 'react';

/** Completion belongs to one selection; late work cannot clear a newer loader. */
export function usePreviewLoad(key: string) {
  const [attempt, setAttempt] = useState(0);
  const revision = `${attempt}:${key}`;
  const [completed, setCompleted] = useState({ revision: '', failed: false });
  const ready = useCallback(() => setCompleted(old => old.revision === revision && !old.failed ? old : { revision, failed: false }), [revision]);
  const fail = useCallback(() => setCompleted({ revision, failed: true }), [revision]);
  return {
    loading: completed.revision !== revision,
    failed: completed.revision === revision && completed.failed,
    delayed: completed.revision !== '' && !completed.failed,
    ready, fail, attempt, retry: () => setAttempt(value => value + 1),
  };
}
