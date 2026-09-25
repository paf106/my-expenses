-- Mis Gastos: paste into Supabase SQL Editor and run once.
create extension if not exists pg_cron with schema extensions;

create type public.transaction_type as enum ('expense', 'income');
create type public.recurring_frequency as enum ('weekly', 'monthly', 'yearly');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 48),
  type public.transaction_type not null,
  icon text not null default 'circle',
  color text not null default '#7187c9' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  monthly_budget numeric(12,2) check (monthly_budget is null or monthly_budget >= 0),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name, type),
  unique (id, user_id)
);

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid,
  type public.transaction_type not null,
  amount numeric(12,2) not null check (amount > 0),
  description text not null default '' check (char_length(description) <= 160),
  frequency public.recurring_frequency not null,
  next_run date not null,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  constraint recurring_category_owner foreign key (category_id, user_id) references public.categories(id, user_id) on delete set null (category_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid,
  recurring_id uuid,
  type public.transaction_type not null,
  amount numeric(12,2) not null check (amount > 0),
  description text not null default '' check (char_length(description) <= 160),
  date date not null default current_date,
  created_at timestamptz not null default now(),
  constraint transaction_category_owner foreign key (category_id, user_id) references public.categories(id, user_id) on delete set null (category_id),
  constraint transaction_recurring_owner foreign key (recurring_id, user_id) references public.recurring_transactions(id, user_id) on delete set null (recurring_id)
);

create index transactions_user_date_idx on public.transactions (user_id, date desc, created_at desc);
create index transactions_user_category_date_idx on public.transactions (user_id, category_id, date desc);
create unique index transactions_recurring_occurrence_idx on public.transactions (recurring_id, date) where recurring_id is not null;
create index categories_user_type_idx on public.categories (user_id, type) where archived = false;
create index recurring_due_idx on public.recurring_transactions (next_run) where active = true;

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_transactions enable row level security;

create policy "Users manage their categories" on public.categories for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their transactions" on public.transactions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their recurring transactions" on public.recurring_transactions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.recurring_transactions to authenticated;

create or replace function public.seed_default_categories()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.categories (user_id, name, type, icon, color, monthly_budget) values
    (new.id, 'Vivienda', 'expense', 'house', '#7187c9', null),
    (new.id, 'Alimentación', 'expense', 'shopping-basket', '#df8559', null),
    (new.id, 'Transporte', 'expense', 'train-front', '#8171c8', null),
    (new.id, 'Ocio', 'expense', 'sparkles', '#cb7ca2', null),
    (new.id, 'Salud', 'expense', 'heart-pulse', '#5ca79a', null),
    (new.id, 'Compras', 'expense', 'shopping-bag', '#bd8f54', null),
    (new.id, 'Otros gastos', 'expense', 'circle-ellipsis', '#8993a4', null),
    (new.id, 'Nómina', 'income', 'briefcase-business', '#1f9d74', null),
    (new.id, 'Otros ingresos', 'income', 'circle-plus', '#62a7a2', null);
  return new;
end;
$$;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users for each row execute procedure public.seed_default_categories();

create or replace function public.month_summary(p_month date)
returns table (income numeric, expenses numeric, savings numeric)
language sql stable security invoker set search_path = '' as $$
  select
    coalesce(sum(amount) filter (where type = 'income'), 0)::numeric,
    coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric,
    (coalesce(sum(amount) filter (where type = 'income'), 0) - coalesce(sum(amount) filter (where type = 'expense'), 0))::numeric
  from public.transactions
  where user_id = (select auth.uid())
    and date >= date_trunc('month', p_month)::date
    and date < (date_trunc('month', p_month) + interval '1 month')::date;
$$;

create or replace function public.category_breakdown(p_from date, p_to date)
returns table (category_id uuid, category_name text, category_icon text, category_color text, total numeric, count bigint)
language sql stable security invoker set search_path = '' as $$
  select c.id, c.name, c.icon, c.color, sum(t.amount)::numeric, count(*)
  from public.transactions t
  join public.categories c on c.id = t.category_id and c.user_id = t.user_id
  where t.user_id = (select auth.uid()) and t.type = 'expense' and t.date >= p_from and t.date <= p_to
  group by c.id, c.name, c.icon, c.color order by sum(t.amount) desc;
$$;

create or replace function public.monthly_trend(p_month date default current_date, p_months integer default 6)
returns table (month date, income numeric, expenses numeric)
language sql stable security invoker set search_path = '' as $$
  with months as (
    select generate_series(date_trunc('month', p_month) - ((greatest(1, least(p_months, 24)) - 1) * interval '1 month'), date_trunc('month', p_month), interval '1 month')::date as month
  )
  select m.month,
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0)::numeric,
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0)::numeric
  from months m left join public.transactions t on t.user_id = (select auth.uid()) and t.date >= m.month and t.date < m.month + interval '1 month'
  group by m.month order by m.month;
$$;

create or replace function public.run_recurring()
returns integer language plpgsql security definer set search_path = '' as $$
declare r record; runs integer := 0;
begin
  for r in select * from public.recurring_transactions where active and next_run <= current_date and (end_date is null or end_date >= current_date) for update skip locked loop
    insert into public.transactions (user_id, category_id, recurring_id, type, amount, description, date)
      values (r.user_id, r.category_id, r.id, r.type, r.amount, r.description, r.next_run)
      on conflict do nothing;
    update public.recurring_transactions set
      next_run = case frequency when 'weekly' then (next_run + interval '7 days')::date when 'monthly' then (next_run + interval '1 month')::date else (next_run + interval '1 year')::date end,
      active = case when end_date is not null and (case frequency when 'weekly' then (next_run + interval '7 days')::date when 'monthly' then (next_run + interval '1 month')::date else (next_run + interval '1 year')::date end) > end_date then false else true end
      where id = r.id;
    runs := runs + 1;
  end loop;
  return runs;
end;
$$;

revoke all on function public.run_recurring() from public, anon, authenticated;
grant execute on function public.month_summary(date) to authenticated;
grant execute on function public.category_breakdown(date, date) to authenticated;
grant execute on function public.monthly_trend(date, integer) to authenticated;

-- Service role (cron) runs the protected function; all per-user rows are created by its own owner id.
select cron.schedule('my-expenses-recurring-daily', '5 0 * * *', $$select public.run_recurring();$$);
