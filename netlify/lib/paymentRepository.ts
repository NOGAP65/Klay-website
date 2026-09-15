import { db } from './db';
import type { PaymentOrder, PaymentRepository } from './paymentEvents';

export const paymentRepository: PaymentRepository = {
  async find(session) {
    const id = session.metadata?.order_id ?? session.client_reference_id;
    const query = db().from('orders').select('id, status, stripe_session_id, amount_cents, currency, name, email, quantity, blind_type, window_size');
    const { data, error } = await (id ? query.eq('id', id) : query.eq('stripe_session_id', session.id)).maybeSingle();
    if (error) throw error;
    return data as PaymentOrder | null;
  },
  async markPaid(order, session) {
    const intent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
    const query = db().from('orders').update({
      status: 'paid', paid_at: new Date().toISOString(),
      stripe_session_id: session.id, stripe_payment_intent: intent,
    }).eq('id', order.id).neq('status', 'paid')
      .eq('amount_cents', order.amount_cents).eq('currency', order.currency);
    // Compare-and-set: concurrent deliveries cannot both win the transition.
    const { data, error } = await (order.stripe_session_id
      ? query.eq('stripe_session_id', session.id) : query.is('stripe_session_id', null)).select('id');
    if (error) throw error;
    if (data?.length) return true;
    // A competing checkout/link update is retryable; only an already-settled
    // matching session is a successful duplicate.
    const latest = await paymentRepository.find(session);
    if (latest?.status === 'paid' && latest.stripe_session_id === session.id) return false;
    throw new Error(`Payment update for ${order.id} conflicted; retry required`);
  },
  async closePending(id, status) {
    const { error } = await db().from('orders').update({ status }).eq('id', id).eq('status', 'pending_payment');
    if (error) throw error;
  },
};
