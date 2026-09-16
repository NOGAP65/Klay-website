import { useLayoutEffect, useEffect, useRef, useState } from 'react';

import { turnstileSiteKey, isTurnstileEnabled } from '@/config';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        action: string;
        callback: (token: string) => void;
        'error-callback': () => void;
        'expired-callback': () => void;
        'timeout-callback': () => void;
        theme: 'light' | 'dark' | 'auto';
        size: 'flexible';
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_ID = 'turnstile-script';
let scriptLoadPromise: Promise<void> | null = null;

/** Share one load, but permit a fresh attempt after an offline/script failure. */
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    document.getElementById(SCRIPT_ID)?.remove();
    const script = document.createElement('script');
    const timeout = window.setTimeout(fail, 15_000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      delete window.onTurnstileLoad;
      reject(new Error('Verification could not load.'));
    }
    window.onTurnstileLoad = () => {
      window.clearTimeout(timeout);
      delete window.onTurnstileLoad;
      if (window.turnstile) resolve(); else fail();
    };
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
    script.async = true;
    script.defer = true;
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch(error => { scriptLoadPromise = null; throw error; });
  return scriptLoadPromise;
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  /** Tokens are single-use. Increment after every submission attempt. */
  resetKey?: number;
}

export function Turnstile({ onVerify, onError, theme = 'light', resetKey = 0 }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const [hasFailed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useLayoutEffect(() => { onVerifyRef.current = onVerify; onErrorRef.current = onError; }, [onVerify, onError]);

  useEffect(() => {
    const siteKey = turnstileSiteKey;
    if (!siteKey || !containerRef.current) return;
    let mounted = true;
    let widgetId: string | undefined;
    onVerifyRef.current('');
    setFailed(false);
    const unavailable = () => {
      if (!mounted) return;
      onVerifyRef.current('');
      setFailed(true);
      onErrorRef.current?.();
    };
    void loadScript().then(() => {
      if (!mounted || !containerRef.current || !window.turnstile) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action: 'customer_form',
        callback: token => { if (mounted) { setFailed(false); onVerifyRef.current(token); } },
        'error-callback': unavailable,
        'expired-callback': () => { if (mounted) onVerifyRef.current(''); },
        'timeout-callback': unavailable,
        theme, size: 'flexible',
      });
    }).catch(unavailable);
    return () => {
      mounted = false;
      if (widgetId !== undefined) window.turnstile?.remove(widgetId);
    };
  }, [theme, resetKey, retry]);

  if (!turnstileSiteKey) return null;
  return <div style={{ marginTop: 20, marginBottom: 8 }}>
    <div ref={containerRef} />
    {hasFailed && <div role="alert" style={{ marginTop: 8 }}>
      <p>Verification could not load. Check your connection and try again.</p>
      <button type="button" onClick={() => setRetry(value => value + 1)}
        style={{ minHeight: 44, padding: '0.75em 1em', background: 'Canvas', color: 'CanvasText', border: '1px solid currentColor' }}>
        Retry verification
      </button>
    </div>}
  </div>;
}

export function useTurnstileEnabled(): boolean { return isTurnstileEnabled; }
