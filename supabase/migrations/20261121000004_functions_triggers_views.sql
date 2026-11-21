-- ==========================================
-- PREPSPHERE MIGRATION 4: 20261121000004_functions_triggers_views.sql
-- Concern: System triggers, debit_credits stored procedure, views, and timestamp constraints
-- ==========================================

-- 1. Automatic Profile & Welcome Credits Grant on Signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));

  insert into public.usage_credits (user_id, delta, reason)
  values (new.id, 120, 'welcome_grant');  -- initial demo credits grant

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Concurrency-Safe Atomic Credit Debit
create or replace function public.debit_credits(
  p_user uuid,
  p_amount int,
  p_reason text,
  p_session uuid default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  bal int;
begin
  -- Transaction-scoped advisory lock prevents race conditions on user balance
  perform pg_advisory_xact_lock(hashtext(p_user::text));

  select coalesce(sum(delta), 0) into bal
  from public.usage_credits
  where user_id = p_user;

  if bal < p_amount then
    raise exception 'insufficient_credits';
  end if;

  insert into public.usage_credits (user_id, delta, reason, session_id)
  values (p_user, -p_amount, p_reason, p_session);

  return bal - p_amount;
end $$;

revoke all on function public.debit_credits(uuid,int,text,uuid) from public, anon, authenticated;
grant execute on function public.debit_credits(uuid,int,text,uuid) to service_role;

-- 3. Caller's Credit Balance (Security Invoker)
create or replace function public.my_credit_balance()
returns int
language sql
security invoker
stable
as $$
  select coalesce(sum(delta), 0)::int
  from public.usage_credits
  where user_id = (select auth.uid());
$$;

revoke all on function public.my_credit_balance() from public, anon;
grant execute on function public.my_credit_balance() to authenticated;

-- 4. Reject Inverted Session Timestamps
create or replace function public.check_session_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.ended_at is not null and new.started_at is not null and new.ended_at < new.started_at then
    raise exception 'ended_at cannot be earlier than started_at';
  end if;
  return new;
end $$;

drop trigger if exists trg_check_session_timestamps on public.interview_sessions;
create trigger trg_check_session_timestamps
  before insert or update on public.interview_sessions
  for each row execute function public.check_session_timestamps();

-- 5. Weekly Dimension Scores View (Security Invoker)
create or replace view public.v_dimension_weekly with (security_invoker = true) as
select
  rs.user_id,
  date_trunc('week', s.ended_at) as week_start,
  rs.dimension,
  avg(rs.score) as avg_score,
  count(*) as n
from public.rubric_scores rs
join public.interview_sessions s on s.id = rs.session_id
where s.state = 'completed' and not rs.insufficient_evidence
group by 1, 2, 3;
