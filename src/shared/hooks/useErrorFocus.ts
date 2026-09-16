import { useEffect, useRef } from 'react';

/** Run after validation is rendered so both the field and its error are announced together. */
export function useErrorFocus(errors: object, shouldFocus = true) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (shouldFocus && Object.keys(errors).length) {
      const input = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      input?.focus({ preventScroll: true });
      input?.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [errors, shouldFocus]);
  return formRef;
}
