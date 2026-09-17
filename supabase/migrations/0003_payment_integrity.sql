-- ---------------------------------------------------------------------------
-- Klay: integrity constraints on the money columns.
--
-- Apply in the Supabase SQL editor after 0002. Deletes nothing and rewrites
-- nothing; every constraint is NOT VALID, so historical rows are left as they
-- are and only new writes have to satisfy them.
--
-- WHY THESE EXIST WHEN THE FUNCTIONS ALREADY CHECK. Every rule below is already
-- enforced in netlify/ — prices come from priceOrder(), the currency is a
-- literal, the webhook compares the amount before settling. That is exactly the
-- reason to also state them here. The application checks are the ones a bad
-- deploy, a refactor or a compromised function can skip; the database is the
-- layer that is still standing when the layer above it is wrong. A control that
-- exists only in the code that could be the bug is not a control.
--
-- The one thing the functions genuinely cannot do is stop themselves: they hold
-- the service-role key, which bypasses RLS. A CHECK constraint and a trigger do
-- not care who is connected.
-- ---------------------------------------------------------------------------
begin;

-- --- amounts are bounded on both sides -------------------------------------
-- The largest order the catalogue can currently produce is 40 dual blinds,
-- motorised, large, with installation: $27,600. The ceiling is set two orders
-- of magnitude above that, so it never argues with pricing or with a future
-- product line, while still catching the failures that actually happen — a
-- units mix-up charging cents as dollars, an overflow, a NaN coerced to a
-- silly integer. An order that trips this should fail loudly before Stripe is
-- asked to take the money, not after.
do $$
declare target text;
begin
  foreach target in array array['quote_requests', 'orders'] loop
    if not exists (select 1 from pg_constraint
      where conname = target || '_amount_ceiling'
      and conrelid = ('public.' || target)::regclass) then
      execute format('alter table public.%I add constraint %I check (%I between 0 and 10000000) not valid',
        target, target || '_amount_ceiling',
        case target when 'orders' then 'amount_cents' else 'estimate_cents' end);
    end if;
  end loop;
end $$;

-- --- the currency is not a free text field ---------------------------------
-- Everything the site sells is priced in GST-inclusive Australian dollars and
-- create-checkout-session hard-codes 'aud'. A row in any other currency would
-- mean the webhook's amount comparison is comparing two different units, which
-- is the shape of bug that settles an order for a hundredth of its value.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_currency_is_aud'
    and conrelid = 'public.orders'::regclass) then
    alter table public.orders add constraint orders_currency_is_aud
      check (currency = 'aud') not valid;
  end if;
end $$;

-- --- paid means paid --------------------------------------------------------
-- status and paid_at have to agree. A 'paid' row with no timestamp, or a
-- timestamp on a row that never settled, means the webhook's compare-and-set
-- did something other than what it reads like.
--
-- 'refunded' is on the settled side of this, not the unpaid side: money has to
-- have arrived before it can be sent back, so a refunded order keeps the
-- paid_at it was given. Writing this as `status = 'paid'` would have made every
-- refund impossible to record.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_paid_at_matches_status'
    and conrelid = 'public.orders'::regclass) then
    alter table public.orders add constraint orders_paid_at_matches_status
      check ((status in ('paid', 'refunded')) = (paid_at is not null)) not valid;
  end if;
end $$;

-- --- one payment intent settles one order ----------------------------------
-- stripe_session_id is already unique. The payment intent was not, which left
-- room for two order rows to claim the same actual payment — the state a replay
-- or a mis-keyed retry would produce, and the one worth being unable to reach.
-- Partial, because the column is null until the webhook fills it in.
create unique index if not exists orders_payment_intent_key
  on public.orders (stripe_payment_intent)
  where stripe_payment_intent is not null;

-- --- stripe identifiers look like stripe identifiers -------------------------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_stripe_ids_shape'
    and conrelid = 'public.orders'::regclass) then
    alter table public.orders add constraint orders_stripe_ids_shape check (
      (stripe_session_id is null or stripe_session_id ~ '^cs_[A-Za-z0-9_]{10,250}$')
      and (stripe_payment_intent is null or stripe_payment_intent ~ '^pi_[A-Za-z0-9_]{10,250}$')
    ) not valid;
  end if;
end $$;

-- --- what was charged cannot be rewritten ----------------------------------
-- THIS IS THE ONE THAT DOES NOT DEPEND ON THE APPLICATION BEING CORRECT.
-- Once an order is paid, the amount, the currency and the Stripe identifiers
-- are a record of a transaction that has already happened at a third party.
-- Nothing in this codebase has any business changing them, so the database
-- refuses — including for the service-role key the functions hold, which is
-- the whole point. Operational columns (handled, internal_notes) stay
-- editable, and a refund is a status change, not an edit to the amount.
create or replace function public.freeze_settled_order()
returns trigger language plpgsql as $$
begin
  if old.status in ('paid', 'refunded') and (
       new.amount_cents is distinct from old.amount_cents
    or new.currency is distinct from old.currency
    or new.stripe_session_id is distinct from old.stripe_session_id
    or new.stripe_payment_intent is distinct from old.stripe_payment_intent
    or new.paid_at is distinct from old.paid_at
  ) then
    raise exception 'order %: settled payment details are immutable', old.id
      using errcode = 'integrity_constraint_violation';
  end if;
  return new;
end $$;

alter function public.freeze_settled_order() set search_path = pg_catalog;
revoke all on function public.freeze_settled_order() from public, anon, authenticated;
grant execute on function public.freeze_settled_order() to service_role;

drop trigger if exists orders_freeze_settled on public.orders;
create trigger orders_freeze_settled
  before update on public.orders
  for each row execute function public.freeze_settled_order();

-- --- re-assert the lockdown -------------------------------------------------
-- Cheap, idempotent, and it means this file alone leaves the tables closed even
-- if it is ever applied to a database where 0001/0002 were partially run.
alter table public.quote_requests enable row level security;
alter table public.orders enable row level security;
revoke all on public.quote_requests, public.orders from public, anon, authenticated;

commit;
