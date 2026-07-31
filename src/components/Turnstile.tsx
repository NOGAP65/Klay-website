import { useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Cloudflare Turnstile widget — a privacy-preserving captcha alternative.
//
// If VITE_TURNSTILE_SITE_KEY is not set, the widget does not render and the
// server skips verification. This allows development without Turnstile while
// production can require it.
//
// The widget script is loaded once lazily on first mount. When the token
// changes (including on implicit refresh every ~295s), `onVerify` is called.
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT_ID = 'turnstile-script';

let scriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve) => {
    if (document.getElementById(SCRIPT_ID)) {
      scriptLoaded = true;
      resolve();
      return;
    }

    window.onTurnstileLoad = () => {
      scriptLoaded = true;
      resolve();
    };

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

export function Turnstile({ onVerify, onError, theme = 'light' }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);

  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;

  const handleVerify = useCallback((token: string) => {
    onVerifyRef.current(token);
  }, []);

  const handleError = useCallback(() => {
    onErrorRef.current?.();
  }, []);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;

    let mounted = true;

    loadScript().then(() => {
      if (!mounted || !containerRef.current || !window.turnstile) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: handleVerify,
        'error-callback': handleError,
        'expired-callback': handleError,
        theme,
        size: 'normal',
      });
    });

    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [handleVerify, handleError, theme]);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} style={{ marginTop: 20, marginBottom: 8 }} />;
}

export function useTurnstileEnabled(): boolean {
  return !!SITE_KEY;
}
