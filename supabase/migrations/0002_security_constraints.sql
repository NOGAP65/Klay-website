-- Apply in Supabase SQL editor after 0001. This does not delete customer data.
-- NOT VALID permits existing historical rows; all new writes must satisfy limits.
begin;

alter table public.quote_requests enable row level security;
alter table public.orders enable row level security;
revoke all on public.quote_requests, public.orders from public, anon, authenticated;
alter function public.touch_updated_at() set search_path = pg_catalog;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
grant execute on function public.touch_updated_at() to service_role;

do $$
declare table_name text;
begin
  foreach table_name in array array['quote_requests', 'orders'] loop
    if not exists (select 1 from pg_constraint
      where conname = table_name || '_customer_bounds'
      and conrelid = ('public.' || table_name)::regclass) then
      execute format('alter table public.%I add constraint %I check (
        char_length(name) between 1 and 120 and char_length(email) between 3 and 200
        and (phone is null or char_length(phone) <= 40)
        and (address is null or char_length(address) <= 240)
        and (suburb is null or char_length(suburb) <= 120)
        and (postcode is null or postcode ~ ''^[0-9]{4}$'')
        and (notes is null or char_length(notes) <= 50000)
        and (fabric_colour is null or char_length(fabric_colour) <= 60)
        and (hardware_colour is null or char_length(hardware_colour) <= 40)
      ) not valid', table_name, table_name || '_customer_bounds');
    end if;
  end loop;
end $$;

commit;
