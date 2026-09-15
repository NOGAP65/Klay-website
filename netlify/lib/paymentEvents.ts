/** Payment state transitions, independent of Stripe transport and the database.
 * Storage failures propagate to the webhook so Stripe receives 5xx and retries. */
export interface CheckoutPayment {
  id: string;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  metadata?: Record<string, string> | null;
  client_reference_id: string | null;
  payment_intent: string | { id: string } | null;
}

export interface PaymentOrder {
  id: string;
  status: string;
  stripe_session_id: string | null;
  amount_cents: number;
  currency: string;
  name: string;
  email: string;
  quantity: number;
  blind_type: string;
  window_size: string;
}

export interface PaymentRepository {
  find: (session: CheckoutPayment) => Promise<PaymentOrder | null>;
  markPaid: (order: PaymentOrder, session: CheckoutPayment) => Promise<boolean>;
  closePending: (id: string, status: 'expired' | 'failed') => Promise<void>;
}

export async function applyCheckoutEvent(
  type: string, session: CheckoutPayment, repository: PaymentRepository,
  notify: (order: PaymentOrder) => Promise<void>,
): Promise<void> {
  const isPaid = (type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded')
    && session.payment_status === 'paid';
  const closed = type === 'checkout.session.expired' ? 'expired'
    : type === 'checkout.session.async_payment_failed' ? 'failed' : null;
  if (!isPaid && !closed) return;
  const order = await repository.find(session);
  if (!order) throw new Error(`Payment session ${session.id} has no matching order`);
  if (order.stripe_session_id && order.stripe_session_id !== session.id) {
    throw new Error(`Payment session does not match order ${order.id}`);
  }
  if (isPaid) {
    if (session.amount_total !== order.amount_cents || session.currency !== order.currency) {
      throw new Error(`Payment amount or currency does not match order ${order.id}`);
    }
    if (order.status === 'paid') return;
    if (await repository.markPaid(order, session)) await notify(order);
  } else if (closed && order.status === 'pending_payment') {
    await repository.closePending(order.id, closed);
  }
}
