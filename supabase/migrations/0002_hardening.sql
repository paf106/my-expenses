-- Restringe la función de trigger: los roles de API no deben poder invocarla directamente.
revoke execute on function public.seed_default_categories() from public, anon, authenticated;

-- Recupera ocurrencias vencidas de forma idempotente y usa la fecha local de Madrid.
create or replace function public.run_recurring()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.recurring_transactions%rowtype;
  runs integer := 0;
  catch_up integer;
  madrid_today date := (now() at time zone 'Europe/Madrid')::date;
begin
  for r in
    select *
    from public.recurring_transactions
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

      r.next_run := case r.frequency
        when 'weekly' then (r.next_run + interval '7 days')::date
        when 'monthly' then (r.next_run + interval '1 month')::date
        else (r.next_run + interval '1 year')::date
      end;
      catch_up := catch_up + 1;
      runs := runs + 1;
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
