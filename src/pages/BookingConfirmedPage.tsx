import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens, headline, eyebrow } from '../theme';
import { formatAUD } from '../lib/pricing';

// ---------------------------------------------------------------------------
// /booking/confirmed — where Stripe sends the customer back to.
//
// Arriving here does not prove anything was paid; it is a plain URL. So rather
// than declaring success on sight, the page asks /api/order-status what the
// webhook actually recorded and reports that.
//
// The webhook usually lands within a second or two, but not always before the
// browser gets back, so `pending_payment` is polled briefly instead of being
// shown as a failure. Someone who genuinely paid should never be told they
// didn't just because a webhook was slow.
// ---------------------------------------------------------------------------

type OrderStatus = 'pending_payment' | 'paid' | 'failed' | 'expired' | 'refunded';

interface StatusResponse {
  found: boolean;
  status?: OrderStatus;
  amountCents?: number;
  quantity?: number;
}

/** How long to keep asking before settling on "we'll confirm by email". */
const POLL_ATTEMPTS = 6;
const POLL_INTERVAL_MS = 1600;

export default function BookingConfirmedPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [state, setState] = useState<'checking' | 'paid' | 'slow' | 'problem' | 'missing'>(
    sessionId ? 'checking' : 'missing',
  );
  const [amountCents, setAmountCents] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    const check = async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/order-status?session_id=${encodeURIComponent(sessionId)}`);
        if (cancelled) return;

        // 404 means no order row yet — possible if the webhook is racing us.
        const body: StatusResponse = response.ok ? await response.json() : { found: false };
        if (cancelled) return;

        if (body.found && body.status === 'paid') {
          setAmountCents(body.amountCents ?? null);
          setState('paid');
          return;
        }
        if (body.found && (body.status === 'failed' || body.status === 'expired')) {
          setState('problem');
          return;
        }
        // Still pending (or not found yet) — try again shortly.
        if (attempts < POLL_ATTEMPTS) {
          timer = window.setTimeout(check, POLL_INTERVAL_MS);
        } else {
          setState('slow');
        }
      } catch {
        if (cancelled) return;
        if (attempts < POLL_ATTEMPTS) timer = window.setTimeout(check, POLL_INTERVAL_MS);
        else setState('slow');
      }
    };

    check();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [sessionId]);

  const copy = {
    checking: {
      kicker: 'One moment',
      heading: 'Confirming your payment…',
      body: "We're just checking this through with our payment provider.",
    },
    paid: {
      kicker: 'Order confirmed',
      heading: 'Thank you — you’re booked.',
      body: `We've emailed your confirmation${
        amountCents !== null ? ` for ${formatAUD(amountCents / 100)}` : ''
      }. Someone from Klay will call within one business day to arrange your measure and install.`,
    },
    slow: {
      kicker: 'Almost there',
      heading: 'Your payment is being confirmed.',
      body: "This occasionally takes a minute. We'll email your confirmation as soon as it lands — no need to pay again, and no need to wait on this page.",
    },
    problem: {
      kicker: 'Payment not completed',
      heading: 'That payment didn’t go through.',
      body: "Nothing has been charged. You're welcome to try again, or ask us for a quote instead and we'll take it from there.",
    },
    missing: {
      kicker: 'Nothing to show',
      heading: 'No booking to confirm.',
      body: 'This page confirms an order after checkout. If you were paying and ended up here, check your email — or get in touch and we’ll sort it out.',
    },
  }[state];

  return (
    <>
      <Nav onLight />
      <main
        style={{
          background: tokens.warmWhite,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '160px 5vw 120px',
        }}
      >
        <div style={{ maxWidth: 560, textAlign: 'center' }}>
          <div style={{ width: 40, height: 1, background: tokens.fillStrong, margin: '0 auto 28px' }} />
          <p style={{ ...eyebrow, color: tokens.onDark, marginBottom: 18 }}>{copy.kicker}</p>
          <h1 style={{ ...headline.section, color: tokens.ink, marginBottom: 20 }}>{copy.heading}</h1>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 15,
              lineHeight: 1.75,
              color: tokens.inkSoft,
              margin: 0,
            }}
          >
            {copy.body}
          </p>

          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
            {state === 'problem' && (
              <Link to="/book" style={linkStyle}>
                Try again
              </Link>
            )}
            <Link to="/" style={linkStyle}>
              Back to Klay
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

const linkStyle: React.CSSProperties = {
  display: 'inline-block',
  fontFamily: tokens.body,
  fontSize: 12,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: tokens.ink,
  textDecoration: 'none',
  borderBottom: `1px solid ${tokens.line}`,
  paddingBottom: 4,
};
