-- ---------------------------------------------------------------------------
-- Klay: quote requests, bookings and orders.
--
-- Run this once against the Supabase project (SQL Editor → paste → Run), or
-- via `supabase db push` if the CLI is set up.
--
-- SECURITY MODEL: the browser never touches these tables. Every write arrives
-- through a Netlify function holding the service-role key, so RLS is enabled
-- with *no* public policies at all — that combination denies anon/authenticated
-- outright while the service role bypasses RLS by design. A leaked anon key
-- therefore reads nothing and writes nothing here.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- --- enums -----------------------------------------------------------------
-- Guarded so re-running the migration is harmless.
do $$ begin
  create type klay_blind_type as enum ('blockout', 'sunscreen', 'lightfilter', 'dual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type klay_window_size as enum ('small', 'medium', 'large');
exception when duplicate_object then null; end $$;

do $$ begin
  create type klay_operation as enum ('manual', 'motorised');
exception when duplicate_object then null; end $$;

do $$ begin
  create type klay_request_kind as enum ('quote', 'payment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type klay_order_status as enum ('pending_payment', 'paid', 'failed', 'expired', 'refunded');
exception when duplicate_object then null; end $$;

-- --- quote_requests --------------------------------------------------------
-- Someone asking Klay to come and measure, with the configuration they built
-- in the visualiser attached. No money involved.
create table if not exists public.quote_requests (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  -- customer
  name              text not null,
  email             text not null,
  phone             text,
  address           text,
  suburb            text,
  postcode          text,
  preferred_date    date,
  notes             text,

  -- configuration as built in the visualiser
  blind_type        klay_blind_type not null,
  window_size       klay_window_size not null,
  operation         klay_operation not null,
  quantity          integer not null default 1 check (quantity between 1 and 40),
  fabric_colour     text,
  hardware_colour   text,

  -- the estimate shown at the time of asking, in cents, GST inclusive.
  -- Stored so a later price change does not silently rewrite history.
  estimate_cents    integer not null check (estimate_cents >= 0),

  -- ops
  handled           boolean not null default false,
  handled_at        timestamptz,
  internal_notes    text
);

create index if not exists quote_requests_created_at_idx
  on public.quote_requests (created_at desc);
create index if not exists quote_requests_unhandled_idx
  on public.quote_requests (created_at desc) where not handled;

-- --- orders ----------------------------------------------------------------
-- Someone paying up front. One row per Stripe Checkout session, created before
-- the redirect and settled by the webhook.
create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  status                klay_order_status not null default 'pending_payment',

  -- customer (collected on our form; Stripe may also return a billing name)
  name                  text not null,
  email                 text not null,
  phone                 text,
  address               text,
  suburb                text,
  postcode              text,
  preferred_date        date,
  notes                 text,

  -- configuration
  blind_type            klay_blind_type not null,
  window_size           klay_window_size not null,
  operation             klay_operation not null,
  quantity              integer not null default 1 check (quantity between 1 and 40),
  fabric_colour         text,
  hardware_colour       text,

  -- money, in cents, GST inclusive, as computed server-side by lib/pricing.
  -- Never accepted from the client.
  amount_cents          integer not null check (amount_cents >= 0),
  currency              text not null default 'aud',
  -- Human-readable line items priced at purchase time, so a reprint of the
  -- receipt matches what was actually charged even after a price change.
  price_breakdown       jsonb,

  -- stripe
  stripe_session_id     text unique,
  stripe_payment_intent text,
  paid_at               timestamptz,

  -- ops
  handled               boolean not null default false,
  internal_notes        text
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_session_idx on public.orders (stripe_session_id);

-- Keep updated_at honest without the application having to remember.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- --- lock it down ----------------------------------------------------------
-- Enabled with no policies: anon and authenticated get nothing. The
-- service-role key used by the Netlify functions bypasses RLS.
alter table public.quote_requests enable row level security;
alter table public.orders enable row level security;

-- Belt and braces — the anon role should not even have table grants.
revoke all on public.quote_requests from anon, authenticated;
revoke all on public.orders from anon, authenticated;
