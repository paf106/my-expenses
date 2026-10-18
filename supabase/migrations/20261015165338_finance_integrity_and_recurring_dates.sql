-- Finance integrity and recurrence date fixes. Applied migrations are left untouched.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.recurring_transactions add column if not exists anchor_date date;
-- Existing rows preserve their current next_run. Review and correct shifted dates manually,
-- updating both next_run and anchor_date in the Supabase dashboard when needed.
update public.recurring_transactions
set anchor_date = next_run
where anchor_date is null;
alter table public.recurring_transactions alter column anchor_date set not null;

create or replace function private.recurring_next_date(
  p_current date,
  p_anchor date,
  p_frequency public.recurring_frequency
)
returns date
language sql
immutable
strict
set search_path = ''
as $$
  select case p_frequency
    when 'weekly' then p_current + 7
    when 'monthly' then make_date(
      extract(year from next_month)::integer,
      extract(month from next_month)::integer,
      least(
        extract(day from p_anchor)::integer,
        extract(day from (next_month + interval '1 month - 1 day'))::integer
      )
    )
    else make_date(
      extract(year from p_current)::integer + 1,
      extract(month from p_anchor)::integer,
      least(
        extract(day from p_anchor)::integer,
        extract(day from (make_date(extract(year from p_current)::integer + 1, extract(month from p_anchor)::integer, 1) + interval '1 month - 1 day'))::integer
      )
    )
  end
  from (select (date_trunc('month', p_current)::date + interval '1 month') as next_month) as dates;
$$;
revoke all on function private.recurring_next_date(date, date, public.recurring_frequency) from public, anon, authenticated;

create or replace function private.recurring_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  madrid_today date := (now() at time zone 'Europe/Madrid')::date;
begin
  if tg_op = 'INSERT' then
    new.anchor_date := coalesce(new.anchor_date, new.next_run);
  elsif new.active and not old.active then
    new.anchor_date := coalesce(new.anchor_date, new.next_run);
    while new.next_run < madrid_today loop
      new.next_run := private.recurring_next_date(new.next_run, new.anchor_date, new.frequency);
    end loop;
    if new.end_date is not null and new.next_run > new.end_date then
      new.active := false;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.recurring_before_write() from public, anon, authenticated;
create trigger recurring_before_write
before insert or update on public.recurring_transactions
for each row execute function private.recurring_before_write();

-- Ensure newly written entries cannot pair a category with a different transaction type.
-- Existing inconsistencies are deliberately not rewritten by this migration.
create or replace function private.clear_mismatched_transaction_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.category_id is not null and not exists (
    select 1 from public.categories c
    where c.id = new.category_id and c.user_id = new.user_id and c.type = new.type
  ) then
    new.category_id := null;
  end if;
  return new;
end;
$$;
revoke all on function private.clear_mismatched_transaction_category() from public, anon, authenticated;
create trigger transaction_category_type_guard
before insert or update of category_id, type, user_id on public.transactions
for each row execute function private.clear_mismatched_transaction_category();

create or replace function private.reject_mismatched_recurring_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.category_id is not null and not exists (
    select 1 from public.categories c
    where c.id = new.category_id and c.user_id = new.user_id and c.type = new.type
  ) then
    raise exception 'Category type must match recurring transaction type' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.reject_mismatched_recurring_category() from public, anon, authenticated;
create trigger recurring_category_type_guard
before insert or update of category_id, type, user_id on public.recurring_transactions
for each row execute function private.reject_mismatched_recurring_category();

alter table public.categories
  add constraint categories_name_not_blank check (char_length(btrim(name)) between 1 and 48) not valid,
  add constraint categories_icon_length check (char_length(icon) between 1 and 32) not valid;
alter table public.transactions
  add constraint transactions_date_reasonable check (date >= date '1900-01-01') not valid;
alter table public.recurring_transactions
  add constraint recurring_date_order check (end_date is null or end_date >= next_run) not valid,
  add constraint recurring_dates_reasonable check (next_run >= date '1900-01-01' and (end_date is null or end_date >= date '1900-01-01')) not valid;

do $$
begin
  if not exists (
    select 1 from public.categories
    group by user_id, lower(btrim(name)), type
    having count(*) > 1
  ) then
    create unique index if not exists categories_user_name_type_ci_idx
      on public.categories (user_id, lower(btrim(name)), type);
  else
    raise notice 'Existing duplicate category names differ only by case or surrounding spaces; resolve them before creating categories_user_name_type_ci_idx.';
  end if;
end;
$$;

alter table public.categories add constraint categories_id_user_type_key unique (id, user_id, type);
alter table public.transactions add constraint transaction_category_type_owner
  foreign key (category_id, user_id, type)
  references public.categories (id, user_id, type)
  on delete set null (category_id) not valid;
alter table public.recurring_transactions add constraint recurring_category_type_owner
  foreign key (category_id, user_id, type)
  references public.categories (id, user_id, type)
  on delete set null (category_id) not valid;

create index if not exists recurring_user_next_run_idx
  on public.recurring_transactions (user_id, next_run);
create index if not exists recurring_category_owner_idx
  on public.recurring_transactions (category_id, user_id)
  where category_id is not null;
create index if not exists transactions_category_owner_idx
  on public.transactions (category_id, user_id)
  where category_id is not null;

alter table public.transactions alter column date
  set default ((now() at time zone 'Europe/Madrid')::date);

create or replace function public.category_breakdown(p_from date, p_to date)
returns table (category_id uuid, category_name text, category_icon text, category_color text, total numeric, count bigint)
language sql stable security invoker set search_path = '' as $$
  select c.id, coalesce(c.name, 'Sin categoría'), coalesce(c.icon, 'circle-ellipsis'), coalesce(c.color, '#8993a4'), sum(t.amount)::numeric, count(*)
  from public.transactions t
  left join public.categories c on c.id = t.category_id and c.user_id = t.user_id
  where t.user_id = (select auth.uid()) and t.type = 'expense' and t.date >= p_from and t.date <= p_to
  group by c.id, c.name, c.icon, c.color
  order by sum(t.amount) desc;
$$;

create or replace function public.run_recurring()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.recurring_transactions%rowtype;
  runs integer := 0;
  inserted integer;
  catch_up integer;
  madrid_today date := (now() at time zone 'Europe/Madrid')::date;
begin
  for r in
    select * from public.recurring_transactions
    where active and next_run <= madrid_today
    for update skip locked
  loop
    catch_up := 0;
    while r.next_run <= madrid_today
      and (r.end_date is null or r.next_run <= r.end_date)
      and catch_up < 120
    loop
      insert into public.transactions (user_id, category_id, recurring_id, type, amount, description, date)
      values (r.user_id, r.category_id, r.id, r.type, r.amount, r.description, r.next_run)
      on conflict do nothing;
      get diagnostics inserted = row_count;
      runs := runs + inserted;
      r.next_run := private.recurring_next_date(r.next_run, r.anchor_date, r.frequency);
      catch_up := catch_up + 1;
    end loop;

    update public.recurring_transactions
    set next_run = r.next_run,
        active = (r.end_date is null or r.next_run <= r.end_date)
    where id = r.id;
  end loop;

  update public.recurring_transactions
  set active = false
  where active and end_date is not null and end_date < madrid_today;
  return runs;
end;
$$;
revoke all on function public.run_recurring() from public, anon, authenticated;

revoke all on public.categories, public.transactions, public.recurring_transactions from anon;
revoke execute on function public.month_summary(date), public.category_breakdown(date, date), public.monthly_trend(date, integer) from public, anon;
grant execute on function public.month_summary(date) to authenticated;
grant execute on function public.category_breakdown(date, date) to authenticated;
grant execute on function public.monthly_trend(date, integer) to authenticated;

-- Existing rows that violate category/type or date constraints can be reviewed and
-- corrected independently; validate the NOT VALID constraints after cleanup.
